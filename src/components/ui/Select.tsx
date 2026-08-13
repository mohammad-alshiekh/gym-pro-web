"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, ...props }, ref) => {
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
          <select
            ref={ref}
            className={cn(
              "w-full py-3 px-4 pr-10 rounded-xl border text-sm transition-all appearance-none cursor-pointer",
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
          >
            {placeholder && (
              <option value="" style={{ background: "#0f1013" }}>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                style={{ background: "#0f1013" }}
              >
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: "#8b93a1" }}
          />
        </div>
        {error && (
          <p className="text-xs" style={{ color: "#ffb4ab" }}>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
export default Select;
