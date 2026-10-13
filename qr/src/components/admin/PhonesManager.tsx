import React, { useState, useEffect } from 'react';
import {
  Plus,
  Upload,
  Search,
  Trash2,
  Download,
  CheckCircle,
  Clock,
  Phone,
  AlertCircle,
  RefreshCw,
  Gift,
  Target,
} from 'lucide-react';
import { AllowedPhone, Prize } from '../../types/index.js';

interface PhonesManagerProps {
  token: string;
  onRefreshStats: () => void;
}

export const PhonesManager: React.FC<PhonesManagerProps> = ({ token, onRefreshStats }) => {
  const [phones, setPhones] = useState<AllowedPhone[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'won' | 'not_won'>('all');

  // Single Add modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [selectedPrizeId, setSelectedPrizeId] = useState<string>(''); // Oldindan belgilangan sovg'a
  const [addError, setAddError] = useState<string | null>(null);
  const [addNotice, setAddNotice] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);

  // Bulk Import modal state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkPrizeId, setBulkPrizeId] = useState<string>('');
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkResult, setBulkResult] = useState<{ added: number; skipped: number } | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Fetch phones and prizes
  const fetchPhones = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/phones?search=${encodeURIComponent(search)}&filter=${filter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        localStorage.removeItem('fortune_admin_token');
        window.location.reload();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setPhones(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrizes = async () => {
    try {
      const res = await fetch('/api/admin/prizes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPrizes(data.filter((p: Prize) => p.isActive));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPhones();
    fetchPrizes();
  }, [search, filter]);

  // Handle Single Add with Optional Assigned Prize
  const handleAddSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAddNotice(null);
    if (!newPhone.trim()) {
      setAddError('Iltimos, telefon raqamini kiriting.');
      return;
    }

    setAddLoading(true);
    try {
      const res = await fetch('/api/admin/phones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone: newPhone,
          assignedPrizeId: selectedPrizeId || undefined,
        }),
      });

      if (res.status === 401) {
        localStorage.removeItem('fortune_admin_token');
        window.location.reload();
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Xatolik yuz berdi.');
      }

      if (data.reactivated) {
        setAddNotice(data.message || 'Mijoz qayta faollashtirildi!');
        setTimeout(() => {
          setShowAddModal(false);
          setNewPhone('');
          setSelectedPrizeId('');
          setAddNotice(null);
        }, 1200);
      } else {
        setShowAddModal(false);
        setNewPhone('');
        setSelectedPrizeId('');
      }

      fetchPhones();
      onRefreshStats();
    } catch (err: any) {
      setAddError(err.message || 'Xatolik yuz berdi.');
    } finally {
      setAddLoading(false);
    }
  };

  // Change or remove assigned prize directly for a phone
  const handleQuickAssignPrize = async (phoneId: string, prizeId: string) => {
    try {
      const res = await fetch(`/api/admin/phones/${phoneId}/assigned-prize`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          assignedPrizeId: prizeId || null,
        }),
      });
      if (res.ok) {
        fetchPhones();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Reactivate a won phone (Repeat purchase)
  const handleReactivate = async (id: string, phoneStr: string) => {
    if (!confirm(`Mijoz (${phoneStr}) yangi mahsulot sotib oldimi? Qayta o‘ynash imkoniyati berilsinmi?`)) return;

    try {
      const res = await fetch(`/api/admin/phones/${id}/reactivate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchPhones();
        onRefreshStats();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Bulk Import
  const handleBulkUpload = async () => {
    setBulkError(null);
    setBulkResult(null);
    if (!bulkText.trim()) {
      setBulkError('Iltimos, kamida bitta raqam kiriting.');
      return;
    }

    setBulkLoading(true);
    try {
      const res = await fetch('/api/admin/phones/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ textData: bulkText }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Import xatoligi.');
      }
      setBulkResult({ added: data.addedCount, skipped: data.skippedCount });
      setBulkText('');
      fetchPhones();
      onRefreshStats();
    } catch (err: any) {
      setBulkError(err.message || 'Import xatoligi yuz berdi.');
    } finally {
      setBulkLoading(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (!confirm('Ushbu telefon raqamini o‘chirmoqchimisiz?')) return;
    try {
      const res = await fetch(`/api/admin/phones/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchPhones();
        onRefreshStats();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle CSV Export
  const handleExportCSV = () => {
    fetch('/api/admin/export/phones', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ruxsat_etilgan_raqamlar.csv';
        a.click();
      });
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white font-serif">
            Ruxsat Etilgan Telefon Raqamlari
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Raqam qo‘shing va xohlasangiz unga tushadigan aniq sovg‘ani oldindan belgilab qo‘ying.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setAddError(null);
              setAddNotice(null);
              setNewPhone('');
              setSelectedPrizeId('');
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Raqam Qo‘shish</span>
          </button>

          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Ko‘p Raqam Yuklash (CSV)</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Eksport</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0C142B] p-3 rounded-2xl border border-slate-800">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Telefon raqami bo‘yicha qidirish..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-amber-500 text-amber-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Barchasi ({phones.length})
          </button>
          <button
            onClick={() => setFilter('not_won')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filter === 'not_won'
                ? 'bg-amber-500 text-amber-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            O‘ynamaganlar
          </button>
          <button
            onClick={() => setFilter('won')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filter === 'won'
                ? 'bg-amber-500 text-amber-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Yutganlar
          </button>
        </div>
      </div>

      {/* Phones Table */}
      <div className="bg-[#0C142B] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Telefon Raqami</th>
                <th className="py-3 px-4 font-semibold">O‘yin Holati</th>
                <th className="py-3 px-4 font-semibold">Oldindan Belgilangan Sovg‘a</th>
                <th className="py-3 px-4 font-semibold">Haqiqiy Yutug‘i</th>
                <th className="py-3 px-4 font-semibold text-right">Qayta Xarid / Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : phones.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    Hech qanday telefon raqami mavjud emas. Yuqoridagi "Raqam Qo‘shish" tugmasini bosing.
                  </td>
                </tr>
              ) : (
                phones.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-white text-sm">
                      {item.phone}
                    </td>
                    <td className="py-3 px-4">
                      {item.hasWon ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[11px]">
                          <CheckCircle className="w-3 h-3" /> Yutuq olgan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-300 font-semibold bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full text-[11px]">
                          <Clock className="w-3 h-3" /> Imkoniyati bor (Faol)
                        </span>
                      )}
                    </td>

                    {/* Assigned Prize Selection Dropdown in Table */}
                    <td className="py-3 px-4">
                      {!item.hasWon ? (
                        <select
                          value={item.assignedPrizeId || ''}
                          onChange={(e) => handleQuickAssignPrize(item.id, e.target.value)}
                          className="bg-slate-900 border border-slate-700 hover:border-amber-400 text-xs text-amber-300 font-medium rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer max-w-[200px]"
                        >
                          <option value="">🎲 Tasodifiy (Random)</option>
                          {prizes.map((p) => (
                            <option key={p.id} value={p.id}>
                              🎯 {p.name}
                            </option>
                          ))}
                        </select>
                      ) : item.assignedPrizeName ? (
                        <span className="text-amber-400/90 text-xs font-semibold">
                          🎯 {item.assignedPrizeName}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">Tasodifiy tushgan</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {item.prizeName ? (
                        <span className="text-emerald-300 font-bold">{item.prizeName}</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.hasWon && (
                          <button
                            onClick={() => handleReactivate(item.id, item.phone)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-sm transition-all"
                            title="Mijoz yangi mahsulot sotib olganda yana 1 ta imkoniyat berish"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>+ Yangi xarid (Faollashtirish)</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors"
                          title="O‘chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RAQAM QO'SHISH VA SOVG'ANI BELGILASH MODALI */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-[#0C142B] border border-amber-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white font-serif mb-1">
              Yangi Telefon Raqamini Qo‘shish
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Raqamni kiriting va xohlasangiz unga aynan qaysi sovg‘a tushishini oldindan tanlang.
            </p>

            {addError && (
              <div className="mb-4 p-2.5 rounded-xl bg-red-950/70 border border-red-500/50 flex items-center gap-2 text-red-200 text-xs">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            {addNotice && (
              <div className="mb-4 p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 flex items-center gap-2 text-emerald-200 text-xs font-bold">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{addNotice}</span>
              </div>
            )}

            <form onSubmit={handleAddSingle} className="space-y-4">
              {/* TELEFON RAQAMI MAYDONI */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Telefon Raqami <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    autoFocus
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+998 90 123 45 67"
                    className="w-full pl-10 pr-3 py-3 text-sm bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400/40 font-mono font-bold"
                  />
                  <Phone className="w-4 h-4 text-amber-400 absolute left-3.5 top-3.5" />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Format: <code>901234567</code> yoki <code>+998901234567</code>
                </p>
              </div>

              {/* TUSHADIGAN SOVG'ANI OLDINDAN BELGILASH (IXTIYORIY) */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ushbu raqamga tushadigan sovg‘a:</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Ixtiyoriy</span>
                </label>
                <select
                  value={selectedPrizeId}
                  onChange={(e) => setSelectedPrizeId(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl text-amber-300 font-medium focus:outline-none"
                >
                  <option value="">🎲 Tasodifiy (Omadiga qarab / Standart)</option>
                  {prizes.map((p) => (
                    <option key={p.id} value={p.id}>
                      🎯 {p.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-slate-500">
                  Agar tanlasangiz, baraban aynan shu sovg‘ada to‘xtaydi!
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Bekor Qilish
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
                >
                  {addLoading ? 'Saqlanmoqda...' : 'Qo‘shish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK IMPORT MODAL */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-[#0C142B] border border-amber-500/30 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white font-serif mb-1">
              Ko‘p Raqamlarni Yuklash (Bulk Import)
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Har bir qatorga bittadan telefon raqamini tashlang.
            </p>

            {bulkError && (
              <div className="mb-4 p-2.5 rounded-xl bg-red-950/70 border border-red-500/50 flex items-center gap-2 text-red-200 text-xs">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{bulkError}</span>
              </div>
            )}

            {bulkResult && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-xs text-emerald-200">
                <div className="font-bold flex items-center gap-1.5 text-emerald-300">
                  <CheckCircle className="w-4 h-4" /> Muvaffaqiyatli yakunlandi!
                </div>
                <div className="mt-1">
                  Qo‘shildi: <b>{bulkResult.added}</b> ta raqam. Takroriy: <b>{bulkResult.skipped}</b> ta.
                </div>
              </div>
            )}

            <div className="mb-4">
              <textarea
                rows={7}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="+998901234567&#10;+998912345678&#10;933456789"
                className="w-full p-3 text-xs bg-slate-900 border border-slate-700 rounded-2xl text-white placeholder-slate-600 font-mono focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition-colors"
              >
                Yopish
              </button>
              <button
                type="button"
                disabled={bulkLoading}
                onClick={handleBulkUpload}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                <Upload className="w-4 h-4" />
                <span>{bulkLoading ? 'Yuklanmoqda...' : 'Yuklash'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
