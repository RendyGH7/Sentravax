import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
import { 
  ShieldAlert, 
  LayoutDashboard, 
  Users, 
  FileCheck2, 
  Flame, 
  AlertTriangle, 
  BookOpen, 
  Database, 
  ScrollText, 
  ArrowLeft, 
  Menu, 
  X, 
  Search,
  Bell,
  Cpu,
  Radio
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard Sistem', path: PATHS.ADMIN.DASHBOARD, icon: LayoutDashboard },
    { name: 'Manajemen Pengguna', path: PATHS.ADMIN.USERS, icon: Users },
    { name: 'Verifikasi Laporan', path: PATHS.ADMIN.REPORTS, icon: FileCheck2 },
    { name: 'Data Kejadian', path: PATHS.ADMIN.DISASTERS, icon: Flame },
    { name: 'Peringatan Dini', path: PATHS.ADMIN.ALERTS, icon: AlertTriangle },
    { name: 'Konten Edukasi', path: PATHS.ADMIN.EDUCATION, icon: BookOpen },
    { name: 'Sumber Data API', path: PATHS.ADMIN.DATA_SOURCES, icon: Database },
    { name: 'Audit dan Log Sistem', path: PATHS.ADMIN.AUDIT_LOGS, icon: ScrollText },
  ];

  return (
    <div className="min-h-screen bg-[#111111] text-[#F2F2F2] flex selection:bg-[#283139] selection:text-[#A9C2D1]">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Admin Sidebar */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#191919] border-r border-[#343434] flex flex-col transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[#343434] bg-[#151515]">
          <Link to={PATHS.ADMIN.DASHBOARD} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#222222] border border-[#343434] flex items-center justify-center text-[#D2A45E]">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-[#F2F2F2]">SENTRAVAX</span>
              <span className="block text-[10px] font-mono uppercase text-[#B8B8B8] tracking-wider">Konsol Admin</span>
            </div>
          </Link>
          <button 
            type="button"
            onClick={() => setSidebarOpen(false)} 
            className="lg:hidden text-[#929292] hover:text-[#F2F2F2] p-1.5 rounded"
            aria-label="Tutup menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Super Admin Badge */}
        <div className="p-3 mx-3 my-3 rounded-lg bg-[#222222] border border-[#343434] flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono text-[#D2A45E] font-semibold block">Tingkat Hak Akses</span>
            <span className="text-xs font-semibold text-[#F2F2F2]">Super Administrator</span>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-[#191919] border border-[#343434] text-[#A9C2D1]">
            OTORITAS
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#283139] text-[#A9C2D1] border border-[#3A4550] font-semibold'
                    : 'text-[#B8B8B8] hover:text-[#F2F2F2] hover:bg-[#222222]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#A9C2D1]' : 'text-[#929292]'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Link */}
        <div className="p-3 border-t border-[#343434] space-y-1 bg-[#151515]">
          <Link
            to={PATHS.INTELLIGENCE.OVERVIEW}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[#A9C2D1] hover:text-white hover:bg-[#222222] transition-colors"
          >
            <Radio className="w-4 h-4" />
            Ke Intelligence Center
          </Link>
          <Link
            to={PATHS.PUBLIC.HOME}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[#929292] hover:text-[#F2F2F2] hover:bg-[#222222] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Portal Publik
          </Link>
        </div>
      </aside>

      {/* Main Admin Content */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-16 bg-[#191919] border-b border-[#343434] sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-[#929292] hover:text-[#F2F2F2] rounded-lg hover:bg-[#222222] min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Buka menu navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-[#222222] border border-[#343434] text-xs text-[#929292] w-72">
              <Search className="w-3.5 h-3.5 text-[#929292]" />
              <span>Cari user, laporan, audit log...</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-[#B8B8B8] bg-[#222222] px-3 py-1.5 rounded-md border border-[#343434]">
              <Cpu className="w-3.5 h-3.5 text-[#70A987]" />
              <span>Sistem: PostGIS Aktif (Latensi 42ms)</span>
            </div>
            <button 
              type="button"
              className="p-2 text-[#929292] hover:text-[#F2F2F2] rounded-lg hover:bg-[#222222] relative"
              aria-label="Notifikasi admin"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-[#D2A45E] absolute top-1.5 right-1.5"></span>
            </button>
          </div>
        </header>

        {/* Admin Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto bg-[#141414]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
