import { z } from "zod";
export const pointSchema = z.tuple([
  z.number().min(0).max(1),
  z.number().min(0).max(1),
]);
export type Point = z.infer<typeof pointSchema>;
export const movements = [
  "hero",
  "orbit",
  "dolly",
  "panorama",
  "floating",
  "turntable",
  "fan",
  "exploded",
  "front-back",
  "final",
] as const;
export const movementNames: Record<(typeof movements)[number], string> = {
  hero: "Hero reveal",
  orbit: "Product orbit",
  dolly: "Slow dolly in",
  panorama: "Panoramic showcase",
  floating: "Floating product",
  turntable: "Premium turntable",
  fan: "Multi-book fan",
  exploded: "Exploded showcase",
  "front-back": "Front to back",
  final: "Final hero shot",
};
export const studios = [
  "black",
  "white",
  "emerald",
  "gold",
  "soft",
  "dramatic",
] as const;
export const studioNames = {
  black: "Luxury Black",
  white: "Minimal White",
  emerald: "Emerald Premium",
  gold: "Cinematic Gold",
  soft: "Soft Commercial",
  dramatic: "Dramatic Reveal",
};
const assetName = z.string().regex(/^[a-zA-Z0-9_-]+\.(png|jpg|webp)$/);
export const assetSchema = z.object({
  id: z.string().uuid(),
  original: assetName,
  texture: assetName,
  name: z.string().max(300),
  width: z.number().positive(),
  height: z.number().positive(),
  corners: z.array(pointSchema).length(4),
  warnings: z.array(z.string()),
  hash: z.string(),
  aiAccepted: z.boolean().optional(),
  processingVersion: z.string().optional(),
});
export type Asset = z.infer<typeof assetSchema>;
export const bookSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(120),
  front: assetSchema.nullable(),
  back: assetSchema.nullable(),
  width: z.number().min(8).max(40),
  height: z.number().min(10).max(60),
  thickness: z.number().min(0.2).max(10),
  spineColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  spineText: z.string().max(120),
  finish: z.enum(["matte", "satin", "gloss"]),
  hardcover: z.boolean(),
});
export type Book = z.infer<typeof bookSchema>;
export const sceneSchema = z.object({
  id: z.string(),
  name: z.string().max(100),
  duration: z.number().min(1).max(60),
  movement: z.enum(movements),
  studio: z.enum(studios),
  title: z.string().max(200),
  brand: z.string().max(80).optional(),
  showText: z.boolean().optional(),
  subtitle: z.string().max(300),
  price: z.string().max(40),
  cta: z.string().max(80),
  transition: z.enum(["cut", "fade"]),
  speed: z.number().min(0.2).max(2),
  fov: z.number().min(20).max(80),
  light: z.number().min(0.2).max(3),
  bookIds: z.array(z.string()).max(12),
});
export type Scene = z.infer<typeof sceneSchema>;
export function booksForScene(books: Book[], scene: Scene): Book[] {
  const selection = scene.bookIds.length
    ? books.filter((book) => scene.bookIds.includes(book.id))
    : books;
  return selection.slice(
    0,
    ["fan", "panorama", "exploded"].includes(scene.movement) ? 5 : 1,
  );
}
export function assertRenderProducts(project: Project) {
  for (const scene of project.scenes) {
    const books = booksForScene(project.books, scene);
    if (!books.length)
      throw new Error(
        `La escena «${scene.name}» no tiene un producto asignado.`,
      );
    const incomplete = books.find((book) => !book.front || !book.back);
    if (incomplete)
      throw new Error(
        `Completa la portada y contraportada de «${incomplete.name}» antes de exportar esta escena.`,
      );
  }
}
export const projectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(120),
  books: z.array(bookSchema).max(200),
  scenes: z.array(sceneSchema).min(1).max(40),
  fps: z.union([z.literal(24), z.literal(30), z.literal(60)]),
  format: z.enum(["landscape", "portrait", "square"]),
  performance: z.enum(["low", "medium", "high"]),
  exportQuality: z.enum(["preview", "720p", "1080p"]).optional(),
  useProxies: z.boolean().optional(),
  showText: z.boolean().optional(),
  audio: z.string().nullable(),
  updatedAt: z.string(),
});
export type Project = z.infer<typeof projectSchema>;
export type ExportQuality = "preview" | "720p" | "1080p" | "4k";
export type RenderJob = {
  id: string;
  status: "queued" | "rendering" | "done" | "error" | "cancelled";
  progress: number;
  message: string;
  file: string | null;
  createdAt: string;
  kind: "video" | "png" | "webp";
  projectName: string;
  projectId?: string;
  output?: {
    width: number;
    height: number;
    fps: number;
    duration: number;
    quality: ExportQuality;
    format: Project["format"];
  };
};
export const makeBook = (name = "Libro sin título"): Book => ({
  id: crypto.randomUUID(),
  name,
  front: null,
  back: null,
  width: 21,
  height: 28,
  thickness: 1.6,
  spineColor: "#173d33",
  spineText: "",
  finish: "satin",
  hardcover: false,
});
export const makeScene = (bookIds: string[] = []): Scene => ({
  id: crypto.randomUUID(),
  name: "Plano de apertura",
  duration: 5,
  movement: "hero",
  studio: "emerald",
  title: "Ideas que\nabren mundos.",
  brand: "BOOKSTUDIO",
  subtitle: "Una nueva forma de descubrir tus libros.",
  price: "",
  cta: "",
  transition: "fade",
  speed: 1,
  fov: 35,
  light: 1,
  bookIds,
});
export const makeProject = (): Project => ({
  id: crypto.randomUUID(),
  name: "Mi primera producción",
  books: [],
  scenes: [makeScene()],
  fps: 30,
  format: "landscape",
  performance: "medium",
  useProxies: true,
  showText: true,
  audio: null,
  updatedAt: new Date().toISOString(),
});
export function locateScene(scenes: Scene[], frame: number, fps: number) {
  let start = 0;
  for (let i = 0; i < scenes.length; i++) {
    const duration = Math.round(scenes[i].duration * fps);
    if (frame < start + duration || i === scenes.length - 1)
      return {
        scene: scenes[i],
        index: i,
        localFrame: Math.max(0, frame - start),
        duration,
        start,
      };
    start += duration;
  }
  throw new Error("El proyecto necesita una escena.");
}
export const totalFrames = (project: Project) =>
  project.scenes.reduce((s, v) => s + Math.round(v.duration * project.fps), 0);
