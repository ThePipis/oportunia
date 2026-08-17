import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/client";

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
    <html lang="es" className="dark" suppressHydrationWarning>
      <head>
        {/* Google Fonts: Inter (UI) + Outfit (display) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
