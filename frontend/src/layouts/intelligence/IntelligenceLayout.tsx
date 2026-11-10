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
  Terminal,
  ShieldAlert
} from 'lucide-react';

export const IntelligenceLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const commandItems = [
    { name: 'Ringkasan Intelijen', path: PATHS.INTELLIGENCE.OVERVIEW, icon: Radio },
    { name: 'Peta Geospasial Multi-Bahaya', path: PATHS.INTELLIGENCE.MAP, icon: Layers },
    { name: 'Mesin Analisis Risiko', path: PATHS.INTELLIGENCE.RISK_ANALYSIS, icon: ActivitySquare },
    { name: 'AI Proactive Insights', path: PATHS.INTELLIGENCE.AI_INSIGHTS, icon: BrainCircuit },
    { name: 'Aliran Data & Satelit', path: PATHS.INTELLIGENCE.DATA_SOURCES, icon: Satellite },
    { name: 'Korelasi Kejadian', path: PATHS.INTELLIGENCE.EVENTS, icon: ListFilter },
    { name: 'Operasi & Diseminasi Peringatan', path: PATHS.INTELLIGENCE.ALERT_OPERATIONS, icon: SendHorizontal },
  ];

  return (
    <div className="min-h-screen bg-[#05070F] text-slate-100 flex selection:bg-cyan-500/30 selection:text-cyan-200 font-sans">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Intelligence Command Sidebar */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#070B16] border-r border-cyan-500/20 flex flex-col transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-cyan-500/20 bg-[#090F1E]">
          <Link to={PATHS.INTELLIGENCE.OVERVIEW} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_15px_rgba(0,242,254,0.2)]">
              <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-wider text-white">SENTRAVAX</span>
              <span className="block text-[8px] font-mono tracking-widest uppercase text-cyan-400">
                Disaster Intelligence Center
              </span>
            </div>
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Threat Indicator Banner */}
        <div className="p-3 mx-3 my-3 rounded-lg bg-cyan-950/30 border border-cyan-500/20">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-mono uppercase text-cyan-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Sinyal Multi-Hazard
            </span>
            <span className="text-[10px] font-mono text-emerald-400">STATUS HIJAU</span>
          </div>
          <div className="text-[11px] text-slate-300 font-mono">
            Pipeline: 7 Sumber Aktif • PostGIS Sync
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
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(0,242,254,0.1)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Intelligence Sidebar Footer */}
        <div className="p-3 border-t border-cyan-500/20 space-y-1 bg-[#060A14]">
          <Link
            to={PATHS.ADMIN.DASHBOARD}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
          >
            <ShieldAlert className="w-4 h-4" />
            Ke Admin Dashboard
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

      {/* Main Intelligence Viewport */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
        {/* Command Top Header Bar */}
        <header className="h-16 bg-[#070B16]/90 backdrop-blur-md border-b border-cyan-500/20 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00F2FE]"></span>
              <h2 className="text-xs sm:text-sm font-semibold tracking-wide text-white uppercase font-mono">
                Command & Early Warning Operations
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="hidden md:flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-cyan-500/30 text-cyan-300">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span>BMKG / PVMBG: STREAMING</span>
            </div>
            <div className="flex items-center gap-2 bg-cyan-950/40 text-cyan-300 px-3 py-1.5 rounded-lg border border-cyan-800/40">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">ANALYST:</span> ROOT-OPS
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

