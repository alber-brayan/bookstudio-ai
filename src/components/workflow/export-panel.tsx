"use client";
import {
  Download,
  Film,
  Image as ImageIcon,
  LoaderCircle,
  Check,
  ArrowRight,
} from "lucide-react";
import { dimensions, type Project, type RenderJob } from "@/lib/schema";
import { exportDownloadName } from "@/lib/downloads";
export type OutputQuality = "preview" | "720p" | "1080p";
const formats = [
  { value: "landscape", label: "Horizontal", ratio: "16:9" },
  { value: "portrait", label: "Vertical", ratio: "9:16" },
  { value: "square", label: "Cuadrado", ratio: "1:1" },
] as const;
export function ExportPanel({
  project,
  kind,
  onKind,
  quality,
  onQuality,
  onProject,
  problem,
  job,
  onPhotos,
  onHistory,
  transparent,
  onTransparent,
}: {
  project: Project;
  kind: RenderJob["kind"];
  onKind: (kind: RenderJob["kind"]) => void;
  quality: OutputQuality;
  onQuality: (quality: OutputQuality) => void;
  onProject: (patch: Partial<Project>) => void;
  problem: string;
  job: RenderJob | null;
  onPhotos: () => void;
  onHistory: () => void;
  transparent: boolean;
  onTransparent: (value: boolean) => void;
}) {
  const size = dimensions(project.format, quality),
    type = kind === "video" ? "MP4" : kind.toUpperCase();
  const pending =
    job && (job.status === "queued" || job.status === "rendering");
  return (
    <section className="export-panel" aria-label="Preparar descarga">
      <header className="export-intro">
        <span>PASO 3</span>
        <h2>Prepara tu descarga</h2>
        <p>Elige el encuadre, el tamaño y el archivo que necesitas.</p>
      </header>
      <fieldset className="output-field">
        <legend>Relación de aspecto</legend>
        <div className="aspect-options">
          {formats.map((format) => (
            <button
              key={format.value}
              aria-pressed={project.format === format.value}
              onClick={() => onProject({ format: format.value })}
            >
              <i className={`aspect-icon ${format.value}`} />
              <strong>{format.ratio}</strong>
              <span>{format.label}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <div className="field">
        <label htmlFor="output-quality">Resolución de exportación</label>
        <select
          id="output-quality"
          value={quality}
          onChange={(event) => onQuality(event.target.value as OutputQuality)}
        >
          {(["preview", "720p", "1080p"] as const).map((value) => {
            const d = dimensions(project.format, value);
            return (
              <option key={value} value={value}>
                {value === "preview"
                  ? "360p · Prueba rápida"
                  : value === "720p"
                    ? "720p · HD"
                    : "1080p · Full HD"}{" "}
                — {d.width} × {d.height}
              </option>
            );
          })}
        </select>
      </div>
      <fieldset className="output-field">
        <legend>Tipo de archivo</legend>
        <div className="file-options">
          {(["video", "png", "webp"] as const).map((value) => (
            <button
              key={value}
              aria-pressed={kind === value}
              onClick={() => onKind(value)}
            >
              {value === "video" ? <Film size={16} /> : <ImageIcon size={16} />}
              <span>{value === "video" ? "MP4" : value.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <label className="checkbox-label output-text-toggle">
        <input
          type="checkbox"
          checked={project.showText === false}
          onChange={(event) => onProject({ showText: !event.target.checked })}
        />
        Sin textos publicitarios
      </label>
      {kind !== "video" && (
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={transparent}
            onChange={(event) => onTransparent(event.target.checked)}
          />
          Fondo transparente
        </label>
      )}
      <div className="output-summary" aria-live="polite">
        <strong>
          {size.width} × {size.height} px
        </strong>
        <span>
          {type}
          {kind === "video"
            ? ` · ${project.fps} FPS · ${project.scenes.reduce((sum, scene) => sum + scene.duration, 0).toFixed(1)} s`
            : " · fotograma actual"}
        </span>
        <small>Exportación con texturas completas.</small>
      </div>
      {problem && (
        <div className="export-blocker">
          <p>{problem}</p>
          <button onClick={onPhotos}>
            Completar fotos <ArrowRight size={14} />
          </button>
        </div>
      )}
      {job && (
        <div className={`export-result ${job.status}`} role="status">
          <strong>
            {job.status === "done" ? (
              <>
                <Check size={16} />
                Archivo listo
              </>
            ) : job.status === "error" ? (
              "No se pudo exportar"
            ) : job.status === "cancelled" ? (
              "Exportación cancelada"
            ) : (
              <>
                <LoaderCircle size={15} className="spin" />
                {job.status === "queued"
                  ? "En cola"
                  : `Exportando · ${Math.round(job.progress * 100)} %`}
              </>
            )}
          </strong>
          <span>{job.projectName}</span>
          {job.output && (
            <small>
              {job.output.width} × {job.output.height} ·{" "}
              {job.kind === "video" ? "MP4" : job.kind.toUpperCase()}
            </small>
          )}
          {pending && <progress value={job.progress} max={1} />}
          <p>{job.message}</p>
          {job.status === "done" && job.file && (
            <a
              className="download-ready"
              href={`/api/exports/${job.file}?download=1`}
              download={exportDownloadName(job.projectName, job.file)}
            >
              <Download size={17} />
              Descargar {job.kind === "video" ? "MP4" : job.kind.toUpperCase()}
            </a>
          )}
        </div>
      )}
      <button className="history-link" onClick={onHistory}>
        Ver todas mis descargas <ArrowRight size={14} />
      </button>
      <details className="output-advanced">
        <summary>Ajustes de video</summary>
        <div className="field">
          <label htmlFor="project-name">Nombre del proyecto</label>
          <input
            id="project-name"
            value={project.name}
            maxLength={120}
            onChange={(event) => {
              if (event.target.value) onProject({ name: event.target.value });
            }}
          />
        </div>
        <div className="field">
          <label htmlFor="output-fps">Fotogramas por segundo</label>
          <select
            id="output-fps"
            value={project.fps}
            onChange={(event) =>
              onProject({ fps: Number(event.target.value) as Project["fps"] })
            }
          >
            {[24, 30, 60].map((fps) => (
              <option key={fps} value={fps}>
                {fps} FPS
              </option>
            ))}
          </select>
        </div>
        <p>4K todavía no está disponible.</p>
      </details>
    </section>
  );
}
