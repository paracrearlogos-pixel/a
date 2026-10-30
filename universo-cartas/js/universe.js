/**
 * universe.js — Escena Three.js interactiva del sistema solar
 * 
 * Gestiona:
 *   - Estrellas de fondo tridimensionales con parpadeo sutil
 *   - Sol central con textura local (sol.png), resplandor y luz puntual
 *   - 8 planetas orbitales con sus imágenes locales originales (Sprites de alta fidelidad)
 *   - Indicadores visuales de estado (disponible, bloqueado, descubierto)
 *   - Órbitas circulares elegantes
 *   - Estrellas fugaces ambientales
 *   - Transición cinemática de acercamiento 3D (zoom in) hacia el planeta seleccionado
 *   - Transición de alejamiento 3D (zoom out) de regreso al sistema solar
 *   - Detección precisa de clic y hover mediante Raycasting y esferas de interacción
 */

(function () {
    'use strict';

    const UC = window.UniversoCartas;

    // ========================
    // Variables del módulo
    // ========================
    let scene, camera, renderer, container;
    let sunSprite, sunGlow, sunLight, ambientLight;
    let planets = [];      // Array de { config, group, sprite, hitMesh, glowSprite, indicatorRing, angle, baseScale }
    let starField;
    let shootingStars = [];
    let raycaster, mouse;
    let isAnimating = false;
    let animationId = null;
    let isOrbiting = true;
    let orbitSpeedMultiplier = 1.0;
    let hoveredPlanet = null;
    let onPlanetClickCallback = null;
    let onPlanetHoverCallback = null;
    let clock;
    let reducedMotion = false;

    // Parámetros de cámara por defecto
    const DEFAULT_CAM_POS = new THREE.Vector3(0, 130, 175);
    const DEFAULT_CAM_TARGET = new THREE.Vector3(0, 0, 0);
    let currentCamTarget = new THREE.Vector3(0, 0, 0);

    // Estado de transición de cámara
    let isCameraTransitioning = false;
    let cameraAnim = null; // { startPos, targetPos, startTarget, targetTarget, startTime, duration, onComplete }

    // Caché de texturas precargadas
    const textureCache = {};
    let preloadPromise = null;

    /**
     * Precarga todas las texturas locales (sol y 8 planetas) en segundo plano
     * durante la animación de entrada para evitar cualquier retraso o cuadro blanco.
     */
    function preloadTextures() {
        if (preloadPromise) return preloadPromise;

        const loader = new THREE.TextureLoader();
        const targets = [{ id: 'sun', url: UC.SunConfig.image }];

        UC.PlanetsConfig.forEach(cfg => {
            const letter = UC.Letters[cfg.id];
            if (letter && letter.image) {
                targets.push({ id: cfg.id, url: letter.image });
            }
        });

        const promises = targets.map(item => {
            return new Promise(resolve => {
                if (textureCache[item.id]) {
                    resolve(textureCache[item.id]);
                    return;
                }
                loader.load(
                    item.url,
                    tex => {
                        textureCache[item.id] = tex;
                        resolve(tex);
                    },
                    undefined,
                    () => {
                        const fallback = createFallbackTexture(item.id);
                        textureCache[item.id] = fallback;
                        resolve(fallback);
                    }
                );
            });
        });

        preloadPromise = Promise.all(promises);
        return preloadPromise;
    }

    function createFallbackTexture(id) {
        if (id === 'sun') {
            return createProceduralGlowTexture('#FFB300', '#FF5722');
        }
        const cfg = UC.PlanetsMap[id];
        const col = cfg ? '#' + cfg.glowColor.toString(16).padStart(6, '0') : '#778899';
        return createProceduralPlanetTexture(col);
    }

    function loadTextureWithFallback(url, id, onLoaded) {
        if (textureCache[id]) {
            onLoaded(textureCache[id]);
            return;
        }
        const loader = new THREE.TextureLoader();
        loader.load(
            url,
            tex => {
                textureCache[id] = tex;
                onLoaded(tex);
            },
            undefined,
            () => {
                const fb = createFallbackTexture(id);
                textureCache[id] = fb;
                onLoaded(fb);
            }
        );
    }

    // ========================
    // Inicialización
    // ========================

    function init(containerEl) {
        container = containerEl;
        reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Escena
        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x000008, 0.0006);

        // Cámara
        const aspect = container.clientWidth / container.clientHeight;
        camera = new THREE.PerspectiveCamera(52, aspect, 0.1, 2500);

        // Ajuste de distancia para móviles
        if (window.innerWidth < 768) {
            DEFAULT_CAM_POS.set(0, 160, 215);
        } else {
            DEFAULT_CAM_POS.set(0, 130, 175);
        }
        camera.position.copy(DEFAULT_CAM_POS);
        currentCamTarget.copy(DEFAULT_CAM_TARGET);
        camera.lookAt(currentCamTarget);

        // Renderer
        renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000005, 1);
        container.appendChild(renderer.domElement);
        renderer.domElement.style.position = 'absolute';
        renderer.domElement.style.top = '0';
        renderer.domElement.style.left = '0';
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';

        // Iluminación
        ambientLight = new THREE.AmbientLight(0x334466, 0.6);
        scene.add(ambientLight);

        sunLight = new THREE.PointLight(0xFFEAA0, 2.5, 600, 0.5);
        sunLight.position.set(0, 0, 0);
        scene.add(sunLight);

        // Raycasting
        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2(-9999, -9999);

        clock = new THREE.Clock();

        // Construir escena
        createStarField();
        createSun();
        createOrbitLines();
        createPlanets();

        // Eventos
        window.addEventListener('resize', onResize);
        renderer.domElement.addEventListener('pointermove', onMouseMove);
        renderer.domElement.addEventListener('mousemove', onMouseMove);
        renderer.domElement.addEventListener('click', onMouseClick);
        renderer.domElement.addEventListener('touchend', onTouchEnd);
        renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: true });

        // Iniciar bucle
        isAnimating = true;
        animate();
    }

    // ========================
    // Fondo de Estrellas
    // ========================

    function createStarField() {
        const isMobile = window.innerWidth < 768;
        const starCount = isMobile ? 1800 : 4500;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);
        const twinklePhase = new Float32Array(starCount);

        for (let i = 0; i < starCount; i++) {
            const radius = 500 + Math.random() * 800;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);

            // Variedad de color estelar (blancos, azules suaves, dorados)
            const tint = Math.random();
            if (tint < 0.65) {
                colors[i * 3] = 0.95;
                colors[i * 3 + 1] = 0.95;
                colors[i * 3 + 2] = 1.0;
            } else if (tint < 0.85) {
                colors[i * 3] = 1.0;
                colors[i * 3 + 1] = 0.92;
                colors[i * 3 + 2] = 0.75;
            } else {
                colors[i * 3] = 0.75;
                colors[i * 3 + 1] = 0.85;
                colors[i * 3 + 2] = 1.0;
            }

            sizes[i] = 1.0 + Math.random() * 2.2;
            twinklePhase[i] = Math.random() * Math.PI * 2;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
            size: 1.6,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        starField = new THREE.Points(geometry, material);
        starField._twinklePhase = twinklePhase;
        starField._baseSizes = sizes.slice();
        scene.add(starField);
    }

    // ========================
    // Sol Central
    // ========================

    function createSun() {
        const sunGroup = new THREE.Group();
        scene.add(sunGroup);

        // Sprite principal del sol con imagen local
        const sunMat = new THREE.SpriteMaterial({
            color: 0xFFFFFF,
            transparent: true,
            blending: THREE.AdditiveBlending
        });

        sunSprite = new THREE.Sprite(sunMat);
        sunSprite.scale.set(UC.SunConfig.size * 2.4, UC.SunConfig.size * 2.4, 1);

        // Si ya está en caché, usar de inmediato; si no, ocultar hasta cargar para evitar cuadros blancos
        if (textureCache['sun']) {
            sunSprite.material.map = textureCache['sun'];
            sunSprite.visible = true;
        } else {
            sunSprite.visible = false;
            loadTextureWithFallback(UC.SunConfig.image, 'sun', tex => {
                sunSprite.material.map = tex;
                sunSprite.material.needsUpdate = true;
                sunSprite.visible = true;
            });
        }
        sunGroup.add(sunSprite);

        // Corona / Resplandor solar
        const glowTexture = createProceduralGlowTexture('rgba(255, 215, 80, 0.8)', 'rgba(255, 80, 0, 0)');
        const glowMaterial = new THREE.SpriteMaterial({
            map: glowTexture,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            opacity: 0.75
        });
        sunGlow = new THREE.Sprite(glowMaterial);
        sunGlow.scale.set(UC.SunConfig.glowSize * 1.5, UC.SunConfig.glowSize * 1.5, 1);
        sunGroup.add(sunGlow);
    }

    // ========================
    // Órbitas
    // ========================

    function createOrbitLines() {
        UC.PlanetsConfig.forEach(config => {
            const segments = 128;
            const points = [];
            for (let i = 0; i <= segments; i++) {
                const angle = (i / segments) * Math.PI * 2;
                points.push(new THREE.Vector3(
                    Math.cos(angle) * config.orbitalRadius,
                    0,
                    Math.sin(angle) * config.orbitalRadius
                ));
            }
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color: 0x446699,
                transparent: true,
                opacity: 0.22
            });
            const line = new THREE.LineLoop(geometry, material);
            scene.add(line);
        });
    }

    // ========================
    // Planetas (Sprites de alta fidelidad)
    // ========================

    function createPlanets() {
        UC.PlanetsConfig.forEach(config => {
            const letterData = UC.Letters[config.id];
            const imagePath = letterData ? letterData.image : '';

            // Grupo para posición orbital
            const orbitGroup = new THREE.Group();
            scene.add(orbitGroup);

            // Sprite material para conservar la imagen original
            const spriteMaterial = new THREE.SpriteMaterial({
                color: 0xFFFFFF,
                transparent: true,
                depthWrite: false
            });

            const sprite = new THREE.Sprite(spriteMaterial);
            const aspect = config.aspectRatio || 1.0;
            const baseW = config.size * 2 * aspect;
            const baseH = config.size * 2;
            sprite.scale.set(baseW, baseH, 1);

            // Si la textura ya fue precargada durante la animación de entrada,
            // asignarla de inmediato. Si no, mantenerla invisible hasta que esté lista
            // para garantizar que NUNCA aparezca un cuadro blanco en pantalla.
            if (textureCache[config.id]) {
                sprite.material.map = textureCache[config.id];
                sprite.visible = true;
            } else {
                sprite.visible = false;
                if (imagePath) {
                    loadTextureWithFallback(imagePath, config.id, tex => {
                        sprite.material.map = tex;
                        sprite.material.needsUpdate = true;
                        sprite.visible = true;
                    });
                }
            }
            orbitGroup.add(sprite);

            // Esfera transparente para raycasting y toque generoso (visible para Three.js Raycaster pero invisible al ojo)
            const hitGeometry = new THREE.SphereGeometry(config.size * 1.8, 16, 16);
            const hitMaterial = new THREE.MeshBasicMaterial({
                transparent: true,
                opacity: 0.0,
                depthWrite: false
            });
            const hitMesh = new THREE.Mesh(hitGeometry, hitMaterial);
            hitMesh.visible = true; // Imprescindible en Three.js para que el Raycaster detecte la colisión
            hitMesh.userData = { planetId: config.id, isPlanet: true };
            orbitGroup.add(hitMesh);

            // Resplandor del planeta (Sprite con gradiente)
            const glowCol = '#' + config.glowColor.toString(16).padStart(6, '0');
            const glowTex = createProceduralGlowTexture(glowCol, 'transparent');
            const glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({
                map: glowTex,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                opacity: 0.35
            }));
            glowSprite.scale.set(config.size * 3.6, config.size * 3.6, 1);
            glowSprite.visible = false;
            orbitGroup.add(glowSprite);

            // Indicador orbital de estado (anillo plano en el plano orbital X-Z)
            const ringGeom = new THREE.RingGeometry(config.size * 1.1, config.size * 1.35, 32);
            const ringMat = new THREE.MeshBasicMaterial({
                color: 0x00E676,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.6,
                blending: THREE.AdditiveBlending
            });
            const indicatorRing = new THREE.Mesh(ringGeom, ringMat);
            indicatorRing.rotation.x = Math.PI / 2;
            indicatorRing.position.y = -config.size * 0.4;
            indicatorRing.visible = false; // Solo visible cuando el planeta esté desbloqueado/descubierto
            orbitGroup.add(indicatorRing);

            const planetObj = {
                config: config,
                group: orbitGroup,
                sprite: sprite,
                hitMesh: hitMesh,
                glowSprite: glowSprite,
                indicatorRing: indicatorRing,
                angle: config.initialAngle,
                isHovered: false,
                baseScale: 1.0,
                baseW: baseW,
                baseH: baseH,
                state: 'available'
            };

            planets.push(planetObj);
        });
    }

    // ========================
    // Generadores de Texturas Procedurales (Fallbacks y Halos)
    // ========================

    function createProceduralGlowTexture(centerColor, edgeColor) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        grad.addColorStop(0, centerColor);
        grad.addColorStop(0.4, centerColor);
        grad.addColorStop(1, edgeColor || 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 128, 128);
        return new THREE.CanvasTexture(canvas);
    }

    function createProceduralPlanetTexture(hexColor) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Base planet sphere
        const grad = ctx.createRadialGradient(100, 100, 10, 128, 128, 120);
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(0.3, hexColor);
        grad.addColorStop(1, '#050510');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(128, 128, 110, 0, Math.PI * 2);
        ctx.fill();

        return new THREE.CanvasTexture(canvas);
    }

    // ========================
    // Estrellas Fugaces
    // ========================

    function spawnShootingStar() {
        if (reducedMotion || shootingStars.length > 2) return;

        const startPos = new THREE.Vector3(
            (Math.random() - 0.5) * 500,
            80 + Math.random() * 150,
            (Math.random() - 0.5) * 500
        );

        const direction = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            -0.6 - Math.random() * 0.8,
            (Math.random() - 0.5) * 2
        ).normalize();

        const speed = 4 + Math.random() * 5;
        const length = 12 + Math.random() * 20;

        const trailEnd = startPos.clone().sub(direction.clone().multiplyScalar(length));
        const geometry = new THREE.BufferGeometry().setFromPoints([startPos, trailEnd]);
        const material = new THREE.LineBasicMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });
        const line = new THREE.Line(geometry, material);
        scene.add(line);

        shootingStars.push({
            line: line,
            position: startPos.clone(),
            direction: direction,
            speed: speed,
            length: length,
            life: 1.0,
            decay: 0.015 + Math.random() * 0.02
        });
    }

    function updateShootingStars() {
        for (let i = shootingStars.length - 1; i >= 0; i--) {
            const star = shootingStars[i];
            star.position.addScaledVector(star.direction, star.speed);
            star.life -= star.decay;

            const trailEnd = star.position.clone().sub(
                star.direction.clone().multiplyScalar(star.length * star.life)
            );

            const positions = star.line.geometry.attributes.position.array;
            positions[0] = star.position.x;
            positions[1] = star.position.y;
            positions[2] = star.position.z;
            positions[3] = trailEnd.x;
            positions[4] = trailEnd.y;
            positions[5] = trailEnd.z;
            star.line.geometry.attributes.position.needsUpdate = true;
            star.line.material.opacity = Math.max(0, star.life * 0.9);

            if (star.life <= 0) {
                scene.remove(star.line);
                star.line.geometry.dispose();
                star.line.material.dispose();
                shootingStars.splice(i, 1);
            }
        }
    }

    // ========================
    // Bucle de Animación
    // ========================

    function animate() {
        if (!isAnimating) return;
        animationId = requestAnimationFrame(animate);

        const delta = clock.getDelta();
        const elapsed = clock.getElapsedTime();

        // Rotar fondo de estrellas sutilmente
        if (starField && !reducedMotion) {
            starField.rotation.y += 0.00004;

            // Parpadeo de estrellas
            const sizes = starField.geometry.attributes.size;
            const baseSizes = starField._baseSizes;
            const phases = starField._twinklePhase;
            const updateCount = Math.min(400, sizes.count);
            const offset = Math.floor(elapsed * 80) % sizes.count;
            for (let i = 0; i < updateCount; i++) {
                const idx = (offset + i) % sizes.count;
                const twinkle = Math.sin(elapsed * 1.8 + phases[idx]) * 0.35 + 0.75;
                sizes.array[idx] = baseSizes[idx] * twinkle;
            }
            sizes.needsUpdate = true;
        }

        // Animación solar
        if (sunGlow && !reducedMotion) {
            const pulse = 1.0 + Math.sin(elapsed * 0.8) * 0.06;
            sunGlow.scale.set(
                UC.SunConfig.glowSize * 1.5 * pulse,
                UC.SunConfig.glowSize * 1.5 * pulse,
                1
            );
        }

        // Movimiento orbital de planetas
        if (isOrbiting) {
            const speedMod = (reducedMotion ? 0.3 : 1.0) * orbitSpeedMultiplier;
            planets.forEach(p => {
                p.angle += p.config.orbitalSpeed * speedMod;
                const x = Math.cos(p.angle) * p.config.orbitalRadius;
                const z = Math.sin(p.angle) * p.config.orbitalRadius;
                p.group.position.set(x, 0, z);

                // Rotación y pulso sutil del indicador solo si está visible (desbloqueado)
                if (p.indicatorRing && p.indicatorRing.visible) {
                    p.indicatorRing.rotation.z += 0.01;
                    const ringPulse = 0.5 + Math.sin(elapsed * 2.5 + p.angle) * 0.2;
                    p.indicatorRing.material.opacity = ringPulse;
                }

                // Escala suave en hover
                const targetScale = p.isHovered ? 1.3 : 1.0;
                p.baseScale += (targetScale - p.baseScale) * 0.15;
                p.sprite.scale.set(p.baseW * p.baseScale, p.baseH * p.baseScale, 1);
            });
        }

        // Transición de cámara activa (zoom hacia o desde planeta)
        if (isCameraTransitioning && cameraAnim) {
            updateCameraTransition();
        }

        // Estrellas fugaces
        if (!reducedMotion && Math.random() < 0.20) {
            spawnShootingStar();
        }
        updateShootingStars();

        // Renderizar
        renderer.render(scene, camera);
    }

    // ========================
    // Transición de Cámara (Zoom 3D)
    // ========================

    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function updateCameraTransition() {
        const anim = cameraAnim;
        const now = Date.now();
        const progress = Math.min(1.0, (now - anim.startTime) / anim.duration);
        const ease = easeInOutCubic(progress);

        camera.position.lerpVectors(anim.startPos, anim.targetPos, ease);
        currentCamTarget.lerpVectors(anim.startTarget, anim.targetTarget, ease);
        camera.lookAt(currentCamTarget);

        if (progress >= 1.0) {
            isCameraTransitioning = false;
            cameraAnim = null;
            if (anim.onComplete) anim.onComplete();
        }
    }

    /**
     * Acercamiento cinemático hacia un planeta.
     */
    function zoomToPlanet(planetId, duration, onComplete) {
        const planet = planets.find(p => p.config.id === planetId);
        if (!planet) {
            if (onComplete) onComplete();
            return;
        }

        // Desacelerar órbitas gradualmente
        orbitSpeedMultiplier = 0.08;

        const planetPos = new THREE.Vector3();
        planet.group.getWorldPosition(planetPos);

        // Posición de la cámara en frente y ligeramente elevada respecto al planeta
        const dirFromSun = planetPos.clone().normalize();
        const targetCamPos = planetPos.clone()
            .add(dirFromSun.clone().multiplyScalar(planet.config.size * 3.2))
            .add(new THREE.Vector3(0, planet.config.size * 1.8, 0));

        cameraAnim = {
            startPos: camera.position.clone(),
            targetPos: targetCamPos,
            startTarget: currentCamTarget.clone(),
            targetTarget: planetPos.clone(),
            startTime: Date.now(),
            duration: duration || 2400,
            onComplete: onComplete
        };
        isCameraTransitioning = true;
    }

    /**
     * Alejamiento cinemático de regreso a la vista panorámica del sistema solar.
     */
    function zoomBackToSolarSystem(duration, onComplete) {
        cameraAnim = {
            startPos: camera.position.clone(),
            targetPos: DEFAULT_CAM_POS.clone(),
            startTarget: currentCamTarget.clone(),
            targetTarget: DEFAULT_CAM_TARGET.clone(),
            startTime: Date.now(),
            duration: duration || 2200,
            onComplete: function () {
                orbitSpeedMultiplier = 1.0;
                if (onComplete) onComplete();
            }
        };
        isCameraTransitioning = true;
    }

    // ========================
    // Interacción Mouse / Touch
    // ========================

    function updateMouse(clientX, clientY) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    }

    function getInteractiveObjects() {
        const objects = [];
        planets.forEach(p => {
            if (p.hitMesh) objects.push(p.hitMesh);
            if (p.sprite) objects.push(p.sprite);
        });
        return objects;
    }

    function checkHover() {
        if (isCameraTransitioning) return;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(getInteractiveObjects(), false);

        let newHovered = null;
        for (let i = 0; i < intersects.length; i++) {
            const hitObj = intersects[i].object;
            const planet = planets.find(p =>
                p.hitMesh === hitObj ||
                p.sprite === hitObj ||
                (hitObj.userData && hitObj.userData.planetId === p.config.id)
            );
            if (planet) {
                newHovered = planet;
                break;
            }
        }

        if (hoveredPlanet !== newHovered) {
            // Desactivar hover anterior
            if (hoveredPlanet) {
                hoveredPlanet.isHovered = false;
                hoveredPlanet.glowSprite.visible = false;
            }

            hoveredPlanet = newHovered;

            // Activar hover actual
            if (hoveredPlanet) {
                hoveredPlanet.isHovered = true;
                hoveredPlanet.glowSprite.visible = true;
                renderer.domElement.style.cursor = 'pointer';
            } else {
                renderer.domElement.style.cursor = 'default';
            }

            if (onPlanetHoverCallback) {
                onPlanetHoverCallback(hoveredPlanet ? hoveredPlanet.config.id : null);
            }
        }
    }

    function checkClick() {
        if (isCameraTransitioning) return;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(getInteractiveObjects(), false);

        for (let i = 0; i < intersects.length; i++) {
            const hitObj = intersects[i].object;
            const planet = planets.find(p =>
                p.hitMesh === hitObj ||
                p.sprite === hitObj ||
                (hitObj.userData && hitObj.userData.planetId === p.config.id)
            );
            if (planet && onPlanetClickCallback) {
                onPlanetClickCallback(planet.config.id);
                break;
            }
        }
    }

    function onMouseMove(e) {
        updateMouse(e.clientX, e.clientY);
        checkHover();
    }

    function onMouseClick(e) {
        updateMouse(e.clientX, e.clientY);
        checkClick();
    }

    function onTouchStart(e) {
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            updateMouse(touch.clientX, touch.clientY);
            checkHover();
        }
    }

    function onTouchEnd(e) {
        if (e.changedTouches && e.changedTouches.length > 0) {
            const touch = e.changedTouches[0];
            updateMouse(touch.clientX, touch.clientY);
            checkClick();
        }
    }

    function resetCameraState() {
        isCameraTransitioning = false;
        cameraAnim = null;
        orbitSpeedMultiplier = 1.0;
    }

    // ========================
    // Estados Visuales de los Planetas
    // ========================

    function updatePlanetStates(states) {
        planets.forEach(p => {
            const state = states[p.config.id] || 'locked';
            p.state = state;

            // Mantener opacidad limpia en los planetas
            p.sprite.material.opacity = 1.0;

            if (!p.indicatorRing) return;

            // Solo mostrar el aro verde cuando el planeta haya sido desbloqueado/descubierto.
            // Si no está desbloqueado, no se muestra ningún aro (ni gris ni de otro color).
            if (state === 'discovered') {
                p.indicatorRing.visible = true;
                p.indicatorRing.material.color.setHex(0x00E676);
                p.indicatorRing.material.opacity = 0.6;
            } else {
                p.indicatorRing.visible = false;
            }
        });
    }

    // ========================
    // Redimensionamiento
    // ========================

    function onResize() {
        if (!container || !camera || !renderer) return;

        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);

        // Ajustar posición base de cámara según dispositivo si no está en transición
        if (!isCameraTransitioning) {
            if (window.innerWidth < 768) {
                DEFAULT_CAM_POS.set(0, 160, 215);
            } else {
                DEFAULT_CAM_POS.set(0, 130, 175);
            }
        }
    }

    // ========================
    // API Pública
    // ========================

    function onPlanetClick(cb) { onPlanetClickCallback = cb; }
    function onPlanetHover(cb) { onPlanetHoverCallback = cb; }
    function setOrbiting(val) { isOrbiting = val; }

    function startAnimation() {
        if (!isAnimating) {
            isAnimating = true;
            clock.start();
            animate();
        }
    }

    function stopAnimation() {
        isAnimating = false;
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }

    function dispose() {
        stopAnimation();
        window.removeEventListener('resize', onResize);
        if (renderer && renderer.domElement) {
            renderer.domElement.removeEventListener('mousemove', onMouseMove);
            renderer.domElement.removeEventListener('click', onMouseClick);
            renderer.domElement.removeEventListener('touchstart', onTouchStart);
            renderer.dispose();
        }
    }

    // ========================
    // Exportar
    // ========================
    window.UniversoCartas = window.UniversoCartas || {};
    window.UniversoCartas.Universe = {
        init,
        preloadTextures,
        onPlanetClick,
        onPlanetHover,
        setOrbiting,
        updatePlanetStates,
        zoomToPlanet,
        zoomBackToSolarSystem,
        resetCameraState,
        startAnimation,
        stopAnimation,
        dispose,
        onResize,
        getCamera: () => camera,
        getScene: () => scene,
        getRenderer: () => renderer
    };

})();
