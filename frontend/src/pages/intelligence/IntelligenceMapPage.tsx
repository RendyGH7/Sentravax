import React from 'react';
import { AreaPlaceholder } from '../../components/shared/AreaPlaceholder';
import { Layers } from 'lucide-react';
import { PATHS } from '../../app/router/paths';

export const IntelligenceMapPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <AreaPlaceholder
        area="INTELLIGENCE"
        title="Peta Geospasial Multi-Bahaya Analitis"
        description="Ruang kerja spasial berbasis vektor & raster untuk membedah layer bahaya (bencana alam), kerentanan demografi, kapasitas fasilitas darurat, dan paparan aset kritis."
        route={PATHS.INTELLIGENCE.MAP}
        icon={Layers}
        features={[
          'Overlay multi-layer PostGIS (Poligon banjir, patahan sesar, seismisitas)',
          'Kontur elevasi medan & analisis kelerengan risiko longsor',
          'Peta kepadatan penduduk & fasilitas publik terdampak',
          'Alat ukur radius buffer spasial interaktif & query poligon'
        ]}
        ctaLink={PATHS.INTELLIGENCE.RISK_ANALYSIS}
        ctaText="Buka Mesin Analisis Risiko"
      />
    </div>
  );
};

