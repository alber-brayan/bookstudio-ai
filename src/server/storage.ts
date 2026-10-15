import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import type { Project, RenderJob } from "@/lib/schema";
export const dataDir = path.resolve(
  process.env.BOOKSTUDIO_DATA_DIR || path.join(process.cwd(), "data"),
);
export const assetDir = path.join(dataDir, "assets");
export const outputDir = path.resolve(
  process.env.BOOKSTUDIO_OUTPUT_DIR || path.join(dataDir, "exports"),
);
for (const dir of [dataDir, assetDir, outputDir, path.join(dataDir, "jobs")])
  fs.mkdirSync(dir, { recursive: true });
const globalDb = globalThis as typeof globalThis & { bookDb?: DatabaseSync };
export const db = (globalDb.bookDb ??= new DatabaseSync(
  path.join(dataDir, "bookstudio.sqlite"),
));
db.exec(
  `PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS projects(id TEXT PRIMARY KEY,name TEXT NOT NULL,json TEXT NOT NULL,updated_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS assets(id TEXT PRIMARY KEY,hash TEXT,metadata TEXT NOT NULL); CREATE TABLE IF NOT EXISTS jobs(id TEXT PRIMARY KEY,json TEXT NOT NULL); CREATE TABLE IF NOT EXISTS ai_cache(key TEXT PRIMARY KEY,json TEXT NOT NULL,month TEXT NOT NULL); CREATE TABLE IF NOT EXISTS ai_usage(id TEXT PRIMARY KEY,month TEXT NOT NULL,status TEXT NOT NULL);`,
);
export function saveProject(p: Project) {
  db.prepare(
    "INSERT INTO projects VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,json=excluded.json,updated_at=excluded.updated_at",
  ).run(p.id, p.name, JSON.stringify(p), p.updatedAt);
}
export function listProjects() {
  return db
    .prepare("SELECT id,name,updated_at FROM projects ORDER BY updated_at DESC")
    .all();
}
export function getProject(id: string): Project | null {
  const row = db.prepare("SELECT json FROM projects WHERE id=?").get(id) as
    { json: string } | undefined;
  return row ? JSON.parse(row.json) : null;
}
export function storeJob(job: RenderJob) {
  db.prepare(
    "INSERT INTO jobs VALUES(?,?) ON CONFLICT(id) DO UPDATE SET json=excluded.json",
  ).run(job.id, JSON.stringify(job));
}
export function listJobs(): RenderJob[] {
  return db
    .prepare("SELECT json FROM jobs ORDER BY rowid DESC LIMIT 100")
    .all()
    .map((r) => JSON.parse(r.json as string));
}
export function safeAsset(name: string) {
  if (!/^[a-zA-Z0-9_-]+\.(png|jpg|webp|mp3|wav)$/.test(name))
    throw new Error("Recurso no válido.");
  return path.join(assetDir, name);
}
export function safeExport(name: string) {
  if (!/^[a-zA-Z0-9_-]+\.(mp4|png|webp|glb)$/.test(name))
    throw new Error("Exportación no válida.");
  return path.join(outputDir, name);
}
export function newId() {
  return randomUUID();
}
