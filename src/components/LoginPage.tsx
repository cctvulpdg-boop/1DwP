import React, { useMemo, useState } from 'react';
import { DivisionType, CompanionItem, DivisionItem, UnitItem } from '../types';
import { Building2, Layers, UserCheck, Sparkles, ChevronDown, CheckCircle2, ArrowRight, ShieldCheck, Lock, X } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginPageProps {
  divisions: string[];
  units: string[];
  companions: CompanionItem[];
  divisionItems?: DivisionItem[];
  unitItems?: UnitItem[];
  selectedDivision: DivisionType;
  selectedUnit: string;
  selectedCompanion: string;
  onSelectDivision: (val: DivisionType) => void;
  onSelectUnit: (val: string) => void;
  onSelectCompanion: (val: string) => void;
  onLogin: () => void;
  onAdminLogin: () => void;
  isLoading?: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  divisions,
  units,
  companions,
  divisionItems,
  unitItems,
  selectedDivision,
  selectedUnit,
  selectedCompanion,
  onSelectDivision,
  onSelectUnit,
  onSelectCompanion,
  onLogin,
  onAdminLogin,
  isLoading,
}) => {
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'Admin123') {
      setAdminError('');
      setAdminPassword('');
      setShowAdminModal(false);
      onAdminLogin();
    } else {
      setAdminError('Password Admin salah! (Gunakan: Admin123)');
    }
  };
  // Filter companions based on selected Unit (ulpId) and Division (divisiId)
  const filteredCompanions = useMemo(() => {
    if (!selectedUnit || !selectedDivision) {
      return [];
    }

    const normUnit = selectedUnit.trim().toUpperCase();
    const normDiv = selectedDivision.trim().toUpperCase();

    // Look up ID from divisionItems & unitItems
    const unitObj = unitItems?.find((u) => u.name.trim().toUpperCase() === normUnit);
    const divObj = divisionItems?.find((d) => d.name.trim().toUpperCase() === normDiv);

    const selectedUnitId = (unitObj?.id || '').trim().toUpperCase();
    const selectedDivId = (divObj?.id || '').trim().toUpperCase();

    const unitIndex = units.findIndex((u) => u.trim().toUpperCase() === normUnit);
    const divIndex = divisions.findIndex((d) => d.trim().toUpperCase() === normDiv);

    // Stripped unit name (removes "ULP", "UL", etc.)
    const cleanSelectedUnit = normUnit.replace(/^(ULP|UL)\s+/i, '').trim();

    // Check if companion matches the selected unit (ulpId)
    const matchesUnit = (c: CompanionItem) => {
      const rawUlp = (c.ulpId || c.unit || '').trim().toUpperCase();
      if (!rawUlp || rawUlp === 'ALL' || rawUlp === '*' || rawUlp === '-') {
        return true;
      }

      // 1. Direct name match
      if (rawUlp === normUnit) return true;

      // 2. Direct ID match from ULP sheet
      if (selectedUnitId && rawUlp === selectedUnitId) return true;

      // 3. Match 1-based index or 0-based index
      if (unitIndex !== -1 && (rawUlp === String(unitIndex + 1) || rawUlp === String(unitIndex))) {
        return true;
      }

      // 4. Cleaned prefix match ("BELANTI" <-> "ULP BELANTI")
      const cleanRawUlp = rawUlp.replace(/^(ULP|UL)\s+/i, '').trim();
      if (
        cleanRawUlp &&
        cleanSelectedUnit &&
        (cleanRawUlp === cleanSelectedUnit ||
          cleanSelectedUnit.includes(cleanRawUlp) ||
          cleanRawUlp.includes(cleanSelectedUnit))
      ) {
        return true;
      }

      // 5. Substring / contains
      if (rawUlp.includes(normUnit) || normUnit.includes(rawUlp)) {
        return true;
      }

      return false;
    };

    // Check if companion matches the selected division (divisiId)
    const matchesDivisi = (c: CompanionItem) => {
      const nameUpper = c.name.trim().toUpperCase();

      // Check if name is "MUL" (exact word, starts with MUL, or first token is MUL)
      const isMul =
        nameUpper === 'MUL' ||
        nameUpper.startsWith('MUL ') ||
        nameUpper.split(/[\s\-_/]+/)[0] === 'MUL';

      // SPECIAL USER REQUIREMENT:
      // "Untuk name "MUL" akan selalu muncul jika dipilih pada Divisi "YANTEK" ataupun "MANBILL" namun tetap mengikuti ulpId padaSheet "PENDAMPING""
      if (isMul) {
        if (
          normDiv === 'YANTEK' ||
          normDiv === 'MANBILL' ||
          normDiv.includes('YANTEK') ||
          normDiv.includes('MANBILL')
        ) {
          return true;
        }
      }

      const rawDiv = (c.divisiId || c.division || '').trim().toUpperCase();
      if (!rawDiv || rawDiv === 'ALL' || rawDiv === '*' || rawDiv === '-') {
        return true;
      }

      // 1. Direct division name match
      if (rawDiv === normDiv) return true;

      // 2. Direct division ID match from DIVISI sheet
      if (selectedDivId && rawDiv === selectedDivId) return true;

      // 3. Match 1-based index or 0-based index
      if (divIndex !== -1 && (rawDiv === String(divIndex + 1) || rawDiv === String(divIndex))) {
        return true;
      }

      // 4. Substring match
      if (rawDiv.includes(normDiv) || normDiv.includes(rawDiv)) {
        return true;
      }

      return false;
    };

    const result = companions.filter((c) => matchesUnit(c) && matchesDivisi(c));

    // Deduplicate by name
    const seen = new Set<string>();
    const uniqueCompanions: CompanionItem[] = [];
    for (const item of result) {
      const nameKey = item.name.trim().toUpperCase();
      if (!seen.has(nameKey)) {
        seen.add(nameKey);
        uniqueCompanions.push(item);
      }
    }

    return uniqueCompanions;
  }, [companions, units, divisions, unitItems, divisionItems, selectedUnit, selectedDivision]);

  const canSubmit = selectedUnit && selectedDivision && selectedCompanion;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) {
      onLogin();
    }
  };

  return (
    <div className="relative w-full min-h-[calc(100vh-80px)] flex items-center justify-center p-4 overflow-hidden rounded-2xl my-2">
      {/* Background Image Layer */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{
          backgroundImage: `url('https://lh3.googleusercontent.com/d/1nD5vYTNAeuOWyN2nWayd5dSott-15Qi_')`,
        }}
      >
        {/* Backdrop Overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/40 to-slate-950/70 backdrop-blur-[2px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative z-10 w-full max-w-md mx-auto py-4 sm:py-6"
      >
        {/* Welcome Card & Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-40 h-40 sm:w-48 sm:h-48 mb-1 drop-shadow-2xl overflow-hidden bg-white/80 backdrop-blur-md rounded-full p-2 border border-white/40">
            <img
              src="https://lh3.googleusercontent.com/d/1HGB_XQgMAG99kFWvUFNptJv6F319KX6_"
              alt="1DwP Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <p className="text-sm text-white font-bold mt-2 drop-shadow-md bg-slate-900/50 backdrop-blur-md py-1.5 px-4 rounded-full inline-block border border-white/20">
            Silakan pilih Unit, Divisi, dan Nama Pendamping untuk memulai
          </p>
        </div>

        {/* Main Login Form Card */}
        <div className="bg-white/95 backdrop-blur-xl border border-white/60 rounded-2xl shadow-2xl shadow-slate-950/50 p-6 sm:p-7 relative overflow-hidden">
          {/* Subtle Top Accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600" />

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. INPUT UNIT (ULP) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-600" />
                1. Unit (ULP)
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Sheet: ULP</span>
            </label>
            <div className="relative">
              <select
                value={selectedUnit}
                onChange={(e) => {
                  onSelectUnit(e.target.value);
                  onSelectCompanion(''); // Reset companion on unit change
                }}
                disabled={isLoading}
                className="w-full appearance-none bg-slate-50 border border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:bg-white text-slate-900 text-sm font-semibold rounded-xl px-4 py-3.5 pr-10 focus:ring-4 focus:ring-blue-600/10 transition outline-none cursor-pointer disabled:bg-slate-100"
              >
                <option value="">-- Pilih Unit / ULP --</option>
                {units.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-5 h-5 text-slate-400 pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* 2. INPUT DIVISI */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" />
                2. Divisi
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Sheet: DIVISI</span>
            </label>
            <div className="relative">
              <select
                value={selectedDivision}
                onChange={(e) => {
                  onSelectDivision(e.target.value);
                  onSelectCompanion(''); // Reset companion on division change
                }}
                disabled={isLoading}
                className="w-full appearance-none bg-slate-50 border border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:bg-white text-slate-900 text-sm font-semibold rounded-xl px-4 py-3.5 pr-10 focus:ring-4 focus:ring-blue-600/10 transition outline-none cursor-pointer disabled:bg-slate-100"
              >
                <option value="">-- Pilih Divisi --</option>
                {divisions.map((div) => (
                  <option key={div} value={div}>
                    {div}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-5 h-5 text-slate-400 pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* 3. INPUT PENDAMPING (Mengikuti Unit & Divisi) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-blue-600" />
                3. Nama Pendamping
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Sheet: PENDAMPING</span>
            </label>
            <div className="relative">
              <select
                value={selectedCompanion}
                onChange={(e) => onSelectCompanion(e.target.value)}
                disabled={isLoading || !selectedUnit || !selectedDivision}
                className="w-full appearance-none bg-slate-50 border border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:bg-white text-slate-900 text-sm font-semibold rounded-xl px-4 py-3.5 pr-10 focus:ring-4 focus:ring-blue-600/10 transition outline-none cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="">
                  {!selectedUnit && !selectedDivision
                    ? '-- Pilih Unit & Divisi Terlebih Dahulu --'
                    : !selectedUnit
                    ? '-- Pilih Unit Terlebih Dahulu --'
                    : !selectedDivision
                    ? '-- Pilih Divisi Terlebih Dahulu --'
                    : filteredCompanions.length === 0
                    ? '-- Tidak ada pendamping untuk Unit & Divisi ini --'
                    : '-- Pilih Nama Pendamping --'}
                </option>
                {filteredCompanions.map((comp, idx) => (
                  <option key={`${comp.name}-${idx}`} value={comp.name}>
                    {comp.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-5 h-5 text-slate-400 pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
            </div>
            {selectedUnit && selectedDivision && filteredCompanions.length > 0 && (
              <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Menampilkan {filteredCompanions.length} pendamping untuk {selectedUnit} - {selectedDivision}
              </p>
            )}
          </div>

          {/* SUBMIT / LOGIN BUTTON */}
          <div className="pt-2 space-y-3">
            <button
              type="submit"
              disabled={!canSubmit || isLoading}
              className="w-full min-h-[52px] flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 active:scale-[0.99] text-white text-base font-extrabold rounded-xl py-4 px-6 shadow-xl shadow-blue-600/30 transition disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed cursor-pointer"
            >
              <span>Mulai</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            {/* ADMIN BUTTON */}
            <button
              type="button"
              onClick={() => {
                setAdminError('');
                setAdminPassword('');
                setShowAdminModal(true);
              }}
              className="w-full min-h-[48px] flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 active:scale-[0.99] text-white text-sm font-bold rounded-xl py-3 px-6 shadow-md transition cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>ADMIN</span>
            </button>
          </div>
        </form>

        {/* Database Info Tag */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span className="font-mono">Spreadsheet ID: 1OLoqr...Nmhw</span>
          <span className="flex items-center gap-1 text-blue-600 font-semibold">
            <Sparkles className="w-3 h-3" /> Real-time Sync
          </span>
        </div>
      </div>

      {/* Admin Password Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative overflow-hidden"
          >
            <button
              onClick={() => setShowAdminModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Autentikasi Admin</h3>
                <p className="text-xs text-slate-500">Masukkan password admin untuk masuk ke Dashboard</p>
              </div>
            </div>

            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Password Admin
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Masukkan password..."
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white text-slate-900 text-sm font-semibold rounded-xl px-4 py-3 outline-none transition"
                />
              </div>

              {adminError && (
                <p className="text-xs text-rose-600 font-semibold bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                  {adminError}
                </p>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-bold py-3 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold py-3 rounded-xl shadow-lg transition"
                >
                  Masuk Dashboard
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      </motion.div>
    </div>
  );
};
