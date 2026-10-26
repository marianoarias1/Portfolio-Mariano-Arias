# Portfolio — Mariano Arias

Portfolio personal de Mariano Arias, desarrollador front-end en Argentina.

Incluye MemoryBook, FilmLab, FilmLab Professional, Bimu y Soundlify, con capturas reales, fichas de proyectos y una bienvenida animada en seis idiomas.

## Ejecutar localmente

Requiere Node.js 18 o superior. No hay dependencias de npm.

```bash
npm run dev
```

Abrir http://localhost:3000. También se puede servir `dist/` con cualquier servidor estático, por ejemplo `python -m http.server 3000 --directory dist`.

## Validación

```bash
npm run check
```

## Estructura

- `dist/index.html`: contenido y secciones.
- `dist/style.css`: estilos responsive.
- `dist/app.js`: navegación y fichas de proyectos.
- `dist/handwriting.js`: animación SVG multilingüe.
- `dist/assets/`: capturas y fuentes locales.
- `scripts/curated-curves.json`: curvas vectoriales de la escritura.
- `scripts/build-handwriting.py`: regeneración opcional de los datos de escritura (Python, Pillow, NumPy, SciPy y fontTools).
- `scripts/dev.mjs`: servidor local sin dependencias.

## Publicación

Sitio estático, sin paso de compilación. Publicar el directorio `dist/`.

Incluye `vercel.json` para Vercel. Los cambios en GitHub no actualizan automáticamente la preview de ChatGPT.

## Estado

La sección «Sobre mí» y los casos de estudio todavía tienen contenido provisional. Los enlaces a proyectos se completarán a medida que se publiquen sus demos.

## Tipografías

Las fuentes incluidas conservan sus licencias en `dist/assets/licenses/`. La bienvenida utiliza curvas SVG ajustadas para la animación, basadas en Dancing Script.

