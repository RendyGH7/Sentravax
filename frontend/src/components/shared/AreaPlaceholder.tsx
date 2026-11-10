import React, { useState } from 'react';
import { type LucideIcon, ArrowRight, CheckCircle2, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AreaPlaceholderProps {
  area: 'PUBLIC' | 'USER' | 'ADMIN' | 'INTELLIGENCE';
  title: string;
  description: string;
  route: string;
  icon: LucideIcon;
  features?: string[];
  ctaLink?: string;
  ctaText?: string;
}

export const AreaPlaceholder: React.FC<AreaPlaceholderProps> = ({
  area,
  title,
  description,
  route,
  icon: Icon,
  features,
  ctaLink,
  ctaText,
}) => {
  const isDarkFamily = area === 'ADMIN' || area === 'INTELLIGENCE';
  const [showSkeletonDemo, setShowSkeletonDemo] = useState(false);

  return (
    <div
      className={`rounded-2xl border p-6 sm:p-8 space-y-6 max-w-4xl mx-auto transition-all shadow-sm ${
        isDarkFamily
          ? 'bg-[#161616] border-[#2C2C2C] text-[#F5F5F5]'
          : 'bg-[#FFFFFF] border-[#E5E7EB] text-[#111827]'
      }`}
    >
      {/* Header bar */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b ${
          isDarkFamily ? 'border-[#2C2C2C]' : 'border-[#E5E7EB]'
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-xs ${
              isDarkFamily
                ? 'bg-[#212121] border-[#383838] text-[#F59E0B]'
                : 'bg-[#ECFDF5] border-[#A7F3D0] text-[#047857]'
            }`}
          >
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase font-bold border ${
                  isDarkFamily
                    ? 'bg-[#212121] text-[#F59E0B] border-amber-500/40'
                    : 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
                }`}
              >
                Area {area}
              </span>
              <span
                className={`text-[12px] font-mono font-medium ${
                  isDarkFamily ? 'text-[#8A8A8A]' : 'text-[#6B7280]'
                }`}
              >
                {route}
              </span>
            </div>
            <h1
              className={`text-xl sm:text-2xl font-extrabold tracking-tight ${
                isDarkFamily ? 'text-[#FFFFFF]' : 'text-[#111827]'
              }`}
            >
              {title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSkeletonDemo(!showSkeletonDemo)}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors flex items-center gap-1.5 ${
              isDarkFamily
                ? 'bg-[#212121] border-[#2C2C2C] text-[#D4D4D4] hover:bg-[#2B2B2B] hover:text-[#FFFFFF]'
                : 'bg-[#F9FAFB] border-[#E5E7EB] text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#111827]'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{showSkeletonDemo ? 'Lihat Konten Normal' : 'Simulasi Loading Skeleton'}</span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton Demo State */}
      {showSkeletonDemo ? (
        <div className="space-y-4 py-2" aria-label="Loading state skeleton">
          <div
            className={`h-4 w-3/4 rounded-md ${
              isDarkFamily ? 'skeleton-dark' : 'skeleton-light'
            }`}
          />
          <div
            className={`h-4 w-full rounded-md ${
              isDarkFamily ? 'skeleton-dark' : 'skeleton-light'
            }`}
          />
          <div
            className={`h-4 w-5/6 rounded-md ${
              isDarkFamily ? 'skeleton-dark' : 'skeleton-light'
            }`}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
            <div
              className={`h-20 rounded-xl ${
                isDarkFamily ? 'skeleton-dark' : 'skeleton-light'
              }`}
            />
            <div
              className={`h-20 rounded-xl ${
                isDarkFamily ? 'skeleton-dark' : 'skeleton-light'
              }`}
            />
          </div>
        </div>
      ) : (
        <>
          <p
            className={`text-sm sm:text-base leading-relaxed ${
              isDarkFamily ? 'text-[#D4D4D4]' : 'text-[#4B5563]'
            }`}
          >
            {description}
          </p>

          {features && features.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4
                className={`text-xs uppercase font-mono tracking-wider font-bold ${
                  isDarkFamily ? 'text-[#F59E0B]' : 'text-[#047857]'
                }`}
              >
                Spesifikasi Modul dan Fungsionalitas
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {features.map((feat, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-2.5 px-4 py-3 rounded-xl border text-xs leading-snug font-medium ${
                      isDarkFamily
                        ? 'bg-[#212121] border-[#2C2C2C] text-[#E5E5E5]'
                        : 'bg-[#F9FAFB] border-[#E5E7EB] text-[#111827]'
                    }`}
                  >
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        isDarkFamily ? 'text-[#10B981]' : 'text-[#047857]'
                      }`}
                    />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ctaLink && ctaText && (
            <div
              className={`pt-4 border-t flex justify-end ${
                isDarkFamily ? 'border-[#2C2C2C]' : 'border-[#E5E7EB]'
              }`}
            >
              <Link
                to={ctaLink}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                  isDarkFamily
                    ? 'bg-[#F59E0B] hover:bg-[#D97706] text-[#0C0C0C]'
                    : 'bg-[#047857] hover:bg-[#065F46] text-white'
                }`}
              >
                <span>{ctaText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
};
