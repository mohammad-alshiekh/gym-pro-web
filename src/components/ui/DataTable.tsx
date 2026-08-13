"use client";

import { cn } from "@/lib/utils";

interface Column<T> {
  key: string;
  label: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  emptyMessage = "No data found",
  keyExtractor,
  onRowClick,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ borderColor: "#2f3742" }}
      >
        <div className="p-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-12 rounded-xl shimmer"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: "#2f3742", background: "#171a1e" }}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid #2f3742" }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3.5 text-left text-xs font-medium uppercase tracking-widest whitespace-nowrap",
                    col.className
                  )}
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    color: "#8b93a1",
                    background: "#1c2025",
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-sm"
                  style={{ color: "#8b93a1" }}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  className={cn(
                    "border-b transition-colors",
                    onRowClick && "cursor-pointer hover:bg-[#23272e]"
                  )}
                  style={{ borderColor: "#23272e" }}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn("px-4 py-3.5 text-sm", col.className)}
                      style={{ color: "#e9ecf1" }}
                    >
                      {col.render
                        ? col.render(row[col.key], row)
                        : String(row[col.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
