/**
 * letters.js — Contenido de las cartas para cada planeta
 * 
 * INSTRUCCIONES PARA PERSONALIZAR:
 * Modifica únicamente este archivo para cambiar los mensajes de cada carta.
 * No es necesario tocar ningún otro archivo de la aplicación.
 * 
 * Cada entrada contiene:
 *   - id:        Identificador interno del planeta (no modificar)
 *   - name:      Nombre visible del planeta
 *   - cardTitle: Título que aparece en la carta
 *   - subtitle:  Subtítulo de la carta
 *   - message:   Texto principal de la carta (soporta saltos de línea con \n)
 *   - colors:    Paleta de colores personalizada
 *   - image:     Ruta a la imagen del planeta
 */

const LETTERS_DATA = [
    {
        id: 'mercurio',
        name: 'Mercurio',
        cardTitle: 'Princesa',
        subtitle: 'Has descubierto un nuevo mensaje.',
        message: `Hola, preciosa!... Sabe algo? Usted me recuerda a Mercurio: pequeñita en tamaño, pero con muchísimas cualidades. Usted es una personita llena de empatía, seguridad, inteligencia, carisma, belleza, pasión y tantas otras virtudes que la hacen única.
Este mensajito es para recordarle la mujer tan especial que es y lo mucho que vale. Nunca lo olvide ✨`,
        colors: {
            primary: '#C0C0C0',
            secondary: '#808080',
            accent: '#E8E8E8',
            glow: 'rgba(192, 192, 192, 0.4)',
            gradient: ['#808080', '#C0C0C0', '#E8E8E8'],
            particles: ['#C0C0C0', '#A9A9A9', '#FFFFFF', '#D3D3D3']
        },
        image: 'planetas/Mercurio.png'
    },
    {
        id: 'venus',
        name: 'Venus',
        cardTitle: 'Princesa',
        subtitle: 'Has descubierto un nuevo mensaje.',
        message: `Buenos días, buenas tardes o buenas noches! 😅 Nath, usted sabía que Venus es el planeta más brillante?... ✨ 
Aunque no es una estrella, brilla gracias a la luz que refleja. Y eso me recuerda que no hace falta ser una estrella para iluminar la vida de los demás. Usted tiene esa bonita capacidad de irradiar luz y hacer que todo se sienta mejor 🥰 
Sonría más, que le queda bonito!...`,
        colors: {
            primary: '#DAA520',
            secondary: '#FF8C00',
            accent: '#FFD700',
            glow: 'rgba(218, 165, 32, 0.4)',
            gradient: ['#FF8C00', '#DAA520', '#FFD700'],
            particles: ['#FFD700', '#DAA520', '#FFA500', '#FFCC33']
        },
        image: 'planetas/Venus-PNG-Photos.png'
    },
    {
        id: 'tierra',
        name: 'Tierra',
        cardTitle: 'Princesa',
        subtitle: 'Has descubierto un nuevo mensaje.',
        message: `Definitivamente, el universo está lleno de cosas extraordinarias. Quién diría que, entre tantos caminos e historias, tendría la dicha de coincidir con usted?. Como dice la frase que usted compartió un día: «Dada la inmensidad del tiempo y la inmensidad del universo, es un inmenso placer para mí compartir un planeta y un tiempo contigo». Y créame, no podría estar más de acuerdo.
Gracias por haberme escrito aquel día, niña preciosa ❤️💙`,
        colors: {
            primary: '#4169E1',
            secondary: '#2E8B57',
            accent: '#00CED1',
            glow: 'rgba(65, 105, 225, 0.4)',
            gradient: ['#2E8B57', '#4169E1', '#00CED1'],
            particles: ['#4169E1', '#00CED1', '#2E8B57', '#87CEEB']
        },
        image: 'planetas/planet-earth-1457453_1280.png'
    },
    {
        id: 'marte',
        name: 'Marte',
        cardTitle: 'Princesa',
        subtitle: 'Has descubierto un nuevo mensaje.',
        message: `Conoce la historia de Darcy y Elizabeth? Después de ver la película tantas veces, entendí que cuando alguien nos gusta, todo se complica. Darcy tenía dinero y elegancia, pero ni así sabía cómo hablarle a quien le gustaba. A veces me da miedo intentar ser romántica y no tener las palabras correctas, pero quiero que sepa que usted es alguien por quien vale la pena intentarlo. Me hace muy feliz haber coincidido con usted y espero hacerle saber cada día lo especial que es para mí. ❤️`,
        colors: {
            primary: '#CD5C5C',
            secondary: '#FF6347',
            accent: '#B87333',
            glow: 'rgba(205, 92, 92, 0.4)',
            gradient: ['#FF6347', '#CD5C5C', '#B87333'],
            particles: ['#CD5C5C', '#FF6347', '#B87333', '#E07050']
        },
        image: 'planetas/Marte.png'
    },
    {
        id: 'jupiter',
        name: 'Júpiter',
        cardTitle: 'Princesa',
        subtitle: 'Has descubierto un nuevo mensaje.',
        message: `Una preguntita, hoy ya le han dicho lo linda que es?. Si esa persona insípida que le anda coqueteando no se lo ha dicho, aquí estoy yo para recordárselo. 😏
Señorita, usted es una niña espectacular y espero que nunca se le olvide lo bonita que es. Cuando la distancia deje de ser un problema, la voy a invitar a ver esos atardeceres que le debo y a tomarnos esos cafecitos que tenemos pendientes.
Espero que tenga un lindo día, niña bonita...`,
        colors: {
            primary: '#D2A85E',
            secondary: '#8B7355',
            accent: '#DAA520',
            glow: 'rgba(210, 168, 94, 0.4)',
            gradient: ['#8B7355', '#D2A85E', '#DAA520'],
            particles: ['#D2A85E', '#DAA520', '#C4A35A', '#E8C87A']
        },
        image: 'planetas/Jupiter-planet.png'
    },
    {
        id: 'saturno',
        name: 'Saturno',
        cardTitle: 'Princesa',
        subtitle: 'Has descubierto un nuevo mensaje.',
        message: ` Hola, señorita Tzuc. No sé a qué hora estará leyendo este mensajito, pero hoy solo quería recordarle que siempre la tengo presente. 
Y si tiene un ratito libre, me encantaría que se regalara 5 minutitos para escuchar Quédate, de Manuel Medrano. 
Espero que le guste mucho. Le mando muchos beshitos ❤️`,
        colors: {
            primary: '#DAC07A',
            secondary: '#F5DEB3',
            accent: '#FFD700',
            glow: 'rgba(218, 192, 122, 0.4)',
            gradient: ['#F5DEB3', '#DAC07A', '#FFD700'],
            particles: ['#DAC07A', '#F5DEB3', '#FFD700', '#E8D5A0']
        },
        image: 'planetas/Saturno.png'
    },
    {
        id: 'urano',
        name: 'Urano',
        cardTitle: 'Princesa',
        subtitle: 'Has descubierto un nuevo mensaje.',
        message: `¿Qué es poesía?, dices mientras clavas
en mi pupila tu pupila azul.
¿Qué es poesía? ¿Y tú me lo preguntas?
Poesía... eres tú.
Creo que hoy no necesito decir más 🙈❤️`,
        colors: {
            primary: '#40E0D0',
            secondary: '#87CEEB',
            accent: '#B0E0E6',
            glow: 'rgba(64, 224, 208, 0.4)',
            gradient: ['#87CEEB', '#40E0D0', '#B0E0E6'],
            particles: ['#40E0D0', '#87CEEB', '#B0E0E6', '#AFEEEE']
        },
        image: 'planetas/Urano.png'
    },
    {
        id: 'neptuno',
        name: 'Neptuno',
        cardTitle: 'Princesa',
        subtitle: 'Has descubierto un nuevo mensaje.',
        message: `Holaaa! ¿Cómo está esa niña bonita?❤️ Hoy quiero recordarle algo que me gustaría que siempre tenga presente.
Señorita, no quiero que usted sea perfecta, ni está dentro de mis planes pedirle que lo sea. Al contrario, espero poder lograr que nunca sienta que tiene que serlo para merecer todo lo bonito que hay en este mundo.
No olvide que la quiero muchoooooo ❤️`,
        colors: {
            primary: '#4169E1',
            secondary: '#4B0082',
            accent: '#8A2BE2',
            glow: 'rgba(65, 105, 225, 0.4)',
            gradient: ['#4B0082', '#4169E1', '#8A2BE2'],
            particles: ['#4169E1', '#4B0082', '#8A2BE2', '#6A5ACD']
        },
        image: 'planetas/Neptuno.png'
    }
];

// Crear mapa indexado por ID para acceso rápido
const LETTERS = {};
LETTERS_DATA.forEach(letter => {
    LETTERS[letter.id] = letter;
});

// Exportar para uso global
window.UniversoCartas = window.UniversoCartas || {};
window.UniversoCartas.Letters = LETTERS;
window.UniversoCartas.LettersData = LETTERS_DATA;

