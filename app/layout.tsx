import type { Metadata } from "next";
import { fontVariables } from "@/design-system/fonts";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Traductor · Text-to-SQL with schema guardrails",
  description:
    "Text-to-SQL con guardrails: plantillas parametrizadas, detector de alucinaciones (tablas/columnas inexistentes) y allowlist SELECT-only. Validación determinista sin API keys.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${fontVariables} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ThemeProvider defaultTheme="dark" enableSystem={false} attribute="class">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
