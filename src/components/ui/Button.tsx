"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  // Pill-shaped — matches the mobile app's `StadiumBorder` ElevatedButton.
  const base =
    "relative overflow-hidden inline-flex items-center justify-center gap-2 font-bold transition-all rounded-full disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

  const variants = {
    primary:
      "bg-gradient-to-r from-[#cafd00] to-[#b5de00] text-[#3a4a00] hover:brightness-110 shadow-lg",
    secondary:
      "bg-[#20201f] text-[#ffffff] border border-[#2a2a2a] hover:border-[#cafd00] hover:text-[#cafd00]",
    ghost:
      "bg-transparent text-[#adaaaa] hover:bg-[#20201f] hover:text-[#ffffff]",
    danger:
      "bg-[#5c1620]/20 text-[#ff6e81] border border-[#5c1620] hover:bg-[#5c1620]/30",
    outline:
      "bg-transparent border border-[#cafd00] text-[#cafd00] hover:bg-[#cafd00]/10",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    // 24/16 padding matches the app's ElevatedButtonThemeData exactly.
    lg: "px-6 py-4 text-sm",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], loading && "btn-shimmer", className)}
      style={{ fontFamily: "Manrope, sans-serif" }}
      disabled={disabled || loading}
      {...props}
    >
      <span className="relative z-10 inline-flex items-center justify-center gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
        {children}
      </span>
    </button>
  );
}
