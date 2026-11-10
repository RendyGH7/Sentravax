import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
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
  Server
} from 'lucide-react';

export const IntelligenceLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

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
    <div className="min-h-screen bg-[#111111] text-[#F2F2F2] flex selection:bg-[#283139] selection:text-[#A9C2D1]">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Intelligence Command Sidebar */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#191919] border-r border-[#343434] flex flex-col transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[#343434] bg-[#151515]">
          <Link to={PATHS.INTELLIGENCE.OVERVIEW} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#222222] border border-[#343434] flex items-center justify-center text-[#A9C2D1]">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-[#F2F2F2]">SENTRAVAX</span>
              <span className="block text-[9px] font-mono tracking-wider uppercase text-[#B8B8B8]">
                Intelligence Center
              </span>
            </div>
          </Link>
          <button 
            type="button"
            onClick={() => setSidebarOpen(false)} 
            className="lg:hidden text-[#929292] hover:text-[#F2F2F2] p-1.5 rounded"
            aria-label="Tutup navigasi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Threat Indicator Banner */}
        <div className="p-3 mx-3 my-3 rounded-lg bg-[#222222] border border-[#343434]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-mono uppercase text-[#B8B8B8] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#70A987]"></span>
              Aliran Telemetri Multi-Hazard
            </span>
            <span className="text-[10px] font-mono text-[#70A987] font-semibold">NORMAL</span>
          </div>
          <div className="text-[11px] text-[#929292] font-mono">
            Sumber Terhubung: 7 Node Aktif (PostGIS Sync)
          </div>
        </div>

        {/* Command Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {commandItems.map((item) => {
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

        {/* Intelligence Sidebar Footer */}
        <div className="p-3 border-t border-[#343434] space-y-1 bg-[#151515]">
          <Link
            to={PATHS.ADMIN.DASHBOARD}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[#D2A45E] hover:text-[#E2B775] hover:bg-[#222222] transition-colors"
          >
            <ShieldAlert className="w-4 h-4" />
            Ke Admin Dashboard
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

      {/* Main Intelligence Viewport */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
        {/* Command Top Header Bar */}
        <header className="h-16 bg-[#191919] border-b border-[#343434] sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-[#929292] hover:text-[#F2F2F2] rounded-lg hover:bg-[#222222] min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Buka menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#70A987]"></span>
              <h2 className="text-xs sm:text-sm font-semibold tracking-wide text-[#F2F2F2] uppercase font-mono">
                Pusat Komando Intelijen Geospasial
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="hidden md:flex items-center gap-2 bg-[#222222] px-3 py-1.5 rounded-lg border border-[#343434] text-[#B8B8B8]">
              <Wifi className="w-3.5 h-3.5 text-[#70A987]" />
              <span>BMKG / PVMBG: STREAMING AKTIF</span>
            </div>
            <div className="flex items-center gap-2 bg-[#283139] text-[#A9C2D1] px-3 py-1.5 rounded-lg border border-[#3A4550]">
              <Server className="w-3.5 h-3.5" />
              <span>ANALYST: ROOT-OPS</span>
            </div>
          </div>
        </header>

        {/* Page Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto bg-[#141414]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
