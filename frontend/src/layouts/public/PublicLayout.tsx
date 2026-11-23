import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
import { useAuth } from '../../app/context/useAuth';
import {
  Shield,
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
  Radio,
  Smartphone,
  QrCode,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

const currentYear = new Date().getFullYear();

// Reusable Official Google Play Store Badge
const GooglePlayBadge: React.FC<{ className?: string }> = ({ className = '' }) => (
  <button
    type="button"
    onClick={() => {
      toast.info('Aplikasi SENTRAVAX Siaga di Google Play Store (Akses Publik / Unduh APK Siaga)');
    }}
    className={`inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#111827] hover:bg-[#1F2937] text-white border border-[#374151] transition-all shadow-xs group text-left cursor-pointer ${className}`}
    title="Temukan di Google Play"
  >
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M3.6 2.3c-.3.3-.4.7-.4 1.2v17c0 .5.1.9.4 1.2l9.6-9.7L3.6 2.3z" />
      <path fill="#34A853" d="M17.1 15.8l-3.9-3.8-9.6 9.7c.3.1.6.2.9.2.4 0 .9-.1 1.3-.4l11.3-6.5-.4-.2z" />
      <path fill="#EA4335" d="M13.2 12l3.9-3.8-11.3-6.5c-.4-.3-.9-.4-1.3-.4-.3 0-.6.1-.9.2l9.6 10.5z" />
      <path fill="#FBBC04" d="M20.4 10.6l-3.3-1.9-3.9 3.3 3.9 3.8 3.3-1.9c.7-.4 1.1-1.1 1.1-1.6s-.4-1.3-1.1-1.7z" />
    </svg>
    <div className="leading-none">
      <span className="text-[9px] uppercase tracking-wider text-gray-400 block font-medium">TEMUKAN DI</span>
      <span className="text-xs font-bold text-white tracking-wide block mt-0.5">Google Play</span>
    </div>
  </button>
);

// Reusable Official Apple App Store Badge
const AppStoreBadge: React.FC<{ className?: string }> = ({ className = '' }) => (
  <button
    type="button"
    onClick={() => {
      toast.info('Aplikasi SENTRAVAX Siaga di Apple App Store (TestFlight Publik / iOS)');
    }}
    className={`inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#111827] hover:bg-[#1F2937] text-white border border-[#374151] transition-all shadow-xs group text-left cursor-pointer ${className}`}
    title="Unduh di App Store"
  >
    <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.65 1.35-.58.67-1.09 1.74-.95 2.77.99.08 2.06-.52 2.68-1.27z" />
    </svg>
    <div className="leading-none">
      <span className="text-[9px] uppercase tracking-wider text-gray-400 block font-medium">Unduh di</span>
      <span className="text-xs font-bold text-white tracking-wide block mt-0.5">App Store</span>
    </div>
  </button>
);

export const PublicLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const isHomeActive = location.pathname === PATHS.PUBLIC.HOME;
  const isMapActive = location.pathname.startsWith(PATHS.PUBLIC.MAP);
  const isPantauanActive =
    location.pathname.startsWith(PATHS.PUBLIC.DISASTERS) ||
    location.pathname.startsWith(PATHS.PUBLIC.WARNINGS);
  const isSiagaActive = location.pathname.startsWith(PATHS.PUBLIC.PREPAREDNESS);
  const isShelterActive = location.pathname.startsWith(PATHS.PUBLIC.SHELTERS);

  const navLinks = [
    { label: 'Beranda', to: PATHS.PUBLIC.HOME, active: isHomeActive },
    { label: 'Peta Risiko', to: PATHS.PUBLIC.MAP, active: isMapActive },
    { label: 'Pantauan Bencana', to: PATHS.PUBLIC.DISASTERS, active: isPantauanActive },
    { label: 'Siaga 72 Jam', to: PATHS.PUBLIC.PREPAREDNESS, active: isSiagaActive },
    { label: 'Direktori Shelter', to: PATHS.PUBLIC.SHELTERS, active: isShelterActive },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] text-[#111827] selection:bg-[#D1FAE5] selection:text-[#065F46]">
      {/* ========================================================================= */}
      {/* 1. PROFESSIONAL & ELEGANT UNIFIED NAVBAR                                   */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] shadow-2xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Brand Logo & Platform Title */}
          <Link to={PATHS.PUBLIC.HOME} className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#047857] to-[#065F46] flex items-center justify-center text-white shadow-xs transition-transform group-hover:scale-105 ring-1 ring-emerald-600/20">
              <Shield className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-[15px] font-extrabold tracking-tight text-[#111827]">
                  SENTRAVAX
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[9px] font-mono font-bold text-[#047857]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
                  LIVE
                </span>
              </div>
              <span className="text-[10px] text-gray-500 font-medium tracking-tight -mt-0.5 hidden sm:block">
                Kesiapsiagaan Bencana Nasional
              </span>
            </div>
          </Link>

          {/* Desktop Navigation - Clean, Typographic, Balanced */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className={`px-3.5 py-1.5 rounded-xl text-[13px] transition-all ${
                  item.active
                    ? 'text-[#047857] bg-[#ECFDF5] font-bold shadow-2xs'
                    : 'text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6] font-medium'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Action Tools: Download App, Lapor, Auth */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Download Mobile App Button (Play Store & App Store Modal Trigger) */}
            <button
              type="button"
              onClick={() => setDownloadModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 hover:text-gray-950 border border-gray-200/90 transition-all shadow-2xs group cursor-pointer"
              title="Unduh Aplikasi SENTRAVAX di Play Store & App Store"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#047857] group-hover:scale-110 transition-transform" />
              <span>Unduh Aplikasi</span>
              <span className="hidden xl:inline-block text-[10px] font-mono font-bold text-[#047857] bg-emerald-100/70 px-1.5 py-0.2 rounded">
                App
              </span>
            </button>

            {/* Quick Report Tool */}
            <Link
              to={PATHS.PUBLIC.REPORT}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA] transition-colors shadow-2xs"
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
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#047857] border border-[#A7F3D0]/60 transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-[#047857]" />
                  <span>{user.name.split(' ')[0]}</span>
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="p-1.5 rounded-xl text-[#9CA3AF] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                  title="Keluar sesi"
                  aria-label="Keluar sesi"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to={PATHS.PUBLIC.LOGIN}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold bg-[#047857] hover:bg-[#065F46] text-white shadow-xs transition-all hover:shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk</span>
              </Link>
            )}

            {/* More Menu Dropdown for authority & portals */}
            <div className="relative group hidden sm:block">
              <button
                type="button"
                className="p-2 rounded-xl text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                title="Menu Portal & Otoritas"
                aria-label="Menu Portal & Otoritas"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              <div className="absolute top-full right-0 pt-2 hidden group-hover:block group-focus-within:block z-50">
                <div className="w-56 rounded-2xl bg-white border border-[#E5E7EB] shadow-xl p-2 space-y-1">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 py-1">
                    Informasi &amp; Edukasi
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

            {/* Mobile menu hamburger button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#4B5563] hover:text-[#111827] rounded-xl hover:bg-[#F3F4F6] min-w-[38px] min-h-[38px] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Buka menu navigasi"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-[#E5E7EB] px-4 pt-3 pb-6 space-y-4 shadow-lg animate-in slide-in-from-top-2 duration-200">
            {/* Core Tools */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider px-3 py-1">
                Navigasi Utama
              </div>
              {navLinks.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    item.active
                      ? 'bg-[#ECFDF5] text-[#047857] font-bold'
                      : 'text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#111827]'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.active && <span className="w-1.5 h-1.5 rounded-full bg-[#047857]" />}
                </Link>
              ))}
            </div>

            {/* Mobile Download App Banner Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border border-[#A7F3D0] space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#047857] text-white flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Aplikasi SENTRAVAX Siaga</h4>
                  <p className="text-[10px] text-gray-500">Tersedia di Play Store &amp; App Store</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <GooglePlayBadge className="justify-center py-1.5 px-2" />
                <AppStoreBadge className="justify-center py-1.5 px-2" />
              </div>
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

      {/* ========================================================================= */}
      {/* 2. APP STORE & PLAY STORE DOWNLOAD MODAL (Interactive & High-End)         */}
      {/* ========================================================================= */}
      {downloadModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setDownloadModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative space-y-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-download-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setDownloadModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Tutup jendela unduh aplikasi"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Heading */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#047857] flex items-center justify-center mx-auto shadow-xs border border-emerald-100">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 id="modal-download-title" className="text-xl font-extrabold text-gray-900 tracking-tight">
                Unduh Aplikasi SENTRAVAX Siaga
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                Peringatan dini gempa dan cuaca BMKG lebih cepat, peta evakuasi offline, serta tombol bantuan darurat langsung di genggaman Anda.
              </p>
            </div>

            {/* Official Store Badges */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <GooglePlayBadge className="w-full sm:w-auto justify-center" />
              <AppStoreBadge className="w-full sm:w-auto justify-center" />
            </div>

            {/* QR Code Quick Scan Box */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 flex items-center gap-4">
              <div className="p-2 bg-white rounded-xl border border-gray-200 shadow-2xs shrink-0">
                <QrCode className="w-14 h-14 text-gray-900" />
              </div>
              <div className="space-y-1 text-xs">
                <span className="font-bold text-gray-900 block">Pindai Kode QR</span>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Arahkan kamera ponsel Anda ke kode QR untuk mengunduh aplikasi secara langsung di Google Play atau App Store.
                </p>
                <span className="text-[10px] font-mono text-[#047857] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#047857]" /> Kompatibel Android 8.0+ &amp; iOS 15.0+
                </span>
              </div>
            </div>

            {/* Key Advantages */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 border-t border-gray-100 pt-3">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#047857] shrink-0" />
                <span>Notifikasi Cepat &lt;5 Detik</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#047857] shrink-0" />
                <span>Peta Offline &amp; Shelter</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#047857] shrink-0" />
                <span>1-Tap Telepon Darurat 112</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#047857] shrink-0" />
                <span>100% Gratis &amp; Tanpa Iklan</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Page Area */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ========================================================================= */}
      {/* 3. PUBLIC FOOTER WITH APP STORE & PLAY STORE DOWNLOAD BADGES              */}
      {/* ========================================================================= */}
      <footer className="bg-white border-t border-[#E5E7EB] text-[#4B5563] py-12 px-4 sm:px-6 lg:px-8 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand & Mobile App Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#047857] flex items-center justify-center text-white">
                <Shield className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-[#111827] tracking-tight text-sm">SENTRAVAX</span>
            </div>
            <p className="text-[#4B5563] leading-relaxed">
              Platform Intelijen Geospasial &amp; Kesiapsiagaan Bencana Multi-Hazard berbasis sains data terbuka nasional.
            </p>
            <div className="pt-1 space-y-2">
              <span className="text-[11px] font-bold text-gray-900 block">Unduh Aplikasi Mobile:</span>
              <div className="flex flex-col sm:flex-row gap-2">
                <GooglePlayBadge className="py-1 px-2.5" />
                <AppStoreBadge className="py-1 px-2.5" />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-[#111827] font-bold mb-3 text-xs uppercase tracking-wider">Akses Publik</h4>
            <ul className="space-y-2">
              <li><Link to={PATHS.PUBLIC.HOME} className="hover:text-[#047857] transition-colors">Beranda Utama</Link></li>
              <li><Link to={PATHS.PUBLIC.MAP} className="hover:text-[#047857] transition-colors">Peta Risiko Interaktif</Link></li>
              <li><Link to={PATHS.PUBLIC.DISASTERS} className="hover:text-[#047857] transition-colors">Katalog Bencana Terkini</Link></li>
              <li><Link to={PATHS.PUBLIC.WARNINGS} className="hover:text-[#047857] transition-colors">Peringatan Dini Resmi</Link></li>
              <li><Link to={PATHS.PUBLIC.PREPAREDNESS} className="hover:text-[#047857] transition-colors">Panduan Tanggap Darurat</Link></li>
              <li><Link to={PATHS.PUBLIC.SHELTERS} className="hover:text-[#047857] transition-colors">Direktori Shelter</Link></li>
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
