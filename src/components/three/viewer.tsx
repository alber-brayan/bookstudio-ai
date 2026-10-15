"use client";
import { Canvas, useThree, type RootState } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei/core/OrbitControls.js";
import {
  Suspense,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { SceneContents } from "./scene";
import {
  booksForScene,
  dimensions,
  type Project,
  type Scene,
} from "@/lib/schema";
import { useBookTextures } from "./textures";
import { previewSettings } from "../../lib/preview";
import { withOriginalTextures } from "./export-textures";
export type ViewerHandle = {
  capture: (format: "png" | "webp", transparent: boolean) => Promise<void>;
  glb: () => Promise<void>;
  view: (side: string) => void;
};
function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
function Bridge({ holder }: { holder: React.RefObject<RootState | null> }) {
  const state = useThree();
  useEffect(() => {
    holder.current = state;
    return () => {
      holder.current = null;
    };
  }, [state, holder]);
  return null;
}
export const Viewer = forwardRef<
  ViewerHandle,
  { project: Project; scene: Scene; frame: number; viewBookId: string }
>(({ project, scene, frame, viewBookId }, ref) => {
  const holder = useRef<RootState | null>(null);
  const [key, setKey] = useState(0);
  const exporting = useRef(false);
  const inspectScene = {
    ...scene,
    bookIds: viewBookId ? [viewBookId] : scene.bookIds,
    movement: "final" as const,
    title: "",
  };
  const renderedBooks = booksForScene(project.books, inspectScene);
  const preview = previewSettings(project);
  const textures = useBookTextures(renderedBooks, "", preview.proxySize);
  useImperativeHandle(
    ref,
    () => ({
      async capture(format, transparent) {
        const s = holder.current;
        if (!s || !textures) throw new Error("El visor todavía no está listo.");
        if (exporting.current)
          throw new Error("Espera a que termine la exportación actual.");
        exporting.current = true;
        try {
          await withOriginalTextures(
            s.scene,
            renderedBooks,
            textures,
            async () => {
              if (s !== holder.current)
                throw new Error(
                  "El visor cambió durante la carga. Vuelve a exportar.",
                );
              const output = dimensions(project.format);
              const size = new THREE.Vector2();
              s.gl.getSize(size);
              const dpr = s.gl.getPixelRatio();
              const background = s.scene.background;
              const aspect =
                s.camera instanceof THREE.PerspectiveCamera
                  ? s.camera.aspect
                  : null;
              const floor = s.scene.children.filter((v) => v.type === "Mesh");
              try {
                if (transparent) {
                  s.scene.background = null;
                  floor.forEach((v) => (v.visible = false));
                  s.gl.setClearAlpha(0);
                }
                s.gl.setPixelRatio(1);
                s.gl.setSize(output.width, output.height, false);
                if (s.camera instanceof THREE.PerspectiveCamera) {
                  s.camera.aspect = output.width / output.height;
                  s.camera.updateProjectionMatrix();
                }
                s.gl.render(s.scene, s.camera);
                const blob = await new Promise<Blob | null>((resolve) =>
                  s.gl.domElement.toBlob(resolve, `image/${format}`, 1),
                );
                if (blob) download(blob, `bookstudio-photo.${format}`);
              } finally {
                s.scene.background = background;
                floor.forEach((v) => (v.visible = true));
                s.gl.setClearAlpha(1);
                s.gl.setPixelRatio(dpr);
                s.gl.setSize(size.x, size.y, false);
                if (
                  s.camera instanceof THREE.PerspectiveCamera &&
                  aspect !== null
                ) {
                  s.camera.aspect = aspect;
                  s.camera.updateProjectionMatrix();
                }
                s.gl.render(s.scene, s.camera);
              }
            },
          );
        } finally {
          exporting.current = false;
          s.invalidate();
        }
      },
      async glb() {
        const s = holder.current;
        const group = s?.scene.getObjectByName("products");
        if (!group || !textures) throw new Error("Modelo no disponible.");
        if (exporting.current)
          throw new Error("Espera a que termine la exportación actual.");
        exporting.current = true;
        try {
          await withOriginalTextures(
            group,
            renderedBooks,
            textures,
            async () => {
              if (s !== holder.current)
                throw new Error(
                  "El visor cambió durante la carga. Vuelve a exportar.",
                );
              const clone = group.clone(true);
              clone.position.set(0, 0, 0);
              clone.scale.setScalar(0.1);
              const result = await new GLTFExporter().parseAsync(clone, {
                binary: true,
              });
              download(
                new Blob([result as ArrayBuffer], {
                  type: "model/gltf-binary",
                }),
                "bookstudio-model.glb",
              );
            },
          );
        } finally {
          exporting.current = false;
          s?.invalidate();
        }
      },
      view(side) {
        const s = holder.current;
        if (!s) return;
        if (side === "reset") {
          setKey((k) => k + 1);
          return;
        }
        const cam = s.camera;
        const p: Record<string, [number, number, number]> = {
          front: [0, 1.5, 7],
          back: [0, 1.5, -7],
          side: [-7, 1.5, 0],
          top: [0, 8, 0.01],
        };
        cam.position.set(...(p[side] || p.front));
        cam.lookAt(0, 1.3, 0);
        cam.updateProjectionMatrix();
        s.invalidate();
      },
    }),
    [project.format, renderedBooks, textures],
  );
  if (!textures) return <div className="webgl-error">Preparando texturas…</div>;
  return (
    <Canvas
      key={key}
      frameloop="demand"
      shadows="percentage"
      dpr={
        project.useProxies !== false
          ? 1
          : project.performance === "low"
            ? 1
            : project.performance === "high"
              ? [1, 2]
              : [1, 1.5]
      }
      camera={{ position: [0, 1.5, 7.3], fov: 35 }}
      gl={{
        antialias: project.performance !== "low",
        preserveDrawingBuffer: true,
        alpha: true,
      }}
    >
      <Bridge holder={holder} />
      <Suspense fallback={null}>
        <SceneContents
          books={project.books}
          scene={inspectScene}
          frame={frame}
          fps={project.fps}
          textures={textures}
          shadowSize={preview.shadowSize}
          inspect
        />
        <OrbitControls
          makeDefault
          target={[0, 1.35, 0]}
          minDistance={2.5}
          maxDistance={15}
          enableDamping
        />
      </Suspense>
    </Canvas>
  );
});
Viewer.displayName = "Viewer";
