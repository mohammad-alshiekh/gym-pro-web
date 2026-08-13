/**
 * Coloured request/response logging for the API client.
 *
 * Every call prints its method, full URL, request headers, request body and the
 * complete response — green when it succeeds, red when it fails. ANSI escapes
 * are used rather than `%c` CSS because they colour both the browser devtools
 * console *and* the `next dev` terminal (see `logging.browserToTerminal` in
 * next.config.ts, which forwards browser console output to the terminal).
 *
 * Env flags (all optional):
 *   NEXT_PUBLIC_API_LOG=0|1        force off / on   (default: on in development)
 *   NEXT_PUBLIC_API_LOG_TOKENS=1   print the Authorization header unmasked
 *   NEXT_PUBLIC_API_LOG_LIMIT=n    max chars per body/response, 0 = unlimited
 *                                  (default 20000 — the exercise catalogue alone
 *                                  is ~1.8 MB and would flood the terminal)
 */

import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios";

// ─── ANSI ────────────────────────────────────────────────────────────────────

const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
} as const;

const paint = (color: string, text: string) => `${color}${text}${C.reset}`;

// ─── Config ──────────────────────────────────────────────────────────────────

function flag(value: string | undefined): boolean | null {
  if (value === undefined || value === "") return null;
  return value === "1" || value.toLowerCase() === "true";
}

const ENABLED =
  flag(process.env.NEXT_PUBLIC_API_LOG) ?? process.env.NODE_ENV !== "production";

const SHOW_TOKENS = flag(process.env.NEXT_PUBLIC_API_LOG_TOKENS) ?? false;

const LIMIT = (() => {
  const raw = Number(process.env.NEXT_PUBLIC_API_LOG_LIMIT);
  return Number.isFinite(raw) && raw >= 0 ? raw : 20000;
})();

// ─── Formatting ──────────────────────────────────────────────────────────────

function clip(text: string): string {
  if (LIMIT === 0 || text.length <= LIMIT) return text;
  return `${text.slice(0, LIMIT)}\n${C.gray}… truncated ${text.length - LIMIT} chars (raise NEXT_PUBLIC_API_LOG_LIMIT or set it to 0)${C.reset}`;
}

function stringify(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;

  // FormData never survives JSON.stringify — spell out its entries instead.
  if (typeof FormData !== "undefined" && value instanceof FormData) {
    const entries: string[] = [];
    value.forEach((entry, key) => {
      if (typeof File !== "undefined" && entry instanceof File) {
        entries.push(`  ${key}: [File ${entry.name} · ${entry.type || "?"} · ${entry.size} bytes]`);
      } else {
        entries.push(`  ${key}: ${String(entry)}`);
      }
    });
    return `FormData {\n${entries.join("\n")}\n}`;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function headersToObject(headers: unknown): Record<string, unknown> {
  if (!headers) return {};

  const source =
    typeof (headers as { toJSON?: () => Record<string, unknown> }).toJSON === "function"
      ? (headers as { toJSON: () => Record<string, unknown> }).toJSON()
      : (headers as Record<string, unknown>);

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(source)) {
    if (value === undefined) continue;
    if (!SHOW_TOKENS && key.toLowerCase() === "authorization" && typeof value === "string") {
      // Enough to see whether a token was attached, without printing it.
      out[key] = `${value.slice(0, 14)}… (${value.length} chars, set NEXT_PUBLIC_API_LOG_TOKENS=1 to reveal)`;
      continue;
    }
    out[key] = value;
  }
  return out;
}

function fullUrl(config: InternalAxiosRequestConfig): string {
  const base = (config.baseURL ?? "").replace(/\/$/, "");
  const path = config.url ?? "";
  const url = /^https?:\/\//.test(path) ? path : `${base}${path}`;

  const params = config.params as Record<string, unknown> | undefined;
  if (!params) return url;

  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");

  return query ? `${url}?${query}` : url;
}

function section(label: string, body: string): string {
  if (!body) return "";
  return `\n${paint(C.gray, label)}\n${clip(body)}`;
}

// ─── Interceptors ────────────────────────────────────────────────────────────

const startedAt = new WeakMap<InternalAxiosRequestConfig, number>();

function elapsed(config: InternalAxiosRequestConfig | undefined): string {
  if (!config) return "";
  const start = startedAt.get(config);
  return start ? paint(C.gray, ` ${Math.round(performance.now() - start)}ms`) : "";
}

/**
 * Must be attached before the auth interceptor: axios runs request
 * interceptors last-registered-first, so registering this one first means it
 * runs last and therefore sees the Authorization header.
 */
export function attachApiLogger(client: AxiosInstance): void {
  // Every API call is made from a client component, and api.ts is also
  // evaluated during SSR — without this guard the banner reprints on each
  // server render while never logging an actual request.
  if (!ENABLED || typeof window === "undefined") return;

  client.interceptors.request.use(
    (config) => {
      startedAt.set(config, performance.now());
      const method = (config.method ?? "get").toUpperCase();

      console.log(
        paint(C.cyan + C.bold, `\n→ ${method} ${fullUrl(config)}`) +
          section("  headers:", stringify(headersToObject(config.headers))) +
          section("  body:", stringify(config.data))
      );

      return config;
    },
    (error) => {
      console.log(paint(C.red + C.bold, `\n✖ REQUEST FAILED\n${stringify(error)}`));
      return Promise.reject(error);
    }
  );

  client.interceptors.response.use(
    (response: AxiosResponse) => {
      const method = (response.config.method ?? "get").toUpperCase();
      const url = fullUrl(response.config as InternalAxiosRequestConfig);

      console.log(
        paint(C.green + C.bold, `\n← ${response.status} ${method} ${url}`) +
          elapsed(response.config as InternalAxiosRequestConfig) +
          section("  response headers:", stringify(headersToObject(response.headers))) +
          section("  response:", stringify(response.data))
      );

      return response;
    },
    (error: AxiosError) => {
      const config = error.config as InternalAxiosRequestConfig | undefined;
      const method = (config?.method ?? "get").toUpperCase();
      const url = config ? fullUrl(config) : "(no config)";
      const status = error.response?.status ?? error.code ?? "NETWORK ERROR";

      console.log(
        paint(C.red + C.bold, `\n✖ ${status} ${method} ${url}`) +
          elapsed(config) +
          paint(C.red, `\n  ${error.message}`) +
          section("  request body:", stringify(config?.data)) +
          section(
            "  response headers:",
            error.response ? stringify(headersToObject(error.response.headers)) : ""
          ) +
          section("  response:", error.response ? stringify(error.response.data) : "")
      );

      return Promise.reject(error);
    }
  );

  console.log(
    paint(C.yellow, `API logging on${SHOW_TOKENS ? " (tokens visible)" : ""} — NEXT_PUBLIC_API_LOG=0 to silence`)
  );
}
