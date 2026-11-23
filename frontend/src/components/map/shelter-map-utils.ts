import L from 'leaflet';
import type { ShelterItem } from '../../types/shelter';
import type { UITheme } from '../ui/Button';

export function getFacilityTypeLabel(type: string): string {
  switch (type) {
    case 'assembly_point':
      return 'Titik Kumpul Aman';
    case 'community_hall':
      return 'Balai Warga / GOR';
    case 'stadium':
      return 'Stadion Evakuasi';
    case 'school':
      return 'Sekolah / Madrasah';
    case 'tent_camp':
      return 'Tenda Pengungsian';
    case 'health_facility':
      return 'Fasilitas Kesehatan';
    case 'government_office':
      return 'Kantor Pemerintah';
    default:
      return 'Fasilitas Shelter';
  }
}

export function getOperationalStatusBadge(status: string): { label: string; bg: string; text: string } {
  switch (status) {
    case 'open':
      return { label: 'BEROPERASI (BUKA)', bg: 'bg-[#D1FAE5]', text: 'text-[#065F46]' };
    case 'standby':
      return { label: 'SIAGA (STANDBY)', bg: 'bg-[#FEF3C7]', text: 'text-[#92400E]' };
    case 'full':
      return { label: 'PENUH', bg: 'bg-[#FEE2E2]', text: 'text-[#991B1B]' };
    case 'closed':
      return { label: 'TIDAK AKTIF', bg: 'bg-[#F3F4F6]', text: 'text-[#4B5563]' };
    default:
      return { label: status.toUpperCase(), bg: 'bg-[#F3F4F6]', text: 'text-[#374151]' };
  }
}

