import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GreenMind — Financial Planning",
  description: "Planejamento financeiro inteligente para o casal",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%23166534'/><circle cx='16' cy='16' r='11' fill='%231A3D28'/><path d='M16 6C21.5 6 25 10 25 16C25 21 21.5 24 18.5 25L18.5 16L16 16Z' fill='%2322C55E'/><path d='M16 6C10.5 6 7 10 7 16C7 21 10 24 13.5 25L13.5 16L16 16Z' fill='%2316A34A'/></svg>",
  },
};

export default function FinancasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
