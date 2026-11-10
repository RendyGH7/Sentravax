import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
import { 
  Shield, 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  MapPin, 
  Bell, 
  Settings, 
  LogOut, 
  ArrowLeft,
  Menu,
  X,
  UserCheck
} from 'lucide-react';

export const UserLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: PATHS.USER.DASHBOARD, icon: LayoutDashboard },
    { name: 'Laporan Saya', path: PATHS.USER.REPORTS, icon: FileText },
    { name: 'Buat Laporan', path: PATHS.USER.CREATE_REPORT, icon: PlusCircle },
    { name: 'Wilayah Pantauan', path: PATHS.USER.REGIONS, icon: MapPin },
    { name: 'Notifikasi', path: PATHS.USER.NOTIFICATIONS, icon: Bell },
    { name: 'Pengaturan', path: PATHS.USER.SETTINGS, icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#070A13] text-slate-100 flex">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0A101D] border-r border-white/10 flex flex-col transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/10 bg-[#0C1527]/50">
          <Link to={PATHS.USER.DASHBOARD} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
              <Shield className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-wide text-white">SENTRAVAX</span>
              <span className="block text-[9px] font-mono uppercase text-cyan-400">Portal Warga</span>
            </div>
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Mini Profile Card */}
        <div className="p-4 mx-3 my-3 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-cyan-600/30 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-bold text-xs">
              WP
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-semibold text-white truncate">Warga Terverifikasi</h4>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                <UserCheck className="w-3 h-3" /> Akun Warga Aktif
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-white/10 space-y-1">
          <Link
            to={PATHS.PUBLIC.HOME}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Portal Publik
          </Link>
          <Link
            to={PATHS.PUBLIC.LOGIN}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Keluar Akun
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-16 bg-[#0A101D]/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <h2 className="text-sm font-semibold text-white tracking-wide">Portal Warga SENTRAVAX</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={PATHS.USER.NOTIFICATIONS}
              className="relative p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
              aria-label="Notifikasi"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400"></span>
            </Link>
            <Link
              to={PATHS.USER.CREATE_REPORT}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Lapor Bencana
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

