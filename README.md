# Cartoon 3D/2D en español

Skill de Claude para hacer **shorts verticales de historia y curiosidades en español de España**, con el estilo de personajes 2D en un mundo 3D de colores: contornos de tinta, ciudad pintada, desenfoque de lente y cámaras que se deslizan. Todo se renderiza con three.js dentro de Remotion en tu propio PC, sin generadores de video con IA.

Es una adaptación de [mromidev/claude-animated-shorts](https://github.com/mromidev/claude-animated-shorts) (MIT). Cambia el idioma, la voz (ElevenLabs), los tiempos por palabra (VoiceStudio) y el sonido, que pasa a ser con efectos reales de Openverse.

## Qué hay dentro
| Ruta | Qué es |
|---|---|
| `SKILL.md` | La skill en español: reglas, pipeline y lecciones aprendidas |
| `templates/bridge/` | El código original del short del puente: mundo, personajes, tinta, lente, grade y cámara. Es la base de todo |
| `templates/vasa/` | Escena nueva de ejemplo: el puerto de Estocolmo y el Vasa (1628), prueba de estilo de 5 s |
| `templates/project/` | `package.json`, `src/index.ts` y `src/Root.tsx` para montar el proyecto Remotion |
| `templates/scripts/` | `stills.mjs` y `render.mjs` (Windows con GPU o servidor), más los scripts de QA originales |
| `templates/audio/` | El sonido sintetizado original (de referencia; ahora se usan efectos reales) |
| `examples/vasa/` | Guion, hechos y fuentes, y plan de sonido del short del Vasa |
| `references/` | `STYLE_BIBLE.md` y los informes medidos del estilo, en texto |
| `docs/` | `SKILL.md` y `README.md` originales en inglés, con todos los valores técnicos |

Las imágenes de referencia del repo original (`references/frames`, `references/sheets`) no se incluyen: su autor las publicó solo para estudiar el estilo.

## Instalación (Windows)
1. Clona este repo en `%USERPROFILE%\.claude\skills\cartoon-3d-short-es\`.
2. Necesitas Node (ya instalado), Python 3 y ffmpeg. VoiceStudio trae un ffmpeg dentro (ruta en `SKILL.md`).
3. Crea el proyecto Remotion en `Documentos\HistoriaCartoon\`:
   ```powershell
   cd "$env:USERPROFILE\OneDrive\Documentos\HistoriaCartoon"
   mkdir remotion; cd remotion
   copy ...\cartoon-3d-short-es\templates\project\* . -Recurse
   mkdir src\videos; xcopy ...\cartoon-3d-short-es\templates\bridge src\videos\bridge\ /E; xcopy ...\cartoon-3d-short-es\templates\vasa src\videos\vasa\ /E
   copy ...\cartoon-3d-short-es\templates\scripts\*.mjs .
   npm install
   node render.mjs VasaTest out\vasa_test.mp4 0.75
   ```
4. En Claude Code: *"Usa la skill de cartoon en español y haz un short sobre…"*

## Voz y sonido
- **Voz:** la generas en ElevenLabs y la dejas en la carpeta `voice\` del short. Claude la usa tal cual y saca los tiempos por palabra con VoiceStudio (MCP en `localhost:3900`).
- **Efectos y música:** reales, de [Openverse](https://openverse.org), solo con licencia CC0 o CC BY. Los créditos van en `sfx\CREDITOS_SFX.txt` y en la descripción del video.

## Licencia
Código y documentación bajo MIT (ver `LICENSE`), basado en el trabajo de Mr omi.
