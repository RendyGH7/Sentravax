import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { PATHS } from '../../app/router/paths';
import { publicService } from '../../services/public-service';
import type { EducationContentItem } from '../../types';
import { EmptyState } from '../../components/ui/EmptyState';
import { EmergencyHotlineStrip } from '../../components/shared/EmergencyHotlineStrip';
import {
  Search,
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
  ArrowRight,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

const formatPublishedDate = (isoDate?: string | null): string | null => {
  if (!isoDate) return null;
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const PublicEducationPage: React.FC = () => {
  const [guides, setGuides] = useState<EducationContentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedHazard, setSelectedHazard] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [phaseFilter, setPhaseFilter] = useState<'all' | 'sebelum' | 'saat' | 'setelah'>('all');

  const fetchGuides = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await publicService.getEducation({ per_page: 20 });
      const apiGuides = Array.isArray(res?.data) ? res.data : [];
      const publishedGuides = apiGuides.filter((item) => item.is_published !== false);
      setGuides(publishedGuides);
    } catch {
      setGuides([]);
      setError('Gagal memuat panduan edukasi dari server. Periksa koneksi Anda lalu coba lagi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchGuides();
    });
  }, [fetchGuides]);

  // Filtered list
  const filteredGuides = useMemo(() => {
    return guides.filter((guide) => {
      // Hazard match
      const hazardSlug = guide.hazard_type?.slug?.toLowerCase() || '';
      const matchesHazard = selectedHazard === 'all' || hazardSlug.includes(selectedHazard.toLowerCase()) || guide.title.toLowerCase().includes(selectedHazard.toLowerCase());

      // Search query
      const query = searchQuery.trim().toLowerCase();
      const summaryText = (guide.summary ?? '').toLowerCase();
      const bodyText = (guide.content_body ?? '').toLowerCase();
      const matchesSearch =
        !query ||
        guide.title.toLowerCase().includes(query) ||
        summaryText.includes(query) ||
        bodyText.includes(query);

      return matchesHazard && matchesSearch;
    });
  }, [guides, selectedHazard, searchQuery]);

  const toggleExpand = (id: number) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const handleCopyGuide = (guide: EducationContentItem) => {
    const summaryText = guide.summary ? `${guide.summary}\n\n` : '';
    const publishedLabel = formatPublishedDate(guide.published_at);
    const metaFooter = publishedLabel
      ? `Dipublikasikan: ${publishedLabel} (SENTRAVAX)`
      : 'Materi Edukasi SENTRAVAX (Sumber eksternal tidak tercantum)';
    const text = `${guide.title}\n\n${summaryText}${guide.content_body ?? ''}\n\n${metaFooter}`;
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
    <div className="space-y-6 max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8 text-neutral-100">
      {/* 1. TOP EMERGENCY HOTLINE SPEED-DIAL BAR */}
      <EmergencyHotlineStrip
        variant="bar"
        theme="dark"
        title="Panggilan Darurat Siaga (1-Klik):"
        subtitle="Kontak darurat nasional terverifikasi resmi"
      />

      {/* 2. HEADER & SEARCH BAR */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Pusat Edukasi & Mitigasi Multi-Hazard
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400">
              Langkah terstruktur penyelamatan mandiri sebelum, saat, dan sesudah bencana melanda.
            </p>
          </div>

          {/* Quick Action to SIAGA PERSONAL & Shelters */}
          <div className="flex items-center gap-2 shrink-0">
            <Link to={PATHS.PUBLIC.PREPAREDNESS}>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-xs"
              >
                <span>Cek Risiko Lokasi</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
            <Link to={`${PATHS.PUBLIC.MAP}?layer=shelters`}>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-bold transition-all shadow-xs"
              >
                <span>Lokasi Shelter</span>
              </button>
            </Link>
          </div>
        </div>

        {/* 3. TOOLBAR: SEARCH & HAZARD SELECTOR CHIPS */}
        <div className="space-y-3 p-4 rounded-2xl bg-[#121614] border border-neutral-800 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Instant Search Bar */}
            <div className="md:col-span-8 relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari panduan keselamatan (contoh: gempa, listrik, tas siaga, banjir)..."
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-neutral-700 bg-[#0a0c0b] text-white placeholder:text-neutral-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/40 outline-none transition-colors"
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
                      ? 'bg-rose-700 text-white'
                      : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
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
                      ? 'bg-[#BE123C] text-white shadow-xs'
                      : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
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
              <div key={i} className="h-44 rounded-2xl bg-[#121614] border border-neutral-800 animate-pulse p-5"></div>
            ))}
          </div>
        ) : error ? (
          <div
            role="alert"
            className="p-8 rounded-2xl bg-[#121614] border border-rose-900/60 text-center space-y-4"
          >
            <div className="w-11 h-11 rounded-2xl bg-rose-950/80 border border-rose-800/60 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h2 className="text-base font-bold text-white">Panduan Edukasi Tidak Dapat Dimuat</h2>
              <p className="text-xs text-neutral-400 leading-relaxed">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => void fetchGuides()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Coba Lagi</span>
            </button>
          </div>
        ) : guides.length === 0 ? (
          <EmptyState
            title="Belum Ada Panduan Edukasi Terpublikasi"
            description="Saat ini belum ada materi edukasi mitigasi yang dipublikasikan oleh server."
            className="py-12 bg-[#121614] rounded-2xl border border-neutral-800 text-neutral-300"
            action={{
              label: 'Muat Ulang',
              onClick: () => void fetchGuides(),
              variant: 'secondary',
              icon: <RefreshCw className="w-3.5 h-3.5" />,
            }}
          />
        ) : filteredGuides.length === 0 ? (
          <EmptyState
            title="Tidak Ada Panduan Sesuai Pencarian"
            description="Coba ubah kata kunci pencarian atau pilih kategori bahaya lainnya."
            className="py-12 bg-[#121614] rounded-2xl border border-neutral-800 text-neutral-300"
            action={{
              label: 'Reset Filter',
              onClick: () => {
                setSearchQuery('');
                setSelectedHazard('all');
                setPhaseFilter('all');
              },
              variant: 'secondary',
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {filteredGuides.map((guide, idx) => {
              const isExpanded = expandedId === guide.id;
              const sections = parseSections(guide.content_body ?? '');
              const displaySections =
                phaseFilter === 'all'
                  ? sections
                  : sections.filter((s) => s.title.toLowerCase().includes(phaseFilter));
              const publishedDate = formatPublishedDate(guide.published_at);

              return (
                <motion.div
                  key={guide.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1], delay: (idx % 2) * 0.08 }}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  className={`p-5 rounded-2xl bg-[#121614] border transition-colors ${isExpanded ? "border-rose-500 ring-1 ring-rose-500/30" : "border-neutral-800 hover:border-rose-500/40"}`}
                >
                  <div className="space-y-3">
                    {/* Top Row: Badges & Controls */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-rose-950/80 text-rose-300 border border-rose-800/60">{guide.hazard_type?.name || "Multi-Hazard"}</span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-neutral-900 text-neutral-300 border border-neutral-700">{guide.category.toUpperCase()}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleCopyGuide(guide)}
                          title="Salin Panduan"
                          aria-label="Salin Panduan"
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => window.print()}
                          title="Cetak Panduan"
                          aria-label="Cetak Panduan"
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Title & Summary */}
                    <div>
                      <h2 className="text-base font-bold text-white leading-snug">
                        {guide.title}
                      </h2>
                      {guide.summary && (
                        <p className="text-xs text-neutral-300 mt-1 leading-relaxed font-normal">
                          {guide.summary}
                        </p>
                      )}
                    </div>

                    {/* Collapsible Action Checklist */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-neutral-800 space-y-3">
                        {displaySections.length === 0 ? (
                          <p className="text-xs text-neutral-400 italic">
                            Tidak ada bagian yang cocok dengan filter fase ini.
                          </p>
                        ) : (
                          displaySections.map((sec, sIdx) => (
                            <div key={sIdx} className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
                              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#BE123C]" />
                                <span>{sec.title}</span>
                              </h3>
                              <ul className="space-y-1.5 text-xs text-neutral-300">
                                {sec.content.map((c, cIdx) => (
                                  <li key={cIdx} className="flex items-start gap-2 leading-relaxed">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5" />
                                    <span>{c}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* Bottom Action Footer */}
                    <div className="pt-2 border-t border-neutral-800 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-neutral-500 font-mono">
                        {publishedDate
                          ? `Terbit ${publishedDate} • Sumber eksternal tidak tercantum`
                          : 'Materi Edukasi • Sumber eksternal tidak tercantum'}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleExpand(guide.id)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors shrink-0"
                      >
                        <span>{isExpanded ? 'Tutup Detail' : 'Buka Tindakan Lengkap'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
