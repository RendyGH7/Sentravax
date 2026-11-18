import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
import { publicService } from '../../services/public-service';
import type { EducationContentItem } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { 
  Search, 
  PhoneCall, 
  ShieldAlert, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Copy, 
  Printer, 
  Waves, 
  Activity, 
  Flame, 
  Wind,
  Layers,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

// Emergency speed dial hotlines
const EMERGENCY_HOTLINES = [
  { name: 'BNPB Bencana', number: '117', desc: 'Pusat Krisis' },
  { name: 'Basarnas SAR', number: '115', desc: 'Pencarian & Penyelamatan' },
  { name: 'Ambulans Kemenkes', number: '119', desc: 'Gawat Darurat Medis' },
  { name: 'Pemadam Kebakaran', number: '113', desc: 'Evakuasi & Damkar' },
  { name: 'Kepolisian RI', number: '110', desc: 'Keamanan & Ketertiban' },
];

// Fallback BNPB safety guides in case API returns minimal records
const FALLBACK_GUIDES: EducationContentItem[] = [
  {
    id: 101,
    title: 'Protokol Drop, Cover, Hold On Gempa Bumi',
    slug: 'protokol-gempa-bumi-drop-cover-hold',
    category: 'kesiapsiagaan',
    summary: 'Refleks penyelamatan diri efektif di dalam gedung, rumah, maupun area terbuka saat getaran seismik tektonik.',
    content_body: `## Sebelum Bencana
- Identifikasi area aman di setiap ruangan (di bawah meja kokoh, dekat pilar utama).
- Amankan lemari tinggi, bingkai foto, dan lampu gantung dengan baut penahan ke dinding.
- Siapkan Tas Siaga Bencana (Go-Bag) di dekat pintu keluar utama keluarga.

## Saat Bencana
- DROP: Rendahkan posisi tubuh berlutut agar tidak terjatuh saat lantai berguncang.
- COVER: Lindungi kepala dan leher di bawah meja kokoh atau menggunakan bantal/tas.
- HOLD ON: Pegang kaki meja erat-erat sampai guncangan benar-benar reda.
- Jangan gunakan lift dan jauhi jendela kaca atau fasad bangunan luar.

## Setelah Bencana
- Matikan sekering listrik utama dan cabut regulator tabung gas untuk mencegah kebakaran.
- Evakuasi keluar gedung tertib melalui tangga darurat menuju Titik Kumpul (Assembly Point).
- Pantau pembaruan info gempa susulan dan potensi tsunami dari BMKG via SENTRAVAX.`,
    is_published: true,
    sort_order: 1,
    hazard_type: {
      id: 4,
      slug: 'earthquake',
      name: 'Gempa Bumi',
      category: 'geological',
      description: 'Getaran seismik tektonik kerak bumi.',
      icon: 'activity',
      is_active: true,
    },
  },
  {
    id: 102,
    title: 'Mitigasi Banjir Luapan & Genangan Ekstrem',
    slug: 'mitigasi-banjir-luapan-ekstrem',
    category: 'mitigasi',
    summary: 'Langkah protektif aset dan evakuasi mandiri saat curah hujan intensif atau debit bendungan meluap.',
    content_body: `## Sebelum Bencana
- Simpan sertifikat, buku nikah, dan arsip legal dalam plastik zipper kedap air.
- Ketahui letak sakelar listrik utama (MCB) dan amankan stopkontak ke posisi tinggi.
- Ketahui rute posko pengungsian dan jalur evakuasi resmi terdekat di kelurahan.

## Saat Bencana
- Segera matikan aliran listrik dari meteran utama bila air mulai memasuki teras rumah.
- Bawa Go-Bag dan segera evakuasi ke tempat tinggi sebelum kedalaman air melampaui 30 cm.
- Hindari melintasi jalanan dengan arus deras (arus 15 cm mampu merobohkan manusia).

## Setelah Bencana
- Waspadai kabel listrik yang terendam atau hewan berbisa yang mencari tempat kering.
- Semprot lantai dan perabotan dengan cairan disinfektan sebelum dihuni kembali.`,
    is_published: true,
    sort_order: 2,
    hazard_type: {
      id: 1,
      slug: 'flood',
      name: 'Banjir & Luapan',
      category: 'hydrometeorological',
      description: 'Luapan sungai dan genangan air permukaan kawasan perkotaan.',
      icon: 'waves',
      is_active: true,
    },
  },
  {
    id: 103,
    title: 'Antisipasi Longsoran Lereng & Gerakan Tanah',
    slug: 'antisipasi-longsoran-lereng-tebing',
    category: 'kesiapsiagaan',
    summary: 'Tanda-tanda dini retakan tanah lereng dan tindakan evakuasi cepat masyarakat kawasan perbukitan.',
    content_body: `## Sebelum Bencana
- Jangan membangun rumah tepat di bawah tebing curam tanpa terasering dan dinding penahan.
- Periksa kemunculan retakan baru di tanah, fondasi miring, atau pohon yang condong.
- Jaga kelancaran drainase lereng agar air hujan tidak meresap berlebihan membebani tanah.

## Saat Bencana
- Bila mendengar gemuruh lereng atau air sungai mendadak keruh pekat bercampur lumpur, segera evakuasi menyamping (tegak lurus arah longsoran).
- Jangan berlari searah alur lembah longsoran.

## Setelah Bencana
- Jangan langsung mendekati area runtuhan tebing karena potensi longsor susulan masih sangat tinggi.
- Laporkan korban yang tertimbun ke pos komando BPBD atau Basarnas di 115.`,
    is_published: true,
    sort_order: 3,
    hazard_type: {
      id: 2,
      slug: 'landslide',
      name: 'Tanah Longsor',
      category: 'geological',
      description: 'Gerakan massa batuan dan tanah pada lereng kritis.',
      icon: 'mountain',
      is_active: true,
    },
  },
  {
    id: 104,
    title: 'Proteksi Diri Terhadap Cuaca Ekstrem & Angin Kencang',
    slug: 'proteksi-cuaca-ekstrem-angin-kencang',
    category: 'kesiapsiagaan',
    summary: 'Prosedur keselamatan menghadapi puting beliung, badai petir, dan pohon tumbang.',
    content_body: `## Sebelum Bencana
- Pangkas dahan pohon rimbun di dekat atap rumah dan amankan atap seng/asbes yang longgar.
- Cek saluran drainase dan hindari memarkir kendaraan tepat di bawah baliho atau pohon tua.

## Saat Bencana
- Segera berlindung di dalam bangunan permanen, jauhi dinding kaca dan pintu terbuka.
- Bila berada di luar saat badai petir, jangan berteduh di bawah pohon tunggal atau menara logam.
- Bila melihat pusaran angin puting beliung, cari ceruk rendah atau ruangan tengah tanpa jendela.

## Setelah Bencana
- Waspadai kawat listrik yang putus bergelantungan di jalanan.
- Bantu warga lansia atau rentan yang rumahnya mengalami kerusakan atap.`,
    is_published: true,
    sort_order: 4,
    hazard_type: {
      id: 3,
      slug: 'extreme-weather',
      name: 'Cuaca Ekstrem',
      category: 'hydrometeorological',
      description: 'Angin kencang, puting beliung, dan petir intensitas tinggi.',
      icon: 'wind',
      is_active: true,
    },
  },
];

export const PublicEducationPage: React.FC = () => {
  const [guides, setGuides] = useState<EducationContentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedHazard, setSelectedHazard] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [phaseFilter, setPhaseFilter] = useState<'all' | 'sebelum' | 'saat' | 'setelah'>('all');

  useEffect(() => {
    let isMounted = true;
    const fetchGuides = async () => {
      setLoading(true);
      try {
        const res = await publicService.getEducation({ per_page: 20 });
        if (!isMounted) return;
        const apiGuides = res?.data || [];
        // Merge API guides with fallback guides to provide rich multi-hazard catalog
        const combined = [...apiGuides];
        for (const fb of FALLBACK_GUIDES) {
          if (!combined.some(c => c.slug === fb.slug || c.title === fb.title)) {
            combined.push(fb);
          }
        }
        setGuides(combined);
      } catch {
        if (!isMounted) return;
        setGuides(FALLBACK_GUIDES);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchGuides();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered list
  const filteredGuides = useMemo(() => {
    return guides.filter((guide) => {
      // Hazard match
      const hazardSlug = guide.hazard_type?.slug?.toLowerCase() || '';
      const matchesHazard = selectedHazard === 'all' || hazardSlug.includes(selectedHazard.toLowerCase()) || guide.title.toLowerCase().includes(selectedHazard.toLowerCase());

      // Search query
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = !query || 
        guide.title.toLowerCase().includes(query) || 
        guide.summary.toLowerCase().includes(query) ||
        guide.content_body.toLowerCase().includes(query);

      return matchesHazard && matchesSearch;
    });
  }, [guides, selectedHazard, searchQuery]);

  const toggleExpand = (id: number) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const handleCopyGuide = (guide: EducationContentItem) => {
    const text = `${guide.title}\n\n${guide.summary}\n\n${guide.content_body}\n\nSumber: SENTRAVAX - Portal Mitigasi Multi-Hazard`;
    navigator.clipboard.writeText(text);
    toast.success('Panduan berhasil disalin ke clipboard');
  };

  const parseSections = (body: string) => {
    const sections: { title: string; content: string[] }[] = [];
    const lines = body.split('\n');
    let currentTitle = 'Panduan Utama';
    let currentLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith('## ') || line.startsWith('### ')) {
        if (currentLines.length > 0) {
          sections.push({ title: currentTitle, content: [...currentLines] });
          currentLines = [];
        }
        currentTitle = line.replace(/^#{2,3}\s+/, '').trim();
      } else if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
        currentLines.push(line.replace(/^[-*]\s+/, '').trim());
      } else if (line.trim().length > 0) {
        currentLines.push(line.trim());
      }
    }
    if (currentLines.length > 0) {
      sections.push({ title: currentTitle, content: currentLines });
    }
    return sections;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* 1. TOP EMERGENCY HOTLINE SPEED-DIAL BAR */}
      <section aria-label="Kontak Darurat Cepat" className="p-3.5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold shrink-0">
              <PhoneCall className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#111827] block">Panggilan Darurat Siaga (1-Klik):</span>
              <span className="text-[11px] text-[#6B7280]">Bebas pulsa nasional 24/7 untuk tanggap darurat</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {EMERGENCY_HOTLINES.map((h) => (
              <a
                key={h.number}
                href={`tel:${h.number}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-xs font-bold text-neutral-800 transition-colors"
                title={`${h.name} - ${h.desc}`}
              >
                <span className="text-red-600 font-mono font-extrabold">{h.number}</span>
                <span className="text-[11px] text-neutral-600 hidden sm:inline">{h.name.split(' ')[0]}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* 2. HEADER & SEARCH BAR */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="success" size="sm">SIAP SIAGA</Badge>
              <Badge variant="neutral" size="sm">STANDAR BNPB & BMKG</Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
              Pusat Edukasi & Mitigasi Multi-Hazard
            </h1>
            <p className="text-xs sm:text-sm text-[#4B5563]">
              Langkah terstruktur penyelamatan mandiri sebelum, saat, dan sesudah bencana melanda.
            </p>
          </div>

          {/* Quick Action to SIAGA PERSONAL & Shelters */}
          <div className="flex items-center gap-2 shrink-0">
            <Link to={PATHS.PUBLIC.PREPAREDNESS}>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold transition-all shadow-xs"
              >
                <span>Cek Risiko Lokasi</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
            <Link to={`${PATHS.PUBLIC.MAP}?layer=shelters`}>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-neutral-50 border border-neutral-300 text-[#111827] text-xs font-bold transition-all shadow-xs"
              >
                <span>Lokasi Shelter</span>
              </button>
            </Link>
          </div>
        </div>

        {/* 3. TOOLBAR: SEARCH & HAZARD SELECTOR CHIPS */}
        <div className="space-y-3 p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Instant Search Bar */}
            <div className="md:col-span-8 relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari panduan keselamatan (contoh: gempa, listrik, tas siaga, banjir)..."
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-neutral-300 focus:border-[#047857] focus:ring-1 focus:ring-[#047857] outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-700"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Quick Phase Filter Pills */}
            <div className="md:col-span-4 flex items-center justify-end gap-1.5">
              {(['all', 'sebelum', 'saat', 'setelah'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPhaseFilter(p)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                    phaseFilter === p
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                  }`}
                >
                  {p === 'all' ? 'Semua Fase' : p}
                </button>
              ))}
            </div>
          </div>

          {/* Hazard Type Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none text-xs">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider shrink-0 mr-1">
              Bahaya:
            </span>
            {[
              { id: 'all', label: 'Semua Kategori', icon: Layers },
              { id: 'earthquake', label: 'Gempa Bumi', icon: Activity },
              { id: 'flood', label: 'Banjir & Genangan', icon: Waves },
              { id: 'landslide', label: 'Tanah Longsor', icon: ShieldAlert },
              { id: 'extreme-weather', label: 'Cuaca Ekstrem', icon: Wind },
              { id: 'fire', label: 'Kebakaran', icon: Flame },
            ].map((h) => {
              const IconComp = h.icon;
              const isSelected = selectedHazard === h.id;
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setSelectedHazard(h.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-[#047857] text-white shadow-xs'
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{h.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. GUIDES LIST */}
      <section className="space-y-4">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-44 rounded-2xl bg-white border border-neutral-200 animate-pulse p-5"></div>
            ))}
          </div>
        ) : filteredGuides.length === 0 ? (
          <EmptyState
            title="Tidak Ada Panduan Sesuai Pencarian"
            description="Coba ubah kata kunci pencarian atau pilih kategori bahaya lainnya."
            className="py-12 bg-white rounded-2xl border border-neutral-200"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {filteredGuides.map((guide) => {
              const isExpanded = expandedId === guide.id;
              const sections = parseSections(guide.content_body);
              const displaySections = phaseFilter === 'all' 
                ? sections 
                : sections.filter(s => s.title.toLowerCase().includes(phaseFilter));

              return (
                <Card 
                  key={guide.id} 
                  padding="md" 
                  className={`border transition-all ${
                    isExpanded ? 'border-[#047857] ring-1 ring-[#047857]/30 shadow-sm' : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Row: Badges & Controls */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="success" size="sm">
                          {guide.hazard_type?.name || 'Multi-Hazard'}
                        </Badge>
                        <Badge variant="neutral" size="sm">
                          {guide.category.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleCopyGuide(guide)}
                          title="Salin Panduan"
                          aria-label="Salin Panduan"
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => window.print()}
                          title="Cetak Panduan"
                          aria-label="Cetak Panduan"
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Title & Summary */}
                    <div>
                      <h2 className="text-base font-bold text-[#111827] leading-snug">
                        {guide.title}
                      </h2>
                      <p className="text-xs text-[#4B5563] mt-1 leading-relaxed">
                        {guide.summary}
                      </p>
                    </div>

                    {/* Collapsible Action Checklist */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-neutral-100 space-y-3">
                        {displaySections.map((sec, idx) => (
                          <div key={idx} className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
                            <h3 className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#047857]" />
                              <span>{sec.title}</span>
                            </h3>
                            <ul className="space-y-1.5 text-xs text-neutral-700">
                              {sec.content.map((c, cIdx) => (
                                <li key={cIdx} className="flex items-start gap-2 leading-relaxed">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#047857] shrink-0 mt-1.5" />
                                  <span>{c}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Bottom Action Footer */}
                    <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                      <span className="text-[11px] text-neutral-500 font-mono">
                        Standar BNPB 2026
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleExpand(guide.id)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#047857] hover:text-[#065F46] transition-colors"
                      >
                        <span>{isExpanded ? 'Tutup Detail' : 'Buka Tindakan Lengkap'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
