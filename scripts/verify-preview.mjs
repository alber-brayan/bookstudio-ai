import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import sharp from "sharp";
const execute = promisify(execFile);
const reportPath = "data/verification/preview-report.json";
const report = JSON.parse(await fs.readFile(reportPath, "utf8"));
const native = path.resolve("node_modules/@remotion/compositor-win32-x64-msvc");
const video = path.resolve(`data/exports/${report.jobs.video}.mp4`);
const still = path.resolve(`data/exports/${report.jobs.png}.png`);
const meta = await sharp(still).metadata();
assert.equal(meta.width, 1080);
assert.equal(meta.height, 1920);
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
const info = JSON.parse(probe.stdout),
  track = info.streams.find((s) => s.codec_name === "h264");
assert.ok(track);
assert.equal(track.width, 1080);
assert.equal(track.height, 1920);
assert.equal(track.r_frame_rate, "30/1");
assert.equal(Number(track.nb_frames), 60);
assert.ok(Math.abs(Number(info.format.duration) - 2) < 0.05);
await execute(
  path.join(native, "ffmpeg.exe"),
  ["-v", "error", "-i", video, "-c:v", "rawvideo", "-an", "-f", "null", "-"],
  { windowsHide: true },
);
for (const seconds of [0.25, 1, 1.75])
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
      path.resolve(`data/verification/vertical-video-${seconds}s.png`),
    ],
    { windowsHide: true },
  );
report.renderVerifiedAt = new Date().toISOString();
report.videoStream = track;
report.duration = Number(info.format.duration);
report.decodedWithoutErrors = true;
await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
console.log(report);
