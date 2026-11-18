import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
import { userService } from '../../services/user-service';
import { publicService } from '../../services/public-service';
import type { UserSavedRegionItem, RegionItem } from '../../types';
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Bell, 
  BellOff, 
  Star, 
  ShieldCheck, 
  RefreshCw,
  X,
  Compass
} from 'lucide-react';
import { toast } from 'sonner';

export const UserRegionsPage: React.FC = () => {
  const [savedRegions, setSavedRegions] = useState<UserSavedRegionItem[]>([]);
  const [availableRegions, setAvailableRegions] = useState<RegionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Modal / Add form state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedRegionId, setSelectedRegionId] = useState<number | ''>('');
  const [customLabel, setCustomLabel] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [notifyAlerts, setNotifyAlerts] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [saved, allRegs] = await Promise.all([
        userService.getSavedRegions(),
        publicService.getRegions(),
      ]);
      setSavedRegions(saved);
      setAvailableRegions(allRegs);
      if (allRegs.length > 0) {
        setSelectedRegionId(allRegs[0].id);
      }
    } catch (err) {
      console.error('Failed to load user regions:', err);
      toast.error('Gagal memuat wilayah pantauan.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddRegion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRegionId) {
      toast.error('Pilih wilayah administrasi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const added = await userService.saveRegion({
        region_id: Number(selectedRegionId),
        label: customLabel.trim() || undefined,
        is_primary: isPrimary,
        notify_alerts: notifyAlerts,
      });

      setSavedRegions((prev) => [added, ...prev]);
      setIsAddModalOpen(false);
      setCustomLabel('');
      setIsPrimary(false);
      setNotifyAlerts(true);
      toast.success('Wilayah pantauan berhasil ditambahkan.');
    } catch (err: any) {
      console.error('Failed to add region:', err);
      const msg = err.response?.data?.message || 'Gagal menambahkan wilayah pantauan.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRegion = async (id: number) => {
    if (!confirm('Hapus wilayah ini dari daftar pantauan Anda?')) return;
    setDeletingId(id);
    try {
      await userService.deleteSavedRegion(id);
      setSavedRegions((prev) => prev.filter((r) => r.id !== id));
      toast.success('Wilayah berhasil dihapus dari pantauan.');
    } catch (err) {
      console.error('Failed to delete region:', err);
      toast.error('Gagal menghapus wilayah pantauan.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight flex items-center gap-2">
            <MapPin className="w-6 h-6 text-[#047857]" />
            Multi-Location Monitoring (Watchlist)
          </h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Pantau beberapa wilayah prioritas (rumah, kantor, tempat tinggal keluarga) untuk menerima peringatan dini otomatis.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            className="p-2.5 rounded-xl border border-[#E5E7EB] bg-[#FFFFFF] hover:bg-[#F9FAFB] text-[#4B5563] text-xs font-semibold transition-colors"
            title="Muat Ulang"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Lokasi Pantauan</span>
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#047857] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-[#065F46] leading-relaxed">
          <span className="font-bold block">Peringatan Proaktif Wilayah</span>
          Sistem akan mencocokkan setiap rilis peringatan resmi BMKG/BNPB dengan daftar wilayah pantauan Anda dan mengirimkan notifikasi in-app secara otomatis.
        </div>
      </div>

      {/* Saved Regions Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl animate-pulse p-4" />
          ))}
        </div>
      ) : savedRegions.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#047857] mx-auto">
            <MapPin className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-[#111827]">Belum Ada Wilayah Pantauan</h2>
          <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
            Tambahkan tempat tinggal, lokasi kerja, atau domisili kerabat Anda untuk mendapatkan notifikasi siaga bencana terdekat.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#047857] text-white text-xs font-bold hover:bg-[#065F46] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Lokasi Pertama
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedRegions.map((item) => (
            <div
              key={item.id}
              className={`p-5 rounded-2xl bg-[#FFFFFF] border transition-all shadow-xs flex flex-col justify-between ${
                item.is_primary ? 'border-[#047857] ring-1 ring-[#047857]' : 'border-[#E5E7EB] hover:border-[#D1D5DB]'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#F3F4F6] text-[#374151]">
                    {item.label || 'Lokasi Pantauan'}
                  </span>
                  {item.is_primary && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#047857] bg-[#ECFDF5] px-2 py-0.5 rounded-full border border-[#A7F3D0]">
                      <Star className="w-3 h-3 fill-[#047857]" />
                      Utama
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#111827]">
                    {item.region?.name}
                  </h3>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    Tingkat: <span className="uppercase font-semibold text-[#374151]">{item.region?.level}</span> • Kode: {item.region?.code}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#F3F4F6] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-[#4B5563]">
                    {item.notify_alerts ? (
                      <>
                        <Bell className="w-3.5 h-3.5 text-[#047857]" />
                        <span className="text-[11px] font-medium text-[#047857]">Notifikasi Aktif</span>
                      </>
                    ) : (
                      <>
                        <BellOff className="w-3.5 h-3.5 text-[#9CA3AF]" />
                        <span className="text-[11px] text-[#9CA3AF]">Notifikasi Hening</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-4 mt-4 border-t border-[#E5E7EB] flex items-center justify-between">
                <Link
                  to={`${PATHS.PUBLIC.PREPAREDNESS}?region_id=${item.region_id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#047857] hover:text-[#065F46] transition-colors"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Cek Risiko Siaga</span>
                </Link>

                <button
                  type="button"
                  onClick={() => handleDeleteRegion(item.id)}
                  disabled={deletingId === item.id}
                  className="p-1.5 rounded-lg text-[#DC2626] hover:bg-[#FEF2F2] transition-colors disabled:opacity-50"
                  title="Hapus Lokasi"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Region Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <form
            onSubmit={handleAddRegion}
            className="bg-[#FFFFFF] rounded-2xl max-w-md w-full border border-[#E5E7EB] shadow-lg p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <h3 className="text-base font-bold text-[#111827]">
                Tambah Wilayah Pantauan Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#111827] uppercase tracking-wider">
                Pilih Wilayah Administrasi
              </label>
              <select
                value={selectedRegionId}
                onChange={(e) => setSelectedRegionId(Number(e.target.value))}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] text-xs font-medium text-[#111827] focus:outline-none focus:border-[#047857] focus:ring-1 focus:ring-[#047857]"
              >
                {availableRegions.map((reg) => (
                  <option key={reg.id} value={reg.id}>
                    {reg.name} ({reg.level})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#111827] uppercase tracking-wider">
                Label Lokasi (Opsional)
              </label>
              <input
                type="text"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="Contoh: Rumah Tinggal, Kantor Pusat, Rumah Nenek"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] text-xs text-[#111827] focus:outline-none focus:border-[#047857] focus:ring-1 focus:ring-[#047857]"
              />
            </div>

            <div className="pt-2 space-y-2.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="rounded text-[#047857] focus:ring-[#047857]"
                />
                <span className="text-xs text-[#374151] font-medium">
                  Jadikan sebagai domisili / wilayah utama
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyAlerts}
                  onChange={(e) => setNotifyAlerts(e.target.checked)}
                  className="rounded text-[#047857] focus:ring-[#047857]"
                />
                <span className="text-xs text-[#374151] font-medium">
                  Aktifkan notifikasi in-app jika ada peringatan dini di wilayah ini
                </span>
              </label>
            </div>

            <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] text-xs font-semibold text-[#4B5563] transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Wilayah'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
