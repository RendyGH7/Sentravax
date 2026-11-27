import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
import { publicService } from '../../services/public-service';
import type { HazardEventItem, HazardTypeItem, EventStatus } from '../../types';
import { 
  Activity, 
  Search, 
  MapPin, 
  Calendar, 
  RefreshCw,
  SendHorizontal,
  BrainCircuit,
  Layers
} from 'lucide-react';
import { toast } from 'sonner';

export const IntelligenceEventsPage: React.FC = () => {
  const [events, setEvents] = useState<HazardEventItem[]>([]);
  const [hazardTypes, setHazardTypes] = useState<HazardTypeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHazard, setSelectedHazard] = useState<number | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const [eventsRes, hazardsRes] = await Promise.all([
        publicService.getEvents({
          status: selectedStatus === 'all' ? undefined : (selectedStatus as EventStatus),
          hazard_type_id: selectedHazard === 'all' ? undefined : Number(selectedHazard),
          per_page: 50,
        }),
        publicService.getHazardTypes(),
      ]);
      setEvents(eventsRes.data);
      setHazardTypes(hazardsRes);
    } catch (err) {
      console.error('Failed to load events:', err);
      toast.error('Gagal memuat kejadian bencana.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus, selectedHazard]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) {
        void loadEvents();
      }
    });
    return () => {
      active = false;
    };
  }, [loadEvents]);

  const filteredEvents = events.filter((ev) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      ev.title.toLowerCase().includes(q) ||
      ev.description?.toLowerCase().includes(q) ||
      ev.region?.name.toLowerCase().includes(q)
    );
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-950/80 text-rose-400 border border-rose-800">
            KRITIS (CRITICAL)
          </span>
        );
      case 'high':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950/80 text-amber-400 border border-amber-800">
            TINGGI (HIGH)
          </span>
        );
      case 'medium':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-950/80 text-blue-400 border border-blue-800">
            SEDANG (MEDIUM)
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
            RENDAH (LOW)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#1E293B]">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-400" />
            Katalog & Korelasi Kejadian Bencana (Events Desk)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Pantau seluruh klaster kejadian bencana multi-hazard, telusuri bukti geospasial, dan hubungkan ke Risk Engine & CAP Dissemination.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadEvents}
            className="p-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            title="Muat Ulang"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to={PATHS.INTELLIGENCE.MAP}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-all shadow-xs"
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Peta GIS Intelijen</span>
          </Link>
          <Link
            to={PATHS.INTELLIGENCE.ALERT_OPERATIONS}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs"
          >
            <SendHorizontal className="w-4 h-4" />
            <span>Buat Peringatan CAP</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0F172A] border border-[#1E293B] flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kejadian, wilayah, atau ringkasan dampak..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedHazard}
            onChange={(e) => setSelectedHazard(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Semua Jenis Bahaya</option>
            {hazardTypes.map((ht) => (
              <option key={ht.id} value={ht.id}>
                {ht.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif (Active)</option>
            <option value="monitoring">Pemantauan (Monitoring)</option>
            <option value="resolved">Selesai (Resolved)</option>
          </select>
        </div>
      </div>

      {/* Events List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse p-4" />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#0F172A] border border-[#1E293B] text-center space-y-3">
          <Activity className="w-8 h-8 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">Tidak Ada Kejadian Ditemukan</h3>
          <p className="text-xs text-slate-500">
            Tidak ada rekaman bencana yang cocok dengan filter pencarian aktif.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((event) => {
            const lat = event.coordinates?.latitude;
            const lon = event.coordinates?.longitude;
            return (
              <div
                key={event.id}
                className="p-5 rounded-2xl bg-[#0F172A] border border-[#1E293B] hover:border-slate-700 transition-all shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {getSeverityBadge(event.severity)}
                    <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800">
                      EVT-{event.id}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                      {event.hazard_type?.name || 'Multi-Hazard'}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      Status: <span className="uppercase text-slate-300 font-bold">{event.status}</span>
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-100">
                    {event.title}
                  </h3>

                  {event.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1 text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      {event.region?.name || 'Wilayah Pilot'}
                      {lat != null && lon != null && ` (${lat.toFixed(4)}, ${lon.toFixed(4)})`}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      Terdeteksi: {new Date(event.occurred_at).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Action Buttons to Connect Workflow */}
                <div className="flex flex-wrap items-center gap-2 lg:self-center pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                  <Link
                    to={lat != null && lon != null 
                      ? `${PATHS.INTELLIGENCE.MAP}?event_id=${event.id}&lat=${lat}&lon=${lon}`
                      : `${PATHS.INTELLIGENCE.MAP}?event_id=${event.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Peta Spasial</span>
                  </Link>

                  <Link
                    to={PATHS.INTELLIGENCE.RISK_ANALYSIS}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                  >
                    <BrainCircuit className="w-3.5 h-3.5 text-amber-400" />
                    <span>Analisis Risiko</span>
                  </Link>

                  <Link
                    to={`${PATHS.INTELLIGENCE.ALERT_OPERATIONS}?event_id=${event.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs"
                  >
                    <SendHorizontal className="w-3.5 h-3.5" />
                    <span>Rilis CAP</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
