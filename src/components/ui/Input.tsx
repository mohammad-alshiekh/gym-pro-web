"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            className="text-xs font-medium uppercase tracking-widest"
            style={{ fontFamily: "JetBrains Mono, monospace", color: "#c3cad6" }}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#8b93a1" }}>
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full py-3 px-4 rounded-xl border text-sm transition-all input-accent",
              icon && "pl-10",
              error ? "border-[#ffb4ab]" : "border-[#2f3742]",
              className
            )}
            style={{
              background: "#0f1013",
              color: "#e9ecf1",
              fontFamily: "Inter, sans-serif",
              outline: "none",
            }}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs" style={{ color: "#ffb4ab" }}>
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-xs" style={{ color: "#8b93a1" }}>
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
