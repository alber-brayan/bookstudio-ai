"use client";
import dynamic from "next/dynamic";
const Studio = dynamic(() => import("@/components/studio"), {
  ssr: false,
  loading: () => (
    <div className="boot">
      <h1>BookStudio AI</h1>
      <p>Cargando estudio…</p>
    </div>
  ),
});
export default Studio;
