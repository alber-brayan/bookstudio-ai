import type { Metadata } from "next";
import Studio from "../client";

export const metadata: Metadata = { title: "BookStudio AI — Estudio de producción editorial" };

export default function StudioPage() {
  return <Studio />;
}
