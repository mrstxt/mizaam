"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login";

  if (isAuthPage) return <>{children}</>;

  return (
    <>
      <Sidebar />
      <main className="pl-[240px] min-h-screen">
        <div className="max-w-[1400px] mx-auto p-8 lg:p-10">{children}</div>
      </main>
    </>
  );
}
