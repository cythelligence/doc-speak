import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Doc-Speak: RAG Assistant",
  description: "Local RAG system for vendor documentation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50">{children}</body>
    </html>
  );
}
