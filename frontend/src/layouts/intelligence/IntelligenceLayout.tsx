import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
import { useAuth } from '../../app/context/useAuth';
import { 
  Radio, 
  Layers, 
  BrainCircuit, 
  ActivitySquare, 
  Satellite, 
  ListFilter, 
  SendHorizontal, 
  ArrowLeft, 
  Menu, 
  X, 
  Wifi, 
  ShieldAlert,
  Server,
  LogOut
} from 'lucide-react';
import { toast } from 'sonner';

export const IntelligenceLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    toast.info('Sesi intelijen telah diakhiri.');
    navigate(PATHS.PUBLIC.LOGIN, { replace: true });
  };

  const commandItems = [
    { name: 'Ringkasan Intelijen', path: PATHS.INTELLIGENCE.OVERVIEW, icon: Radio },
    { name: 'Peta Geospasial Multi-Bahaya', path: PATHS.INTELLIGENCE.MAP, icon: Layers },
    { name: 'Mesin Analisis Risiko', path: PATHS.INTELLIGENCE.RISK_ANALYSIS, icon: ActivitySquare },
    { name: 'AI Proactive Insights', path: PATHS.INTELLIGENCE.AI_INSIGHTS, icon: BrainCircuit },
    { name: 'Aliran Data dan Satelit', path: PATHS.INTELLIGENCE.DATA_SOURCES, icon: Satellite },
    { name: 'Korelasi Kejadian', path: PATHS.INTELLIGENCE.EVENTS, icon: ListFilter },
    { name: 'Operasi Peringatan Dini', path: PATHS.INTELLIGENCE.ALERT_OPERATIONS, icon: SendHorizontal },
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

      {/* Intelligence Command Sidebar (Pure Black & Charcoal Grey, ZERO MIDNIGHT, ZERO BLUE) */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#161616] border-r border-[#2C2C2C] flex flex-col transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[#2C2C2C] bg-[#121212]">
          <Link to={PATHS.INTELLIGENCE.OVERVIEW} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#212121] border border-[#383838] flex items-center justify-center text-[#F59E0B]">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-[#FFFFFF]">SENTRAVAX</span>
              <span className="block text-[9px] font-mono tracking-wider uppercase text-[#F59E0B] font-semibold">
                Intelligence Center
              </span>
            </div>
          </Link>
          <button 
            type="button"
            onClick={() => setSidebarOpen(false)} 
            className="lg:hidden text-[#8A8A8A] hover:text-[#FFFFFF] p-1.5 rounded"
            aria-label="Tutup navigasi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Threat Indicator Banner */}
        <div className="p-3.5 mx-3 my-3 rounded-xl bg-[#212121] border border-[#2C2C2C]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-mono uppercase text-[#D4D4D4] flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
              Aliran Telemetri Multi-Hazard
            </span>
            <span className="text-[10px] font-mono text-[#10B981] font-bold">NORMAL</span>
          </div>
          <div className="text-[11px] text-[#8A8A8A] font-mono">
            Sumber Terhubung: 7 Node Aktif (PostGIS Sync)
          </div>
        </div>

        {/* Command Navigation (Amber & Emerald Accents - ZERO BLUE) */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {commandItems.map((item) => {
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

        {/* Intelligence Sidebar Footer */}
        <div className="p-3 border-t border-[#2C2C2C] space-y-1 bg-[#121212]">
          <Link
            to={PATHS.ADMIN.DASHBOARD}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-[#F59E0B] hover:text-[#D97706] hover:bg-[#212121] transition-colors"
          >
            <ShieldAlert className="w-4 h-4" />
            Ke Admin Dashboard
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
            Keluar Sesi Intel
          </button>
        </div>
      </aside>

      {/* Main Intelligence Viewport */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
        {/* Command Top Header Bar */}
        <header className="h-16 bg-[#161616] border-b border-[#2C2C2C] sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-[#8A8A8A] hover:text-[#FFFFFF] rounded-lg hover:bg-[#212121] min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Buka menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse"></span>
              <h2 className="text-xs sm:text-sm font-bold tracking-wide text-[#FFFFFF] uppercase font-mono">
                Pusat Komando Intelijen Geospasial
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="hidden md:flex items-center gap-2 bg-[#212121] px-3.5 py-1.5 rounded-lg border border-[#2C2C2C] text-[#D4D4D4]">
              <Wifi className="w-3.5 h-3.5 text-[#10B981]" />
              <span>BMKG / PVMBG: STREAMING AKTIF</span>
            </div>
            <div className="flex items-center gap-2 bg-[#212121] text-[#F59E0B] px-3.5 py-1.5 rounded-lg border border-amber-500/30 font-bold">
              <Server className="w-3.5 h-3.5" />
              <span>{user?.name ? `${user.role.toUpperCase()}: ${user.name.split(' ')[0]}` : 'ANALYST: ROOT-OPS'}</span>
            </div>
          </div>
        </header>

        {/* Page Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
