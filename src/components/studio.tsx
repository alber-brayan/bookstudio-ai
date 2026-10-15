"use client";
import {
  useEffect,
  useState,
  useRef,
  useMemo,
  Component,
  type ReactNode,
} from "react";
import { Player, type PlayerRef } from "@remotion/player";
import {
  BookOpen,
  Box,
  Clapperboard,
  Layers3,
  Upload,
  FolderOpen,
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Maximize,
  RotateCcw,
  Download,
  Settings2,
  Image as ImageIcon,
  Film,
  Check,
  ShieldCheck,
  Music2,
  X,
  Trash2,
  ArrowUp,
  ArrowDown,
  Clock3,
  LoaderCircle,
  Monitor,
  Copy,
} from "lucide-react";
import { Button } from "./ui/button";
import { Viewer, type ViewerHandle } from "./three/viewer";
import { VideoComposition } from "@/video/composition";
import { CropEditor } from "./crop-editor";
import { AIEditor } from "./ai-editor";
import { ProjectDialog } from "./project-dialog";
import { BookProperties } from "./book-properties";
import { useStudio } from "@/lib/store";
import { api, cn } from "@/lib/utils";
import {
  makeBook,
  makeScene,
  movementNames,
  movements,
  studios,
  studioNames,
  totalFrames,
  dimensions,
  pairFiles,
  type Project,
  type Asset,
  type Scene,
  type RenderJob,
} from "@/lib/schema";
import { templates, scenesFromTemplate } from "@/lib/templates";
import { previewSettings, showsText } from "@/lib/preview";
class ViewBoundary extends Component<
  { children: ReactNode },
  { error: string }
