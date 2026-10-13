import React, { useState, useEffect } from 'react';
import {
  Users,
  Gift,
  QrCode,
  Trophy,
  Settings,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { DashboardStats } from '../../types/index.js';
import { PhonesManager } from './PhonesManager.js';
import { PrizesManager } from './PrizesManager.js';
import { QRManager } from './QRManager.js';
import { WinnersManager } from './WinnersManager.js';
import { SettingsManager } from './SettingsManager.js';

interface AdminDashboardProps {
  token: string;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ token, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'phones' | 'prizes' | 'qrs' | 'winners' | 'settings'>('phones');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const navItems = [
    { id: 'phones', label: 'Ruxsat Berilgan Raqamlar', icon: Users, desc: 'Whitelist va CSV yuklash' },
    { id: 'prizes', label: 'Sovg‘alar Jamg‘armasi', icon: Gift, desc: 'Sovg‘alar zaxirasi' },
    { id: 'qrs', label: 'QR-Kodlar Tizimi', icon: QrCode, desc: 'Telegram va Mahsulot QR' },
    { id: 'winners', label: 'G‘oliblar Jurnali', icon: Trophy, desc: 'Yutuqlar tarixi va CSV' },
    { id: 'settings', label: 'Tizim Sozlamalari', icon: Settings, desc: 'Parametrlar va Firebase' },
  ] as const;

  return (
    <div className="min-h-screen bg-[#070D1F] text-slate-100 flex flex-col md:flex-row font-sans selection:bg-amber-500 selection:text-black">
      {/* Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#0B142D] border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="font-bold text-sm text-white">Administrator Boshqaruvi</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Professional Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-72 bg-[#0A1128] border-r border-slate-800 flex flex-col justify-between z-50 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Sidebar Brand Header */}
          <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 p-[1.5px] shadow-lg shadow-amber-500/20 shrink-0">
              <div className="w-full h-full bg-[#0B132B] rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="font-serif font-extrabold text-sm text-white tracking-wide">
                Boshqaruv Paneli
              </div>
              <div className="text-[10px] text-amber-400 font-mono">
                Xavfsiz Tizim (v2.0)
              </div>
            </div>
          </div>

          {/* Nav Items */}
          <div className="p-3 space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Asosiy Bo‘limlar
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-amber-500 text-amber-950 font-bold shadow-md shadow-amber-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-850/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-950' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-amber-950' : 'text-slate-500'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer with Logout */}
        <div className="p-4 border-t border-slate-800/80 bg-[#080E21]">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-200 text-xs font-bold transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Tizimdan Chiqish</span>
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl overflow-y-auto">
        {/* KPI Summary Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
            <div className="bg-[#0C142B] border border-slate-800 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase text-slate-300">Ruxsat Berilgan</span>
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-white">
                {stats.totalAllowedPhones}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Qolgan imkoniyat: <b className="text-amber-400">{stats.remainingChances}</b> ta
              </div>
            </div>

            <div className="bg-[#0C142B] border border-slate-800 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase text-slate-300">Jami G‘oliblar</span>
                <Trophy className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-amber-300">
                {stats.totalWinners}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Berilgan sovg‘alar soni
              </div>
            </div>

            <div className="bg-[#0C142B] border border-slate-800 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase text-slate-300">Yagona QR-Kod</span>
                <QrCode className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-emerald-400">
                FAOL
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Telegram & Mahsulotlar uchun umumiy
              </div>
            </div>

            <div className="bg-[#0C142B] border border-slate-800 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase text-slate-300">Sovg‘alar Qoldig‘i</span>
                <Gift className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-purple-300">
                {stats.remainingPrizesCount}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {stats.totalPrizes} xil sovg‘a turida
              </div>
            </div>
          </div>
        )}

        {/* Selected Section */}
        <div className="bg-[#0A1024] border border-slate-800/80 rounded-3xl p-5 sm:p-7 shadow-2xl">
          {activeTab === 'phones' && (
            <PhonesManager token={token} onRefreshStats={fetchStats} />
          )}

          {activeTab === 'prizes' && (
            <PrizesManager token={token} onRefreshStats={fetchStats} />
          )}

          {activeTab === 'qrs' && (
            <QRManager token={token} onRefreshStats={fetchStats} />
          )}

          {activeTab === 'winners' && (
            <WinnersManager token={token} />
          )}

          {activeTab === 'settings' && (
            <SettingsManager token={token} onRefreshStats={fetchStats} />
          )}
        </div>
      </main>
    </div>
  );
};
