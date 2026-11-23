import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
import { useAuth } from '../../app/context/useAuth';
import { 
  Shield, 
  Map, 
  Activity, 
  Compass, 
  Home, 
  Building2,
  AlertCircle, 
  LogIn, 
  LogOut, 
  User, 
  Menu, 
  X, 
  MoreHorizontal,
  AlertTriangle,
  BookOpen,
  Info,
  Radio
} from 'lucide-react';

const currentYear = new Date().getFullYear();

export const PublicLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const isHomeActive = location.pathname === PATHS.PUBLIC.HOME;
  const isMapActive = location.pathname.startsWith(PATHS.PUBLIC.MAP);
  const isPantauanActive = 
    location.pathname.startsWith(PATHS.PUBLIC.DISASTERS) || 
    location.pathname.startsWith(PATHS.PUBLIC.WARNINGS);
  const isSiagaActive = location.pathname.startsWith(PATHS.PUBLIC.PREPAREDNESS);
  const isShelterActive = location.pathname.startsWith(PATHS.PUBLIC.SHELTERS);

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] text-[#111827] selection:bg-[#D1FAE5] selection:text-[#065F46]">
      {/* Unified Single Header - Minimalist, Feature-First, Zero Clutter */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#F0F0F0] shadow-2xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between gap-4">
          {/* Brand Logo with Live Pulse */}
          <Link to={PATHS.PUBLIC.HOME} className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 rounded-xl bg-[#047857] flex items-center justify-center text-white shadow-xs transition-transform group-hover:scale-105">
              <Shield className="w-4.5 h-4.5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-[#111827]">
                SENTRAVAX
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[10px] font-mono font-bold text-[#047857]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
                LIVE
              </span>
            </div>
          </Link>

          {/* Desktop Navigation - Practical, high-utility tools only */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            <Link
              to={PATHS.PUBLIC.HOME}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                isHomeActive
                  ? 'bg-[#ECFDF5] text-[#047857] font-bold'
                  : 'text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6]'
              }`}
            >
              <Home className="w-3.5 h-3.5 text-[#047857]" />
              <span>Beranda</span>
            </Link>

            <Link
              to={PATHS.PUBLIC.MAP}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                isMapActive
                  ? 'bg-[#ECFDF5] text-[#047857] font-bold'
                  : 'text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6]'
              }`}
            >
              <Map className="w-3.5 h-3.5 text-[#047857]" />
              <span>Peta Risiko</span>
            </Link>

            <Link
              to={PATHS.PUBLIC.DISASTERS}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                isPantauanActive
                  ? 'bg-[#ECFDF5] text-[#047857] font-bold'
                  : 'text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6]'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-[#C2410C]" />
              <span>Pantauan</span>
            </Link>

            <Link
              to={PATHS.PUBLIC.PREPAREDNESS}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                isSiagaActive
                  ? 'bg-[#ECFDF5] text-[#047857] font-bold'
                  : 'text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6]'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-[#059669]" />
              <span>Siaga 72 Jam</span>
            </Link>

            <Link
              to={PATHS.PUBLIC.SHELTERS}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                isShelterActive
                  ? 'bg-[#ECFDF5] text-[#047857] font-bold'
                  : 'text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6]'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-[#0284C7]" />
              <span>Shelter</span>
            </Link>
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Lapor Bencana Quick Action */}
            <Link
              to={PATHS.PUBLIC.REPORT}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA] transition-colors shadow-2xs"
            >
              <AlertCircle className="w-3.5 h-3.5 text-[#DC2626]" />
              <span>Lapor</span>
            </Link>

            {/* Auth Button */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <Link
                  to={
                    user.role === 'admin'
                      ? PATHS.ADMIN.DASHBOARD
                      : user.role === 'intelligence'
                      ? PATHS.INTELLIGENCE.OVERVIEW
                      : PATHS.USER.DASHBOARD
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#047857] border border-[#A7F3D0]/60 transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-[#047857]" />
                  <span>{user.name.split(' ')[0]}</span>
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="p-1.5 rounded-full text-[#9CA3AF] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
                  title="Keluar sesi"
                  aria-label="Keluar sesi"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to={PATHS.PUBLIC.LOGIN}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-[#047857] hover:bg-[#065F46] text-white shadow-xs transition-all hover:shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk</span>
              </Link>
            )}

            {/* Compact More Menu Dropdown (Replaces bloated text links) */}
            <div className="relative group hidden sm:block">
              <button
                type="button"
                className="p-2 rounded-full text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors"
                title="Menu Portal & Otoritas"
                aria-label="Menu Portal & Otoritas"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              <div className="absolute top-full right-0 pt-2 hidden group-hover:block group-focus-within:block z-50">
                <div className="w-56 rounded-2xl bg-white border border-[#E5E7EB] shadow-xl p-2 space-y-1">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 py-1">
                    Informasi & Edukasi
                  </div>
                  <Link
                    to={PATHS.PUBLIC.WARNINGS}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 hover:bg-[#F9FAFB] hover:text-[#047857] transition-colors"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
                    <span>Peringatan Dini CAP</span>
                  </Link>
                  <Link
                    to={PATHS.PUBLIC.EDUCATION}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 hover:bg-[#F9FAFB] hover:text-[#047857] transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#7C3AED]" />
                    <span>Pusat Edukasi</span>
                  </Link>
                  <Link
                    to={PATHS.PUBLIC.ABOUT}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 hover:bg-[#F9FAFB] hover:text-[#047857] transition-colors"
                  >
                    <Info className="w-3.5 h-3.5 text-[#047857]" />
                    <span>Tentang Platform</span>
                  </Link>

                  <div className="pt-1 my-1 border-t border-gray-100" />
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 py-1">
                    Area Portal Terintegrasi
                  </div>
                  <Link
                    to={PATHS.USER.DASHBOARD}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 hover:bg-[#F9FAFB] hover:text-[#0284C7] transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-[#0284C7]" />
                    <span>Area Warga</span>
                  </Link>
                  <Link
                    to={PATHS.ADMIN.DASHBOARD}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 hover:bg-[#F9FAFB] hover:text-[#F59E0B] transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>Portal Admin</span>
                  </Link>
                  <Link
                    to={PATHS.INTELLIGENCE.OVERVIEW}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 hover:bg-[#F9FAFB] hover:text-[#10B981] transition-colors"
                  >
                    <Radio className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>Intelligence Center</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#4B5563] hover:text-[#111827] rounded-lg hover:bg-[#F3F4F6] min-w-[38px] min-h-[38px] flex items-center justify-center transition-colors"
              aria-label="Buka menu navigasi"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile drawer with streamlined actions */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-[#E5E7EB] px-4 pt-3 pb-5 space-y-3 shadow-lg">
            {/* Core Tools */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider px-3 py-1">
                Fitur Utama
              </div>
              <Link
                to={PATHS.PUBLIC.MAP}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isMapActive
                    ? 'bg-[#ECFDF5] text-[#047857] font-bold'
                    : 'text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#111827]'
                }`}
              >
                <Map className="w-4 h-4 text-[#047857]" />
                <span>Peta Risiko</span>
              </Link>
              <Link
                to={PATHS.PUBLIC.DISASTERS}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#111827] transition-colors"
              >
                <Activity className="w-4 h-4 text-[#C2410C]" />
                <span>Pantauan Bencana</span>
              </Link>
              <Link
                to={PATHS.PUBLIC.PREPAREDNESS}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#111827] transition-colors"
              >
                <Compass className="w-4 h-4 text-[#047857]" />
                <span>Siaga 72 Jam</span>
              </Link>
              <Link
                to={PATHS.PUBLIC.SHELTERS}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#111827] transition-colors"
              >
                <Home className="w-4 h-4 text-[#0284C7]" />
                <span>Direktori Shelter</span>
              </Link>
            </div>

            {/* Quick Actions & Portals */}
            <div className="pt-2 border-t border-[#F3F4F6] flex flex-col gap-2">
              <Link
                to={PATHS.PUBLIC.REPORT}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 px-4 rounded-xl text-center text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors flex items-center justify-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>Lapor Bencana</span>
              </Link>
              <Link
                to={PATHS.USER.DASHBOARD}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 px-4 rounded-xl text-center text-xs font-semibold text-[#374151] bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] transition-colors"
              >
                Portal Warga
              </Link>
              {!isAuthenticated && (
                <Link
                  to={PATHS.PUBLIC.LOGIN}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 px-4 rounded-xl text-center text-xs font-bold text-white bg-[#047857] hover:bg-[#065F46] shadow-xs transition-colors"
                >
                  Masuk ke Akun
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Page Area */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Public Footer */}
      <footer className="bg-[#FFFFFF] border-t border-[#E5E7EB] text-[#4B5563] py-12 px-4 sm:px-6 lg:px-8 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-[#047857] flex items-center justify-center text-white">
                <Shield className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-[#111827] tracking-tight text-sm">SENTRAVAX</span>
            </div>
            <p className="text-[#4B5563] leading-relaxed mb-3">
              Platform Intelijen Geospasial &amp; Kesiapsiagaan Bencana Multi-Hazard berbasis sains data terbuka.
            </p>
            <span className="inline-block px-3 py-1 rounded-md text-[11px] font-mono bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] font-bold">
              Sistem Kesiapsiagaan Publik
            </span>
          </div>

          <div>
            <h4 className="text-[#111827] font-bold mb-3 text-xs uppercase tracking-wider">Akses Publik</h4>
            <ul className="space-y-2">
              <li><Link to={PATHS.PUBLIC.MAP} className="hover:text-[#047857] transition-colors">Peta Risiko Interaktif</Link></li>
              <li><Link to={PATHS.PUBLIC.DISASTERS} className="hover:text-[#047857] transition-colors">Katalog Bencana Terkini</Link></li>
              <li><Link to={PATHS.PUBLIC.WARNINGS} className="hover:text-[#047857] transition-colors">Peringatan Dini Resmi</Link></li>
              <li><Link to={PATHS.PUBLIC.PREPAREDNESS} className="hover:text-[#047857] transition-colors">Panduan Tanggap Darurat</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[#111827] font-bold mb-3 text-xs uppercase tracking-wider">Area Operasional</h4>
            <ul className="space-y-2">
              <li><Link to={PATHS.USER.DASHBOARD} className="hover:text-[#047857] transition-colors">Portal Warga Terdaftar</Link></li>
              <li><Link to={PATHS.ADMIN.DASHBOARD} className="hover:text-[#047857] transition-colors">Konsol Administrator</Link></li>
              <li><Link to={PATHS.INTELLIGENCE.OVERVIEW} className="hover:text-[#047857] transition-colors">Disaster Intelligence Center</Link></li>
              <li><Link to={PATHS.PUBLIC.ABOUT} className="hover:text-[#047857] transition-colors">Tentang Proyek SENTRAVAX</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[#111827] font-bold mb-3 text-xs uppercase tracking-wider">Sumber Data Otoritatif</h4>
            <p className="text-[#6B7280] leading-relaxed mb-2">
              Data terintegrasi dari BMKG, BNPB, PVMBG, OpenStreetMap, dan pelaporan masyarakat terverifikasi.
            </p>
            <p className="text-[#6B7280] text-[11px]">
              &copy; {currentYear} SENTRAVAX Project. Seluruh hak cipta dilindungi.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
