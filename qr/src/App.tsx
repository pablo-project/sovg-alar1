/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ParticipantEntryStep } from './components/ParticipantEntryStep.js';
import { WheelSpinStep } from './components/WheelSpinStep.js';
import { WinnerCelebrationStep } from './components/WinnerCelebrationStep.js';
import { AdminLogin } from './components/admin/AdminLogin.js';
import { AdminDashboard } from './components/admin/AdminDashboard.js';

export default function App() {
  const checkIsAdmin = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname;
    const search = window.location.search;
    return path === '/admin' || path.startsWith('/admin') || search.includes('admin=true') || search.includes('admin=1');
  };

  // Navigation Routing: Check if currently accessing '/admin' or ?admin=true
  const [isAdminPath, setIsAdminPath] = useState(checkIsAdmin());
  const [adminToken, setAdminToken] = useState<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('fortune_admin_token') : null
  );

  // Participant Flow Step: 'entry' | 'wheel' | 'result'
  const [step, setStep] = useState<'entry' | 'wheel' | 'result'>('entry');

  // Stored Participant Details from Step 1
  const [participantData, setParticipantData] = useState<{
    firstName: string;
    lastName: string;
    phone: string;
    qrCodeId?: string;
  } | null>(null);

  // Wheel configuration & Segments count (No prize names or stocks exposed)
  const [totalSegments, setTotalSegments] = useState<number>(8);
  const [brandName, setBrandName] = useState<string>('Omadli Sovg‘a');
  const [urlQrCode, setUrlQrCode] = useState<string>('');

  // Result from Server Spin
  const [spinWinnerResult, setSpinWinnerResult] = useState<{
    winningPrize: { name: string; description?: string; icon?: string };
    ticketId: string;
    timestamp: string;
  } | null>(null);

  // Listen to popstate / path changes
  useEffect(() => {
    const handleRouteChange = () => {
      setIsAdminPath(checkIsAdmin());
    };
    window.addEventListener('popstate', handleRouteChange);

    // Keyboard shortcut for admin: Ctrl+Shift+A or Alt+A
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') || (e.altKey && e.key.toLowerCase() === 'a')) {
        e.preventDefault();
        window.history.pushState({}, '', '/admin');
        setIsAdminPath(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Parse URL params for product QR code
    const params = new URLSearchParams(window.location.search);
    const qrParam = params.get('qr');
    if (qrParam) {
      setUrlQrCode(qrParam.trim().toUpperCase());
    }

    // Fetch public basic branding and wheel segment count
    fetch('/api/public/info')
      .then((res) => res.json())
      .then((data) => {
        if (data.brandName) setBrandName(data.brandName);
      })
      .catch(() => {});

    fetch('/api/wheel-segments')
      .then((res) => res.json())
      .then((data) => {
        if (data.totalSegments) setTotalSegments(data.totalSegments);
      })
      .catch(() => {});

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // -------------------------------------------------------------
  // ADMINISTRATOR SYSTEM (Completely Isolated at /admin)
  // -------------------------------------------------------------
  if (isAdminPath) {
    // If not authenticated, render strict login screen.
    // Unauthenticated visitors typing /admin CANNOT see the panel or data!
    if (!adminToken) {
      return (
        <AdminLogin
          onLoginSuccess={(token) => {
            setAdminToken(token);
            localStorage.setItem('fortune_admin_token', token);
          }}
        />
      );
    }

    // Authenticated admin view with sidebar, stats, tables, and CRUD operations
    return (
      <AdminDashboard
        token={adminToken}
        onLogout={() => {
          fetch('/api/admin/logout', {
            method: 'POST',
            headers: { Authorization: `Bearer ${adminToken}` },
          }).catch(() => {});
          setAdminToken(null);
          localStorage.removeItem('fortune_admin_token');
        }}
      />
    );
  }

  // -------------------------------------------------------------
  // PARTICIPANT PORTAL (Only Game Flow: Entry -> Wheel -> Result)
  // Zero admin links, zero prize lists, zero price/probability data!
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#070B19] text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-black relative overflow-x-hidden">
      {/* Luxury Radial Lighting Accents */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[650px] h-[650px] bg-gradient-to-b from-amber-500/10 via-blue-900/15 to-transparent rounded-full blur-3xl opacity-75" />
        <div className="absolute top-[35%] -left-32 w-80 h-80 bg-blue-700/10 rounded-full blur-3xl" />
        <div className="absolute top-[50%] -right-32 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl" />
      </div>

      {/* Main Dynamic Flow Container */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-4 py-8">
        {/* STEP 1: PARTICIPANT ENTRY (Name, Surname, Phone, Start Game button) */}
        {step === 'entry' && (
          <ParticipantEntryStep
            brandName={brandName}
            initialQrCode={urlQrCode}
            onSuccess={(data) => {
              setParticipantData(data);
              // Directly proceed to Step 2 (Wheel) without re-entering info!
              setStep('wheel');
            }}
          />
        )}

        {/* STEP 2: WHEEL SPIN (ONLY Centered Wheel and Spin button) */}
        {step === 'wheel' && participantData && (
          <WheelSpinStep
            participantData={participantData}
            totalSegments={totalSegments}
            onSpinSuccess={(result) => {
              setSpinWinnerResult(result);
              // Directly proceed to Step 3 (Celebration Result)
              setStep('result');
            }}
          />
        )}

        {/* STEP 3: CELEBRATION RESULT (Congratulation, Prize Name, Call Operator button) */}
        {step === 'result' && spinWinnerResult && participantData && (
          <WinnerCelebrationStep
            participantName={`${participantData.firstName} ${participantData.lastName}`}
            phone={participantData.phone}
            prizeName={spinWinnerResult.winningPrize.name}
            prizeIcon={spinWinnerResult.winningPrize.icon}
            ticketId={spinWinnerResult.ticketId}
            timestamp={spinWinnerResult.timestamp}
          />
        )}
      </main>

      {/* Quiet, Clean Footer with subtle Admin access */}
      <footer className="relative z-10 py-5 text-center text-[11px] text-slate-500 border-t border-slate-800/40">
        <div className="flex items-center justify-center gap-2">
          <span>© {new Date().getFullYear()} {brandName}. Barcha huquqlar himoyalangan.</span>
          <button
            onClick={() => {
              window.history.pushState({}, '', '/admin');
              setIsAdminPath(true);
            }}
            className="text-slate-700 hover:text-amber-400/80 p-1 rounded transition-colors cursor-pointer"
            title="Administrator Kirish"
          >
            🔒
          </button>
        </div>
      </footer>
    </div>
  );
}
