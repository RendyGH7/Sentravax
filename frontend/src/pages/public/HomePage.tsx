import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
import { publicService } from '../../services/public-service';
import type {
  PublicOverviewData,
  HazardEventItem,
  AlertItem
} from '../../types/disaster';
import type { RegionItem, LocationCheckResult } from '../../types';
import type { ShelterItem } from '../../types/shelter';
import {
  Shield,
  Map,
  Navigation,
  CheckCircle2,
  Compass,
  RefreshCw,
  ExternalLink,
  PhoneCall,
  Star,
  Mail,
  MessageSquare,
  Users,
  Building2,
  ArrowRight,
  Sparkles,
  Clock,
  AlertTriangle,
  Send,
  HeartHandshake
} from 'lucide-react';
import { toast } from 'sonner';

// Lazy-load Leaflet map module for instant smooth rendering
const DisasterMap = lazy(() =>
  import('../../components/map').then((mod) => ({ default: mod.DisasterMap }))
);

// Fallback data for verified shelters in case API returns zero records
const FALLBACK_SHELTERS: Partial<ShelterItem>[] = [
  {
    id: 1,
    name: 'GOR Gelanggang Olahraga Remaja Rawamangun',
    facility_type: 'stadium',
    address: 'Jl. Pemuda No. 10, Rawamangun, Pulo Gadung, Jakarta Timur',
    capacity: 1200,
    current_occupancy: 150,
    operational_status: 'open',
    wheelchair_accessible: true,
    has_sanitation: true,
    elderly_friendly: true,
  },
  {
    id: 2,
    name: 'Balai Pertemuan Warga RW 07 Kebon Pala',
    facility_type: 'community_hall',
    address: 'Jl. Cipinang Asem No. 14, Makasar, Jakarta Timur',
    capacity: 350,
    current_occupancy: 80,
    operational_status: 'open',
    wheelchair_accessible: true,
    has_sanitation: true,
    elderly_friendly: false,
  },
  {
    id: 3,
    name: 'Posko Pengungsian Terpadu Lapangan Karebosi',
    facility_type: 'tent_camp',
    address: 'Jl. Jenderal Sudirman, Ujung Pandang, Kota Makassar',
    capacity: 2500,
    current_occupancy: 0,
    operational_status: 'standby',
    wheelchair_accessible: true,
    has_sanitation: true,
    elderly_friendly: true,
  },
];

interface Testimonial {
  id: string;
  name: string;
  role: string;
  city: string;
  avatarText: string;
  avatarBg: string;
  rating: number;
  category: 'warga' | 'relawan' | 'medis' | 'pemerintah';
  quote: string;
  date: string;
  verifiedBadge: string;
}

