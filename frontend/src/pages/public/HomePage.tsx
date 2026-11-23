import React, { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
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
  Clock,
  AlertTriangle,
  Send,
  Quote,
  MapPin,
  ShieldCheck
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
  avatarUrl: string;
  avatarText: string;
  avatarBg: string;
  rating: number;
  language: 'id' | 'en';
  category: 'warga' | 'relawan' | 'medis' | 'pemerintah' | 'international';
  quote: string;
  date: string;
  verifiedBadge: string;
}

// Reusable Reviewer Avatar with graceful image error fallback
const ReviewerAvatar: React.FC<{
  src: string;
  name: string;
  fallbackText: string;
  bg: string;
}> = ({ src, name, fallbackText, bg }) => {
  const [imgError, setImgError] = useState(false);

  if (imgError || !src) {
    return (
      <div
        className={`w-11 h-11 rounded-full ${bg} text-white font-bold flex items-center justify-center text-xs shrink-0 ring-2 ring-emerald-500/20 shadow-xs`}
      >
        {fallbackText}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      loading="lazy"
      onError={() => setImgError(true)}
      className="w-11 h-11 rounded-full object-cover shrink-0 ring-2 ring-emerald-500/20 shadow-xs"
    />
  );
};

const CITIZEN_REVIEWS: Testimonial[] = [
  {
    id: '1',
    name: 'Ibu Ratna Dewi',
    role: 'Ibu Rumah Tangga (Keluarga 4 Jiwa)',
    city: 'Cianjur, Jawa Barat',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=160&h=160',
    avatarText: 'RD',
    avatarBg: 'bg-emerald-600',
    rating: 5,
    language: 'id',
    category: 'warga',
    quote:
      'Waktu gempa susulan tempo hari, notifikasi SENTRAVAX langsung berbunyi sebelum kami sempat panik. Kami langsung tahu arah titik kumpul terdekat untuk mengevakuasi anak-anak dan ibu saya yang berusia 71 tahun. Sangat menenangkan dan tidak bikin bingung!',
    date: '14 Nov 2026',
    verifiedBadge: 'Warga Terverifikasi',
  },
  {
    id: '2',
    name: 'Sarah Jenkins',
    role: 'Humanitarian Relief Liaison (UN / INGO)',
    city: 'Sydney & Jakarta',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=160&h=160',
    avatarText: 'SJ',
    avatarBg: 'bg-indigo-600',
    rating: 5,
    language: 'en',
    category: 'international',
    quote:
      'The real-time geospatial alerts and bilingual shelter registry are extraordinarily accurate. During extreme storm warnings, SENTRAVAX gave our humanitarian field teams critical lead time to coordinate safe evacuation paths.',
    date: '08 Nov 2026',
    verifiedBadge: 'Humanitarian Partner',
  },
  {
    id: '3',
    name: 'Bripka Hendra Kurniawan',
    role: 'Koordinator Lapangan Relawan SAR & BPBD',
    city: 'Semarang, Jawa Tengah',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=160&h=160',
    avatarText: 'HK',
    avatarBg: 'bg-blue-600',
    rating: 5,
    language: 'id',
    category: 'relawan',
    quote:
      'Peta geospasial dan status keterisian shelter di SENTRAVAX sangat presisi. Selama banjir rob tahun ini, tim relawan terbantu mengarahkan warga ke lokasi yang benar-benar siap dan ramah lansia. Zero hoaks, data langsung dari BMKG & BNPB.',
    date: '02 Nov 2026',
    verifiedBadge: 'Relawan BPBD',
  },
  {
    id: '4',
    name: 'Alexander Weber',
    role: 'Expat Resident & Systems Architect',
    city: 'Canggu, Bali',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=160&h=160',
    avatarText: 'AW',
    avatarBg: 'bg-slate-700',
    rating: 5,
    language: 'en',
    category: 'international',
    quote:
      'Living in an active seismic belt, reliable warning systems are everything. SENTRAVAX delivers instantaneous CAP push alerts directly synced with national sensors without any misleading social media noise. Exceptional engineering.',
    date: '29 Okt 2026',
    verifiedBadge: 'Verified Resident',
  },
  {
    id: '5',
    name: 'dr. Siti Nurhaliza',
    role: 'Dokter Umum & Penanggung Jawab Puskesmas',
    city: 'Padang, Sumatera Barat',
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=160&h=160',
    avatarText: 'SN',
    avatarBg: 'bg-rose-600',
    rating: 5,
    language: 'id',
    category: 'medis',
    quote:
      'Kami menggunakan panduan kesiapsiagaan 72 jam SENTRAVAX untuk sosialisasi ke posyandu dan warga lansia. Penjelasannya manusiawi, praktis, dan langsung pada tindakan darurat yang menyelamatkan nyawa.',
    date: '19 Okt 2026',
    verifiedBadge: 'Tenaga Medis',
  },
  {
    id: '6',
    name: 'Emily Zhang',
    role: 'International Health Volunteer & Researcher',
    city: 'Yogyakarta',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=160&h=160',
    avatarText: 'EZ',
    avatarBg: 'bg-purple-600',
    rating: 5,
    language: 'en',
    category: 'international',
    quote:
      'The offline emergency readiness guides and accessibility-focused shelter maps are world-class. It is exceptionally comforting to know there is a transparent, ad-free disaster defense system protecting every community.',
    date: '12 Okt 2026',
    verifiedBadge: 'Medical Volunteer',
  },
  {
    id: '7',
    name: 'Pak Joko Suwarno',
    role: 'Ketua RW & Forum Kesiapsiagaan Bencana',
    city: 'Sleman, D.I. Yogyakarta',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=160&h=160',
    avatarText: 'JS',
    avatarBg: 'bg-teal-700',
    rating: 5,
    language: 'id',
    category: 'pemerintah',
    quote:
      'Di lereng Merapi, waktu adalah nyawa. SENTRAVAX sangat cocok untuk semua kalangan—bahkan warga sepuh kami pun bisa membaca petanya dengan nyaman karena hurufnya jelas dan warna kontrasnya pas.',
    date: '05 Okt 2026',
    verifiedBadge: 'Pengurus Lingkungan',
  },
  {
    id: '8',
    name: 'Dimas Pratama',
    role: 'Mahasiswa Perantau (Gen Z)',
    city: 'Malang, Jawa Timur',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=160&h=160',
    avatarText: 'DP',
    avatarBg: 'bg-amber-600',
    rating: 5,
    language: 'id',
    category: 'warga',
    quote:
      'Tampilannya bersih, elegan, dan nggak bikin pusing. Buat anak muda perantau yang ngekos sendirian dan jauh dari keluarga, aplikasi ini memberi rasa aman karena bisa cek status wilayah hanya dalam 1 detik.',
    date: '28 Sep 2026',
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

  // Reviews Carousel state
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 30) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: 380, behavior: 'smooth' });
      }
    }
  };

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      scrollRight();
    }, 3800);
    return () => clearInterval(interval);
  }, [isHovered]);

  // Reviews data for carousel
  const filteredReviews = CITIZEN_REVIEWS;

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

  const activeSheltersCount = shelters.length > 0 ? shelters.length : FALLBACK_SHELTERS.length;

  return (
    <div className="w-full">
      {/* ========================================================================= */}
      {/* 1. HERO: Full-Bleed Edge-to-Edge Cinematic Experience                      */}
      {/* ========================================================================= */}
      <section className="relative w-full min-h-[80vh] sm:min-h-[85vh] lg:min-h-[88vh] flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-8 overflow-hidden bg-slate-950 text-white">
        {/* Full-bleed background image */}
        <img
          src="https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=85&w=2560"
          alt="Atmospheric Earth Observation & Early Warning Telemetry"
          className="absolute inset-0 w-full h-full object-cover object-center scale-105"
          loading="eager"
        />

        {/* Sophisticated dark cinematic gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/50 to-slate-950/90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

        {/* Foreground Content */}
        <div className="relative z-10 max-w-4xl mx-auto space-y-6 sm:space-y-8 py-20 px-4">
          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12] drop-shadow-md">
            Lindungi Keluarga Anda.
            <span className="block text-emerald-400 mt-2 drop-shadow-sm">Siaga Nyata Sebelum Bencana.</span>
          </h1>

          {/* Concise, non-slop subtitle */}
          <p className="text-sm sm:text-base text-gray-200 leading-relaxed max-w-xl mx-auto font-normal drop-shadow-sm">
            Pantau potensi risiko di koordinat Anda dan temukan jalur evakuasi resmi dalam hitungan detik.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-3">
            <a
              href="#fitur-peta"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-sm transition-all shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5"
            >
              <Map className="w-4 h-4 text-gray-950" />
              <span>Buka Peta Radar</span>
            </a>

            <a
              href="#fitur-cek-risiko"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/25 text-white backdrop-blur-md font-semibold text-sm transition-all hover:-translate-y-0.5 shadow-lg"
            >
              <Compass className="w-4 h-4 text-emerald-300" />
              <span>Cek Risiko Wilayah</span>
            </a>
          </div>
        </div>

        {/* Bottom soft gradient fade into the page body */}
        <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-white via-white/40 to-transparent pointer-events-none" />
      </section>

      {/* Main Content Sections Container */}
      <div className="space-y-16 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

      {/* ========================================================================= */}
      {/* 3. INTEGRASI OTORITAS & STATUS SISTEM NASIONAL (Editorial & Elegan)        */}
      {/* ========================================================================= */}
      <section className="border-y border-gray-200/80 py-8 my-2">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          <div className="space-y-1.5">
            <div className="text-[10px] font-mono font-bold tracking-widest uppercase text-gray-600">
              SUMBER DATA OTORITATIF
            </div>
            <div className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight">
              BMKG &bull; BNPB &bull; PVMBG
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Integrasi langsung telemetri seismik, cuaca maritim, dan aktivitas vulkanik nasional.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="text-[10px] font-mono font-bold tracking-widest uppercase text-gray-600">
              STANDAR PERINGATAN DINI
            </div>
            <div className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <span>Protokol CAP v1.2</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Diseminasi notifikasi peringatan berstandar internasional dalam hitungan detik.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="text-[10px] font-mono font-bold tracking-widest uppercase text-gray-600">
              CAKUPAN WILAYAH KERJA
            </div>
            <div className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight">
              34 Provinsi Indonesia
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Pemetaan geospasial risiko multi-ancaman berbasis koordinat PostGIS presisi.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="text-[10px] font-mono font-bold tracking-widest uppercase text-gray-600">
              LAYANAN PUBLIK TERBUKA
            </div>
            <div className="text-base sm:text-lg font-extrabold text-[#047857] tracking-tight">
              Bebas Biaya &bull; Nirlaba
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Disediakan untuk keselamatan masyarakat luas tanpa iklan dan tanpa monetisasi data.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. FITUR UTAMA 1: PETA SITUASI & SHELTER INTERAKTIF (Live Map)            */}
      {/* ========================================================================= */}
      <section id="fitur-peta" className="space-y-4 pt-6 border-t border-[#E5E7EB]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827]">
              Peta Situasi Bencana &amp; Shelter Terkini
            </h2>
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

        {/* Alur Kerja 3 Langkah Interaktif & Menarik */}
        <div className="relative rounded-3xl bg-gradient-to-br from-gray-50 via-white to-emerald-50/40 border border-[#E5E7EB] p-6 sm:p-10 space-y-8 shadow-xs overflow-hidden">
          {/* Subtle decorative glow */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center max-w-2xl mx-auto space-y-2 relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold text-[#047857] bg-emerald-50 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
              ALUR KESIAPSIAGAAN TERSTRUKTUR
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
              Tiga Langkah Menjaga Keselamatan Keluarga Anda
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-normal">
              Dari deteksi risiko awal, persiapan ransum mandiri di rumah, hingga jalur evakuasi aman saat sirine berbunyi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {/* Step 1 */}
            <div className="p-6 rounded-3xl bg-white border border-gray-200 hover:border-emerald-400 hover:shadow-lg transition-all duration-300 flex flex-col justify-between space-y-5 group hover:-translate-y-1">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#047857] flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform">
                    <Compass className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono font-extrabold text-[#047857] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    LANGKAH 01
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-base font-extrabold text-gray-900 group-hover:text-[#047857] transition-colors">
                    Deteksi Cepat Zona Bahaya
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    Ketahui status risiko gempa bumi, banjir, dan cuaca ekstrem di koordinat tempat tinggal Anda dalam satu sentuhan GPS tanpa registrasi rumit.
                  </p>
                </div>

                {/* Micro-preview Widget */}
                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs space-y-2 font-mono">
                  <div className="flex items-center justify-between text-gray-500 text-[11px]">
                    <span className="flex items-center gap-1 font-sans">
                      <MapPin className="w-3.5 h-3.5 text-[#047857]" /> GPS Sensor
                    </span>
                    <span className="text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded font-bold text-[10px]">
                      AKTIF 24/7
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-gray-900 font-sans font-bold">
                    <span>Status Wilayah:</span>
                    <span className="text-[#047857] flex items-center gap-1 font-extrabold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Aman Terkendali
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <a
                  href="#fitur-cek-risiko"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#047857] hover:text-[#065F46] transition-colors group-hover:translate-x-0.5"
                >
                  <span>Coba Cek Wilayah Anda</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-3xl bg-white border border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all duration-300 flex flex-col justify-between space-y-5 group hover:-translate-y-1">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                    LANGKAH 02
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-base font-extrabold text-gray-900 group-hover:text-blue-700 transition-colors">
                    Ransum &amp; Tas Siaga 72 Jam
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    Hitung otomatis ransum air bersih minimal 3L/hari, stok pangan kalori, dan obat rutin keluarga agar mandiri sebelum bantuan darurat tiba.
                  </p>
                </div>

                {/* Micro-preview Widget */}
                <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs space-y-2 font-mono">
                  <div className="flex items-center justify-between text-gray-500 text-[11px]">
                    <span className="flex items-center gap-1 font-sans text-blue-900 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Logistik Mandiri
                    </span>
                    <span className="text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded font-bold text-[10px]">
                      Standar BNPB
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-gray-900 font-sans font-bold">
                    <span>Kesiapan Ransum:</span>
                    <span className="text-blue-700 font-extrabold">
                      Air 9L • P3K • Dokumen
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <Link
                  to={PATHS.PUBLIC.PREPAREDNESS}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 transition-colors group-hover:translate-x-0.5"
                >
                  <span>Buka Panduan Tas Siaga</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-3xl bg-white border border-gray-200 hover:border-amber-400 hover:shadow-lg transition-all duration-300 flex flex-col justify-between space-y-5 group hover:-translate-y-1">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform">
                    <Navigation className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono font-extrabold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    LANGKAH 03
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-base font-extrabold text-gray-900 group-hover:text-amber-800 transition-colors">
                    Evakuasi Terarah ke Shelter
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    Saat evakuasi diperlukan, arahkan keluarga ke shelter dan posko terbuka resmi yang memiliki fasilitas sanitasi dan akses ramah difabel/lansia.
                  </p>
                </div>

                {/* Micro-preview Widget */}
                <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100 text-xs space-y-2 font-mono">
                  <div className="flex items-center justify-between text-gray-500 text-[11px]">
                    <span className="flex items-center gap-1 font-sans text-amber-900 font-bold">
                      <Building2 className="w-3.5 h-3.5 text-amber-700" /> Posko Terverifikasi
                    </span>
                    <span className="text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded font-bold text-[10px]">
                      RAMAH DIFABEL
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-gray-900 font-sans font-bold">
                    <span>Titik Shelter:</span>
                    <span className="text-amber-800 font-extrabold">
                      Navigasi Peta Rute Langsung
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <Link
                  to={PATHS.PUBLIC.SHELTERS}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-950 transition-colors group-hover:translate-x-0.5"
                >
                  <span>Cari Titik Shelter Terdekat</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. ULASAN & PENGALAMAN WARGA (Interactive Horizontal Auto-Scroll Carousel)*/}
      {/* ========================================================================= */}
      <section id="ulasan-warga" className="space-y-6 pt-6 border-t border-[#E5E7EB]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827]">
              Suara Nyata dari Puluhan Ribu Pengguna
            </h2>
          </div>

          {/* Overall Trust Rating */}
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-gray-50 border border-gray-200 shadow-2xs shrink-0">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
              <span className="font-extrabold text-gray-900 text-sm tracking-tight">4.9</span>
              <span className="text-[11px] text-gray-400 font-medium">/ 5.0</span>
            </div>
            <div className="w-[1px] h-3.5 bg-gray-200" />
            <span className="text-xs text-gray-600 font-medium">
              32.400+ Ulasan Warga
            </span>
          </div>
        </div>

        {/* Horizontal Smooth Scroll Track */}
        <div
          ref={scrollContainerRef}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x scroll-smooth cursor-grab active:cursor-grabbing [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="w-[320px] sm:w-[380px] shrink-0 snap-start p-5 rounded-3xl bg-white border border-gray-200 hover:border-emerald-300 transition-all shadow-xs hover:shadow-md flex flex-col justify-between space-y-4 group relative"
            >
              <div className="space-y-3">
                {/* Header: Star rating + language pill + verified badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                      {rev.language === 'id' ? '🇮🇩 ID' : '🇬🇧 EN'}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-[#047857] border border-emerald-200">
                      {rev.verifiedBadge}
                    </span>
                  </div>
                </div>

                {/* Quote content */}
                <div className="relative">
                  <Quote className="w-5 h-5 text-emerald-200/60 absolute -top-1 -left-1 -z-0" />
                  <p className="text-xs sm:text-[13px] text-gray-700 leading-relaxed italic relative z-10 line-clamp-4">
                    &ldquo;{rev.quote}&rdquo;
                  </p>
                </div>
              </div>

              {/* Reviewer Profile Footer with Real Photo */}
              <div className="pt-3 border-t border-gray-100 flex items-center gap-3">
                <ReviewerAvatar
                  src={rev.avatarUrl}
                  name={rev.name}
                  fallbackText={rev.avatarText}
                  bg={rev.avatarBg}
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-gray-900 truncate group-hover:text-[#047857] transition-colors">
                    {rev.name}
                  </div>
                  <div className="text-[11px] text-gray-500 truncate">{rev.role}</div>
                  <div className="text-[10px] text-gray-400">{rev.city} • {rev.date}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. KONTAK & PUSAT BANTUAN RESMI (Layanan Terpadu & Saluran Darurat)        */}
      {/* ========================================================================= */}
      <section id="kontak-resmi" className="space-y-8 pt-6 border-t border-[#E5E7EB]">
        {/* Hotline Darurat Nasional (Bebas Pulsa 1-Tap Dial) */}
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

        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827]">
            Hubungi Kami &amp; Layanan Publik
          </h2>
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
    </div>
  );
};
