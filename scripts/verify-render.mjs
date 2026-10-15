import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import sharp from "sharp";
const execute = promisify(execFile);
const root = path.resolve("data/verification");
const real = process.argv.includes("--real");
const prefix = real ? "real-" : "";
const smoke = JSON.parse(
  await fs.readFile(
    path.join(root, real ? "real-book.json" : "smoke.json"),
    "utf8",
  ),
);
const native = path.resolve("node_modules/@remotion/compositor-win32-x64-msvc");
const video = path.resolve(`data/exports/${smoke.video}.mp4`),
  still = path.resolve(`data/exports/${smoke.still}.png`);
const meta = await sharp(still).metadata();
assert.equal(meta.width, 1920);
assert.equal(meta.height, 1080);
const roi = await sharp(still)
  .extract({ left: 960, top: 60, width: 800, height: 850 })
  .removeAlpha()
  .raw()
  .toBuffer();
let bright = 0;
for (let i = 0; i < roi.length; i += 3) {
  if (roi[i] > 140 && roi[i + 1] > 140 && roi[i + 2] > 140) bright++;
}
assert.ok(
  bright > 30000,
  "El producto no aparece en la región de la imagen esperada.",
);
const probe = await execute(
  path.join(native, "ffprobe.exe"),
  [
    "-v",
    "error",
    "-show_entries",
    "format=duration:stream=codec_name,width,height,r_frame_rate,nb_frames",
    "-of",
    "json",
    video,
  ],
  { windowsHide: true },
);
const info = JSON.parse(probe.stdout);
const track = info.streams.find((s) => s.codec_name === "h264");
assert.ok(track, "Falta H.264");
assert.equal(track.width, 1920);
assert.equal(track.height, 1080);
assert.equal(track.r_frame_rate, "30/1");
assert.equal(Number(track.nb_frames), 450);
assert.ok(Math.abs(Number(info.format.duration) - 15) < 0.05);
await execute(
  path.join(native, "ffmpeg.exe"),
  ["-v", "error", "-i", video, "-c:v", "rawvideo", "-an", "-f", "null", "-"],
  { windowsHide: true },
);
for (const seconds of [1, 7, 13]) {
  await execute(
    path.join(native, "ffmpeg.exe"),
    [
      "-v",
      "error",
      "-y",
      "-ss",
      String(seconds),
      "-i",
      video,
      "-frames:v",
      "1",
      path.join(root, `${prefix}video-${seconds}s.png`),
    ],
    { windowsHide: true },
  );
}
const report = {
  verifiedAt: new Date().toISOString(),
  video,
  still,
  duration: Number(info.format.duration),
  videoStream: track,
  decodedWithoutErrors: true,
  stillProductBrightPixels: bright,
  framesForVisualInspection: [1, 7, 13].map((s) => `${prefix}video-${s}s.png`),
};
try {
  const extra = JSON.parse(
    await fs.readFile(path.join(root, "extra-exports.json"), "utf8"),
  );
  const vertical = await sharp(
    path.resolve(`data/exports/${extra.webp}.webp`),
  ).metadata();
  assert.equal(vertical.width, 1080);
  assert.equal(vertical.height, 1920);
  const alpha = (
    await sharp(path.resolve(`data/exports/${extra.transparent}.png`)).stats()
  ).channels[3];
  assert.equal(alpha.min, 0);
  assert.equal(alpha.max, 255);
  const audioProbe = await execute(
    path.join(native, "ffprobe.exe"),
    [
      "-v",
      "error",
      "-show_entries",
      "stream=codec_name",
      "-of",
      "json",
      path.resolve(`data/exports/${extra.audioVideo}.mp4`),
    ],
    { windowsHide: true },
  );
  assert.ok(
    JSON.parse(audioProbe.stdout).streams.some(
      (stream) => stream.codec_name === "aac",
    ),
  );
  report.extraExports = {
    verticalWebP: "1080x1920",
    transparentPNG: true,
    audioAAC: true,
    cancelledWhileQueued: extra.cancelledWhileQueued,
  };
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
await fs.writeFile(
  path.join(root, `${prefix}render-report.json`),
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report, null, 2));
