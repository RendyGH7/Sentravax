import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
import { useAuth } from '../../app/context/useAuth';
import { userService } from '../../services/user-service';
import { publicService } from '../../services/public-service';
import type { HazardTypeItem, RegionItem } from '../../types';
import { 
  Camera, 
  SendHorizontal, 
  ArrowLeft,
  CheckCircle2,
  Navigation,
  Layers,
  Phone,
  User as UserIcon,
  X,
  ShieldAlert,
  Search,
  Clock,
  XCircle,
  AlertTriangle,
  MapPin,
  RefreshCw,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

export const UserCreateReportPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState<'create' | 'track'>(
    searchParams.get('tab') === 'track' ? 'track' : 'create'
  );

  // Tracking tab states
  const [trackingQuery, setTrackingQuery] = useState<string>(searchParams.get('code') || '');
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [trackedReport, setTrackedReport] = useState<any>(null);
  const [trackError, setTrackError] = useState<string | null>(null);

  const [hazardTypes, setHazardTypes] = useState<HazardTypeItem[]>([]);
  const [regions, setRegions] = useState<RegionItem[]>([]);
  const [isLoadingMeta, setIsLoadingMeta] = useState(true);

  // Form states
  const [hazardTypeId, setHazardTypeId] = useState<number | ''>('');
  const [regionId, setRegionId] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState<number>(-6.1754);
  const [longitude, setLongitude] = useState<number>(106.8272);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Zero-Barrier guest fields
  const [reporterName, setReporterName] = useState(user?.name || '');
  const [reporterContact, setReporterContact] = useState('');

  // Submission outcome states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<{
    id: number;
    tracking_code?: string;
    title: string;
    status: string;
    cluster_id?: string;
    is_duplicate?: boolean;
    photo_url?: string | null;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadMetadata() {
      setIsLoadingMeta(true);
      try {
        const [hazards, regList] = await Promise.all([
          publicService.getHazardTypes(),
          publicService.getRegions(),
        ]);
        if (isMounted) {
          setHazardTypes(hazards);
          if (hazards.length > 0) {
            setHazardTypeId(hazards[0].id);
          }
          setRegions(regList);
          if (regList.length > 0) {
            setRegionId(regList[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load report metadata:', err);
        toast.error('Gagal memuat daftar jenis bahaya dan wilayah.');
      } finally {
        if (isMounted) setIsLoadingMeta(false);
      }
    }
    loadMetadata();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleTrackReport = async (overrideCode?: string) => {
    const code = (overrideCode || trackingQuery).trim();
    if (!code) {
      toast.error('Masukkan kode pelacakan atau nomor ID laporan.');
      return;
    }

    setIsTracking(true);
    setTrackError(null);
    try {
      const res = await publicService.checkReportStatus(code);
      setTrackedReport(res);
      setSearchParams({ tab: 'track', code });
    } catch (err: any) {
      console.error('Failed to track report:', err);
      setTrackedReport(null);
      setTrackError(err.response?.data?.message || 'Laporan dengan kode tersebut tidak ditemukan dalam repositori.');
    } finally {
      setIsTracking(false);
    }
  };

  useEffect(() => {
    const codeParam = searchParams.get('code');
    if (codeParam && activeTab === 'track' && !trackedReport) {
      handleTrackReport(codeParam);
    }
  }, [searchParams, activeTab]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation tidak didukung oleh browser Anda.');
      return;
    }
    toast.info('Mengambil titik koordinat GPS perangkat...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lon = parseFloat(pos.coords.longitude.toFixed(6));
        setLatitude(lat);
        setLongitude(lon);
        toast.success(`Koordinat GPS tersimpan: ${lat}, ${lon}`);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        toast.warning('Akses GPS ditolak/tidak tersedia. Menggunakan estimasi koordinat.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran berkas melebihi batas 5MB.');
        return;
      }
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hazardTypeId) {
      toast.error('Pilih jenis bahaya bencana.');
      return;
    }
    if (!regionId) {
      toast.error('Pilih wilayah administrasi kejadian.');
      return;
    }
    if (!title.trim()) {
      toast.error('Judul ringkas kejadian wajib diisi.');
      return;
    }
    if (!description.trim()) {
      toast.error('Deskripsi kondisi lapangan wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isAuthenticated) {
        // Authenticated citizen report
        const res = await userService.createReport({
          hazard_type_id: Number(hazardTypeId),
          region_id: Number(regionId),
          title: title.trim(),
          description: description.trim(),
          latitude,
          longitude,
          photo,
        });

        setSubmittedReport({
          id: res.id,
          tracking_code: `SVX-REP-${String(res.id).padStart(5, '0')}`,
          title: res.title,
          status: res.status,
          cluster_id: res.clustering?.cluster_id,
          is_duplicate: res.clustering?.is_duplicate,
          photo_url: res.photo_url,
        });
        toast.success('Laporan berhasil dikirim dan masuk antrean verifikasi!');
      } else {
        // Emergency Zero-Barrier public report
        const res = await publicService.submitReport({
          hazard_type_id: Number(hazardTypeId),
          region_id: Number(regionId),
          title: title.trim(),
          description: description.trim(),
          latitude,
          longitude,
          photo,
          reporter_name: reporterName.trim() || undefined,
          reporter_contact: reporterContact.trim() || undefined,
        });

        setSubmittedReport({
          id: res.id,
          tracking_code: res.tracking_code || `SVX-REP-${String(res.id).padStart(5, '0')}`,
          title: res.title,
          status: res.status,
          cluster_id: res.clustering?.cluster_id,
          is_duplicate: res.clustering?.is_duplicate,
          photo_url: res.photo_url,
        });
        toast.success('Laporan darurat berhasil dikirim tanpa hambatan login!');
      }
    } catch (err: any) {
      console.error('Failed to submit report:', err);
      const msg = err.response?.data?.message || 'Gagal mengirim laporan bencana.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs text-[#047857] hover:text-[#065F46] mb-1 font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight">
              Pelaporan Kejadian Bencana Warga
            </h1>
            {!isAuthenticated && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                Zero-Barrier Public
              </span>
            )}
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Kirimkan laporan kondisi lapangan atau pantau proses verifikasi laporan secara transparan.
          </p>
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
        <button
          type="button"
          onClick={() => {
            setActiveTab('create');
            setSearchParams({ tab: 'create' });
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'create'
              ? 'bg-[#047857] text-white shadow-xs'
              : 'bg-white text-[#4B5563] hover:text-[#111827] border border-[#E5E7EB]'
          }`}
        >
          <FileText className="w-4 h-4" />
          Kirim Laporan Bencana
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('track');
            setSearchParams({ tab: 'track' });
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'track'
              ? 'bg-[#047857] text-white shadow-xs'
              : 'bg-white text-[#4B5563] hover:text-[#111827] border border-[#E5E7EB]'
          }`}
        >
          <Search className="w-4 h-4" />
          Lacak Status Laporan
        </button>
      </div>

      {activeTab === 'track' ? (
        /* TAB 2: TRACK REPORT STATUS */
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[#111827]">Lacak Status Verifikasi Laporan</h2>
            <p className="text-xs text-[#6B7280]">
              Masukkan kode pelacakan alfanumerik (contoh: <strong className="font-mono text-[#047857]">SVX-REP-00001</strong>) atau ID laporan untuk melihat hasil audit tim posko.
            </p>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Contoh: SVX-REP-00001 atau 1"
                value={trackingQuery}
                onChange={(e) => setTrackingQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTrackReport()}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#D1D5DB] text-xs font-mono uppercase focus:ring-2 focus:ring-[#047857] focus:outline-none"
              />
            </div>
            <button
              type="button"
              disabled={isTracking}
              onClick={() => handleTrackReport()}
              className="px-5 py-2.5 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
            >
              {isTracking ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Lacak</span>
            </button>
          </div>

          {trackError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{trackError}</span>
            </div>
          )}

          {trackedReport && (
            <div className="p-5 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-[#E5E7EB]">
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#047857]">
                    KODE: {trackedReport.tracking_code || `SVX-REP-${String(trackedReport.id).padStart(5, '0')}`}
                  </span>
                  <h3 className="text-base font-bold text-[#111827] mt-0.5">{trackedReport.title}</h3>
                </div>
                <div>
                  {trackedReport.status === 'verified' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      TERVERIFIKASI RESMI
                    </span>
                  )}
                  {trackedReport.status === 'pending' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
                      <Clock className="w-3.5 h-3.5" />
                      MENUNGGU VERIFIKASI
                    </span>
                  )}
                  {trackedReport.status === 'rejected' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                      <XCircle className="w-3.5 h-3.5" />
                      DITOLAK / TIDAK VALID
                    </span>
                  )}
                  {trackedReport.status === 'investigation' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      SEDANG DIINVESTIGASI
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[11px] font-semibold text-[#6B7280] block mb-1">Kondisi Lapangan</span>
                  <p className="p-3 rounded-xl bg-white border border-[#E5E7EB] text-[#374151] leading-relaxed">
                    {trackedReport.description}
                  </p>
                </div>

                {trackedReport.photo_path && (
                  <div>
                    <span className="text-[11px] font-semibold text-[#6B7280] block mb-1">Foto Bukti Lapangan</span>
                    <img
                      src={`/storage/${trackedReport.photo_path}`}
                      alt="Bukti lapangan"
                      className="w-full h-48 object-cover rounded-xl border border-[#E5E7EB]"
                    />
                  </div>
                )}

                {trackedReport.verification && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                    <span className="font-bold text-emerald-900 block text-xs">Catatan Verifikator Resmi:</span>
                    <p className="text-emerald-800 text-[11px]">
                      {trackedReport.verification.notes || 'Laporan terkonfirmasi sesuai dengan indikator lapangan.'}
                    </p>
                    <span className="text-[10px] text-emerald-700 block mt-1">
                      Diverifikasi pada: {new Date(trackedReport.verification.created_at).toLocaleString('id-ID')}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-[11px] text-[#6B7280] pt-2 border-t border-[#E5E7EB]">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#9CA3AF]" />
                    <span>
                      {trackedReport.latitude?.toFixed(4)}, {trackedReport.longitude?.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#9CA3AF]" />
                    <span>{new Date(trackedReport.created_at).toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    to={`${PATHS.PUBLIC.MAP}?lat=${trackedReport.latitude}&lng=${trackedReport.longitude}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#047857] hover:text-[#065F46]"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    Lihat Titik Lokasi di Peta Bencana &rarr;
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : submittedReport ? (
        <div className="p-8 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] text-center space-y-5 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#047857] mx-auto">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#111827]">Laporan Berhasil Diterima</h2>
            <p className="text-xs font-mono font-bold text-[#047857] mt-1">
              Kode Pelacakan: {submittedReport.tracking_code}
            </p>
          </div>

          <p className="text-sm text-[#4B5563] max-w-md mx-auto leading-relaxed">
            Data laporan kejadian Anda telah tersimpan ke dalam repositori geospasial SENTRAVAX dan saat ini berada dalam antrean verifikasi operator.
          </p>

          {submittedReport.cluster_id && (
            <div className="p-3.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-left text-xs max-w-md mx-auto space-y-1">
              <div className="flex items-center gap-2 text-[#15803D] font-bold">
                <Layers className="w-4 h-4" />
                <span>Analisis Spatiotemporal AI</span>
              </div>
              <p className="text-[#374151]">
                {submittedReport.is_duplicate 
                  ? `Laporan Anda telah diagregasi ke dalam klaster kejadian aktif (${submittedReport.cluster_id}) untuk memperkuat bobot bukti lapangan.`
                  : `Laporan Anda membentuk klaster kejadian baru (${submittedReport.cluster_id}).`}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <button
              type="button"
              onClick={() => {
                const code = submittedReport.tracking_code || String(submittedReport.id);
                setActiveTab('track');
                setTrackingQuery(code);
                handleTrackReport(code);
              }}
              className="px-5 py-2.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] text-xs font-bold hover:bg-[#D1FAE5] transition-colors shadow-xs"
            >
              Lacak Status Laporan Ini
            </button>
            {isAuthenticated ? (
              <Link
                to={PATHS.USER.REPORTS}
                className="px-5 py-2.5 rounded-xl bg-[#047857] text-white text-xs font-bold hover:bg-[#065F46] transition-colors shadow-xs"
              >
                Lihat Riwayat Laporan
              </Link>
            ) : (
              <Link
                to={PATHS.PUBLIC.MAP}
                className="px-5 py-2.5 rounded-xl bg-[#047857] text-white text-xs font-bold hover:bg-[#065F46] transition-colors shadow-xs"
              >
                Pantau Peta Risiko
              </Link>
            )}
            <button
              type="button"
              onClick={() => {
                setSubmittedReport(null);
                setTitle('');
                setDescription('');
                removePhoto();
              }}
              className="px-5 py-2.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-[#111827] text-xs font-medium hover:bg-[#F3F4F6] transition-colors"
            >
              Kirim Laporan Lain
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-6">
          {/* Zero-Barrier Alert Banner */}
          {!isAuthenticated && (
            <div className="p-4 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] flex items-start gap-3 text-xs text-[#92400E]">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 text-[#D97706] mt-0.5" />
              <div>
                <span className="font-bold block text-sm">Mode Tanggap Darurat (Zero-Barrier)</span>
                Anda tidak perlu login untuk melaporkan bahaya. Informasi yang Anda sampaikan akan langsung masuk ke radar kesiapsiagaan posko darurat.
              </div>
            </div>
          )}

          {/* 1. Hazard Type Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#111827] uppercase tracking-wider">
              1. Jenis Bahaya / Bencana
            </label>
            {isLoadingMeta ? (
              <div className="h-10 bg-[#F3F4F6] animate-pulse rounded-xl" />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {hazardTypes.map((ht) => (
                  <button
                    key={ht.id}
                    type="button"
                    onClick={() => setHazardTypeId(ht.id)}
                    className={`p-3 rounded-xl border text-xs font-medium text-left transition-all flex items-center justify-between ${
                      hazardTypeId === ht.id
                        ? 'bg-[#ECFDF5] border-[#047857] text-[#047857] font-bold shadow-xs ring-1 ring-[#047857]'
                        : 'bg-[#FFFFFF] border-[#E5E7EB] text-[#4B5563] hover:bg-[#F9FAFB]'
                    }`}
                  >
                    <span>{ht.name}</span>
                    {hazardTypeId === ht.id && <CheckCircle2 className="w-4 h-4 text-[#047857]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. Region & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#111827] uppercase tracking-wider">
                2. Wilayah Administrasi
              </label>
              <select
                value={regionId}
                onChange={(e) => setRegionId(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] text-[#111827] text-xs font-medium focus:outline-none focus:border-[#047857] focus:ring-1 focus:ring-[#047857]"
              >
                {regions.map((reg) => (
                  <option key={reg.id} value={reg.id}>
                    {reg.name} ({reg.level})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#111827] uppercase tracking-wider">
                3. Judul Ringkas Kejadian
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Tanggul Jebol di RW 04"
                maxLength={150}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] text-[#111827] text-xs focus:outline-none focus:border-[#047857] focus:ring-1 focus:ring-[#047857]"
              />
            </div>
          </div>

          {/* 3. Coordinates & GPS */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#111827] uppercase tracking-wider">
                4. Koordinat Lapangan (PostGIS)
              </label>
              <button
                type="button"
                onClick={handleDetectLocation}
                className="inline-flex items-center gap-1.5 text-xs text-[#047857] hover:text-[#065F46] font-bold"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Gunakan Titik GPS Saya</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-[#6B7280] mb-1 font-semibold">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-xs font-mono text-[#111827]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#6B7280] mb-1 font-semibold">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-xs font-mono text-[#111827]"
                />
              </div>
            </div>
          </div>

          {/* 4. Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#111827] uppercase tracking-wider">
              5. Deskripsi Kondisi Lapangan
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan ketinggian air, kerusakan akses jalan, fasilitas terancam, atau kebutuhan evakuasi darurat..."
              maxLength={2000}
              required
              className="w-full p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] text-[#111827] text-xs focus:outline-none focus:border-[#047857] focus:ring-1 focus:ring-[#047857]"
            />
            <div className="text-[11px] text-right text-[#9CA3AF]">
              {description.length}/2000 karakter
            </div>
          </div>

          {/* 5. Photo Upload */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#111827] uppercase tracking-wider">
              6. Dokumentasi Foto Lapangan (Opsional)
            </label>
            {photoPreview ? (
              <div className="relative inline-block border rounded-xl overflow-hidden shadow-xs">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-48 h-36 object-cover"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="p-6 rounded-2xl border border-dashed border-[#D1D5DB] bg-[#F9FAFB] hover:bg-[#F3F4F6] transition-colors cursor-pointer block text-center space-y-2">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <Camera className="w-6 h-6 text-[#6B7280] mx-auto" />
                <div className="text-xs text-[#4B5563]">
                  <span className="font-semibold text-[#047857]">Pilih berkas foto</span> atau potret langsung
                </div>
                <p className="text-[11px] text-[#6B7280]">Format: JPG, PNG, WebP (Maksimal 5 MB)</p>
              </label>
            )}
          </div>

          {/* 6. Guest Contact (Zero-Barrier) */}
          {!isAuthenticated && (
            <div className="pt-2 border-t border-[#E5E7EB] space-y-3">
              <label className="block text-xs font-bold text-[#111827] uppercase tracking-wider">
                7. Identitas Pelapor (Opsional)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-3" />
                  <input
                    type="text"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    placeholder="Nama Lengkap / Panggilan"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] text-xs text-[#111827] focus:outline-none focus:border-[#047857]"
                  />
                </div>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-3" />
                  <input
                    type="text"
                    value={reporterContact}
                    onChange={(e) => setReporterContact(e.target.value)}
                    placeholder="No. WhatsApp / HP (Untuk verifikasi)"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] text-xs text-[#111827] focus:outline-none focus:border-[#047857]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
            <span className="text-[11px] text-[#6B7280]">
              * Laporan palsu dapat dikenakan sanksi peraturan perundangan.
            </span>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
              >
                <SendHorizontal className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Mengirim Laporan...' : 'Kirim Laporan Resmi'}</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
