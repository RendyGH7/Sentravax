import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
import { useAuth } from '../../app/context/useAuth';
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
  LogOut
} from 'lucide-react';
import { toast } from 'sonner';

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    toast.info('Sesi administrator telah diakhiri.');
    navigate(PATHS.PUBLIC.LOGIN, { replace: true });
  };

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
    <div className="min-h-screen bg-[#0C0C0C] text-[#F5F5F5] flex selection:bg-[#2E2208] selection:text-[#F59E0B]">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Admin Sidebar (Neutral Charcoal Grey, ZERO MIDNIGHT, ZERO BLUE) */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#161616] border-r border-[#2C2C2C] flex flex-col transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[#2C2C2C] bg-[#121212]">
          <Link to={PATHS.ADMIN.DASHBOARD} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#212121] border border-[#383838] flex items-center justify-center text-[#F59E0B]">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-[#FFFFFF]">SENTRAVAX</span>
              <span className="block text-[10px] font-mono uppercase text-[#F59E0B] font-semibold tracking-wider">Konsol Admin</span>
            </div>
          </Link>
          <button 
            type="button"
            onClick={() => setSidebarOpen(false)} 
            className="lg:hidden text-[#8A8A8A] hover:text-[#FFFFFF] p-1.5 rounded"
            aria-label="Tutup menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin Badge */}
        <div className="p-3.5 mx-3 my-3 rounded-xl bg-[#212121] border border-[#2C2C2C] flex items-center justify-between">
          <div className="overflow-hidden pr-2">
            <span className="text-[10px] uppercase font-mono text-[#F59E0B] font-bold block">
              Peran: {user?.role || 'admin'}
            </span>
            <span className="text-xs font-bold text-[#FFFFFF] truncate block">
              {user?.name || 'Administrator'}
            </span>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-[#161616] border border-[#383838] text-[#F59E0B] font-bold shrink-0">
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#212121] text-[#F59E0B] border border-amber-500/40 font-bold shadow-xs'
                    : 'text-[#D4D4D4] hover:text-[#FFFFFF] hover:bg-[#212121]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#F59E0B]' : 'text-[#8A8A8A]'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Link */}
        <div className="p-3 border-t border-[#2C2C2C] space-y-1 bg-[#121212]">
          <Link
            to={PATHS.USER.DASHBOARD}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#10B981] hover:text-[#34D399] hover:bg-[#212121] transition-colors"
          >
            <Users className="w-4 h-4 text-[#10B981]" />
            Portal Warga
          </Link>
          <Link
            to={PATHS.PUBLIC.HOME}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[#8A8A8A] hover:text-[#FFFFFF] hover:bg-[#212121] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Portal Publik
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
          >
            <LogOut className="w-4 h-4" />
            Keluar Sesi Admin
          </button>
        </div>
      </aside>

      {/* Main Admin Content */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-16 bg-[#161616] border-b border-[#2C2C2C] sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-[#8A8A8A] hover:text-[#FFFFFF] rounded-lg hover:bg-[#212121] min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Buka menu navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-[#212121] border border-[#2C2C2C] text-xs text-[#D4D4D4] w-72">
              <Search className="w-3.5 h-3.5 text-[#8A8A8A]" />
              <span>Cari user, laporan, audit log...</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-[#D4D4D4] bg-[#212121] px-3.5 py-1.5 rounded-lg border border-[#2C2C2C]">
              <Cpu className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Sistem: PostGIS Aktif (Latensi 42ms)</span>
            </div>
            <button 
              type="button"
              className="p-2 text-[#8A8A8A] hover:text-[#FFFFFF] rounded-lg hover:bg-[#212121] relative"
              aria-label="Notifikasi admin"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-[#F59E0B] absolute top-2 right-2"></span>
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
