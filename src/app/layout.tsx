import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "BookStudio AI — Estudio de producción editorial",
  description:
    "Fotografías de libros, escenas 3D y comerciales. Producidos en tu equipo.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
