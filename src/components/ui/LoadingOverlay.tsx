"use client";

import { Dumbbell } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface LoadingOverlayProps {
  /** Primary status line. Defaults to the generic "Loading..." string. */
  message?: string;
  /** Optional second line explaining what happens next. */
  hint?: string;
}

/**
 * Full-screen branded busy state.
 *
 * Exists because `router.push()` resolves as soon as the navigation is
 * *queued* — the target route still has to be fetched and rendered. Anything
 * that clears its own spinner at that point leaves the user staring at an
 * inert page that looks frozen, so the caller keeps this mounted and lets the
 * unmount-on-navigate take it down.
 */
export default function LoadingOverlay({ message, hint }: LoadingOverlayProps) {
  const { t, isRtl } = useTranslation();

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      // Announce politely: this replaces the view rather than interrupting a task.
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="overlay-enter fixed inset-0 z-[200] flex flex-col items-center justify-center gap-6 px-6"
      style={{ background: "rgba(10,10,10,0.94)", backdropFilter: "blur(6px)" }}
    >
      {/* Same grid + glow as the login screen, so the transition feels continuous. */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(202,253,0,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(202,253,0,0.3) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: "#cafd00" }}
      />

      {/* Brand mark with a sweeping ring. */}
      <div className="relative w-20 h-20 flex-shrink-0">
        <div
          className="overlay-ring absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, transparent 230deg, rgba(202,253,0,0.35) 300deg, #cafd00 350deg, transparent 360deg)",
            // Punch out the middle so only a 3px arc remains.
            WebkitMask:
              "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))",
            mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "#cafd00" }}
          >
            <Dumbbell className="w-6 h-6" style={{ color: "#3a4a00" }} />
          </div>
        </div>
      </div>

      <div className="relative text-center space-y-1.5">
        <p
          className="text-base font-semibold"
          style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}
        >
          {message ?? t.common.loading}
        </p>
        {hint && (
          <p
            className="text-xs"
            style={{ fontFamily: "JetBrains Mono, monospace", color: "#8a8888" }}
          >
            {hint}
          </p>
        )}
      </div>

      {/* Indeterminate track. */}
      <div
        className="relative w-40 h-1 rounded-full overflow-hidden"
        style={{ background: "#20201f" }}
      >
        <div
          className="overlay-bar h-full w-1/3 rounded-full"
          style={{ background: "linear-gradient(90deg, transparent, #cafd00, transparent)" }}
        />
      </div>
    </div>
  );
}
