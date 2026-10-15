import { open, stat } from "node:fs/promises";
import { safeExport } from "@/server/storage";
import { failure } from "@/server/http";
export async function GET(
  req: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  try {
    const { name } = await params;
    const file = safeExport(name);
    const info = await stat(file);
    const range = req.headers.get("range");
    let start = 0,
      end = info.size - 1;
    if (range) {
      const m = range.match(/^bytes=(\d+)-(\d*)$/);
      if (!m) return new Response(null, { status: 416 });
      start = Number(m[1]);
      end = m[2] ? Math.min(Number(m[2]), end) : end;
      if (start > end) return new Response(null, { status: 416 });
    }
    const handle = await open(file, "r");
    const buffer = Buffer.alloc(end - start + 1);
    try {
      await handle.read(buffer, 0, buffer.length, start);
    } finally {
      await handle.close();
    }
    const headers: Record<string, string> = {
      "Content-Type": name.endsWith(".mp4")
        ? "video/mp4"
        : name.endsWith(".webp")
          ? "image/webp"
          : "image/png",
      "Content-Length": String(buffer.length),
      "Accept-Ranges": "bytes",
      "Content-Disposition": `inline; filename="${name}"`,
    };
    if (range) headers["Content-Range"] = `bytes ${start}-${end}/${info.size}`;
    return new Response(buffer, { status: range ? 206 : 200, headers });
  } catch (e) {
    return failure(e, 404);
  }
}
