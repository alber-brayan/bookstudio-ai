import { readFile, writeFile, access, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { resolve, sep } from "node:path";

const publicDir = resolve("public/editorial");
const toolsDir = resolve("node_modules/@remotion/compositor-win32-x64-msvc");
const manifestPath = resolve(publicDir, "sources.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const exists = async path => { try { await access(path); return true; } catch { return false; } };
const derivedDirs = [publicDir, ...["sites/editorial-dfernandez/public/editorial", "sites/editorial-dfernandez/dist/editorial", "sites/editorial-dfernandez/.sites-checkout/public/editorial", "sites/editorial-dfernandez/.sites-checkout/dist/editorial"].map(p => resolve(p))];

for (const clip of manifest.clips) {
  const slug = clip.poster.replace(/-poster\.jpg$/, "");
  if (!/^[a-z]+(?:-[a-z0-9]+)*$/.test(slug)) throw Error("Invalid clip identifier");
  const output = resolve(publicDir, `${slug}-silent.mp4`);
  if (!await exists(output)) {
    execFileSync(resolve(toolsDir, "ffmpeg.exe"), ["-v", "error", "-y", "-i", resolve(publicDir, `${slug}.mp4`), "-map", "0:v:0", "-c:v", "copy", "-an", "-movflags", "+faststart", output]);
  }
  const info = JSON.parse(execFileSync(resolve(toolsDir, "ffprobe.exe"), ["-v", "error", "-show_streams", "-of", "json", output], { encoding: "utf8" }));
  if (!info.streams.some(s => s.codec_type === "video") || info.streams.some(s => s.codec_type === "audio")) throw Error(`Audio removal failed: ${slug}`);
  // Remove only the six superseded derived web files, never the user's originals.
  for (const dir of derivedDirs) {
    const old = resolve(dir, `${slug}.mp4`);
    if (!old.startsWith(dir + sep)) throw Error("Invalid derived path");
    await rm(old, { force: true });
  }
  clip.video = `${slug}-silent.mp4`;
  console.log(`${clip.video}: video verificado, sin pista de audio`);
}
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
