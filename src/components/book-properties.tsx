"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bookSchema, type Book, type Asset } from "@/lib/schema";
import { useStudio } from "@/lib/store";
import { Button } from "./ui/button";
import { ScanLine, Sparkles, Upload, ArrowLeftRight } from "lucide-react";
import { api } from "@/lib/utils";
const schema = bookSchema.pick({ name: true, width: true, height: true });
type FormValues = { name: string; width: number; height: number };
export function BookProperties({
  book,
  assets,
  onCrop,
  onAI,
  onUpload,
}: {
  book: Book;
  assets: Asset[];
  onCrop: (side: "front" | "back") => void;
  onAI: (side: "front" | "back") => void;
  onUpload: (side: "front" | "back") => void;
}) {
  const patch = useStudio((s) => s.patchBook);
  const [restoreError, setRestoreError] = useState("");
  async function restore() {
    try {
      for (const side of ["front", "back"] as const) {
        if (book[side]?.aiAccepted) {
          const asset = await api<Asset>(`/api/correct?id=${book[side]!.id}`);
          patch(book.id, { [side]: asset });
        }
      }
      setRestoreError("");
    } catch (e) {
      setRestoreError((e as Error).message);
    }
  }
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: book.name, width: book.width, height: book.height },
  });
  useEffect(
    () => reset({ name: book.name, width: book.width, height: book.height }),
    [book.id, book.name, book.width, book.height, reset],
  );
  return (
    <>
      <div className="property-section">
        <div className="section-title">
          PRODUCTO <span>01</span>
        </div>
        <form onSubmit={handleSubmit((values) => patch(book.id, values))}>
          <div className="field">
            <label htmlFor="book-name">Nombre del libro</label>
            <input id="book-name" {...register("name")} />
            {errors.name && (
              <small className="error">{errors.name.message}</small>
            )}
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="book-width">Ancho / cm</label>
              <input
                id="book-width"
                type="number"
                step=".1"
                {...register("width", { valueAsNumber: true })}
              />
            </div>
            <div className="field">
              <label htmlFor="book-height">Alto / cm</label>
              <input
                id="book-height"
                type="number"
                step=".1"
                {...register("height", { valueAsNumber: true })}
              />
            </div>
          </div>
          {(errors.width || errors.height) && (
            <p className="error">Usa ancho de 8–40 cm y alto de 10–60 cm.</p>
          )}
          <Button variant="secondary" size="sm" type="submit" className="full">
            Aplicar dimensiones
          </Button>
        </form>
        <div className="field">
          <label htmlFor="thickness">
            Grosor <span>{book.thickness.toFixed(1)} cm</span>
          </label>
          <input
            id="thickness"
            type="range"
            min=".2"
            max="8"
            step=".1"
            value={book.thickness}
            onChange={(e) =>
              patch(book.id, { thickness: Number(e.target.value) })
            }
          />
        </div>
        <div className="field">
          <label htmlFor="binding">Encuadernación</label>
          <select
            id="binding"
            value={book.hardcover ? "hard" : "soft"}
            onChange={(e) =>
              patch(book.id, { hardcover: e.target.value === "hard" })
            }
          >
            <option value="soft">Tapa blanda</option>
            <option value="hard">Tapa dura</option>
          </select>
        </div>
      </div>
      <div className="property-section">
        <div className="section-title">
          TEXTURAS <span>02</span>
        </div>
        {(["front", "back"] as const).map((side) => (
          <div className="texture-row" key={side}>
            <button
              className="texture-preview"
              onClick={() => onUpload(side)}
              aria-label={`Importar ${side === "front" ? "portada" : "contraportada"}`}
            >
              {book[side] ? (
                <img
                  src={`/api/assets/${book[side]!.texture}?proxy=256`}
                  alt={side}
                />
              ) : (
                <Upload size={18} />
              )}
            </button>
            <div className="texture-info">
              <strong>{side === "front" ? "Portada" : "Contraportada"}</strong>
              <small>
                {book[side]
                  ? `${book[side]!.width} × ${book[side]!.height} px`
                  : "Sin fotografía"}
              </small>
              <div>
                <button
                  disabled={!book[side]}
                  onClick={() => onCrop(side)}
                  title="Corregir esquinas"
                >
                  <ScanLine size={14} /> Corregir
                </button>
                <button
                  disabled={!book[side]}
                  onClick={() => onAI(side)}
                  title="Mejorar copia con IA"
                >
                  <Sparkles size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {(book.front?.aiAccepted || book.back?.aiAccepted) && (
          <Button
            variant="secondary"
            size="sm"
            className="full"
            onClick={() => void restore()}
          >
            Restaurar texturas fieles
          </Button>
        )}
        {restoreError && <p className="error">{restoreError}</p>}
        <details className="pair-details">
          <summary>
            <ArrowLeftRight size={13} /> Corregir emparejamiento
          </summary>
          {(["front", "back"] as const).map((side) => (
            <div className="field" key={side}>
              <label htmlFor={`pair-${side}`}>
                {side === "front" ? "Portada" : "Contraportada"}
              </label>
              <select
                id={`pair-${side}`}
                value={book[side]?.id || ""}
                onChange={(e) =>
                  patch(book.id, {
                    [side]: assets.find((a) => a.id === e.target.value) || null,
                  })
                }
              >
                <option value="">Sin asignar</option>
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              patch(book.id, { front: book.back, back: book.front })
            }
          >
            Intercambiar caras
          </Button>
        </details>
        {[
          ...new Set([
            ...(book.front?.warnings || []),
            ...(book.back?.warnings || []),
          ]),
        ].map((w) => (
          <p key={w} className="quality-warning">
            {w}
          </p>
        ))}
      </div>
      <div className="property-section">
        <div className="section-title">
          MATERIAL Y LOMO <span>03</span>
        </div>
        <div className="material-options">
          {(["matte", "satin", "gloss"] as const).map((m, i) => (
            <button
              className={book.finish === m ? "selected" : ""}
              key={m}
              onClick={() => patch(book.id, { finish: m })}
            >
              <span
                style={{
                  background:
                    i === 0
                      ? "#748077"
                      : i === 1
                        ? "linear-gradient(130deg,#505b54,#bac6b8)"
                        : "linear-gradient(130deg,#38413a,#eff9ef,#465247)",
                }}
              />
              {["Mate", "Satinado", "Brillante"][i]}
            </button>
          ))}
        </div>
        <div className="field">
          <label htmlFor="spine-color">
            Color del lomo{" "}
            <input
              id="spine-color"
              type="color"
              value={book.spineColor}
              onChange={(e) => patch(book.id, { spineColor: e.target.value })}
            />
          </label>
        </div>
        <div className="field">
          <label htmlFor="spine-title">Texto del lomo</label>
          <input
            id="spine-title"
            value={book.spineText}
            placeholder={book.name}
            maxLength={120}
            onChange={(e) => patch(book.id, { spineText: e.target.value })}
          />
        </div>
        <p className="hint">
          Lomo sintético aproximado. No reconstruye el lomo original.
        </p>
      </div>
    </>
  );
}
