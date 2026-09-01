import React, { useMemo } from 'react';
import { OfficerItem, InspectionFormData } from '../types';
import { Users, User, ArrowRight, RotateCcw, Building, ShieldAlert, Sparkles, ChevronDown, CheckCircle2, FileText } from 'lucide-react';
import { motion } from 'motion/react';

interface AssistancePageProps {
  formData: InspectionFormData;
  units: string[];
  officers: OfficerItem[];
  onUpdateForm: (updates: Partial<InspectionFormData>) => void;
  onStartQuestions: () => void;
  onCancel: () => void;
}

export const AssistancePage: React.FC<AssistancePageProps> = ({
  formData,
  units,
  officers,
  onUpdateForm,
  onStartQuestions,
  onCancel,
}) => {
  // Check if unit on login is "UL PADANG" or "PLN" (case-insensitive & trimmed)
  const isNeedsAssistedUnit = useMemo(() => {
    const u = (formData.unit || '').trim().toUpperCase();
    return u === 'UL PADANG' || u === 'ULPADANG' || u.includes('PADANG') || u === 'PLN';
  }, [formData.unit]);

  // Determine effective unit for officer filtering
  const targetUnit = useMemo(() => {
    if (isNeedsAssistedUnit && formData.assistedUnit) {
      return formData.assistedUnit.trim().toUpperCase();
    }
    return (formData.unit || '').trim().toUpperCase();
  }, [isNeedsAssistedUnit, formData.assistedUnit, formData.unit]);

  // Helper to test if officer matches target unit
  const officerMatchesUnit = (officer: OfficerItem, target: string) => {
    if (!target) return true;
    const offUnit = (officer.unit || '').trim().toUpperCase();
    const offUlpId = (officer.ulpId || '').trim().toUpperCase();

    // If officer has no unit assigned, they can be matched
    if (!offUnit && !offUlpId) return true;

    // Exact match on unit or ulpId
    if (offUnit === target || offUlpId === target) return true;

    // Cleaned prefix comparison (e.g., "ULP BELANTI" vs "BELANTI")
    const cleanTarget = target.replace(/^(ULP|UL)\s+/i, '').trim();
    const cleanOffUnit = offUnit.replace(/^(ULP|UL)\s+/i, '').trim();

    if (cleanTarget && cleanOffUnit) {
      if (
        cleanTarget === cleanOffUnit ||
        cleanTarget.includes(cleanOffUnit) ||
        cleanOffUnit.includes(cleanTarget)
      ) {
        return true;
      }
    }

    if (offUnit.includes(target) || target.includes(offUnit)) {
      return true;
    }

    return false;
  };

  // Filter officers for Petugas 1 based strictly on chosen ULP
  const availableOfficers1 = useMemo(() => {
    if (!officers || officers.length === 0) return [];

    // If UL PADANG or PLN and assistedUnit not yet selected, wait for user to select
    if (isNeedsAssistedUnit && !formData.assistedUnit) {
      return [];
    }

    let filtered = officers.filter((o) => officerMatchesUnit(o, targetUnit));

    // Fallback: If no officer matched the filter, fallback to all officers so the dropdown is not empty
    if (filtered.length === 0) {
      filtered = officers;
    }

    // Deduplicate by name
    const seen = new Set<string>();
    const unique: OfficerItem[] = [];
    for (const o of filtered) {
      const nameKey = o.name.trim().toUpperCase();
      if (!seen.has(nameKey)) {
        seen.add(nameKey);
        unique.push(o);
      }
    }
    return unique;
  }, [officers, targetUnit, isNeedsAssistedUnit, formData.assistedUnit]);

  // Filter officers for Petugas 2 (EXCLUDING PETUGAS 1)
  const availableOfficers2 = useMemo(() => {
    return availableOfficers1.filter(
      (o) => o.name.trim().toUpperCase() !== (formData.officer1 || '').trim().toUpperCase()
    );
  }, [availableOfficers1, formData.officer1]);

  // Units available for "Unit Yang Didampingi" (filter out UL PADANG / PLN or show all other ULPs)
  const assistedUnitOptions = useMemo(() => {
    return units.filter((u) => {
      const norm = u.trim().toUpperCase();
      return norm !== 'UL PADANG' && norm !== 'ULPADANG' && !norm.includes('PADANG') && norm !== 'PLN';
    });
  }, [units]);

  // Validation
  const isFormValid = useMemo(() => {
    if (isNeedsAssistedUnit && !formData.assistedUnit) {
      return false;
    }
    return Boolean((formData.workOrderNo || '').trim() && formData.officer1 && formData.officer2);
  }, [isNeedsAssistedUnit, formData.assistedUnit, formData.workOrderNo, formData.officer1, formData.officer2]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-lg mx-auto px-4 py-6 sm:py-8"
    >
      {/* Session Header Card */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-2xl p-5 mb-5 shadow-lg border border-slate-800">
        <div className="flex items-center justify-between gap-3 text-xs mb-2">
          <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
            Divisi: {formData.division}
          </span>
          <span className="text-slate-400 font-medium">Unit: {formData.unit}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">
              Data Pendampingan Petugas
            </h2>
            <p className="text-xs text-slate-300">
              Pendamping: <span className="text-amber-300 font-semibold">{formData.companion}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Assistance Form */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-200/50 p-6 sm:p-7 space-y-5">
        {/* CONDITIONAL: UNIT YANG DIDAMPINGI (Muncul jika unit login = UL PADANG atau PLN) */}
        {isNeedsAssistedUnit && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.25 }}
            className="space-y-1.5 p-4 rounded-xl bg-blue-50/60 border border-blue-200/80"
          >
            <label className="block text-xs font-bold uppercase tracking-wider text-blue-950 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Building className="w-4 h-4 text-blue-600" />
                Unit Yang Didampingi
              </span>
              <span className="text-[10px] text-blue-600 font-semibold px-2 py-0.5 rounded bg-blue-100">
                Wajib untuk {formData.unit || 'UL PADANG'}
              </span>
            </label>
            <div className="relative">
              <select
                value={formData.assistedUnit}
                onChange={(e) => {
                  onUpdateForm({
                    assistedUnit: e.target.value,
                    officer1: '',
                    officer2: '',
                  });
                }}
                className="w-full appearance-none bg-white border border-blue-300 hover:border-blue-500 focus:border-blue-600 text-slate-900 text-sm font-semibold rounded-xl px-4 py-3.5 pr-10 focus:ring-4 focus:ring-blue-600/15 transition outline-none cursor-pointer"
              >
                <option value="">-- Pilih Unit Yang Didampingi --</option>
                {assistedUnitOptions.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-5 h-5 text-blue-500 pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[11px] text-blue-700 mt-1">
              Petugas yang muncul di bawah akan disesuaikan dengan unit yang didampingi.
            </p>
          </motion.div>
        )}

        {/* NO WORK ORDER */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              No Work Order
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Sheet: LAPORAN_YANTEK</span>
          </label>
          <input
            type="text"
            value={formData.workOrderNo || ''}
            onChange={(e) => onUpdateForm({ workOrderNo: e.target.value })}
            placeholder="Masukkan No Work Order..."
            className="w-full bg-slate-50 border border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:bg-white text-slate-900 text-sm font-semibold rounded-xl px-4 py-3.5 focus:ring-4 focus:ring-blue-600/10 transition outline-none"
          />
        </div>

        {/* NAMA PETUGAS 1 */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-600" />
              Nama Petugas 1
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Sheet: YANTEK</span>
          </label>
          <div className="relative">
            <select
              value={formData.officer1}
              onChange={(e) => {
                const newOfficer1 = e.target.value;
                onUpdateForm({
                  officer1: newOfficer1,
                  // If Petugas 2 was the same, reset Petugas 2
                  officer2: formData.officer2 === newOfficer1 ? '' : formData.officer2,
                });
              }}
              disabled={isNeedsAssistedUnit && !formData.assistedUnit}
              className="w-full appearance-none bg-slate-50 border border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:bg-white text-slate-900 text-sm font-semibold rounded-xl px-4 py-3.5 pr-10 focus:ring-4 focus:ring-blue-600/10 transition outline-none cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
            >
              <option value="">
                {isNeedsAssistedUnit && !formData.assistedUnit
                  ? '-- Pilih Unit Yang Didampingi Dahulu --'
                  : '-- Pilih Nama Petugas 1 --'}
              </option>
              {availableOfficers1.map((officer, idx) => (
                <option key={`${officer.name}-${idx}`} value={officer.name}>
                  {officer.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-5 h-5 text-slate-400 pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* NAMA PETUGAS 2 */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-cyan-600" />
              Nama Petugas 2
            </span>
            <span className="text-[10px] text-amber-600 font-medium">Beda dari Petugas 1</span>
          </label>
          <div className="relative">
            <select
              value={formData.officer2}
              onChange={(e) => onUpdateForm({ officer2: e.target.value })}
              disabled={!formData.officer1}
              className="w-full appearance-none bg-slate-50 border border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:bg-white text-slate-900 text-sm font-semibold rounded-xl px-4 py-3.5 pr-10 focus:ring-4 focus:ring-blue-600/10 transition outline-none cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
            >
              <option value="">
                {!formData.officer1
                  ? '-- Pilih Petugas 1 Terlebih Dahulu --'
                  : availableOfficers2.length === 0
                  ? '-- Tidak ada petugas lain tersedia --'
                  : '-- Pilih Nama Petugas 2 --'}
              </option>
              {availableOfficers2.map((officer, idx) => (
                <option key={`${officer.name}-${idx}`} value={officer.name}>
                  {officer.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-5 h-5 text-slate-400 pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
          </div>
          {formData.officer1 && (
            <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Petugas 1 ({formData.officer1}) otomatis disaring dari daftar Petugas 2.
            </p>
          )}
        </div>

        {/* 2 ACTION BUTTONS: "MULAI ISI PERTANYAAN" & "BATAL" */}
        <div className="pt-4 space-y-3">
          <button
            type="button"
            onClick={onStartQuestions}
            disabled={!isFormValid}
            className="w-full min-h-[50px] flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 active:scale-[0.99] text-white text-base font-bold rounded-xl py-3.5 px-6 shadow-lg shadow-blue-600/30 transition disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed cursor-pointer"
          >
            <span>MULAI ISI PERTANYAAN</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="w-full min-h-[46px] flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 active:scale-[0.99] text-slate-700 text-sm font-bold rounded-xl py-3 px-6 border border-slate-200 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>BATAL (KOSONGKAN ISIAN)</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
