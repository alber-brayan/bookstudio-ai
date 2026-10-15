import { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Book3D } from "./book";
import type { Book, Scene } from "../../lib/schema";
import { booksForScene } from "../../lib/schema";
import { motionAt } from "../../lib/motion";
import type { BookTextures } from "./textures";
export const palettes = {
  black: { bg: "#101215", floor: "#161a1e", accent: "#809a93" },
  white: { bg: "#e5e7e2", floor: "#d3d9d2", accent: "#c7d8ca" },
  emerald: { bg: "#0c211d", floor: "#14352c", accent: "#6cba91" },
  gold: { bg: "#211c14", floor: "#3d3020", accent: "#dfb86d" },
  soft: { bg: "#a2ada7", floor: "#b6c1b9", accent: "#e8f1df" },
  dramatic: { bg: "#080d12", floor: "#10191e", accent: "#638d94" },
};
function Camera({
  fov,
  portrait,
  height,
  width,
  withText,
}: {
  fov: number;
  portrait: boolean;
  height: number;
  width: number;
  withText: boolean;
}) {
  const { camera } = useThree();
  useLayoutEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = portrait ? Math.max(fov, 42) : fov;
      const fit = Math.max(1, height / 2.8, width / 2.1);
      camera.position.set(
        0,
        height / 2 + (portrait && withText ? 1.1 : 0.5),
        (portrait ? 8.5 : 7.3) * fit,
      );
      camera.lookAt(0, height / 2 + (portrait && withText ? 0.6 : 0), 0);
      camera.updateProjectionMatrix();
    }
  }, [camera, fov, portrait, height, width, withText]);
  return null;
}
export function SceneContents({
  books,
  scene,
  frame,
  fps,
  textures,
  portrait = false,
  inspect = false,
  transparent = false,
  shadowSize = 1024,
}: {
  books: Book[];
  scene: Scene;
  frame: number;
  fps: number;
  textures: BookTextures;
  portrait?: boolean;
  inspect?: boolean;
  transparent?: boolean;
  shadowSize?: number;
}) {
  const palette = palettes[scene.studio],
    m = motionAt(scene, frame, fps);
  const selection = booksForScene(books, scene);
  const placeholder: Book = {
    id: "preview",
    name: "Tu próximo libro",
    front: null,
    back: null,
    width: 21,
    height: 28,
    thickness: 1.8,
    spineColor: "#163e33",
    spineText: "BOOKSTUDIO · EDICIÓN DE MUESTRA",
    finish: "satin",
    hardcover: false,
  };
  const multi = ["fan", "panorama", "exploded"].includes(scene.movement);
  const selected = (selection.length ? selection : [placeholder]).slice(
    0,
    multi ? 5 : 1,
  );
  return (
    <>
      {!inspect && (
        <Camera
          fov={scene.fov}
          portrait={portrait}
          height={Math.max(...selected.map((book) => book.height / 10))}
          width={Math.max(...selected.map((book) => book.width / 10))}
          withText={Boolean(scene.title)}
        />
      )}
      {!transparent && <color attach="background" args={[palette.bg]} />}
      <ambientLight intensity={0.65 * scene.light * m.brightness} />
      <hemisphereLight
        args={["#e8f1ed", palette.floor, 1.2 * scene.light * m.brightness]}
      />
      <directionalLight
        castShadow
        position={[-3, 6, 5]}
        intensity={3 * scene.light * m.brightness}
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-bias={-0.0005}
      >
        <orthographicCamera
          attach="shadow-camera"
          args={[-5, 5, 5, -5, 0.1, 20]}
        />
      </directionalLight>
      <directionalLight
        position={[4, 3, -3]}
        color={palette.accent}
        intensity={4 * scene.light * m.brightness}
      />
      <pointLight
        position={[3, 2, 4]}
        intensity={20 * scene.light * m.brightness}
      />
      <group
        name="products"
        position={[inspect ? 0 : portrait ? 0 : scene.title ? 1.2 : 0, 0, 0]}
      >
        {selected.map((book, i) => {
          const offset = i - (selected.length - 1) / 2;
          const fan = scene.movement === "fan";
          const exploded = scene.movement === "exploded";
          const y = book.height / 20 + 0.09 + m.y;
          return (
            <group
              key={book.id}
              position={[
                offset * (fan ? 0.55 : 1.4) + m.x,
                y + (exploded ? i * 0.12 : 0),
                exploded ? -i * 0.6 : fan ? -Math.abs(offset) * 0.22 : 0,
              ]}
              rotation={[
                0,
                m.rotation + (fan ? offset * 0.23 : 0),
                fan ? -offset * 0.055 : 0,
              ]}
              scale={m.scale * (multi ? 0.85 : 1)}
            >
              <Book3D book={book} textures={textures} />
            </group>
          );
        })}
      </group>
      {!transparent && (
        <>
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
            position={[0, -0.03, 0]}
          >
            <planeGeometry args={[200, 200]} />
            <meshStandardMaterial
              color={palette.floor}
              metalness={0.18}
              roughness={0.68}
            />
          </mesh>
          <mesh
            position={[
              inspect ? 0 : portrait ? 0 : scene.title ? 1.2 : 0,
              -0.045,
              0,
            ]}
            receiveShadow
          >
            <cylinderGeometry args={[2.05, 2.12, 0.12, 80]} />
            <meshStandardMaterial
              color={palette.floor}
              metalness={0.25}
              roughness={0.48}
            />
          </mesh>
        </>
      )}
    </>
  );
}
