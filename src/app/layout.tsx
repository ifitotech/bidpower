import type { Metadata, Viewport } from "next";
import { I18nProvider } from "@/lib/i18n/provider";
import { ThemeProvider } from "@/lib/theme/provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bidpower",
  description: "Bidpower: tus proyectos, clientes y compras en un solo lugar",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Bidpower",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <ThemeProvider><I18nProvider>{children}</I18nProvider></ThemeProvider>
      </body>
    </html>
  );
}
