"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  requiredRole?: "super_admin" | "gym_manager";
}

export default function DashboardLayout({
  children,
  title,
  requiredRole,
}: DashboardLayoutProps) {
  const router = useRouter();
  const { sidebarOpen } = useAppStore();
  const { locale } = useAppStore();
  const isRtl = locale === "ar";

  useEffect(() => {
    const auth = getAuth();
    if (!auth) {
      router.replace("/");
      return;
    }
    if (requiredRole && auth.role !== requiredRole) {
      if (auth.role === "super_admin") {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/manager/dashboard");
      }
    }
  }, [router, requiredRole]);

  return (
    <div
      className="min-h-screen flex"
      dir={isRtl ? "rtl" : "ltr"}
      style={{ background: "#0e0e0e" }}
    >
      <Sidebar />

      {/* Main content */}
      {/*
        The sidebar is a fixed-position drawer with its own overlay below
        `lg` — see Sidebar.tsx — so it already floats over the page on
        mobile instead of sharing space with it. The margin below is what
        makes room for it on desktop; it must stay `lg:`-scoped, or a phone
        also gets squeezed by the same 256px at the exact moment the drawer
        is covering it anyway.
      */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 overflow-x-hidden transition-all duration-300",
          isRtl
            ? sidebarOpen ? "lg:mr-64" : "lg:mr-16"
            : sidebarOpen ? "lg:ml-64" : "lg:ml-16"
        )}
      >
        <TopBar title={title} />
        <main className="flex-1 p-4 sm:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
