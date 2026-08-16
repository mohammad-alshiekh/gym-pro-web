"use client";

/**
 * The actual Leaflet map — kept in its own file and always loaded through
 * `next/dynamic(..., { ssr: false })` from LocationPicker.tsx. Leaflet touches
 * `window` at import time, which crashes Next's server render if this module
 * ever loads outside the browser.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Crosshair, Loader2, Search, X } from "lucide-react";

// The default marker icon references image URLs that Leaflet's own bundling
// assumes are colocated on disk; under a bundler they 404 and the pin renders
// blank. Point it at unpkg's copy of the same package version instead.
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface GeocodeResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationPickerMapProps {
  lat: number;
  lng: number;
  onPick: (lat: number, lng: number) => void;
}

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPickerMap({ lat, lng, onPick }: LocationPickerMapProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const debounceRef = useRef<number | undefined>(undefined);

  const center = useMemo<[number, number]>(() => [lat, lng], [lat, lng]);

  // Free-text place search via OpenStreetMap's Nominatim — no API key, matches
  // the tile provider already in use. Debounced so typing doesn't spam it.
  useEffect(() => {
    window.clearTimeout(debounceRef.current);
    const trimmed = query.trim();

    debounceRef.current = window.setTimeout(async () => {
      if (trimmed.length < 3) {
        setResults([]);
        return;
      }
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(trimmed)}`
        );
        const data = (await res.json()) as GeocodeResult[];
        setResults(data ?? []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 450);

    return () => window.clearTimeout(debounceRef.current);
  }, [query]);

  const flyTo = (nextLat: number, nextLng: number) => {
    onPick(nextLat, nextLng);
    mapRef.current?.flyTo([nextLat, nextLng], Math.max(mapRef.current.getZoom(), 14), {
      duration: 0.6,
    });
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        flyTo(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border" style={{ borderColor: "#2a2a2a" }}>
      {/* Search */}
      <div className="absolute top-3 left-3 right-3 z-[1000] space-y-1">
        <div className="relative">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: "#8a8888" }}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a place or address…"
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border text-sm shadow-lg input-accent"
            style={{
              background: "#131313",
              borderColor: "#2a2a2a",
              color: "#ffffff",
              outline: "none",
            }}
          />
          {searching && (
            <Loader2
              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin"
              style={{ color: "#8a8888" }}
            />
          )}
          {!searching && query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResults([]);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-[#20201f]"
              style={{ color: "#8a8888" }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {results.length > 0 && (
          <div
            className="rounded-xl border shadow-xl overflow-hidden max-h-48 overflow-y-auto"
            style={{ background: "#131313", borderColor: "#2a2a2a" }}
          >
            {results.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  flyTo(Number(r.lat), Number(r.lon));
                  setQuery(r.display_name);
                  setResults([]);
                }}
                className="w-full text-left px-3.5 py-2.5 text-xs transition-colors hover:bg-[#20201f] border-b last:border-b-0"
                style={{ color: "#adaaaa", borderColor: "#20201f" }}
              >
                {r.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Locate me */}
      <button
        type="button"
        onClick={useMyLocation}
        title="Use my current location"
        disabled={locating}
        className="absolute bottom-3 right-3 z-[1000] p-2.5 rounded-xl border shadow-lg transition-colors hover:border-[#cafd00] hover:text-[#cafd00] disabled:opacity-60"
        style={{ background: "#131313", borderColor: "#2a2a2a", color: "#adaaaa" }}
      >
        {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crosshair className="w-4 h-4" />}
      </button>

      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom
        className="w-full h-[380px]"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker
          position={center}
          icon={markerIcon}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const m = e.target as L.Marker;
              const pos = m.getLatLng();
              onPick(pos.lat, pos.lng);
            },
          }}
        />
        <ClickHandler onPick={onPick} />
      </MapContainer>
    </div>
  );
}