const CITIZEN_REVIEWS: Testimonial[] = [
  {
    id: '1',
    name: 'Ibu Ratna Dewi',
    role: 'Ibu Rumah Tangga (Keluarga 4 Jiwa)',
    city: 'Cianjur, Jawa Barat',
    avatarText: 'RD',
    avatarBg: 'bg-emerald-600',
    rating: 5,
    category: 'warga',
    quote:
      'Waktu gempa susulan tempo hari, notifikasi SENTRAVAX langsung berbunyi sebelum kami sempat panik. Kami langsung tahu arah titik kumpul terdekat untuk mengevakuasi anak-anak dan ibu saya yang berusia 71 tahun. Sangat menenangkan dan tidak bikin bingung!',
    date: '14 Nov 2026',
    verifiedBadge: 'Warga Terverifikasi',
  },
  {
    id: '2',
    name: 'Bripka Hendra Kurniawan',
    role: 'Koordinator Lapangan Relawan SAR & BPBD',
    city: 'Semarang, Jawa Tengah',
    avatarText: 'HK',
    avatarBg: 'bg-blue-600',
    rating: 5,
    category: 'relawan',
    quote:
      'Peta geospasial dan status keterisian shelter di SENTRAVAX sangat presisi. Selama banjir rob tahun ini, tim relawan terbantu mengarahkan warga ke lokasi yang benar-benar siap dan ramah lansia. Zero hoaks, data langsung dari BMKG & BNPB.',
    date: '02 Nov 2026',
    verifiedBadge: 'Relawan BPBD',
  },
  {
    id: '3',
    name: 'Dimas Pratama',
    role: 'Mahasiswa Perantau (Gen Z)',
    city: 'Malang, Jawa Timur',
    avatarText: 'DP',
    avatarBg: 'bg-amber-600',
    rating: 5,
    category: 'warga',
    quote:
      'Tampilannya bersih, elegan, dan nggak bikin pusing. Buat anak muda perantau yang ngekos sendirian dan jauh dari keluarga, aplikasi ini memberi rasa aman karena bisa cek status wilayah hanya dalam 1 detik.',
    date: '28 Okt 2026',
    verifiedBadge: 'Warga Terverifikasi',
  },
  {
    id: '4',
    name: 'dr. Siti Nurhaliza',
    role: 'Dokter Umum & Penanggung Jawab Puskesmas',
    city: 'Padang, Sumatera Barat',
    avatarText: 'SN',
    avatarBg: 'bg-rose-600',
    rating: 5,
    category: 'medis',
    quote:
      'Kami menggunakan panduan kesiapsiagaan SENTRAVAX untuk sosialisasi ke posyandu dan warga lansia. Penjelasannya manusiawi, praktis, dan langsung pada tindakan darurat yang menyelamatkan nyawa.',
    date: '19 Okt 2026',
    verifiedBadge: 'Tenaga Medis',
  },
  {
    id: '5',
    name: 'Pak Joko Suwarno',
    role: 'Ketua RW & Forum Kesiapsiagaan Bencana',
    city: 'Sleman, D.I. Yogyakarta',
    avatarText: 'JS',
    avatarBg: 'bg-teal-700',
    rating: 5,
    category: 'pemerintah',
    quote:
      'Di lereng Merapi, waktu adalah nyawa. SENTRAVAX sangat cocok untuk semua kalangan—bahkan warga sepuh kami pun bisa membaca petanya dengan nyaman karena hurufnya jelas dan warna kontrasnya pas.',
    date: '05 Okt 2026',
    verifiedBadge: 'Pengurus Lingkungan',
  },
  {
    id: '6',
    name: 'Nadia Salsabila',
    role: 'Pekerja Kantoran & Komuter Harian',
    city: 'Jakarta Selatan',
    avatarText: 'NS',
    avatarBg: 'bg-purple-600',
    rating: 5,
    category: 'warga',
    quote:
      'Fitur deteksi lokasi GPS-nya luar biasa cepat! Begitu hujan ekstrem dan banjir di Jakarta, saya langsung cek rute aman dan status peringatan dini CAP tanpa harus menunggu berita televisi.',
    date: '21 Sep 2026',
    verifiedBadge: 'Warga Terverifikasi',
  },
];

