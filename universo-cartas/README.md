# Universo de Cartas — Experiencia Espacial Interactiva

Una aplicación web inmersiva, cinematográfica e interactiva desarrollada con **HTML5, CSS3, JavaScript moderno y Three.js** que simula un viaje por nuestro sistema solar, donde cada uno de los 8 planetas resguarda una carta única para descubrir progresivamente.

---

## 🚀 Cómo Iniciar el Proyecto

Puedes abrir y ejecutar el proyecto de las siguientes maneras:

### Opción 1: Visual Studio Code con Live Server (Recomendada)
1. Abre la carpeta `universo-cartas` en **VS Code**.
2. Haz clic derecho sobre `index.html` y selecciona **"Open with Live Server"** (o presiona `Alt + L, Alt + O`).
3. Se abrirá automáticamente en tu navegador (`http://127.0.0.1:5500/index.html`).

### Opción 2: Servidor local con Python
Si tienes Python instalado:
```bash
cd universo-cartas
python -m http.server 8000
```
Luego abre `http://localhost:8000` en tu navegador.

### Opción 3: Servidor local con Node.js (npx)
```bash
npx serve
```

---

## 🪐 Estructura del Proyecto

```text
universo-cartas/
│
├── index.html           # Estructura semántica, accesibilidad y contenedores
├── final.html           # Vista final con Luna-Dita y fondo estelar
├── README.md            # Documentación y guía de personalización
├── css/
│   └── styles.css       # Estilos visuales, glassmorphism, responsive y animaciones
├── js/
│   ├── main.js          # Orquestador principal, flujo de estados y temporizador
│   ├── final.js         # Fondo estelar interactivo de la vista final
│   ├── universe.js      # Escena Three.js, planetas con imágenes locales y zoom 3D
│   ├── animations.js    # Canvas 2D: hiperespacio, túneles de color y partículas
│   ├── planets.js       # Configuración orbital y tamaños de los planetas
│   ├── letters.js       # Mensajes, títulos y paletas de colores de las cartas
│   └── storage.js       # Persistencia en localStorage / cookies y control 24h
│
└── planetas/            # Recursos gráficos locales
    ├── sol.png
    ├── mercurio.png
    ├── Venus-PNG-Photos.png
    ├── planet-earth-1457453_1280.png
    ├── Marte.png
    ├── Jupiter-planet.png
    ├── Saturno.png
    ├── Urano.png
    ├── Neptuno.png
    └── luna-dita.png
```

---

## ✉️ Cómo Personalizar las Cartas

Todos los mensajes se editan desde un único archivo: **`js/letters.js`**.

Cada planeta tiene su propia entrada:

```javascript
{
    id: 'marte',                                     // Identificador (no modificar)
    name: 'Marte',                                   // Nombre visible
    cardTitle: 'Carta 4 — Marte',                    // Título de la tarjeta
    subtitle: 'Has descubierto un nuevo mensaje.',   // Subtítulo
    message: `Escribe tu mensaje aquí.\n\nPuedes usar saltos de línea con \\n.`,
    colors: {
        primary: '#CD5C5C',                          // Color principal del planeta
        secondary: '#FF6347',                        // Color secundario
        accent: '#B87333',                           // Color de destello/estelas
        glow: 'rgba(205, 92, 92, 0.4)',              // Resplandor
        gradient: ['#FF6347', '#CD5C5C', '#B87333'],
        particles: ['#CD5C5C', '#FF6347', '#B87333', '#E07050']
    },
    image: 'planetas/Marte.png'                      // Imagen local del planeta
}
```

No es necesario modificar ningún otro archivo para cambiar textos, colores o imágenes.

---

## ⏱️ Sistema de Desbloqueo y Cuenta Regresiva de 24 Horas

1. **Primera carta:** Se puede elegir y abrir **cualquiera de los 8 planetas de inmediato**.
2. **Desbloqueo de 24 horas:** En el momento exacto en que se abre una carta nueva, inicia una cuenta regresiva de **24:00:00**.
3. **Persistencia garantizada:** La fecha de desbloqueo se guarda con timestamp en `localStorage` y `cookies`, por lo que al recargar la página o cerrar el navegador el tiempo restante sigue siendo exacto.
4. **Revisita sin límites:** Cualquier carta ya descubierta puede volver a leerse en cualquier momento sin reiniciar ni alterar el temporizador.
5. **Planetas bloqueados:** Muestran un indicador visual y un modal con el tiempo exacto restante si se intentan abrir antes de tiempo.
6. **Completado:** Al descubrir los 8 planetas, se muestra la vista final con Luna-Dita y empieza a sonar la canción de la carpeta `song/`. Si vuelves a entrar con los 8 planetas ya descubiertos, llegas al universo con un botón "Ir al final" arriba a la derecha. Desde la vista final, al pulsar la luna, se inicia el viaje hiperespacial de regreso al sistema solar con los 8 planetas abiertos.

---

## 🛠️ Herramientas de Prueba (Consola del Navegador)

Para verificar y probar la experiencia sin esperar 24 horas reales, puedes abrir las herramientas de desarrollo (`F12` o clic derecho > *Inspeccionar* > pestaña *Console*) y ejecutar:

- **Adelantar 24 horas para desbloquear ya:**
  ```javascript
  UniversoCartas.Storage.advanceTime(24);
  ```
- **Desbloquear las 8 cartas inmediatamente:**
  ```javascript
  UniversoCartas.Storage.unlockAll();
  ```
- **Reiniciar todo el progreso desde cero:**
  ```javascript
  UniversoCartas.Storage.resetProgress();
  location.reload();
  ```

---

## ✨ Características Técnicas Destacadas

- **Animaciones fluidas a 60 FPS** sincronizadas con `requestAnimationFrame`.
- **Efecto hiperespacial cinematográfico** con proyección tridimensional y velocidad variable.
- **Transición 3D realista:** La cámara de Three.js se acerca dinámicamente al planeta seleccionado mientras un túnel espacial en sus colores envuelve la escena.
- **Conservación fiel de las imágenes locales:** Sprites transparentes con soporte de aspecto proporcional (como los anillos de Saturno).
- **Diseño adaptable:** Optimizado para pantallas táctiles (móviles y tablets) y computadoras de escritorio.
- **Accesibilidad:** Soporta navegación por teclado (`Enter`, `Espacio`, `Escape`) y respeta la preferencia de movimiento reducido (`prefers-reduced-motion`).
