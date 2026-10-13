import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, AlertCircle, X, Sparkles } from 'lucide-react';
import { Prize } from '../../types/index.js';
import { PrizeIcon } from '../PrizeIcon.js';

interface PrizesManagerProps {
  token: string;
  onRefreshStats: () => void;
}

export const PrizesManager: React.FC<PrizesManagerProps> = ({ token, onRefreshStats }) => {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPrize, setEditingPrize] = useState<Prize | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('gift');
  const [color, setColor] = useState('#D4AF37');
  const [totalCount, setTotalCount] = useState<number>(10);
  const [probabilityWeight, setProbabilityWeight] = useState<number>(20);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchPrizes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/prizes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPrizes(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrizes();
  }, []);

  const openCreateModal = () => {
    setEditingPrize(null);
    setName('');
    setDescription('');
    setIcon('gift');
    setColor('#D4AF37');
    setTotalCount(10);
    setProbabilityWeight(20);
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (p: Prize) => {
    setEditingPrize(p);
    setName(p.name);
    setDescription(p.description || '');
    setIcon(p.icon || 'gift');
    setColor(p.color || '#D4AF37');
    setTotalCount(p.totalCount);
    setProbabilityWeight(p.probabilityWeight || 20);
    setFormError(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError('Sovg‘a nomini kiritish shart.');
      return;
    }
    if (totalCount < 1) {
      setFormError('Sovg‘alar soni kamida 1 dona bo‘lishi kerak.');
      return;
    }

    setSaving(true);
    try {
      const url = editingPrize ? `/api/admin/prizes/${editingPrize.id}` : '/api/admin/prizes';
      const method = editingPrize ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description,
          icon,
          color,
          totalCount,
          probabilityWeight,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Saqlashda xatolik yuz berdi.');
      }

      setShowModal(false);
      fetchPrizes();
      onRefreshStats();
    } catch (err: any) {
      setFormError(err.message || 'Xatolik yuz berdi.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Haqiqatan ham bu sovg‘ani o‘chirmoqchimisiz?')) return;
    try {
      const res = await fetch(`/api/admin/prizes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchPrizes();
        onRefreshStats();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const availableIcons = [
    { id: 'gift', label: 'Sovg‘a qutisi' },
    { id: 'smartphone', label: 'Smartfon' },
    { id: 'watch', label: 'Aqlli soat' },
    { id: 'headphones', label: 'Quloqchin' },
    { id: 'battery-charging', label: 'Powerbank' },
    { id: 'coffee', label: 'Termos/Krujka' },
    { id: 'ticket', label: 'Vaucher/Chek' },
    { id: 'backpack', label: 'Sumka/Ryukzak' },
    { id: 'shirt', label: 'Futbolka/Kiyim' },
    { id: 'trophy', label: 'Kubok/Bosh sovrin' },
  ];

  const presetColors = [
    '#D4AF37', // Gold
    '#1E3A8A', // Deep Blue
    '#0284C7', // Sky Blue
    '#F59E0B', // Amber
    '#059669', // Emerald
    '#7C3AED', // Purple
    '#0F172A', // Midnight Navy
    '#DC2626', // Crimson Red
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white font-serif">
            Sovg‘alar Jamg‘armasi va Zaxirasi
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Barabandagi sovg‘alar, ularning umumiy soni va yutish ehtimolligini boshqaring.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-xs shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi Sovg‘a Qo‘shish</span>
        </button>
      </div>

      {/* Grid of Prizes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {prizes.map((p) => {
          const isOutOfStock = p.remainingCount <= 0;
          return (
            <div
              key={p.id}
              className={`rounded-2xl p-4 border transition-all ${
                isOutOfStock
                  ? 'bg-slate-900/40 border-slate-800'
                  : 'bg-[#0C142B] border-slate-800 hover:border-amber-500/30'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shadow-md shrink-0"
                    style={{
                      backgroundColor: `${p.color}25`,
                      color: p.color,
                      border: `1px solid ${p.color}50`,
                    }}
                  >
                    <PrizeIcon name={p.icon} className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{p.name}</h3>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{p.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(p)}
                    className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Tahrirlash"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                    title="O‘chirish"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress and Stats */}
              <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Yutib olingan:</span>
                  <span className="font-semibold text-white">
                    {p.wonCount} / {p.totalCount} dona
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (p.wonCount / p.totalCount) * 100)}%`,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
                  <span className="text-slate-400">Qolgan zaxira:</span>
                  <span
                    className={`font-bold ${
                      isOutOfStock ? 'text-red-400' : 'text-amber-300'
                    }`}
                  >
                    {isOutOfStock ? 'Tugagan (0)' : `${p.remainingCount} dona`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0C142B] border border-amber-500/30 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-white font-serif mb-4">
              {editingPrize ? 'Sovg‘ani Tahrirlash' : 'Yangi Sovg‘a Qo‘shish'}
            </h3>

            {formError && (
              <div className="mb-4 p-2.5 rounded-xl bg-red-950/70 border border-red-500/50 flex items-center gap-2 text-red-200 text-xs">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Sovg‘a Nomi <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masalan: iPhone 16 Pro"
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Qisqa Ta’rifi
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="128GB, Qora rangli"
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Jami Soni (Dona) <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="number"
                    min={editingPrize ? editingPrize.wonCount : 1}
                    required
                    value={totalCount}
                    onChange={(e) => setTotalCount(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Ehtimollik Vazni (Og‘irlik)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={probabilityWeight}
                    onChange={(e) => setProbabilityWeight(parseInt(e.target.value, 10) || 10)}
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[10px] text-slate-500">Qanchalik baland bo‘lsa, shuncha ko‘p tushadi</span>
                </div>
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Belgi (Ikonka)
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {availableIcons.map((ic) => (
                    <button
                      key={ic.id}
                      type="button"
                      onClick={() => setIcon(ic.id)}
                      className={`p-2 rounded-xl flex flex-col items-center justify-center transition-all ${
                        icon === ic.id
                          ? 'bg-amber-500 text-amber-950 font-bold shadow-md'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                      title={ic.label}
                    >
                      <PrizeIcon name={ic.id} className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Presets */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Segment Rangi
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {presetColors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-lg transition-transform ${
                        color === c ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Bekor Qilish
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-xs shadow-md transition-all"
                >
                  {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
