import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
import { useAuth } from '../../app/context/useAuth';
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
import { toast } from 'sonner';

export const UserLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    toast.info('Sesi Anda telah diakhiri.');
    navigate(PATHS.PUBLIC.LOGIN, { replace: true });
  };

  const initials = user?.name 
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'WP';

  const menuItems = [
    { name: 'Dashboard', path: PATHS.USER.DASHBOARD, icon: LayoutDashboard },
    { name: 'Laporan Saya', path: PATHS.USER.REPORTS, icon: FileText },
    { name: 'Buat Laporan', path: PATHS.USER.CREATE_REPORT, icon: PlusCircle },
    { name: 'Wilayah Pantauan', path: PATHS.USER.REGIONS, icon: MapPin },
    { name: 'Notifikasi', path: PATHS.USER.NOTIFICATIONS, icon: Bell },
    { name: 'Pengaturan', path: PATHS.USER.SETTINGS, icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111827] flex selection:bg-[#ECFDF5] selection:text-[#047857]">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#FFFFFF] border-r border-[#E5E7EB] flex flex-col transition-transform duration-200 shadow-xs
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[#E5E7EB] bg-[#FFFFFF]">
          <Link to={PATHS.USER.DASHBOARD} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#047857] flex items-center justify-center text-white shadow-xs">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-[#111827]">SENTRAVAX</span>
              <span className="block text-[10px] font-mono uppercase text-[#047857] font-bold">Portal Warga</span>
            </div>
          </Link>
          <button 
            type="button"
            onClick={() => setSidebarOpen(false)} 
            className="lg:hidden text-[#6B7280] hover:text-[#111827] p-1.5 rounded"
            aria-label="Tutup menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Mini Profile Card */}
        <div className="p-3.5 mx-3 my-3 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#047857] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {initials}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-bold text-[#111827] truncate">{user?.name || 'Warga Terverifikasi'}</h4>
              <p className="text-[11px] text-[#047857] flex items-center gap-1 font-semibold">
                <UserCheck className="w-3.5 h-3.5" /> Role: {user?.role || 'user'}
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#ECFDF5] text-[#047857] font-bold border border-[#A7F3D0]'
                    : 'text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#047857]' : 'text-[#6B7280]'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[#E5E7EB] space-y-1 bg-[#FFFFFF]">
          <Link
            to={PATHS.PUBLIC.HOME}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[#4B5563] hover:text-[#111827] hover:bg-[#F9FAFB] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Portal Publik
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#DC2626] hover:bg-[#FEF2F2] transition-colors text-left"
          >
            <LogOut className="w-4 h-4" />
            Keluar Akun
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-16 bg-[#FFFFFF] border-b border-[#E5E7EB] sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-[#4B5563] hover:text-[#111827] rounded-lg hover:bg-[#F3F4F6] min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Buka navigasi sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
              <h2 className="text-sm font-bold text-[#111827] tracking-tight">Portal Warga SENTRAVAX</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={PATHS.USER.NOTIFICATIONS}
              className="relative p-2 text-[#4B5563] hover:text-[#111827] rounded-lg hover:bg-[#F3F4F6]"
              aria-label="Notifikasi"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#C2410C]"></span>
            </Link>
            <Link
              to={PATHS.USER.CREATE_REPORT}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-[#047857] hover:bg-[#065F46] text-white shadow-xs transition-colors"
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
