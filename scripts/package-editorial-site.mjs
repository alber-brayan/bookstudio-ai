// Keep the public website independent from the local BookStudio production APIs.
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const site = resolve("sites/editorial-dfernandez");
await mkdir(`${site}/src`, { recursive: true });
for (const file of ["editorial-site.tsx", "editorial.module.css", "use-glass-dialog.ts"]) await cp(`src/components/editorial/${file}`, `${site}/src/${file}`);
await cp("public/editorial", `${site}/public/editorial`, { recursive: true });
const path = `${site}/.openai/hosting.json`;
const manifest = JSON.parse(await readFile(path, "utf8"));
manifest.static = { directory: "dist" };
await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`);
console.log("Fuentes y recursos sincronizados para publicación.");
