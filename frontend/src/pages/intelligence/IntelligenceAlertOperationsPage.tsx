import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { intelligenceService } from '../../services/intelligence-service';
import { publicService } from '../../services/public-service';
import type { 
  AlertDispatchPayload, 
  IntelligenceAlertClass, 
  IntelligenceBroadcastLevel 
} from '../../types/intelligence';
import type { HazardTypeItem, RegionItem, HazardEventItem, AlertItem } from '../../types';
import { 
  SendHorizontal, 
  Radio, 
  ShieldAlert, 
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

export const IntelligenceAlertOperationsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedEventId = searchParams.get('event_id');

  // Metadata states
  const [hazardTypes, setHazardTypes] = useState<HazardTypeItem[]>([]);
  const [regions, setRegions] = useState<RegionItem[]>([]);
  const [events, setEvents] = useState<HazardEventItem[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDispatching, setIsDispatching] = useState(false);

  // Form states
  const [hazardTypeId, setHazardTypeId] = useState<number | ''>('');
  const [regionId, setRegionId] = useState<number | ''>('');
  const [eventId, setEventId] = useState<number | ''>(preselectedEventId ? Number(preselectedEventId) : '');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [alertClass, setAlertClass] = useState<IntelligenceAlertClass>('warning');
  const [broadcastLevel, setBroadcastLevel] = useState<IntelligenceBroadcastLevel>('regional');
  const [startsAt, setStartsAt] = useState<string>(new Date().toISOString().slice(0, 16));
  const [expiresAt, setExpiresAt] = useState<string>(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  );

  const loadOperationalData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [hazards, regList, evList, alertsRes] = await Promise.all([
        publicService.getHazardTypes(),
        publicService.getRegions(),
        publicService.getEvents({ status: 'active', per_page: 20 }),
        publicService.getAlerts({ status: 'active', per_page: 20 }),
      ]);
      setHazardTypes(hazards);
      setRegions(regList);
      setEvents(evList.data);
      setActiveAlerts(alertsRes.data);

      if (hazards.length > 0 && !hazardTypeId) {
        setHazardTypeId(hazards[0].id);
      }
      if (regList.length > 0 && !regionId) {
        setRegionId(regList[0].id);
      }
    } catch (err) {
      console.error('Failed to load operational alert data:', err);
      toast.error('Gagal memuat metadata diseminasi peringatan.');
    } finally {
      setIsLoading(false);
    }
  }, [hazardTypeId, regionId]);

  useEffect(() => {
    loadOperationalData();
  }, [loadOperationalData]);

  // If preselected event changed, auto-fill hazard type and region if available
  useEffect(() => {
    if (eventId && events.length > 0) {
      const found = events.find((e) => e.id === Number(eventId));
      if (found) {
        if (found.hazard_type?.id) {
          setHazardTypeId(found.hazard_type.id);
        }
        if (found.region?.id) {
          setRegionId(found.region.id);
        }
        if (!title) {
          setTitle(`PERINGATAN DINI: ${found.title}`);
        }
      }
    }
  }, [eventId, events, title]);

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hazardTypeId) {
      toast.error('Pilih jenis bahaya.');
      return;
    }
    if (!regionId) {
      toast.error('Pilih wilayah target diseminasi.');
      return;
    }
    if (!title.trim()) {
      toast.error('Judul peringatan wajib diisi.');
      return;
    }
    if (!message.trim()) {
      toast.error('Instruksi tindakan keselamatan / isi pesan CAP wajib diisi.');
      return;
    }

    setIsDispatching(true);
    try {
      const payload: AlertDispatchPayload = {
        hazard_type_id: Number(hazardTypeId),
        region_id: Number(regionId),
        hazard_event_id: eventId ? Number(eventId) : null,
        title: title.trim(),
        message: message.trim(),
        alert_class: alertClass,
        broadcast_level: broadcastLevel,
        starts_at: new Date(startsAt).toISOString(),
        expires_at: new Date(expiresAt).toISOString(),
      };

      const res = await intelligenceService.dispatchAlert(payload);
      toast.success(`Peringatan resmi CAP berhasil disiarkan! ID: ${res.alert.id}`);

      // Reset headline and message
      setTitle('');
      setMessage('');
      setEventId('');
      loadOperationalData();
    } catch (err: any) {
      console.error('Failed to dispatch alert:', err);
      const msg = err.response?.data?.message || 'Gagal menyiarkan peringatan dini CAP.';
      toast.error(msg);
    } finally {
      setIsDispatching(false);
    }
  };

  const getAlertBadge = (cls: string) => {
    switch (cls?.toLowerCase()) {
      case 'danger':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-950/80 text-rose-400 border border-rose-800">
            BAHAYA (DANGER)
          </span>
        );
      case 'warning':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950/80 text-amber-400 border border-amber-800">
            WASPADA (WARNING)
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-950/80 text-blue-400 border border-blue-800">
            INFORMASI (INFO)
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
            <SendHorizontal className="w-6 h-6 text-emerald-400" />
            Operasi & Diseminasi Peringatan Dini (CAP Dissemination Desk)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Penyiaran multi-kanal peringatan resmi berbasis standar Common Alerting Protocol (CAP ITU-T X.1303) kepada publik dan aparat tanggap darurat.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadOperationalData}
            className="p-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            title="Muat Ulang"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Dispatch Form (7 cols) */}
        <div className="lg:col-span-7">
          <form
            onSubmit={handleDispatch}
            className="p-6 rounded-2xl bg-[#0F172A] border border-[#1E293B] shadow-md space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                Formulir Rilis Peringatan CAP Resmi
              </h2>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800">
                CAP v1.2 Compliant
              </span>
            </div>

            {/* Event link (Optional) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Tautkan ke Kejadian Bencana Aktif (Opsional)
              </label>
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Peringatan Mandiri / Tanpa Kejadian Tertaut --</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    EVT-{ev.id}: {ev.title} ({ev.region?.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Hazard & Region */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Jenis Bahaya
                </label>
                <select
                  value={hazardTypeId}
                  onChange={(e) => setHazardTypeId(Number(e.target.value))}
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                >
                  {hazardTypes.map((ht) => (
                    <option key={ht.id} value={ht.id}>
                      {ht.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Wilayah Sasaran (Geocode)
                </label>
                <select
                  value={regionId}
                  onChange={(e) => setRegionId(Number(e.target.value))}
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                >
                  {regions.map((reg) => (
                    <option key={reg.id} value={reg.id}>
                      {reg.name} ({reg.level})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Alert Class & Broadcast Scope */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Tingkat Keparahan (Severity Class)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'info', label: 'INFO', color: 'text-blue-400 border-blue-800' },
                    { id: 'warning', label: 'WARNING', color: 'text-amber-400 border-amber-800' },
                    { id: 'danger', label: 'DANGER', color: 'text-rose-400 border-rose-800' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setAlertClass(item.id as any)}
                      className={`py-1.5 rounded-lg border text-xs font-bold transition-all ${
                        alertClass === item.id
                          ? `bg-slate-800 ${item.color} ring-1 ring-current`
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Cakupan Siaran (Scope)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'local', label: 'Lokal' },
                    { id: 'regional', label: 'Regional' },
                    { id: 'national', label: 'Nasional' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setBroadcastLevel(item.id as any)}
                      className={`py-1.5 rounded-lg border text-xs font-bold transition-all ${
                        broadcastLevel === item.id
                          ? 'bg-emerald-950 border-emerald-600 text-emerald-400 ring-1 ring-emerald-500'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Title / Headline */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Judul Peringatan (Headline CAP)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: SIAGA BANJIR BANDANG: DAS Ciliwung Mengalami Kenaikan Kritis"
                maxLength={255}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Message / Instruction */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Instruksi & Pesan Keselamatan (CAP Instruction)
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tuliskan panduan tindakan warga: Evakuasi segera ke titik kumpul tertinggi, matikan instalasi listrik, dan pantau instruksi posko darurat..."
                required
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Timings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Mulai Berlaku (Starts At)
                </label>
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Kedaluwarsa (Expires At)
                </label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs"
                />
              </div>
            </div>

            {/* Dispatch Button */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Peringatan yang disiarkan langsung memicu In-App Notification engine bagi seluruh warga terdampak.
              </span>
              <button
                type="submit"
                disabled={isDispatching}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md disabled:opacity-50"
              >
                <SendHorizontal className="w-4 h-4" />
                <span>{isDispatching ? 'Menyiarkan...' : 'Siarkan Peringatan Resmi'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Active Disseminated Alerts Feed (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-[#0F172A] border border-[#1E293B] shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                Peringatan Aktif yang Sedang Mengudara
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                {activeAlerts.length} aktif
              </span>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-slate-900/60 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : activeAlerts.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                Belum ada peringatan dini yang disiarkan aktif.
              </div>
            ) : (
              <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                {activeAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      {getAlertBadge(alert.alert_class)}
                      <span className="text-[11px] font-mono text-slate-500 uppercase">
                        {alert.broadcast_level}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-100 line-clamp-1">
                      {alert.title}
                    </h4>

                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {alert.message}
                    </p>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
                      <span>{alert.region?.name || 'Seluruh Wilayah'}</span>
                      <span>
                        Kadaluarsa: {new Date(alert.expires_at || alert.created_at || '').toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
