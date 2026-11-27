import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { PATHS } from '../../app/router/paths';
import { publicService } from '../../services/public-service';
import { ScrollWordTitle } from '../../components/shared/ScrollWordTitle';
import type { ShelterItem, ShelterDetail, FacilityType } from '../../types/shelter';
import {
  Home,
  Search,
  MapPin,
  Users,
  ShieldCheck,
  RefreshCw,
  Phone,
  Compass,
  Accessibility,
  Eye,
  X,
  Map as MapIcon,
} from 'lucide-react';
import { toast } from 'sonner';

export const PublicSheltersPage: React.FC = () => {
  const [shelters, setShelters] = useState<ShelterItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [facilityTypeFilter, setFacilityTypeFilter] = useState<string>('all');
  const [accessibilityOnly, setAccessibilityOnly] = useState<boolean>(false);
  const [selectedShelter, setSelectedShelter] = useState<ShelterDetail | null>(null);

  const loadShelters = useCallback(async () => {
    try {
      setLoading(true);
      const res = await publicService.getShelters({
        facility_type: facilityTypeFilter === 'all' ? undefined : (facilityTypeFilter as FacilityType),
        wheelchair_accessible: accessibilityOnly ? true : undefined,
        per_page: 50,
      });
      setShelters(res.data || []);
    } catch (err: any) {
      console.error('Failed to load public shelters:', err);
      toast.error('Gagal memuat direktori shelter terverifikasi.');
    } finally {
      setLoading(false);
    }
  }, [facilityTypeFilter, accessibilityOnly]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadShelters();
    });
  }, [loadShelters]);

  const filteredShelters = useMemo(() => {
    if (!searchTerm.trim()) return shelters;
    const term = searchTerm.toLowerCase();
    return shelters.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.address?.toLowerCase().includes(term) ||
        s.verified_by_agency?.toLowerCase().includes(term) ||
        s.evacuation_route_info?.route_code?.toLowerCase().includes(term) ||
        s.evacuation_route_info?.corridor_name?.toLowerCase().includes(term)
    );
  }, [shelters, searchTerm]);

  const handleOpenDetail = async (id: number) => {
    try {
      const detail = await publicService.getShelterDetail(id);
      setSelectedShelter(detail);
    } catch (err: any) {
      console.error('Failed to fetch shelter detail:', err);
      toast.error('Gagal memuat rincian shelter.');
    }
  };

  const getFacilityTypeLabel = (type: string) => {
    switch (type) {
      case 'assembly_point':
        return 'Titik Kumpul Lapangan';
      case 'community_hall':
        return 'Balai Warga / Aula';
      case 'stadium':
        return 'Stadion Olahraga';
      case 'school':
        return 'Gedung Sekolah / Kampus';
      case 'health_facility':
        return 'Fasilitas Kesehatan';
      case 'government_office':
        return 'Kantor Pemerintah';
      case 'tent_camp':
        return 'Tenda Pengungsian BPBD';
      default:
        return 'Shelter Penampungan';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800/60">
            BEROPERASI (OPEN)
          </span>
        );
      case 'standby':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-950/80 text-sky-300 border border-sky-800/60">
            SIAP SIAGA (STANDBY)
          </span>
        );
      case 'full':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800/60">
            KAPASITAS PENUH (FULL)
          </span>
        );
      case 'closed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-neutral-900 text-neutral-400 border border-neutral-800">
            DITUTUP (CLOSED)
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-neutral-900 text-neutral-400 border border-neutral-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-6 text-neutral-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <ScrollWordTitle
              as="h1"
              className="text-xl sm:text-2xl font-black text-white tracking-tight"
            >
              Direktori Shelter &amp; Titik Kumpul Evakuasi
            </ScrollWordTitle>
            <span className="text-[11px] font-mono font-bold px-3 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800/60">
              Terverifikasi BPBD / BNPB
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-normal">
            Lokasi penampungan sementara resmi yang memenuhi standar keselamatan, sanitasi air bersih, dan aksesibilitas lansia.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            to={PATHS.PUBLIC.MAP}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold transition-colors shadow-xs"
          >
            <MapIcon className="w-4 h-4" />
            <span>Buka di Peta Multi-Hazard</span>
          </Link>
          <button
            type="button"
            onClick={loadShelters}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors border border-neutral-700"
            title="Muat ulang"
            aria-label="Muat ulang"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Info Notice: Zero Fake Shelters */}
      <div className="p-4 rounded-2xl bg-[#121614] border border-neutral-800 text-xs text-neutral-200 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold block text-sm text-white">Jaminan Integritas Tempat Evakuasi</span>
          <p className="text-neutral-300 leading-relaxed font-normal">
            Semua shelter yang tercantum di halaman ini telah melalui verifikasi faktual lapangan oleh BPBD/Dinsos setempat dan dilengkapi kode koridor evakuasi terkoordinasi. Titik kumpul liar atau usulan warga yang belum diverifikasi tidak akan ditampilkan untuk mencegah risiko keselamatan.
          </p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#121614] border border-neutral-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama shelter, alamat, rute..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-neutral-700 bg-neutral-900 text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 transition-colors"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={facilityTypeFilter}
            onChange={(e) => setFacilityTypeFilter(e.target.value)}
            className="text-xs rounded-xl border border-neutral-700 py-1.5 px-3 bg-neutral-900 text-neutral-100 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 transition-colors"
          >
            <option value="all">Semua Jenis Fasilitas</option>
            <option value="assembly_point">Titik Kumpul Lapangan</option>
            <option value="community_hall">Balai Warga / Aula</option>
            <option value="stadium">Stadion Olahraga</option>
            <option value="school">Gedung Sekolah / Kampus</option>
            <option value="government_office">Kantor Pemerintah</option>
            <option value="health_facility">Fasilitas Kesehatan</option>
          </select>

          <button
            type="button"
            onClick={() => setAccessibilityOnly((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              accessibilityOnly
                ? 'bg-rose-950/80 text-rose-300 border-rose-800/60 font-bold'
                : 'bg-neutral-900 text-neutral-300 border-neutral-700 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            <Accessibility className="w-3.5 h-3.5" />
            <span>Ramah Difabel &amp; Lansia</span>
          </button>
        </div>
      </div>

      {/* Shelters Grid Cards */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 bg-[#121614] rounded-2xl border border-neutral-800">
          <RefreshCw className="w-6 h-6 animate-spin text-rose-400" />
          <p className="text-xs text-neutral-400">Memuat direktori shelter terverifikasi...</p>
        </div>
      ) : filteredShelters.length === 0 ? (
        <div className="p-16 text-center space-y-2 bg-[#121614] rounded-2xl border border-neutral-800">
          <Home className="w-8 h-8 text-neutral-600 mx-auto" />
          <p className="text-sm font-bold text-white">Tidak Ada Shelter Ditemukan</p>
          <p className="text-xs text-neutral-400">Sesuaikan kata kunci pencarian atau filter Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredShelters.map((shelter, idx) => {
            const totalCapacity = shelter.capacity || 100;
            const occupancyPct = Math.min(100, Math.round((shelter.current_occupancy / totalCapacity) * 100));

            return (
              <motion.div
                key={shelter.id}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.45, delay: (idx % 3) * 0.07, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="p-5 rounded-2xl bg-[#121614] border border-neutral-800 hover:border-rose-500/40 hover:shadow-xl hover:shadow-rose-950/20 transition-colors shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold text-rose-400 uppercase bg-neutral-900 px-2.5 py-1 rounded-lg border border-neutral-700">
                      {getFacilityTypeLabel(shelter.facility_type)}
                    </span>
                    {getStatusBadge(shelter.operational_status)}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white line-clamp-1">{shelter.name}</h3>
                    <p className="text-xs text-neutral-400 flex items-center gap-1.5 mt-1 line-clamp-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-rose-500/80" />
                      <span>{shelter.address || 'Koordinat Wilayah Terkoordinasi'}</span>
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-neutral-900/90 border border-neutral-800 text-xs space-y-2">
                    <div className="flex items-center justify-between text-neutral-300">
                      <span className="flex items-center gap-1.5 text-neutral-400">
                        <Users className="w-3.5 h-3.5 text-neutral-500" />
                        Kapasitas Tampung:
                      </span>
                      <strong className="text-white font-bold">
                        {shelter.current_occupancy} / {shelter.capacity ? `${shelter.capacity} Jiwa` : 'Belum Ditentukan'}
                      </strong>
                    </div>
                    {shelter.capacity && (
                      <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${occupancyPct > 85 ? 'bg-rose-500' : 'bg-rose-500'}`}
                          style={{ width: `${occupancyPct}%` }}
                        />
                      </div>
                    )}

                    {shelter.evacuation_route_info?.route_code && (
                      <div className="flex items-center justify-between text-[11px] pt-1 text-neutral-400">
                        <span className="flex items-center gap-1 font-semibold text-rose-400">
                          <Compass className="w-3 h-3" />
                          Rute Evakuasi:
                        </span>
                        <span className="font-mono font-bold text-neutral-200">
                          {shelter.evacuation_route_info.route_code}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Facility Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {shelter.wheelchair_accessible && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-neutral-900 text-sky-300 border border-neutral-700">
                        Kursi Roda
                      </span>
                    )}
                    {shelter.elderly_friendly && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-neutral-900 text-purple-300 border border-neutral-700">
                        Ramah Lansia
                      </span>
                    )}
                    {shelter.has_sanitation && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-neutral-900 text-rose-300 border border-neutral-700">
                        Sanitasi &amp; Air
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-neutral-400 truncate max-w-[150px]">
                    Oleh: <strong className="text-neutral-200">{shelter.verified_by_agency || 'BPBD DKI'}</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(shelter.id)}
                      className="p-1.5 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors border border-neutral-700"
                      title="Lihat Detail Fasilitas"
                      aria-label="Detail shelter"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <Link
                      to={`${PATHS.PUBLIC.MAP}?lat=${shelter.latitude}&lng=${shelter.longitude}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-[11px] font-bold transition-colors"
                    >
                      <MapIcon className="w-3.5 h-3.5" />
                      <span>Peta</span>
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* MODAL: Shelter Detail Inspection */}
      {selectedShelter && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div data-lenis-prevent className="bg-[#121614] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-neutral-800 text-neutral-100">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div>
                <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-wider">
                  SHELTER TERVERIFIKASI #{selectedShelter.id}
                </span>
                <h2 className="text-base font-bold text-white mt-0.5">{selectedShelter.name}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedShelter(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Instansi Penanggung Jawab:</span>
                  <strong className="text-white font-bold">{selectedShelter.verified_by_agency || 'BPBD'}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Status Operasional:</span>
                  <div>{getStatusBadge(selectedShelter.operational_status)}</div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Kapasitas Saat Ini:</span>
                  <strong className="text-white font-bold">
                    {selectedShelter.current_occupancy} / {selectedShelter.capacity ? `${selectedShelter.capacity} Orang` : 'Belum Ditentukan'}
                  </strong>
                </div>
                {selectedShelter.evacuation_route_info?.route_code && (
                  <div className="space-y-0.5 pt-1 border-t border-neutral-800">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Koridor Rute Evakuasi:</span>
                      <strong className="font-mono text-rose-400">
                        {selectedShelter.evacuation_route_info.route_code}
                      </strong>
                    </div>
                    <span className="text-[10px] text-neutral-500 block text-right">
                      *Kode penetapan koridor BPBD/Dishub (bukan navigasi belokan GPS)
                    </span>
                  </div>
                )}
              </div>

              <div>
                <span className="font-semibold text-neutral-300 block mb-1">Alamat Lengkap</span>
                <p className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-200">
                  {selectedShelter.address || 'Area Koordinat Lapangan'}
                </p>
              </div>

              {selectedShelter.contact_phone && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-rose-950/60 border border-rose-800/60">
                  <span className="font-semibold text-rose-200 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-rose-400" />
                    Kontak Posko Darurat:
                  </span>
                  <a
                    href={`tel:${selectedShelter.contact_phone}`}
                    className="font-bold text-rose-300 hover:underline"
                  >
                    {selectedShelter.contact_phone}
                  </a>
                </div>
              )}

              {selectedShelter.evacuation_route_info?.safety_guidance && (
                <div>
                  <span className="font-semibold text-neutral-300 block mb-1">Petunjuk Keselamatan Koridor</span>
                  <p className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 leading-relaxed">
                    {selectedShelter.evacuation_route_info.safety_guidance}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
              <Link
                to={`${PATHS.PUBLIC.MAP}?lat=${selectedShelter.latitude}&lng=${selectedShelter.longitude}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Lihat di Peta Interaktif &rarr;</span>
              </Link>
              <button
                type="button"
                onClick={() => setSelectedShelter(null)}
                className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-200 text-xs font-bold hover:bg-neutral-700 hover:text-white transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
