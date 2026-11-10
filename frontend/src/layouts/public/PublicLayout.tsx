import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
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
  CheckCircle2
} from 'lucide-react';

const currentYear = new Date().getFullYear();

export const PublicLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Beranda', path: PATHS.PUBLIC.HOME, icon: Shield },
    { name: 'Peta Risiko', path: PATHS.PUBLIC.MAP, icon: Map },
    { name: 'Kejadian Bencana', path: PATHS.PUBLIC.DISASTERS, icon: Activity },
    { name: 'Peringatan Dini', path: PATHS.PUBLIC.WARNINGS, icon: AlertTriangle },
    { name: 'Kesiapsiagaan', path: PATHS.PUBLIC.PREPAREDNESS, icon: Compass },
    { name: 'Edukasi', path: PATHS.PUBLIC.EDUCATION, icon: BookOpen },
    { name: 'Tentang', path: PATHS.PUBLIC.ABOUT, icon: Info },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFFFF] text-[#202428] selection:bg-[#EAF1F5] selection:text-[#245B78]">
      {/* Top Telemetry Ticker / System Status */}
      <div className="bg-[#F5F6F7] border-b border-[#E2E5E8] py-2 px-4 text-xs font-mono text-[#596168]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 text-[#28734D] font-semibold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              STATUS SISTEM: AKTIF
            </span>
            <span className="hidden md:inline text-[#D0D4D8]">|</span>
            <span className="hidden md:inline text-[#596168]">
              Integrasi Terhubung: BMKG, BNPB, PVMBG, Copernicus
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <Link 
              to={PATHS.USER.DASHBOARD} 
              className="text-[#245B78] hover:text-[#1D4B64] font-medium transition-colors"
            >
              Area Warga
            </Link>
            <Link 
              to={PATHS.ADMIN.DASHBOARD} 
              className="text-[#596168] hover:text-[#202428] transition-colors"
            >
              Portal Admin
            </Link>
            <Link 
              to={PATHS.INTELLIGENCE.OVERVIEW} 
              className="text-[#596168] hover:text-[#202428] flex items-center gap-1 transition-colors"
            >
              <Radio className="w-3 h-3 text-[#245B78]" />
              Intelligence Center
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-[#FFFFFF]/95 backdrop-blur-sm border-b border-[#E2E5E8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to={PATHS.PUBLIC.HOME} className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-[#245B78] flex items-center justify-center text-white transition-transform group-hover:scale-105">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-[#202428]">SENTRAVAX</span>
              <span className="hidden sm:block text-[10px] tracking-wider text-[#596168] font-mono uppercase -mt-0.5">
                Kesiapsiagaan Bencana
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#EAF1F5] text-[#245B78] font-semibold'
                      : 'text-[#596168] hover:text-[#202428] hover:bg-[#F5F6F7]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Quick Actions / Auth */}
          <div className="flex items-center gap-2">
            <Link
              to={PATHS.USER.DASHBOARD}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-[#F5F6F7] hover:bg-[#EAECEE] text-[#202428] border border-[#E2E5E8] transition-colors"
            >
              <User className="w-3.5 h-3.5 text-[#245B78]" />
              Portal Warga
            </Link>
            <Link
              to={PATHS.PUBLIC.LOGIN}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#245B78] hover:bg-[#1D4B64] text-white transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              Masuk
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 text-[#596168] hover:text-[#202428] rounded-lg hover:bg-[#F5F6F7] min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Buka menu navigasi"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#FFFFFF] border-b border-[#E2E5E8] px-4 pt-2 pb-4 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'bg-[#EAF1F5] text-[#245B78] font-semibold'
                      : 'text-[#596168] hover:bg-[#F5F6F7] hover:text-[#202428]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.name}
                </Link>
              );
            })}
            <div className="pt-2 border-t border-[#E2E5E8] grid grid-cols-2 gap-2">
              <Link
                to={PATHS.USER.DASHBOARD}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium bg-[#F5F6F7] text-[#202428] border border-[#E2E5E8]"
              >
                <User className="w-3.5 h-3.5 text-[#245B78]" />
                Portal Warga
              </Link>
              <Link
                to={PATHS.INTELLIGENCE.OVERVIEW}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium bg-[#111111] text-[#F2F2F2]"
              >
                <Radio className="w-3.5 h-3.5 text-[#A9C2D1]" />
                Intelligence
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Page Area */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Public Footer */}
      <footer className="bg-[#F5F6F7] border-t border-[#E2E5E8] text-[#596168] py-12 px-4 sm:px-6 lg:px-8 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded bg-[#245B78] flex items-center justify-center text-white">
                <Shield className="w-4 h-4" />
              </div>
              <span className="font-bold text-[#202428] tracking-tight text-sm">SENTRAVAX</span>
            </div>
            <p className="text-[#596168] leading-relaxed mb-3">
              Platform Intelijen Bencana Multi-Bahaya dan Sistem Peringatan Dini Indonesia berbasis Geospatial Intelligence dan data terbuka.
            </p>
            <span className="inline-block px-2.5 py-1 rounded text-[11px] font-mono bg-[#EAF1F5] text-[#245B78] border border-[#D0DFE7]">
              Sistem Kesiapsiagaan Publik
            </span>
          </div>

          <div>
            <h4 className="text-[#202428] font-semibold mb-3 text-xs uppercase tracking-wider">Akses Publik</h4>
            <ul className="space-y-2">
              <li><Link to={PATHS.PUBLIC.MAP} className="hover:text-[#245B78] transition-colors">Peta Risiko Interaktif</Link></li>
              <li><Link to={PATHS.PUBLIC.DISASTERS} className="hover:text-[#245B78] transition-colors">Katalog Bencana Terkini</Link></li>
              <li><Link to={PATHS.PUBLIC.WARNINGS} className="hover:text-[#245B78] transition-colors">Peringatan Dini Resmi</Link></li>
              <li><Link to={PATHS.PUBLIC.PREPAREDNESS} className="hover:text-[#245B78] transition-colors">Panduan Tanggap Darurat</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[#202428] font-semibold mb-3 text-xs uppercase tracking-wider">Area Operasional</h4>
            <ul className="space-y-2">
              <li><Link to={PATHS.USER.DASHBOARD} className="hover:text-[#245B78] transition-colors">Portal Warga Terdaftar</Link></li>
              <li><Link to={PATHS.ADMIN.DASHBOARD} className="hover:text-[#245B78] transition-colors">Konsol Administrator</Link></li>
              <li><Link to={PATHS.INTELLIGENCE.OVERVIEW} className="hover:text-[#245B78] transition-colors">Disaster Intelligence Center</Link></li>
              <li><Link to={PATHS.PUBLIC.ABOUT} className="hover:text-[#245B78] transition-colors">Tentang Proyek SENTRAVAX</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[#202428] font-semibold mb-3 text-xs uppercase tracking-wider">Sumber Data Otoritatif</h4>
            <p className="text-[#737C83] leading-relaxed mb-2">
              Data terintegrasi dari BMKG, BNPB, PVMBG, OpenStreetMap, dan pelaporan masyarakat terverifikasi.
            </p>
            <p className="text-[#737C83] text-[11px]">
              &copy; {currentYear} SENTRAVAX Project. Seluruh hak cipta dilindungi.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
