import { useEffect, useLayoutEffect, useState } from "react";
import { delayRender, continueRender } from "remotion";
import * as THREE from "three";
import type { Book } from "../../lib/schema";
import type { ProxySize } from "../../lib/preview";
export type BookTextures = Record<string, THREE.Texture>;
type Entry = {
  refs: number;
  promise: Promise<THREE.Texture>;
  texture?: THREE.Texture;
};
const cache = new Map<string, Entry>();
function acquire(url: string) {
  let entry = cache.get(url);
  if (!entry) {
    const current: Entry = {
      refs: 0,
      promise: Promise.resolve(null as unknown as THREE.Texture),
    };
    current.promise = new THREE.TextureLoader()
      .loadAsync(url)
      .then((texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 8;
        current.texture = texture;
        if (current.refs === 0) texture.dispose();
        return texture;
      });
    entry = current;
    cache.set(url, entry);
  }
  entry.refs++;
  return entry.promise;
}
function release(url: string) {
  const entry = cache.get(url);
  if (!entry) return;
  entry.refs--;
  if (entry.refs === 0) {
    entry.texture?.dispose();
    cache.delete(url);
  }
}
export const textureKey = (
  books: Book[],
  origin = "",
  proxySize: ProxySize = 0,
) =>
  origin +
  "|" +
  proxySize +
  "|" +
  [
    ...new Set(
      books.flatMap((b) => [b.front?.texture, b.back?.texture]).filter(Boolean),
    ),
  ].join("|");
function acquireTextureSet(
  names: string[],
  origin: string,
  proxySize: ProxySize,
) {
  const urls = names.map(
    (name) =>
      `${origin}/api/assets/${name}${proxySize ? `?proxy=${proxySize}` : ""}`,
  );
  let released = false;
  return {
    ready: Promise.all(urls.map(acquire)).then(
      (values) =>
        Object.fromEntries(
          names.map((name, i) => [name, values[i]]),
        ) as BookTextures,
    ),
    release() {
      if (!released) {
        released = true;
        urls.forEach(release);
      }
    },
  };
}
export async function loadBookTextures(
  books: Book[],
  origin = "",
  proxySize: ProxySize = 0,
) {
  const names = [
    ...new Set(
      books
        .flatMap((book) => [book.front?.texture, book.back?.texture])
        .filter((name): name is string => Boolean(name)),
    ),
  ];
  const lease = acquireTextureSet(names, origin, proxySize);
  try {
    return { maps: await lease.ready, release: lease.release };
  } catch (e) {
    lease.release();
    throw e;
  }
}
/** Mount the WebGL canvas only after its texture objects are ready. This avoids
 * asynchronous Suspense commits bypassing Remotion's manual frame capture. */
export function useBookTextures(
  books: Book[],
  origin = "",
  proxySize: ProxySize = 0,
) {
  const key = textureKey(books, origin, proxySize);
  const [hold] = useState(() =>
    delayRender("Preparando texturas del producto antes de crear WebGL"),
  );
  const [state, setState] = useState<{
    key: string;
    maps: BookTextures;
  } | null>(null);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    let alive = true;
    const names = key.split("|").slice(2).filter(Boolean);
    const lease = acquireTextureSet(names, origin, proxySize);
    lease.ready
      .then((maps) => {
        if (alive)
          setState({
            key,
            maps,
          });
      })
      .catch((e) => {
        if (alive) {
          setError(e instanceof Error ? e : new Error(String(e)));
          continueRender(hold);
        }
      });
    return () => {
      alive = false;
      lease.release();
      continueRender(hold);
    };
  }, [key, origin, hold, proxySize]);
  useLayoutEffect(() => {
    if (state?.key === key) continueRender(hold);
  }, [state, key, hold]);
  if (error) throw error;
  return state?.key === key ? state.maps : null;
}
