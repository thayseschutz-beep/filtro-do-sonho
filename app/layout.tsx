import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = "https://www.appgreenmind.com.br";
const DESC =
  "Organize receitas e despesas, domine a regra 50/30/20 e realize suas metas. Controle financeiro pessoal simples e seguro, para todas as idades.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Green Mind — Dinheiro que cresce com clareza",
    template: "%s · Green Mind",
  },
  description: DESC,
  applicationName: "Green Mind",
  openGraph: {
    title: "Green Mind — Dinheiro que cresce com clareza",
    description: DESC,
    url: SITE_URL,
    siteName: "Green Mind",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Green Mind — Dinheiro que cresce com clareza",
    description: DESC,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