export function createShelterMarkerIcon(
  shelter: ShelterItem,
  isSelected: boolean = false,
  theme: UITheme = 'light'
): L.DivIcon {
  const isDark = theme === 'dark';
  const isVerified = shelter.verification_status === 'VERIFIED';
  const isOpen = shelter.operational_status === 'open';

  const baseBorderColor = isVerified ? (isOpen ? '#059669' : '#D97706') : '#9CA3AF';
  const baseBgColor = isVerified ? (isOpen ? '#10B981' : '#F59E0B') : '#6B7280';

  const iconSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  `;

  const html = `
    <div class="relative flex items-center justify-center cursor-pointer group" style="transform: translate3d(0,0,0);">
      ${isSelected ? `
        <span class="absolute w-12 h-12 rounded-full opacity-35 motion-safe:animate-ping" style="background-color: ${baseBgColor};"></span>
      ` : ''}
      <div 
        class="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full shadow-md transition-transform duration-200 group-hover:scale-110"
        style="
          background-color: ${baseBgColor}; 
          border: 2px solid ${isDark ? '#1F2937' : '#FFFFFF'};
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
        "
        role="img"
        aria-label="Shelter: ${shelter.name}"
      >
        ${iconSvg}
      </div>
      <div class="absolute -bottom-1 w-2 h-2 rounded-full" style="background-color: ${baseBorderColor};"></div>
    </div>
  `;

  return L.divIcon({
    className: 'sentravax-shelter-marker-icon',
    html,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

export function createShelterPopupHtml(
  shelter: ShelterItem,
  theme: UITheme = 'light',
  userDistanceKm?: number | null
): string {
  const isDark = theme === 'dark';
  const isVerified = shelter.verification_status === 'VERIFIED';
  const statusBadge = getOperationalStatusBadge(shelter.operational_status);
  const typeLabel = getFacilityTypeLabel(shelter.facility_type);

  const capacityInfo = shelter.capacity
    ? `${shelter.current_occupancy || 0} / ${shelter.capacity} Jiwa`
    : 'Kapasitas tidak dicatat';

  const occupancyPercent = shelter.capacity && shelter.capacity > 0
    ? Math.min(100, Math.round(((shelter.current_occupancy || 0) / shelter.capacity) * 100))
    : 0;

  const evac = shelter.evacuation_route_info;
  const hasOfficialRoute = evac?.has_official_route === true;

  return `
    <div class="p-3 sm:p-4 text-left font-sans text-xs ${isDark ? 'text-[#F9FAFB]' : 'text-[#111827]'} max-w-[320px]">
      <!-- Header Badge (pr-9 ensures zero collision with Leaflet close button) -->
      <div class="flex items-center justify-between gap-2 mb-2 pb-2 pr-9 border-b ${isDark ? 'border-[#374151]' : 'border-[#E5E7EB]'}">
        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${isVerified ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-[#FEF3C7] text-[#92400E]'}">
          ${isVerified ? '🛡️ RESMI TERVERIFIKASI' : '⚠️ DALAM VERIFIKASI'}
        </span>
        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${statusBadge.bg} ${statusBadge.text}">
          ${statusBadge.label}
        </span>
      </div>

      <!-- Facility Name & Type -->
      <div class="text-[10px] font-semibold uppercase tracking-wider text-[#059669] mb-0.5">
        ${typeLabel}
      </div>
      <h3 class="text-sm font-bold leading-snug mb-1">
        ${shelter.name}
      </h3>
      <p class="text-[11px] leading-relaxed text-[#6B7280] mb-2.5">
        📍 ${shelter.address}
      </p>

      ${userDistanceKm !== undefined && userDistanceKm !== null ? `
        <div class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] mb-2.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a8 8 0 0 0-8 8c0 5.4 7.05 11.5 7.35 11.76a1 1 0 0 0 1.3 0C12.95 21.5 20 15.4 20 10a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg>
          Jarak: ${userDistanceKm} km dari pin Anda
        </div>
      ` : ''}

      <!-- Capacity & Facilities -->
      <div class="rounded-lg p-2.5 mb-2.5 ${isDark ? 'bg-[#1F2937]' : 'bg-[#F9FAFB]'} border ${isDark ? 'border-[#374151]' : 'border-[#E5E7EB]'} space-y-1.5">
        <div class="flex items-center justify-between text-[11px]">
          <span class="text-[#6B7280]">Kapasitas:</span>
          <span class="font-bold">${capacityInfo}</span>
        </div>
        ${shelter.capacity ? `
          <div class="w-full bg-[#E5E7EB] rounded-full h-1.5 overflow-hidden">
            <div class="h-1.5 rounded-full ${occupancyPercent >= 90 ? 'bg-[#EF4444]' : occupancyPercent >= 60 ? 'bg-[#F59E0B]' : 'bg-[#10B981]'}" style="width: ${occupancyPercent}%"></div>
          </div>
        ` : ''}

        <!-- Accessibility Tags -->
        <div class="flex flex-wrap gap-1.5 pt-1">
          ${shelter.wheelchair_accessible ? `
            <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#EFF6FF] text-[#1D4ED8]">
              ♿ Akses Kursi Roda
            </span>
          ` : ''}
          ${shelter.elderly_friendly ? `
            <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#F5F3FF] text-[#6D28D9]">
              👴 Ramah Lansia
            </span>
          ` : ''}
          ${shelter.has_sanitation ? `
            <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#F0FDF4] text-[#15803D]">
              🚻 Sanitasi & Air Bersih
            </span>
          ` : ''}
        </div>
      </div>

      <!-- Evacuation Information Directive Box (Bagian D) -->
      <div class="rounded-lg p-2.5 mb-2.5 border text-[11px] leading-relaxed ${hasOfficialRoute ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]' : 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'}">
        <div class="font-bold flex items-center gap-1 mb-1">
          ${hasOfficialRoute ? '🛣️ RUTE EVAKUASI RESMI TERSEDIA' : '⚠️ INFORMASI JALUR KESELAMATAN'}
        </div>
        ${hasOfficialRoute ? `
          <div class="space-y-0.5">
            <p><strong>Koridor:</strong> ${evac?.corridor_name || evac?.route_code}</p>
            <p><strong>Otoritas:</strong> ${evac?.authority || shelter.verified_by_agency || 'BPBD Setempat'}</p>
            ${evac?.safety_guidance ? `<p class="mt-1 text-[10px] italic">"${evac.safety_guidance}"</p>` : ''}
          </div>
        ` : `
          <p class="text-[10px]">
            Data rute evakuasi digital resmi belum dirilis oleh BPBD setempat. Warga diimbau mematuhi rambu evakuasi fisik dan arahan petugas lapangan. Jangan mengandalkan rute pintas mandiri saat bencana.
          </p>
        `}
      </div>

      <!-- Verifying Authority & Contact -->
      <div class="text-[10px] text-[#6B7280] space-y-0.5 pt-1 border-t ${isDark ? 'border-[#374151]' : 'border-[#E5E7EB]'}">
        ${shelter.verified_by_agency ? `
          <p><strong>Verifikator:</strong> ${shelter.verified_by_agency}</p>
        ` : ''}
        ${shelter.contact_phone ? `
          <p><strong>Kontak Darurat:</strong> <a href="tel:${shelter.contact_phone}" class="text-[#059669] underline font-bold">${shelter.contact_phone}</a> ${shelter.contact_person ? `(${shelter.contact_person})` : ''}</p>
        ` : ''}
      </div>
    </div>
  `;
}
