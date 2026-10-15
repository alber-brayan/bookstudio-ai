import fs from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import sharp from "sharp";
import { dataDir, safeAsset } from "./storage";
import { proxySizes } from "../lib/preview";
const pending = new Map<string, Promise<string>>();
/** Immutable derivatives: the texture filename changes on every correction. */
export async function imageProxy(name: string, size: number) {
  if (!proxySizes.some((value) => value === size))
    throw new Error("Tamaño de proxy no válido.");
  if (!/\.(png|jpg|webp)$/.test(name))
    throw new Error("Solo las imágenes admiten proxies.");
  const source = safeAsset(name);
  const key = createHash("sha256")
    .update(`webp-v1:${name}:${size}`)
    .digest("hex");
  const dir = path.join(dataDir, "proxies"),
    target = path.join(dir, `${key}.webp`);
  try {
    await fs.access(target);
    return target;
  } catch {}
  const current = pending.get(key);
  if (current) return current;
  const work = (async () => {
    await fs.mkdir(dir, { recursive: true });
    const buffer = await sharp(source)
      .resize({
        width: size,
        height: size,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 76, effort: 2 })
      .toBuffer();
    const temporary = `${target}.${randomUUID()}.tmp`;
    await fs.writeFile(temporary, buffer);
    await fs.rename(temporary, target);
    return target;
  })();
  pending.set(key, work);
  try {
    return await work;
  } finally {
    pending.delete(key);
  }
}
