import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";
// cada bundle copia public/ a la carpeta temporal: usa un disco con espacio (REMOTION_TMP)
if (process.env.REMOTION_TMP) { fs.mkdirSync(process.env.REMOTION_TMP, { recursive: true }); process.env.TEMP = process.env.TMP = process.env.REMOTION_TMP; }
const [id, prefix, frames, scale = "0.5"] = process.argv.slice(2);
// Chrome: Remotion descarga su propio Chrome Headless Shell si no se indica BROWSER (ruta a chrome.exe opcional)
const browserExecutable = process.env.BROWSER || null;
// GPU: "angle" en Windows con GPU (rápido); "swangle" = software (servidores sin GPU, ~30 s por fotograma)
const chromiumOptions = { gl: process.env.REMOTION_GL || (process.platform === "win32" ? "angle" : "swangle") };
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id, browserExecutable, chromiumOptions });
const onBrowserLog = (l) => { if (l.type === "error" || l.type === "warning") console.log(`[${l.type}]`, l.text.slice(0, 300)); };
for (const f of frames.split(",").map(Number)) {
  const t0 = Date.now();
  await renderStill({ composition, serveUrl, frame: f, output: `${prefix}${f}.jpg`, imageFormat: "jpeg", jpegQuality: 88, scale: Number(scale), browserExecutable, chromiumOptions, timeoutInMilliseconds: 300000, onBrowserLog });
  console.log("still", f, ((Date.now() - t0) / 1000).toFixed(1) + "s");
}
process.exit(0);
