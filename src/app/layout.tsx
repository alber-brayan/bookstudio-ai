import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Editorial D’Fernandez | Textos escolares en Ayacucho",
  description:
    "Textos escolares personalizados con el logo de tu institución y adaptados a tu currícula. Impresión láser y encuadernación en Ayacucho, Perú. Cotiza al 916 227 046.",
  openGraph: {
    title: "Editorial D’Fernandez — Textos con tu identidad",
    description: "Tu logo, tu currícula y nuestra propuesta educativa. Textos escolares personalizados para instituciones en Ayacucho, Perú.",
    locale: "es_PE",
    type: "website",
  },
  icons: { icon: "/editorial/mascot.webp", apple: "/editorial/mascot.webp" },
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
