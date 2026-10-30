/**
 * planets.js — Configuración de planetas y datos orbitales
 * 
 * Define las propiedades visuales y orbitales de cada planeta.
 * Los tamaños y distancias están ajustados para composición visual,
 * no para precisión astronómica.
 */

(function () {
    'use strict';

    // Configuración de cada planeta
    // orbitalRadius: distancia al sol (unidades de la escena)
    // orbitalSpeed: velocidad angular (radianes por frame a 60fps)
    // size: radio visual del planeta
    // initialAngle: posición inicial en la órbita (radianes)
    const PLANETS_CONFIG = [
        {
            id: 'mercurio',
            name: 'Mercurio',
            orbitalRadius: 28,
            orbitalSpeed: 0.009,
            size: 3.5,
            initialAngle: 0.8,
            tilt: 0.03,
            glowColor: 0xC0C0C0
        },
        {
            id: 'venus',
            name: 'Venus',
            orbitalRadius: 40,
            orbitalSpeed: 0.007,
            size: 5,
            initialAngle: 2.4,
            tilt: 0.05,
            glowColor: 0xDAA520
        },
        {
            id: 'tierra',
            name: 'Tierra',
            orbitalRadius: 54,
            orbitalSpeed: 0.006,
            size: 5.2,
            initialAngle: 4.2,
            tilt: 0.04,
            glowColor: 0x4169E1
        },
        {
            id: 'marte',
            name: 'Marte',
            orbitalRadius: 68,
            orbitalSpeed: 0.0045,
            size: 4.2,
            initialAngle: 1.1,
            tilt: 0.045,
            glowColor: 0xCD5C5C
        },
        {
            id: 'jupiter',
            name: 'Júpiter',
            orbitalRadius: 90,
            orbitalSpeed: 0.003,
            size: 10,
            initialAngle: 3.6,
            tilt: 0.02,
            glowColor: 0xD2A85E
        },
        {
            id: 'saturno',
            name: 'Saturno',
            orbitalRadius: 115,
            orbitalSpeed: 0.0022,
            size: 9,
            aspectRatio: 1.554, // Ancho / Alto de Saturno con anillos
            initialAngle: 5.5,
            tilt: 0.06,
            hasRings: true,
            glowColor: 0xDAC07A
        },
        {
            id: 'urano',
            name: 'Urano',
            orbitalRadius: 140,
            orbitalSpeed: 0.0015,
            size: 6.5,
            initialAngle: 0.3,
            tilt: 0.08,
            glowColor: 0x40E0D0
        },
        {
            id: 'neptuno',
            name: 'Neptuno',
            orbitalRadius: 165,
            orbitalSpeed: 0.001,
            size: 6,
            initialAngle: 4.8,
            tilt: 0.03,
            glowColor: 0x4169E1
        }
    ];

    // Configuración del sol
    const SUN_CONFIG = {
        size: 14,
        color: 0xFFC93C,
        emissiveColor: 0xFF8800,
        lightIntensity: 2.0,
        glowSize: 50,
        image: 'planetas/sol.png'
    };

    // Crear mapa indexado por ID
    const PLANETS_MAP = {};
    PLANETS_CONFIG.forEach(p => {
        PLANETS_MAP[p.id] = p;
    });

    // ========================
    // Exportar
    // ========================
    window.UniversoCartas = window.UniversoCartas || {};
    window.UniversoCartas.PlanetsConfig = PLANETS_CONFIG;
    window.UniversoCartas.PlanetsMap = PLANETS_MAP;
    window.UniversoCartas.SunConfig = SUN_CONFIG;

})();

