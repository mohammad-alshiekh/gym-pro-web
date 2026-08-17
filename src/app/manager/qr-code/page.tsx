"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, ChevronUp, Copy, QrCode, RefreshCw, Download } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import { useTranslation } from "@/hooks/useTranslation";
import { myGymApi } from "@/lib/api";
import type { GymQrCode } from "@/lib/manager";
import toast from "react-hot-toast";

/** Characters of the token shown before it is expanded. */
const TOKEN_PREVIEW = 32;

/**
 * navigator.clipboard is only defined in a secure context, so it is missing
 * whenever the dashboard is served over plain http on a LAN address. Fall
 * back to a throwaway textarea + execCommand so copying still works there.
 */
async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Permission denied or blocked — try the legacy path below.
  }

  try {
    const area = document.createElement("textarea");
    area.value = value;
    // Keep it off-screen and non-focusable-looking so the page doesn't jump.
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "-9999px";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

export default function QrCodePage() {
  const { t } = useTranslation();
  const [qrData, setQrData] = useState<GymQrCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tokenExpanded, setTokenExpanded] = useState(false);
  const copiedTimer = useRef<number | null>(null);

  const fetchQr = async () => {
    try {
      const res = await myGymApi.getQr();
      setQrData(res.data);
    } catch {
      toast.error(t.auth.failedLoadQr);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQr(); }, []);

  // Don't leave the "copied" tick scheduled on an unmounted page.
  useEffect(() => () => {
    if (copiedTimer.current) window.clearTimeout(copiedTimer.current);
  }, []);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await myGymApi.regenerateQr();
      await fetchQr();
      // The old token is dead now — never leave it on screen as if it were live.
      setCopied(false);
      setTokenExpanded(false);
      toast.success(t.auth.qrRegenerated);
    } catch {
      toast.error(t.auth.failedRegenerateQr);
    } finally {
      setRegenerating(false);
    }
  };

  const handleCopyToken = async () => {
    const token = qrData?.qrToken;
    if (!token) return;

    // Always copy the whole token, never the truncated preview.
    if (!(await copyText(token))) {
      toast.error(t.gyms.copyFailed);
      return;
    }

    setCopied(true);
    toast.success(t.gyms.tokenCopied);
    if (copiedTimer.current) window.clearTimeout(copiedTimer.current);
    copiedTimer.current = window.setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrData?.qrCodeBase64) return;
    const link = document.createElement("a");
    link.href = qrData.qrCodeBase64;
    link.download = "gym-checkin-qr.png";
    link.click();
  };

  return (
    <DashboardLayout title={t.nav.qrCode} requiredRole="gym_manager">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="rounded-2xl border p-8 text-center" style={{ background: "#131313", borderColor: "#2a2a2a" }}>
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#cafd0015" }}>
              <QrCode className="w-6 h-6" style={{ color: "#cafd00" }} />
            </div>
            <div className="text-left">
              <h2 className="text-lg font-bold" style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}>
                {t.gyms.qrCode}
              </h2>
              <p className="text-xs" style={{ color: "#8a8888" }}>{t.gyms.qrInstructions}</p>
            </div>
          </div>

          {loading ? (
            <div className="w-64 h-64 mx-auto rounded-2xl shimmer" />
          ) : qrData?.qrCodeBase64 ? (
            <div>
              <div className="w-64 h-64 mx-auto rounded-2xl overflow-hidden p-4" style={{ background: "white" }}>
                <img src={qrData.qrCodeBase64} alt={t.gyms.qrCode} className="w-full h-full object-contain" />
              </div>
              <div
                className="mt-4 px-4 py-3 rounded-xl w-full max-w-sm mx-auto space-y-2"
                style={{ background: "#20201f" }}
              >
                <div className="flex items-center justify-between gap-2">
                  <p
                    className="text-xs"
                    style={{ fontFamily: "JetBrains Mono, monospace", color: "#8a8888" }}
                  >
                    {t.auth.tokenLabel}
                  </p>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {qrData.qrToken.length > TOKEN_PREVIEW && (
                      <button
                        type="button"
                        onClick={() => setTokenExpanded((v) => !v)}
                        title={tokenExpanded ? t.gyms.hideFullToken : t.gyms.showFullToken}
                        aria-label={tokenExpanded ? t.gyms.hideFullToken : t.gyms.showFullToken}
                        aria-expanded={tokenExpanded}
                        className="p-1.5 rounded-lg transition-colors hover:bg-[#2a2a28]"
                        style={{ color: "#8a8888" }}
                      >
                        {tokenExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleCopyToken}
                      title={t.gyms.copyToken}
                      aria-label={t.gyms.copyToken}
                      className="p-1.5 rounded-lg transition-colors hover:bg-[#2a2a28]"
                      style={{ color: copied ? "#4ae176" : "#8a8888" }}
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* An opaque ASCII token — force LTR so Arabic never reorders it. */}
                <p
                  className="text-xs font-mono break-all select-all"
                  dir="ltr"
                  style={{ color: "#cafd00", textAlign: "left" }}
                >
                  {tokenExpanded || qrData.qrToken.length <= TOKEN_PREVIEW
                    ? qrData.qrToken
                    : `${qrData.qrToken.substring(0, TOKEN_PREVIEW)}…`}
                </p>
              </div>
            </div>
          ) : (
            <div className="w-64 h-64 mx-auto rounded-2xl flex items-center justify-center" style={{ background: "#20201f" }}>
              <QrCode className="w-16 h-16 opacity-20" style={{ color: "#cafd00" }} />
            </div>
          )}

          <div className="flex items-center justify-center gap-3 mt-6">
            <Button variant="secondary" icon={<Download className="w-4 h-4" />} onClick={handleDownload} disabled={!qrData?.qrCodeBase64}>
              {t.auth.download}
            </Button>
            <Button icon={<RefreshCw className="w-4 h-4" />} loading={regenerating} onClick={handleRegenerate}>
              {t.gyms.regenerateQr}
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border p-5" style={{ background: "#131313", borderColor: "#2a2a2a" }}>
          <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}>
            {t.auth.howToUse}
          </h3>
          <div className="space-y-3">
            {[
              t.auth.qrStep1,
              t.auth.qrStep2,
              t.auth.qrStep3,
              t.auth.qrStep4,
            ].map((step, i) => (
              <div key={i} className="flex gap-3 text-sm" style={{ color: "#adaaaa" }}>
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: "#cafd00", color: "#3a4a00" }}
                >
                  {i + 1}
                </span>
                {step}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
