import fs from "node:fs/promises";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import {
  selectComposition,
  renderMedia,
  renderStill,
  makeCancelSignal,
  ensureBrowser,
} from "@remotion/renderer";
import sharp from "sharp";
const input = process.argv[2];
if (!input) {
  console.error(
    "Uso: npm run render -- data/jobs/ID.json (servidor local activo)",
  );
  process.exit(1);
}
const config = JSON.parse(await fs.readFile(path.resolve(input), "utf8"));
const {
  project,
  job,
  outputDir,
  origin,
  frame = 0,
  quality = "1080p",
  transparent = false,
} = config;
const emit = (value) => process.stdout.write(JSON.stringify(value) + "\n");
const { cancelSignal, cancel } = makeCancelSignal();
let cancelled = false;
process.stdin.on("data", () => {
  cancelled = true;
  cancel();
});
process.stdin.resume();
const check = () => {
  if (cancelled) throw new Error("Render cancelado");
};
try {
  emit({
    progress: 0.01,
    message: "Preparando Chromium local (la primera vez puede descargarlo)",
  });
  await ensureBrowser();
  check();
  emit({ progress: 0.02, message: "Compilando composición Remotion" });
  const serveUrl = await bundle({
    entryPoint: path.resolve("src/video/index.tsx"),
    onProgress: (p) =>
      emit({
        progress: 0.02 + (p / 100) * 0.08,
        message: "Compilando escena 3D",
      }),
  });
  check();
  const props = { project, origin, transparent };
  const chromiumOptions = { gl: "angle", disableWebSecurity: false };
  const composition = await selectComposition({
    serveUrl,
    id: "BookCommercial",
    inputProps: props,
    chromiumOptions,
  });
  check();
  if (quality === "preview" || quality === "720p") {
    const ratio = (quality === "720p" ? 720 : 360) / 1080;
    composition.width = Math.round((composition.width * ratio) / 2) * 2;
    composition.height = Math.round((composition.height * ratio) / 2) * 2;
  }
  const ext = job.kind === "video" ? "mp4" : job.kind;
  const file = `${job.id}.${ext}`;
  await fs.mkdir(outputDir, { recursive: true });
  const outputLocation = path.join(outputDir, file);
  if (job.kind === "video") {
    emit({ progress: 0.1, message: "Renderizando fotogramas 3D" });
    await renderMedia({
      composition,
      serveUrl,
      codec: "h264",
      outputLocation,
      inputProps: props,
      chromiumOptions,
      cancelSignal,
      concurrency: 1,
      crf: 19,
      pixelFormat: "yuv420p",
      timeoutInMilliseconds: 120000,
      onProgress: ({ progress, renderedFrames }) =>
        emit({
          progress: 0.1 + progress * 0.89,
          message: `Render 3D · ${renderedFrames}/${composition.durationInFrames} fotogramas`,
        }),
    });
  } else {
    const png = job.kind === "webp" ? outputLocation + ".png" : outputLocation;
    await renderStill({
      composition,
      serveUrl,
      output: png,
      inputProps: props,
      frame,
      imageFormat: "png",
      chromiumOptions,
      cancelSignal,
      timeoutInMilliseconds: 120000,
    });
    check();
    if (job.kind === "webp") {
      await sharp(png).webp({ quality: 95 }).toFile(outputLocation);
      await fs.unlink(png);
    }
  }
  check();
  emit({ progress: 1, message: "Exportación terminada", file });
  process.exit(0);
} catch (e) {
  console.error(e?.stack || String(e));
  process.exit(1);
}