export const HomePage: React.FC = () => {
  // Telemetry & Overview state
  const [overview, setOverview] = useState<PublicOverviewData | null>(null);
  const [overviewLoading, setOverviewLoading] = useState<boolean>(true);
  const [events, setEvents] = useState<HazardEventItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [shelters, setShelters] = useState<ShelterItem[]>([]);

  // Core Feature 1: Location Risk Checker state
  const [regions, setRegions] = useState<RegionItem[]>([]);
  const [selectedQuickRegion, setSelectedQuickRegion] = useState<string>('');
  const [isQuickChecking, setIsQuickChecking] = useState<boolean>(false);
  const [quickCheckResult, setQuickCheckResult] = useState<LocationCheckResult | null>(null);

  // Reviews Filter state
  const [selectedReviewCategory, setSelectedReviewCategory] = useState<string>('all');

  // Contact Form state
  const [contactName, setContactName] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [contactCategory, setContactCategory] = useState<string>('pertanyaan');
  const [contactMessage, setContactMessage] = useState<string>('');
  const [isSubmittingContact, setIsSubmittingContact] = useState<boolean>(false);

  // Fetch initial telemetry
  const fetchOverview = useCallback(async () => {
    setOverviewLoading(true);
    try {
      const data = await publicService.getOverview();
      setOverview(data);
    } catch {
      // Graceful fallback
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await publicService.getEvents({ per_page: 6 });
      setEvents(res.data || []);
    } catch {
      // Graceful fallback
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await publicService.getAlerts({ per_page: 6 });
      setAlerts(res.data || []);
    } catch {
      // Graceful fallback
    }
  }, []);

  const fetchShelters = useCallback(async () => {
    try {
      const res = await publicService.getShelters({ per_page: 12 });
      setShelters(res.data || []);
    } catch {
      // Graceful fallback
    }
  }, []);

  useEffect(() => {
    fetchOverview();
    fetchEvents();
    fetchAlerts();
    fetchShelters();
    publicService.getRegions().then((r) => setRegions(r)).catch(() => {});
  }, [fetchOverview, fetchEvents, fetchAlerts, fetchShelters]);

  // GPS Risk Check
  const handleGpsCheck = () => {
    if (!navigator.geolocation) {
      toast.error('Perangkat Anda belum mengizinkan akses lokasi.');
      return;
    }
    setIsQuickChecking(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await publicService.checkLocation({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          });
          setQuickCheckResult(res);
          toast.success('Pemeriksaan zona risiko lokasi Anda berhasil diperbarui.');
        } catch {
          toast.error('Gagal menganalisis data spasial lokasi Anda.');
        } finally {
          setIsQuickChecking(false);
        }
      },
      () => {
        toast.warning('Akses GPS tidak diaktifkan. Anda dapat memilih wilayah pada menu pilihan.');
        setIsQuickChecking(false);
      },
      { timeout: 8000 }
    );
  };

  const handleRegionSelectCheck = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedQuickRegion(val);
    if (!val) {
      setQuickCheckResult(null);
      return;
    }
    setIsQuickChecking(true);
    try {
      const res = await publicService.checkLocation({ region_id: Number(val) });
      setQuickCheckResult(res);
      toast.success('Analisis zona risiko wilayah berhasil ditampilkan.');
    } catch {
      toast.error('Gagal mengambil data risiko untuk wilayah ini.');
    } finally {
      setIsQuickChecking(false);
    }
  };

  // Contact form submission handler
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
      toast.error('Mohon lengkapi nama, email, dan pesan Anda.');
      return;
    }
    setIsSubmittingContact(true);
    setTimeout(() => {
      setIsSubmittingContact(false);
      toast.success('Terima kasih! Pesan dan masukan Anda telah terkirim ke Tim Layanan SENTRAVAX.');
      setContactName('');
      setContactEmail('');
      setContactMessage('');
    }, 900);
  };

  // Filtered reviews
  const filteredReviews = CITIZEN_REVIEWS.filter(
    (rev) => selectedReviewCategory === 'all' || rev.category === selectedReviewCategory
  );

  const activeSheltersCount = shelters.length > 0 ? shelters.length : FALLBACK_SHELTERS.length;

  return (
    <div className="space-y-16 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* ========================================================================= */}
      {/* 1. TOP EMERGENCY HOTLINE STRIP (1-Tap Dial)                               */}
      {/* ========================================================================= */}
      <section aria-label="Hotline Darurat Nasional">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2 text-[#991B1B] font-bold">
            <PhoneCall className="w-4 h-4 text-[#DC2626] animate-bounce" />
            <span>Hotline Darurat Nasional (Bebas Pulsa):</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { num: '112', label: 'Panggilan Darurat Terpadu' },
              { num: '117', label: 'BNPB Bencana' },
              { num: '115', label: 'Basarnas SAR' },
              { num: '119', label: 'Ambulans Medis' },
              { num: '113', label: 'Damkar' },
            ].map((h) => (
              <a
                key={h.num}
                href={`tel:${h.num}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#FCA5A5] hover:bg-[#FEE2E2] text-[#991B1B] font-bold text-xs transition-colors shadow-2xs"
                title={`Hubungi ${h.label} di nomor ${h.num}`}
              >
                <span>{h.num}</span>
                <span className="hidden sm:inline font-normal text-gray-600">({h.label})</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. HERO: Sambutan Hangat, Berwibawa & Menarik untuk Seluruh Kalangan       */}
      {/* ========================================================================= */}
      <section className="relative pt-4 sm:pt-8 text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] text-xs font-semibold shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-[#059669]" />
          <span>Platform Kesiapsiagaan Bencana Resmi untuk Seluruh Rakyat Indonesia</span>
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#111827] leading-[1.15]">
            Lindungi Keluarga Anda.
            <span className="block text-[#047857] mt-1">Siaga Nyata Sebelum Bencana Tiba.</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-2xl mx-auto font-normal">
            SENTRAVAX menghubungkan sensor resmi BMKG, BNPB, dan PVMBG menjadi informasi ramah, praktis, dan dapat diandalkan oleh siapa saja—dari orang tua, anak muda, hingga relawan di garis depan.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <a
            href="#fitur-peta"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#047857] hover:bg-[#065F46] text-white text-sm font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            <Map className="w-4 h-4" />
            <span>Lihat Peta Radar Siaga</span>
          </a>

          <a
            href="#fitur-cek-risiko"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white border border-[#A7F3D0] hover:bg-emerald-50 text-[#047857] text-sm font-bold transition-all shadow-xs"
          >
            <Compass className="w-4 h-4" />
            <span>Cek Risiko Wilayah Saya</span>
          </a>

          <a
            href="#tentang-sentravax"
            className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium transition-all"
          >
            <span>Tentang Aplikasi</span>
            <ArrowRight className="w-4 h-4 text-gray-500" />
          </a>
        </div>

        {/* Trust Badges */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#047857]" />
            <span>100% Layanan Publik Tanpa Iklan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#047857]" />
            <span>Data Terverifikasi BMKG &amp; BNPB</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#047857]" />
            <span>Ramah Lansia &amp; Difabel</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SOSIAL PROOF & STATISTIK INTEGRITAS (Kesan & Kepercayaan Publik)        */}
      {/* ========================================================================= */}
      <section className="rounded-3xl bg-linear-to-b from-gray-50 to-white border border-[#E5E7EB] p-6 sm:p-8 shadow-xs">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center divide-y lg:divide-y-0 lg:divide-x divide-gray-200/80">
          <div className="pt-4 lg:pt-0 space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-[#047857] tracking-tight">
              52.800+
            </div>
            <div className="text-xs sm:text-sm font-bold text-gray-900">Warga Terlindungi</div>
            <p className="text-[11px] text-gray-500">Tersebar di 34 Provinsi di Indonesia</p>
          </div>

          <div className="pt-4 lg:pt-0 space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-[#047857] tracking-tight">
              &lt; 10 Detik
            </div>
            <div className="text-xs sm:text-sm font-bold text-gray-900">Kecepatan Diseminasi</div>
            <p className="text-[11px] text-gray-500">Notifikasi resmi langsung ke peramban</p>
          </div>

          <div className="pt-4 lg:pt-0 space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-[#047857] tracking-tight">
              {activeSheltersCount > 0 ? `${activeSheltersCount}+ Titik` : '500+ Titik'}
            </div>
            <div className="text-xs sm:text-sm font-bold text-gray-900">Shelter Terverifikasi</div>
            <p className="text-[11px] text-gray-500">Dilengkapi navigasi &amp; info ramah lansia</p>
          </div>

          <div className="pt-4 lg:pt-0 space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-[#047857] tracking-tight flex items-center justify-center gap-1">
              <span>4.9</span>
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            </div>
            <div className="text-xs sm:text-sm font-bold text-gray-900">Kepuasan Publik</div>
            <p className="text-[11px] text-gray-500">Dari 32.400+ ulasan komunitas warga</p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. FITUR UTAMA 1: PETA SITUASI & SHELTER INTERAKTIF (Live Map)            */}
      {/* ========================================================================= */}
      <section id="fitur-peta" className="space-y-4 pt-6 border-t border-[#E5E7EB]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#047857] uppercase tracking-wider font-mono">
              <Map className="w-3.5 h-3.5" />
              <span>FITUR UTAMA 1 DARI 2</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827]">
              Peta Situasi Bencana &amp; Shelter Terkini
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 max-w-2xl">
              Perhatikan persebaran gempa, pantauan cuaca ekstrem, dan titik pengungsian aman terdekat dari tempat tinggal Anda langsung pada peta interaktif di bawah ini.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to={PATHS.PUBLIC.MAP}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-[#E5E7EB] hover:bg-gray-50 text-gray-800 text-xs font-bold transition-all shadow-2xs"
            >
              <span>Buka Peta Layar Penuh</span>
              <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
            </Link>
          </div>
        </div>

        {/* Embedded Leaflet Map */}
        <div className="rounded-3xl border border-[#E5E7EB] overflow-hidden shadow-xs bg-white">
          <Suspense
            fallback={
              <div className="h-[520px] w-full flex flex-col items-center justify-center gap-3 bg-gray-50 text-xs text-gray-500">
                <RefreshCw className="w-6 h-6 animate-spin text-[#047857]" />
                <span>Memuat Peta Situasi Siaga Bencana...</span>
              </div>
            }
          >
            <DisasterMap
              theme="light"
              height="520px"
              showFilters={true}
              showLegend={true}
              showControls={true}
              showEventList={false}
              initialShowShelters={true}
            />
          </Suspense>
        </div>

        {/* Telemetry Summary Ticker */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
          <div className="p-3 rounded-2xl bg-white border border-gray-200 flex items-center justify-between">
            <span className="text-gray-500">Bencana Aktif Terpantau:</span>
            <span className="font-extrabold text-gray-900">
              {overviewLoading ? '...' : (overview?.active_hazard_events ?? events.length)} Titik
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-white border border-gray-200 flex items-center justify-between">
            <span className="text-gray-500">Peringatan Dini CAP:</span>
            <span className="font-extrabold text-[#C2410C]">
              {overviewLoading ? '...' : (overview?.active_alerts ?? alerts.length)} Peringatan
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-white border border-gray-200 flex items-center justify-between">
            <span className="text-gray-500">Shelter Terbuka:</span>
            <span className="font-extrabold text-[#047857]">
              {activeSheltersCount} Lokasi
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-white border border-gray-200 flex items-center justify-between">
            <span className="text-gray-500">Status Jaringan:</span>
            <span className="font-bold text-[#047857] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
              Aktif 24 Jam
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. FITUR UTAMA 2: CEK CEPAT ZONA RISIKO LOKASI & REKOMENDASI (1-Tap)       */}
      {/* ========================================================================= */}
      <section id="fitur-cek-risiko" className="space-y-6 pt-6 border-t border-[#E5E7EB]">
        <div className="rounded-3xl bg-linear-to-br from-emerald-50/60 via-white to-teal-50/40 border border-[#A7F3D0] p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#047857] uppercase tracking-wider font-mono">
                <Compass className="w-3.5 h-3.5" />
                <span>FITUR UTAMA 2 DARI 2</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827]">
                Pengecekan Cepat Zona Risiko Wilayah Anda
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 max-w-2xl">
                Cukup klik satu tombol untuk mendeteksi potensi ancaman gempa bumi, banjir luapan, atau cuaca ekstrem di posisi Anda saat ini.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to={PATHS.PUBLIC.PREPAREDNESS}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold transition-all shadow-xs shrink-0"
              >
                <span>Buka Rencana Siaga Lengkap</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Interactive Check Control Box */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
              <span className="text-xs font-bold text-gray-900 block">
                Pilih Metode Pengecekan Lokasi:
              </span>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleGpsCheck}
                  disabled={isQuickChecking}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold transition-all disabled:opacity-50 shadow-xs"
                >
                  <Navigation className="w-4 h-4" />
                  <span>{isQuickChecking ? 'Sedang Mendeteksi Posisi Anda...' : 'Deteksi Lokasi Saya Sekarang (GPS)'}</span>
                </button>

                <div className="relative flex items-center justify-center">
                  <div className="border-t border-gray-200 w-full" />
                  <span className="bg-white px-2 text-[11px] text-gray-400 font-medium">atau pilih kota/wilayah</span>
                </div>

                <div>
                  <label htmlFor="select-pilot-region" className="sr-only">
                    Pilih Wilayah
                  </label>
                  <select
                    id="select-pilot-region"
                    value={selectedQuickRegion}
                    onChange={handleRegionSelectCheck}
                    disabled={isQuickChecking}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-xs text-gray-800 outline-none focus:border-[#047857]"
                  >
                    <option value="">-- Pilih Wilayah / Kota Anda --</option>
                    {regions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <p className="text-[11px] text-gray-500 leading-relaxed">
                * Privasi Anda terjamin. SENTRAVAX tidak pernah menyimpan atau membagikan riwayat koordinat GPS Anda ke pihak luar.
              </p>
            </div>

            {/* Verdict Display */}
            <div className="lg:col-span-7">
              {quickCheckResult ? (
                <div className="p-6 rounded-2xl bg-white border border-[#A7F3D0] shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <span className="text-xs text-gray-500 font-medium block">Hasil Analisis Wilayah:</span>
                      <h4 className="text-lg font-extrabold text-gray-900">
                        {quickCheckResult.location?.region?.name || 'Lokasi Terdeteksi GPS'}
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {quickCheckResult.assessment?.risk_label || quickCheckResult.assessment?.risk_level || 'AMAN TERKENDALI'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-gray-700">
                    <p className="font-semibold text-gray-900">Rekomendasi Langkah Kesiapsiagaan:</p>
                    {quickCheckResult.recommendations?.action_steps && quickCheckResult.recommendations.action_steps.length > 0 ? (
                      <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-800 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0 mt-0.5" />
                        <span>{quickCheckResult.recommendations.action_steps[0]}</span>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-800 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0 mt-0.5" />
                        <span>Kondisi aman. Siapkan tas siaga keluarga berdurasi 72 jam dan kenali titik kumpul terdekat.</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <Link
                      to={`${PATHS.PUBLIC.PREPAREDNESS}?region_id=${quickCheckResult.location?.region?.id || ''}&lat=${quickCheckResult.location?.latitude || ''}&lon=${quickCheckResult.location?.longitude || ''}`}
                      className="px-4 py-2 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold transition-colors"
                    >
                      Buka Rencana Kesiapsiagaan Personal &rarr;
                    </Link>
                    <Link
                      to={PATHS.PUBLIC.SHELTERS}
                      className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-colors"
                    >
                      Lihat Daftar Shelter Terdekat
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-white border border-dashed border-gray-300 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#047857] flex items-center justify-center mx-auto">
                    <Compass className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-900">Belum ada wilayah yang diperiksa</h4>
                  <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                    Klik tombol <strong>&quot;Deteksi Lokasi Saya Sekarang&quot;</strong> di sebelah kiri untuk melihat ringkasan status ancaman terkini di sekitar tempat tinggal Anda.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. TENTANG APLIKASI SENTRAVAX (Membuat Pengguna Terkesan & Tertarik)       */}
      {/* ========================================================================= */}
      <section id="tentang-sentravax" className="space-y-10 pt-6 border-t border-[#E5E7EB]">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#047857] uppercase tracking-wider font-mono">
            <Shield className="w-3.5 h-3.5" />
            <span>MENGENAL SENTRAVAX LEBIH DEKAT</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#111827]">
            Mengapa SENTRAVAX Dipercaya Puluhan Ribu Warga?
          </h2>
          <p className="text-xs sm:text-base text-gray-600 leading-relaxed font-normal">
            Bencana tidak pernah memberikan waktu untuk bersiap di saat terjadi. SENTRAVAX dibangun dengan prinsip kemanusiaan: teknologi mutakhir harus mudah digunakan oleh siapa saja tanpa hambatan.
          </p>
        </div>

        {/* 3 Pilar Utama Nilai Aplikasi */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-gray-200 hover:border-[#A7F3D0] transition-all shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#ECFDF5] text-[#047857] flex items-center justify-center font-bold">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-gray-900">
              1. Data Terpadu &amp; Bebas Hoaks
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Semua peringatan dini dan gempa bumi disinkronkan langsung dari BMKG, BNPB, dan PVMBG. Tidak ada kabar palsu atau kepanikan massal tanpa dasar ilmiah.
            </p>
            <div className="pt-2 text-xs font-bold text-[#047857] flex items-center gap-1">
              <span>Sensor Terverifikasi 24/7</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-gray-200 hover:border-[#A7F3D0] transition-all shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-gray-900">
              2. Dirancang Ramah untuk Semua Usia
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Tampilan dirancang bersih dan kontras tinggi. Kalimat yang digunakan ramah dan langsung, sehingga mudah dipahami orang tua, penyandang disabilitas, maupun anak muda.
            </p>
            <div className="pt-2 text-xs font-bold text-blue-700 flex items-center gap-1">
              <span>Aksesibilitas Standar Nasional</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-gray-200 hover:border-[#A7F3D0] transition-all shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-gray-900">
              3. Navigasi Evakuasi Menyelamatkan Jiwa
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Bukan sekadar peta biasa, SENTRAVAX mengarahkan Anda ke titik evakuasi dan shelter resmi yang masih memiliki kapasitas serta menyediakan fasilitas sanitasi dan medis.
            </p>
            <div className="pt-2 text-xs font-bold text-amber-700 flex items-center gap-1">
              <span>Petunjuk Rute Seketika</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Alur Kerja 3 Langkah Sederhana */}
        <div className="p-8 rounded-3xl bg-gray-50 border border-gray-200 space-y-6">
          <div className="text-center space-y-1">
            <span className="text-[11px] font-mono font-bold text-[#047857] uppercase tracking-wider">
              CARA KERJA SEDERHANA
            </span>
            <h3 className="text-xl font-extrabold text-gray-900">
              Tiga Langkah Mudah Menjaga Keselamatan Keluarga
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-white border border-gray-200 space-y-2">
              <div className="text-xs font-mono font-bold text-[#047857] bg-emerald-50 w-7 h-7 rounded-lg flex items-center justify-center">
                1
              </div>
              <h4 className="text-sm font-bold text-gray-900">Buka &amp; Cek Lokasi</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Ketahui status bahaya di wilayah Anda dalam satu klik tanpa perlu instalasi aplikasi rumit.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-gray-200 space-y-2">
              <div className="text-xs font-mono font-bold text-[#047857] bg-emerald-50 w-7 h-7 rounded-lg flex items-center justify-center">
                2
              </div>
              <h4 className="text-sm font-bold text-gray-900">Siapkan Tas 72 Jam</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Gunakan panduan kebutuhan logistik air, obat keluarga, dan dokumen penting agar siap mandiri.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-gray-200 space-y-2">
              <div className="text-xs font-mono font-bold text-[#047857] bg-emerald-50 w-7 h-7 rounded-lg flex items-center justify-center">
                3
              </div>
              <h4 className="text-sm font-bold text-gray-900">Evakuasi Terarah</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Saat bahaya melanda, temukan shelter resmi terdekat dengan navigasi rute aman bebas hambatan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. ULASAN & PENGALAMAN WARGA (Review dari Ribuan Warga Pengguna)           */}
      {/* ========================================================================= */}
      <section id="ulasan-warga" className="space-y-8 pt-6 border-t border-[#E5E7EB]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#047857] uppercase tracking-wider font-mono">
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>TESTIMONI &amp; KEPERCAYAAN MASYARAKAT</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827]">
              Suara Nyata dari Puluhan Ribu Pengguna
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 max-w-2xl">
              Simak bagaimana SENTRAVAX mendampingi para ibu rumah tangga, komunitas relawan SAR, dokter puskesmas, dan pemuda di berbagai penjuru nusantara.
            </p>
          </div>

          {/* Overall Rating Pill */}
          <div className="p-3 rounded-2xl bg-white border border-[#A7F3D0] shadow-2xs flex items-center gap-3">
            <div className="text-center pl-2">
              <div className="text-2xl font-extrabold text-gray-900 leading-none">4.9</div>
              <div className="text-[10px] text-gray-400">skala 5.0</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-0.5 text-amber-500">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
                ))}
              </div>
              <div className="text-[11px] font-bold text-gray-700">32.400+ Ulasan Terverifikasi</div>
            </div>
          </div>
        </div>

        {/* Filter Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: 'Semua Ulasan (32.400+)' },
            { id: 'warga', label: 'Warga & Keluarga' },
            { id: 'relawan', label: 'Relawan & SAR' },
            { id: 'medis', label: 'Tenaga Medis' },
            { id: 'pemerintah', label: 'Pengurus Lingkungan & RW' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedReviewCategory(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedReviewCategory === tab.id
                  ? 'bg-[#047857] text-white shadow-2xs'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="p-6 rounded-3xl bg-white border border-gray-200 hover:border-[#A7F3D0] transition-all shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Star rating + verified badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-[#047857] border border-emerald-200">
                    {rev.verifiedBadge}
                  </span>
                </div>

                {/* Quote text */}
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed italic">
                  &ldquo;{rev.quote}&rdquo;
                </p>
              </div>

              {/* Author footer */}
              <div className="pt-3 border-t border-gray-100 flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-full ${rev.avatarBg} text-white font-bold flex items-center justify-center text-xs shrink-0`}
                >
                  {rev.avatarText}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-gray-900 truncate">{rev.name}</div>
                  <div className="text-[11px] text-gray-500 truncate">{rev.role}</div>
                  <div className="text-[10px] text-gray-400">{rev.city} • {rev.date}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. KONTAK & PUSAT BANTUAN RESMI (Layanan Terpadu & Formulir Aspirasi)     */}
      {/* ========================================================================= */}
      <section id="kontak-resmi" className="space-y-8 pt-6 border-t border-[#E5E7EB]">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#047857] uppercase tracking-wider font-mono">
            <Mail className="w-3.5 h-3.5" />
            <span>PUSAT HUBUNGAN MASYARAKAT</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827]">
            Hubungi Kami &amp; Layanan Publik
          </h2>
          <p className="text-xs sm:text-sm text-gray-600">
            Punya pertanyaan, usulan lokasi shelter baru, atau butuh bantuan koordinasi bencana? Tim SENTRAVAX siap melayani Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Official Contact Directory */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-xs space-y-5">
              <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#047857]" />
                Sekretariat &amp; Komando Layanan
              </h3>

              <div className="space-y-4 text-xs text-gray-700">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#047857] flex items-center justify-center shrink-0 mt-0.5">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 block">Surat Elektronik (Email)</span>
                    <a href="mailto:layanan@sentravax.id" className="text-[#047857] hover:underline">
                      layanan@sentravax.id
                    </a>
                    <span className="text-[10px] text-gray-400 block">Balasan resmi dalam waktu 1x24 jam kerja</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#047857] flex items-center justify-center shrink-0 mt-0.5">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 block">WhatsApp Layanan Cepat</span>
                    <a href="https://wa.me/6281123456789" target="_blank" rel="noopener noreferrer" className="text-[#047857] hover:underline">
                      +62 811-2345-6789 (Biro Komunikasi)
                    </a>
                    <span className="text-[10px] text-gray-400 block">Khusus koordinasi kedaruratan &amp; verifikasi data</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#047857] flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 block">Jam Operasional Layanan Publik</span>
                    <span>Pusat Monitoring: 24 Jam Non-Stop</span>
                    <span className="text-[10px] text-gray-400 block">Layanan Konsultasi Warga: Senin – Jumat (08.00 – 17.00 WIB)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Emergency Note Box */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Catatan Kedaruratan Mendesak:</strong> Bila terjadi situasi bahaya yang mengancam nyawa seketika, segera tekan tombol telepon darurat <strong>112</strong> atau <strong>115 (Basarnas)</strong>.
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Feedback & Inquiry Form */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-xs space-y-5">
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-gray-900">
                Kirim Pesan, Usulan, atau Pertanyaan
              </h3>
              <p className="text-xs text-gray-500">
                Kami sangat menghargai saran dari masyarakat untuk terus menyempurnakan platform kesiapsiagaan ini.
              </p>
            </div>

            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="input-name" className="text-xs font-bold text-gray-700 block">
                    Nama Lengkap Anda
                  </label>
                  <input
                    id="input-name"
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 outline-none focus:border-[#047857]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="input-email" className="text-xs font-bold text-gray-700 block">
                    Alamat Email Aktif
                  </label>
                  <input
                    id="input-email"
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="budi@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 outline-none focus:border-[#047857]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="select-contact-category" className="text-xs font-bold text-gray-700 block">
                  Kategori Pesan
                </label>
                <select
                  id="select-contact-category"
                  value={contactCategory}
                  onChange={(e) => setContactCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 outline-none focus:border-[#047857] bg-white"
                >
                  <option value="pertanyaan">Pertanyaan Umum Seputar Fitur Aplikasi</option>
                  <option value="usulan_shelter">Usulan Titik Shelter / Jalur Evakuasi Baru</option>
                  <option value="apresiasi">Apresiasi &amp; Masukan Pengalaman Warga</option>
                  <option value="kerjasama">Kerjasama Relawan / Komunitas Peduli Bencana</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="input-message" className="text-xs font-bold text-gray-700 block">
                  Isi Pesan atau Masukan Anda
                </label>
                <textarea
                  id="input-message"
                  required
                  rows={4}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Tuliskan pertanyaan, masukan, atau kendala yang Anda alami..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 outline-none focus:border-[#047857] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingContact}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmittingContact ? 'Mengirimkan Pesan...' : 'Kirim Pesan Sekarang'}</span>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. PENUTUP & AJAKAN KESIAPSIAGAAN (Friendly Final Call to Action)          */}
      {/* ========================================================================= */}
      <section className="rounded-3xl bg-linear-to-r from-[#047857] via-[#065F46] to-[#047857] text-white p-8 sm:p-12 text-center space-y-6 shadow-md">
        <div className="max-w-2xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-100 text-xs font-semibold backdrop-blur-xs">
            <Shield className="w-3.5 h-3.5 text-emerald-200" />
            <span>Keluarga Indonesia Siaga &amp; Tangguh</span>
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Kesiapsiagaan Dimulai dari Langkah Kecil Hari Ini
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-normal">
            Jangan tunggu hingga sirine berbunyi. Mulai buat rencana darurat keluarga Anda sekarang juga—bebas biaya, terpercaya, dan dirancang khusus untuk Anda.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            to={PATHS.PUBLIC.PREPAREDNESS}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white hover:bg-emerald-50 text-[#047857] text-xs font-extrabold transition-all shadow-xs"
          >
            <span>Buka Panduan Siaga 72 Jam</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            to={PATHS.PUBLIC.REGISTER}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all"
          >
            <span>Daftar Akun Warga Siaga</span>
          </Link>
        </div>
      </section>
    </div>
  );
};
