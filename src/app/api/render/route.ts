import { NextResponse } from "next/server";
import { z } from "zod";
import { projectSchema, totalFrames, assertRenderProducts } from "@/lib/schema";
import { enqueue, cancel } from "@/server/queue";
import { listJobs } from "@/server/storage";
import { failure, localMutation } from "@/server/http";
export const runtime = "nodejs";
export async function GET() {
  return NextResponse.json(listJobs());
}
export async function POST(req: Request) {
  try {
    localMutation(req);
    const data = z
      .object({
        project: projectSchema,
        kind: z.enum(["video", "png", "webp"]),
        quality: z.enum(["preview", "720p", "1080p", "4k"]).default("1080p"),
        frame: z.number().int().min(0).default(0),
        transparent: z.boolean().default(false),
      })
      .parse(await req.json());
    assertRenderProducts(data.project);
    if (data.quality === "4k")
      throw new Error(
        "4K todavía no está habilitado: requiere validación en este equipo.",
      );
    return NextResponse.json(
      enqueue(
        data.project,
        data.kind,
        data.quality,
        Math.min(data.frame, totalFrames(data.project) - 1),
        data.transparent,
      ),
    );
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(req: Request) {
  try {
    localMutation(req);
    const { id } = z.object({ id: z.string().uuid() }).parse(await req.json());
    cancel(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
