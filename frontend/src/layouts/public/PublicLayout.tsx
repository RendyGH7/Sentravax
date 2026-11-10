import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
import { Shield, Map, AlertTriangle, BookOpen, Info, LogIn, Menu, X, Activity, Radio, User, Compass } from 'lucide-react';

const currentYear = new Date().getFullYear();

export const PublicLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Beranda', path: PATHS.PUBLIC.HOME, icon: Shield },
    { name: 'Peta Interaktif', path: PATHS.PUBLIC.MAP, icon: Map },
    { name: 'Kejadian Bencana', path: PATHS.PUBLIC.DISASTERS, icon: Activity },
    { name: 'Peringatan Dini', path: PATHS.PUBLIC.WARNINGS, icon: AlertTriangle },
    { name: 'Kesiapsiagaan', path: PATHS.PUBLIC.PREPAREDNESS, icon: Compass },
    { name: 'Edukasi', path: PATHS.PUBLIC.EDUCATION, icon: BookOpen },
    { name: 'Tentang', path: PATHS.PUBLIC.ABOUT, icon: Info },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#070A13] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Telemetry Ticker / System Status */}
      <div className="bg-[#0C1A22] border-b border-white/5 py-1.5 px-4 text-xs font-mono text-slate-400">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              SISTEM AKTIF
            </span>
            <span className="hidden md:inline text-slate-600">|</span>
            <span className="hidden md:inline text-slate-400">
              Integrasi Data: BMKG, BNPB, PVMBG, Copernicus
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-slate-500">Mode: Kesiapsiagaan Publik</span>
            <Link 
              to={PATHS.INTELLIGENCE.OVERVIEW} 
              className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 text-[11px]"
            >
              <Radio className="w-3 h-3" />
              Intelligence Center
            </Link>
            <Link 
              to={PATHS.ADMIN.DASHBOARD} 
              className="text-amber-400 hover:text-amber-300 transition-colors text-[11px]"
            >
              Portal Admin
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-[#070A13]/85 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to={PATHS.PUBLIC.HOME} className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-wider text-white">SENTRAVAX</span>
              <span className="hidden sm:block text-[10px] tracking-widest text-cyan-400 font-mono -mt-1 uppercase">
                Disaster Intelligence
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
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
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-colors"
            >
              <User className="w-3.5 h-3.5 text-cyan-400" />
              Area Warga
            </Link>
            <Link
              to={PATHS.PUBLIC.LOGIN}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-sm shadow-cyan-500/25 transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              Masuk
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-md hover:bg-white/5"
              aria-label="Buka menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#0C1A22] border-b border-white/10 px-4 pt-2 pb-4 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.name}
                </Link>
              );
            })}
            <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2">
              <Link
                to={PATHS.USER.DASHBOARD}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-1 px-3 py-2 rounded-md text-xs font-medium bg-white/5 text-slate-200"
              >
                <User className="w-3.5 h-3.5 text-cyan-400" />
                Area Warga
              </Link>
              <Link
                to={PATHS.INTELLIGENCE.OVERVIEW}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-1 px-3 py-2 rounded-md text-xs font-medium bg-cyan-950/40 text-cyan-300 border border-cyan-800/40"
              >
                <Radio className="w-3.5 h-3.5" />
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
      <footer className="bg-[#050810] border-t border-white/5 text-slate-400 py-10 px-4 sm:px-6 lg:px-8 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-cyan-400" />
              <span className="font-bold text-white tracking-wider text-sm">SENTRAVAX</span>
            </div>
            <p className="text-slate-400 leading-relaxed mb-3">
              Platform Intelijen Bencana Multi-Bahaya dan Sistem Peringatan Dini Indonesia berbasis Geospatial Intelligence & AI.
            </p>
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/50">
              v1.0.0 • Phase 2 Foundation
            </span>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Akses Publik</h4>
            <ul className="space-y-2">
              <li><Link to={PATHS.PUBLIC.MAP} className="hover:text-cyan-400 transition-colors">Peta Risiko Interaktif</Link></li>
              <li><Link to={PATHS.PUBLIC.DISASTERS} className="hover:text-cyan-400 transition-colors">Katalog Bencana Terkini</Link></li>
              <li><Link to={PATHS.PUBLIC.WARNINGS} className="hover:text-cyan-400 transition-colors">Peringatan Dini Resmi</Link></li>
              <li><Link to={PATHS.PUBLIC.PREPAREDNESS} className="hover:text-cyan-400 transition-colors">Panduan Tanggap Darurat</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Area Aplikasi</h4>
            <ul className="space-y-2">
              <li><Link to={PATHS.USER.DASHBOARD} className="hover:text-cyan-400 transition-colors">Portal Warga / Pelaporan</Link></li>
              <li><Link to={PATHS.ADMIN.DASHBOARD} className="hover:text-amber-400 transition-colors">Admin Dashboard</Link></li>
              <li><Link to={PATHS.INTELLIGENCE.OVERVIEW} className="hover:text-cyan-400 transition-colors">Disaster Intelligence Center</Link></li>
              <li><Link to={PATHS.PUBLIC.ABOUT} className="hover:text-cyan-400 transition-colors">Tentang Proyek SENTRAVAX</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Sumber Data Resmi</h4>
            <p className="text-slate-500 leading-relaxed mb-2">
              Data diolah dari BMKG, BNPB, PVMBG, OpenStreetMap, dan laporan warga terverifikasi.
            </p>
            <p className="text-slate-600 text-[11px]">
              &copy; {currentYear} SENTRAVAX Project. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
