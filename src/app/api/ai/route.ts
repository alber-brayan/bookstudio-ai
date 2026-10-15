import { NextResponse } from "next/server";
import OpenAI, { toFile } from "openai";
import { z } from "zod";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { db, newId, safeAsset } from "@/server/storage";
import { failure, localMutation } from "@/server/http";
import type { Asset } from "@/lib/schema";
const models = [
  "gpt-image-2.5-sunburst",
  "gpt-image-2.5-flare",
  "gpt-image-2",
] as const;
const month = () => new Date().toISOString().slice(0, 7);
const limit = () =>
  Math.max(0, Number(process.env.AI_MONTHLY_REQUEST_LIMIT || 10) || 0);
const count = () =>
  Number(
    db.prepare("SELECT COUNT(*) as n FROM ai_usage WHERE month=?").get(month())
      ?.n || 0,
  );
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("asset");
  const versions = id
    ? db
        .prepare(
          "SELECT json FROM ai_cache WHERE json_extract(json,'$.assetId')=? ORDER BY rowid DESC",
        )
        .all(id)
        .map((r) => JSON.parse(r.json as string))
    : [];
  return NextResponse.json({
    enabled: Boolean(process.env.OPENAI_API_KEY),
    models,
    model: process.env.OPENAI_IMAGE_MODEL || models[0],
    used: count(),
    limit: limit(),
    versions,
  });
}
export async function POST(req: Request) {
  try {
    localMutation(req);
    const data = z
      .object({
        assetId: z.string().uuid(),
        model: z.enum(models),
        prompt: z.string().min(5).max(3000),
        consent: z.literal(true),
      })
      .parse(await req.json());
    if (!process.env.OPENAI_API_KEY)
      throw new Error(
        "Configura OPENAI_API_KEY en .env.local y reinicia el servidor.",
      );
    const row = db
      .prepare("SELECT metadata FROM assets WHERE id=?")
      .get(data.assetId) as { metadata: string } | undefined;
    if (!row) throw new Error("Imagen no encontrada.");
    const asset = JSON.parse(row.metadata) as Asset;
    const key = createHash("sha256")
      .update(JSON.stringify([asset.texture, data.model, data.prompt]))
      .digest("hex");
    const cached = db
      .prepare("SELECT json FROM ai_cache WHERE key=?")
      .get(key) as { json: string } | undefined;
    if (cached)
      return NextResponse.json({ ...JSON.parse(cached.json), cached: true });
    if (count() >= limit())
      throw new Error(
        "Límite mensual de solicitudes alcanzado. Ajusta AI_MONTHLY_REQUEST_LIMIT en el servidor.",
      );
    const usageId = newId();
    db.prepare("INSERT INTO ai_usage VALUES(?,?,?)").run(
      usageId,
      month(),
      "reserved",
    );
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      maxRetries: 0,
      timeout: 180000,
    });
    try {
      const response = await client.images.edit(
        {
          model: data.model,
          image: await toFile(
            await readFile(safeAsset(asset.texture)),
            "product.png",
            { type: "image/png" },
          ),
          prompt:
            "Edit this real commercial book photograph. Preserve all printed text, logos, barcode, illustrations and corporate colors exactly. Do not invent missing content. Requested changes: " +
            data.prompt,
          size: "1024x1024",
          quality: "medium",
          n: 1,
        },
        { signal: req.signal },
      );
      const b64 = response.data?.[0]?.b64_json;
      if (!b64) throw new Error("La API no devolvió una imagen.");
      const texture = `${newId()}-ai.png`;
      await writeFile(safeAsset(texture), Buffer.from(b64, "base64"));
      const result = {
        id: newId(),
        assetId: asset.id,
        texture,
        model: data.model,
        prompt: data.prompt,
        createdAt: new Date().toISOString(),
        usage: response.usage || null,
      };
      db.prepare("INSERT INTO ai_cache VALUES(?,?,?)").run(
        key,
        JSON.stringify(result),
        month(),
      );
      db.prepare("UPDATE ai_usage SET status=? WHERE id=?").run(
        "completed",
        usageId,
      );
      return NextResponse.json(result);
    } catch (e) {
      db.prepare("UPDATE ai_usage SET status=? WHERE id=?").run(
        "failed-or-unknown",
        usageId,
      );
      throw e;
    }
  } catch (e) {
    return failure(e);
  }
}
