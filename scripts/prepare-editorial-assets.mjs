import sharp from "sharp";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const output = resolve("public/editorial");
await mkdir(output, { recursive: true });
const photos = "data/productions/2026-10-16-fotos";
for (const key of ["A", "C", "M", "T", "V"]) {
  for (const side of ["front", "back"]) {
    await sharp(`${photos}/${key}-${side}-final.jpg`).webp({ quality: 90 }).toFile(`${output}/${key}-${side}.webp`);
  }
}
for (const [input, name, width] of [["LOGO2.png", "logo", 800], ["LOGO.png", "mascot", 500]]) {
  await sharp(`VIDEOS/${input}`).trim().resize({ width }).webp({ quality: 95 }).toFile(`${output}/${name}.webp`);
}
const clips = [
  ["TEXTO ATENAS.mp4", "atenas"],
  ["TEXTO CENTER.mp4", "center"],
  ["TEXTO MARIA ROMERO.mp4", "maria-romero"],
  ["TEXTO DIEGO THOMPSON.mp4", "diego-thompson"],
  ["TEXTO DIEGO THOMPSON 2.mp4", "diego-thompson-2"],
  ["D'FERNANDEZ.mp4", "editorial"],
];
const ffmpeg = resolve("node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe");
const manifest = [];
for (const [file, slug] of clips) {
  console.log(`Preparando ${slug}`);
  execFileSync(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", "-i", resolve("VIDEOS", file), "-vf", "scale=540:-2", "-c:v", "libx264", "-preset", "fast", "-crf", "25", "-pix_fmt", "yuv420p", "-an", "-movflags", "+faststart", `${output}/${slug}-silent.mp4`]);
  execFileSync(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", "-ss", "2", "-i", `${output}/${slug}-silent.mp4`, "-frames:v", "1", `${output}/${slug}-poster.jpg`]);
  manifest.push({ source: file, video: `${slug}-silent.mp4`, poster: `${slug}-poster.jpg` });
}
await writeFile(`${output}/sources.json`, JSON.stringify({ photos, clips: manifest }, null, 2));
console.log(`Listo: ${(await readdir(output)).length} recursos`);
