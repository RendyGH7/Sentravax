import React from 'react';
import { Link } from 'react-router-dom';
import { PhoneCall, RefreshCw, AlertCircle, ShieldAlert, ArrowUpRight } from 'lucide-react';
import { PATHS } from '../../app/router/paths';
import { useNationalEmergencyHotlines, type NationalEmergencyHotlineItem } from '../../hooks/useNationalEmergencyHotlines';

interface EmergencyHotlineStripProps {
  variant?: 'bar' | 'grid';
  theme?: 'dark' | 'dark-rose' | 'light' | 'light-rose';
  title?: string;
  subtitle?: string;
}

function formatHotlineTitle(item: NationalEmergencyHotlineItem): string {
  const parts = [`${item.contactName} — ${item.label} (${item.value})`];
  if (item.isTollFree) parts.push('Bebas Pulsa');
  if (item.operatingHours) parts.push(item.operatingHours);
  return parts.join(' | ');
}

function formatCompactLabel(label: string, value: string): string {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const cleaned = label.replace(new RegExp(`\\s*\\b${escaped}\\b\\s*$`), '').trim();
  return cleaned || label;
}

export const EmergencyHotlineStrip: React.FC<EmergencyHotlineStripProps> = ({
  variant = 'bar',
  theme = 'dark',
  title = 'Panggilan Darurat Siaga (1-Klik):',
  subtitle = 'Kontak darurat nasional terverifikasi',
}) => {
  const { hotlines, loading, error, retry } = useNationalEmergencyHotlines();

  if (variant === 'grid') {
    const isLightRose = theme === 'light-rose';

    return (
      <section
        aria-label="Nomor Kontak Darurat Nasional"
        className={
          isLightRose
            ? 'bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-200 rounded-2xl p-6 shadow-xs space-y-3'
            : 'bg-[#121614] border border-neutral-800 rounded-2xl p-6 shadow-xs space-y-3'
        }
      >
        <div className={`flex items-center justify-between gap-2 ${isLightRose ? 'text-rose-800' : 'text-white'}`}>
          <div className="flex items-center gap-2">
            <PhoneCall className={`w-5 h-5 ${isLightRose ? 'text-rose-600' : 'text-rose-500'}`} />
            <h3 className="font-bold text-sm">{title}</h3>
          </div>
          <Link
            to={PATHS.PUBLIC.EMERGENCY_DIRECTORY}
            className={`text-[11px] font-semibold inline-flex items-center gap-1 hover:underline ${
              isLightRose ? 'text-rose-700' : 'text-rose-400'
            }`}
          >
            <span>Direktori</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        <p className={`text-xs leading-relaxed ${isLightRose ? 'text-rose-700' : 'text-neutral-300'}`}>
          {subtitle}
        </p>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-16 rounded-xl animate-pulse border ${
                  isLightRose ? 'bg-white/60 border-rose-200' : 'bg-neutral-900 border-neutral-800'
                }`}
              />
            ))}
          </div>
        )}

        {!loading && error && (
          <div
            className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
              isLightRose
                ? 'bg-white/80 border-rose-300 text-rose-800'
                : 'bg-rose-950/20 border-rose-900/50 text-rose-200'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </span>
            <button
              type="button"
              onClick={retry}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] shrink-0 cursor-pointer border ${
                isLightRose
                  ? 'bg-rose-100 hover:bg-rose-200 border-rose-300 text-rose-900'
                  : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-700 text-white'
              }`}
            >
              <RefreshCw className="w-3 h-3" />
              <span>Coba Lagi</span>
            </button>
          </div>
        )}

        {!loading && !error && hotlines.length === 0 && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
              isLightRose
                ? 'bg-white/80 border-rose-200 text-rose-800'
                : 'bg-neutral-900 border-neutral-800 text-neutral-300'
            }`}
          >
            <span>Belum ada hotline darurat nasional yang tersedia saat ini.</span>
            <Link
              to={PATHS.PUBLIC.EMERGENCY_DIRECTORY}
              className="font-bold underline shrink-0"
            >
              Buka Direktori
            </Link>
          </div>
        )}

        {!loading && !error && hotlines.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs font-bold">
            {hotlines.map((h) => (
              <a
                key={h.channelId}
                href={h.telUri}
                title={formatHotlineTitle(h)}
                className={
                  isLightRose
                    ? 'bg-[#121614] p-2.5 rounded-xl border border-rose-200 text-center hover:bg-rose-100 transition-colors text-rose-900 block'
                    : 'bg-neutral-900 p-2.5 rounded-xl border border-neutral-800 text-center hover:border-rose-500/40 transition-colors text-white block'
                }
              >
                <p className={`text-[10px] font-semibold truncate ${isLightRose ? 'text-rose-600' : 'text-rose-400'}`}>
                  {h.label}
                </p>
                <p className={`text-base font-extrabold ${isLightRose ? '' : 'text-white'}`}>{h.value}</p>
                {h.operatingHours && (
                  <p className={`text-[9px] font-normal mt-0.5 ${isLightRose ? 'text-rose-400' : 'text-neutral-400'}`}>
                    {h.operatingHours}
                  </p>
                )}
              </a>
            ))}
          </div>
        )}
      </section>
    );
  }

  // Variant: "bar"
  const isLight = theme === 'light';
  const isDarkRose = theme === 'dark-rose';

  const containerClass = isLight
    ? 'p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex flex-wrap items-center justify-between gap-3 text-xs'
    : isDarkRose
    ? 'p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm'
    : 'p-4 rounded-2xl bg-[#121614] border border-neutral-800 shadow-xs';

  return (
    <section aria-label="Kontak Darurat Cepat" className={containerClass}>
      <div
        className={
          isLight || isDarkRose
            ? 'contents'
            : 'flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs'
        }
      >
        {/* Left Header */}
        {isLight ? (
          <div className="flex items-center gap-2 text-[#991B1B] font-bold">
            <ShieldAlert className="w-4 h-4 text-[#DC2626]" />
            <span>{title}</span>
          </div>
        ) : isDarkRose ? (
          <div className="flex items-center gap-2 text-rose-300 font-bold">
            <PhoneCall className="w-4 h-4 text-rose-400" />
            <span>{title}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-700 text-rose-400 flex items-center justify-center font-bold shrink-0">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-white block">{title}</span>
              <span className="text-[11px] text-neutral-400">{subtitle}</span>
            </div>
          </div>
        )}

        {/* Right Content: Loading / Error / Empty / API Data */}
        <div className="flex flex-wrap items-center gap-2">
          {loading && (
            <>
              {[1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`h-8 w-24 rounded-xl animate-pulse border ${
                    isLight ? 'bg-white/70 border-[#FCA5A5]' : 'bg-neutral-900 border-neutral-800'
                  }`}
                />
              ))}
            </>
          )}

          {!loading && error && (
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[11px] flex items-center gap-1 ${isLight ? 'text-[#991B1B]' : 'text-rose-300'}`}>
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </span>
              <button
                type="button"
                onClick={retry}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                  isLight
                    ? 'bg-white hover:bg-[#FEE2E2] border-[#FCA5A5] text-[#991B1B]'
                    : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-700 text-white'
                }`}
              >
                <RefreshCw className="w-3 h-3" />
                <span>Coba Lagi</span>
              </button>
            </div>
          )}

          {!loading && !error && hotlines.length === 0 && (
            <span className={`text-[11px] ${isLight ? 'text-[#991B1B]' : 'text-neutral-400'}`}>
              Hotline nasional belum tersedia.
            </span>
          )}

          {!loading &&
            !error &&
            hotlines.map((h) => {
              const compactLabel = formatCompactLabel(h.label, h.value);
              return (
                <a
                  key={h.channelId}
                  href={h.telUri}
                  title={formatHotlineTitle(h)}
                  className={
                    isLight
                      ? 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#FCA5A5] hover:bg-[#FEE2E2] text-[#991B1B] font-bold text-[11px] transition-colors shadow-2xs'
                      : isDarkRose
                      ? 'inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#141414] border border-rose-500/35 hover:border-rose-400/60 hover:bg-rose-950/40 text-xs font-bold transition-colors shadow-2xs'
                      : 'inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-neutral-200 transition-colors'
                  }
                >
                  {isLight && <PhoneCall className="w-3 h-3 text-[#DC2626]" />}
                  <span className={isLight ? 'font-mono font-bold' : 'text-rose-400 font-mono font-bold'}>
                    {h.value}
                  </span>
                  <span
                    className={
                      isLight
                        ? 'hidden md:inline font-normal text-gray-600'
                        : 'text-[11px] font-medium text-neutral-300'
                    }
                  >
                    {isLight ? `(${compactLabel})` : compactLabel}
                  </span>
                </a>
              );
            })}

          <Link
            to={PATHS.PUBLIC.EMERGENCY_DIRECTORY}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              isLight
                ? 'text-[#991B1B] hover:bg-[#FEE2E2] border border-transparent'
                : 'text-rose-400 hover:text-rose-300 hover:bg-neutral-900 border border-neutral-800'
            }`}
          >
            <span>Direktori Lengkap</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </section>
  );
};
