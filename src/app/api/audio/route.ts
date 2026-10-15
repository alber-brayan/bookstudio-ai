import { NextResponse } from "next/server";
import { writeFile } from "node:fs/promises";
import { newId, safeAsset } from "@/server/storage";
import { failure, localMutation } from "@/server/http";
export async function POST(req: Request) {
  try {
    localMutation(req);
    const data = await req.formData();
    const file = data.get("file");
    if (!(file instanceof File) || file.size > 20 * 1024 * 1024)
      throw new Error("Selecciona MP3 o WAV de hasta 20 MB.");
    const buffer = Buffer.from(await file.arrayBuffer());
    const wav =
      buffer.subarray(0, 4).toString() === "RIFF" &&
      buffer.subarray(8, 12).toString() === "WAVE";
    const mp3 =
      buffer.subarray(0, 3).toString() === "ID3" ||
      (buffer[0] === 255 && (buffer[1] & 224) === 224);
    if (!wav && !mp3) throw new Error("Audio no reconocido. Usa MP3 o WAV.");
    const name = `${newId()}.${wav ? "wav" : "mp3"}`;
    await writeFile(safeAsset(name), buffer);
    return NextResponse.json({ name });
  } catch (e) {
    return failure(e);
  }
}
