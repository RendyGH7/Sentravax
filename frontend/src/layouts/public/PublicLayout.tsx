import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
import { useAuth } from '../../app/context/useAuth';
import { 
  Shield, 
  Map, 
  AlertTriangle, 
  BookOpen, 
  Info, 
  LogIn, 
  Menu, 
  X, 
  Activity, 
  Radio, 
  User, 
  Compass,
  LogOut,
  AlertCircle,
  Home
} from 'lucide-react';

const currentYear = new Date().getFullYear();

export const PublicLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const navLinks = [
    { name: 'Beranda', path: PATHS.PUBLIC.HOME, icon: Shield },
    { name: 'Peta Risiko', path: PATHS.PUBLIC.MAP, icon: Map },
    { name: 'Kejadian Bencana', path: PATHS.PUBLIC.DISASTERS, icon: Activity },
    { name: 'Peringatan Dini', path: PATHS.PUBLIC.WARNINGS, icon: AlertTriangle },
    { name: 'Kesiapsiagaan', path: PATHS.PUBLIC.PREPAREDNESS, icon: Compass },
    { name: 'Shelter', path: PATHS.PUBLIC.SHELTERS, icon: Home },
    { name: 'Edukasi', path: PATHS.PUBLIC.EDUCATION, icon: BookOpen },
    { name: 'Lapor Bencana', path: PATHS.PUBLIC.REPORT, icon: AlertCircle },
    { name: 'Tentang', path: PATHS.PUBLIC.ABOUT, icon: Info },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] text-[#111827] selection:bg-[#D1FAE5] selection:text-[#065F46]">
      {/* Top Telemetry Ticker / System Status */}
      <div className="bg-[#FAFAFA] border-b border-[#F0F0F0] py-1.5 px-4 text-[11px] text-[#6B7280]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 font-medium text-[#047857]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#059669]"></span>
              </span>
              Sistem Aktif
            </span>
            <span className="hidden sm:inline text-[#E5E7EB]">•</span>
            <span className="hidden sm:inline text-[#6B7280]">
              Data Terpadu: BMKG, BNPB, PVMBG, Copernicus
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              to={PATHS.USER.DASHBOARD} 
              className="hover:text-[#111827] transition-colors"
            >
              Area Warga
            </Link>
            <Link 
              to={PATHS.ADMIN.DASHBOARD} 
              className="hover:text-[#111827] transition-colors"
            >
              Portal Admin
            </Link>
            <Link 
              to={PATHS.INTELLIGENCE.OVERVIEW} 
              className="text-[#B45309] hover:text-[#92400E] flex items-center gap-1 font-medium transition-colors"
            >
              <Radio className="w-3 h-3 text-[#D97706]" />
              Intelligence Center
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#F3F4F6] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link to={PATHS.PUBLIC.HOME} className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 rounded-lg bg-[#047857] flex items-center justify-center text-white shadow-xs transition-transform group-hover:scale-105">
              <Shield className="w-4.5 h-4.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-extrabold tracking-tight text-[#111827] leading-tight">SENTRAVAX</span>
              <span className="text-[9.5px] tracking-wider text-[#047857] uppercase font-semibold leading-none">
                Kesiapsiagaan Bencana
              </span>
            </div>
          </Link>

          {/* Desktop Navigation - Minimalist, text-first, breathing space */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive =
                location.pathname === link.path ||
                (link.path !== '/' && location.pathname.startsWith(link.path + '/'));
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                    isActive
                      ? 'bg-[#ECFDF5] text-[#047857] font-semibold'
                      : 'text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6]/80'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Quick Actions / Auth */}
          <div className="flex items-center gap-2 shrink-0">
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#047857] border border-[#A7F3D0]/60 transition-colors"
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
              <div className="flex items-center gap-1.5">
                <Link
                  to={PATHS.USER.DASHBOARD}
                  className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors"
                >
                  Portal Warga
                </Link>
                <Link
                  to={PATHS.PUBLIC.LOGIN}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-[#047857] hover:bg-[#065F46] text-white shadow-xs transition-all hover:shadow-sm"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Masuk</span>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#4B5563] hover:text-[#111827] rounded-lg hover:bg-[#F3F4F6] min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors"
              aria-label="Buka menu navigasi"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#FFFFFF] border-b border-[#E5E7EB] px-4 pt-3 pb-5 space-y-1 shadow-lg">
            <div className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider px-3 py-1">
              Navigasi Publik
            </div>
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                location.pathname === link.path ||
                (link.path !== '/' && location.pathname.startsWith(link.path + '/'));
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#ECFDF5] text-[#047857] font-bold'
                      : 'text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#111827]'
                  }`}
                >
                  <Icon className="w-4 h-4 text-[#047857]" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
            <div className="pt-3 mt-2 border-t border-[#F3F4F6] flex flex-col gap-2">
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
              Platform Intelijen Bencana Multi-Bahaya dan Sistem Peringatan Dini Indonesia berbasis Geospatial Intelligence dan data terbuka.
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
