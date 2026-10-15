import { NextResponse } from "next/server";
import { z } from "zod";
import { pointSchema, type Asset } from "@/lib/schema";
import { db, newId, safeAsset } from "@/server/storage";
import { processPhoto, PROCESSING_VERSION } from "@/server/process";
import { failure, localMutation } from "@/server/http";
export async function GET(req: Request) {
  try {
    const id = z.string().uuid().parse(new URL(req.url).searchParams.get("id"));
    const row = db.prepare("SELECT metadata FROM assets WHERE id=?").get(id) as
      { metadata: string } | undefined;
    if (!row) throw new Error("Imagen no encontrada.");
    return NextResponse.json(JSON.parse(row.metadata));
  } catch (e) {
    return failure(e, 404);
  }
}
export async function POST(req: Request) {
  try {
    localMutation(req);
    const input = z
      .object({
        id: z.string().uuid(),
        corners: z.array(pointSchema).length(4).optional(),
        ratio: z.number().min(0.2).max(2).optional(),
      })
      .parse(await req.json());
    const row = db
      .prepare("SELECT metadata FROM assets WHERE id=?")
      .get(input.id) as { metadata: string } | undefined;
    if (!row) throw new Error("Fotografía no encontrada.");
    const asset = JSON.parse(row.metadata) as Asset;
    const texture = `${input.id}-${newId()}.png`;
    const result = await processPhoto(
      safeAsset(asset.original),
      safeAsset(texture),
      input.corners,
      input.ratio,
    );
    const updated: Asset = {
      ...asset,
      texture,
      corners: result.corners,
      width: result.width,
      height: result.height,
      warnings: result.warnings,
      processingVersion: PROCESSING_VERSION,
    };
    db.prepare("UPDATE assets SET metadata=? WHERE id=?").run(
      JSON.stringify(updated),
      input.id,
    );
    return NextResponse.json(updated);
  } catch (e) {
    return failure(e);
  }
}
