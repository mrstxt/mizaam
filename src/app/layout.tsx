import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "MIZAAM — Biznes Boshqaruv Tizimi",
  description: "Mezon — o'lchov, muvozanat, adolat.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚖️</text></svg>",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uz">
      <body className="bg-[#f5f5f7] text-[#1d1d1f] antialiased">
        <Sidebar />
        <main className="pl-[240px] min-h-screen">
          <div className="max-w-[1400px] mx-auto p-8 lg:p-10">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
