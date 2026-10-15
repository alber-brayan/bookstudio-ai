/** Real HTTP integration test. Requires localhost:3000. Produces local test assets. */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import {
  makeProject,
  makeBook,
  type Asset,
  type RenderJob,
} from "../src/lib/schema";
import { scenesFromTemplate } from "../src/lib/templates";
const origin = process.env.BOOKSTUDIO_ORIGIN || "http://127.0.0.1:3000";
async function call<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(
    origin + url,
    body
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json", Origin: origin },
          body: JSON.stringify(body),
        }
      : undefined,
  );
  const json = await res.json();
  assert.ok(res.ok, JSON.stringify(json));
  return json as T;
}
const root = path.resolve("data", "verification");
await fs.mkdir(root, { recursive: true });
const images: Asset[] = [];
for (const side of ["FRONT", "BACK"]) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200"><rect width="900" height="1200" fill="#303438"/><path d="M120 100 L790 145 L740 1090 L80 1020 Z" fill="${side === "FRONT" ? "#e3ddc5" : "#b7ccae"}" stroke="#151a14" stroke-width="8"/><g fill="#22482e" font-family="Arial"><text x="180" y="280" font-size="65" font-weight="bold">BOOKSTUDIO</text><text x="170" y="380" font-size="52">${side === "FRONT" ? "FÍSICA 2027" : "CONTRAPORTADA"}</text><text x="160" y="510" font-size="30">PRUEBA LOCAL / TEXTO ORIGINAL</text><text x="160" y="570" font-size="25">No IA. Fotografía sintética de verificación.</text></g><rect x="170" y="680" width="300" height="160" fill="#8a3830"/></svg>`;
  const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
  await fs.writeFile(path.join(root, `TEST_${side}.png`), buffer);
  const form = new FormData();
  form.append(
    "file",
    new File([new Uint8Array(buffer)], `TEST_${side}.png`, {
      type: "image/png",
    }),
  );
  const res = await fetch(origin + "/api/import", {
    method: "POST",
    body: form,
    headers: { Origin: origin },
  });
  const data = await res.json();
  assert.ok(res.ok, JSON.stringify(data));
  images.push(data.asset);
  const duplicateForm = new FormData();
  duplicateForm.append(
    "file",
    new File([new Uint8Array(buffer)], `TEST_${side}.png`, {
      type: "image/png",
    }),
  );
  const dup = await fetch(origin + "/api/import", {
    method: "POST",
    body: duplicateForm,
  }).then((r) => r.json());
  assert.equal(dup.duplicate, true);
  assert.equal(dup.asset.id, data.asset.id);
}
const corrected = await call<Asset>("/api/correct", {
  id: images[0].id,
  corners: [
    [120 / 899, 100 / 1199],
    [790 / 899, 145 / 1199],
    [740 / 899, 1090 / 1199],
    [80 / 899, 1020 / 1199],
  ],
  ratio: 0.7,
});
assert.notEqual(corrected.texture, images[0].texture);
const book = {
  ...makeBook("Verificación del flujo central"),
  front: corrected,
  back: images[1],
  thickness: 2.3,
  width: 19.6,
};
const project = {
  ...makeProject(),
  name: "QA · Flujo central 15 segundos",
  books: [book],
  scenes: scenesFromTemplate(0, [book.id]),
};
await call("/api/projects", project);
const stored = await call<typeof project>(`/api/projects?id=${project.id}`);
assert.equal(stored.books[0].thickness, 2.3);
assert.equal(stored.scenes.length, 3);
const ai = await call<{ enabled: boolean }>("/api/ai");
console.log(
  JSON.stringify({
    step: "import-correct-persist",
    success: true,
    aiEnabled: ai.enabled,
    projectId: project.id,
    assets: images.map((a) => a.id),
  }),
);
const still = await call<RenderJob>("/api/render", {
  project,
  kind: "png",
  quality: "1080p",
  frame: 60,
});
const video = await call<RenderJob>("/api/render", {
  project,
  kind: "video",
  quality: "1080p",
});
await fs.writeFile(
  path.join(root, "smoke.json"),
  JSON.stringify({ project, still: still.id, video: video.id }, null, 2),
);
console.log(
  JSON.stringify({
    step: "render-enqueued",
    still: still.id,
    video: video.id,
    frames: 450,
    resolution: "1920x1080",
    report: "data/verification/smoke.json",
  }),
);
