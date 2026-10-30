(function () {
    'use strict';

    // ==========================================
    // 1. CONFIGURACIÓN DE LA CANCIÓN
    // ==========================================

    const SONG_SRC = encodeURI(
        'song/Manuel Medrano - Quédate (Audio Oficial).mp3'
    );

    const song = new Audio(SONG_SRC);
    song.loop = true;
    song.preload = 'auto';

    // ==========================================
    // 2. ELEMENTOS DEL DOM
    // ==========================================

    const canvas = document.getElementById('final-starfield');
    const portal = document.querySelector('.moon-portal');
    const universe = document.getElementById('final-universe');

    const revealMoon = new URLSearchParams(
        window.location.search
    ).has('reveal');

    const reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
    ).matches;

    // Crear el botón musical desde JavaScript.
    const songButton = document.createElement('button');

    songButton.id = 'song-toggle';
    songButton.type = 'button';
    songButton.setAttribute('aria-pressed', 'false');
    songButton.setAttribute('aria-label', 'Reproducir canción');

    songButton.innerHTML = `
        <span class="song-icon" aria-hidden="true">♫</span>
        <span id="song-button-text">Reproducir canción</span>
    `;

    // Contenedor de la luna y el botón.
    const moonScene = document.createElement('div');
    moonScene.className = 'moon-scene';

    if (portal && universe) {
        universe.insertBefore(moonScene, portal);
        moonScene.appendChild(portal);
        moonScene.appendChild(songButton);
    }

    // ==========================================
    // 3. MENSAJE SORPRESA
    // ==========================================

    const surpriseMessage = document.createElement('div');

    surpriseMessage.id = 'surprise-message';
    surpriseMessage.textContent = 'Mandame una fotito en tanga 🔥';
    surpriseMessage.setAttribute('aria-hidden', 'true');

    if (universe) {
        universe.insertBefore(surpriseMessage, moonScene);
    }

    // ==========================================
    // 4. CONTADOR DE REPRODUCCIÓN
    // ==========================================

    const SURPRISE_DELAY_MS = 15 * 1000;//2 * 60 * 1000;

    let musicElapsedMs = 0;
    let musicTimerStartedAt = null;
    let musicTimerInterval = null;
    let surpriseMessageShown = false;

    function stopMusicTimer() {
        if (musicTimerStartedAt !== null) {
            musicElapsedMs += Date.now() - musicTimerStartedAt;
            musicTimerStartedAt = null;
        }

        if (musicTimerInterval !== null) {
            clearInterval(musicTimerInterval);
            musicTimerInterval = null;
        }
    }

    function startMusicTimer() {
        if (
            surpriseMessageShown ||
            musicTimerStartedAt !== null
        ) {
            return;
        }

        musicTimerStartedAt = Date.now();

        musicTimerInterval = setInterval(function () {
            const elapsed = musicElapsedMs +
                (Date.now() - musicTimerStartedAt);

            if (elapsed >= SURPRISE_DELAY_MS) {
                stopMusicTimer();

                surpriseMessageShown = true;

                // Reiniciar la animación.
                surpriseMessage.classList.remove(
                    'show-surprise-message'
                );

                void surpriseMessage.offsetWidth;

                surpriseMessage.classList.add(
                    'show-surprise-message'
                );
            }
        }, 100);
    }

    const songButtonText = songButton.querySelector(
        '#song-button-text'
    );

    // ==========================================
    // 5. ANALIZADOR DE AUDIO
    // ==========================================

    let audioContext = null;
    let analyser = null;
    let frequencyData = null;
    let audioSource = null;

    let audioLevel = 0;
    let smoothedLevel = 0;

    function setupAudioAnalyzer() {
        if (audioContext) return;

        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) {
            throw new Error(
                'Este navegador no admite Web Audio API.'
            );
        }

        audioContext = new AudioContextClass();

        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.78;

        frequencyData = new Uint8Array(
            analyser.frequencyBinCount
        );

        audioSource =
            audioContext.createMediaElementSource(song);

        audioSource.connect(analyser);
        analyser.connect(audioContext.destination);
    }

    function updateSongButton(isPlaying) {
        songButton.setAttribute(
            'aria-pressed',
            String(isPlaying)
        );

        songButton.setAttribute(
            'aria-label',
            isPlaying ? 'Pausar canción' : 'Reproducir canción'
        );

        songButtonText.textContent = isPlaying
            ? 'Pausar canción'
            : 'Reproducir canción';

        songButton.classList.toggle(
            'is-playing',
            isPlaying
        );
    }

    songButton.addEventListener('click', async function () {
        try {
            if (song.paused) {
                setupAudioAnalyzer();

                if (audioContext.state === 'suspended') {
                    await audioContext.resume();
                }

                await song.play();

                updateSongButton(true);
            } else {
                song.pause();

                updateSongButton(false);
            }
        } catch (error) {
            console.error(
                'No se pudo reproducir la canción:',
                error
            );

            songButtonText.textContent =
                'Toca para intentar de nuevo';
        }
    });

    song.addEventListener('play', function () {
        updateSongButton(true);
        startMusicTimer();
    });

    song.addEventListener('pause', function () {
        updateSongButton(false);
        stopMusicTimer();
    });

    song.addEventListener('ended', function () {
        updateSongButton(false);
    });

    // ==========================================
    // 6. ESCENA THREE.JS
    // ==========================================

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
        60,
        1,
        1,
        2500
    );

    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: false
    });

    const clock = new THREE.Clock();
    const shootingStars = [];

    let nextShootingStar = 2;
    let animationId = null;
    let disposed = false;

    camera.position.z = 1000;

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio || 1, 2)
    );

    renderer.setClearColor(0x000005, 1);

    // ==========================================
    // 7. CREACIÓN DEL CAMPO ESTELAR
    // ==========================================

    function createStarField() {
        const count = window.innerWidth < 768
            ? 1800
            : 4500;

        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const radius = 500 + Math.random() * 1200;
            const theta = Math.random() * Math.PI * 2;

            const phi = Math.acos(
                2 * Math.random() - 1
            );

            const offset = i * 3;
            const tint = Math.random();

            positions[offset] =
                radius * Math.sin(phi) * Math.cos(theta);

            positions[offset + 1] =
                radius * Math.sin(phi) * Math.sin(theta);

            positions[offset + 2] =
                radius * Math.cos(phi);

            if (tint < 0.65) {
                colors[offset] = 0.95;
                colors[offset + 1] = 0.95;
                colors[offset + 2] = 1;
            } else if (tint < 0.85) {
                colors[offset] = 1;
                colors[offset + 1] = 0.92;
                colors[offset + 2] = 0.75;
            } else {
                colors[offset] = 0.75;
                colors[offset + 1] = 0.85;
                colors[offset + 2] = 1;
            }
        }

        const geometry = new THREE.BufferGeometry();

        geometry.setAttribute(
            'position',
            new THREE.BufferAttribute(positions, 3)
        );

        geometry.setAttribute(
            'color',
            new THREE.BufferAttribute(colors, 3)
        );

        const material = new THREE.PointsMaterial({
            size: 1.8,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const stars = new THREE.Points(
            geometry,
            material
        );

        scene.add(stars);

        return stars;
    }

    const starField = createStarField();

    // ==========================================
    // 8. ESTRELLAS FUGACES
    // ==========================================

    function spawnShootingStar() {
        if (shootingStars.length >= 3) return;

        const visibleHeight =
            2 *
            Math.tan(
                THREE.MathUtils.degToRad(camera.fov / 2)
            ) *
            camera.position.z;

        const visibleWidth =
            visibleHeight * camera.aspect;

        const start = new THREE.Vector3(
            (Math.random() - 0.5) * visibleWidth,
            visibleHeight / 2 + 20,
            0
        );

        const direction = new THREE.Vector3(
            (Math.random() - 0.5) * 1.2,
            -0.7 - Math.random() * 0.6,
            0
        ).normalize();

        const length = 35 + Math.random() * 45;

        const geometry = new THREE.BufferGeometry()
            .setFromPoints([
                start,
                start.clone().sub(
                    direction.clone().multiplyScalar(length)
                )
            ]);

        const material = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });

        const line = new THREE.Line(
            geometry,
            material
        );

        scene.add(line);

        shootingStars.push({
            line: line,
            position: start,
            direction: direction,
            speed: 500 + Math.random() * 350,
            length: length,
            life: 1,
            decay: 0.45 + Math.random() * 0.35
        });
    }

    function updateShootingStars(delta) {
        for (
            let i = shootingStars.length - 1;
            i >= 0;
            i--
        ) {
            const star = shootingStars[i];

            star.position.addScaledVector(
                star.direction,
                star.speed * delta
            );

            star.life -= star.decay * delta;

            const trailEnd = star.position.clone().sub(
                star.direction.clone().multiplyScalar(
                    star.length * Math.max(0, star.life)
                )
            );

            const positions =
                star.line.geometry.attributes.position.array;

            positions[0] = star.position.x;
            positions[1] = star.position.y;
            positions[2] = star.position.z;

            positions[3] = trailEnd.x;
            positions[4] = trailEnd.y;
            positions[5] = trailEnd.z;

            star.line.geometry.attributes.position
                .needsUpdate = true;

            star.line.material.opacity = Math.max(
                0,
                star.life * 0.9
            );

            if (star.life <= 0) {
                scene.remove(star.line);

                star.line.geometry.dispose();
                star.line.material.dispose();

                shootingStars.splice(i, 1);
            }
        }
    }

    // ==========================================
    // 9. RESPLANDOR SINCRONIZADO CON LA MÚSICA
    // ==========================================

    function updateMoonGlow(delta) {
        audioLevel = 0;

        if (
            analyser &&
            frequencyData &&
            !song.paused &&
            !song.ended
        ) {
            analyser.getByteFrequencyData(frequencyData);

            // Intensidad de frecuencias graves.
            const bassEnd = Math.max(
                1,
                Math.floor(frequencyData.length * 0.20)
            );

            let bassSum = 0;

            for (let i = 0; i < bassEnd; i++) {
                bassSum += frequencyData[i];
            }

            const bassLevel =
                bassSum / bassEnd / 255;

            // Intensidad general del espectro.
            let totalSum = 0;

            for (
                let i = 0;
                i < frequencyData.length;
                i++
            ) {
                totalSum += frequencyData[i];
            }

            const overallLevel =
                totalSum / frequencyData.length / 255;

            audioLevel = Math.min(
                1,
                bassLevel * 0.65 +
                overallLevel * 0.65
            );
        }

        // Suaviza las transiciones visuales.
        const smoothing = 1 - Math.exp(-delta * 9);

        smoothedLevel +=
            (audioLevel - smoothedLevel) * smoothing;

        if (portal) {
            portal.style.setProperty(
                '--audio-level',
                smoothedLevel.toFixed(3)
            );

            portal.classList.toggle(
                'music-active',
                Boolean(
                    analyser &&
                    !song.paused &&
                    !song.ended
                )
            );
        }
    }

    // ==========================================
    // 10. REDIMENSIONAMIENTO
    // ==========================================

    function resize() {
        if (disposed) return;

        const width = window.innerWidth;
        const height = window.innerHeight;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize(width, height);
    }

    // ==========================================
    // 11. ANIMACIÓN PRINCIPAL
    // ==========================================

    function animate() {
        if (disposed) return;

        animationId = requestAnimationFrame(animate);

        const delta = Math.min(
            clock.getDelta(),
            0.05
        );

        if (!reducedMotion) {
            starField.rotation.y += delta * 0.008;
            starField.rotation.x += delta * 0.002;

            nextShootingStar -= delta;

            if (nextShootingStar <= 0) {
                spawnShootingStar();

                nextShootingStar =
                    1.5 + Math.random() * 3;
            }
        }

        updateShootingStars(delta);
        updateMoonGlow(delta);

        renderer.render(scene, camera);
    }

    // ==========================================
    // 12. INTERACCIÓN CON LA LUNA
    // ==========================================

    if (portal) {
        portal.addEventListener('click', function () {
            window.location.href =
                'index.html?finalJourney=1';
        });

        if (revealMoon) {
            portal.classList.add('moon-portal-reveal');

            portal.addEventListener(
                'animationend',
                function () {
                    portal.classList.remove(
                        'moon-portal-reveal'
                    );
                },
                { once: true }
            );
        }
    }

    // ==========================================
    // 13. LIMPIEZA DE RECURSOS
    // ==========================================

    window.addEventListener(
        'pagehide',
        function () {
            disposed = true;

            stopMusicTimer();
            song.pause();

            if (animationId !== null) {
                cancelAnimationFrame(animationId);
            }

            window.removeEventListener('resize', resize);

            shootingStars.forEach(function (star) {
                scene.remove(star.line);
                star.line.geometry.dispose();
                star.line.material.dispose();
            });

            shootingStars.length = 0;

            starField.geometry.dispose();
            starField.material.dispose();

            renderer.dispose();

            if (audioSource) {
                audioSource.disconnect();
            }

            if (analyser) {
                analyser.disconnect();
            }

            if (
                audioContext &&
                audioContext.state !== 'closed'
            ) {
                audioContext.close().catch(function () { });
            }
        },
        { once: true }
    );

    // ==========================================
    // 14. INICIO
    // ==========================================

    resize();
    animate();

    // La canción no se reproduce automáticamente.
})();