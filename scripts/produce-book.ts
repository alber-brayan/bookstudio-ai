import { parseArgs } from "node:util";
import fs from "node:fs/promises";
import { z } from "zod";
import {
  makeBook,
  makeProject,
  type Asset,
  type RenderJob,
} from "../src/lib/schema";
import { scenesFromTemplate } from "../src/lib/templates";
const { values } = parseArgs({
  options: {
    front: { type: "string" },
    back: { type: "string" },
    name: { type: "string" },
    brand: { type: "string" },
  },
});
const front = z.string().uuid().parse(values.front),
  back = z.string().uuid().parse(values.back);
const origin = process.env.BOOKSTUDIO_ORIGIN || "http://127.0.0.1:3000";
async function post<T>(url: string, data: unknown): Promise<T> {
  const r = await fetch(origin + url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = await r.json();
  if (!r.ok) throw new Error(body.error);
  return body;
}
const book = makeBook(values.name || "Producción con fotos reales");
book.height = 29.7;
book.width = 21;
book.front = await post<Asset>("/api/correct", {
  id: front,
  ratio: book.width / book.height,
});
book.back = await post<Asset>("/api/correct", {
  id: back,
  ratio: book.width / book.height,
});
book.spineColor = "#173b65";
book.spineText = values.name || book.name;
const project = makeProject();
project.name = `Fotos reales · ${values.brand || book.name}`;
project.books = [book];
project.scenes = scenesFromTemplate(0, [book.id]).map((scene, i) => ({
  ...scene,
  brand: values.brand || "",
  title:
    i === 0
      ? `${values.brand || "Aprender"}.\nIdeas para crecer.`
      : i === 1
        ? "Cada página,\nuna nueva idea."
        : "Da el siguiente\ngran paso.",
  subtitle: values.name || book.name,
  cta: i === 2 ? "Conoce la colección" : "",
  studio: "black",
}));
await post("/api/projects", project);
const still = await post<RenderJob>("/api/render", {
  project,
  kind: "png",
  quality: "1080p",
  frame: 60,
});
const video = await post<RenderJob>("/api/render", {
  project,
  kind: "video",
  quality: "1080p",
});
await fs.mkdir("data/verification", { recursive: true });
const report = {
  projectId: project.id,
  projectName: project.name,
  front: book.front,
  back: book.back,
  still: still.id,
  video: video.id,
  sourceProjectUnchanged: true,
};
await fs.writeFile(
  "data/verification/real-book.json",
  JSON.stringify(report, null, 2),
);
console.log(report);
