import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import './map.css';
import { cn } from '../../lib/utils';
import { publicService } from '../../services/public-service';
import { getApiErrorMessage } from '../../lib/api-error';
import type { GeoJsonPointFeature, GeoJsonFeatureCollection, HazardTypeItem } from '../../types/disaster';
import type { DataFreshnessStatus } from '../ui/Badge';
import { Button, type UITheme } from '../ui/Button';
import { MapControls } from './MapControls';
import { MapFilters, type FilterItem } from './MapFilters';
import { MapLegend } from './MapLegend';
import { createMapPopupHtml, formatEventDate, getEventProvenance } from './MapPopup';
import { createMarkerIcon } from './map-icons';
import {
  INDONESIA_CENTER,
  INDONESIA_DEFAULT_ZOOM,
  INDONESIA_MIN_ZOOM,
  INDONESIA_MAX_ZOOM,
  TILE_LAYERS,
  OSM_FALLBACK_TILE_LAYER,
  SEVERITY_CONFIGS,
} from './map-config';
import { AlertCircle, RefreshCw, Layers, ChevronRight, MapPin, Shield } from 'lucide-react';
import type { ShelterItem } from '../../types/shelter';
import { createShelterMarkerIcon, createShelterPopupHtml } from './shelter-map-utils';

export interface DisasterMapProps {
  theme?: UITheme;
  height?: string | number;
  className?: string;
  onSelectEvent?: (eventId: number) => void;
  selectedEventId?: number | null;
  initialCenter?: [number, number];
  initialZoom?: number;
  showFilters?: boolean;
  showLegend?: boolean;
  showControls?: boolean;
  showEventList?: boolean;
  boundaryGeoJson?: GeoJsonFeatureCollection | null;
  onMapClick?: (lat: number, lon: number) => void;
  selectedLocation?: { latitude: number; longitude: number; label?: string } | null;
  initialShowShelters?: boolean;
}

