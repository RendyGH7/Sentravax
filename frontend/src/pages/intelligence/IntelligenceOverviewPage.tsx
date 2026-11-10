import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
import { 
  Layers, 
  Play, 
  Pause, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp,
  BrainCircuit
} from 'lucide-react';
import { toast } from 'sonner';

export const IntelligenceOverviewPage: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [simStep, setSimStep] = useState(3);
  const [activeHazard, setActiveHazard] = useState('flood');

  const simSteps = [
    { label: '+1 Jam', time: '14.00 WIB' },
    { label: '+3 Jam', time: '16.00 WIB' },
    { label: '+6 Jam', time: '19.00 WIB' },
    { label: '+12 Jam', time: '01.00 WIB' },
    { label: '+24 Jam', time: '13.00 WIB (Puncak)' },
  ];

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
    toast.info(isPlaying ? 'Simulasi dihentikan.' : 'Menjalankan simulasi eskalasi risiko multi-hazard.');
  };

  const handleResetSim = () => {
    setSimStep(0);
    setIsPlaying(false);
    toast.info('Simulasi diatur ulang ke kondisi t0.');
  };

  return (
    <div className="space-y-6">
      {/* Top Threat Ticker & Quick Controls (Grey & Black with Gold Accent - ZERO BLUE) */}
      <div className="p-6 rounded-2xl bg-[#161616] border border-[#2C2C2C] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse"></span>
            <span className="text-xs font-mono uppercase text-[#10B981] font-bold">
              Kondisi Intelijen: Siaga Hidrometeorologi Musiman
            </span>
            <span className="text-xs text-[#8A8A8A] font-mono">| Sumber: BMKG Radar & Sentinel-1</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#FFFFFF] tracking-tight">
            Pusat Komando dan Analisis Multi-Hazard Nasional
          </h1>
          <p className="text-xs sm:text-sm text-[#D4D4D4]">
            Korelasikan data spasial radar, elevasi medan, dan kepadatan populasi untuk menghitung proyeksi dampak sebelum bencana terjadi.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start lg:self-auto">
          <Link
            to={PATHS.INTELLIGENCE.ALERT_OPERATIONS}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#0C0C0C] text-xs font-bold transition-all shadow-xs"
          >
            <AlertTriangle className="w-4 h-4 text-[#0C0C0C]" />
            <span>Diseminasi Peringatan CAP</span>
          </Link>
        </div>
      </div>

      {/* Main Simulation Viewport (Neutral Grey & Black, ZERO BLUE) */}
      <div className="rounded-2xl bg-[#161616] border border-[#2C2C2C] shadow-sm overflow-hidden space-y-4 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2C2C2C] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono uppercase bg-[#212121] text-[#F59E0B] border border-amber-500/30 font-bold">
                SIMULASI MULTI-HAZARD
              </span>
              <span className="text-xs font-mono text-[#10B981] flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> DATA AKTIF FRESH (5 menit lalu)
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#FFFFFF] mt-1.5">
              Simulasi Proyeksi Genangan dan Bahaya Spasial
            </h2>
          </div>

          {/* Hazard Selector Tabs (Neutral Grey & Amber - ZERO BLUE) */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-[#212121] border border-[#2C2C2C] text-xs">
            {[
              { id: 'flood', label: 'Banjir Luapan' },
              { id: 'landslide', label: 'Tanah Longsor' },
              { id: 'coastal', label: 'Rob Pesisir' },
            ].map((hz) => (
              <button
                key={hz.id}
                type="button"
                onClick={() => setActiveHazard(hz.id)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activeHazard === hz.id
                    ? 'bg-[#F59E0B] text-[#0C0C0C] shadow-xs'
                    : 'text-[#8A8A8A] hover:text-[#FFFFFF]'
                }`}
              >
                {hz.label}
              </button>
            ))}
          </div>
        </div>

        {/* Analytics Grid in Simulation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Key Hazard Statistics */}
          <div className="lg:col-span-4 space-y-3.5">
            <div className="p-4 sm:p-5 rounded-2xl bg-[#212121] border border-[#2C2C2C] space-y-2 shadow-xs">
              <span className="text-xs font-mono uppercase text-[#8A8A8A] font-semibold">Estimasi Populasi Terpapar</span>
              <div className="text-3xl font-extrabold text-[#FFFFFF] font-mono">42.150 Jiwa</div>
              <p className="text-xs text-[#F59E0B] flex items-center gap-1 font-semibold font-mono">
                <TrendingUp className="w-3.5 h-3.5" /> Bertambah pada langkah simulasi +12 Jam
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-[#212121] border border-[#2C2C2C] space-y-2 shadow-xs">
              <span className="text-xs font-mono uppercase text-[#8A8A8A] font-semibold">Fasilitas Kritis dalam Radius</span>
              <div className="text-3xl font-extrabold text-[#FFFFFF] font-mono">8 Titik</div>
              <p className="text-xs text-[#D4D4D4]">
                2 Rumah Sakit Umum, 6 Fasilitas Sekolah Dasar
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-[#212121] border border-[#2C2C2C] space-y-2 shadow-xs">
              <span className="text-xs font-mono uppercase text-[#8A8A8A] font-semibold">Status Debit Aliran Sungai</span>
              <div className="text-2xl font-extrabold text-[#F59E0B] font-mono">SIAGA 2 (480 m³/detik)</div>
              <p className="text-xs text-[#D4D4D4]">
                Ambang batas kritis: 550 m³/detik
              </p>
            </div>
          </div>

          {/* Right: Map Simulation Preview Canvas & Scrubber */}
          <div className="lg:col-span-8 space-y-4">
            <div className="h-64 sm:h-80 rounded-2xl bg-[#212121] border border-[#2C2C2C] p-6 flex flex-col justify-between relative overflow-hidden shadow-inner">
              <div className="flex items-center justify-between text-xs font-mono text-[#8A8A8A] font-semibold">
                <span>LAYER: DEM 5M + POSTGIS FLOOD POLYGON</span>
                <span className="text-[#F59E0B]">ZONASI: DAS CILIWUNG HILIR</span>
              </div>

              {/* Map Schematic Representation */}
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white mx-auto shadow-xs">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-[#FFFFFF]">
                  Visualisasi Spasial Dinamis (PostGIS Vector Tiles)
                </h3>
                <p className="text-xs text-[#D4D4D4] max-w-md mx-auto">
                  Poligon bahaya terhitung secara geospasial berdasarkan skenario curah hujan harian BMKG.
                </p>
              </div>

              {/* Scrubber Playback Controls (Amber & Grey - ZERO BLUE) */}
              <div className="p-3.5 rounded-xl bg-[#161616] border border-[#2C2C2C] flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTogglePlay}
                    className="w-9 h-9 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#0C0C0C] flex items-center justify-center font-bold shadow-xs transition-colors"
                    aria-label={isPlaying ? 'Hentikan simulasi' : 'Jalankan simulasi'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleResetSim}
                    className="p-2 rounded-xl bg-[#212121] hover:bg-[#2B2B2B] text-[#D4D4D4] hover:text-[#FFFFFF] border border-[#2C2C2C] transition-colors"
                    aria-label="Reset simulasi"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Timeline step indicators */}
                <div className="flex items-center gap-2 flex-1 justify-end overflow-x-auto text-xs font-mono">
                  {simSteps.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSimStep(idx)}
                      className={`px-3 py-1.5 rounded-lg border transition-all ${
                        simStep === idx
                          ? 'bg-[#F59E0B] text-[#0C0C0C] border-amber-400 font-bold shadow-xs'
                          : 'bg-[#212121] text-[#8A8A8A] border-[#2C2C2C] hover:text-[#FFFFFF] hover:border-[#383838]'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Proactive Insight Preview Snippet (Gold / Emerald Accent - ZERO BLUE) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#161616] border border-[#2C2C2C] flex items-start gap-3.5 shadow-xs">
              <BrainCircuit className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <span className="font-bold text-[#FFFFFF] block text-sm">Rekomendasi AI Proaktif (Tingkat Keyakinan 92%):</span>
                <p className="text-[#D4D4D4] leading-relaxed">
                  Berdasarkan laju kenaikan muka air 12 cm/jam dan konvergensi angin monsun barat laut, disarankan mengaktifkan pintu air sodetan dan menyiagakan posko di 2 kelurahan hilir sebelum pukul 18.00 WIB.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
