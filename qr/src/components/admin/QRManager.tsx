import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Download,
  Copy,
  Printer,
  Sparkles,
  Send,
  ExternalLink,
  Globe,
  Smartphone,
  CheckCircle,
  AlertTriangle,
  Save,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';

interface QRManagerProps {
  token: string;
  onRefreshStats?: () => void;
}

export const QRManager: React.FC<QRManagerProps> = ({ token }) => {
  // Determine smart fallback URL
  const browserOrigin =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://ais-dev-vckafpntoi4jnvqukk5ldl-733255150384.asia-southeast1.run.app';

  const [siteUrl, setSiteUrl] = useState<string>(browserOrigin);
  const [savedUrl, setSavedUrl] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPost, setCopiedPost] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeView, setActiveView] = useState<'preview' | 'stickers'>('preview');

  // Regenerate QR whenever siteUrl changes
  const generateQR = async (urlToEncode: string) => {
    try {
      const cleanUrl = urlToEncode.trim() || browserOrigin;
      const dataUrl = await QRCode.toDataURL(cleanUrl, {
        width: 420,
        margin: 2,
        errorCorrectionLevel: 'H', // High error correction for reliable camera scans
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrDataUrl(dataUrl);
    } catch (e) {
      console.error('QR generation error:', e);
    }
  };

  useEffect(() => {
    // Fetch public and admin info from server
    fetch('/api/public/info')
      .then((res) => res.json())
      .then((data) => {
        // If administrator previously saved a custom URL, prioritize it
        const targetUrl =
          data.customSiteUrl ||
          data.publicAppUrl ||
          (typeof window !== 'undefined' ? window.location.origin : browserOrigin);

        setSiteUrl(targetUrl);
        setSavedUrl(targetUrl);
        generateQR(targetUrl);
      })
      .catch(() => {
        setSiteUrl(browserOrigin);
        generateQR(browserOrigin);
      });
  }, []);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setSiteUrl(newUrl);
    generateQR(newUrl);
  };

  const handleSaveUrl = async () => {
    if (!token) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customSiteUrl: siteUrl.trim(),
        }),
      });

      if (res.ok) {
        setSavedUrl(siteUrl.trim());
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error('Error saving URL:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(siteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyPost = () => {
    const postText =
      `🎁 DIQQAT, AZIZ XARIDORLAR VA OBUNACHILAR!\n\n` +
      `Bizning rasmiy "Omadli Sovg‘a" aksiyamiz ishga tushdi! Mahsulotimizni xarid qiling va qimmatbaho sovg‘alarni yutib oling!\n\n` +
      `Ishtirok etish havolasi:\n${siteUrl}\n\n` +
      `⚠️ Eslatma: O‘yin faqat ro‘yxatga olingan telefon raqamlari orqali ishlaydi. Omad yor bo‘lsin!`;

    navigator.clipboard.writeText(postText);
    setCopiedPost(true);
    setTimeout(() => setCopiedPost(false), 2000);
  };

  const handleDownloadQr = () => {
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = 'omadli_sovgala_yagona_qr.png';
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white font-serif">
            Yagona Rasmiy QR-Kod Tizimi
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Telegram kanal uchun ham, barcha mahsulotlarga yopishtirish uchun ham aynan ushbu bitta QR-kod ishlatiladi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('preview')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeView === 'preview'
                ? 'bg-amber-500 text-amber-950 shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            QR-Kodni Ko‘rish & Sozlash
          </button>
          <button
            onClick={() => setActiveView('stickers')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeView === 'stickers'
                ? 'bg-amber-500 text-amber-950 shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Mahsulot Stikerlari (Print)</span>
          </button>
        </div>
      </div>

      {activeView === 'preview' ? (
        <div className="space-y-6">
          {/* Explanation Alert: Why scanning previously gave 404 or failed on mobile */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h4 className="font-bold text-sm text-amber-300">
                  📱 Nega avval telefondan skaner qilganda ochilmadi?
                </h4>
                <p className="text-slate-300 leading-relaxed text-xs">
                  Avvalgi QR-kod ichida Google Cloud AI Studio'ning ichki test havolasi (<code className="text-amber-300 font-mono">ais-pre-...</code>) yozilgan edi. 
                  Bu havola faqat ichki dasturchi brauzerida ishlaydi, oddiy telefon kamerasidan ochilganda esa <strong>«404 Not Found»</strong> xatoligi beradi.
                </p>
                <p className="text-emerald-300 font-medium text-xs">
                  ✅ <strong>Yechim:</strong> Hozir quyidagi maydonda QR-kod ichiga kodlanayotgan <strong>haqiqiy manzil</strong> ko‘rinib turibdi. Agar o‘z domeningiz bo‘lsa (masalan <code className="text-white font-mono bg-slate-900 px-1 py-0.5 rounded">https://sizningsayt.uz</code>) yoki Telegram havolangiz bo‘lsa, uni yozib <strong>«Saqlash»</strong> tugmasini bosing. Shunda yangilangan QR-kod har qanday telefonda 100% ochiladi!
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Big QR Card */}
            <div className="md:col-span-5 bg-[#0C142B] border border-amber-500/30 rounded-3xl p-6 text-center shadow-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-4">
                <Smartphone className="w-3.5 h-3.5" />
                <span>TELEFONDA OCHILADIGAN QR-KOD</span>
              </div>

              {/* High-Contrast White Background for 100% Guaranteed Phone Camera Detection */}
              <div className="mx-auto w-64 h-64 bg-white p-3 rounded-2xl shadow-2xl mb-4 flex items-center justify-center">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Yagona QR Kod"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-slate-500">QR-kod tayyorlanmoqda...</span>
                )}
              </div>

              {/* What URL is inside this QR code right now */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 mb-3 text-left">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>QR Ichidagi Havola:</span>
                  <span className="text-emerald-400 font-mono text-[9px]">KAMERADA SHU CHIQADI</span>
                </div>
                <div className="text-xs text-amber-300 font-mono break-all line-clamp-2 select-all">
                  {siteUrl}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={() => window.open(siteUrl, '_blank')}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                  title="Havolani yangi oynada ochib tekshirish"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sinab Ko‘rish</span>
                </button>

                <button
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-blue-400" />
                  <span>{copiedLink ? 'Nusxalandi!' : 'Havola Nusxasi'}</span>
                </button>
              </div>

              <button
                onClick={handleDownloadQr}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-xs shadow-md transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>QR-KODNI YUKLAB OLISH (PNG)</span>
              </button>
            </div>

            {/* URL Configuration & Settings */}
            <div className="md:col-span-7 space-y-4">
              {/* Website Direct Link & Custom Domain Editor */}
              <div className="bg-[#0C142B] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-amber-400" />
                      <span>QR-kodga Biriktirilgan Internet Manzil:</span>
                    </label>
                    {saveSuccess && (
                      <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
                        <CheckCircle className="w-3.5 h-3.5" /> Saqlandi!
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={siteUrl}
                      onChange={handleUrlChange}
                      placeholder="https://sizningsayt.uz"
                      className="flex-1 px-3 py-2.5 text-xs bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl text-amber-300 font-mono font-medium focus:outline-none"
                    />
                    <button
                      onClick={handleSaveUrl}
                      disabled={isSaving}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all cursor-pointer shrink-0"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSaving ? 'Saqlanmoqda...' : 'Saqlash'}</span>
                    </button>
                  </div>

                  <p className="mt-1.5 text-[11px] text-slate-400">
                    O‘zingizning domeningizni yoki saytingiz joylashgan manzilni kiriting va <strong>«Saqlash»</strong>ni bosing. QR-kod bir zumda shu manzilga qayta generatsiya bo‘ladi.
                  </p>
                </div>

                {/* Quick Presets */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="text-[11px] font-bold text-slate-300">Tezkor Havolalar:</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => {
                        const origin = typeof window !== 'undefined' ? window.location.origin : browserOrigin;
                        setSiteUrl(origin);
                        generateQR(origin);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>🌐 Hozirgi Brauzer Manzili</span>
                    </button>

                    <button
                      onClick={() => {
                        const example = 'https://omadlisovga.uz';
                        setSiteUrl(example);
                        generateQR(example);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>✏️ Namuna: omadlisovga.uz</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Telegram Post Template */}
              <div className="bg-[#0C142B] border border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-blue-400" />
                    <span>Telegram Kanal Uchun Tayyor Post</span>
                  </label>
                  <button
                    onClick={handleCopyPost}
                    className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedPost ? 'Nusxalandi!' : 'Postni Nusxalash'}</span>
                  </button>
                </div>
                <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-300 whitespace-pre-line font-sans leading-relaxed">
                  {`🎁 DIQQAT, AZIZ XARIDORLAR VA OBUNACHILAR!\n\nBizning rasmiy "Omadli Sovg‘a" aksiyamiz ishga tushdi! Mahsulotimizni xarid qiling va qimmatbaho sovg‘alarni yutib oling!\n\nIshtirok etish havolasi:\n${siteUrl}\n\n⚠️ Eslatma: O‘yin faqat ro‘yxatga olingan telefon raqamlari orqali ishlaydi.`}
                </div>
              </div>

              {/* Instructions for Phone Test */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-2">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-400" /> Telefondan Skaner Qilish Tartibi:
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-400 text-xs">
                  <li>Telefoningiz kamerasini oching va ekrandagi QR-kodga qarating.</li>
                  <li>Telefon ekranida paydo bo‘ladigan sariq havolani bosing.</li>
                  <li>Sayt ochilgach, ro‘yxatga kiritilgan telefon raqamingizni kiriting va barabanni aylantiring!</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* PRINTABLE STICKER SHEET */
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#0C142B] p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white font-serif">
                Mahsulot Qutilari Uchun Stikerlar Varaqi (Print)
              </h3>
              <p className="text-xs text-slate-400">
                Ushbu stikerlarni printerdan chop etib, barcha mahsulotlar qutisiga yopishtirasiz.
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-xs shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Chop Etish (Print)</span>
            </button>
          </div>

          <div className="bg-white text-slate-900 p-6 rounded-2xl shadow-2xl print:p-0 print:shadow-none print:bg-white print:m-0">
            <div className="text-center pb-4 mb-4 border-b border-slate-200">
              <h2 className="text-xl font-bold font-serif text-slate-900 uppercase tracking-wider">
                Omadli Sovg‘a — Rasmiy Mahsulot Stikerlari
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Kamerangiz orqali QR-kodni skaner qiling va sovg‘alarni yutib oling!
              </p>
            </div>

            {/* Grid of identical printable stickers */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 print:grid-cols-3">
              {Array.from({ length: 24 }).map((_, idx) => (
                <div
                  key={idx}
                  className="border-2 border-dashed border-slate-300 p-3 rounded-xl flex flex-col items-center justify-center text-center bg-slate-50 break-inside-avoid"
                >
                  <div className="text-[10px] font-black uppercase text-amber-700 tracking-wider mb-1">
                    SKANERLANG & YUTING!
                  </div>

                  {qrDataUrl && (
                    <img
                      src={qrDataUrl}
                      alt="Stiker QR"
                      className="w-24 h-24 object-contain bg-white p-1 rounded-lg border border-slate-200 mb-1.5"
                    />
                  )}

                  <div className="font-bold text-[10px] text-slate-800">
                    OMADLI SOVG‘A
                  </div>
                  <div className="text-[9px] text-slate-500">
                    Rasmiy aksiya
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