> {
  state = { error: "" };
  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }
  render() {
    return this.state.error ? (
      <div className="webgl-error">
        <Box />
        <h3>El visor 3D no pudo iniciarse</h3>
        <p>{this.state.error}</p>
        <p>Comprueba WebGL y la aceleración gráfica del navegador.</p>
        <Button onClick={() => location.reload()}>Volver a cargar</Button>
      </div>
    ) : (
      this.props.children
    );
  }
}
function Time({ frame, fps }: { frame: number; fps: number }) {
  return (
    <>{`${Math.floor(frame / fps / 60)
      .toString()
      .padStart(2, "0")}:${Math.floor((frame / fps) % 60)
      .toString()
      .padStart(2, "0")}:${(frame % fps).toString().padStart(2, "0")}`}</>
  );
}
export default function Studio() {
  const {
    project,
    selectedBook,
    selectedScene,
    frame,
    mode,
    saved,
    setProject,
    patchProject,
    patchBook,
    patchScene,
    selectBook,
    selectScene,
    setFrame,
    setMode,
    setSaved,
  } = useStudio();
  const [ready, setReady] = useState(false),
    [leftTab, setLeftTab] = useState<"library" | "templates" | "queue">(
      "library",
    ),
    [rightTab, setRightTab] = useState<"product" | "scene" | "export">("scene"),
    [query, setQuery] = useState(""),
    [busy, setBusy] = useState(""),
    [toast, setToast] = useState(""),
    [error, setError] = useState(""),
    [crop, setCrop] = useState<{
      asset: Asset;
      bookId: string;
      side: "front" | "back";
    } | null>(null),
    [ai, setAI] = useState<typeof crop>(null),
    [projectsOpen, setProjectsOpen] = useState(false),
    [jobs, setJobs] = useState<RenderJob[]>([]),
    [playing, setPlaying] = useState(false),
    [transparent, setTransparent] = useState(false),
    [quality, setQuality] = useState<"preview" | "1080p">("1080p"),
    [dragging, setDragging] = useState(false),
    [filter, setFilter] = useState("all");
  const player = useRef<PlayerRef>(null),
    viewer = useRef<ViewerHandle>(null),
    single = useRef<HTMLInputElement>(null),
    batch = useRef<HTMLInputElement>(null),
    folder = useRef<HTMLInputElement>(null),
    audio = useRef<HTMLInputElement>(null),
    stage = useRef<HTMLDivElement>(null),
    uploadTarget = useRef<{ id: string; side: "front" | "back" } | null>(null);
  const book =
    project.books.find((b) => b.id === selectedBook) || project.books[0];
  const scene = project.scenes[selectedScene] || project.scenes[0];
  const frames = totalFrames(project),
    size = dimensions(project.format);
  const preview = previewSettings(project);
  const previewProps = useMemo(
    () => ({ project, origin: "", transparent: false }),
    [project],
  );
  const assets = useMemo(
    () => [
      ...new Map(
        project.books
          .flatMap((b) => [b.front, b.back])
          .filter((a): a is Asset => Boolean(a))
          .map((a) => [a.id, a]),
      ).values(),
    ],
    [project.books],
  );
  const selectedJobs = jobs.filter(
    (j) => j.status === "queued" || j.status === "rendering",
  );
  useEffect(() => {
    let alive = true;
    void api<{ id: string }[]>("/api/projects")
      .then(async (rows) => {
        if (rows[0]) {
          const p = await api<Project>(`/api/projects?id=${rows[0].id}`);
          if (alive && p) setProject(p);
        }
        if (alive) {
          setReady(true);
          setSaved("saved");
        }
      })
      .catch((e) => {
        setError(e.message);
        setReady(true);
        setSaved("error");
      });
    return () => {
      alive = false;
    };
  }, [setProject, setSaved]);
  useEffect(() => {
    if (!ready) return;
    setSaved("saving");
    const timer = setTimeout(() => {
      void api<Project>("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(project),
      })
        .then(() => setSaved("saved"))
        .catch((e) => {
          setSaved("error");
          setError(e.message);
        });
    }, 700);
    return () => clearTimeout(timer);
  }, [project, ready, setSaved]);
  useEffect(() => {
    let live = true;
    const refresh = () =>
      void api<RenderJob[]>("/api/render")
        .then((v) => {
          if (live) setJobs(v);
        })
        .catch(() => {});
    refresh();
    const timer = setInterval(refresh, 1800);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (mode !== "cinema") return;
    const p = player.current;
    if (!p) return;
    const update = ({ detail }: { detail: { frame: number } }) =>
      setFrame(detail.frame);
    const play = () => setPlaying(true),
      pause = () => setPlaying(false);
    p.addEventListener("frameupdate", update);
    p.addEventListener("play", play);
    p.addEventListener("pause", pause);
    p.addEventListener("ended", pause);
    return () => {
      p.removeEventListener("frameupdate", update);
      p.removeEventListener("play", play);
      p.removeEventListener("pause", pause);
      p.removeEventListener("ended", pause);
    };
  }, [mode, ready, setFrame]);
  function seek(value: number) {
    const n = Math.max(0, Math.min(frames - 1, Math.round(value)));
    setFrame(n);
    player.current?.seekTo(n);
  }
  function chooseScene(i: number) {
    selectScene(i);
    const f = project.scenes
      .slice(0, i)
      .reduce((n, v) => n + Math.round(v.duration * project.fps), 0);
    seek(
      f +
        Math.min(20, Math.round(project.scenes[i].duration * project.fps) - 1),
    );
  }
  async function run(work: () => Promise<void>) {
    setError("");
    try {
      await work();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function importFiles(files: File[], target = uploadTarget.current) {
    if (!files.length) return;
    setBusy("Preparando importación…");
    setError("");
    try {
      const imported: Asset[] = [];
      let duplicates = 0;
      for (let i = 0; i < files.length; i++) {
        setBusy(`Procesando ${i + 1} de ${files.length} · ${files[i].name}`);
        const data = new FormData();
        data.append("file", files[i]);
        const result = await api<{ asset: Asset; duplicate: boolean }>(
          "/api/import",
          { method: "POST", body: data },
        );
        imported.push(result.asset);
        if (result.duplicate) duplicates++;
      }
      if (target && imported.length === 1) {
        patchBook(target.id, { [target.side]: imported[0] });
        selectBook(target.id);
        setRightTab("product");
        setMode("inspect");
      } else {
        const groups = pairFiles(
          files.map((f) => f.webkitRelativePath || f.name),
        );
        const books = groups.flatMap((g) => {
          const b = makeBook(g.name.split("/").at(-1) || g.name);
          b.front =
            g.front !== undefined
              ? imported[g.front]
              : g.unassigned[0] !== undefined
                ? imported[g.unassigned[0]]
                : null;
          b.back = g.back !== undefined ? imported[g.back] : null;
          if (b.front) {
            b.width =
              Math.round(
                Math.max(
                  8,
                  Math.min(40, (28 * b.front.width) / b.front.height),
                ) * 10,
              ) / 10;
          }
          const extras = g.unassigned
            .slice(g.front === undefined ? 1 : 0)
            .map((i) => ({ ...makeBook(files[i].name), front: imported[i] }));
          return [b, ...extras];
        });
        const current = useStudio.getState().project;
        patchProject({ books: [...current.books, ...books] });
        selectBook(books[0].id);
        setRightTab("product");
        setMode("inspect");
        setToast(
          `${books.length} productos importados${duplicates ? ` · ${duplicates} archivos ya estaban en caché` : ""}. Revisa las parejas marcadas.`,
        );
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
      uploadTarget.current = null;
      if (single.current) single.current.value = "";
      if (batch.current) batch.current.value = "";
      if (folder.current) folder.current.value = "";
    }
  }
  function uploadSide(side: "front" | "back") {
    if (!book) return;
    uploadTarget.current = { id: book.id, side };
    single.current?.click();
  }
  function newBook() {
    const b = makeBook();
    patchProject({ books: [...project.books, b] });
    selectBook(b.id);
    setRightTab("product");
    setMode("inspect");
  }
  async function exportJob(kind: RenderJob["kind"], one?: Project) {
    await api("/api/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project: one || project,
        kind,
        quality,
        frame,
        transparent: kind === "video" ? false : transparent,
      }),
    });
    setLeftTab("queue");
    setToast("Trabajo añadido a la cola local.");
  }
  function applyTemplate(index: number) {
    const scenes = scenesFromTemplate(
      index,
      project.books.map((b) => b.id),
    );
    patchProject({ scenes, format: index === 3 ? "portrait" : project.format });
    selectScene(0);
    setMode("cinema");
    setRightTab("scene");
    seek(25);
    setToast(`Plantilla aplicada: ${templates[index].name}`);
  }
  function updateAsset(id: string, side: "front" | "back", asset: Asset) {
    patchBook(id, { [side]: asset });
  }
  async function demo() {
    setBusy("Preparando libro de ejemplo…");
    try {
      const result = await api<{ book: typeof book }>("/api/demo", {
        method: "POST",
      });
      if (result.book) {
        patchProject({ books: [...project.books, result.book] });
        selectBook(result.book.id);
        setToast(
          "Libro de ejemplo creado localmente. Sustituye sus fotos por las de tu producto.",
        );
        seek(30);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  if (!ready)
    return (
      <div className="boot">
        <div className="brand-symbol">
          <BookOpen />
        </div>
        <h1>
          BookStudio<span> AI</span>
        </h1>
        <p>Preparando tu espacio de producción…</p>
        <LoaderCircle className="spin" size={20} />
      </div>
    );
  return (
    <div className="studio-shell">
      <input
        ref={single}
        hidden
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => void importFiles(Array.from(e.target.files || []))}
      />
      <input
        ref={batch}
        hidden
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) =>
          void importFiles(Array.from(e.target.files || []), null)
        }
      />
      <input
        ref={folder}
        hidden
        type="file"
        multiple
        {...{ webkitdirectory: "", directory: "" }}
        onChange={(e) =>
          void importFiles(
            Array.from(e.target.files || []).filter((f) =>
              /\.(png|jpe?g|webp)$/i.test(f.name),
            ),
            null,
          )
        }
      />
      <input
        ref={audio}
        hidden
        type="file"
        accept="audio/mpeg,audio/wav"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file)
            void run(async () => {
              const data = new FormData();
              data.append("file", file);
              const result = await api<{ name: string }>("/api/audio", {
                method: "POST",
                body: data,
              });
              patchProject({ audio: result.name });
              setToast("Música añadida a la producción.");
            });
        }}
      />
      <header className="topbar">
        <div className="brand">
          <div className="brand-symbol">
            <BookOpen size={23} />
          </div>
          <strong>
            BookStudio<span> AI</span>
          </strong>
          <span className="beta">LOCAL STUDIO</span>
        </div>
        <div className="project-switch">
          <button onClick={() => setProjectsOpen(true)}>
            <FolderOpen size={15} />
            {project.name}
            <ChevronDown size={13} />
          </button>
          <span className={cn("save-state", saved === "error" && "error")}>
            <span />
            {saved === "saved"
              ? "Guardado en este equipo"
              : saved === "error"
                ? "Error al guardar"
                : "Guardando…"}
          </span>
        </div>
        <div className="top-actions">
          <span className="local-label">
            <ShieldCheck size={14} /> Procesamiento local
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setProjectsOpen(true)}
          >
            <FolderOpen size={14} /> Proyectos
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setRightTab("export");
            }}
          >
            <Download size={14} /> Exportar <ChevronDown size={12} />
          </Button>
        </div>
      </header>
      <aside className="tool-rail">
        <button
          className={leftTab === "library" ? "active" : ""}
          title="Biblioteca"
          aria-label="Biblioteca"
          onClick={() => setLeftTab("library")}
        >
          <BookOpen size={21} />
        </button>
        <button
          className={leftTab === "templates" ? "active" : ""}
          title="Plantillas"
          aria-label="Plantillas"
          onClick={() => setLeftTab("templates")}
        >
          <Layers3 size={21} />
        </button>
        <button
          className={leftTab === "queue" ? "active" : ""}
          title="Cola de render"
          aria-label="Cola de render"
          onClick={() => setLeftTab("queue")}
        >
          <Film size={21} />
          {selectedJobs.length > 0 && <i />}
        </button>
        <div className="rail-bottom">
          <button
            title="Ajustes de producción"
            aria-label="Ajustes de producción"
            onClick={() => setRightTab("export")}
          >
            <Settings2 size={20} />
          </button>
          <span>BS</span>
        </div>
      </aside>
      <aside className="library-panel">
        <div className="panel-heading">
          <h2>
            {leftTab === "library"
              ? "Biblioteca"
              : leftTab === "templates"
                ? "Plantillas"
                : "Renderización"}
          </h2>
          {leftTab === "library" ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Nuevo libro"
              onClick={newBook}
            >
              <Plus size={17} />
            </Button>
          ) : (
            <span className="count">
              {leftTab === "templates"
                ? "06"
                : jobs.length.toString().padStart(2, "0")}
            </span>
          )}
        </div>
        {leftTab === "library" ? (
          <>
            <div className="library-search">
              <Search size={14} />
              <input
                aria-label="Buscar libros"
                placeholder="Buscar un libro…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <span>⌕</span>
            </div>
            <div className="library-filters">
              <button
                className={filter === "all" ? "active" : ""}
                onClick={() => setFilter("all")}
              >
                Todos <span>{project.books.length}</span>
              </button>
              <button
                className={filter === "review" ? "active" : ""}
                onClick={() => setFilter("review")}
              >
                Por revisar
              </button>
            </div>
            <div
              className={cn("drop-zone", dragging && "dragging")}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                void importFiles(Array.from(e.dataTransfer.files), null);
              }}
            >
              <Upload size={22} />
              <strong>
                Tu próxima producción
                <br />
                empieza con dos fotos.
              </strong>
              <p>
                Arrastra portadas y contraportadas
                <br />
                JPG, PNG o WebP · hasta 30 MB
              </p>
              <Button
                variant="secondary"
                size="sm"
                disabled={Boolean(busy)}
                onClick={() => {
                  uploadTarget.current = null;
                  batch.current?.click();
                }}
              >
                Importar fotografías
              </Button>
              <button
                className="text-button"
                onClick={() => folder.current?.click()}
                disabled={Boolean(busy)}
              >
                <FolderOpen size={12} /> Seleccionar carpeta
              </button>
            </div>
            <div className="library-label">
              PRODUCTOS{" "}
              <span>{project.books.length.toString().padStart(2, "0")}</span>
            </div>
            <div className="book-list">
              {project.books
                .filter(
                  (b) =>
                    (filter !== "review" ||
                      !b.front ||
                      !b.back ||
                      b.front.warnings.length > 0 ||
                      b.back.warnings.length > 0) &&
                    b.name.toLowerCase().includes(query.toLowerCase()),
                )
                .map((b) => (
                  <button
                    key={b.id}
                    className={cn("book-card", b.id === book?.id && "selected")}
                    onClick={() => {
                      selectBook(b.id);
                      setRightTab("product");
                    }}
                  >
                    <div className="book-thumb">
                      {b.front ? (
                        <img
                          src={`/api/assets/${b.front.texture}?proxy=256`}
                          alt={`Portada de ${b.name}`}
                        />
                      ) : (
                        <BookOpen size={24} />
                      )}
                    </div>
                    <div className="book-card-info">
                      <strong>{b.name}</strong>
                      <small>
                        {b.front && b.back
                          ? `${b.width} × ${b.height} cm`
                          : "Fotografías incompletas"}
                      </small>
                      <span
                        className={cn(
                          "book-status",
                          b.front && b.back && "complete",
                        )}
                      >
                        {b.front && b.back ? (
                          <>
                            <Check size={10} /> 2 texturas
                          </>
                        ) : (
                          <>
                            <Clock3 size={10} /> Por emparejar
                          </>
                        )}
                      </span>
                    </div>
                    <ChevronRight size={13} />
                  </button>
                ))}
            </div>
            {!project.books.length && (
              <button
                className="demo-button"
                onClick={() => void demo()}
                disabled={Boolean(busy)}
              >
                <Box size={15} />
                <span>
                  Explorar con un libro de ejemplo
                  <small>Diseño de muestra incluido</small>
                </span>
                <ChevronRight size={14} />
              </button>
            )}
            <div className="library-footer">
              <ShieldCheck size={13} />
              <span>Originales siempre conservados</span>
            </div>
          </>
        ) : leftTab === "templates" ? (
          <>
            <p className="panel-intro">
              Un punto de partida para tu próximo comercial. Cada escena es
              editable.
            </p>
            <div className="template-list">
              {templates.map((t, i) => (
                <button
                  key={t.name}
                  className="template-card"
                  onClick={() => applyTemplate(i)}
                >
                  <div className={`template-visual visual-${i}`}>
                    <span>{(i + 1).toString().padStart(2, "0")}</span>
                    <div className="mini-book" />
                    <div className="mini-book second" />
                    {i === 3 && <span className="vertical-label">9:16</span>}
                  </div>
                  <small>{t.label}</small>
                  <strong>{t.name}</strong>
                  <p>{t.description}</p>
                  <span className="template-action">
                    Aplicar plantilla <ChevronRight size={13} />
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="job-list">
            <p className="panel-intro">
              Renderización en este equipo. Puedes continuar editando mientras
              se exporta.
            </p>
            {jobs.length === 0 && (
              <div className="queue-empty">
                <Film size={28} />
                <strong>Todo listo para renderizar</strong>
                <p>Tu historial de exportaciones aparecerá aquí.</p>
              </div>
            )}
            {jobs.map((job) => (
              <article className="job" key={job.id}>
                <div>
                  <strong>{job.projectName}</strong>
                  <span>
                    {job.kind === "video"
                      ? "MP4 · H.264"
                      : job.kind.toUpperCase()}
                  </span>
                </div>
                <div className="job-status">
                  <span>
                    {job.status === "done"
                      ? "Completado"
                      : job.status === "error"
                        ? "Error"
                        : job.status === "cancelled"
                          ? "Cancelado"
                          : job.status === "queued"
                            ? "En cola"
                            : `${Math.round(job.progress * 100)} %`}
                  </span>
                  {(job.status === "rendering" || job.status === "queued") && (
                    <button
                      aria-label="Cancelar render"
                      onClick={() =>
                        void run(async () => {
                          await api("/api/render", {
                            method: "DELETE",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ id: job.id }),
                          });
                        })
                      }
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
                <progress value={job.progress} max={1} />
                <p className={job.status === "error" ? "error" : ""}>
                  {job.message}
                </p>
                {job.file && job.status === "done" && (
                  <a href={`/api/exports/${job.file}`} download={job.file}>
                    <Download size={13} /> Descargar archivo
                  </a>
                )}
              </article>
            ))}
          </div>
        )}
      </aside>
      <main className="workspace">
        <div className="workspace-bar">
          <div className="workspace-tabs">
            <button
              className={mode === "cinema" ? "active" : ""}
              onClick={() => {
                setMode("cinema");
                setPlaying(false);
              }}
            >
              <Clapperboard size={15} /> Cinema Studio
            </button>
            <button
              className={mode === "inspect" ? "active" : ""}
              onClick={() => {
                player.current?.pause();
                setMode("inspect");
                setPlaying(false);
              }}
            >
              <Box size={15} /> Libro 3D
            </button>
          </div>
          <div className="workspace-info">
            <span className="status-dot" />{" "}
            {mode === "cinema" ? "VISTA PREVIA" : "VISOR INTERACTIVO"}
            <span className="separator" />
            <Monitor size={13} />
            <span>
              {project.format === "portrait"
                ? "9:16"
                : project.format === "square"
                  ? "1:1"
                  : "16:9"}
            </span>
          </div>
        </div>
        <div className="preview-toolbar">
          <label>
            Formato
            <select
              aria-label="Formato de producción"
              value={project.format}
              onChange={(e) =>
                patchProject({ format: e.target.value as Project["format"] })
              }
            >
              <option value="landscape">Horizontal · 16:9</option>
              <option value="portrait">Vertical · 9:16</option>
              <option value="square">Cuadrado · 1:1</option>
            </select>
          </label>
          <label>
            Vista previa
            <select
              aria-label="Resolución del proxy"
              value={
                project.useProxies === false ? "original" : project.performance
              }
              onChange={(e) =>
                e.target.value === "original"
                  ? patchProject({ useProxies: false })
                  : patchProject({
                      useProxies: true,
                      performance: e.target.value as Project["performance"],
                    })
              }
            >
              <option value="low">Proxy 256 px · muy fluido</option>
              <option value="medium">Proxy 512 px · equilibrado</option>
              <option value="high">Proxy 1024 px · detalle</option>
              <option value="original">Originales · más pesado</option>
            </select>
          </label>
          <label className="preview-toggle">
            <input
              type="checkbox"
              checked={project.showText === false}
              onChange={(e) => patchProject({ showText: !e.target.checked })}
            />
            Sin textos
          </label>
        </div>
        <div className="stage-area" ref={stage}>
          <div className="stage-topline">
            <span>
              {mode === "cinema" ? scene.name : "Inspección de producto"}{" "}
              <ChevronDown size={12} />
            </span>
            <span>
              {mode === "cinema"
                ? `${size.width} × ${size.height}`
                : "ÓRBITA 360°"}{" "}
              <span className="stage-quality">{project.fps} FPS</span>
            </span>
          </div>
          <div
            className={cn(
              "stage-frame",
              project.format === "portrait" && "portrait",
            )}
            style={{ aspectRatio: `${size.width}/${size.height}` }}
          >
            <ViewBoundary>
              {mode === "cinema" ? (
                <Player
                  ref={player}
                  component={VideoComposition}
                  inputProps={previewProps}
                  durationInFrames={frames}
                  fps={project.fps}
                  compositionWidth={preview.width}
                  compositionHeight={preview.height}
                  initialFrame={Math.min(30, frames - 1)}
                  style={{ width: "100%", height: "100%" }}
                  controls={false}
                  clickToPlay={false}
                  loop={false}
                  acknowledgeRemotionLicense
                />
              ) : (
                <Viewer
                  ref={viewer}
                  project={project}
                  scene={scene}
                  frame={Math.round((scene.duration * project.fps) / 2)}
                  viewBookId={book?.id || ""}
                />
              )}
            </ViewBoundary>
            {project.books.length === 0 && (
              <span className="sample-badge">
                LIBRO DE MUESTRA · IMPORTA TUS FOTOS PARA PRODUCIR
              </span>
            )}
          </div>
          <div className="stage-bottomline">
            <span className="proxy-status">
              {preview.proxySize
                ? `Proxy ${preview.proxySize} px · vista ${preview.width} × ${preview.height}`
                : "Texturas originales"}{" "}
              · exportación con originales
            </span>
            {mode === "inspect" ? (
              <span>
                Arrastra para girar <i /> Rueda para acercar <i /> Botón derecho
                para desplazar
              </span>
            ) : (
              <span>
                <ShieldCheck size={12} />{" "}
                {project.books.some(
                  (b) => b.front?.aiAccepted || b.back?.aiAccepted,
                )
                  ? "Copia IA aceptada"
                  : "Modo fiel"}{" "}
                <i />{" "}
                {project.books.some(
                  (b) => b.front?.aiAccepted || b.back?.aiAccepted,
                )
                  ? "Revisa el contenido impreso"
                  : "Impresión conservada"}
              </span>
            )}
            <div>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Restablecer cámara"
                onClick={() =>
                  mode === "inspect" ? viewer.current?.view("reset") : seek(30)
                }
              >
                <RotateCcw size={14} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Pantalla completa"
                onClick={() =>
                  void stage.current
                    ?.requestFullscreen()
                    .catch((e) => setError(e.message))
                }
              >
                <Maximize size={14} />
              </Button>
            </div>
          </div>
        </div>
        <div className="transport">
          <div className="transport-left">
            <span className="transport-label">
              {mode === "cinema"
                ? "SECUENCIA PRINCIPAL"
                : "VISTAS DEL PRODUCTO"}
            </span>
            {mode === "inspect" && (
              <div className="angle-buttons">
                {[
                  ["front", "Frente"],
                  ["back", "Reverso"],
                  ["side", "Lomo"],
                  ["top", "Superior"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => viewer.current?.view(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="playback">
            <button aria-label="Ir al inicio" onClick={() => seek(0)}>
              <SkipBack size={16} />
            </button>
            <button
              className="play-button"
              aria-label={playing ? "Pausar" : "Reproducir"}
              disabled={mode !== "cinema"}
              onClick={() => {
                if (player.current?.isPlaying()) player.current.pause();
                else player.current?.play();
              }}
            >
              {playing ? (
                <Pause size={16} />
              ) : (
                <Play size={16} fill="currentColor" />
              )}
            </button>
            <button aria-label="Ir al final" onClick={() => seek(frames - 1)}>
              <SkipForward size={16} />
            </button>
          </div>
          <div className="timecode">
            <span>
              <Time frame={frame} fps={project.fps} />
            </span>
            <span>/</span>
            <Time frame={frames} fps={project.fps} />
          </div>
        </div>
        <section className="timeline">
          <div className="timeline-header">
            <div>
              <Layers3 size={14} />
              <h2>Timeline</h2>
              <span>{project.scenes.length} escenas</span>
            </div>
            <div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => audio.current?.click()}
              >
                <Music2 size={13} /> Música
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  patchProject({
                    scenes: [
                      ...project.scenes,
                      {
                        ...makeScene(),
                        name: `Escena ${project.scenes.length + 1}`,
                      },
                    ],
                  });
                }}
              >
                <Plus size={13} /> Añadir escena
              </Button>
            </div>
          </div>
          <div className="timeline-body">
            <div className="track-labels">
              <div>
                VIDEO <Film size={12} />
              </div>
              <div>
                TEXTOS <span>T</span>
              </div>
            </div>
            <div className="timeline-tracks">
              <div className="time-ruler">
                {Array.from({ length: 9 }, (_, i) => (
                  <span key={i}>
                    {Math.round(((frames / project.fps) * i) / 8)
                      .toString()
                      .padStart(2, "0")}
                    s
                  </span>
                ))}
              </div>
              <input
                aria-label="Posición del timeline"
                className="timeline-scrubber"
                type="range"
                min={0}
                max={frames - 1}
                value={Math.min(frame, frames - 1)}
                onChange={(e) => seek(Number(e.target.value))}
              />
              <div className="scene-tracks">
                {project.scenes.map((s, i) => (
                  <button
                    key={s.id}
                    className={cn(
                      "scene-clip",
                      i === selectedScene && "selected",
                    )}
                    style={{ flex: s.duration, minWidth: 85 }}
                    onClick={() => chooseScene(i)}
                  >
                    <span className="clip-number">
                      {(i + 1).toString().padStart(2, "0")}
                    </span>
                    <strong>{movementNames[s.movement]}</strong>
                    <small>{s.duration}s</small>
                    <span className="clip-lines" />
                  </button>
                ))}
              </div>
              <div
                className={cn(
                  "text-tracks",
                  project.showText === false && "muted-track",
                )}
              >
                {project.scenes.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => chooseScene(i)}
                    style={{ flex: s.duration, minWidth: 85 }}
                  >
                    <span>T</span>
                    {showsText(project, s)
                      ? s.title.replaceAll("\n", " ") || "Sin título"
                      : "Textos ocultos"}
                  </button>
                ))}
              </div>
              <div
                className="playhead"
                style={{ left: `${Math.min(100, (frame / frames) * 100)}%` }}
              >
                <span />
              </div>
            </div>
          </div>
          {project.audio && (
            <div className="audio-track">
              <Music2 size={12} /> Música de fondo · se incluye en el MP4{" "}
              <button
                aria-label="Quitar música"
                onClick={() => patchProject({ audio: null })}
              >
                <X size={12} />
              </button>
            </div>
          )}
        </section>
      </main>
      <aside className="properties-panel">
        <div className="property-tabs">
          {(["scene", "product", "export"] as const).map((t, i) => (
            <button
              key={t}
              className={rightTab === t ? "active" : ""}
              onClick={() => setRightTab(t)}
            >
              {
                [
                  <Settings2 size={14} key="s" />,
                  <Box size={14} key="b" />,
                  <Download size={14} key="d" />,
                ][i]
              }
              {["Escena", "Producto", "Exportar"][i]}
            </button>
          ))}
        </div>
        <div className="property-scroll">
          {rightTab === "product" ? (
            book ? (
              <>
                <BookProperties
                  key={book.id}
                  book={book}
                  assets={assets}
                  onUpload={uploadSide}
                  onCrop={(side) => {
                    if (book[side])
                      setCrop({ asset: book[side]!, bookId: book.id, side });
                  }}
                  onAI={(side) => {
                    if (book[side])
                      setAI({ asset: book[side]!, bookId: book.id, side });
                  }}
                />
                <div className="property-section">
                  <Button
                    variant="ghost"
                    className="danger full"
                    onClick={() => {
                      patchProject({
                        books: project.books.filter((b) => b.id !== book.id),
                        scenes: project.scenes.map((s) => ({
                          ...s,
                          bookIds: s.bookIds.filter((id) => id !== book.id),
                        })),
                      });
                      selectBook("");
                    }}
                  >
                    <Trash2 size={14} /> Quitar de esta producción
                  </Button>
                </div>
              </>
            ) : (
              <div className="property-empty">
                <Box size={30} />
                <h3>Todo comienza con un libro</h3>
                <p>
                  Importa las dos fotografías o crea un producto para
                  asignarlas.
                </p>
                <Button size="sm" onClick={newBook}>
                  <Plus size={14} /> Crear producto
                </Button>
              </div>
            )
          ) : rightTab === "scene" ? (
            <>
              <div className="property-section">
                <div className="section-title">
                  ESCENARIO <span>01</span>
                </div>
                <div className="studio-presets">
                  {studios.map((p) => (
                    <button
                      key={p}
                      className={cn("preset", p === scene.studio && "selected")}
                      onClick={() => patchScene({ studio: p })}
                    >
                      <span className={`preset-image preset-${p}`}>
                        <i />
                        {p === scene.studio && <Check size={13} />}
                      </span>
                      <span>{studioNames[p]}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="property-section">
                <div className="section-title">
                  CÁMARA Y MOVIMIENTO <span>02</span>
                </div>
                <div className="field">
                  <label htmlFor="movement">Movimiento de producto</label>
                  <select
                    id="movement"
                    value={scene.movement}
                    onChange={(e) =>
                      patchScene({
                        movement: e.target.value as Scene["movement"],
                      })
                    }
                  >
                    {movements.map((m) => (
                      <option key={m} value={m}>
                        {movementNames[m]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="duration">Duración / s</label>
                    <input
                      id="duration"
                      type="number"
                      min={1}
                      max={60}
                      step={1}
                      value={scene.duration}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        if (n >= 1 && n <= 60) patchScene({ duration: n });
                      }}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="transition">Transición</label>
                    <select
                      id="transition"
                      value={scene.transition}
                      onChange={(e) =>
                        patchScene({
                          transition: e.target.value as Scene["transition"],
                        })
                      }
                    >
                      <option value="fade">Fundido a negro</option>
                      <option value="cut">Corte directo</option>
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="fov">
                    Campo de visión <span>{scene.fov}°</span>
                  </label>
                  <input
                    id="fov"
                    type="range"
                    min="20"
                    max="80"
                    value={scene.fov}
                    onChange={(e) =>
                      patchScene({ fov: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="field">
                  <label htmlFor="speed">
                    Velocidad <span>{scene.speed.toFixed(1)}×</span>
                  </label>
                  <input
                    id="speed"
                    type="range"
                    min=".2"
                    max="2"
                    step=".1"
                    value={scene.speed}
                    onChange={(e) =>
                      patchScene({ speed: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="field">
                  <label htmlFor="light">
                    Intensidad de luz <span>{scene.light.toFixed(1)}</span>
                  </label>
                  <input
                    id="light"
                    type="range"
                    min=".2"
                    max="3"
                    step=".1"
                    value={scene.light}
                    onChange={(e) =>
                      patchScene({ light: Number(e.target.value) })
                    }
                  />
                </div>
                {project.books.length > 0 && (
                  <details className="pair-details">
                    <summary>Productos de esta escena</summary>
                    {project.books.map((b) => (
                      <label className="checkbox-label" key={b.id}>
                        <input
                          type="checkbox"
                          checked={
                            scene.bookIds.length === 0 ||
                            scene.bookIds.includes(b.id)
                          }
                          onChange={(e) => {
                            const current = scene.bookIds.length
                              ? scene.bookIds
                              : project.books.map((v) => v.id);
                            patchScene({
                              bookIds: e.target.checked
                                ? [...new Set([...current, b.id])]
                                : current.filter((id) => id !== b.id),
                            });
                          }}
                        />
                        {b.name}
                      </label>
                    ))}
                    <small className="hint">
                      Sin selección se usan todos los productos. Los planos
                      individuales muestran el primero.
                    </small>
                  </details>
                )}
              </div>
              <div className="property-section">
                <div className="section-title">
                  MENSAJE PUBLICITARIO <span>03</span>
                </div>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={scene.showText !== false}
                    onChange={(e) => patchScene({ showText: e.target.checked })}
                  />
                  Mostrar textos en esta escena
                </label>
                {!showsText(project, scene) && (
                  <p className="hint">
                    Textos ocultos. La marca, títulos, precio, CTA y frase
                    inferior no se verán ni se exportarán. El contenido guardado
                    se conserva; la impresión del libro permanece intacta.
                  </p>
                )}
                <div className="field">
                  <label htmlFor="scene-brand">Marca / editorial</label>
                  <input
                    id="scene-brand"
                    value={scene.brand ?? "BOOKSTUDIO"}
                    maxLength={80}
                    onChange={(e) => patchScene({ brand: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="scene-title">Título principal</label>
                  <textarea
                    id="scene-title"
                    rows={3}
                    value={scene.title}
                    maxLength={200}
                    onChange={(e) => patchScene({ title: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="scene-subtitle">Texto de apoyo</label>
                  <textarea
                    id="scene-subtitle"
                    rows={2}
                    value={scene.subtitle}
                    maxLength={300}
                    onChange={(e) => patchScene({ subtitle: e.target.value })}
                  />
                </div>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="price">Precio / oferta</label>
                    <input
                      id="price"
                      value={scene.price}
                      maxLength={40}
                      placeholder="S/ 49.90"
                      onChange={(e) => patchScene({ price: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="cta">Llamada a la acción</label>
                    <input
                      id="cta"
                      value={scene.cta}
                      maxLength={80}
                      placeholder="Pídelo aquí"
                      onChange={(e) => patchScene({ cta: e.target.value })}
                    />
                  </div>
                </div>
                <div className="scene-actions">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={selectedScene === 0}
                    aria-label="Mover escena antes"
                    onClick={() => {
                      const copy = [...project.scenes];
                      [copy[selectedScene - 1], copy[selectedScene]] = [
                        copy[selectedScene],
                        copy[selectedScene - 1],
                      ];
                      patchProject({ scenes: copy });
                      selectScene(selectedScene - 1);
                    }}
                  >
                    <ArrowUp size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={selectedScene === project.scenes.length - 1}
                    aria-label="Mover escena después"
                    onClick={() => {
                      const copy = [...project.scenes];
                      [copy[selectedScene + 1], copy[selectedScene]] = [
                        copy[selectedScene],
                        copy[selectedScene + 1],
                      ];
                      patchProject({ scenes: copy });
                      selectScene(selectedScene + 1);
                    }}
                  >
                    <ArrowDown size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label="Duplicar escena"
                    onClick={() =>
                      patchProject({
                        scenes: [
                          ...project.scenes,
                          {
                            ...scene,
                            id: crypto.randomUUID(),
                            name: scene.name + " · copia",
                          },
                        ],
                      })
                    }
                  >
                    <Copy size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="danger"
                    aria-label="Eliminar escena"
                    disabled={project.scenes.length === 1}
                    onClick={() => {
                      patchProject({
                        scenes: project.scenes.filter(
                          (_, i) => i !== selectedScene,
                        ),
                      });
                      selectScene(Math.max(0, selectedScene - 1));
                    }}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="property-section">
                <div className="section-title">
                  PRODUCCIÓN <span>01</span>
                </div>
                <div className="field">
                  <label htmlFor="project-name">Nombre del proyecto</label>
                  <input
                    id="project-name"
                    maxLength={120}
                    value={project.name}
                    onChange={(e) => {
                      if (e.target.value)
                        patchProject({ name: e.target.value });
                    }}
                  />
                </div>
                <div className="field">
                  <label htmlFor="fps">Fotogramas por segundo</label>
                  <select
                    id="fps"
                    value={project.fps}
                    onChange={(e) =>
                      patchProject({
                        fps: Number(e.target.value) as Project["fps"],
                      })
                    }
                  >
                    {[24, 30, 60].map((f) => (
                      <option key={f} value={f}>
                        {f} FPS
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="quality">Resolución de exportación</label>
                  <select
                    id="quality"
                    value={quality}
                    onChange={(e) =>
                      setQuality(e.target.value as typeof quality)
                    }
                  >
                    <option value="1080p">
                      1080p · {size.width} × {size.height}
                    </option>
                    <option value="preview">Borrador · 360p</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="performance">
                    Calidad del visor interactivo
                  </label>
                  <select
                    id="performance"
                    value={project.performance}
                    onChange={(e) =>
                      patchProject({
                        performance: e.target.value as Project["performance"],
                      })
                    }
                  >
                    <option value="low">Baja · menor consumo</option>
                    <option value="medium">Media · equilibrada</option>
                    <option value="high">Alta · mayor detalle</option>
                  </select>
                </div>
                <p className="hint">
                  4K pendiente de validación. El render usa la resolución de
                  exportación, independientemente del visor.
                </p>
              </div>
              <div className="property-section">
                <div className="section-title">
                  EXPORTAR <span>02</span>
                </div>
                <Button
                  className="full"
                  disabled={!project.books.some((b) => b.front && b.back)}
                  onClick={() => void run(() => exportJob("video"))}
                >
                  <Film size={15} /> Renderizar MP4
                </Button>
                <p className="hint">
                  H.264 · {(frames / project.fps).toFixed(1)} segundos · render
                  local
                </p>
                <div className="export-row">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => void run(() => exportJob("png"))}
                  >
                    <ImageIcon size={13} /> PNG
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => void run(() => exportJob("webp"))}
                  >
                    WebP
                  </Button>
                </div>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={transparent}
                    onChange={(e) => setTransparent(e.target.checked)}
                  />{" "}
                  Fondo transparente en imágenes
                </label>
                <p className="hint">
                  La imagen publicitaria usa el fotograma actual del timeline.
                </p>
                <hr />
                <Button
                  className="full"
                  variant="secondary"
                  size="sm"
                  disabled={mode !== "inspect" || !book?.front || !book?.back}
                  onClick={() =>
                    void run(async () => {
                      await viewer.current?.capture("png", transparent);
                    })
                  }
                >
                  <Download size={14} /> Foto de la cámara actual
                </Button>
                <Button
                  className="full"
                  variant="ghost"
                  size="sm"
                  disabled={mode !== "inspect" || !book?.front || !book?.back}
                  onClick={() =>
                    void run(async () => {
                      await viewer.current?.glb();
                    })
                  }
                >
                  <Box size={14} /> Descargar modelo GLB
                </Button>
                <p className="hint">
                  Para fotos desde cualquier ángulo y GLB, abre «Libro 3D». El
                  GLB usa metros.
                </p>
              </div>
              <div className="property-section">
                <div className="section-title">
                  LOTE DE PRODUCTOS <span>03</span>
                </div>
                <Button
                  className="full"
                  variant="secondary"
                  size="sm"
                  disabled={
                    !project.books.some((b) => b.front && b.back) ||
                    selectedJobs.length > 15
                  }
                  onClick={() =>
                    void run(async () => {
                      const complete = project.books.filter(
                        (b) => b.front && b.back,
                      );
                      for (const b of complete) {
                        await exportJob("video", {
                          ...project,
                          name: b.name,
                          books: [b],
                          scenes: project.scenes.map((s) => ({
                            ...s,
                            bookIds: [b.id],
                          })),
                        });
                      }
                    })
                  }
                >
                  <Layers3 size={14} /> Un MP4 por libro completo
                </Button>
                <p className="hint">
                  Aplica la secuencia actual a cada producto. La cola procesa un
                  video a la vez.
                </p>
              </div>
            </>
          )}
        </div>
        <div className="property-footer">
          <span className="status-dot" />{" "}
          {selectedJobs.length
            ? `${selectedJobs.length} trabajo(s) en cola`
            : "Estudio listo"}
          <span>v0.1</span>
        </div>
      </aside>
      <footer className="statusbar">
        <span>
          <ShieldCheck size={11} /> Tus archivos permanecen en este equipo
        </span>
        <span>
          Three.js + Remotion <i />
          {project.books.length} productos <i />
          {(frames / project.fps).toFixed(1)} s
        </span>
      </footer>
      {busy && (
        <div className="busy-banner" role="status">
          <LoaderCircle className="spin" size={17} />
          {busy}
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
          <button aria-label="Cerrar aviso" onClick={() => setToast("")}>
            <X size={14} />
          </button>
        </div>
      )}
      {error && (
        <div className="error-banner" role="alert">
          <span>{error}</span>
          <button aria-label="Cerrar error" onClick={() => setError("")}>
            <X size={17} />
          </button>
        </div>
      )}
      {crop && (
        <CropEditor
          asset={crop.asset}
          ratio={
            (project.books.find((b) => b.id === crop.bookId)?.width || 21) /
            (project.books.find((b) => b.id === crop.bookId)?.height || 28)
          }
          onClose={() => setCrop(null)}
          onApply={(asset) => updateAsset(crop.bookId, crop.side, asset)}
        />
      )}
      {ai && (
        <AIEditor
          asset={ai.asset}
          onClose={() => setAI(null)}
          onApply={(texture) => {
            updateAsset(ai.bookId, ai.side, {
              ...ai.asset,
              texture,
              aiAccepted: true,
            });
            setToast(
              "Copia IA aceptada. La fotografía original sigue conservada.",
            );
          }}
        />
      )}
      {projectsOpen && (
        <ProjectDialog
          onLoad={(p) => {
            setProject(p);
            setSaved("saving");
          }}
          onClose={() => setProjectsOpen(false)}
        />
      )}
    </div>
  );
}
