import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import sharp from "sharp";
import { assetDir, db, newId, safeAsset } from "@/server/storage";
import { processPhoto, PROCESSING_VERSION } from "@/server/process";
import { failure, localMutation } from "@/server/http";
import type { Asset } from "@/lib/schema";
export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    localMutation(req);
    if (Number(req.headers.get("content-length")) > 32 * 1024 * 1024)
      throw new Error("Máximo 30 MB por archivo.");
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("Selecciona una fotografía.");
    if (file.size > 30 * 1024 * 1024 || file.size === 0)
      throw new Error("Archivo vacío o superior a 30 MB.");
    const buffer = Buffer.from(await file.arrayBuffer());
    const meta = await sharp(buffer, {
      limitInputPixels: 60_000_000,
    }).metadata();
    if (!["jpeg", "png", "webp"].includes(meta.format || ""))
      throw new Error("Solo se admiten JPEG, PNG y WebP.");
    const hash = createHash("sha256").update(buffer).digest("hex");
    const cached = db
      .prepare("SELECT metadata FROM assets WHERE hash=?")
      .get(hash) as { metadata: string } | undefined;
    if (cached) {
      const asset = JSON.parse(cached.metadata) as Asset;
      // Preserve intentional manual crops. The editor can run a newer detector.
      return NextResponse.json({ asset, duplicate: true });
    }
    const id = newId(),
      original = `${id}-original.png`,
      texture = `${id}-corrected.png`;
    await writeFile(
      safeAsset(`${id}-source.${meta.format === "jpeg" ? "jpg" : meta.format}`),
      buffer,
    );
    await sharp(buffer).rotate().png().toFile(safeAsset(original));
    const result = await processPhoto(safeAsset(original), safeAsset(texture));
    const asset: Asset = {
      id,
      original,
      texture,
      name: file.name,
      width: result.width,
      height: result.height,
      corners: result.corners,
      warnings: result.warnings,
      hash,
      processingVersion: PROCESSING_VERSION,
    };
    db.prepare("INSERT INTO assets VALUES(?,?,?)").run(
      id,
      hash,
      JSON.stringify(asset),
    );
    return NextResponse.json({
      asset,
      duplicate: false,
      local: true,
      directory: assetDir.split(/[\\/]/).at(-1),
    });
  } catch (e) {
    return failure(e);
  }
}
