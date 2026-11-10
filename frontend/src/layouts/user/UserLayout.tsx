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
    <div className="min-h-screen bg-[#FFFFFF] text-[#202428] flex">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#F5F6F7] border-r border-[#E2E5E8] flex flex-col transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[#E2E5E8] bg-[#FFFFFF]">
          <Link to={PATHS.USER.DASHBOARD} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#245B78] flex items-center justify-center text-white">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-[#202428]">SENTRAVAX</span>
              <span className="block text-[10px] font-mono uppercase text-[#245B78] font-semibold">Portal Warga</span>
            </div>
          </Link>
          <button 
            type="button"
            onClick={() => setSidebarOpen(false)} 
            className="lg:hidden text-[#596168] hover:text-[#202428] p-1.5 rounded"
            aria-label="Tutup menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Mini Profile Card */}
        <div className="p-3.5 mx-3 my-3 rounded-lg bg-[#FFFFFF] border border-[#E2E5E8] shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#EAF1F5] border border-[#D0DFE7] flex items-center justify-center text-[#245B78] font-bold text-xs">
              WP
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-semibold text-[#202428] truncate">Warga Terverifikasi</h4>
              <p className="text-[11px] text-[#28734D] flex items-center gap-1 font-medium">
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
                    ? 'bg-[#EAF1F5] text-[#245B78] font-semibold border border-[#D0DFE7]'
                    : 'text-[#596168] hover:text-[#202428] hover:bg-[#EAECEE]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#245B78]' : 'text-[#737C83]'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[#E2E5E8] space-y-1 bg-[#FFFFFF]">
          <Link
            to={PATHS.PUBLIC.HOME}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[#596168] hover:text-[#202428] hover:bg-[#F5F6F7] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Portal Publik
          </Link>
          <Link
            to={PATHS.PUBLIC.LOGIN}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[#B33A35] hover:bg-[#FDECEC] transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Keluar Akun
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-16 bg-[#FFFFFF] border-b border-[#E2E5E8] sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-[#596168] hover:text-[#202428] rounded-lg hover:bg-[#F5F6F7] min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Buka navigasi sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#28734D]"></span>
              <h2 className="text-sm font-semibold text-[#202428] tracking-tight">Portal Warga SENTRAVAX</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={PATHS.USER.NOTIFICATIONS}
              className="relative p-2 text-[#596168] hover:text-[#202428] rounded-lg hover:bg-[#F5F6F7]"
              aria-label="Notifikasi"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#245B78]"></span>
            </Link>
            <Link
              to={PATHS.USER.CREATE_REPORT}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#245B78] hover:bg-[#1D4B64] text-white transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Lapor Bencana
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto bg-[#FBFBFC]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