export const dimensions = (
  format: Project["format"],
  quality: ExportQuality = "1080p",
) => {
  const h =
    quality === "4k"
      ? 2160
      : quality === "preview"
        ? 360
        : quality === "720p"
          ? 720
          : 1080;
  return format === "portrait"
    ? { width: h, height: Math.round((h * 16) / 9) }
    : format === "square"
      ? { width: h, height: h }
      : { width: Math.round((h * 16) / 9), height: h };
};
export function pairFiles(names: string[]) {
  const groups = new Map<
    string,
    { front?: number; back?: number; unassigned: number[] }
  >();
  names.forEach((name, index) => {
    const base = name.replace(/\.[^.]+$/, "");
    const match = base.match(
      /^(.*?)[_\s-]*(contraportada|portada|front|frontal|reversa|back|posterior)$/i,
    );
    const key = (match?.[1] || base).replace(/[_\s-]+$/, "").toLowerCase();
    const g = groups.get(key) || { unassigned: [] };
    const side = match
      ? /^(portada|front|frontal)$/i.test(match[2])
        ? "front"
        : "back"
      : null;
    if (side && g[side] === undefined) g[side] = index;
    else g.unassigned.push(index);
    groups.set(key, g);
  });
  return [...groups].map(([name, g]) => ({
    name,
    ...g,
    uncertain:
      g.front === undefined || g.back === undefined || g.unassigned.length > 0,
  }));
}
