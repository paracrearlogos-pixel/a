/**
 * storage.js — Persistencia del progreso del usuario
 * 
 * Utiliza localStorage como almacenamiento principal y cookies como respaldo.
 * Guarda las fechas como timestamps (milisegundos desde epoch) para
 * realizar cálculos de tiempo precisos.
 * 
 * Datos almacenados:
 *   - discoveredPlanets: Array de IDs de planetas descubiertos
 *   - lastDiscoveryTime: Timestamp de la última carta nueva abierta
 *   - nextUnlockTime: Timestamp de cuándo se puede abrir la siguiente carta
 *   - allDiscovered: Booleano indicando si se completó la experiencia
 */

(function () {
    'use strict';

    // Duración del bloqueo entre cartas nuevas: 24 horas en milisegundos
    const UNLOCK_INTERVAL_MS = 60 * 1000; // PRUEBAS: 1 minuto

    // =========================================================================
    // REGLA OFICIAL: 1 carta nueva cada 24 horas.
    // =========================================================================
    let DISABLE_COUNTDOWN_FOR_TESTING = true;

    // Clave base para almacenamiento
    const STORAGE_KEY = 'universoCartas_progress';

    // ========================
    // Estructura de datos vacía
    // ========================
    function createEmptyProgress() {
        return {
            discoveredPlanets: [],
            lastDiscoveryTime: null,
            nextUnlockTime: null,
            allDiscovered: false
        };
    }

    // ========================
    // localStorage
    // ========================
    function saveToLocalStorage(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.warn('No se pudo guardar en localStorage:', e);
            return false;
        }
    }

    function loadFromLocalStorage() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                return JSON.parse(raw);
            }
        } catch (e) {
            console.warn('No se pudo leer de localStorage:', e);
        }
        return null;
    }

    // ========================
    // Cookies (respaldo)
    // ========================
    function saveToCookie(data) {
        try {
            const encoded = encodeURIComponent(JSON.stringify(data));
            // Cookie con expiración de 365 días
            const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
            document.cookie = `${STORAGE_KEY}=${encoded}; expires=${expires}; path=/; SameSite=Lax`;
            return true;
        } catch (e) {
            console.warn('No se pudo guardar cookie:', e);
            return false;
        }
    }

    function loadFromCookie() {
        try {
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
                cookie = cookie.trim();
                if (cookie.startsWith(STORAGE_KEY + '=')) {
                    const value = cookie.substring(STORAGE_KEY.length + 1);
                    return JSON.parse(decodeURIComponent(value));
                }
            }
        } catch (e) {
            console.warn('No se pudo leer cookie:', e);
        }
        return null;
    }

    // ========================
    // API principal
    // ========================

    /**
     * Cargar el progreso guardado (localStorage primero, luego cookie).
     * Si no hay progreso, devuelve estructura vacía.
     */
    function loadProgress() {
        let data = loadFromLocalStorage();
        if (!data) {
            data = loadFromCookie();
        }
        if (!data) {
            data = createEmptyProgress();
        }
        // Asegurar que la estructura tenga todos los campos
        if (!Array.isArray(data.discoveredPlanets)) data.discoveredPlanets = [];
        if (typeof data.lastDiscoveryTime !== 'number') data.lastDiscoveryTime = null;
        if (typeof data.nextUnlockTime !== 'number') data.nextUnlockTime = null;
        if (typeof data.allDiscovered !== 'boolean') data.allDiscovered = false;

        // En modo de prueba, limpiar cualquier bloqueo previo de 24h
        if (DISABLE_COUNTDOWN_FOR_TESTING) {
            data.nextUnlockTime = null;
        }

        return data;
    }

    /**
     * Guardar el progreso actual en localStorage y cookie.
     */
    function saveProgress(data) {
        saveToLocalStorage(data);
        saveToCookie(data);
    }

    /**
     * Obtener la lista de planetas descubiertos.
     */
    function getDiscoveredPlanets() {
        return loadProgress().discoveredPlanets;
    }

    /**
     * Verificar si un planeta específico ya fue descubierto.
     */
    function isPlanetDiscovered(planetId) {
        const progress = loadProgress();
        return progress.discoveredPlanets.includes(planetId);
    }

    /**
     * Verificar si el usuario puede descubrir una carta nueva ahora.
     * Reglas:
     *   - Si el modo de pruebas está activo, siempre se permite abrir cualquier planeta no descubierto.
     *   - Si no hay cartas descubiertas, puede abrir la primera inmediatamente.
     *   - Si ya descubrió todas, no puede descubrir más.
     *   - Si hay una cuenta regresiva activa, solo puede si ya expiró.
     */
    function canDiscoverNew() {
        const progress = loadProgress();

        if (progress.allDiscovered || progress.discoveredPlanets.length >= 8) {
            return false;
        }

        // Modo de prueba: siempre permite descubrir sin esperar 24 horas
        if (DISABLE_COUNTDOWN_FOR_TESTING) {
            return true;
        }

        // Si no ha descubierto ninguna, puede abrir la primera
        if (progress.discoveredPlanets.length === 0) {
            return true;
        }

        // Si hay un tiempo de desbloqueo, verificar si ya pasó
        if (progress.nextUnlockTime) {
            return Date.now() >= progress.nextUnlockTime;
        }

        // Si no hay nextUnlockTime pero sí hay cartas descubiertas, permitir
        return true;
    }

    /**
     * Registrar el descubrimiento de un planeta.
     * Inicia la cuenta regresiva de 24 horas para la siguiente carta (si no está en modo prueba).
     * Devuelve true si el descubrimiento fue exitoso, false si no se permite.
     */
    function discoverPlanet(planetId) {
        const progress = loadProgress();

        // Verificar si ya está descubierto (releer no cuenta)
        if (progress.discoveredPlanets.includes(planetId)) {
            return true; // Ya descubierto, no iniciar contador nuevo
        }

        if (!DISABLE_COUNTDOWN_FOR_TESTING) {
            // Verificar si puede descubrir una nueva
            if (progress.discoveredPlanets.length > 0) {
                if (progress.nextUnlockTime && Date.now() < progress.nextUnlockTime) {
                    return false; // Bloqueado por el contador
                }
            }
        }

        // Registrar el descubrimiento
        const now = Date.now();
        progress.discoveredPlanets.push(planetId);
        progress.lastDiscoveryTime = now;
        progress.nextUnlockTime = DISABLE_COUNTDOWN_FOR_TESTING ? null : (now + UNLOCK_INTERVAL_MS);

        // Verificar si ya descubrió todas
        if (progress.discoveredPlanets.length >= 8) {
            progress.allDiscovered = true;
            progress.nextUnlockTime = null; // Ya no se necesita contador
        }

        saveProgress(progress);
        return true;
    }

    /**
     * Obtener el tiempo restante en milisegundos para el próximo desbloqueo.
     * Devuelve 0 si ya está disponible, null si no hay contador activo.
     */
    function getTimeRemaining() {
        if (DISABLE_COUNTDOWN_FOR_TESTING) return null;
        const progress = loadProgress();

        if (progress.allDiscovered) return null;
        if (progress.discoveredPlanets.length === 0) return null;
        if (!progress.nextUnlockTime) return null;

        const remaining = progress.nextUnlockTime - Date.now();
        return Math.max(0, remaining);
    }

    /**
     * Formatear milisegundos como "HH : MM : SS".
     */
    function formatTimeRemaining(ms) {
        if (ms === null || ms === undefined) return '';
        if (ms <= 0) return '00 : 00 : 00';

        const totalSeconds = Math.ceil(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const pad = n => String(n).padStart(2, '0');
        return `${pad(hours)} : ${pad(minutes)} : ${pad(seconds)}`;
    }

    /**
     * Obtener el progreso actual como objeto resumen.
     */
    function getProgressSummary() {
        const progress = loadProgress();
        const remaining = getTimeRemaining();
        const available = canDiscoverNew();

        return {
            discovered: progress.discoveredPlanets,
            discoveredCount: progress.discoveredPlanets.length,
            totalPlanets: 8,
            allDiscovered: progress.allDiscovered,
            canDiscoverNew: available,
            timeRemaining: remaining,
            timeFormatted: formatTimeRemaining(remaining),
            nextUnlockTime: progress.nextUnlockTime,
            lastDiscoveryTime: progress.lastDiscoveryTime
        };
    }

    /**
     * Determinar el estado visual de un planeta.
     * @returns 'available' | 'locked' | 'discovered'
     */
    function getPlanetState(planetId) {
        const progress = loadProgress();

        // Si ya fue descubierto
        if (progress.discoveredPlanets.includes(planetId)) {
            return 'discovered';
        }

        // Modo de prueba: siempre disponible si no está descubierto
        if (DISABLE_COUNTDOWN_FOR_TESTING) {
            return 'available';
        }

        // Si puede descubrir uno nuevo → disponible
        if (canDiscoverNew()) {
            return 'available';
        }

        // Si no puede → bloqueado
        return 'locked';
    }

    /**
     * Reiniciar todo el progreso (para pruebas).
     */
    function resetProgress() {
        const empty = createEmptyProgress();
        saveProgress(empty);
        return empty;
    }

    /**
     * Adelantar el tiempo de desbloqueo (útil para pruebas y desarrollo).
     * @param {number} hours - Horas a adelantar (por defecto 24 horas para desbloquear ya)
     */
    function advanceTime(hours = 24) {
        const progress = loadProgress();
        if (progress.nextUnlockTime) {
            progress.nextUnlockTime -= hours * 60 * 60 * 1000;
            saveProgress(progress);
        }
        return getProgressSummary();
    }

    /**
     * Desbloquear todas las cartas inmediatamente (para pruebas de la pantalla final).
     */
    function unlockAll() {
        const progress = loadProgress();
        const allIds = ['mercurio', 'venus', 'tierra', 'marte', 'jupiter', 'saturno', 'urano', 'neptuno'];
        progress.discoveredPlanets = [...allIds];
        progress.allDiscovered = true;
        progress.nextUnlockTime = null;
        saveProgress(progress);
        return getProgressSummary();
    }

    /**
     * Consultar si el contador de 24h está desactivado (modo prueba).
     */
    function isCountdownDisabled() {
        return DISABLE_COUNTDOWN_FOR_TESTING;
    }

    /**
     * Activar o desactivar el contador de 24 horas dinámicamente.
     */
    function setCountdownDisabled(disabled) {
        DISABLE_COUNTDOWN_FOR_TESTING = !!disabled;
        if (DISABLE_COUNTDOWN_FOR_TESTING) {
            const progress = loadProgress();
            progress.nextUnlockTime = null;
            saveProgress(progress);
        }
        return DISABLE_COUNTDOWN_FOR_TESTING;
    }

    // ========================
    // Exportar API
    // ========================
    window.UniversoCartas = window.UniversoCartas || {};
    window.UniversoCartas.Storage = {
        loadProgress,
        saveProgress,
        getDiscoveredPlanets,
        isPlanetDiscovered,
        canDiscoverNew,
        discoverPlanet,
        getTimeRemaining,
        formatTimeRemaining,
        getProgressSummary,
        getPlanetState,
        resetProgress,
        advanceTime,
        unlockAll,
        isCountdownDisabled,
        setCountdownDisabled,
        UNLOCK_INTERVAL_MS
    };

})();

