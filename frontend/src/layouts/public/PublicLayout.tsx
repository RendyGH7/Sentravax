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
  CheckCircle2,
  LogOut
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
    { name: 'Edukasi', path: PATHS.PUBLIC.EDUCATION, icon: BookOpen },
    { name: 'Tentang', path: PATHS.PUBLIC.ABOUT, icon: Info },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] text-[#111827] selection:bg-[#D1FAE5] selection:text-[#065F46]">
      {/* Top Telemetry Ticker / System Status */}
      <div className="bg-[#FFFFFF] border-b border-[#E5E7EB] py-2 px-4 text-xs font-mono text-[#4B5563]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 text-[#047857] font-bold text-[11px] bg-[#ECFDF5] border border-[#A7F3D0] px-2.5 py-0.5 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              STATUS SISTEM: AKTIF
            </span>
            <span className="hidden md:inline text-[#D1D5DB]">|</span>
            <span className="hidden md:inline text-[#4B5563]">
              Integrasi Terhubung: BMKG, BNPB, PVMBG, Copernicus
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <Link 
              to={PATHS.USER.DASHBOARD} 
              className="text-[#047857] hover:text-[#065F46] font-bold transition-colors"
            >
              Area Warga
            </Link>
            <Link 
              to={PATHS.ADMIN.DASHBOARD} 
              className="text-[#4B5563] hover:text-[#111827] font-semibold transition-colors"
            >
              Portal Admin
            </Link>
            <Link 
              to={PATHS.INTELLIGENCE.OVERVIEW} 
              className="text-[#D97706] hover:text-[#B45309] flex items-center gap-1 font-bold transition-colors"
            >
              <Radio className="w-3 h-3 text-[#D97706]" />
              Intelligence Center
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#E5E7EB] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to={PATHS.PUBLIC.HOME} className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-[#047857] flex items-center justify-center text-white shadow-xs transition-transform group-hover:scale-105">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-[#111827]">SENTRAVAX</span>
              <span className="hidden sm:block text-[10px] tracking-wider text-[#047857] font-mono uppercase font-bold -mt-0.5">
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
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#ECFDF5] text-[#047857] font-bold border border-[#A7F3D0]'
                      : 'text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Quick Actions / Auth */}
          <div className="flex items-center gap-2.5">
            {isAuthenticated && user ? (
              <>
                <Link
                  to={
                    user.role === 'admin' || user.role === 'super_admin'
                      ? PATHS.ADMIN.DASHBOARD
                      : user.role === 'analyst' || user.role === 'operator'
                      ? PATHS.INTELLIGENCE.OVERVIEW
                      : PATHS.USER.DASHBOARD
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#047857] border border-[#A7F3D0] transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-[#047857]" />
                  <span>{user.name.split(' ')[0]} ({user.role})</span>
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
                  aria-label="Keluar sesi"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to={PATHS.USER.DASHBOARD}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FFFFFF] hover:bg-[#F3F4F6] text-[#111827] border border-[#D1D5DB] transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-[#047857]" />
                  Portal Warga
                </Link>
                <Link
                  to={PATHS.PUBLIC.LOGIN}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#047857] hover:bg-[#065F46] text-white shadow-xs transition-all"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Masuk
                </Link>
              </>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#4B5563] hover:text-[#111827] rounded-lg hover:bg-[#F3F4F6] min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Buka menu navigasi"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#FFFFFF] border-b border-[#E5E7EB] px-4 pt-2 pb-4 space-y-1">
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
                      ? 'bg-[#ECFDF5] text-[#047857] font-bold border border-[#A7F3D0]'
                      : 'text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#111827]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.name}
                </Link>
              );
            })}
            <div className="pt-2 border-t border-[#E5E7EB] grid grid-cols-2 gap-2">
              <Link
                to={PATHS.USER.DASHBOARD}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-bold bg-[#F9FAFB] text-[#111827] border border-[#D1D5DB]"
              >
                <User className="w-3.5 h-3.5 text-[#047857]" />
                Portal Warga
              </Link>
              <Link
                to={PATHS.INTELLIGENCE.OVERVIEW}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-bold bg-[#161616] text-white"
              >
                <Radio className="w-3.5 h-3.5 text-[#F59E0B]" />
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
