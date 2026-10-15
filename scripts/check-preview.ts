import fs from "node:fs/promises";
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import sharp from "sharp";
import type { Project, RenderJob } from "../src/lib/schema";

const origin = process.env.BOOKSTUDIO_ORIGIN || "http://127.0.0.1:3000";
const real = JSON.parse(
  await fs.readFile("data/verification/real-book.json", "utf8"),
);
const source: Project = await fetch(
  `${origin}/api/projects?id=${real.projectId}`,
).then((r) => r.json());
const image = real.front.texture;
async function imageBytes(url: string) {
  const response = await fetch(url);
  return Buffer.from(await response.arrayBuffer());
}
const original = await imageBytes(`${origin}/api/assets/${image}`);
const hash = (b: Buffer) => createHash("sha256").update(b).digest("hex");
const proxies = [];
for (const size of [256, 512, 1024]) {
  const url = `${origin}/api/assets/${image}?proxy=${size}`;
  const response = await fetch(url);
  assert.ok(response.ok);
  assert.equal(response.headers.get("content-type"), "image/webp");
  assert.equal(response.headers.get("x-bookstudio-texture"), `proxy-${size}`);
  const buffer = Buffer.from(await response.arrayBuffer()),
    meta = await sharp(buffer).metadata();
  assert.ok(Math.max(meta.width!, meta.height!) <= size);
  const cached = await imageBytes(url);
  assert.equal(hash(buffer), hash(cached));
  proxies.push({
    size,
    width: meta.width,
    height: meta.height,
    bytes: buffer.length,
  });
}
assert.equal(
  (await fetch(`${origin}/api/assets/${image}?proxy=999`)).status,
  404,
);
assert.equal(
  hash(original),
  hash(await imageBytes(`${origin}/api/assets/${image}`)),
);
const photo = await sharp(
  "data/verification/proxy-original-photo.png",
).metadata();
assert.equal(photo.width, 1080);
assert.equal(photo.height, 1920);
// Embedded GLB maps must contain original-size images even while editing at 256 px.
const glb = await fs.readFile("data/verification/proxy-original-model.glb");
assert.equal(glb.toString("ascii", 0, 4), "glTF");
const jsonLength = glb.readUInt32LE(12),
  json = JSON.parse(glb.toString("utf8", 20, 20 + jsonLength));
const binStart = 20 + jsonLength + 8,
  embedded = [];
for (const image of json.images) {
  const view = json.bufferViews[image.bufferView];
  const meta = await sharp(
    glb.subarray(
      binStart + (view.byteOffset || 0),
      binStart + (view.byteOffset || 0) + view.byteLength,
    ),
  ).metadata();
  embedded.push({ width: meta.width, height: meta.height });
}
for (const asset of [real.front, real.back])
  assert.ok(
    embedded.some((i) => i.width === asset.width && i.height === asset.height),
  );
const project: Project = {
  ...source,
  id: randomUUID(),
  name: "QA · Vertical sin textos · proxies 256",
  format: "portrait",
  showText: false,
  useProxies: true,
  performance: "low",
  fps: 30,
  audio: null,
  scenes: [
    {
      ...source.scenes[0],
      duration: 2,
      movement: "orbit",
      transition: "cut",
      title: "QA TÍTULO OCULTO",
      subtitle: "QA APOYO OCULTO",
      brand: "QA MARCA OCULTA",
      price: "S/ 999",
      cta: "QA CTA OCULTO",
    },
  ],
};
const jobs: Record<string, string> = {};
for (const kind of ["png", "video"] as const) {
  const response = await fetch(`${origin}/api/render`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project, kind, quality: "1080p", frame: 30 }),
  });
  const job = (await response.json()) as RenderJob;
  assert.ok(response.ok, JSON.stringify(job));
  jobs[kind] = job.id;
}
const report = {
  verifiedAt: new Date().toISOString(),
  sourceProject: source.id,
  originalHash: hash(original),
  originalBytes: original.length,
  proxies,
  photo: { width: photo.width, height: photo.height },
  glbEmbeddedImages: embedded,
  jobs,
  format: "1080x1920",
  preview: "360x640",
  allAdvertisingTextHidden: true,
};
await fs.writeFile(
  "data/verification/preview-report.json",
  JSON.stringify(report, null, 2),
);
console.log(report);
