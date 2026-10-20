import { cp, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
const site = resolve("sites/editorial-dfernandez");
const checkout = resolve(site, ".sites-checkout");
await mkdir(checkout, { recursive: true });
for (const entry of ["src", "public", "package.json", "build.mjs", "index.html", ".openai", ".gitignore", "README.md"]) {
  await cp(resolve(site, entry), resolve(checkout, entry), { recursive: true });
}
console.log(checkout);
