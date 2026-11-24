import React, { Suspense, lazy } from 'react';
import { motion } from 'motion/react';
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

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        data-lenis-prevent
        className="rounded-2xl overflow-hidden border border-[#262626] shadow-md"
      >
        <Suspense
          fallback={
            <div className="h-[680px] w-full bg-[#121212] flex flex-col items-center justify-center p-6 gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
              <span className="text-sm font-semibold text-white">
                Memuat Komponen Geospasial Leaflet...
              </span>
            </div>
          }
        >
          <DisasterMap theme="dark" height="680px" />
        </Suspense>
      </motion.div>
    </div>
  );
};
