import { NextResponse } from "next/server";
import sharp from "sharp";
import { createHash } from "node:crypto";
import { db, newId, safeAsset } from "@/server/storage";
import { makeBook, type Asset } from "@/lib/schema";
import { failure, localMutation } from "@/server/http";
export async function POST(req: Request) {
  try {
    localMutation(req);
    const book = makeBook("Ideas que abren mundos · ejemplo");
    book.width = 19.6;
    book.height = 28;
    book.thickness = 2.1;
    book.spineColor = "#1d4d39";
    book.spineText = "IDEAS QUE ABREN MUNDOS · BOOKSTUDIO";
    for (const side of ["front", "back"] as const) {
      const id = newId(),
        name = `${id}-demo.png`;
      const lines =
        side === "front"
          ? '<text x="65" y="260" font-size="85" font-weight="700">IDEAS QUE</text><text x="65" y="355" font-size="85" font-weight="700">ABREN</text><text x="65" y="450" font-size="85" font-weight="700">MUNDOS.</text>'
          : '<text x="65" y="240" font-size="49">Cada libro es</text><text x="65" y="305" font-size="49">una nueva</text><text x="65" y="370" font-size="49">posibilidad.</text><text x="65" y="470" font-size="22">Edición de ejemplo para explorar BookStudio.</text><text x="65" y="510" font-size="22">Reemplaza estas imágenes con tu producto.</text>';
      const circles = Array.from(
        { length: 9 },
        (_, i) =>
          `<ellipse cx="350" cy="700" rx="${235 - i * 20}" ry="165" transform="rotate(-30 350 700)" fill="none" stroke="#69876a" stroke-width="2"/>`,
      ).join("");
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="1000"><rect width="700" height="1000" fill="${side === "front" ? "#d7e2be" : "#c0d1a8"}"/><g font-family="Arial,sans-serif" fill="#1d4935"><rect x="65" y="65" width="570" height="3"/><text x="65" y="110" font-size="17" letter-spacing="3">BOOKSTUDIO / EDICIÓN DE MUESTRA</text>${lines}${circles}<text x="65" y="935" font-size="17" letter-spacing="1">UNA HISTORIA. INFINITAS POSIBILIDADES.</text></g></svg>`;
      const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
      await sharp(buffer).toFile(safeAsset(name));
      const asset: Asset = {
        id,
        original: name,
        texture: name,
        name: `EJEMPLO_${side === "front" ? "PORTADA" : "REVERSA"}.png`,
        width: 700,
        height: 1000,
        corners: [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
        ],
        warnings: [],
        hash: createHash("sha256").update(buffer).digest("hex"),
      };
      db.prepare("INSERT INTO assets VALUES(?,?,?)").run(
        id,
        asset.hash,
        JSON.stringify(asset),
      );
      book[side] = asset;
    }
    return NextResponse.json({ book });
  } catch (e) {
    return failure(e);
  }
}
