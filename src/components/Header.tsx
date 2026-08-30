import React, { useState } from 'react';
import { InspectionFormData, GoogleAuthState } from '../types';
import { requestGoogleSignIn, signOutGoogle } from '../services/googleAuth';
import { ShieldCheck, LogOut, CheckCircle2, CloudUpload, UserCheck, AlertCircle, RefreshCw } from 'lucide-react';

interface HeaderProps {
  formData: InspectionFormData;
  authState: GoogleAuthState;
  currentStep: string;
  onReset: () => void;
  onRefreshData?: () => void;
  isLoadingData?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  formData,
  authState,
  currentStep,
  onReset,
  onRefreshData,
  isLoadingData,
}) => {
  const [showAuthMenu, setShowAuthMenu] = useState(false);

  const handleGoogleConnect = async () => {
    await requestGoogleSignIn();
  };

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 border-b border-blue-800/60 text-white px-4 py-3 shadow-xl">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Brand / Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center justify-center">
            <img
              src="https://lh3.googleusercontent.com/d/1HGB_XQgMAG99kFWvUFNptJv6F319KX6_"
              alt="1DwP Logo"
              className="w-14 h-14 sm:w-18 sm:h-18 object-contain drop-shadow-md"
              onError={(e) => {
                // Fallback if image fails to load
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        </div>

        {/* Center: Header Titles (Embossed Yellow) */}
        <div className="flex-1 text-center px-1">
          <div 
            className="text-xs sm:text-sm md:text-base font-black tracking-wider text-yellow-300 uppercase leading-tight"
            style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.9), 0 0 12px rgba(253, 224, 71, 0.5)' }}
          >
            PLN ELECTRICITY SERVICES
          </div>
          <div 
            className="text-[11px] sm:text-xs md:text-sm font-bold tracking-wide text-yellow-200 uppercase leading-tight mt-0.5"
            style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.9), 0 0 8px rgba(254, 240, 138, 0.4)' }}
          >
            UP4 SUMATERA BARAT
          </div>
          <div 
            className="text-[10px] sm:text-[11px] md:text-xs font-semibold tracking-wider text-yellow-100 uppercase leading-tight mt-0.5"
            style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)' }}
          >
            UNIT LAYANAN PADANG
          </div>
        </div>

        {/* Right Actions & Status */}
        <div className="flex items-center gap-2.5">
          {/* Refresh Data Button */}
          {onRefreshData && (
            <button
              onClick={onRefreshData}
              disabled={isLoadingData}
              title="Perbarui Data Spreadsheet"
              className="p-2.5 rounded-xl bg-blue-900/80 hover:bg-blue-800 active:scale-95 text-blue-200 transition border border-blue-700/60 disabled:opacity-50 shadow-sm cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingData ? 'animate-spin text-blue-400' : ''}`} />
            </button>
          )}

          {/* Google Auth Status Pill */}
          <div className="relative">
            <button
              onClick={() => setShowAuthMenu(!showAuthMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white text-slate-800 text-xs font-bold hover:bg-slate-100 transition shadow-md cursor-pointer border border-slate-200"
              title="Koneksi Google Spreadsheet & Drive Aktif Otomatis"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Terhubung</span>
            </button>

            {/* Auth Dropdown Menu */}
            {showAuthMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 text-white rounded-xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="text-xs border-b border-slate-800 pb-2 mb-2">
                  <div className="text-slate-400 font-medium">Status Koneksi Google:</div>
                  <div className="font-semibold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Terhubung Otomatis</span>
                  </div>
                  {authState.userEmail && (
                    <div className="text-[11px] text-slate-300 truncate mt-1">
                      Akun: <span className="text-white font-medium">{authState.userEmail}</span>
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 space-y-1.5 mb-3 bg-slate-800/80 p-2 rounded-lg border border-slate-700/50">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Google Sheets:</span>
                    <span className="text-emerald-400 font-medium">Aktif Online</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Google Drive:</span>
                    <span className="text-emerald-400 font-medium">Siap Simpan Foto</span>
                  </div>
                </div>

                {!authState.accessToken ? (
                  <button
                    onClick={() => {
                      handleGoogleConnect();
                      setShowAuthMenu(false);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 text-xs text-blue-200 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 py-1.5 rounded-lg transition font-medium"
                  >
                    <CloudUpload className="w-3.5 h-3.5" /> Sambungkan Akun Khusus (Opsional)
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      signOutGoogle();
                      setShowAuthMenu(false);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 hover:bg-rose-900/50 py-1.5 rounded-lg transition"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Ganti Akun Google
                  </button>
                )}
              </div>
            )}
          </div>

          {/* User / Session Active Indicator */}
          {currentStep !== 'login' && formData.companion && (
            <button
              onClick={onReset}
              title="Keluar / Ganti Pendamping"
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-bold hover:bg-rose-500/30 active:scale-95 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
