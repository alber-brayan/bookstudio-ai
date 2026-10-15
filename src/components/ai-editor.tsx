"use client";
import { useEffect, useState, useRef } from "react";
import { Sparkles, X, Check, AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";
import type { Asset } from "@/lib/schema";
import { api } from "@/lib/utils";
type Version = {
  id: string;
  texture: string;
  model: string;
  prompt: string;
  createdAt: string;
};
type Status = {
  enabled: boolean;
  models: string[];
  model: string;
  used: number;
  limit: number;
  versions: Version[];
};
export function AIEditor({
  asset,
  onApply,
  onClose,
}: {
  asset: Asset;
  onApply: (texture: string) => void;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<Status | null>(null),
    [model, setModel] = useState("gpt-image-2.5-sunburst"),
    [prompt, setPrompt] = useState(
      "Ajustar suavemente la iluminación, conservar exactamente todo el texto y diseño impreso.",
    ),
    [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [version, setVersion] = useState<Version | null>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => {
    void api<Status>(`/api/ai?asset=${asset.id}`)
      .then((s) => {
        setStatus(s);
        setModel(s.model);
      })
      .catch((e) => setError(e.message));
    return () => controller.current?.abort();
  }, [asset.id]);
  async function generate() {
    setBusy(true);
    setError("");
    controller.current = new AbortController();
    try {
      const result = await api<Version>("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: asset.id, model, prompt, consent }),
        signal: controller.current.signal,
      });
      setVersion(result);
      const s = await api<Status>(`/api/ai?asset=${asset.id}`);
      setStatus(s);
    } catch (e) {
      setError(
        (e as Error).name === "AbortError"
          ? "Solicitud cancelada. La API podría haber comenzado a procesarla."
          : (e as Error).message,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="modal-backdrop">
      <section
        className="modal ai-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Mejora con IA"
      >
        <header>
          <div>
            <span className="eyebrow">AI IMAGE ENHANCEMENT</span>
            <h2>Una nueva versión. Tú decides.</h2>
          </div>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Cerrar IA"
            onClick={onClose}
          >
            <X size={18} />
          </Button>
        </header>
        <div className="warning">
          <AlertTriangle size={18} />
          <span>
            La IA puede modificar letras, logotipos o ilustraciones. Compara
            antes de aceptar. El original permanece guardado.
          </span>
        </div>
        <div className="comparison">
          <figure>
            <img src={`/api/assets/${asset.texture}`} alt="Versión fiel" />
            <figcaption>Versión actual</figcaption>
          </figure>
          <figure>
            {version ? (
              <img
                src={`/api/assets/${version.texture}`}
                alt="Copia mejorada con IA"
              />
            ) : (
              <div className="comparison-empty">
                <Sparkles />
                La copia aparecerá aquí
              </div>
            )}
            <figcaption>Mejora con IA · requiere revisión</figcaption>
          </figure>
        </div>
        {!status?.enabled && (
          <p className="hint">
            La IA está desactivada. Añade OPENAI_API_KEY a .env.local y reinicia
            BookStudio. El resto del estudio funciona sin clave.
          </p>
        )}
        <div className="field">
          <label htmlFor="ai-model">Modelo</label>
          <select
            id="ai-model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            {(status?.models || [model]).map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="ai-prompt">Indicación de edición</label>
          <textarea
            id="ai-prompt"
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>
        <label className="consent">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />{" "}
          Autorizo enviar esta copia a OpenAI y generar un cargo en mi cuenta.
        </label>
        <p className="hint">
          Costo variable según uso; no se dispone de una estimación fiable antes
          de la llamada. Solicitudes reservadas este mes: {status?.used ?? "—"}{" "}
          / {status?.limit ?? "—"}. El límite es de solicitudes, no de dólares.
        </p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {Boolean(status?.versions.length) && (
          <div className="version-list">
            Historial{" "}
            {status?.versions.map((v) => (
              <button key={v.id} onClick={() => setVersion(v)}>
                <img
                  src={`/api/assets/${v.texture}`}
                  alt="Versión IA anterior"
                />
                {new Date(v.createdAt).toLocaleDateString("es-PE")}
              </button>
            ))}
          </div>
        )}
        <footer>
          <Button
            variant="ghost"
            onClick={() => {
              controller.current?.abort();
              if (!busy) onClose();
            }}
          >
            {busy ? "Cancelar solicitud" : "Descartar y cerrar"}
          </Button>
          <Button
            disabled={!status?.enabled || !consent || busy || prompt.length < 5}
            onClick={() => void generate()}
          >
            <Sparkles size={15} />
            {busy ? "Generando copia…" : "Generar copia de pago"}
          </Button>
          {version && (
            <Button
              variant="secondary"
              onClick={() => {
                onApply(version.texture);
                onClose();
              }}
            >
              <Check size={15} />
              Aceptar esta copia
            </Button>
          )}
        </footer>
      </section>
    </div>
  );
}
