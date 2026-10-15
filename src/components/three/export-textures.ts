import * as THREE from "three";
import type { Book } from "../../lib/schema";
import { loadBookTextures, type BookTextures } from "./textures";
/** Temporarily bind full-resolution cover maps, then restore the editing proxies. */
export async function withOriginalTextures<T>(
  object: THREE.Object3D,
  books: Book[],
  preview: BookTextures,
  work: () => Promise<T>,
): Promise<T> {
  const originals = await loadBookTextures(books);
  const substitutions = new Map(
    Object.entries(preview).map(([name, map]) => [map, originals.maps[name]]),
  );
  const restored = new Map<THREE.MeshStandardMaterial, THREE.Texture>();
  try {
    object.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      const materials = Array.isArray(node.material)
        ? node.material
        : [node.material];
      for (const material of materials) {
        if (!(material instanceof THREE.MeshStandardMaterial) || !material.map)
          continue;
        const original = substitutions.get(material.map);
        if (original && original !== material.map && !restored.has(material)) {
          restored.set(material, material.map);
          material.map = original;
          material.needsUpdate = true;
        }
      }
    });
    return await work();
  } finally {
    for (const [material, map] of restored) {
      material.map = map;
      material.needsUpdate = true;
    }
    originals.release();
  }
}
