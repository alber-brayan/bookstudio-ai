"use client";
import { Upload, Check, ArrowRight, ArrowLeftRight } from "lucide-react";
import type { Book } from "@/lib/schema";
import { Button } from "../ui/button";
export function QuickPhotos({
  book,
  busy,
  onUpload,
  onDrop,
  onReuse,
  onSwap,
  onPreview,
}: {
  book?: Book;
  busy: string;
  onUpload: (side: "front" | "back") => void;
  onDrop: (file: File, side: "front" | "back") => void;
  onReuse: () => void;
  onSwap: () => void;
  onPreview: () => void;
}) {
  const complete = Boolean(book?.front && book?.back);
  return (
    <section className="quick-photos" aria-label="Fotos del libro">
      <div className="quick-heading">
        <span>PASO 1</span>
        <h2>Tu libro, en dos fotos</h2>
        <p>Sube cada cara. El libro 3D se actualiza automáticamente.</p>
      </div>
      <div className="photo-slots">
        {(["front", "back"] as const).map((side) => {
          const asset = book?.[side],
            label = side === "front" ? "portada" : "contraportada";
          return (
            <button
              key={side}
              className={`photo-slot ${asset ? "has-photo" : ""}`}
              aria-label={`Subir ${label}`}
              disabled={Boolean(busy)}
              onClick={() => onUpload(side)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const file = event.dataTransfer.files[0];
                if (file && !busy) onDrop(file, side);
              }}
            >
              {asset ? (
                <img
                  src={`/api/assets/${asset.texture}?proxy=256`}
                  alt={label}
                />
              ) : (
                <Upload size={24} />
              )}
              <strong>{side === "front" ? "Portada" : "Contraportada"}</strong>
              <small>
                {asset ? (
                  <>
                    <Check size={12} />
                    Cambiar foto
                  </>
                ) : (
                  "Elegir o arrastrar"
                )}
              </small>
            </button>
          );
        })}
      </div>
      {busy ? (
        <p className="photo-feedback" role="status">
          {busy}
        </p>
      ) : (
        <p className="photo-feedback">
          {complete
            ? "Ambas caras listas. Ya puedes ver y exportar tu libro."
            : book?.front
              ? "Portada lista. Añade el reverso o reutiliza la misma foto."
              : "JPG, PNG o WebP · hasta 30 MB por foto"}
        </p>
      )}
      {book?.front && !book.back && (
        <Button
          variant="secondary"
          size="sm"
          className="full"
          disabled={Boolean(busy)}
          onClick={onReuse}
        >
          Usar portada también como reverso
        </Button>
      )}
      {complete && (
        <div className="photo-ready-actions">
          <Button onClick={onPreview} disabled={Boolean(busy)}>
            Ver mi libro <ArrowRight size={15} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onSwap}
            disabled={Boolean(busy)}
            aria-label="Intercambiar portada y contraportada"
          >
            <ArrowLeftRight size={16} />
          </Button>
        </div>
      )}
    </section>
  );
}
