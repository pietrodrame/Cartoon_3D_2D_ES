import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";
// cada bundle copia public/ a la carpeta temporal: usa un disco con espacio (REMOTION_TMP)
if (process.env.REMOTION_TMP) { fs.mkdirSync(process.env.REMOTION_TMP, { recursive: true }); process.env.TEMP = process.env.TMP = process.env.REMOTION_TMP; }
const [id, out, scale = "0.75"] = process.argv.slice(2);
// Chrome: Remotion descarga su propio Chrome Headless Shell si no se indica BROWSER (ruta a chrome.exe opcional)
const browserExecutable = process.env.BROWSER || null;
// GPU: "angle" en Windows con GPU (rápido); "swangle" = software (servidores sin GPU, ~30 s por fotograma)
const chromiumOptions = { gl: process.env.REMOTION_GL || (process.platform === "win32" ? "angle" : "swangle") };
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id, browserExecutable, chromiumOptions });
let last = -1;
await renderMedia({ composition, serveUrl, codec: "h264", crf: 16, outputLocation: out, scale: Number(scale), browserExecutable, chromiumOptions,
  concurrency: 4, timeoutInMilliseconds: 600000, muted: true,
  onProgress: ({ renderedFrames }) => { if (renderedFrames !== last && renderedFrames % 10 === 0) { last = renderedFrames; console.log("frames", renderedFrames, new Date().toISOString()); } } });
console.log("done"); process.exit(0);
