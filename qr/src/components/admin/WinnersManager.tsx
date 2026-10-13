import React, { useState, useEffect } from 'react';
import { Trophy, Download, Search, CheckCircle, Smartphone, Send, QrCode } from 'lucide-react';
import { Winner } from '../../types/index.js';

interface WinnersManagerProps {
  token: string;
}

export const WinnersManager: React.FC<WinnersManagerProps> = ({ token }) => {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchWinners = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/winners', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWinners(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWinners();
  }, []);

  const filteredWinners = winners.filter((w) => {
    const s = search.toLowerCase();
    return (
      w.phone.toLowerCase().includes(s) ||
      w.firstName.toLowerCase().includes(s) ||
      w.lastName.toLowerCase().includes(s) ||
      w.prizeName.toLowerCase().includes(s) ||
      w.ticketId.toLowerCase().includes(s) ||
      (w.qrCodeId && w.qrCodeId.toLowerCase().includes(s))
    );
  });

  const handleExportCSV = () => {
    fetch('/api/admin/export/winners', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'goliblar_royxati.csv';
        a.click();
      });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white font-serif">
            G‘oliblar va Yutuqlar Jurnali
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Barcha tasdiqlangan yutuqlar, chiptalar va ishtirokchilar tarixi.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-xs shadow-md transition-all self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Excel / CSV Eksport Qilish</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-[#0C142B] p-3 rounded-2xl border border-slate-800">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Chipta ID, ism, telefon yoki sovg‘a bo‘yicha qidirish..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Winners Table */}
      <div className="bg-[#0C142B] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Chipta ID</th>
                <th className="py-3 px-4 font-semibold">Ism-Familiya</th>
                <th className="py-3 px-4 font-semibold">Telefon</th>
                <th className="py-3 px-4 font-semibold">Yutgan Sovg‘asi</th>
                <th className="py-3 px-4 font-semibold">Ishtirok Manbasi</th>
                <th className="py-3 px-4 font-semibold">Vaqti</th>
                <th className="py-3 px-4 font-semibold">Holat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : filteredWinners.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Hozircha hech qanday yutuq qayd etilmagan.
                  </td>
                </tr>
              ) : (
                filteredWinners.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-extrabold text-amber-300">
                      {w.ticketId}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {w.firstName} {w.lastName}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {w.phone}
                    </td>
                    <td className="py-3 px-4 font-bold text-amber-200">
                      {w.prizeName}
                    </td>
                    <td className="py-3 px-4">
                      {w.source === 'product_qr' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-blue-400 font-medium">
                          <QrCode className="w-3.5 h-3.5" />
                          <span>#{w.qrCodeId || 'Mahsulot'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-sky-400 font-medium">
                          <Send className="w-3.5 h-3.5" />
                          <span>Telegram</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(w.timestamp).toLocaleDateString('uz-UZ')}{' '}
                      {new Date(w.timestamp).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                        <CheckCircle className="w-3.5 h-3.5" /> Berilgan
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
