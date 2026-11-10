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
      className={`rounded-xl border p-6 sm:p-8 space-y-6 max-w-4xl mx-auto transition-all ${
        isDarkFamily
          ? 'bg-[#191919] border-[#343434] text-[#F2F2F2]'
          : 'bg-[#FFFFFF] border-[#E2E5E8] text-[#202428] shadow-sm'
      }`}
    >
      {/* Header bar */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b ${
          isDarkFamily ? 'border-[#343434]' : 'border-[#E2E5E8]'
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center border ${
              isDarkFamily
                ? 'bg-[#222222] border-[#343434] text-[#A9C2D1]'
                : 'bg-[#EAF1F5] border-[#D0DFE7] text-[#245B78]'
            }`}
          >
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-mono uppercase font-semibold border ${
                  isDarkFamily
                    ? 'bg-[#222222] text-[#A9C2D1] border-[#343434]'
                    : 'bg-[#EAF1F5] text-[#245B78] border-[#D0DFE7]'
                }`}
              >
                Area {area}
              </span>
              <span
                className={`text-[12px] font-mono ${
                  isDarkFamily ? 'text-[#929292]' : 'text-[#737C83]'
                }`}
              >
                {route}
              </span>
            </div>
            <h1
              className={`text-xl sm:text-2xl font-bold tracking-tight ${
                isDarkFamily ? 'text-[#F2F2F2]' : 'text-[#202428]'
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
            className={`text-xs px-2.5 py-1.5 rounded border transition-colors flex items-center gap-1.5 ${
              isDarkFamily
                ? 'bg-[#222222] border-[#343434] text-[#B8B8B8] hover:bg-[#2A2A2A] hover:text-[#F2F2F2]'
                : 'bg-[#F5F6F7] border-[#E2E5E8] text-[#596168] hover:bg-[#EAECEE] hover:text-[#202428]'
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
            className={`h-4 w-3/4 rounded ${
              isDarkFamily ? 'skeleton-dark' : 'skeleton-light'
            }`}
          />
          <div
            className={`h-4 w-full rounded ${
              isDarkFamily ? 'skeleton-dark' : 'skeleton-light'
            }`}
          />
          <div
            className={`h-4 w-5/6 rounded ${
              isDarkFamily ? 'skeleton-dark' : 'skeleton-light'
            }`}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
            <div
              className={`h-16 rounded-lg ${
                isDarkFamily ? 'skeleton-dark' : 'skeleton-light'
              }`}
            />
            <div
              className={`h-16 rounded-lg ${
                isDarkFamily ? 'skeleton-dark' : 'skeleton-light'
              }`}
            />
          </div>
        </div>
      ) : (
        <>
          <p
            className={`text-sm sm:text-base leading-relaxed ${
              isDarkFamily ? 'text-[#B8B8B8]' : 'text-[#596168]'
            }`}
          >
            {description}
          </p>

          {features && features.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4
                className={`text-xs uppercase font-mono tracking-wider ${
                  isDarkFamily ? 'text-[#929292]' : 'text-[#737C83]'
                }`}
              >
                Spesifikasi Modul dan Fungsionalitas
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {features.map((feat, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-2.5 px-3.5 py-3 rounded-lg border text-xs leading-snug ${
                      isDarkFamily
                        ? 'bg-[#222222] border-[#343434] text-[#D8D8D8]'
                        : 'bg-[#F5F6F7] border-[#E2E5E8] text-[#333B42]'
                    }`}
                  >
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        isDarkFamily ? 'text-[#70A987]' : 'text-[#28734D]'
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
                isDarkFamily ? 'border-[#343434]' : 'border-[#E2E5E8]'
              }`}
            >
              <Link
                to={ctaLink}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  isDarkFamily
                    ? 'bg-[#A9C2D1] hover:bg-[#C0D2DC] text-[#111111]'
                    : 'bg-[#245B78] hover:bg-[#1D4B64] text-[#FFFFFF]'
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
