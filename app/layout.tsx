import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OportunIA - Radar de Clientes de Alto Valor",
  description:
    "Encuentra, califica y propone a clientes ideales para servicios de AI. Hecho para Inland Empire y SoCal.",
  authors: [{ name: "OportunIA" }],
  keywords: [
    "AI services",
    "lead generation",
    "B2B sales",
    "Inland Empire",
    "SoCal",
    "scoring",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
