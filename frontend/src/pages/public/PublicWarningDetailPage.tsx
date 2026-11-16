import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';

export const PublicWarningDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const alertId = id ? parseInt(id, 10) : NaN;
  const isValidId = !isNaN(alertId) && alertId > 0;

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-4">
      <nav className="text-xs text-[#6B7280] flex items-center gap-1.5" aria-label="Breadcrumb">
        <Link to={PATHS.PUBLIC.HOME} className="hover:text-[#047857] transition-colors">Beranda</Link>
        <span>/</span>
        <Link to={PATHS.PUBLIC.WARNINGS} className="hover:text-[#047857] transition-colors">Pusat Peringatan Dini</Link>
        <span>/</span>
        <span className="text-[#111827] font-semibold">Peringatan #{id}</span>
      </nav>

      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 space-y-3">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827]">
          Detail Peringatan Dini #{id}
        </h1>
        {isValidId ? (
          <p className="text-sm text-[#4B5563]">
            Fondasi rute peringatan dini #{alertId} terverifikasi. Komponen antarmuka detail akan diintegrasikan pada tahap berikutnya.
          </p>
        ) : (
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-4 text-sm text-[#991B1B]">
            ID peringatan dini tidak valid. Pastikan parameter URL berupa bilangan bulat positif.
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicWarningDetailPage;
