import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ExternalLink, Crosshair } from 'lucide-react';
import { useTheme } from '../../app/context/theme-context';

export interface MiniLocationMapProps {
  latitude: number;
  longitude: number;
  accuracyMeters?: number | null;
  isGpsLocked?: boolean;
  onChangePosition?: (lat: number, lon: number) => void;
}

const LIGHT_TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const DARK_TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

function createGpsPinIcon() {
  return L.divIcon({
    className: 'sentravax-mini-gps-pin',
    html: `
      <div style="position:relative;width:28px;height:28px;display:flex;align-items:center;justify-content:center;">
        <span style="position:absolute;inset:0;border-radius:9999px;background:rgba(225,29,72,0.28);animation:ping 1.8s cubic-bezier(0,0,0.2,1) infinite;"></span>
        <span style="position:relative;width:14px;height:14px;border-radius:9999px;background:#BE123C;border:2.5px solid #FFFFFF;box-shadow:0 2px 8px rgba(0,0,0,0.45);"></span>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export const MiniLocationMap: React.FC<MiniLocationMapProps> = ({
  latitude,
  longitude,
  accuracyMeters = null,
  isGpsLocked = false,
  onChangePosition,
}) => {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const onChangeRef = useRef(onChangePosition);

  useEffect(() => {
    onChangeRef.current = onChangePosition;
  }, [onChangePosition]);

  // Initialize Leaflet map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [latitude, longitude],
      zoom: 15,
      zoomControl: true,
      attributionControl: false,
    });

    const tileUrl = theme === 'dark' ? DARK_TILE_URL : LIGHT_TILE_URL;
    const tileLayer = L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);

    const circle = L.circle([latitude, longitude], {
      radius: accuracyMeters && accuracyMeters > 0 ? Math.min(accuracyMeters, 1500) : 120,
      color: '#BE123C',
      weight: 1.5,
      opacity: 0.7,
      fillColor: '#E11D48',
      fillOpacity: 0.14,
    }).addTo(map);

    const marker = L.marker([latitude, longitude], {
      icon: createGpsPinIcon(),
      draggable: Boolean(onChangeRef.current),
    }).addTo(map);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      onChangeRef.current?.(
        parseFloat(pos.lat.toFixed(6)),
        parseFloat(pos.lng.toFixed(6))
      );
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      onChangeRef.current?.(
        parseFloat(e.latlng.lat.toFixed(6)),
        parseFloat(e.latlng.lng.toFixed(6))
      );
    });

    mapRef.current = map;
    tileLayerRef.current = tileLayer;
    markerRef.current = marker;
    circleRef.current = circle;

    return () => {
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch tile layer when theme changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    const nextUrl = theme === 'dark' ? DARK_TILE_URL : LIGHT_TILE_URL;
    tileLayerRef.current = L.tileLayer(nextUrl, { maxZoom: 19 }).addTo(map);
  }, [theme]);

  // Smoothly fly & update marker/circle when coordinates change
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    const circle = circleRef.current;
    if (!map || !marker || !circle) return;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    marker.setLatLng([latitude, longitude]);
    circle.setLatLng([latitude, longitude]);
    circle.setRadius(accuracyMeters && accuracyMeters > 0 ? Math.min(accuracyMeters, 1500) : 120);
    map.flyTo([latitude, longitude], Math.max(map.getZoom(), 15), { duration: 0.7 });
  }, [latitude, longitude, accuracyMeters]);

  const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-[#E5E7EB] dark:border-neutral-800 bg-[#F3F4F6] dark:bg-neutral-900 shadow-xs">
      <div ref={containerRef} className="w-full h-52 sm:h-60 z-0" />

      {/* Top-left GPS telemetry pill */}
      <div className="pointer-events-none absolute top-2.5 left-2.5 z-10 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-[#E5E7EB] dark:border-neutral-700 text-[11px] font-semibold text-[#111827] dark:text-neutral-100 shadow-xs">
          <Crosshair className={`w-3 h-3 ${isGpsLocked ? 'text-emerald-600' : 'text-[#BE123C]'}`} />
          <span>{isGpsLocked ? 'Titik GPS Terkunci' : 'Pratinjau Titik Peta'}</span>
          {accuracyMeters !== null && accuracyMeters > 0 && (
            <span className="text-[10px] font-mono text-[#6B7280] dark:text-neutral-400">
              (±{Math.round(accuracyMeters)}m)
            </span>
          )}
        </span>
      </div>

      {/* Bottom bar: hint + Google Maps link */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#FFFFFF] dark:bg-[#141414] border-t border-[#E5E7EB] dark:border-neutral-800 text-[11px]">
        <span className="text-[#6B7280] dark:text-neutral-400">
          Klik peta atau geser pin merah untuk menyesuaikan lokasi tepat.
        </span>
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-semibold text-[#BE123C] dark:text-rose-400 hover:underline"
        >
          <span>Buka di Google Maps</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};

export default MiniLocationMap;
