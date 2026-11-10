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
      {/* Top Threat Ticker & Quick Controls */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#191919] border border-[#343434] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#70A987]"></span>
            <span className="text-xs font-mono uppercase text-[#70A987] font-semibold">
              Kondisi Intelijen: Siaga Hidrometeorologi Musiman
            </span>
            <span className="text-xs text-[#929292] font-mono">| Sumber: BMKG Radar & Sentinel-1</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F2F2F2] tracking-tight">
            Pusat Komando dan Analisis Multi-Hazard Nasional
          </h1>
          <p className="text-xs sm:text-sm text-[#B8B8B8]">
            Korelasikan data spasial radar, elevasi medan, dan kepadatan populasi untuk menghitung proyeksi dampak sebelum bencana terjadi.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start lg:self-auto">
          <Link
            to={PATHS.INTELLIGENCE.ALERT_OPERATIONS}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#A9C2D1] hover:bg-[#C0D2DC] text-[#111111] text-xs font-semibold transition-colors"
          >
            <AlertTriangle className="w-4 h-4 text-[#8A5A13]" />
            <span>Diseminasi Peringatan CAP</span>
          </Link>
        </div>
      </div>

      {/* Main Simulation Viewport (Modeled after Reference 2: Harris County Flood Hazard Analytics) */}
      <div className="rounded-2xl bg-[#191919] border border-[#343434] overflow-hidden space-y-4 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#343434] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#283139] text-[#A9C2D1] border border-[#3A4550]">
                SIMULASI MULTI-HAZARD
              </span>
              <span className="text-xs font-mono text-[#70A987] flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> DATA AKTIF FRESH (5 menit lalu)
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#F2F2F2] mt-1">
              Simulasi Proyeksi Genangan dan Bahaya Spasial
            </h2>
          </div>

          {/* Hazard Selector Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#222222] border border-[#343434] text-xs">
            {[
              { id: 'flood', label: 'Banjir Luapan' },
              { id: 'landslide', label: 'Tanah Longsor' },
              { id: 'coastal', label: 'Rob Pesisir' },
            ].map((hz) => (
              <button
                key={hz.id}
                type="button"
                onClick={() => setActiveHazard(hz.id)}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  activeHazard === hz.id
                    ? 'bg-[#A9C2D1] text-[#111111] font-semibold'
                    : 'text-[#B8B8B8] hover:text-[#F2F2F2]'
                }`}
              >
                {hz.label}
              </button>
            ))}
          </div>
        </div>

        {/* Analytics Grid in Simulation (Based on Harris County Layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Key Hazard Statistics */}
          <div className="lg:col-span-4 space-y-3">
            <div className="p-4 rounded-xl bg-[#222222] border border-[#343434] space-y-2">
              <span className="text-xs font-mono uppercase text-[#929292]">Estimasi Populasi Terpapar</span>
              <div className="text-2xl font-bold text-[#F2F2F2] font-mono">42.150 Jiwa</div>
              <p className="text-[11px] text-[#D2A45E] flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Bertambah pada langkah simulasi +12 Jam
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#222222] border border-[#343434] space-y-2">
              <span className="text-xs font-mono uppercase text-[#929292]">Fasilitas Kritis dalam Radius</span>
              <div className="text-2xl font-bold text-[#F2F2F2] font-mono">8 Titik</div>
              <p className="text-[11px] text-[#B8B8B8]">
                2 Rumah Sakit Umum, 6 Fasilitas Sekolah Dasar
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#222222] border border-[#343434] space-y-2">
              <span className="text-xs font-mono uppercase text-[#929292]">Status Debit Aliran Sungai</span>
              <div className="text-xl font-bold text-[#D2A45E] font-mono">SIAGA 2 (480 m³/detik)</div>
              <p className="text-[11px] text-[#B8B8B8]">
                Ambang batas kritis: 550 m³/detik
              </p>
            </div>
          </div>

          {/* Right: Map Simulation Preview Canvas & Scrubber */}
          <div className="lg:col-span-8 space-y-4">
            <div className="h-64 sm:h-80 rounded-xl bg-[#151515] border border-[#343434] p-6 flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between text-xs font-mono text-[#929292]">
                <span>LAYER: DEM 5M + POSTGIS FLOOD POLYGON</span>
                <span className="text-[#A9C2D1]">ZONASI: DAS CILIWUNG HILIR</span>
              </div>

              {/* Map Schematic Representation */}
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-xl bg-[#283139] border border-[#3A4550] flex items-center justify-center text-[#A9C2D1] mx-auto">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-[#F2F2F2]">
                  Visualisasi Spasial Dinamis (PostGIS Vector Tiles)
                </h3>
                <p className="text-xs text-[#B8B8B8] max-w-md mx-auto">
                  Poligon bahaya terhitung secara geospasial berdasarkan skenario curah hujan harian BMKG.
                </p>
              </div>

              {/* Scrubber Playback Controls (From Reference 2) */}
              <div className="p-3 rounded-lg bg-[#222222] border border-[#343434] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTogglePlay}
                    className="w-8 h-8 rounded-lg bg-[#A9C2D1] hover:bg-[#C0D2DC] text-[#111111] flex items-center justify-center font-bold"
                    aria-label={isPlaying ? 'Hentikan simulasi' : 'Jalankan simulasi'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleResetSim}
                    className="p-2 rounded-lg bg-[#191919] hover:bg-[#2A2A2A] text-[#B8B8B8] hover:text-[#F2F2F2] border border-[#343434]"
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
                      className={`px-2.5 py-1 rounded border transition-colors ${
                        simStep === idx
                          ? 'bg-[#283139] text-[#A9C2D1] border-[#3A4550] font-semibold'
                          : 'bg-[#191919] text-[#929292] border-[#343434] hover:text-[#F2F2F2]'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Proactive Insight Preview Snippet */}
            <div className="p-4 rounded-xl bg-[#151515] border border-[#343434] flex items-start gap-3">
              <BrainCircuit className="w-5 h-5 text-[#A9C2D1] shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <span className="font-semibold text-[#F2F2F2] block">Rekomendasi AI Proaktif (Tingkat Keyakinan 92%):</span>
                <p className="text-[#B8B8B8] leading-relaxed">
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
