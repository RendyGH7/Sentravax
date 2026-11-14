import React, { Suspense, lazy } from 'react';
import { RefreshCw } from 'lucide-react';

// Code Splitting: Lazy-load Leaflet map module so non-map routes do not pay the bundle cost
const DisasterMap = lazy(() =>
  import('../../components/map').then((mod) => ({ default: mod.DisasterMap }))
);

export const PublicMapPage: React.FC = () => {
  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827]">
          Peta Bencana & Kesiapsiagaan Indonesia
        </h1>
        <p className="text-xs sm:text-sm text-[#4B5563] mt-1">
          Pantauan geospasial real-time kejadian bencana aktif terverifikasi dari telemetri BMKG dan jaringan posko nasional.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="h-[680px] w-full rounded-2xl border border-[#E5E7EB] bg-white flex flex-col items-center justify-center p-6 gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#047857]" />
            <span className="text-sm font-semibold text-[#111827]">
              Memuat Komponen Geospasial Leaflet...
            </span>
          </div>
        }
      >
        <DisasterMap theme="light" height="680px" />
      </Suspense>
    </div>
  );
};
