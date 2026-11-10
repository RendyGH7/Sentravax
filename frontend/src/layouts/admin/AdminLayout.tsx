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
    { name: 'Audit & Log Sistem', path: PATHS.ADMIN.AUDIT_LOGS, icon: ScrollText },
  ];

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 flex selection:bg-amber-500/30 selection:text-amber-200">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Admin Sidebar */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#080E1B] border-r border-white/10 flex flex-col transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/10 bg-[#0A1324]/60">
          <Link to={PATHS.ADMIN.DASHBOARD} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-wide text-white">SENTRAVAX</span>
              <span className="block text-[9px] font-mono uppercase text-amber-400 tracking-wider">Admin Console</span>
            </div>
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Super Admin Badge */}
        <div className="p-3 mx-3 my-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono text-amber-400 font-semibold block">Akses Otoritas</span>
            <span className="text-xs font-semibold text-white">Super Administrator</span>
          </div>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300">
            ROOT
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
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Link */}
        <div className="p-3 border-t border-white/10 space-y-1">
          <Link
            to={PATHS.INTELLIGENCE.OVERVIEW}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
          >
            <Radio className="w-4 h-4" />
            Ke Intelligence Center
          </Link>
          <Link
            to={PATHS.PUBLIC.HOME}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Portal Publik
          </Link>
        </div>
      </aside>

      {/* Main Admin Content */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-16 bg-[#080E1B]/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-400 w-72">
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span>Cari user, laporan, audit log...</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-400 bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
              <Cpu className="w-3 h-3 text-emerald-400" />
              <span>Health: 99.8% (PostGIS Aktif)</span>
            </div>
            <button className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 relative">
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-1.5 right-1.5"></span>
            </button>
          </div>
        </header>

        {/* Admin Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

