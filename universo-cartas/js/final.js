(function () {
    'use strict';

    // Canción de la vista final (carpeta song/). encodeURI maneja espacios y acentos.
    const SONG_SRC = encodeURI('song/Manuel Medrano - Quédate (Audio Oficial).mp3');
    const song = new Audio(SONG_SRC);
    song.loop = true;
    song.preload = 'auto';

    function playSong() {
        const attempt = song.play();
        if (!attempt || !attempt.catch) return;
        attempt.catch(function () {
            // El navegador bloqueó el autoplay: sonará en el primer toque, clic o tecla
            const events = ['pointerdown', 'touchstart', 'keydown'];
            const unlock = function () {
                song.play().then(function () {
                    events.forEach(function (ev) { window.removeEventListener(ev, unlock); });
                }).catch(function () { /* reintentará en el siguiente gesto */ });
            };
            events.forEach(function (ev) { window.addEventListener(ev, unlock); });
        });
    }

    const canvas = document.getElementById('final-starfield');
    const portal = document.querySelector('.moon-portal');
    const revealMoon = new URLSearchParams(window.location.search).has('reveal');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 1, 2500);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    const clock = new THREE.Clock();
    const shootingStars = [];
    let nextShootingStar = 2;
    let animationId;

    camera.position.z = 1000;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000005, 1);

    function createStarField() {
        const count = window.innerWidth < 768 ? 1800 : 4500;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const radius = 500 + Math.random() * 1200;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const offset = i * 3;
            const tint = Math.random();

            positions[offset] = radius * Math.sin(phi) * Math.cos(theta);
            positions[offset + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[offset + 2] = radius * Math.cos(phi);

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
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 1.8,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const stars = new THREE.Points(geometry, material);
        scene.add(stars);
        return stars;
    }

    const starField = createStarField();

    function spawnShootingStar() {
        if (shootingStars.length >= 3) return;

        const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
        const visibleWidth = visibleHeight * camera.aspect;
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
        const geometry = new THREE.BufferGeometry().setFromPoints([
            start,
            start.clone().sub(direction.clone().multiplyScalar(length))
        ]);
        const material = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });
        const line = new THREE.Line(geometry, material);
        scene.add(line);
        shootingStars.push({
            line,
            position: start,
            direction,
            speed: 500 + Math.random() * 350,
            length,
            life: 1,
            decay: 0.45 + Math.random() * 0.35
        });
    }

    function updateShootingStars(delta) {
        for (let i = shootingStars.length - 1; i >= 0; i--) {
            const star = shootingStars[i];
            star.position.addScaledVector(star.direction, star.speed * delta);
            star.life -= star.decay * delta;

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

    function resize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }

    function animate() {
        animationId = requestAnimationFrame(animate);
        const delta = Math.min(clock.getDelta(), 0.05);

        if (!reducedMotion) {
            starField.rotation.y += delta * 0.008;
            starField.rotation.x += delta * 0.002;
            nextShootingStar -= delta;
            if (nextShootingStar <= 0) {
                spawnShootingStar();
                nextShootingStar = 1.5 + Math.random() * 3;
            }
        }

        updateShootingStars(delta);
        renderer.render(scene, camera);
    }

    portal.addEventListener('click', function () {
        window.location.href = 'index.html?finalJourney=1';
    });
    if (revealMoon) {
        portal.classList.add('moon-portal-reveal');
        portal.addEventListener('animationend', function () {
            portal.classList.remove('moon-portal-reveal');
        }, { once: true });
    }
    window.addEventListener('resize', resize);
    window.addEventListener('pagehide', function () {
        song.pause();
        cancelAnimationFrame(animationId);
        window.removeEventListener('resize', resize);
        renderer.dispose();
        starField.geometry.dispose();
        starField.material.dispose();
    }, { once: true });

    resize();
    animate();
    playSong();
})();
