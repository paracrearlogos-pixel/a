/**
 * main.js — Orquestador principal de la aplicación Universo de Cartas
 * 
 * Gestiona:
 *   - Máquina de estados (WELCOME → HYPERSPACE → SOLAR_SYSTEM ↔ PLANET_CARD)
 *   - Interfaz de usuario (contador, progreso, tooltip, leyenda)
 *   - Conexión con Universe (Three.js) y Animations (Canvas 2D)
 *   - Transición espacial 3D sincronizada con túnel hiperespacial
 *   - Temporizador en tiempo real persistente
 *   - Prevención de clics múltiples durante transiciones
 */

(function () {
    'use strict';

    // ========================
    // Dependencias
    // ========================
    const Storage = window.UniversoCartas.Storage;
    const Letters = window.UniversoCartas.Letters;
    const LettersData = window.UniversoCartas.LettersData;
    const Animations = window.UniversoCartas.Animations;
    const Universe = window.UniversoCartas.Universe;

    // ========================
    // Estados de la aplicación
    // ========================
    const STATES = {
        WELCOME: 'welcome',
        HYPERSPACE: 'hyperspace',
        SOLAR_SYSTEM: 'solar_system',
        PLANET_ENTER: 'planet_enter',
        PLANET_CARD: 'planet_card',
        PLANET_EXIT: 'planet_exit'
    };

    let currentState = STATES.WELCOME;
    let currentPlanetId = null;
    let isTransitioning = false;
    let countdownInterval = null;

    // ========================
    // Elementos del DOM
    // ========================
    const $ = id => document.getElementById(id);
    const enteredFromFinal = new URLSearchParams(window.location.search).has('finalJourney');
    let revealFinalOnCompletion = false;

    let welcomeScreen, startButton, welcomeCanvas;
    let transitionCanvas;
    let solarSystemContainer, threeContainer;
    let uiTitle, uiProgress, uiCountdown, uiLegend;
    let planetTooltip;
    let planetCardScreen, cardBgCanvas;
    let cardPlanetImg, cardPlanetName, cardSubtitle, cardTitle, cardMessage, cardReturnBtn;
    let lockedModal;

    // ========================
    // Inicialización
    // ========================

    function init() {
        // Cachear elementos
        welcomeScreen = $('welcome-screen');
        startButton = $('start-button');
        welcomeCanvas = $('welcome-canvas');
        transitionCanvas = $('transition-canvas');
        solarSystemContainer = $('solar-system');
        threeContainer = $('three-container');
        uiTitle = $('ui-title');
        uiProgress = $('ui-progress');
        uiCountdown = $('ui-countdown');
        uiLegend = $('ui-legend');
        planetTooltip = $('planet-tooltip');
        planetCardScreen = $('planet-card-screen');
        cardBgCanvas = $('card-bg-canvas');
        cardPlanetImg = $('card-planet-img');
        cardPlanetName = $('card-planet-name');
        cardSubtitle = $('card-subtitle');
        cardTitle = $('card-title');
        cardMessage = $('card-message');
        cardReturnBtn = $('card-return-btn');
        lockedModal = $('locked-modal');

        if (enteredFromFinal) {
            Storage.unlockAll();
        }

        // Mostrar pantalla de bienvenida
        showWelcomeScreen();

        // Iniciar precarga de texturas en segundo plano desde el primer momento
        Universe.preloadTextures();

        // Evento botón Iniciar Viaje
        startButton.addEventListener('click', onStartJourney);
        startButton.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onStartJourney();
            }
        });

        // Evento botón Regresar
        cardReturnBtn.addEventListener('click', onReturnToUniverse);
        cardReturnBtn.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onReturnToUniverse();
            }
        });

        // Cerrar modal de bloqueo
        const lockedCloseBtn = $('locked-close-btn');

        // Teclado: Escape
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                if (currentState === STATES.PLANET_CARD && !isTransitioning) {
                    onReturnToUniverse();
                }
                if (lockedModal && !lockedModal.classList.contains('hidden')) {
                    lockedModal.classList.add('hidden');
                    lockedModal.setAttribute('aria-hidden', 'true');
                }
            }
        });

        // Mensaje de consola informativo
        console.log(
            '%c✦ UNIVERSO DE CARTAS ✦\n' +
            'Sistema solar listo. Regla de desbloqueo activa: 1 carta cada 24 horas.\n' +
            'Herramientas opcionales de desarrollo en consola:\n' +
            '  - UniversoCartas.Storage.setCountdownDisabled(true)  : Desactivar contador para pruebas\n' +
            '  - UniversoCartas.Storage.setCountdownDisabled(false) : Reactivar contador de 24 horas\n' +
            '  - UniversoCartas.Storage.advanceTime(24)             : Adelantar 24 horas\n' +
            '  - UniversoCartas.Storage.unlockAll()                 : Desbloquear las 8 cartas de inmediato\n' +
            '  - UniversoCartas.Storage.resetProgress()             : Reiniciar progreso a cero',
            'color: #6e8efb; font-size: 13px; font-weight: bold;'
        );

        if (enteredFromFinal) {
            onStartJourney();
        }
    }

    // ========================
    // Pantalla de Bienvenida
    // ========================

    function showWelcomeScreen() {
        currentState = STATES.WELCOME;
        welcomeScreen.classList.remove('hidden');
        solarSystemContainer.classList.add('hidden');
        planetCardScreen.classList.add('hidden');
        transitionCanvas.classList.add('hidden');

        Animations.initWelcomeStarfield(welcomeCanvas);
        setTimeout(() => startButton.focus(), 300);
    }

    // ========================
    // Viaje Hiperespacial Inicial
    // ========================

    function onStartJourney() {
        if (currentState !== STATES.WELCOME || isTransitioning) return;
        isTransitioning = true;
        currentState = STATES.HYPERSPACE;

        // Asegurar que la precarga de texturas esté activa
        Universe.preloadTextures();

        Animations.stopWelcomeStarfield();
        welcomeScreen.classList.add('fading-out');

        setTimeout(() => {
            welcomeScreen.classList.add('hidden');
            welcomeScreen.classList.remove('fading-out');

            // Preparar el sistema solar en segundo plano debajo del lienzo de transición
            // para que todas las texturas e imágenes de planetas estén 100% cargadas durante el viaje
            solarSystemContainer.classList.remove('hidden');
            if (!threeContainer.querySelector('canvas')) {
                Universe.init(threeContainer);
                Universe.onPlanetClick(onPlanetClicked);
                Universe.onPlanetHover(onPlanetHovered);
            }

            transitionCanvas.classList.remove('hidden');

            Animations.playHyperspaceJump(transitionCanvas, () => {
                transitionCanvas.classList.add('hidden');
                showSolarSystem();
                isTransitioning = false;
            });
        }, 550);
    }

    // ========================
    // Escena del Sistema Solar
    // ========================

    function showSolarSystem() {
        currentState = STATES.SOLAR_SYSTEM;
        isTransitioning = false;
        solarSystemContainer.classList.remove('hidden');
        solarSystemContainer.classList.remove('fading-out');
        planetCardScreen.classList.add('hidden');

        if (!threeContainer.querySelector('canvas')) {
            Universe.init(threeContainer);
            Universe.onPlanetClick(onPlanetClicked);
            Universe.onPlanetHover(onPlanetHovered);
        } else {
            Universe.resetCameraState();
            Universe.startAnimation();
            Universe.setOrbiting(true);
        }
        Universe.onResize();

        updateSolarSystemUI();
        startCountdown();
    }

    // ========================
    // Interacción con Planetas
    // ========================

    function onPlanetHovered(planetId) {
        if (currentState !== STATES.SOLAR_SYSTEM || isTransitioning) return;

        if (planetId) {
            const config = window.UniversoCartas.PlanetsMap[planetId];
            const state = Storage.getPlanetState(planetId);
            const name = config ? config.name : planetId;

            let label = name;
            if (state === 'locked') {
                const remaining = Storage.getTimeRemaining();
                const formatted = Storage.formatTimeRemaining(remaining);
                label = `🔒 ${name} (Bloqueado — ${formatted})`;
            } else if (state === 'discovered') {
                label = `✓ ${name} (Descubierto — Clic para releer)`;
            } else {
                label = `✦ ${name} (Disponible para descubrir)`;
            }

            planetTooltip.textContent = label;
            planetTooltip.classList.remove('hidden');
        } else {
            planetTooltip.classList.add('hidden');
        }
    }

    function onPlanetClicked(planetId) {
        if (currentState !== STATES.SOLAR_SYSTEM || isTransitioning) return;

        const state = Storage.getPlanetState(planetId);

        switch (state) {
            case 'available':
                // Descubrir carta nueva
                const success = Storage.discoverPlanet(planetId);
                if (success) {
                    revealFinalOnCompletion = Storage.getProgressSummary().allDiscovered;
                    travelToPlanet(planetId);
                }
                break;

            case 'discovered':
                // Releer carta ya descubierta (no reinicia contador)
                travelToPlanet(planetId);
                break;

            case 'locked':
                // Notificación visual de bloqueo
                showLockedMessage(planetId);
                break;
        }
    }

    function showLockedMessage(planetId) {
        const remaining = Storage.getTimeRemaining();
        const formatted = Storage.formatTimeRemaining(remaining);
        const config = window.UniversoCartas.PlanetsMap[planetId];
        const name = config ? config.name : planetId;

        const lockedText = $('locked-text');
        if (lockedText) {
            lockedText.textContent = `${name} aún no está disponible. Podrás abrir una nueva carta en: ${formatted}`;
        }
        lockedModal.classList.remove('hidden');
        lockedModal.setAttribute('aria-hidden', 'false');

        setTimeout(() => {
            if (!lockedModal.classList.contains('hidden')) {
                lockedModal.classList.add('hidden');
                lockedModal.setAttribute('aria-hidden', 'true');
            }
        }, 3200);
    }

    // ========================
    // Viaje hacia un Planeta (Zoom 3D + Túnel)
    // ========================

    function travelToPlanet(planetId) {
        if (isTransitioning) return;
        isTransitioning = true;
        currentState = STATES.PLANET_ENTER;
        currentPlanetId = planetId;

        planetTooltip.classList.add('hidden');

        // Desvanecer interfaces secundarias del sistema solar
        solarSystemContainer.classList.add('fading-out');

        // Mostrar canvas de túnel espacial sobre el sistema solar
        transitionCanvas.classList.remove('hidden');

        // Ejecutar zoom 3D de cámara hacia el planeta
        Universe.zoomToPlanet(planetId, 2800);

        // Ejecutar simultáneamente el túnel espacial con la paleta del planeta
        Animations.playPlanetEnterTransition(transitionCanvas, planetId, () => {
            solarSystemContainer.classList.add('hidden');
            solarSystemContainer.classList.remove('fading-out');
            transitionCanvas.classList.add('hidden');

            showPlanetCard(planetId);
            isTransitioning = false;
        });
    }

    // ========================
    // Pantalla Interior de la Carta
    // ========================

    function showPlanetCard(planetId) {
        currentState = STATES.PLANET_CARD;
        const letter = Letters[planetId];
        if (!letter) return;

        // Imagen decorativa del planeta
        if (cardPlanetImg) {
            cardPlanetImg.src = letter.image;
            cardPlanetImg.alt = letter.name;
        }

        // Títulos y subtítulos
        cardPlanetName.textContent = letter.name;
        cardSubtitle.textContent = letter.subtitle;
        cardTitle.textContent = letter.cardTitle;

        // Contenido con párrafos
        cardMessage.innerHTML = '';
        letter.message.split('\n').forEach(line => {
            if (line.trim() === '') {
                cardMessage.appendChild(document.createElement('br'));
            } else {
                const p = document.createElement('p');
                p.textContent = line;
                cardMessage.appendChild(p);
            }
        });

        // Aplicar colores y resplandores personalizados
        const colors = letter.colors;
        cardPlanetName.style.color = colors.primary;
        planetCardScreen.style.setProperty('--planet-primary', colors.primary);
        planetCardScreen.style.setProperty('--planet-secondary', colors.secondary);
        planetCardScreen.style.setProperty('--planet-accent', colors.accent);
        planetCardScreen.style.setProperty('--planet-glow', colors.glow);

        planetCardScreen.classList.remove('hidden');

        // Fondo ambiental dinámico de la carta
        Animations.startCardBackground(cardBgCanvas, planetId);

        setTimeout(() => cardReturnBtn.focus(), 400);
    }

    // ========================
    // Regreso al Sistema Solar (Zoom Out + Estelas)
    // ========================

    function onReturnToUniverse() {
        if (currentState !== STATES.PLANET_CARD || isTransitioning) return;
        isTransitioning = true;
        currentState = STATES.PLANET_EXIT;

        Animations.stopCardBackground();
        planetCardScreen.classList.add('fading-out');

        transitionCanvas.classList.remove('hidden');

        // Reanudar el sistema solar antes del zoom out
        solarSystemContainer.classList.add('hidden');

        setTimeout(() => {
            planetCardScreen.classList.add('hidden');
            planetCardScreen.classList.remove('fading-out');

            // Zoom out 3D de cámara hacia la vista global
            Universe.zoomBackToSolarSystem(2400);

            // Túnel inverso / estelas hacia estrellas
            Animations.playPlanetExitTransition(transitionCanvas, currentPlanetId, () => {
                transitionCanvas.classList.add('hidden');
                currentPlanetId = null;

                showSolarSystem();
                isTransitioning = false;
            });
        }, 350);
    }

    // ========================
    // Actualización de Interfaz
    // ========================

    function updateSolarSystemUI() {
        const summary = Storage.getProgressSummary();

        // Progreso de cartas
        uiProgress.textContent = `Cartas descubiertas: ${summary.discoveredCount} / ${summary.totalPlanets}`;

        // Contador
        updateCountdownDisplay(summary);

        // Indicadores 3D en planetas
        const states = {};
        LettersData.forEach(l => {
            states[l.id] = Storage.getPlanetState(l.id);
        });
        Universe.updatePlanetStates(states);

        if (summary.allDiscovered) {
            uiCountdown.classList.add('hidden');
            if (!enteredFromFinal) {
                const finalUrl = revealFinalOnCompletion ? 'final.html?reveal=1' : 'final.html';
                window.location.replace(finalUrl);
            }
        } else {
            uiCountdown.classList.remove('hidden');
        }
    }

    function updateCountdownDisplay(summary) {
        if (!summary) summary = Storage.getProgressSummary();

        if (summary.allDiscovered) {
            uiCountdown.classList.add('hidden');
            return;
        }

        // Si el contador está desactivado para pruebas
        if (Storage.isCountdownDisabled()) {
            if (summary.discoveredCount === 0) {
                uiCountdown.innerHTML = '<span class="countdown-label countdown-ready">✦ Modo prueba: Elige cualquier planeta ✦</span>';
            } else {
                uiCountdown.innerHTML = `<span class="countdown-label countdown-ready">✦ Modo prueba: Planetas disponibles (${summary.discoveredCount}/8) ✦</span>`;
            }
            return;
        }

        if (summary.discoveredCount === 0) {
            uiCountdown.innerHTML = '<span class="countdown-label">Tu primera carta está esperando.</span>';
        } else if (summary.canDiscoverNew) {
            uiCountdown.innerHTML = '<span class="countdown-label countdown-ready">✦ ¡Una nueva carta está disponible! ✦</span>';
        } else {
            uiCountdown.innerHTML = `
                <span class="countdown-label">Próxima carta disponible en:</span>
                <span class="countdown-timer">${summary.timeFormatted}</span>
            `;
        }
    }

    // ========================
    // Temporizador en Tiempo Real
    // ========================

    function startCountdown() {
        stopCountdown();
        countdownInterval = setInterval(() => {
            if (currentState !== STATES.SOLAR_SYSTEM) return;

            const summary = Storage.getProgressSummary();
            updateCountdownDisplay(summary);

            // Transición automática al vencer el tiempo
            if (summary.timeRemaining === 0 && !summary.canDiscoverNew) {
                updateSolarSystemUI();
            } else if (summary.canDiscoverNew && summary.discoveredCount > 0) {
                const states = {};
                LettersData.forEach(l => {
                    states[l.id] = Storage.getPlanetState(l.id);
                });
                Universe.updatePlanetStates(states);
            }
        }, 1000);
    }

    function stopCountdown() {
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
    }

    // ========================
    // Ciclo de Vida y Eventos
    // ========================

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && currentState === STATES.SOLAR_SYSTEM) {
            updateSolarSystemUI();
        }
    });

    window.addEventListener('resize', () => {
        if (currentState === STATES.SOLAR_SYSTEM || currentState === STATES.PLANET_CARD) {
            Universe.onResize();
        }
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
