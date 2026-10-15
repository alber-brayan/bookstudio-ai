import { spawn } from "node:child_process";
import path from "node:path";
import type { Point } from "@/lib/schema";
export const PROCESSING_VERSION = "opencv-v2";
export type ProcessResult = {
  corners: Point[];
  width: number;
  height: number;
  warnings: string[];
  sharpness: number;
};
let chain: Promise<unknown> = Promise.resolve();
export function processPhoto(
  source: string,
  output: string,
  corners?: Point[],
  ratio?: number,
): Promise<ProcessResult> {
  const work = () =>
    new Promise<ProcessResult>((resolve, reject) => {
      const child = spawn(
        process.env.PYTHON_PATH || "python",
        [path.join(process.cwd(), "processing", "worker.py")],
        { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] },
      );
      let stdout = "",
        stderr = "";
      const timer = setTimeout(() => {
        child.kill();
        reject(new Error("El procesamiento excedió 90 segundos."));
      }, 90000);
      child.stdout.on("data", (d) => (stdout += d));
      child.stderr.on("data", (d) => (stderr += d));
      child.on("error", (e) => {
        clearTimeout(timer);
        reject(new Error("No se pudo iniciar Python: " + e.message));
      });
      child.on("exit", () => {
        clearTimeout(timer);
        try {
          const data = JSON.parse(stdout);
          if (data.error) reject(new Error(data.error));
          else resolve(data);
        } catch {
          reject(
            new Error(
              "OpenCV no respondió. Instala processing/requirements.txt. " +
                stderr.slice(-300),
            ),
          );
        }
      });
      child.stdin.end(JSON.stringify({ source, output, corners, ratio }));
    });
  const result = chain.then(work, work);
  chain = result.catch(() => {});
  return result;
}
