import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Import Hub",
  description: "Gestão de estoque e revenda de peças importadas dos EUA para o Brasil.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
