/**
 * animations.js — Animaciones de transición
 * 
 * Contiene:
 *   - Campo de estrellas de la pantalla de bienvenida (Canvas 2D)
 *   - Viaje hiperespacial (Canvas 2D con partículas 3D proyectadas)
 *   - Transición de entrada a planeta (túnel espacial)
 *   - Transición de salida de planeta
 */

(function () {
    'use strict';

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ================================================================
    // CAMPO DE ESTRELLAS DE BIENVENIDA
    // ================================================================

    let welcomeCanvas, welcomeCtx, welcomeStars = [], welcomeAnimId = null;

    function initWelcomeStarfield(canvas) {
        welcomeCanvas = canvas;
        welcomeCtx = canvas.getContext('2d');
        resizeWelcomeCanvas();

        const isMobile = window.innerWidth < 768;
        const count = isMobile ? 400 : 1000;
        welcomeStars = [];

        for (let i = 0; i < count; i++) {
            welcomeStars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 0.3,
                speed: Math.random() * 0.15 + 0.02,
                opacity: Math.random() * 0.7 + 0.3,
                twinkleSpeed: Math.random() * 0.02 + 0.005,
                twinklePhase: Math.random() * Math.PI * 2,
                layer: Math.floor(Math.random() * 3) // 0=lejano, 1=medio, 2=cercano
            });
        }

        animateWelcomeStarfield();
        window.addEventListener('resize', resizeWelcomeCanvas);
    }

    function resizeWelcomeCanvas() {
        if (!welcomeCanvas) return;
        welcomeCanvas.width = window.innerWidth;
        welcomeCanvas.height = window.innerHeight;
    }

    function animateWelcomeStarfield() {
        if (!welcomeCanvas) return;
        welcomeAnimId = requestAnimationFrame(animateWelcomeStarfield);

        const ctx = welcomeCtx;
        const w = welcomeCanvas.width;
        const h = welcomeCanvas.height;

        // Fondo con gradiente sutil
        ctx.fillStyle = '#000005';
        ctx.fillRect(0, 0, w, h);

        // Tenue nebulosa
        const now = Date.now() * 0.0001;
        const nebulaGrad = ctx.createRadialGradient(
            w * 0.3 + Math.sin(now) * 50, h * 0.6 + Math.cos(now) * 30,
            0, w * 0.3, h * 0.6, w * 0.4
        );
        nebulaGrad.addColorStop(0, 'rgba(30, 10, 60, 0.15)');
        nebulaGrad.addColorStop(0.5, 'rgba(10, 5, 40, 0.08)');
        nebulaGrad.addColorStop(1, 'rgba(0, 0, 5, 0)');
        ctx.fillStyle = nebulaGrad;
        ctx.fillRect(0, 0, w, h);

        const time = Date.now() * 0.001;

        // Dibujar estrellas
        welcomeStars.forEach(star => {
            // Movimiento sutil por capas
            const layerSpeed = (star.layer + 1) * 0.05;
            if (!reducedMotion) {
                star.x += star.speed * (star.layer + 1) * 0.3;
                star.y += Math.sin(time + star.twinklePhase) * 0.02;
            }

            // Wrap around
            if (star.x > w) star.x = 0;
            if (star.x < 0) star.x = w;

            // Parpadeo
            const twinkle = reducedMotion ? 1.0 :
                Math.sin(time * star.twinkleSpeed * 60 + star.twinklePhase) * 0.3 + 0.7;
            const alpha = star.opacity * twinkle;

            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fill();

            // Resplandor suave para estrellas grandes
            if (star.size > 1.2) {
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size * 2.5, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(200, 210, 255, ${alpha * 0.15})`;
                ctx.fill();
            }
        });
    }

    function stopWelcomeStarfield() {
        if (welcomeAnimId) {
            cancelAnimationFrame(welcomeAnimId);
            welcomeAnimId = null;
        }
        window.removeEventListener('resize', resizeWelcomeCanvas);
    }

    // ================================================================
    // VIAJE HIPERESPACIAL
    // ================================================================

    function playHyperspaceJump(canvas, onComplete) {
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;

        // Crear partículas estrellas
        const isMobile = window.innerWidth < 768;
        const particleCount = isMobile ? 300 : 800;
        const particles = [];

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: (Math.random() - 0.5) * w * 3,
                y: (Math.random() - 0.5) * h * 3,
                z: Math.random() * 2000,
                prevZ: 0,
                speed: 0,
                size: Math.random() * 2 + 0.1
            });
        }

        const duration = reducedMotion ? 2000 : 5000; // ms
        const startTime = Date.now();
        let animId = null;

        function animateHyperspace() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            ctx.fillStyle = 'rgba(0, 0, 5, 0.3)';
            ctx.fillRect(0, 0, w, h);

            // Fase de velocidad: acelera, mantiene, desacelera
            let speedMultiplier;
            if (progress < 0.2) {
                // Aceleración
                speedMultiplier = easeInCubic(progress / 0.2) * 40;
            } else if (progress < 0.7) {
                // Máxima velocidad
                speedMultiplier = 40 + Math.sin((progress - 0.2) * 6) * 5;
            } else {
                // Desaceleración
                speedMultiplier = 40 * (1 - easeInCubic((progress - 0.7) / 0.3));
            }

            // Estiramiento de estrellas basado en velocidad
            const streakLength = Math.max(1, speedMultiplier * 0.9);

            // Iluminación central que aumenta durante la velocidad máxima
            if (progress > 0.15 && progress < 0.85) {
                const centerIntensity = Math.sin((progress - 0.15) / 0.7 * Math.PI) * 0.3;
                const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.5);
                centerGrad.addColorStop(0, `rgba(150, 180, 255, ${centerIntensity})`);
                centerGrad.addColorStop(0.3, `rgba(80, 100, 200, ${centerIntensity * 0.4})`);
                centerGrad.addColorStop(1, 'rgba(0, 0, 20, 0)');
                ctx.fillStyle = centerGrad;
                ctx.fillRect(0, 0, w, h);
            }

            // Actualizar y dibujar partículas
            particles.forEach(p => {
                p.prevZ = p.z;
                p.z -= speedMultiplier * 4;

                // Reciclar partículas que salen del campo
                if (p.z <= 0) {
                    p.z = 2000;
                    p.prevZ = 2000;
                    p.x = (Math.random() - 0.5) * w * 3;
                    p.y = (Math.random() - 0.5) * h * 3;
                }

                // Proyección perspectiva
                const scale = 300 / p.z;
                const prevScale = 300 / p.prevZ;

                const sx = p.x * scale + cx;
                const sy = p.y * scale + cy;
                const prevSx = p.x * prevScale + cx;
                const prevSy = p.y * prevScale + cy;

                // Opacidad basada en distancia
                const opacity = Math.min(1, (2000 - p.z) / 1000);

                if (speedMultiplier > 3) {
                    // Modo estela: dibujar línea
                    ctx.beginPath();
                    ctx.moveTo(prevSx, prevSy);
                    ctx.lineTo(sx, sy);
                    ctx.strokeStyle = `rgba(200, 220, 255, ${opacity * 0.9})`;
                    ctx.lineWidth = p.size * scale * 0.12;
                    ctx.stroke();
                } else {
                    // Modo punto: dibujar círculo
                    const r = Math.max(0.5, p.size * scale);
                    ctx.beginPath();
                    ctx.arc(sx, sy, r, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
                    ctx.fill();
                }
            });

            // Efecto de flash blanco al final de la transición
            if (progress > 0.88 && progress < 0.98) {
                const flashIntensity = Math.sin((progress - 0.88) / 0.1 * Math.PI) * 0.05;
                ctx.fillStyle = `rgba(100, 200, 255, ${flashIntensity})`;
                ctx.fillRect(0, 0, w, h);
            }

            if (progress < 1) {
                animId = requestAnimationFrame(animateHyperspace);
            } else {
                // Limpieza final - fade a negro
                ctx.fillStyle = 'rgba(0, 0, 5, 1)';
                ctx.fillRect(0, 0, w, h);
                if (onComplete) onComplete();
            }
        }

        // Empezar con pantalla oscura
        ctx.fillStyle = '#000005';
        ctx.fillRect(0, 0, w, h);

        animateHyperspace();

        return function cancel() {
            if (animId) cancelAnimationFrame(animId);
        };
    }

    // ================================================================
    // TRANSICIÓN HACIA UN PLANETA (TÚNEL ESPACIAL)
    // ================================================================

    function playPlanetEnterTransition(canvas, planetId, onComplete) {
        const letters = window.UniversoCartas.Letters;
        const planetData = letters[planetId];
        if (!planetData) {
            if (onComplete) onComplete();
            return;
        }

        const colors = planetData.colors;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;

        // Partículas del color del planeta
        const isMobile = window.innerWidth < 768;
        const particleCount = isMobile ? 200 : 500;
        const particles = [];

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * Math.max(w, h);
            particles.push({
                angle: angle,
                radius: radius,
                z: Math.random() * 1500 + 500,
                speed: Math.random() * 3 + 1,
                size: Math.random() * 2 + 0.5,
                color: colors.particles[Math.floor(Math.random() * colors.particles.length)]
            });
        }

        const duration = reducedMotion ? 800 : 1800;
        const startTime = Date.now();
        let animId = null;

        function animateTransition() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Fondo oscuro con desvanecimiento
            ctx.fillStyle = `rgba(0, 0, 5, ${0.2 + progress * 0.1})`;
            ctx.fillRect(0, 0, w, h);

            // Efecto de túnel: anillos concéntricos del color del planeta
            const tunnelRings = 8;
            for (let i = 0; i < tunnelRings; i++) {
                const ringProgress = (progress * 3 + i / tunnelRings) % 1;
                const ringRadius = ringProgress * Math.max(w, h) * 0.8;
                const ringOpacity = (1 - ringProgress) * 0.15 * (progress < 0.5 ? progress * 2 : 1);

                ctx.beginPath();
                ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
                ctx.strokeStyle = hexToRGBA(colors.primary, ringOpacity);
                ctx.lineWidth = 2 + (1 - ringProgress) * 3;
                ctx.stroke();
            }

            // Velocidad del efecto
            const speed = easeInOutCubic(progress < 0.5 ? progress * 2 : 2 - progress * 2) * 8;

            // Partículas del túnel
            particles.forEach(p => {
                p.z -= speed * p.speed;
                if (p.z <= 0) {
                    p.z = 1500;
                    p.angle = Math.random() * Math.PI * 2;
                    p.radius = Math.random() * Math.max(w, h) * 0.5;
                }

                const scale = 200 / p.z;
                const sx = Math.cos(p.angle) * p.radius * scale + cx;
                const sy = Math.sin(p.angle) * p.radius * scale + cy;
                const opacity = Math.min(1, (1500 - p.z) / 800) * 0.8;
                const r = Math.max(0.5, p.size * scale * 2);

                ctx.beginPath();
                ctx.arc(sx, sy, r, 0, Math.PI * 2);
                ctx.fillStyle = hexToRGBA(p.color, opacity);
                ctx.fill();
            });

            // Resplandor central del color del planeta (se intensifica al final)
            const glowIntensity = easeInCubic(progress) * 0.6;
            const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.4);
            glow.addColorStop(0, hexToRGBA(colors.accent, glowIntensity));
            glow.addColorStop(0.4, hexToRGBA(colors.primary, glowIntensity * 0.4));
            glow.addColorStop(1, 'rgba(0, 0, 5, 0)');
            ctx.fillStyle = glow;
            ctx.fillRect(0, 0, w, h);

            // Flash final
            if (progress > 0.85) {
                const flashP = (progress - 0.85) / 0.15;
                ctx.fillStyle = hexToRGBA(colors.accent, flashP * 0.7);
                ctx.fillRect(0, 0, w, h);
            }

            if (progress < 1) {
                animId = requestAnimationFrame(animateTransition);
            } else {
                if (onComplete) onComplete();
            }
        }

        animateTransition();

        return function cancel() {
            if (animId) cancelAnimationFrame(animId);
        };
    }

    // ================================================================
    // TRANSICIÓN DE REGRESO AL SISTEMA SOLAR
    // ================================================================

    function playPlanetExitTransition(canvas, planetId, onComplete) {
        const letters = window.UniversoCartas.Letters;
        const planetData = letters[planetId];
        if (!planetData) {
            if (onComplete) onComplete();
            return;
        }

        const colors = planetData.colors;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;

        // Partículas que se alejan
        const isMobile = window.innerWidth < 768;
        const particleCount = isMobile ? 200 : 500;
        const particles = [];

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            particles.push({
                angle: angle,
                z: Math.random() * 100,
                maxZ: 2000,
                speed: Math.random() * 4 + 2,
                size: Math.random() * 2 + 0.5,
                radius: Math.random() * Math.max(w, h) * 0.3,
                color: colors.particles[Math.floor(Math.random() * colors.particles.length)]
            });
        }

        const duration = reducedMotion ? 800 : 1500;
        const startTime = Date.now();
        let animId = null;

        function animateExit() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Fondo: va del color del planeta al negro espacial
            const bgOpacity = 1 - progress;
            ctx.fillStyle = `rgba(0, 0, 5, ${0.3 + progress * 0.2})`;
            ctx.fillRect(0, 0, w, h);

            // Resplandor central decreciente
            const glowIntensity = (1 - progress) * 0.4;
            if (glowIntensity > 0.01) {
                const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.3);
                glow.addColorStop(0, hexToRGBA(colors.accent, glowIntensity));
                glow.addColorStop(0.5, hexToRGBA(colors.primary, glowIntensity * 0.3));
                glow.addColorStop(1, 'rgba(0, 0, 5, 0)');
                ctx.fillStyle = glow;
                ctx.fillRect(0, 0, w, h);
            }

            // Velocidad del efecto: desacelera
            const speed = easeOutCubic(1 - progress) * 6;

            // Partículas alejándose (zoom out)
            particles.forEach(p => {
                p.z += speed * p.speed;

                const scale = Math.max(0.01, 200 / p.z);
                const sx = Math.cos(p.angle) * p.radius * scale + cx;
                const sy = Math.sin(p.angle) * p.radius * scale + cy;
                const opacity = Math.max(0, 1 - p.z / p.maxZ) * 0.7;
                const r = Math.max(0.3, p.size * scale);

                if (opacity > 0.01) {
                    // A medida que avanza, las partículas se convierten en estrellas blancas
                    const whiteBlend = progress;
                    if (speed > 1 && r > 0.5) {
                        // Líneas
                        const lineLen = speed * 2;
                        ctx.beginPath();
                        ctx.moveTo(sx, sy);
                        ctx.lineTo(
                            sx + Math.cos(p.angle) * lineLen,
                            sy + Math.sin(p.angle) * lineLen
                        );
                        ctx.strokeStyle = hexToRGBA(p.color, opacity);
                        ctx.lineWidth = r * 0.5;
                        ctx.stroke();
                    } else {
                        ctx.beginPath();
                        ctx.arc(sx, sy, r, 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(255, 255, 255, ${opacity * whiteBlend + opacity * (1 - whiteBlend)})`;
                        ctx.fill();
                    }
                }
            });

            if (progress < 1) {
                animId = requestAnimationFrame(animateExit);
            } else {
                // Fade a transparente
                ctx.clearRect(0, 0, w, h);
                if (onComplete) onComplete();
            }
        }

        // Empezar con un flash del color del planeta
        ctx.fillStyle = hexToRGBA(colors.primary, 0.02);
        ctx.fillRect(0, 0, w, h);

        animateExit();

        return function cancel() {
            if (animId) cancelAnimationFrame(animId);
        };
    }

    // ================================================================
    // FONDO ANIMADO PARA LA PANTALLA DE CARTA
    // ================================================================

    let cardBgAnimId = null;

    function startCardBackground(canvas, planetId) {
        const letters = window.UniversoCartas.Letters;
        const planetData = letters[planetId];
        if (!planetData) return;

        const colors = planetData.colors;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const w = canvas.width;
        const h = canvas.height;

        // Partículas ambientales
        const isMobile = window.innerWidth < 768;
        const particleCount = isMobile ? 60 : 150;
        const particles = [];
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * w,
                y: Math.random() * h,
                size: Math.random() * 2 + 0.3,
                speedX: (Math.random() - 0.5) * 0.3,
                speedY: (Math.random() - 0.5) * 0.2 - 0.1,
                opacity: Math.random() * 0.5 + 0.1,
                color: colors.particles[Math.floor(Math.random() * colors.particles.length)]
            });
        }

        function animateCardBg() {
            cardBgAnimId = requestAnimationFrame(animateCardBg);

            // Fondo base oscuro con tinte del planeta
            ctx.fillStyle = 'rgba(0, 0, 5, 0.15)';
            ctx.fillRect(0, 0, w, h);

            // Nebulosa sutil del color del planeta
            const time = Date.now() * 0.0003;
            const nebulaX = w * 0.5 + Math.sin(time) * w * 0.1;
            const nebulaY = h * 0.4 + Math.cos(time * 0.7) * h * 0.1;
            const nebula = ctx.createRadialGradient(nebulaX, nebulaY, 0, nebulaX, nebulaY, Math.max(w, h) * 0.5);
            nebula.addColorStop(0, hexToRGBA(colors.primary, 0.06));
            nebula.addColorStop(0.5, hexToRGBA(colors.secondary, 0.03));
            nebula.addColorStop(1, 'rgba(0, 0, 5, 0)');
            ctx.fillStyle = nebula;
            ctx.fillRect(0, 0, w, h);

            // Partículas flotantes
            particles.forEach(p => {
                if (!reducedMotion) {
                    p.x += p.speedX;
                    p.y += p.speedY;
                }
                if (p.x > w) p.x = 0;
                if (p.x < 0) p.x = w;
                if (p.y > h) p.y = 0;
                if (p.y < 0) p.y = h;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = hexToRGBA(p.color, p.opacity);
                ctx.fill();
            });
        }

        // Dibujar fondo inicial
        ctx.fillStyle = '#000005';
        ctx.fillRect(0, 0, w, h);
        animateCardBg();
    }

    function stopCardBackground() {
        if (cardBgAnimId) {
            cancelAnimationFrame(cardBgAnimId);
            cardBgAnimId = null;
        }
    }

    // ================================================================
    // UTILIDADES
    // ================================================================

    function easeInCubic(t) { return t * t * t; }
    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function hexToRGBA(hex, alpha) {
        // Soporta formatos #RGB, #RRGGBB, o nombres de colores CSS
        if (!hex) return `rgba(255,255,255,${alpha})`;

        // Si es un nombre de color o rgb(), usar un canvas temporal
        if (!hex.startsWith('#')) {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 1;
            tempCanvas.height = 1;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.fillStyle = hex;
            tempCtx.fillRect(0, 0, 1, 1);
            const data = tempCtx.getImageData(0, 0, 1, 1).data;
            return `rgba(${data[0]},${data[1]},${data[2]},${alpha})`;
        }

        let r, g, b;
        if (hex.length === 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else {
            r = parseInt(hex.slice(1, 3), 16);
            g = parseInt(hex.slice(3, 5), 16);
            b = parseInt(hex.slice(5, 7), 16);
        }
        return `rgba(${r},${g},${b},${alpha})`;
    }

    // ================================================================
    // EXPORTAR
    // ================================================================
    window.UniversoCartas = window.UniversoCartas || {};
    window.UniversoCartas.Animations = {
        initWelcomeStarfield,
        stopWelcomeStarfield,
        playHyperspaceJump,
        playPlanetEnterTransition,
        playPlanetExitTransition,
        startCardBackground,
        stopCardBackground,
        hexToRGBA
    };

})();
