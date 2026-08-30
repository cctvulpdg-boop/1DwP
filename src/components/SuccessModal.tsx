import React, { useState } from 'react';
import { InspectionFormData, SPREADSHEET_ID, FOLDER_EVIDEN_ID } from '../types';
import { CheckCircle, ExternalLink, PlusCircle, LogOut, FileSpreadsheet, FolderGit2, Calendar, Hash, Copy, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface SuccessModalProps {
  formData: InspectionFormData;
  sheetName: string;
  onNewInspection: () => void;
  onLogout: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  formData,
  sheetName,
  onNewInspection,
  onLogout,
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`;
  const driveUrl = `https://drive.google.com/drive/folders/${FOLDER_EVIDEN_ID}`;

  const yaCount = Object.values(formData.answers).filter((a) => a === 'YA').length;
  const tidakCount = Object.values(formData.answers).filter((a) => a === 'TIDAK').length;

  const handleCopyId = () => {
    if (formData.reportId) {
      navigator.clipboard.writeText(formData.reportId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-lg mx-auto px-4 py-6 sm:py-8"
    >
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden">
        {/* Success Hero Header */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-7 text-center relative">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center mx-auto mb-3 text-white shadow-xl">
            <CheckCircle className="w-9 h-9 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            Laporan Berhasil Disimpan!
          </h2>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-xs mx-auto">
            Data pendampingan dan foto eviden ber-watermark telah disinkronkan.
          </p>
        </div>

        {/* Details Receipt Card */}
        <div className="p-6 space-y-4">
          {/* Target Sheet & Folder badges */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href={spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:border-blue-300 transition text-xs font-semibold text-slate-800 group"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="truncate">
                <div className="text-[10px] text-slate-400">Google Sheet</div>
                <div className="truncate group-hover:text-blue-600">{sheetName}</div>
              </div>
              <ExternalLink className="w-3 h-3 ml-auto text-slate-400" />
            </a>

            <a
              href={driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-cyan-50 hover:border-cyan-300 transition text-xs font-semibold text-slate-800 group"
            >
              <FolderGit2 className="w-4 h-4 text-blue-600 shrink-0" />
              <div className="truncate">
                <div className="text-[10px] text-slate-400">Google Drive</div>
                <div className="truncate group-hover:text-cyan-600">Folder EVIDEN</div>
              </div>
              <ExternalLink className="w-3 h-3 ml-auto text-slate-400" />
            </a>
          </div>

          {/* Receipt Breakdown */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5 text-xs">
            {formData.reportId && (
              <div className="flex justify-between items-center text-slate-500 pb-2.5 border-b border-slate-200 bg-cyan-50/70 -mx-4 -mt-4 p-3 rounded-t-2xl border-cyan-100">
                <span className="flex items-center gap-1.5 font-semibold text-cyan-900">
                  <Hash className="w-4 h-4 text-cyan-600" /> ID Laporan Unik
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-cyan-800 bg-white px-2 py-1 rounded-md border border-cyan-200 shadow-xs">
                    {formData.reportId}
                  </span>
                  <button
                    onClick={handleCopyId}
                    title="Salin ID"
                    className="p-1.5 rounded-md bg-white hover:bg-cyan-100 text-cyan-700 border border-cyan-200 transition shadow-xs cursor-pointer"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center text-slate-500 pb-2 border-b border-slate-200">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Tanggal / Jam
              </span>
              <span className="font-semibold text-slate-800 font-mono">
                {new Date().toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-500">
              <span>Divisi / Unit</span>
              <span className="font-semibold text-slate-800">
                {formData.division} - {formData.unit}
              </span>
            </div>

            {formData.assistedUnit && (
              <div className="flex justify-between items-center text-slate-500">
                <span>Unit Yang Didampingi</span>
                <span className="font-semibold text-blue-700">{formData.assistedUnit}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-slate-500">
              <span>Pendamping</span>
              <span className="font-semibold text-slate-800">{formData.companion}</span>
            </div>

            <div className="flex justify-between items-center text-slate-500">
              <span>Petugas 1 & 2</span>
              <span className="font-semibold text-slate-800">
                {formData.officer1} & {formData.officer2}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-500 pt-2 border-t border-slate-200">
              <span>Hasil Jawaban</span>
              <span className="font-semibold text-slate-800">
                <span className="text-emerald-600 font-bold">{yaCount} YA</span> / <span className="text-rose-600 font-bold">{tidakCount} TIDAK</span>
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-500">
              <span>Foto Eviden Watermark</span>
              <span className="font-semibold text-blue-600">
                {formData.evidenPhotos.length} Foto Tersimpan
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              onClick={onNewInspection}
              className="w-full min-h-[48px] flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 active:scale-[0.99] text-white text-sm font-bold rounded-xl py-3 px-4 shadow-lg shadow-blue-600/25 transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>MULAI PENDAMPINGAN BARU</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 active:scale-[0.99] text-slate-700 text-xs font-bold rounded-xl py-2.5 px-4 border border-slate-200 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-slate-500" />
              <span>KELUAR KE HALAMAN UTAMA</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
