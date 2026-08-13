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
  const base =
    "inline-flex items-center justify-center gap-2 font-medium transition-all rounded-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

  const variants = {
    primary:
      "bg-gradient-to-r from-[#c8f323] to-[#aed500] text-[#293500] hover:brightness-110 shadow-lg",
    secondary:
      "bg-[#23272e] text-[#e9ecf1] border border-[#2f3742] hover:border-[#c8f323] hover:text-[#c8f323]",
    ghost:
      "bg-transparent text-[#c3cad6] hover:bg-[#23272e] hover:text-[#e9ecf1]",
    danger:
      "bg-[#93000a]/20 text-[#ffb4ab] border border-[#93000a] hover:bg-[#93000a]/30",
    outline:
      "bg-transparent border border-[#c8f323] text-[#c8f323] hover:bg-[#c8f323]/10",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3.5 text-sm uppercase tracking-widest",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      style={{ fontFamily: variant === "primary" ? "Lexend, sans-serif" : "Inter, sans-serif" }}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}
