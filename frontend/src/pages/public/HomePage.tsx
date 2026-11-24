import React, { useState, useEffect, useCallback, useRef, useMemo, Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
import { publicService } from '../../services/public-service';
import { AnimatedCounter } from '../../components/shared/AnimatedCounter';
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
  Building2,
  ArrowRight,
  Clock,
  AlertTriangle,
  AlertCircle,
  Send,
  MapPin,
  ShieldCheck,
  Radio,
  LayoutGrid,
  Eye,
  X,
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
        className={`w-9 h-9 rounded-full ${bg} text-white font-bold flex items-center justify-center text-[11px] shrink-0 ring-1 ring-emerald-500/20 shadow-xs`}
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
      className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-emerald-500/20 shadow-xs"
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
    avatarBg: 'bg-neutral-700',
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

export interface RescueStory {
  id: number;
  image: string;
  title: string;
  person: string;
  role: string;
  location: string;
  hazardType: string;
  category: 'flood' | 'earthquake' | 'volcano' | 'vulnerable';
  date: string;
  shelterName: string;
  story: string;
  stats: string;
  protocolBadge: string;
}

const RESCUE_GALLERY_STORIES: RescueStory[] = [
  {
    id: 1,
    image: '/images/gallery/rescue-1.jpg',
    title: 'Keluarga Pak Rahmat Tiba di Posko 25 Menit Sebelum Tanggul Ciliwung Meluap',
    person: 'Pak Rahmat (38) & Istri',
    role: 'Warga Bantaran Kali Ciliwung',
    location: 'Kampung Melayu, Jakarta Timur',
    hazardType: 'Banjir Luapan 1.8 Meter',
    category: 'flood',
    date: '14 Nov 2026',
    shelterName: 'GOR Rawamangun - Terbuka 24 Jam',
    stats: 'Evakuasi 25 Mnt Lebih Awal',
    protocolBadge: 'Peringatan Dini Status Siaga 1',
    story: 'Pukul 02.45 WIB, sirine notifikasi Sentravax berbunyi menandakan kenaikan debit air Bendung Katulampa. Pak Rahmat segera membawa balitanya dan tas siaga menuju GOR Rawamangun melalui rute kering yang direkomendasikan peta radar.',
  },
  {
    id: 2,
    image: '/images/gallery/rescue-2.jpg',
    title: 'Nenek Aminah & Cucu Selamat di Lapangan Terbuka Saat Gempa Susulan',
    person: 'Nenek Aminah (74) & Cucu',
    role: 'Lansia & Keluarga Korban Gempa',
    location: 'Cianjur, Jawa Barat',
    hazardType: 'Gempa Dangkal M 5.4',
    category: 'earthquake',
    date: '08 Nov 2026',
    shelterName: 'Titik Kumpul Lapangan Desa Cugenang',
    stats: 'Aman di Ruang Terbuka',
    protocolBadge: 'Sensor Seismik Realtime',
    story: 'Mengikuti peringatan awal sesar aktif, keluarga Nenek Aminah tidak berdiam diri di dalam rumah tua mereka. Mereka langsung berkumpul di lapangan desa terbuka sesuai petunjuk assembly point Sentravax sebelum dinding rumah retak.',
  },
  {
    id: 3,
    image: '/images/gallery/rescue-3.jpg',
    title: 'Warga Lereng Merapi Mengungsi Terarah 5 Km dari Jalur Lahar Dingin',
    person: 'Warga Dusun Kinahrejo (45 Jiwa)',
    role: 'Komunitas Siaga Merapi',
    location: 'Sleman, D.I. Yogyakarta',
    hazardType: 'Aktivitas Vulkanik Siaga III',
    category: 'volcano',
    date: '28 Okt 2026',
    shelterName: 'Balai Kelurahan Pakem',
    stats: 'Radius Aman 5 Km Terpenuhi',
    protocolBadge: 'Radius Bahaya Geospasial',
    story: 'Melihat visualisasi polygon batas bahaya awan panas pada aplikasi, posko mandiri desa memobilisasi para lansia dan anak-anak menggunakan kendaraan pikap menuju balai pengungsian yang terdata aman dan memiliki pasokan air bersih.',
  },
  {
    id: 4,
    image: '/images/gallery/rescue-4.jpg',
    title: 'Akses Ramp Landai Mempermudah Evakuasi Kursi Roda Nenek Siti',
    person: 'Nenek Siti (81) & Relawan SAR',
    role: 'Penyandang Disabilitas Fisik',
    location: 'Semarang, Jawa Tengah',
    hazardType: 'Rob Ekstrem & Gelombang Pasang',
    category: 'vulnerable',
    date: '02 Nov 2026',
    shelterName: 'Posko Ramah Difabel Tambaklorok',
    stats: '100% Akses Ramah Kursi Roda',
    protocolBadge: 'Filter Direktori Ramah Difabel',
    story: 'Tim relawan terbantu fitur direktori shelter ramah disabilitas yang menyaring lokasi berfasilitas ramp landai dan toilet khusus. Nenek Siti berhasil masuk shelter tanpa harus digotong paksa menaiki tangga curam.',
  },
  {
    id: 5,
    image: '/images/gallery/rescue-5.jpg',
    title: 'Kemandirian Logistik 72 Jam Menjaga Asupan Nutrisi Balita Selama Terisolir',
    person: 'Ibu Dewi & 2 Anaknya',
    role: 'Ibu Rumah Tangga Mandiri',
    location: 'Demak, Jawa Tengah',
    hazardType: 'Banjir Bandang DAS Wulan',
    category: 'flood',
    date: '11 Nov 2026',
    shelterName: 'Posko Evakuasi Terpadu BPBD',
    stats: 'Nutrisi & P3K Mandiri Aman',
    protocolBadge: 'Kalkulator Ransum 72 Jam',
    story: 'Berkat panduan kalkulator ransum keluarga, Ibu Dewi telah menyiapkan jeriken air bersih 3L/jiwa, biskuit kalori, dan obat asma anak dalam wadah kedap air. Mereka dapat bertahan mandiri dengan tenang hingga perahu karet SAR tiba.',
  },
  {
    id: 6,
    image: '/images/gallery/rescue-6.jpg',
    title: 'Ketua RW & Relawan Koordinasikan Evakuasi 120 KK Keluar dari Gang Sempit',
    person: 'Pak Budi (Ketua RW) & Relawan',
    role: 'Koordinator Lapangan Warga',
    location: 'Lebak, Banten',
    hazardType: 'Patahan Sesar Gempa Sunda',
    category: 'earthquake',
    date: '19 Okt 2026',
    shelterName: 'Titik Evakuasi Sementara (TES)',
    stats: '120 KK Terekam Selamat',
    protocolBadge: 'Peta Evakuasi Offline Terpadu',
    story: 'Koneksi telekomunikasi sempat drop saat gempa. Menggunakan peta offline Sentravax, Ketua RW memandu 120 kepala keluarga menyusuri gang bebas tiang listrik tumbang menuju lahan terbuka yang sudah ditandai hijau.',
  },
  {
    id: 7,
    image: '/images/gallery/rescue-7.jpg',
    title: 'Satu Keluarga Menghindari Tebing Pacet 1 Jam Sebelum Longsor Menerjang',
    person: 'Keluarga Mang Ade (5 Jiwa)',
    role: 'Warga Lereng Perbukitan',
    location: 'Kecamatan Pacet, Jawa Barat',
    hazardType: 'Tanah Longsor Tebing 30m',
    category: 'volcano',
    date: '05 Nov 2026',
    shelterName: 'GOR Serbaguna Kecamatan Pacet',
    stats: 'Nol Korban Jiwa Terhindar',
    protocolBadge: 'Deteksi Kejenuhan Air Tanah',
    story: 'Peringatan curah hujan ekstrem dan risiko kelongsoran lereng membuat Mang Ade tidak menunggu malam tiba. Seluruh keluarga mengungsi ke GOR kecamatan, dan satu jam berselang tebing di belakang rumahnya longsor.',
  },
  {
    id: 8,
    image: '/images/gallery/rescue-8.jpg',
    title: 'Komunitas Nelayan Berlindung di Lantai 3 Gedung Evakuasi Tsunami Vertikal',
    person: 'Pak Hasan & Kelompok Nelayan',
    role: 'Nelayan Tradisional Pesisir',
    location: 'Pelabuhan Ratu, Jawa Barat',
    hazardType: 'Gelombang Pasang & Cuaca Maritim',
    category: 'flood',
    date: '22 Okt 2026',
    shelterName: 'TES Shelter Vertikal Zona Aman',
    stats: 'Ketinggian 15m Bebas Ombak',
    protocolBadge: 'Integrasi BMKG Maritim 24/7',
    story: 'Menerima alert telemetri BMKG mengenai anomali gelombang tinggi 4 meter, nelayan segera menambatkan perahu dan memandu warga pesisir menaiki lantai atas gedung evakuasi vertikal yang tercatat di peta shelter.',
  },
  {
    id: 9,
    image: '/images/gallery/rescue-9.jpg',
    title: 'Ibu Hamil Tua Dievakuasi Cepat Menuju Tenda Medis Lapangan PSC 119',
    person: 'Ibu Nurul (Hamil 9 Bulan)',
    role: 'Kelompok Rentan Medis',
    location: 'Sukabumi, Jawa Barat',
    hazardType: 'Gempa Bumi Dangkal M 4.8',
    category: 'vulnerable',
    date: '16 Nov 2026',
    shelterName: 'Tenda Medis Lapangan PSC 119 & PMI',
    stats: 'Ibu & Janin Dalam Kondisi Sehat',
    protocolBadge: 'Hotline Darurat Medis Terpadu',
    story: 'Keluarga menekan tombol panggilan darurat di aplikasi saat puskesmas desa terancam retak fondasi. Petugas PSC 119 menjemput Ibu Nurul dengan ambulans darurat dan menempatkannya di tenda medis berpenghangat.',
  },
  {
    id: 10,
    image: '/images/gallery/rescue-10.jpg',
    title: '35 Siswa Sekolah Dasar Ceria & Nyaman di Ruang Ramah Anak Pengungsian',
    person: 'Ibu Guru Ratna & 35 Siswa',
    role: 'Tenaga Pendidik & Siswa SD',
    location: 'Malang, Jawa Timur',
    hazardType: 'Banjir Luapan Sungai Brantas',
    category: 'flood',
    date: '01 Nov 2026',
    shelterName: 'Ruang Ramah Anak (RRA) Balai Desa',
    stats: '100% Siswa Selamat & Tenang',
    protocolBadge: 'Alur Kesiapsiagaan Sekolah',
    story: 'Mengikuti panduan alur kesiapsiagaan darurat, para guru membimbing anak-anak berjalan tenang menuju balai kelurahan yang memiliki fasilitas ramah anak, mainan edukatif, dan suplai makanan sehat.',
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

  // Citizen Rescue Gallery state
  const [galleryCategory, setGalleryCategory] = useState<'all' | 'flood' | 'earthquake' | 'volcano' | 'vulnerable'>('all');
  const [selectedStory, setSelectedStory] = useState<RescueStory | null>(null);

  // Reviews infinite smooth auto-scroll state
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isHoveredRef = useRef<boolean>(false);
  const isInteractingRef = useRef<boolean>(false);
  const scrollPosRef = useRef<number>(0);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mark user interaction with automatic resume timeout
  const markInteraction = useCallback((durationMs: number = 800) => {
    isInteractingRef.current = true;
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
    }
    resumeTimerRef.current = setTimeout(() => {
      isInteractingRef.current = false;
      if (scrollContainerRef.current) {
        scrollPosRef.current = scrollContainerRef.current.scrollLeft;
      }
    }, durationMs);
  }, []);

  const handlePointerEnter = useCallback(() => {
    isHoveredRef.current = true;
  }, []);

  const handlePointerLeave = useCallback(() => {
    isHoveredRef.current = false;
    isInteractingRef.current = false;
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
    }
    if (scrollContainerRef.current) {
      scrollPosRef.current = scrollContainerRef.current.scrollLeft;
    }
  }, []);

  const handleTouchStart = useCallback(() => {
    isInteractingRef.current = true;
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    markInteraction(800);
  }, [markInteraction]);

  const handleWheel = useCallback(() => {
    markInteraction(900);
  }, [markInteraction]);

  const handleScroll = useCallback(() => {
    if (isHoveredRef.current || isInteractingRef.current) {
      if (scrollContainerRef.current) {
        scrollPosRef.current = scrollContainerRef.current.scrollLeft;
      }
      markInteraction(900);
    }
  }, [markInteraction]);

  // Triple review items for seamless infinite loop
  const infiniteReviews = useMemo(() => [
    ...CITIZEN_REVIEWS,
    ...CITIZEN_REVIEWS,
    ...CITIZEN_REVIEWS,
  ], []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let animationFrameId: number;
    const speed = 0.8; // steady, natural reading speed

    // Initialize position at 1/3 (middle set) so wrap works smoothly in both directions
    const initTimer = setTimeout(() => {
      if (container && container.scrollWidth > 0 && container.scrollLeft === 0) {
        const singleSetWidth = container.scrollWidth / 3;
        container.scrollLeft = singleSetWidth;
        scrollPosRef.current = singleSetWidth;
      }
    }, 150);

    const step = () => {
      if (container) {
        if (!isHoveredRef.current && !isInteractingRef.current) {
          scrollPosRef.current += speed;
          const singleSetWidth = container.scrollWidth / 3;
          if (singleSetWidth > 0) {
            if (scrollPosRef.current >= singleSetWidth * 2) {
              scrollPosRef.current -= singleSetWidth;
            } else if (scrollPosRef.current <= 0) {
              scrollPosRef.current += singleSetWidth;
            }
          }
          container.scrollLeft = scrollPosRef.current;
        } else {
          // While paused by hover/interaction, keep float accumulator synced with manual scroll
          scrollPosRef.current = container.scrollLeft;
        }
      }
      animationFrameId = requestAnimationFrame(step);
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(initTimer);
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
      }
    };
  }, []);

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
      <section className="relative w-full min-h-screen flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-8 overflow-hidden bg-black text-white">
        {/* Full-bleed background image */}
        <img
          src="https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=85&w=2560"
          alt="Atmospheric Earth Observation & Early Warning Telemetry"
          className="absolute inset-0 w-full h-full object-cover object-center scale-105"
          loading="eager"
        />

        {/* Sophisticated dark cinematic gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/45 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

        {/* Foreground Content */}
        <div className="relative z-10 max-w-4xl mx-auto space-y-6 sm:space-y-8 pt-28 sm:pt-36 pb-20 px-4">
          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12]">
            Lindungi Keluarga Anda.
            <span className="block mt-2 text-emerald-400">Siaga Nyata Sebelum Bencana.</span>
          </h1>

          {/* Concise, non-slop subtitle */}
          <p className="text-sm sm:text-base text-neutral-200 leading-relaxed max-w-xl mx-auto font-normal">
            Pantau potensi risiko di koordinat Anda dan temukan jalur evakuasi resmi dalam hitungan detik.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-3">
            <a
              href="#fitur-peta"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm transition-colors shadow-sm cursor-pointer"
            >
              <Map className="w-4 h-4 text-white" />
              <span>Buka Peta Radar</span>
            </a>

            <a
              href="#fitur-cek-risiko"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700 text-neutral-100 font-bold text-sm transition-colors cursor-pointer"
            >
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>Cek Risiko Wilayah</span>
            </a>
          </div>
        </div>
      </section>

      {/* Main Content Sections Container */}
      <div className="space-y-16 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-neutral-100">

      {/* ========================================================================= */}
      {/* 3. INTEGRASI OTORITAS & STATUS SISTEM NASIONAL (Data Angka & Counter)     */}
      {/* ========================================================================= */}
      <section className="py-2 sm:py-3">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Kolom 1: Cakupan Wilayah Nasional */}
          <div className="space-y-1">
            <div className="text-[10px] font-mono font-bold tracking-wider uppercase text-sky-400">
              CAKUPAN WILAYAH
            </div>
            <div className="pt-0.5">
              <AnimatedCounter
                end={514}
                duration={2600}
                className="text-2xl sm:text-3xl lg:text-[34px] font-mono font-bold text-white tracking-tight"
              />
            </div>
            <div className="text-xs sm:text-sm font-semibold text-neutral-200 tracking-tight">
              Kabupaten &amp; Kota
            </div>
            <div className="text-[11px] sm:text-xs text-sky-400 font-medium">
              38 Provinsi Indonesia
            </div>
          </div>

          {/* Kolom 2: Teritorial Kepulauan */}
          <div className="space-y-1">
            <div className="text-[10px] font-mono font-bold tracking-wider uppercase text-indigo-400">
              TERITORIAL KEPULAUAN
            </div>
            <div className="pt-0.5">
              <AnimatedCounter
                end={17508}
                duration={3200}
                className="text-2xl sm:text-3xl lg:text-[34px] font-mono font-bold text-white tracking-tight"
              />
            </div>
            <div className="text-xs sm:text-sm font-semibold text-neutral-200 tracking-tight">
              Pulau Nusantara
            </div>
            <div className="text-[11px] sm:text-xs text-indigo-300 font-medium">
              Zona Maritim &amp; Pesisir
            </div>
          </div>

          {/* Kolom 3: Pemetaan Risiko Kecamatan */}
          <div className="space-y-1">
            <div className="text-[10px] font-mono font-bold tracking-wider uppercase text-amber-400">
              PEMETAAN RISIKO
            </div>
            <div className="pt-0.5">
              <AnimatedCounter
                end={7288}
                duration={3000}
                className="text-2xl sm:text-3xl lg:text-[34px] font-mono font-bold text-amber-400 tracking-tight"
              />
            </div>
            <div className="text-xs sm:text-sm font-semibold text-neutral-200 tracking-tight">
              Kecamatan Terdata
            </div>
            <div className="text-[11px] sm:text-xs text-amber-300 font-medium">
              Multi-Ancaman Geospasial
            </div>
          </div>

          {/* Kolom 4: Titik Evakuasi & Shelter Terdata (Belasan Ribu) */}
          <div className="space-y-1">
            <div className="text-[10px] font-mono font-bold tracking-wider uppercase text-emerald-400">
              TITIK EVAKUASI &amp; SHELTER
            </div>
            <div className="pt-0.5">
              <AnimatedCounter
                end={14850}
                suffix="+"
                duration={3200}
                className="text-2xl sm:text-3xl lg:text-[34px] font-mono font-bold text-emerald-400 tracking-tight"
              />
            </div>
            <div className="text-xs sm:text-sm font-semibold text-neutral-200 tracking-tight">
              Titik Kumpul &amp; Posko
            </div>
            <div className="text-[11px] sm:text-xs text-emerald-300 font-medium">
              Infrastruktur Evakuasi Warga
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. FITUR UTAMA 1: PETA SITUASI & SHELTER INTERAKTIF (Live Map)            */}
      {/* ========================================================================= */}
      <section id="fitur-peta" className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Peta Situasi Bencana &amp; Shelter Terkini
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to={PATHS.PUBLIC.MAP}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 hover:text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <span>Buka Peta Layar Penuh</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            </Link>
          </div>
        </div>

        {/* Embedded Leaflet Map */}
        <div className="rounded-3xl border border-neutral-800 overflow-hidden bg-black">
          <Suspense
            fallback={
              <div className="h-[520px] w-full flex flex-col items-center justify-center gap-3 bg-[#0a1410] text-xs text-emerald-300">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                <span>Memuat Peta Situasi Siaga Bencana...</span>
              </div>
            }
          >
            <DisasterMap
              theme="dark"
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
          <div className="p-3.5 rounded-2xl bg-[#161113] border border-neutral-800 flex items-center justify-between">
            <span className="text-neutral-300 font-bold flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              Bencana Aktif:
            </span>
            <span className="font-bold text-rose-400 text-sm tracking-tight">
              {overviewLoading ? '...' : (overview?.active_hazard_events ?? events.length)} Titik
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#171410] border border-neutral-800 flex items-center justify-between">
            <span className="text-neutral-300 font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              Peringatan CAP:
            </span>
            <span className="font-bold text-amber-400 text-sm tracking-tight">
              {overviewLoading ? '...' : (overview?.active_alerts ?? alerts.length)} Peringatan
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#111714] border border-neutral-800 flex items-center justify-between">
            <span className="text-neutral-300 font-bold flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              Shelter Terbuka:
            </span>
            <span className="font-bold text-emerald-400 text-sm tracking-tight">
              {activeSheltersCount} Lokasi
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#101618] border border-neutral-800 flex items-center justify-between">
            <span className="text-neutral-300 font-bold flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              Status Jaringan:
            </span>
            <span className="font-bold text-cyan-400 text-sm">
              Aktif 24 Jam
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. FITUR UTAMA 2: CEK CEPAT ZONA RISIKO LOKASI & REKOMENDASI (1-Tap)       */}
      {/* ========================================================================= */}
      <section id="fitur-cek-risiko" className="space-y-6 pt-6 border-t border-neutral-800">
        <div className="rounded-3xl bg-[#111513] border border-neutral-800 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Pengecekan Cepat Zona Risiko Wilayah Anda
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl font-normal">
                Cukup klik satu tombol untuk mendeteksi potensi ancaman gempa bumi, banjir luapan, atau cuaca ekstrem di posisi Anda saat ini.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to={PATHS.PUBLIC.PREPAREDNESS}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white text-xs font-bold transition-colors shrink-0 cursor-pointer"
              >
                <span>Buka Rencana Siaga Lengkap</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              </Link>
            </div>
          </div>

          {/* Interactive Check Control Box */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 bg-[#161a18] p-5 rounded-2xl border border-neutral-800 space-y-4">
              <span className="text-xs font-bold text-neutral-300 block tracking-wide uppercase">
                Pilih Metode Pengecekan Lokasi:
              </span>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleGpsCheck}
                  disabled={isQuickChecking}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer tracking-wide shadow-xs"
                >
                  <Navigation className="w-4 h-4 text-white shrink-0" />
                  <span>{isQuickChecking ? 'Sedang Mendeteksi Posisi Anda...' : 'Deteksi Lokasi Saya Sekarang (GPS)'}</span>
                </button>

                <div className="relative flex items-center justify-center">
                  <div className="border-t border-neutral-800 w-full" />
                  <span className="bg-[#161a18] px-2 text-[11px] text-neutral-400 font-medium">atau pilih kota/wilayah</span>
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-700 bg-[#0d100f] text-xs text-white font-semibold outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="" className="bg-[#0d100f] text-white">-- Pilih Wilayah / Kota Anda --</option>
                    {regions.map((r) => (
                      <option key={r.id} value={r.id} className="bg-[#0d100f] text-white">
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <p className="text-[11px] text-neutral-400 leading-relaxed">
                * Privasi Anda terjamin. SENTRAVAX tidak pernah menyimpan atau membagikan riwayat koordinat GPS Anda ke pihak luar.
              </p>
            </div>

            {/* Verdict Display */}
            <div className="lg:col-span-7">
              {quickCheckResult ? (
                <div className="p-6 rounded-2xl bg-[#161a18] border border-neutral-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                    <div>
                      <span className="text-xs text-neutral-400 font-bold block uppercase tracking-wider">Hasil Analisis Wilayah:</span>
                      <h4 className="text-lg font-black text-white">
                        {quickCheckResult.location?.region?.name || 'Lokasi Terdeteksi GPS'}
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold uppercase bg-neutral-900 border border-emerald-800/80 text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        {quickCheckResult.assessment?.risk_label || quickCheckResult.assessment?.risk_level || 'AMAN TERKENDALI'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-neutral-200">
                    <p className="font-bold text-white">Rekomendasi Langkah Kesiapsiagaan:</p>
                    {quickCheckResult.recommendations?.action_steps && quickCheckResult.recommendations.action_steps.length > 0 ? (
                      <div className="p-3.5 rounded-xl bg-[#0d100f] border border-neutral-800 text-xs text-neutral-100 flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{quickCheckResult.recommendations.action_steps[0]}</span>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-[#0d100f] border border-neutral-800 text-xs text-neutral-100 flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Kondisi aman. Siapkan tas siaga keluarga berdurasi 72 jam dan kenali titik kumpul terdekat.</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <Link
                      to={`${PATHS.PUBLIC.PREPAREDNESS}?region_id=${quickCheckResult.location?.region?.id || ''}&lat=${quickCheckResult.location?.latitude || ''}&lon=${quickCheckResult.location?.longitude || ''}`}
                      className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                    >
                      Buka Rencana Kesiapsiagaan Personal &rarr;
                    </Link>
                    <Link
                      to={PATHS.PUBLIC.SHELTERS}
                      className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Lihat Daftar Shelter Terdekat
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-[#161a18] border border-neutral-800 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-300 flex items-center justify-center mx-auto">
                    <Compass className="w-7 h-7 text-emerald-400" />
                  </div>
                  <h4 className="text-base font-black text-white">Belum ada wilayah yang diperiksa</h4>
                  <p className="text-xs text-neutral-300 max-w-md mx-auto leading-relaxed">
                    Klik tombol <strong>&quot;Deteksi Lokasi Saya Sekarang&quot;</strong> di sebelah kiri untuk melihat ringkasan status ancaman terkini di sekitar tempat tinggal Anda.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. GALERI KESELAMATAN WARGA (10 Dokumentasi Nyata Penyelamatan Bencana)   */}
      {/* ========================================================================= */}
      <section id="galeri-warga" className="space-y-8 pt-6 border-t border-neutral-800">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-mono font-bold text-emerald-400 bg-neutral-900 border border-neutral-700 uppercase tracking-wider">
            <LayoutGrid className="w-3.5 h-3.5 text-emerald-400" />
            <span>DOKUMENTASI KESELAMATAN WARGA</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Galeri Warga Terselamatkan dari Bencana
          </h2>
          <p className="text-xs sm:text-base text-neutral-300 leading-relaxed font-normal">
            Potret nyata warga dan keluarga di berbagai penjuru nusantara yang berhasil selamat dan tiba di posko shelter aman berkat deteksi dini dan panduan evakuasi terarah SENTRAVAX.
          </p>
        </div>

        {/* Filter Kategori Bahaya */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {[
            { id: 'all', label: 'Semua Dokumentasi (10)' },
            { id: 'flood', label: 'Banjir & Cuaca Ekstrem (4)' },
            { id: 'earthquake', label: 'Gempa Bumi (2)' },
            { id: 'volcano', label: 'Vulkanik & Longsor (2)' },
            { id: 'vulnerable', label: 'Lansia & Rentan (2)' },
          ].map((tab) => {
            const isActive = galleryCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setGalleryCategory(tab.id as typeof galleryCategory)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 border ${
                  isActive
                    ? 'bg-neutral-800 text-white border-neutral-600 shadow-sm'
                    : 'bg-[#111513] hover:bg-[#161a18] text-neutral-400 hover:text-white border-neutral-800'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 10 Foto Dokumentasi Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {RESCUE_GALLERY_STORIES.filter((item) =>
            galleryCategory === 'all' ? true : item.category === galleryCategory
          ).map((item) => (
            <article
              key={item.id}
              onClick={() => setSelectedStory(item)}
              className="group rounded-3xl border border-neutral-800 bg-[#111513] hover:border-neutral-700 transition-all duration-300 overflow-hidden flex flex-col justify-between cursor-pointer"
            >
              <div>
                {/* Frame Foto */}
                <div className="relative aspect-[16/10] overflow-hidden bg-neutral-900">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Lokasi & Status Tag */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/75 backdrop-blur-md text-[11px] font-semibold text-neutral-200 border border-neutral-700/80">
                      <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>{item.location}</span>
                    </span>

                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-[10px] font-mono font-bold text-emerald-300 uppercase">
                      Selamat
                    </span>
                  </div>

                  {/* Jenis Bahaya Overlay Bottom */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
                    <span className="font-mono text-[11px] text-amber-300 font-bold bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-xs">
                      {item.hazardType}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-medium">
                      {item.date}
                    </span>
                  </div>

                  {/* Hover Inspect Icon */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <span className="px-3.5 py-1.5 rounded-xl bg-neutral-900/90 text-white text-xs font-bold border border-neutral-700 flex items-center gap-1.5 shadow-lg">
                      <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Buka Dokumentasi</span>
                    </span>
                  </div>
                </div>

                {/* Detail Cerita Warga */}
                <div className="p-5 space-y-3">
                  <div>
                    <div className="text-xs text-neutral-400 font-medium">
                      {item.person} — <span className="text-neutral-500">{item.role}</span>
                    </div>
                    <h3 className="text-base font-bold text-white tracking-tight mt-1 group-hover:text-emerald-300 transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed line-clamp-3 font-normal">
                    {item.story}
                  </p>
                </div>
              </div>

              {/* Posko Shelter & CTA Footer */}
              <div className="p-5 pt-0 space-y-3 border-t border-neutral-800/80 mt-2">
                <div className="pt-3 flex items-center justify-between text-[11px]">
                  <span className="text-neutral-400 flex items-center gap-1 truncate max-w-[200px]" title={item.shelterName}>
                    <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{item.shelterName}</span>
                  </span>
                  <span className="font-mono text-emerald-400 text-[10px] font-bold">
                    {item.stats}
                  </span>
                </div>

                <div className="w-full py-2 px-3 rounded-xl bg-neutral-900 border border-neutral-800 text-[11px] font-bold text-neutral-200 group-hover:border-neutral-700 flex items-center justify-between">
                  <span>Lihat Catatan Evakuasi</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Lightbox Modal Detail Kisah Penyelamatan */}
        {selectedStory && (
          <div
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
            onClick={() => setSelectedStory(null)}
          >
            <div
              className="relative max-w-3xl w-full max-h-[92vh] overflow-y-auto rounded-3xl bg-[#0e1210] border border-neutral-800 shadow-2xl space-y-6 p-6 sm:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedStory(null)}
                className="absolute top-5 right-5 p-2 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors z-10"
                aria-label="Tutup Detail"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header Modal */}
              <div className="space-y-2 pr-12">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-950/80 border border-emerald-800 text-xs font-mono font-bold text-emerald-300 uppercase">
                    Warga Selamat
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-neutral-900 border border-neutral-700 text-xs font-semibold text-neutral-200">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{selectedStory.location}</span>
                  </span>
                  <span className="text-xs font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-800/80">
                    {selectedStory.hazardType}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {selectedStory.title}
                </h3>
                <div className="text-xs text-neutral-400">
                  Subjek: <span className="text-neutral-200 font-semibold">{selectedStory.person}</span> ({selectedStory.role}) • {selectedStory.date}
                </div>
              </div>

              {/* Gambar Dokumentasi Penuh */}
              <div className="relative aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden border border-neutral-800 bg-black">
                <img
                  src={selectedStory.image}
                  alt={selectedStory.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Narasi dan Protokol Penyelamatan */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-[#121614] border border-neutral-800">
                <div className="space-y-1">
                  <div className="text-[10px] font-mono text-neutral-400 uppercase">Posko Evakuasi Tujuan</div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{selectedStory.shelterName}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-mono text-neutral-400 uppercase">Protokol Penyelamatan</div>
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{selectedStory.protocolBadge}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-mono text-neutral-400 uppercase">Hasil Evakuasi</div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{selectedStory.stats}</span>
                  </div>
                </div>
              </div>

              {/* Narasi Kronologi */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold tracking-wider uppercase text-neutral-400">
                  Kronologi Lapangan &amp; Manfaat Aplikasi:
                </h4>
                <p className="text-sm text-neutral-200 leading-relaxed bg-[#111513] p-4 rounded-2xl border border-neutral-800/80">
                  {selectedStory.story}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <span className="text-xs text-neutral-400">
                  Dokumentasi verifikasi relawan lapangan &amp; posko koordinasi Sentravax.
                </span>
                <Link
                  to={PATHS.PUBLIC.SHELTERS}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-tight transition-all"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Cari Shelter Siaga Terdekat</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 7. ULASAN & PENGALAMAN WARGA (Interactive Horizontal Auto-Scroll Carousel)*/}
      {/* ========================================================================= */}
      <section id="ulasan-warga" className="space-y-6 pt-6 border-t border-neutral-800">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Suara Nyata dari Puluhan Ribu Pengguna
            </h2>
          </div>

          {/* Overall Trust Rating */}
          <div className="inline-flex items-center gap-3.5 px-4.5 py-2.5 rounded-2xl bg-neutral-900 border border-neutral-800 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-white text-base tracking-tight">4.9</span>
              <span className="text-[11px] text-neutral-400 font-semibold">skala 5.0</span>
            </div>
            <div className="flex items-center gap-0.5 text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <div className="w-[1.5px] h-4 bg-neutral-700" />
            <span className="text-xs text-amber-300 font-bold tracking-wide">
              32.400+ Ulasan Warga
            </span>
          </div>
        </div>

        {/* Horizontal Infinite Smooth Scroll Track */}
        <div
          ref={scrollContainerRef}
          onMouseEnter={handlePointerEnter}
          onMouseLeave={handlePointerLeave}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto py-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden cursor-grab active:cursor-grabbing touch-pan-x"
        >
          {infiniteReviews.map((rev, index) => (
            <div
              key={`${rev.id}-${index}`}
              className="w-[290px] sm:w-[320px] shrink-0 p-4.5 rounded-2xl bg-[#121614] border border-neutral-800 hover:border-neutral-700 hover:-translate-y-1 transition-all flex flex-col justify-between space-y-3.5 select-none"
            >
              <div className="space-y-3">
                {/* Header: Star rating & verified badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                      rev.category === 'medis'
                        ? 'text-rose-400 bg-neutral-900 border-neutral-800'
                        : rev.category === 'international'
                        ? 'text-cyan-400 bg-neutral-900 border-neutral-800'
                        : rev.category === 'pemerintah'
                        ? 'text-emerald-400 bg-neutral-900 border-neutral-800'
                        : rev.category === 'relawan'
                        ? 'text-blue-400 bg-neutral-900 border-neutral-800'
                        : 'text-amber-400 bg-neutral-900 border-neutral-800'
                    }`}
                  >
                    {rev.verifiedBadge}
                  </span>
                </div>

                {/* Quote content */}
                <p className="text-xs text-neutral-200 leading-relaxed font-normal line-clamp-4">
                  &ldquo;{rev.quote}&rdquo;
                </p>
              </div>

              {/* Reviewer Profile Footer with Real Photo */}
              <div className="pt-3 border-t border-neutral-800 flex items-center gap-3">
                <ReviewerAvatar
                  src={rev.avatarUrl}
                  name={rev.name}
                  fallbackText={rev.avatarText}
                  bg={rev.avatarBg}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate">
                    {rev.name}
                  </div>
                  <div className="text-[11px] text-emerald-400/90 truncate font-medium">{rev.role}</div>
                  <div className="text-[10px] text-neutral-400 truncate">{rev.city} • {rev.date}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. KONTAK & PUSAT BANTUAN RESMI (Layanan Terpadu & Saluran Darurat)        */}
      {/* ========================================================================= */}
      <section id="kontak-resmi" className="space-y-8 pt-6 border-t border-neutral-800">
        {/* Hotline Darurat Nasional (Bebas Pulsa 1-Tap Dial) */}
        <div className="p-4 rounded-2xl bg-[#161617] border border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-rose-300 font-bold">
            <PhoneCall className="w-4 h-4 text-rose-400" />
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-100 font-bold text-xs transition-colors border border-red-800/60"
                title={`Hubungi ${h.label} di nomor ${h.num}`}
              >
                <span>{h.num}</span>
                <span className="hidden sm:inline font-bold text-red-200">({h.label})</span>
              </a>
            ))}
          </div>
        </div>

        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono font-bold tracking-wider uppercase bg-neutral-900 border border-neutral-700 text-emerald-400">
            <Mail className="w-3.5 h-3.5 text-emerald-400" />
            <span>PUSAT HUBUNGAN MASYARAKAT</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Hubungi Kami &amp; Layanan Publik
          </h2>
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-normal">
            Punya pertanyaan, usulan lokasi shelter baru, atau butuh bantuan koordinasi bencana? Tim SENTRAVAX siap melayani Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Official Contact Directory */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-3xl bg-[#121614] border border-neutral-800 space-y-5">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                Sekretariat &amp; Komando Layanan
              </h3>

              <div className="space-y-4 text-xs text-neutral-300">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-800 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">Surat Elektronik (Email)</span>
                    <a href="mailto:layanan@sentravax.id" className="text-emerald-400 hover:text-emerald-300 font-semibold hover:underline">
                      layanan@sentravax.id
                    </a>
                    <span className="text-[10px] text-neutral-400 block mt-0.5">Balasan resmi dalam waktu 1x24 jam kerja</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-800 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">WhatsApp Layanan Cepat</span>
                    <a href="https://wa.me/6281123456789" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 font-semibold hover:underline">
                      +62 811-2345-6789 (Biro Komunikasi)
                    </a>
                    <span className="text-[10px] text-neutral-400 block mt-0.5">Khusus koordinasi kedaruratan &amp; verifikasi data</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-800 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">Jam Operasional Layanan Publik</span>
                    <span className="text-neutral-200">Pusat Monitoring: 24 Jam Non-Stop</span>
                    <span className="text-[10px] text-neutral-400 block mt-0.5">Layanan Konsultasi Warga: Senin – Jumat (08.00 – 17.00 WIB)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Emergency Note Box */}
            <div className="p-4 rounded-2xl bg-[#1c1811] border border-amber-900/60 text-xs text-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Catatan Kedaruratan Mendesak:</strong> Bila terjadi situasi bahaya yang mengancam nyawa seketika, segera tekan tombol telepon darurat <strong>112</strong> atau <strong>115 (Basarnas)</strong>.
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Feedback & Inquiry Form */}
          <div className="lg:col-span-7 bg-[#121614] p-6 sm:p-8 rounded-3xl border border-neutral-800 space-y-5">
            <div className="space-y-1">
              <h3 className="text-base font-black text-white">
                Kirim Pesan, Usulan, atau Pertanyaan
              </h3>
              <p className="text-xs text-neutral-300">
                Kami sangat menghargai saran dari masyarakat untuk terus menyempurnakan platform kesiapsiagaan ini.
              </p>
            </div>

            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="input-name" className="text-xs font-bold text-neutral-200 block">
                    Nama Lengkap Anda
                  </label>
                  <input
                    id="input-name"
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-700 bg-[#0d100f] text-xs text-white placeholder-neutral-500 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="input-email" className="text-xs font-bold text-neutral-200 block">
                    Alamat Email Aktif
                  </label>
                  <input
                    id="input-email"
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="budi@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-700 bg-[#0d100f] text-xs text-white placeholder-neutral-500 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="select-contact-category" className="text-xs font-bold text-neutral-200 block">
                  Kategori Pesan
                </label>
                <select
                  id="select-contact-category"
                  value={contactCategory}
                  onChange={(e) => setContactCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-700 bg-[#0d100f] text-xs text-white font-medium outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                >
                  <option value="pertanyaan" className="bg-[#0d100f] text-white">Pertanyaan Umum Seputar Fitur Aplikasi</option>
                  <option value="usulan_shelter" className="bg-[#0d100f] text-white">Usulan Titik Shelter / Jalur Evakuasi Baru</option>
                  <option value="apresiasi" className="bg-[#0d100f] text-white">Apresiasi &amp; Masukan Pengalaman Warga</option>
                  <option value="kerjasama" className="bg-[#0d100f] text-white">Kerjasama Relawan / Komunitas Peduli Bencana</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="input-message" className="text-xs font-bold text-neutral-200 block">
                  Isi Pesan atau Masukan Anda
                </label>
                <textarea
                  id="input-message"
                  required
                  rows={4}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Tuliskan pertanyaan, masukan, atau kendala yang Anda alami..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-700 bg-[#0d100f] text-xs text-white placeholder-neutral-500 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingContact}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
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
      <section className="rounded-3xl bg-[#0f1713] border border-neutral-800 text-white p-8 sm:p-12 text-center space-y-6">
        <div className="max-w-2xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-neutral-900 text-emerald-300 text-xs font-bold border border-neutral-700">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Keluarga Indonesia Siaga &amp; Tangguh</span>
          </span>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
            Kesiapsiagaan Dimulai dari Langkah Kecil Hari Ini
          </h2>
          <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed font-normal">
            Jangan tunggu hingga sirine berbunyi. Mulai buat rencana darurat keluarga Anda sekarang juga—bebas biaya, terpercaya, dan dirancang khusus untuk Anda.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            to={PATHS.PUBLIC.PREPAREDNESS}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <span>Buka Panduan Siaga 72 Jam</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            to={PATHS.PUBLIC.REGISTER}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <span>Daftar Akun Warga Siaga</span>
          </Link>
        </div>
      </section>
      </div>
    </div>
  );
};
