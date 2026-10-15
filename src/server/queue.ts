import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { dataDir, listJobs, newId, outputDir, storeJob } from "./storage";
import type { Project, RenderJob } from "@/lib/schema";
type QueueItem = {
  job: RenderJob;
  project: Project;
  quality: "preview" | "1080p" | "4k";
  frame: number;
  transparent: boolean;
};
type Queue = {
  items: QueueItem[];
  active: QueueItem | null;
  child: ChildProcess | null;
  initialized: boolean;
};
const globals = globalThis as typeof globalThis & { renderQueue?: Queue };
const q = (globals.renderQueue ??= {
  items: [],
  active: null,
  child: null,
  initialized: false,
});
if (!q.initialized) {
  for (const job of listJobs()) {
    if (job.status === "rendering" || job.status === "queued")
      storeJob({
        ...job,
        status: "error",
        message: "El servidor se reinició. Vuelve a enviar el render.",
      });
  }
  q.initialized = true;
}
export function enqueue(
  project: Project,
  kind: RenderJob["kind"],
  quality: QueueItem["quality"],
  frame = 0,
  transparent = false,
) {
  if (q.items.length >= 20)
    throw new Error("La cola admite 20 trabajos pendientes.");
  const job: RenderJob = {
    id: newId(),
    status: "queued",
    progress: 0,
    message: "En cola local",
    file: null,
    createdAt: new Date().toISOString(),
    kind,
    projectName: project.name,
  };
  q.items.push({ job, project, quality, frame, transparent });
  storeJob(job);
  void pump();
  return job;
}
export function cancel(id: string) {
  const pending = q.items.find((v) => v.job.id === id);
  if (pending) {
    q.items = q.items.filter((v) => v !== pending);
    pending.job.status = "cancelled";
    pending.job.message = "Cancelado";
    storeJob(pending.job);
    return;
  }
  if (q.active?.job.id === id) {
    q.active.job.status = "cancelled";
    q.active.job.message = "Cancelando render…";
    storeJob(q.active.job);
    q.child?.stdin?.write("cancel\n");
  }
}
async function pump() {
  if (q.active || !q.items.length) return;
  const item = q.items.shift()!;
  q.active = item;
  item.job.status = "rendering";
  item.job.message = "Preparando Remotion y navegador";
  storeJob(item.job);
  try {
    const input = path.join(dataDir, "jobs", `${item.job.id}.json`);
    await fs.writeFile(
      input,
      JSON.stringify({
        ...item,
        outputDir,
        origin: process.env.BOOKSTUDIO_ORIGIN || "http://127.0.0.1:3000",
      }),
    );
    const child = spawn(
      process.execPath,
      [path.join(process.cwd(), "scripts", "render.mjs"), input],
      { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] },
    );
    q.child = child;
    let pending = "",
      stderr = "";
    child.stdout?.on("data", (chunk) => {
      pending += chunk.toString();
      let newline: number;
      while ((newline = pending.indexOf("\n")) >= 0) {
        const line = pending.slice(0, newline);
        pending = pending.slice(newline + 1);
        try {
          const event = JSON.parse(line);
          if (item.job.status === "cancelled") continue;
          if (event.progress !== undefined) item.job.progress = event.progress;
          if (event.message) item.job.message = event.message;
          if (event.file) item.job.file = event.file;
          storeJob(item.job);
        } catch {
          /* dependency diagnostics are not progress */
        }
      }
    });
    child.stderr?.on(
      "data",
      (chunk) => (stderr = (stderr + chunk.toString()).slice(-3000)),
    );
    await new Promise<void>((resolve, reject) => {
      child.on("error", reject);
      child.on("exit", (code) => {
        if (item.job.status === "cancelled") resolve();
        else if (code === 0 && item.job.file) resolve();
        else
          reject(
            new Error(
              stderr.slice(-1200) ||
                "El proceso de render terminó sin archivo.",
            ),
          );
      });
    });
    if ((item.job as RenderJob).status !== "cancelled") {
      item.job.status = "done";
      item.job.progress = 1;
      item.job.message = "Archivo listo";
    } else item.job.message = "Cancelado";
  } catch (e) {
    if ((item.job as RenderJob).status !== "cancelled") {
      item.job.status = "error";
      item.job.message = e instanceof Error ? e.message : "Error de render";
    }
  } finally {
    storeJob(item.job);
    q.active = null;
    q.child = null;
    void pump();
  }
}
