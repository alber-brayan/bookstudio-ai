import { readFile, stat } from "node:fs/promises";
import { safeAsset } from "@/server/storage";
import { failure } from "@/server/http";
import { imageProxy } from "@/server/proxies";
export async function GET(
  req: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  try {
    const { name } = await params;
    const proxy = new URL(req.url).searchParams.get("proxy");
    const file = proxy
      ? await imageProxy(name, Number(proxy))
      : safeAsset(name);
    const info = await stat(file);
    const mime = proxy
      ? "image/webp"
      : name.endsWith(".mp3")
        ? "audio/mpeg"
        : name.endsWith(".wav")
          ? "audio/wav"
          : name.endsWith(".jpg")
            ? "image/jpeg"
            : name.endsWith(".webp")
              ? "image/webp"
              : "image/png";
    const origin = req.headers.get("origin");
    const cors: Record<string, string> = {};
    if (
      origin &&
      ["127.0.0.1", "localhost", "[::1]"].includes(new URL(origin).hostname)
    )
      cors["Access-Control-Allow-Origin"] = origin;
    return new Response(await readFile(file), {
      headers: {
        "Content-Type": mime,
        "Content-Length": String(info.size),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        Vary: "Origin",
        "X-BookStudio-Texture": proxy ? `proxy-${proxy}` : "original",
        ...cors,
      },
    });
  } catch (e) {
    return failure(e, 404);
  }
}
