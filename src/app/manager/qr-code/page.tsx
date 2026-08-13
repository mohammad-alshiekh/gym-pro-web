"use client";

import { useEffect, useState } from "react";
import { QrCode, RefreshCw, Download } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import { useTranslation } from "@/hooks/useTranslation";
import { myGymApi } from "@/lib/api";
import { apiErrorMessage } from "@/lib/apiError";
import type { GymQrCode } from "@/lib/manager";
import toast from "react-hot-toast";

export default function QrCodePage() {
  const { t } = useTranslation();
  const [qrData, setQrData] = useState<GymQrCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  const fetchQr = async () => {
    try {
      const res = await myGymApi.getQr();
      setQrData(res.data);
    } catch {
      toast.error("Failed to load QR code");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQr(); }, []);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await myGymApi.regenerateQr();
      await fetchQr();
      toast.success("QR code regenerated successfully");
    } catch {
      toast.error("Failed to regenerate QR code");
    } finally {
      setRegenerating(false);
    }
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
        <div className="rounded-2xl border p-8 text-center" style={{ background: "#171a1e", borderColor: "#2f3742" }}>
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#c8f32315" }}>
              <QrCode className="w-6 h-6" style={{ color: "#c8f323" }} />
            </div>
            <div className="text-left">
              <h2 className="text-lg font-bold" style={{ fontFamily: "Lexend, sans-serif", color: "#e9ecf1" }}>
                {t.gyms.qrCode}
              </h2>
              <p className="text-xs" style={{ color: "#8b93a1" }}>{t.gyms.qrInstructions}</p>
            </div>
          </div>

          {loading ? (
            <div className="w-64 h-64 mx-auto rounded-2xl shimmer" />
          ) : qrData?.qrCodeBase64 ? (
            <div>
              <div className="w-64 h-64 mx-auto rounded-2xl overflow-hidden p-4" style={{ background: "white" }}>
                <img src={qrData.qrCodeBase64} alt="Check-in QR Code" className="w-full h-full object-contain" />
              </div>
              <div className="mt-4 px-4 py-2 rounded-xl inline-block" style={{ background: "#23272e" }}>
                <p className="text-xs" style={{ fontFamily: "JetBrains Mono, monospace", color: "#8b93a1" }}>Token:</p>
                <p className="text-xs font-mono break-all" style={{ color: "#c8f323" }}>
                  {qrData.qrToken.substring(0, 32)}...
                </p>
              </div>
            </div>
          ) : (
            <div className="w-64 h-64 mx-auto rounded-2xl flex items-center justify-center" style={{ background: "#23272e" }}>
              <QrCode className="w-16 h-16 opacity-20" style={{ color: "#c8f323" }} />
            </div>
          )}

          <div className="flex items-center justify-center gap-3 mt-6">
            <Button variant="secondary" icon={<Download className="w-4 h-4" />} onClick={handleDownload} disabled={!qrData?.qrCodeBase64}>
              Download
            </Button>
            <Button icon={<RefreshCw className="w-4 h-4" />} loading={regenerating} onClick={handleRegenerate}>
              {t.gyms.regenerateQr}
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border p-5" style={{ background: "#171a1e", borderColor: "#2f3742" }}>
          <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: "Lexend, sans-serif", color: "#e9ecf1" }}>
            How to use
          </h3>
          <div className="space-y-3">
            {[
              "Print or display this QR code at the gym reception desk",
              "Members scan the code with the GymBro app to check in",
              "Regenerate the QR code if you suspect it has been compromised",
              "Each regeneration invalidates the previous token immediately",
            ].map((step, i) => (
              <div key={i} className="flex gap-3 text-sm" style={{ color: "#c3cad6" }}>
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: "#c8f323", color: "#293500" }}
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
