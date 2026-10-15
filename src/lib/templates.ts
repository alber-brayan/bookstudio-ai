import { makeScene, type Scene } from "./schema";
export const templates = [
  {
    name: "La primera impresión",
    label: "Un libro · 15 s",
    description: "Apertura, órbita y cierre con llamada a la acción.",
    movements: ["hero", "orbit", "final"],
    durations: [4, 7, 4],
  },
  {
    name: "Una colección, una historia",
    label: "Colección · 30 s",
    description: "Presentación de colección con planos de producto.",
    movements: ["hero", "panorama", "fan", "front-back", "final"],
    durations: [4, 8, 7, 6, 5],
  },
  {
    name: "El catálogo editorial",
    label: "Panorámico · 20 s",
    description: "Recorrido de catálogo y cierre de marca.",
    movements: ["panorama", "exploded", "final"],
    durations: [8, 7, 5],
  },
  {
    name: "Historias en vertical",
    label: "Reels / TikTok · 15 s",
    description: "Composición vertical y movimientos contenidos.",
    movements: ["hero", "floating", "final"],
    durations: [4, 7, 4],
  },
  {
    name: "Aprender tiene su lugar",
    label: "Educación · 15 s",
    description: "Libro educativo con precio y promoción editable.",
    movements: ["dolly", "front-back", "final"],
    durations: [5, 5, 5],
  },
  {
    name: "La edición premium",
    label: "Multi producto · 24 s",
    description: "Libros en abanico, profundidad y plano de cierre.",
    movements: ["hero", "fan", "exploded", "final"],
    durations: [4, 8, 7, 5],
  },
] as const;
export function scenesFromTemplate(index: number, bookIds: string[]): Scene[] {
  const t = templates[index];
  return t.movements.map((movement, i) => ({
    ...makeScene(bookIds),
    name: ["Apertura", "Descubrimiento", "Presentación", "Detalle", "Cierre"][
      Math.min(i, 4)
    ],
    movement,
    duration: t.durations[i],
    title:
      i === 0
        ? "Ideas que\nabren mundos."
        : i === t.movements.length - 1
          ? "Tu próxima\ngran historia."
          : "Descubre cada detalle.",
    subtitle:
      i === t.movements.length - 1
        ? "Disponible para ti."
        : "Ediciones que inspiran a llegar más lejos.",
    price: index === 4 ? "S/ 49.90" : "",
    cta: i === t.movements.length - 1 ? "Conoce la colección" : "",
    studio: index === 5 ? "black" : "emerald",
  }));
}
