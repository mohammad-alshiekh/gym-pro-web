"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "neutral";
  className?: string;
}

const variants = {
  default: { bg: "rgba(202,253,0,0.1)", color: "#cafd00" },
  success: { bg: "rgba(74,225,118,0.1)", color: "#4ae176" },
  warning: { bg: "rgba(255,180,0,0.1)", color: "#ffd04a" },
  danger: { bg: "rgba(255,110,129,0.1)", color: "#ff6e81" },
  info: { bg: "rgba(125,246,255,0.1)", color: "#7df6ff" },
  neutral: { bg: "rgba(173,170,170,0.1)", color: "#adaaaa" },
};

export default function Badge({ children, variant = "default", className }: BadgeProps) {
  const style = variants[variant];
  return (
    <span
      className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", className)}
      style={{
        background: style.bg,
        color: style.color,
        fontFamily: "JetBrains Mono, monospace",
      }}
    >
      {children}
    </span>
  );
}
