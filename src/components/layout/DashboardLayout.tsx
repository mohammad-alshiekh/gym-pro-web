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
      style={{ background: "#0f1013" }}
    >
      <Sidebar />

      {/* Main content */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300",
          isRtl
            ? sidebarOpen ? "mr-64" : "mr-16"
            : sidebarOpen ? "ml-64" : "ml-16"
        )}
        style={{ maxWidth: "calc(100vw - 4rem)" }}
      >
        <TopBar title={title} />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
