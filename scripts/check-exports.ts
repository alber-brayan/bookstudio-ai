import fs from "node:fs/promises";
import assert from "node:assert/strict";
import type { Project, RenderJob } from "../src/lib/schema";
const origin = process.env.BOOKSTUDIO_ORIGIN || "http://127.0.0.1:3000";
const source = JSON.parse(
  await fs.readFile("data/verification/smoke.json", "utf8"),
) as { project: Project };
async function post<T>(url: string, data: unknown): Promise<T> {
  const r = await fetch(origin + url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = await r.json();
  assert.ok(r.ok, JSON.stringify(body));
  return body;
}
// An original, locally generated 440 Hz test tone in a PCM WAV container.
const samples = 44100,
  wav = Buffer.alloc(44 + samples * 2);
wav.write("RIFF", 0);
wav.writeUInt32LE(wav.length - 8, 4);
wav.write("WAVEfmt ", 8);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(samples, 24);
wav.writeUInt32LE(samples * 2, 28);
wav.writeUInt16LE(2, 32);
wav.writeUInt16LE(16, 34);
wav.write("data", 36);
wav.writeUInt32LE(samples * 2, 40);
for (let i = 0; i < samples; i++)
  wav.writeInt16LE(
    Math.round(Math.sin((i * 2 * Math.PI * 440) / samples) * 1800),
    44 + i * 2,
  );
const form = new FormData();
form.append(
  "file",
  new File([wav], "local-test-tone.wav", { type: "audio/wav" }),
);
const uploaded = await fetch(origin + "/api/audio", {
  method: "POST",
  body: form,
});
const audio = await uploaded.json();
assert.ok(uploaded.ok, JSON.stringify(audio));
const p: Project = {
  ...source.project,
  name: "QA · Formatos y audio",
  scenes: [
    {
      ...source.project.scenes[0],
      duration: 1,
      movement: "final",
      transition: "cut",
    },
  ],
};
const webp = await post<RenderJob>("/api/render", {
  project: { ...p, format: "portrait" },
  kind: "webp",
  quality: "1080p",
  frame: 15,
});
const transparent = await post<RenderJob>("/api/render", {
  project: {
    ...p,
    scenes: p.scenes.map((s) => ({
      ...s,
      title: "",
      subtitle: "",
      cta: "",
      price: "",
    })),
  },
  kind: "png",
  quality: "1080p",
  frame: 15,
  transparent: true,
});
const audioVideo = await post<RenderJob>("/api/render", {
  project: { ...p, audio: audio.name },
  kind: "video",
  quality: "preview",
});
const pending = await post<RenderJob>("/api/render", {
  project: p,
  kind: "video",
  quality: "preview",
});
const cancelled = await fetch(origin + "/api/render", {
  method: "DELETE",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ id: pending.id }),
});
assert.ok(cancelled.ok);
const jobs = (await fetch(origin + "/api/render").then((r) =>
  r.json(),
)) as RenderJob[];
assert.equal(jobs.find((j) => j.id === pending.id)?.status, "cancelled");
const report = {
  webp: webp.id,
  transparent: transparent.id,
  audioVideo: audioVideo.id,
  cancelled: pending.id,
  cancelledWhileQueued: true,
};
await fs.writeFile(
  "data/verification/extra-exports.json",
  JSON.stringify(report, null, 2),
);
console.log(report);
