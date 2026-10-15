"use client";
import { useEffect, useState } from "react";
import { X, FolderOpen, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { api } from "@/lib/utils";
import { makeProject, type Project } from "@/lib/schema";
export function ProjectDialog({
  onLoad,
  onClose,
}: {
  onLoad: (p: Project) => void;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<
      { id: string; name: string; updated_at: string }[]
    >([]),
    [error, setError] = useState("");
  useEffect(() => {
    void api<typeof rows>("/api/projects")
      .then(setRows)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <div className="modal-backdrop">
      <section
        className="modal project-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Proyectos"
      >
        <header>
          <div>
            <span className="eyebrow">GUARDADO EN ESTE EQUIPO</span>
            <h2>Tus producciones</h2>
          </div>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Cerrar proyectos"
            onClick={onClose}
          >
            <X size={18} />
          </Button>
        </header>
        <Button
          onClick={() => {
            onLoad(makeProject());
            onClose();
          }}
        >
          <Plus size={16} /> Nueva producción
        </Button>
        <div className="project-list">
          {rows.map((p) => (
            <button
              key={p.id}
              onClick={() =>
                void api<Project>(`/api/projects?id=${p.id}`)
                  .then((v) => {
                    onLoad(v);
                    onClose();
                  })
                  .catch((e) => setError(e.message))
              }
            >
              <FolderOpen size={20} />
              <span>
                {p.name}
                <small>{new Date(p.updated_at).toLocaleString("es-PE")}</small>
              </span>
            </button>
          ))}
        </div>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
      </section>
    </div>
  );
}
