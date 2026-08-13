"use client";

import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  accentColor?: string;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  accentColor = "#c8f323",
  trend,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl p-5 border card-interactive flex flex-col gap-4",
        className
      )}
      style={{
        background: "#171a1e",
        borderColor: "#2f3742",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            className="text-xs font-medium uppercase tracking-widest mb-1"
            style={{
              fontFamily: "JetBrains Mono, monospace",
              color: "#8b93a1",
            }}
          >
            {title}
          </p>
          <p
            className="text-3xl font-bold"
            style={{ fontFamily: "Lexend, sans-serif", color: "#e9ecf1" }}
          >
            {value}
          </p>
          {subtitle && (
            <p className="text-sm mt-1" style={{ color: "#8b93a1" }}>
              {subtitle}
            </p>
          )}
        </div>
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${accentColor}15`, color: accentColor }}
        >
          {icon}
        </div>
      </div>

      {trend && (
        <div className="flex items-center gap-1.5">
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              fontFamily: "JetBrains Mono, monospace",
              background: trend.value >= 0 ? "#4ae17615" : "#ffb4ab15",
              color: trend.value >= 0 ? "#4ae176" : "#ffb4ab",
            }}
          >
            {trend.value >= 0 ? "+" : ""}{trend.value}%
          </span>
          <span className="text-xs" style={{ color: "#8b93a1" }}>
            {trend.label}
          </span>
        </div>
      )}
    </div>
  );
}
