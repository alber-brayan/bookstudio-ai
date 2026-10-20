import { build } from "esbuild";
import { cp, mkdir, writeFile, readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const dist = resolve(root, "dist");
await mkdir(dist, { recursive: true });
await cp(resolve(root, "public"), dist, { recursive: true });
const result = await build({
  absWorkingDir: root,
  entryPoints: ["src/main.tsx"],
  bundle: true,
  outfile: resolve(dist, "site.js"),
  jsx: "automatic",
  minifyWhitespace: true,
  minifySyntax: true,
  external: ["/editorial/*"],
  target: ["es2022"],
  define: { "process.env.NODE_ENV": '"production"' },
  metafile: true,
});
// Render the same component at build time: content and contact links are usable
// before JavaScript loads, and CSS module names match the hydration bundle.
const runtime = resolve(root, ".sites-runtime");
await mkdir(runtime, { recursive: true });
await build({
  absWorkingDir: root,
  stdin: { contents: 'import { renderToString } from "react-dom/server"; import EditorialSite from "./src/editorial-site"; export const markup = renderToString(<EditorialSite />);', resolveDir: root, loader: "tsx" },
  bundle: true, platform: "node", format: "esm", packages: "external",
  outfile: resolve(runtime, "render.mjs"), jsx: "automatic", external: ["/editorial/*"],
});
const { markup } = await import(pathToFileURL(resolve(runtime, "render.mjs")).href + `?build=${Date.now()}`);
const template = await readFile(resolve(root, "index.html"), "utf8");
await writeFile(resolve(dist, "index.html"), template.replace('<div id="root"></div>', `<div id="root">${markup}</div>`));
console.log(`Sitio preparado: ${Object.keys(result.metafile.outputs).length} archivos de aplicación + recursos de la editorial.`);
