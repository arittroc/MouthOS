import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "MouthOS Clinical Atlas — Semantic Search",
  description:
    "Ask a clinical question and retrieve the most relevant pages from the MouthOS clinical atlas using Gemini embeddings and pgvector.",
  applicationName: "MouthOS Clinical Atlas",
  keywords: [
    "clinical atlas",
    "semantic search",
    "pgvector",
    "Gemini embeddings",
    "dental medicine",
  ],
  authors: [{ name: "MouthOS" }],
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#05040f",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="min-h-screen bg-ink-950 font-sans text-slate-200 selection:bg-indigo-500/40">
        {children}
      </body>
    </html>
  );
}
