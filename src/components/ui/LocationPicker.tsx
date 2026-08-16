"use client";

/**
 * Drop-in replacement for manually typed latitude/longitude fields: a button
 * that opens a map, lets the user search a place / drag the pin / click to
 * set a point, and reports the result back as numbers.
 *
 * The Leaflet map is loaded with `ssr: false` — Leaflet reads `window` as
 * soon as its module runs, which would crash Next's server render otherwise.
 */

import { useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

const LocationPickerMap = dynamic(() => import("@/components/ui/LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div
      className="w-full h-[380px] rounded-2xl border flex items-center justify-center"
      style={{ borderColor: "#2a2a2a", background: "#0e0e0e" }}
    >
      <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#8a8888" }} />
    </div>
  ),
});

/** Cairo — a reasonable default centre when no coordinates are set yet. */
const DEFAULT_CENTER: [number, number] = [30.0444, 31.2357];

interface LocationPickerProps {
  lat: number | string;
  lng: number | string;
  onChange: (lat: number, lng: number) => void;
  label?: string;
}

export default function LocationPicker({ lat, lng, onChange, label }: LocationPickerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<[number, number]>(DEFAULT_CENTER);

  const parsedLat = Number(lat);
  const parsedLng = Number(lng);
  const hasValue =
    Number.isFinite(parsedLat) && Number.isFinite(parsedLng) && (parsedLat !== 0 || parsedLng !== 0);

  const openPicker = () => {
    setDraft(hasValue ? [parsedLat, parsedLng] : DEFAULT_CENTER);
    setOpen(true);
  };

  const confirm = () => {
    onChange(Number(draft[0].toFixed(6)), Number(draft[1].toFixed(6)));
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={openPicker}
        className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm text-left transition-colors hover:border-[#cafd00]"
        style={{ background: "#0e0e0e", borderColor: "#2a2a2a", color: hasValue ? "#ffffff" : "#8a8888" }}
      >
        <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: "#cafd00" }} />
        <span className="truncate" style={{ fontFamily: "JetBrains Mono, monospace" }}>
          {hasValue ? `${parsedLat.toFixed(6)}, ${parsedLng.toFixed(6)}` : "Pick location on map"}
        </span>
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={label ?? "Pick a location"}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirm}>Use this location</Button>
          </>
        }
      >
        <div className="space-y-3">
          <LocationPickerMap
            lat={draft[0]}
            lng={draft[1]}
            onPick={(nextLat, nextLng) => setDraft([nextLat, nextLng])}
          />
          <p className="text-xs" style={{ color: "#8a8888" }}>
            Search a place, drag the pin, or click anywhere on the map.
          </p>
          <div
            className="flex items-center gap-2 text-sm px-3.5 py-2.5 rounded-xl"
            style={{ background: "#0e0e0e", color: "#cafd00", fontFamily: "JetBrains Mono, monospace" }}
          >
            {draft[0].toFixed(6)}, {draft[1].toFixed(6)}
          </div>
        </div>
      </Modal>
    </>
  );
}
