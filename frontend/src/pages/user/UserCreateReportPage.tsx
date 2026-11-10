import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
import { 
  MapPin, 
  Camera, 
  SendHorizontal, 
  ArrowLeft,
  CheckCircle2,
  Navigation
} from 'lucide-react';
import { toast } from 'sonner';

export const UserCreateReportPage: React.FC = () => {
  const [hazardType, setHazardType] = useState('flood');
  const [locationText, setLocationText] = useState('Jl. Sulawesi No. 12, Tanjung Priok');
  const [coordinates, setCoordinates] = useState('-6.1158, 106.8833');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleDetectLocation = () => {
    toast.info('Mengambil titik koordinat GPS perangkat...');
    setTimeout(() => {
      setCoordinates('-6.1162, 106.8841');
      toast.success('Koordinat GPS berhasil disematkan.');
    }, 600);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error('Silakan isi deskripsi kondisi lapangan.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      toast.success('Laporan berhasil dikirim dan masuk antrean verifikasi posko.');
    }, 800);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
        <div>
          <Link
            to={PATHS.USER.REPORTS}
            className="inline-flex items-center gap-1.5 text-xs text-[#047857] hover:text-[#065F46] mb-1 font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Daftar Laporan
          </Link>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight">
            Formulir Pelaporan Kejadian Bencana
          </h1>
        </div>
      </div>

      {submitted ? (
        <div className="p-8 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#047857] mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[#111827]">Laporan Berhasil Diterima</h2>
          <p className="text-sm text-[#4B5563] max-w-md mx-auto leading-relaxed">
            Data laporan kejadian Anda telah tersimpan dan saat ini sedang ditinjau oleh operator posko darurat.
          </p>
          <div className="flex items-center justify-center gap-3 pt-3">
            <Link
              to={PATHS.USER.REPORTS}
              className="px-5 py-2.5 rounded-xl bg-[#047857] text-white text-xs font-bold hover:bg-[#065F46] transition-colors shadow-xs"
            >
              Lihat Riwayat Laporan
            </Link>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setDescription('');
              }}
              className="px-5 py-2.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] text-[#111827] text-xs font-medium hover:bg-[#F3F4F6] transition-colors"
            >
              Kirim Laporan Lain
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-6">
          {/* Hazard Type Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#111827] uppercase tracking-wider">
              1. Jenis Kejadian Bencana
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'flood', label: 'Banjir / Genangan' },
                { id: 'landslide', label: 'Tanah Longsor' },
                { id: 'earthquake', label: 'Gempa Bumi' },
                { id: 'extreme_weather', label: 'Cuaca Ekstrem' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setHazardType(item.id)}
                  className={`p-3 rounded-xl border text-xs font-medium text-left transition-all ${
                    hazardType === item.id
                      ? 'bg-[#ECFDF5] border-[#047857] text-[#047857] font-bold shadow-xs'
                      : 'bg-[#FFFFFF] border-[#E5E7EB] text-[#4B5563] hover:bg-[#F9FAFB]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Location Details */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-[#111827] uppercase tracking-wider">
              2. Lokasi dan Titik Koordinat
            </label>

            <div>
              <label className="block text-xs text-[#4B5563] mb-1 font-semibold">Alamat atau Petunjuk Lokasi</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-[#6B7280] absolute left-3 top-3" />
                <input
                  type="text"
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                  placeholder="Contoh: Jl. Ahmad Yani RT 02 RW 05"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] text-[#111827] text-sm focus:outline-none focus:border-[#047857] focus:ring-1 focus:ring-[#047857]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={coordinates}
                readOnly
                className="flex-1 px-3 py-2 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-xs font-mono text-[#4B5563]"
              />
              <button
                type="button"
                onClick={handleDetectLocation}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#ECFDF5] hover:bg-[#D1FAE5] border border-[#A7F3D0] text-[#047857] text-xs font-bold transition-colors"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Deteksi GPS</span>
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#111827] uppercase tracking-wider">
              3. Deskripsi Kondisi Lapangan
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan ketinggian air, kerusakan akses jalan, fasilitas terancam, atau kebutuhan evakuasi darurat..."
              className="w-full p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] text-[#111827] text-sm focus:outline-none focus:border-[#047857] focus:ring-1 focus:ring-[#047857]"
            />
          </div>

          {/* Photo Upload Placeholder */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#111827] uppercase tracking-wider">
              4. Foto Dokumentasi Visual (Opsional)
            </label>
            <div className="p-6 rounded-2xl border border-dashed border-[#D1D5DB] bg-[#F9FAFB] text-center space-y-2">
              <Camera className="w-6 h-6 text-[#6B7280] mx-auto" />
              <div className="text-xs text-[#4B5563]">
                <span>Ambil foto langsung melalui kamera atau telusuri berkas gambar</span>
              </div>
              <p className="text-[11px] text-[#6B7280]">Format didukung: JPG, PNG, WebP (Maksimal 5 MB)</p>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-[#E5E7EB] flex justify-end gap-3">
            <Link
              to={PATHS.USER.REPORTS}
              className="px-5 py-2.5 rounded-xl bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] text-xs font-semibold text-[#4B5563] transition-colors"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
            >
              <SendHorizontal className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Mengirim Laporan...' : 'Kirim Laporan Resmi'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
