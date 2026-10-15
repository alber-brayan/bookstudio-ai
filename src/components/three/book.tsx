import { useMemo, useEffect } from "react";
import * as THREE from "three";
import type { Book } from "../../lib/schema";
import type { BookTextures } from "./textures";
function canvasTexture(
  draw: (context: CanvasRenderingContext2D) => void,
  width: number,
  height: number,
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d")!;
  draw(context);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
function Covers({
  book,
  textures,
  roughness,
}: {
  book: Book;
  textures: BookTextures;
  roughness: number;
}) {
  const front = book.front ? textures[book.front.texture] : null,
    back = book.back ? textures[book.back.texture] : null;
  const w = book.width / 10,
    h = book.height / 10,
    d = book.thickness / 10;
  return (
    <>
      <mesh castShadow receiveShadow position={[0, 0, d / 2 + 0.012]}>
        <boxGeometry args={[w, h, 0.024]} />
        <meshStandardMaterial color={book.spineColor} roughness={roughness} />
      </mesh>
      <mesh position={[0, 0, d / 2 + 0.025]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial
          map={front}
          color={front ? "#ffffff" : book.spineColor}
          roughness={roughness}
          metalness={book.finish === "gloss" ? 0.05 : 0}
        />
      </mesh>
      <mesh castShadow position={[0, 0, -d / 2 - 0.012]}>
        <boxGeometry args={[w, h, 0.024]} />
        <meshStandardMaterial color={book.spineColor} roughness={roughness} />
      </mesh>
      <mesh rotation={[0, Math.PI, 0]} position={[0, 0, -d / 2 - 0.025]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial
          map={back}
          color={back ? "#ffffff" : book.spineColor}
          roughness={roughness}
        />
      </mesh>
    </>
  );
}
function Placeholder({ w, h, d }: { w: number; h: number; d: number }) {
  const texture = useMemo(
    () =>
      canvasTexture(
        (c) => {
          c.fillStyle = "#d8e5c7";
          c.fillRect(0, 0, 700, 1000);
          c.fillStyle = "#193e34";
          c.fillRect(48, 55, 604, 4);
          c.font = "22px sans-serif";
          c.fillText("BOOKSTUDIO / EDICIÓN DE MUESTRA", 48, 101);
          c.font = "bold 76px sans-serif";
          c.fillText("IDEAS QUE", 48, 265);
          c.fillText("ABREN", 48, 348);
          c.fillText("MUNDOS.", 48, 431);
          c.lineWidth = 2;
          c.strokeStyle = "#608372";
          for (let i = 0; i < 8; i++) {
            c.beginPath();
            c.ellipse(350, 690, 230 - i * 20, 190, Math.PI / 4, 0, Math.PI * 2);
            c.stroke();
          }
          c.font = "20px sans-serif";
          c.fillText("TU PRÓXIMA HISTORIA EMPIEZA AQUÍ", 48, 936);
        },
        700,
        1000,
      ),
    [],
  );
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <>
      <mesh castShadow>
        <boxGeometry args={[w, h, d + 0.04]} />
        <meshStandardMaterial color="#194335" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, d / 2 + 0.023]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={texture} roughness={0.6} />
      </mesh>
    </>
  );
}
export function Book3D({
  book,
  textures,
}: {
  book: Book;
  textures: BookTextures;
}) {
  const w = book.width / 10,
    h = book.height / 10,
    d = book.thickness / 10;
  const roughness =
    book.finish === "matte" ? 0.85 : book.finish === "satin" ? 0.42 : 0.15;
  const pages = useMemo(
    () =>
      canvasTexture(
        (c) => {
          c.fillStyle = "#e4e0d5";
          c.fillRect(0, 0, 128, 1024);
          for (let i = 0; i < 1024; i += 4) {
            c.fillStyle = i % 12 === 0 ? "#bcb9af" : "#d1cec4";
            c.fillRect(0, i, 128, 1);
          }
        },
        128,
        1024,
      ),
    [],
  );
  const spine = useMemo(
    () =>
      canvasTexture(
        (c) => {
          c.fillStyle = book.spineColor;
          c.fillRect(0, 0, 256, 2048);
          c.save();
          c.translate(128, 1024);
          c.rotate(-Math.PI / 2);
          c.fillStyle = "#efefdf";
          c.font = "500 60px sans-serif";
          c.textAlign = "center";
          c.fillText(book.spineText || book.name, 0, 20, 1650);
          c.restore();
          c.fillStyle = "#d0d4b7";
          c.fillRect(50, 100, 156, 5);
          c.fillRect(50, 1930, 156, 5);
        },
        256,
        2048,
      ),
    [book.spineColor, book.spineText, book.name],
  );
  useEffect(() => () => pages.dispose(), [pages]);
  useEffect(() => () => spine.dispose(), [spine]);
  return (
    <group name={`book-${book.id}`}>
      <mesh castShadow receiveShadow position={[0.008, 0, 0]}>
        <boxGeometry args={[w - 0.035, h - 0.045, d]} />
        <meshStandardMaterial map={pages} roughness={0.96} />
      </mesh>
      {book.front || book.back ? (
        <Covers book={book} textures={textures} roughness={roughness} />
      ) : (
        <Placeholder w={w} h={h} d={d} />
      )}
      <mesh position={[-w / 2 - 0.002, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[d + 0.046, h]} />
        <meshStandardMaterial map={spine} roughness={roughness} />
      </mesh>
      {book.hardcover &&
        [-1, 1].map((sign) => (
          <mesh key={sign} position={[0, 0, sign * (d / 2 + 0.005)]} castShadow>
            <boxGeometry args={[w + 0.035, h + 0.035, 0.018]} />
            <meshStandardMaterial
              color={book.spineColor}
              roughness={roughness}
            />
          </mesh>
        ))}
    </group>
  );
}
