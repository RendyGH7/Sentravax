import React, { Suspense, lazy } from 'react';
import { RefreshCw } from 'lucide-react';
import { ScrollWordTitle } from '../../components/shared/ScrollWordTitle';

// Code Splitting: Lazy-load Leaflet map module so non-map routes do not pay the bundle cost
const DisasterMap = lazy(() =>
  import('../../components/map').then((mod) => ({ default: mod.DisasterMap }))
);

export const PublicMapPage: React.FC = () => {
  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-4">
      <div>
        <ScrollWordTitle
          as="h1"
          className="text-xl sm:text-2xl font-bold tracking-tight text-white"
        >
          Peta Bencana &amp; Kesiapsiagaan Indonesia
        </ScrollWordTitle>
        <p className="text-xs sm:text-sm text-neutral-400 mt-1">
          Pantauan geospasial real-time kejadian bencana aktif terverifikasi dari telemetri BMKG dan jaringan posko nasional.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="h-[680px] w-full rounded-2xl border border-[#262626] bg-[#121212] flex flex-col items-center justify-center p-6 gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
            <span className="text-sm font-semibold text-white">
              Memuat Komponen Geospasial Leaflet...
            </span>
          </div>
        }
      >
        <DisasterMap theme="dark" height="680px" />
      </Suspense>
    </div>
  );
};
