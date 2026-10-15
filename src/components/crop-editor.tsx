"use client";
import { useState, useRef } from "react";
import { X, Check, RotateCcw, ScanLine } from "lucide-react";
import { Button } from "./ui/button";
import { api } from "@/lib/utils";
import type { Asset, Point } from "@/lib/schema";
export function CropEditor({
  asset,
  ratio,
  onClose,
  onApply,
}: {
  asset: Asset;
  ratio: number;
  onClose: () => void;
  onApply: (asset: Asset) => void;
}) {
  const [points, setPoints] = useState<Point[]>(asset.corners);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<number | null>(null);
  async function apply(auto = false) {
    setBusy(true);
    setError("");
    try {
      const result = await api<Asset>("/api/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: asset.id,
          ...(auto ? {} : { corners: points }),
          ratio,
        }),
      });
      onApply(result);
      if (auto) setPoints(result.corners);
      else onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const move = (e: React.PointerEvent) => {
    if (drag.current === null || !svg.current) return;
    const r = svg.current.getBoundingClientRect();
    const p: Point = [
      Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)),
      Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)),
    ];
    setPoints((v) => v.map((old, i) => (i === drag.current ? p : old)));
  };
  return (
    <div className="modal-backdrop">
      <section
        className="modal crop-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Corregir perspectiva"
      >
        <header>
          <div>
            <span className="eyebrow">MODO FIEL / CORRECCIÓN GEOMÉTRICA</span>
            <h2>Ajusta las cuatro esquinas</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Cerrar corrección"
            onClick={onClose}
          >
            <X size={18} />
          </Button>
        </header>
        <p>
          Arrastra los puntos en orden: superior izquierda, superior derecha,
          inferior derecha, inferior izquierda. También puedes moverlos con las
          flechas del teclado.
        </p>
        <div className="crop-image">
          <img
            src={`/api/assets/${asset.original}`}
            alt="Fotografía original"
          />
          <svg
            ref={svg}
            viewBox="0 0 1000 1000"
            preserveAspectRatio="none"
            onPointerMove={move}
            onPointerUp={() => (drag.current = null)}
            onPointerCancel={() => (drag.current = null)}
          >
            <polygon
              points={points
                .map((p) => `${p[0] * 1000},${p[1] * 1000}`)
                .join(" ")}
              fill="#52dbab22"
              stroke="#56dfac"
              strokeWidth="3"
            />
            {points.map((p, i) => (
              <g key={i}>
                <circle
                  role="slider"
                  aria-label={`Esquina ${i + 1}`}
                  aria-valuenow={Math.round(p[0] * 100)}
                  tabIndex={0}
                  cx={p[0] * 1000}
                  cy={p[1] * 1000}
                  r="15"
                  fill="#a1f4cd"
                  stroke="#0c291e"
                  strokeWidth="3"
                  onPointerDown={(e) => {
                    drag.current = i;
                    e.currentTarget.setPointerCapture(e.pointerId);
                  }}
                  onKeyDown={(e) => {
                    const keys: Record<string, Point> = {
                      ArrowLeft: [-0.005, 0],
                      ArrowRight: [0.005, 0],
                      ArrowUp: [0, -0.005],
                      ArrowDown: [0, 0.005],
                    };
                    if (keys[e.key]) {
                      e.preventDefault();
                      const [x, y] = keys[e.key];
                      setPoints((v) =>
                        v.map((q, j) =>
                          j === i
                            ? [
                                Math.max(0, Math.min(1, q[0] + x)),
                                Math.max(0, Math.min(1, q[1] + y)),
                              ]
                            : q,
                        ),
                      );
                    }
                  }}
                />
                <text
                  x={p[0] * 1000 + 24}
                  y={p[1] * 1000 + 5}
                  fill="#fff"
                  fontSize="22"
                >
                  {i + 1}
                </text>
              </g>
            ))}
          </svg>
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <footer>
          <Button
            variant="ghost"
            onClick={() =>
              setPoints([
                [0, 0],
                [1, 0],
                [1, 1],
                [0, 1],
              ])
            }
          >
            <RotateCcw size={15} /> Imagen completa
          </Button>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => void apply(true)}
          >
            <ScanLine size={15} /> Detectar otra vez
          </Button>
          <Button disabled={busy} onClick={() => void apply()}>
            <Check size={15} />
            {busy ? "Procesando…" : "Aplicar corrección"}
          </Button>
        </footer>
      </section>
    </div>
  );
}
