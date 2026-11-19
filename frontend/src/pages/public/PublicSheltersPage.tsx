import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
import { publicService } from '../../services/public-service';
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
    loadShelters();
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
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            BEROPERASI (OPEN)
          </span>
        );
      case 'standby':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
            SIAP SIAGA (STANDBY)
          </span>
        );
      case 'full':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            KAPASITAS PENUH (FULL)
          </span>
        );
      case 'closed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700">
            DITUTUP (CLOSED)
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight">
              Direktori Shelter & Titik Kumpul Evakuasi
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
              Terverifikasi BPBD / BNPB
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#4B5563] mt-1">
            Lokasi penampungan sementara resmi yang memenuhi standar keselamatan, sanitasi air bersih, dan aksesibilitas lansia.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            to={PATHS.PUBLIC.MAP}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#047857] text-white text-xs font-bold hover:bg-[#065F46] transition-colors shadow-xs"
          >
            <MapIcon className="w-4 h-4" />
            Buka di Peta Multi-Hazard
          </Link>
          <button
            type="button"
            onClick={loadShelters}
            className="p-2 text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-xl transition-colors border border-[#E5E7EB]"
            title="Muat ulang"
            aria-label="Muat ulang"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Info Notice: Zero Fake Shelters */}
      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 shrink-0 text-[#047857] mt-0.5" />
        <div>
          <span className="font-bold block text-sm">Jaminan Integritas Tempat Evakuasi</span>
          Semua shelter yang tercantum di halaman ini telah melalui verifikasi faktual lapangan oleh BPBD/Dinsos setempat dan dilengkapi kode koridor evakuasi terkoordinasi. Titik kumpul liar atau usulan warga yang belum diverifikasi tidak akan ditampilkan untuk mencegah risiko keselamatan.
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama shelter, alamat, rute..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#047857]"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={facilityTypeFilter}
            onChange={(e) => setFacilityTypeFilter(e.target.value)}
            className="text-xs rounded-lg border border-[#D1D5DB] py-1.5 px-2.5 bg-white text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#047857]"
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
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              accessibilityOnly
                ? 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
                : 'bg-white text-[#4B5563] border-[#D1D5DB] hover:bg-[#F9FAFB]'
            }`}
          >
            <Accessibility className="w-3.5 h-3.5" />
            Ramah Difabel & Lansia
          </button>
        </div>
      </div>

      {/* Shelters Grid Cards */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-[#E5E7EB]">
          <RefreshCw className="w-6 h-6 animate-spin text-[#047857]" />
          <p className="text-xs text-[#6B7280]">Memuat direktori shelter terverifikasi...</p>
        </div>
      ) : filteredShelters.length === 0 ? (
        <div className="p-16 text-center space-y-2 bg-white rounded-2xl border border-[#E5E7EB]">
          <Home className="w-8 h-8 text-[#9CA3AF] mx-auto" />
          <p className="text-sm font-semibold text-[#111827]">Tidak Ada Shelter Ditemukan</p>
          <p className="text-xs text-[#6B7280]">Sesuaikan kata kunci pencarian atau filter Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredShelters.map((shelter) => {
            const totalCapacity = shelter.capacity || 100;
            const occupancyPct = Math.min(100, Math.round((shelter.current_occupancy / totalCapacity) * 100));

            return (
              <div
                key={shelter.id}
                className="p-5 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#A7F3D0] transition-all shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold text-[#047857] uppercase bg-[#ECFDF5] px-2 py-0.5 rounded border border-[#A7F3D0]">
                      {getFacilityTypeLabel(shelter.facility_type)}
                    </span>
                    {getStatusBadge(shelter.operational_status)}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#111827] line-clamp-1">{shelter.name}</h3>
                    <p className="text-xs text-[#6B7280] flex items-center gap-1 mt-1 line-clamp-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-[#9CA3AF]" />
                      {shelter.address || 'Koordinat Wilayah Terkoordinasi'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-[#4B5563]">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-[#9CA3AF]" />
                        Kapasitas Tampung:
                      </span>
                      <strong className="text-[#111827]">
                        {shelter.current_occupancy} / {shelter.capacity ? `${shelter.capacity} Jiwa` : 'Belum Ditentukan'}
                      </strong>
                    </div>
                    {shelter.capacity && (
                      <div className="w-full bg-[#E5E7EB] h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${occupancyPct > 85 ? 'bg-rose-500' : 'bg-[#047857]'}`}
                          style={{ width: `${occupancyPct}%` }}
                        />
                      </div>
                    )}

                    {shelter.evacuation_route_info?.route_code && (
                      <div className="flex items-center justify-between text-[11px] pt-1 text-[#6B7280]">
                        <span className="flex items-center gap-1 font-semibold text-[#047857]">
                          <Compass className="w-3 h-3" />
                          Rute Evakuasi:
                        </span>
                        <span className="font-mono font-bold text-[#111827]">
                          {shelter.evacuation_route_info.route_code}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Facility Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {shelter.wheelchair_accessible && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        Kursi Roda
                      </span>
                    )}
                    {shelter.elderly_friendly && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                        Ramah Lansia
                      </span>
                    )}
                    {shelter.has_sanitation && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Sanitasi & Air
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#6B7280] truncate max-w-[150px]">
                    Oleh: <strong className="text-[#374151]">{shelter.verified_by_agency || 'BPBD DKI'}</strong>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(shelter.id)}
                      className="p-1.5 rounded-lg text-[#047857] hover:bg-[#ECFDF5] transition-colors"
                      title="Lihat Detail Fasilitas"
                      aria-label="Detail shelter"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <Link
                      to={`${PATHS.PUBLIC.MAP}?lat=${shelter.latitude}&lng=${shelter.longitude}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#047857] hover:bg-[#065F46] text-white text-[11px] font-bold transition-colors"
                    >
                      <MapIcon className="w-3 h-3" />
                      Peta
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Shelter Detail Inspection */}
      {selectedShelter && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 border border-[#E5E7EB]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#047857]">
                  SHELTER TERVERIFIKASI #{selectedShelter.id}
                </span>
                <h2 className="text-base font-bold text-[#111827] mt-0.5">{selectedShelter.name}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedShelter(null)}
                className="text-[#9CA3AF] hover:text-[#111827] p-1"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Instansi Penanggung Jawab:</span>
                  <strong className="text-[#111827]">{selectedShelter.verified_by_agency || 'BPBD'}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Status Operasional:</span>
                  <div>{getStatusBadge(selectedShelter.operational_status)}</div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Kapasitas Saat Ini:</span>
                  <strong className="text-[#111827]">
                    {selectedShelter.current_occupancy} / {selectedShelter.capacity ? `${selectedShelter.capacity} Orang` : 'Belum Ditentukan'}
                  </strong>
                </div>
                {selectedShelter.evacuation_route_info?.route_code && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7280]">Koridor Rute Evakuasi:</span>
                    <strong className="font-mono text-[#047857]">
                      {selectedShelter.evacuation_route_info.route_code}
                    </strong>
                  </div>
                )}
              </div>

              <div>
                <span className="font-semibold text-[#374151] block mb-1">Alamat Lengkap</span>
                <p className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] text-[#374151]">
                  {selectedShelter.address || 'Area Koordinat Lapangan'}
                </p>
              </div>

              {selectedShelter.contact_phone && (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                  <span className="font-semibold text-emerald-900 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    Kontak Posko Darurat:
                  </span>
                  <a
                    href={`tel:${selectedShelter.contact_phone}`}
                    className="font-bold text-[#047857] hover:underline"
                  >
                    {selectedShelter.contact_phone}
                  </a>
                </div>
              )}

              {selectedShelter.evacuation_route_info?.safety_guidance && (
                <div>
                  <span className="font-semibold text-[#374151] block mb-1">Petunjuk Keselamatan Koridor</span>
                  <p className="p-2.5 rounded-lg bg-white border border-[#E5E7EB] text-[#4B5563] leading-relaxed">
                    {selectedShelter.evacuation_route_info.safety_guidance}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB]">
              <Link
                to={`${PATHS.PUBLIC.MAP}?lat=${selectedShelter.latitude}&lng=${selectedShelter.longitude}`}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#047857] hover:text-[#065F46]"
              >
                <Compass className="w-3.5 h-3.5" />
                Lihat di Peta Interaktif &rarr;
              </Link>
              <button
                type="button"
                onClick={() => setSelectedShelter(null)}
                className="px-4 py-2 rounded-xl bg-[#F3F4F6] text-[#374151] text-xs font-semibold hover:bg-[#E5E7EB] transition-colors"
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
