---
name: cartoon-3d-short-es
description: Hacer un short vertical de historia o curiosidades (55-80 s) EN ESPAÑOL DE ESPAÑA con el estilo "personajes 2D en un mundo 3D de colores" (personajes planos con contorno de tinta, mundo 3D pintado con líneas negras, cielo saturado, desenfoque de lente, cámaras que se deslizan, narración, efectos de sonido reales y música), renderizado con three.js dentro de Remotion. Úsala cuando el usuario pida un short "como el del Vasa", "como el del puente", "en el estilo cartoon 3D", o diga "usa la skill de cartoon en español".
---

# Short de historia en cartoon 3D, en español (three.js + Remotion)

Adaptación al español de [mromidev/claude-animated-shorts](https://github.com/mromidev/claude-animated-shorts) (MIT).
El motor visual es el mismo; cambian el idioma, la voz, los efectos de sonido y algunas reglas.

- Ejemplo original: *The Bridge That Fell for a Song* (`templates/bridge/`). Es la base de todos los módulos del look.
- Ejemplo en español: **El Vasa (1628)**: prueba de estilo de 5 s en `templates/vasa/`, guion y plan en `examples/vasa/`.
- Detalle técnico completo del look (valores medidos, gotchas, bucle de comparación): `docs/SKILL_original_en.md`. **Léelo antes de tocar luces, tinta, lente o personajes.**

## Reglas del usuario
- **Narración y textos en español de España** (castellano peninsular). Nunca acento latino.
- **Voz:** el usuario genera la narración en **ElevenLabs** (voz "Javi Rojas") y pasa el mp3. Se usa tal cual. **Nunca clonar esa voz** en VoiceStudio ni en otra herramienta: es la voz de un actor de la Voice Library de ElevenLabs. Para publicar con monetización hace falta un plan de pago de ElevenLabs.
- **Tiempos por palabra (`words.json`):** se sacan con **VoiceStudio** (MCP `voicestudio`, herramienta `transcribe`, WhisperX), que corre en el PC del usuario en `http://localhost:3900`. Corrige a mano nombres que el transcriptor oye mal ("Elbasa" → "el Vasa"; v y b suenan igual).
- **Carpeta de trabajo en el PC:** `C:\Users\monke\OneDrive\Documentos\HistoriaCartoon\<nombre-del-short>\` (`voice\`, `sfx\`, `out\`). No usar la carpeta "Que Pasaria Si", que es otro proyecto.
- Los chistes son datos reales investigados. Hechos y fuentes arriba del todo en `SCRIPT.md`.
- **Sin subtítulos** (el usuario los probó y los prefiere sin). Existe `templates/vasa/Captions.tsx` (palabra a palabra desde `public/<short>/words.json`), apagado por defecto; se activa con `--props={"captions":true}`.
- Mezcla: voz sin tocar, música por debajo con *ducking*, efectos a -6 dB, máster a **-14 LUFS**.
- Export final 2K vertical: 1440x2560 (`--scale 1.3333333333333333`).
- La historia, los personajes y la voz son siempre propios. Las referencias se usan para el look, no para el contenido.

## Pipeline
1. **Tema y hechos.** Una historia real y sorprendente con causa y efecto físico (que se pueda ver) y una analogía cotidiana que la explique.
2. **Guion en español: ~2,5-3 palabras/s** (más lento que el inglés, que va a 3,7). De 160 a 200 palabras para 60-80 s. Fórmula de beats:
   - **Gancho:** el dato absurdo en una línea ("En 1628, Suecia construyó el barco de guerra más poderoso del mundo. Se hundió antes de salir del puerto.").
   - **Escenario:** año, lugar, orgullo.
   - **Acción:** escalada en 3-4 golpes.
   - **El momento:** cuando todo se rompe.
   - **Doble línea seca** ("Por suerte... / Por desgracia...").
   - **Explicación:** una idea física con una analogía cotidiana (la copa con demasiado peso arriba).
   - **Consecuencia** y **giro final** que conecte con el gancho.
   - Escribe los años y cifras con letras si la voz los lee mal. Evita los puntos suspensivos dentro de una frase si el TTS se traba.
3. **Voz.** El usuario genera la narración del guion en ElevenLabs y la deja en `voice\`. Conviértela a `voice.wav` (48 kHz) y saca `words.json` con VoiceStudio. Todo se sincroniza con `words.json`.
4. **Plan de planos** en `story.ts` (bridge) o en `camAt`/`dofAt` (vasa): copia `templates/bridge/` (y `templates/vasa/` como ejemplo de escena nueva que reutiliza los módulos) a `src/videos/<nombre>/` y registra la composición en `src/Root.tsx`. Cada reacción visual cae 0-3 fotogramas antes de su palabra.
5. **Mundo** (`lights.ts`, `shade.ts`, `build.ts`, `paint.ts`, `world.ts`) y **personajes** (`toon.ts`, `cast.ts`, `cardshade.ts`). Detalles y valores en `docs/SKILL_original_en.md`.
6. **Post** (ink → lens pre → lens main → bloom → tone map NEUTRAL → grade, MSAA 4).
7. **Sonido real** (sustituye la síntesis del original):
   - Busca efectos y música en **Openverse** (`https://api.openverse.org/v1/audio/?q=<búsqueda>&license=cc0` o `license_type=commercial`). No hace falta cuenta. **Solo CC0 o CC BY**, nunca NC ni ND.
   - Guarda los archivos en `sfx\<categoría>\` y anota título, autor, licencia y URL en `sfx\CREDITOS_SFX.txt`. Los CC BY van en la descripción del video.
   - Coloca cada efecto en el fotograma exacto de su acción o palabra (ráfaga en "Llega una ráfaga", crujido en "se inclina", agua en "El agua entra").
   - Ambiente de fondo continuo (puerto, viento) y música baja con *ducking* bajo la voz.
   - Mezcla con ffmpeg. En el PC del usuario hay uno dentro de VoiceStudio: `C:\Users\monke\AppData\Roaming\VoiceStudio\runtime\project\.venv\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe`. Normaliza el máster a -14 LUFS (`loudnorm=I=-14:TP=-1:LRA=11`).
   - Opcional: *earshot* (github.com/Leonxlnx/earshot) para que Claude "escuche" la mezcla. Revisa su código antes de instalarlo.
8. **Revisión de imagen fotograma a fotograma.** Haz stills (`node scripts/stills.mjs <Comp> out/<n>/x_ 0,40,80 0.5`) y hojas de contacto con ffmpeg (`select='not(mod(n\,6))',tile=9x3`). Busca texturas sin sentido, saltos (movimiento a dos fotogramas que no toca) y objetos cortados en el borde. Corrige y repite.
9. **Render final** con `node scripts/render.mjs <Comp> out/<n>/video.mp4 1.3333333333333333` o con `npx remotion render ... --scale 1.3333333333333333`. Después une el audio con `-map 0:v:0 -map 1:a:0`. En el PC del usuario (RTX 5060) usa `REMOTION_GL=angle`. En un servidor sin GPU usa `swangle`, a unos 30 s por fotograma.
10. **QA** con `python scripts/short_qa.py final.mp4 out/<n>/qa shots.json` y entrega.

## Lecciones del Vasa (prueba de estilo)
- **Popas y fachadas:** nada de cuadrículas de ventanas repetidas. Una popa del siglo XVII tiene madera oscura abajo, el escudo real en el centro y 2 filas de 3 ventanas de camarote arriba. En el costado, una sola galería.
- **Saltos y botes de niños:** posición calculada en cada fotograma con una curva suave (`sin²`), nunca a dos fotogramas con `abs(sin)`, porque aterriza en seco. A dos fotogramas solo van los dibujos (brazos, caras).
- **No cambies la resolución del canvas de un personaje a mitad del plano**, porque se nota el salto. Usa 600x1000 para el público cercano.
- **Agua:** las crestas blancas al 0,2 como mucho. Más fuerte parece lluvia o rayas.
- Formato vertical: un barco de lado no cabe. Gíralo unos 130° (popa hacia cámara) y aléjalo hasta unos 90 m.
- Bandera de época: Suecia 1628 = azul con cruz amarilla.

## Disco y temporales
Cada bundle de Remotion copia `public/` a la carpeta temporal. Usa `REMOTION_TMP` en un disco con espacio y borra los `remotion-webpack-bundle-*` antiguos al terminar un proyecto, preguntando antes al usuario.
