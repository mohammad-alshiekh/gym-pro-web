"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "neutral";
  className?: string;
}

const variants = {
  default: { bg: "rgba(200,243,35,0.1)", color: "#c8f323" },
  success: { bg: "rgba(74,225,118,0.1)", color: "#4ae176" },
  warning: { bg: "rgba(255,180,0,0.1)", color: "#ffd04a" },
  danger: { bg: "rgba(255,180,171,0.1)", color: "#ffb4ab" },
  info: { bg: "rgba(173,198,255,0.1)", color: "#adc6ff" },
  neutral: { bg: "rgba(195,202,214,0.1)", color: "#c3cad6" },
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