export const DisasterMap: React.FC<DisasterMapProps> = ({
  theme = 'light',
  height = '600px',
  className,
  onSelectEvent,
  selectedEventId,
  initialCenter = INDONESIA_CENTER,
  initialZoom = INDONESIA_DEFAULT_ZOOM,
  showFilters = true,
  showLegend = true,
  showControls = true,
  showEventList = true,
  boundaryGeoJson,
  onMapClick,
  selectedLocation,
  initialShowShelters = true,
}) => {
  const isDark = theme === 'dark';

  // Refs for Leaflet Map Instance & Layer Containers
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const sheltersGroupRef = useRef<L.LayerGroup | null>(null);
  const boundaryLayerRef = useRef<L.GeoJSON | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const markerMapRef = useRef<Map<number, L.Marker>>(new Map());
  const shelterMarkerMapRef = useRef<Map<number, L.Marker>>(new Map());
  const hasFallenBackRef = useRef<boolean>(false);

  // State Management
  const [features, setFeatures] = useState<GeoJsonPointFeature[]>([]);
  const [hazardTypes, setHazardTypes] = useState<HazardTypeItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadCounter, setReloadCounter] = useState<number>(0);

  // Shelter Layer State
  const [showShelters, setShowShelters] = useState<boolean>(initialShowShelters);
  const [shelters, setShelters] = useState<ShelterItem[]>([]);
  const [shelterFacilityFilter, setShelterFacilityFilter] = useState<string>('all');
  const [shelterAccessibilityOnly, setShelterAccessibilityOnly] = useState<boolean>(false);

  // Provenance & Telemetry Metadata
  const [dataStatus, setDataStatus] = useState<DataFreshnessStatus>('LIVE');
  const dataSourceName = 'BMKG & Jaringan Telemetri Nasional';
  const [lastUpdated, setLastUpdated] = useState<string | undefined>(undefined);

  // UI Overlays State
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(false);
  const [isListOpen, setIsListOpen] = useState<boolean>(false);

  // =========================================================================
  // 1. DATA FETCHING (REAL BACKEND API INTEGRATION)
  // =========================================================================
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        // Parallel fetch for map features, overview provenance, hazard types, and shelters
        const [featuresRes, overviewRes, hazardTypesRes, sheltersRes] = await Promise.allSettled([
          publicService.getMapFeatures(),
          publicService.getOverview(),
          publicService.getHazardTypes(),
          publicService.getShelters({
            verification_status: 'all',
            lat: selectedLocation?.latitude,
            lon: selectedLocation?.longitude,
            per_page: 100,
          }),
        ]);

        if (!isMounted) return;

        // 1. Process Map Features
        if (featuresRes.status === 'fulfilled') {
          const rawFeatures = featuresRes.value.features || [];
          // Strict Validation: Ensure coordinates are valid numbers and inside geographic bounds
          const validFeatures = rawFeatures.filter((f) => {
            if (!f || f.type !== 'Feature' || !f.geometry) return false;
            if (f.geometry.type !== 'Point' || !Array.isArray(f.geometry.coordinates)) return false;
            const [lon, lat] = f.geometry.coordinates;
            return (
              typeof lon === 'number' &&
              typeof lat === 'number' &&
              !isNaN(lon) &&
              !isNaN(lat) &&
              lat >= -90 &&
              lat <= 90 &&
              lon >= -180 &&
              lon <= 180
            );
          });
          setFeatures(validFeatures);
          setError(null);
        } else {
          throw featuresRes.reason;
        }

        // 2. Process Telemetry & Provenance
        if (overviewRes.status === 'fulfilled') {
          const overview = overviewRes.value;
          const telemetry = overview.telemetry_sync;
          if (telemetry) {
            const rawFreshness = telemetry.freshness?.toUpperCase();
            if (['LIVE', 'STATIC', 'SIMULATED', 'STALE', 'UNAVAILABLE'].includes(rawFreshness)) {
              setDataStatus(rawFreshness as DataFreshnessStatus);
            } else {
              setDataStatus('LIVE');
            }
            if (telemetry.last_synced_at) {
              setLastUpdated(formatEventDate(telemetry.last_synced_at));
            }
          }
        }

        // 3. Process Hazard Types for dynamic filters
        if (hazardTypesRes.status === 'fulfilled') {
          setHazardTypes(hazardTypesRes.value);
        }

        // 4. Process Shelters & Assembly Points
        if (sheltersRes.status === 'fulfilled') {
          setShelters(sheltersRes.value.data || []);
        }
      } catch (err) {
        if (!isMounted) return;
        const msg = getApiErrorMessage(err);
        setError(msg || 'Gagal mengambil data telemetri peta kebencanaan.');
        setDataStatus('UNAVAILABLE');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [reloadCounter, selectedLocation?.latitude, selectedLocation?.longitude]);

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setReloadCounter((prev) => prev + 1);
  };

  // =========================================================================
  // 2. LEAFLET MAP INITIALIZATION & LIFECYCLE MANAGEMENT
  // =========================================================================
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;
    if (mapInstanceRef.current) return; // Prevent double-initialization in React 19 StrictMode

    // Initialize Leaflet Map
    const map = L.map(container, {
      center: initialCenter,
      zoom: initialZoom,
      minZoom: INDONESIA_MIN_ZOOM,
      maxZoom: INDONESIA_MAX_ZOOM,
      zoomControl: false, // We use accessible, high-contrast custom controls
      attributionControl: true,
    });

    // Constrain panning to the Indonesian archipelago
    map.setMaxBounds([
      [-15.0, 90.0],
      [12.0, 145.0],
    ]);

    // Tile Layer Setup
    const tileConfig = TILE_LAYERS[theme] || TILE_LAYERS.light;
    const tileLayer = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: tileConfig.maxZoom,
      maxNativeZoom: tileConfig.maxNativeZoom || tileConfig.maxZoom,
      subdomains: tileConfig.subdomains || 'abc',
    });

    // Graceful Fallback if primary tile provider fails (prevents infinite loop)
    tileLayer.on('tileerror', () => {
      if (!hasFallenBackRef.current && mapInstanceRef.current) {
        hasFallenBackRef.current = true;
        console.warn('Primary tile provider error detected. Falling back to OpenStreetMap tiles.');
        tileLayer.setUrl(OSM_FALLBACK_TILE_LAYER.url);
      }
    });

    tileLayer.addTo(map);
    tileLayerRef.current = tileLayer;

    // Markers Layer Group Setup
    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;

    // Shelters Layer Group Setup
    const sheltersGroup = L.layerGroup().addTo(map);
    sheltersGroupRef.current = sheltersGroup;

    mapInstanceRef.current = map;

    // ResizeObserver to handle fluid container dimension changes
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(container);

    const markerMap = markerMapRef.current;
    const shelterMarkerMap = shelterMarkerMapRef.current;

    return () => {
      resizeObserver.disconnect();
      if (userMarkerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }
      map.remove();
      mapInstanceRef.current = null;
      markersGroupRef.current = null;
      sheltersGroupRef.current = null;
      tileLayerRef.current = null;
      boundaryLayerRef.current = null;
      markerMap.clear();
      shelterMarkerMap.clear();
    };
  }, [initialCenter, initialZoom, theme]);

  // =========================================================================
  // MAP CLICK LISTENER FOR LOCATION SELECTION
  // =========================================================================
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !onMapClick) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      onMapClick(Number(e.latlng.lat.toFixed(5)), Number(e.latlng.lng.toFixed(5)));
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [onMapClick]);

  // =========================================================================
  // SELECTED LOCATION PIN MARKER
  // =========================================================================
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }

    if (selectedLocation && typeof selectedLocation.latitude === 'number' && typeof selectedLocation.longitude === 'number') {
      const { latitude, longitude, label } = selectedLocation;
      const userIcon = L.divIcon({
        className: 'sentravax-user-pin',
        html: `
          <div class="relative flex items-center justify-center pointer-events-none">
            <span class="absolute w-8 h-8 rounded-full bg-[#047857]/30 motion-safe:animate-ping"></span>
            <span class="absolute w-6 h-6 rounded-full bg-[#047857]/40"></span>
            <div class="relative z-10 w-4 h-4 rounded-full bg-[#047857] border-2 border-white shadow-md flex items-center justify-center">
              <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([latitude, longitude], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
      if (label) {
        marker.bindTooltip(label, { permanent: false, direction: 'top', offset: [0, -12] });
      }
      userMarkerRef.current = marker;
      map.flyTo([latitude, longitude], Math.max(map.getZoom(), 10), { duration: 0.8 });
    }
  }, [selectedLocation]);

  // Theme switch effect for tile layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const tileConfig = TILE_LAYERS[theme] || TILE_LAYERS.light;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const newTileLayer = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: tileConfig.maxZoom,
      maxNativeZoom: tileConfig.maxNativeZoom || tileConfig.maxZoom,
      subdomains: tileConfig.subdomains || 'abc',
    });

    newTileLayer.on('tileerror', () => {
      if (!hasFallenBackRef.current && mapInstanceRef.current) {
        hasFallenBackRef.current = true;
        console.warn('Primary tile provider error detected. Falling back to OpenStreetMap tiles.');
        newTileLayer.setUrl(OSM_FALLBACK_TILE_LAYER.url);
      }
    });

    newTileLayer.addTo(map);
    tileLayerRef.current = newTileLayer;
  }, [theme]);

  // =========================================================================
  // 3. GEOJSON ADMINISTRATIVE BOUNDARY INTEGRATION
  // =========================================================================
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (boundaryLayerRef.current) {
      map.removeLayer(boundaryLayerRef.current);
      boundaryLayerRef.current = null;
    }

    if (boundaryGeoJson && boundaryGeoJson.features && boundaryGeoJson.features.length > 0) {
      try {
        const layer = L.geoJSON(boundaryGeoJson as any, {
          style: {
            color: isDark ? '#F59E0B' : '#047857',
            weight: 1.5,
            opacity: 0.65,
            fillColor: isDark ? '#F59E0B' : '#047857',
            fillOpacity: 0.06,
          },
        }).addTo(map);
        boundaryLayerRef.current = layer;
      } catch (err) {
        console.warn('Failed to parse or render administrative boundary GeoJSON:', err);
      }
    }
  }, [boundaryGeoJson, isDark]);

  // =========================================================================
  // 4. FILTER COMPUTATION & MARKER RENDERING
  // =========================================================================
  const filteredFeatures = useMemo(() => {
    if (activeFilter === 'all') return features;
    return features.filter((f) => f.properties.hazard_slug === activeFilter);
  }, [features, activeFilter]);

  // Build Filter Items with exact counts
  const filterItems = useMemo<FilterItem[]>(() => {
    const allCount = features.length;
    const baseItems: FilterItem[] = [
      { id: 'all', label: 'Semua Bencana', count: allCount },
    ];

    if (hazardTypes.length > 0) {
      hazardTypes.forEach((ht) => {
        const count = features.filter((f) => f.properties.hazard_slug === ht.slug).length;
        baseItems.push({
          id: ht.slug,
          label: ht.name,
          count,
          iconName: ht.icon,
        });
      });
    } else {
      // Fallback to distinct slugs in features
      const slugs = Array.from(new Set(features.map((f) => f.properties.hazard_slug).filter(Boolean)));
      slugs.forEach((slug) => {
        const count = features.filter((f) => f.properties.hazard_slug === slug).length;
        const sample = features.find((f) => f.properties.hazard_slug === slug);
        baseItems.push({
          id: slug as string,
          label: (sample?.properties.hazard_name as string) || (slug as string),
          count,
        });
      });
    }

    return baseItems;
  }, [features, hazardTypes]);

  // Render & Synchronize Leaflet Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    // Clear existing markers
    markersGroup.clearLayers();
    markerMapRef.current.clear();

    filteredFeatures.forEach((feature) => {
      const [lon, lat] = feature.geometry.coordinates;
      const eventId = feature.properties.id as number;
      const isSelected = selectedEventId === eventId;

      const markerIcon = createMarkerIcon(feature, isSelected, theme);
      const marker = L.marker([lat, lon], {
        icon: markerIcon,
        title: feature.properties.title || 'Kejadian Bencana',
        alt: `${feature.properties.hazard_name || 'Bencana'}: ${feature.properties.title || ''}`,
      });

      // Bind accessible popup
      const popupHtml = createMapPopupHtml(feature, theme);
      marker.bindPopup(popupHtml, {
        maxWidth: 320,
        minWidth: 260,
        className: 'sentravax-custom-popup',
      });

      // Marker click interaction
      marker.on('click', () => {
        if (onSelectEvent) {
          onSelectEvent(eventId);
        }
      });

      // Popup DOM event delegation for action button
      marker.on('popupopen', (e) => {
        const popupElement = e.popup.getElement();
        const actionBtn = popupElement?.querySelector<HTMLButtonElement>('.sentravax-popup-action-btn');
        if (actionBtn) {
          actionBtn.onclick = () => {
            map.flyTo([lat, lon], Math.max(map.getZoom(), 8), { duration: 1 });
            if (onSelectEvent) {
              onSelectEvent(eventId);
            }
          };
        }
      });

      markersGroup.addLayer(marker);
      markerMapRef.current.set(eventId, marker);
    });
  }, [filteredFeatures, selectedEventId, theme, onSelectEvent]);

  // Synchronize when selectedEventId is changed externally
  useEffect(() => {
    if (!selectedEventId || !mapInstanceRef.current) return;
    const marker = markerMapRef.current.get(selectedEventId);
    if (marker) {
      const latLng = marker.getLatLng();
      mapInstanceRef.current.flyTo(latLng, Math.max(mapInstanceRef.current.getZoom(), 8), {
        duration: 1,
      });
      marker.openPopup();
    }
  }, [selectedEventId]);

  // =========================================================================
  // SHELTER FILTER COMPUTATION & MARKER RENDERING
  // =========================================================================
  const filteredShelters = useMemo(() => {
    return shelters.filter((s) => {
      if (shelterFacilityFilter !== 'all' && s.facility_type !== shelterFacilityFilter) {
        return false;
      }
      if (shelterAccessibilityOnly && !s.wheelchair_accessible && !s.elderly_friendly) {
        return false;
      }
      return true;
    });
  }, [shelters, shelterFacilityFilter, shelterAccessibilityOnly]);

  useEffect(() => {
    const sheltersGroup = sheltersGroupRef.current;
    if (!sheltersGroup) return;

    sheltersGroup.clearLayers();
    shelterMarkerMapRef.current.clear();

    if (!showShelters) return;

    filteredShelters.forEach((shelter) => {
      const lat = shelter.latitude;
      const lon = shelter.longitude;
      if (typeof lat !== 'number' || typeof lon !== 'number') return;

      const markerIcon = createShelterMarkerIcon(shelter, false, theme);
      const marker = L.marker([lat, lon], {
        icon: markerIcon,
        title: shelter.name,
        alt: `Fasilitas Shelter: ${shelter.name}`,
        zIndexOffset: 500,
      });

      const popupHtml = createShelterPopupHtml(shelter, theme, shelter.distance_km);
      marker.bindPopup(popupHtml, {
        maxWidth: 340,
        minWidth: 280,
        className: 'sentravax-shelter-popup',
      });

      sheltersGroup.addLayer(marker);
      shelterMarkerMapRef.current.set(shelter.id, marker);
    });
  }, [filteredShelters, showShelters, theme]);

  // =========================================================================
  // 5. MAP NAVIGATION ACTIONS
  // =========================================================================
  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleResetView = () => {
    mapInstanceRef.current?.flyTo(initialCenter, initialZoom, {
      duration: 1.2,
    });
  };

  const handleFocusEvent = (feature: GeoJsonPointFeature) => {
    const [lon, lat] = feature.geometry.coordinates;
    const eventId = feature.properties.id as number;
    mapInstanceRef.current?.flyTo([lat, lon], 9, { duration: 1 });
    const marker = markerMapRef.current.get(eventId);
    if (marker) {
      marker.openPopup();
    }
    if (onSelectEvent) {
      onSelectEvent(eventId);
    }
  };

  return (
    <div
      className={cn(
        'relative w-full rounded-2xl border overflow-hidden shadow-xs select-none transition-colors',
        isDark ? 'bg-[#0C0C0C] border-[#2C2C2C] text-[#F5F5F5] sentravax-map-dark' : 'bg-[#F9FAFB] border-[#E5E7EB] text-[#111827]',
        className
      )}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      {/* 1. Header Toolbar (Filters & Telemetry Badge) */}
      {showFilters && (
        <div className="absolute top-3 left-3 right-14 sm:right-16 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          <MapFilters
            filters={filterItems}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            theme={theme}
          />
        </div>
      )}

      {/* 1.5 Shelter Layer Sub-Toolbar */}
      {showShelters && (
        <div className="absolute top-16 left-3 z-20 flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-white/95 dark:bg-[#161616]/95 backdrop-blur-xs border border-[#E5E7EB] dark:border-[#2C2C2C] shadow-xs text-xs pointer-events-auto">
          <div className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold text-[#065F46] dark:text-[#34D399]">
            <Shield className="w-3.5 h-3.5 text-[#047857]" />
            <span>Layer Shelter ({filteredShelters.length})</span>
          </div>
          <select
            value={shelterFacilityFilter}
            onChange={(e) => setShelterFacilityFilter(e.target.value)}
            className="text-[11px] py-1 px-2 rounded-lg border border-[#E5E7EB] dark:border-[#374151] bg-white dark:bg-[#212121] text-[#111827] dark:text-[#F3F4F6] focus:outline-none focus:ring-1 focus:ring-[#047857] cursor-pointer"
            aria-label="Filter jenis fasilitas shelter"
          >
            <option value="all">Semua Jenis Fasilitas</option>
            <option value="assembly_point">Titik Kumpul Aman</option>
            <option value="community_hall">Balai Warga / GOR</option>
            <option value="stadium">Stadion Evakuasi</option>
            <option value="school">Sekolah</option>
            <option value="health_facility">Fasilitas Kesehatan</option>
            <option value="government_office">Kantor Pemerintah</option>
          </select>
          <button
            type="button"
            onClick={() => setShelterAccessibilityOnly((prev) => !prev)}
            className={cn(
              'px-2 py-1 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-1 border cursor-pointer select-none',
              shelterAccessibilityOnly
                ? 'bg-[#047857] text-white border-[#047857]'
                : 'bg-transparent text-[#4B5563] dark:text-[#9CA3AF] border-transparent hover:bg-[#F3F4F6] dark:hover:bg-[#262626]'
            )}
            title="Tampilkan hanya fasilitas yang ramah lansia & disabilitas"
          >
            ♿ Ramah Lansia/Disabilitas
          </button>
        </div>
      )}

      {/* 2. Map Controls (Zoom, Reset, Legend, List Drawer, Shelter Toggle) */}
      {showControls && (
        <div className="absolute top-3 right-3 z-20">
          <MapControls
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onResetView={handleResetView}
            onToggleLegend={showLegend ? () => setIsLegendOpen((prev) => !prev) : undefined}
            isLegendOpen={isLegendOpen}
            onToggleList={showEventList ? () => setIsListOpen((prev) => !prev) : undefined}
            isListOpen={isListOpen}
            hasListToggle={showEventList && features.length > 0}
            onToggleShelters={() => setShowShelters((prev) => !prev)}
            isSheltersOpen={showShelters}
            theme={theme}
          />
        </div>
      )}

      {/* 3. Floating Map Legend */}
      {showLegend && (
        <MapLegend
          isOpen={isLegendOpen}
          onClose={() => setIsLegendOpen(false)}
          dataStatus={dataStatus}
          dataSourceName={dataSourceName}
          lastUpdated={lastUpdated}
          totalActiveEvents={features.length}
          theme={theme}
          className="top-14 right-3 sm:right-16"
        />
      )}

      {/* 4. Alternative Accessible Event List Drawer */}
      {showEventList && isListOpen && (
        <div
          role="region"
          aria-label="Daftar Kejadian Bencana Aktif"
          className={cn(
            'absolute top-14 left-3 z-20 w-80 sm:w-96 max-h-[75vh] rounded-2xl border shadow-xl overflow-hidden backdrop-blur-md flex flex-col',
            isDark ? 'bg-[#161616]/95 border-[#2C2C2C]' : 'bg-white/95 border-[#E5E7EB]'
          )}
        >
          <div className="p-3.5 border-b border-inherit flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className={cn('w-4 h-4', isDark ? 'text-[#F59E0B]' : 'text-[#047857]')} aria-hidden="true" />
              <h4 className="text-xs sm:text-sm font-bold tracking-tight">
                Kejadian Aktif ({filteredFeatures.length})
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setIsListOpen(false)}
              aria-label="Tutup daftar kejadian"
              className={cn(
                'text-xs px-2 py-1 rounded-lg border transition-colors cursor-pointer',
                isDark ? 'border-[#333] hover:bg-[#222]' : 'border-[#E5E7EB] hover:bg-[#F3F4F6]'
              )}
            >
              Tutup
            </button>
          </div>

          <div className="p-2 space-y-2 overflow-y-auto flex-1">
            {filteredFeatures.map((f) => {
              const eventId = f.properties.id as number;
              const isSelected = selectedEventId === eventId;
              const severityKey = (f.properties.severity as string) || 'low';
              const sev = SEVERITY_CONFIGS[severityKey] || SEVERITY_CONFIGS.low;
              const prov = getEventProvenance(f);

              return (
                <div
                  key={eventId}
                  onClick={() => handleFocusEvent(f)}
                  className={cn(
                    'p-3 rounded-xl border text-xs cursor-pointer transition-all duration-150',
                    isSelected
                      ? isDark
                        ? 'border-[#F59E0B] bg-[#222222]'
                        : 'border-[#047857] bg-[#ECFDF5]'
                      : isDark
                      ? 'border-[#2C2C2C] bg-[#1C1C1C] hover:bg-[#242424]'
                      : 'border-[#E5E7EB] bg-white hover:bg-[#F9FAFB]'
                  )}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-bold text-[11px] text-emerald-600 dark:text-amber-400 uppercase tracking-tight">
                      {f.properties.hazard_name}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                      style={{
                        backgroundColor: isDark ? sev.darkBgColor : sev.bgColor,
                        color: isDark ? sev.darkColor : sev.color,
                        borderColor: isDark ? sev.darkBorderColor : sev.borderColor,
                      }}
                    >
                      {sev.label}
                    </span>
                  </div>
                  <h5 className="font-semibold text-xs leading-snug mb-1">{f.properties.title}</h5>
                  <div className="flex items-center justify-between text-[11px] text-neutral-500 mb-1.5">
                    <span>{formatEventDate(f.properties.occurred_at as string)}</span>
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-amber-400">
                      Pusatkan <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1.5 border-t border-inherit/40 text-[10px]">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: prov.dotColor }}
                      aria-hidden="true"
                    />
                    <span className="font-medium text-neutral-500 truncate max-w-[150px]">{prov.sourceName}</span>
                    <span className="ml-auto font-bold font-mono" style={{ color: prov.dotColor }}>
                      {prov.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Leaflet Map Target DOM Container */}
      <div
        ref={mapContainerRef}
        className="sentravax-map-container"
        tabIndex={0}
        role="application"
        aria-label="Peta Geospasial Bencana Indonesia"
      />

      {/* 6. Loading State Overlay */}
      {isLoading && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'absolute inset-0 z-30 flex flex-col items-center justify-center p-6 backdrop-blur-xs transition-opacity',
            isDark ? 'bg-[#0C0C0C]/75 text-[#F5F5F5]' : 'bg-white/75 text-[#111827]'
          )}
        >
          <div className="flex items-center gap-3 p-4 rounded-2xl border shadow-lg bg-inherit border-inherit">
            <RefreshCw
              className={cn('w-5 h-5 animate-spin', isDark ? 'text-[#F59E0B]' : 'text-[#047857]')}
              aria-hidden="true"
            />
            <span className="text-xs sm:text-sm font-semibold">
              Menghubungkan Jaringan Telemetri Bencana...
            </span>
          </div>
        </div>
      )}

      {/* 7. Error State Overlay with Retry */}
      {error && !isLoading && (
        <div
          role="alert"
          className={cn(
            'absolute inset-0 z-30 flex flex-col items-center justify-center p-6 backdrop-blur-xs',
            isDark ? 'bg-[#0C0C0C]/85 text-[#F5F5F5]' : 'bg-white/85 text-[#111827]'
          )}
        >
          <div
            className={cn(
              'max-w-md p-6 rounded-2xl border shadow-xl text-center space-y-3',
              isDark ? 'bg-[#161616] border-[#2C2C2C]' : 'bg-white border-[#E5E7EB]'
            )}
          >
            <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center bg-red-500/10 text-red-500 border border-red-500/20">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold">Gagal Memuat Data Peta</h4>
            <p className="text-xs text-neutral-500 leading-relaxed">{error}</p>
            <Button
              variant="primary"
              size="sm"
              theme={theme}
              onClick={handleRetry}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Coba Hubungkan Ulang
            </Button>
          </div>
        </div>
      )}

      {/* 8. Empty Filter State Notification (Non-destructive) */}
      {!isLoading && !error && filteredFeatures.length === 0 && (
        <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
          <div
            className={cn(
              'px-3.5 py-2 rounded-xl border shadow-md text-xs font-semibold flex items-center gap-2 backdrop-blur-sm',
              isDark ? 'bg-[#161616]/90 border-[#2C2C2C] text-[#D4D4D4]' : 'bg-white/90 border-[#E5E7EB] text-[#4B5563]'
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Tidak ada kejadian aktif untuk filter yang dipilih.</span>
          </div>
        </div>
      )}
    </div>
  );
};
