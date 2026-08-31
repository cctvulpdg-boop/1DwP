import React, { useState, useRef, useMemo } from 'react';
import { QuestionItem, InspectionFormData, EvidenPhoto } from '../types';
import { applyWatermark, getCurrentLocation } from '../utils/watermark';
import { uploadEvidenToDrive, dataUrlToBlob } from '../services/googleDrive';
import { submitInspectionReport } from '../services/googleSheets';
import {
  CheckCircle2,
  XCircle,
  Camera,
  Upload,
  Trash2,
  Send,
  ArrowLeft,
  Image as ImageIcon,
  MapPin,
  Clock,
  Sparkles,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Eye,
  Check,
  Layers,
  ChevronRight,
  FolderTree,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuestionsPageProps {
  formData: InspectionFormData;
  questions: QuestionItem[];
  onUpdateForm: (updates: Partial<InspectionFormData>) => void;
  onBackToAssistance: () => void;
  onSubmitSuccess: (sheetName: string, summaryInfo: any) => void;
}

interface QuestionSubGroupStructure {
  subName: string;
  questions: QuestionItem[];
}

interface QuestionGroupStructure {
  groupName: string;
  subGroups: QuestionSubGroupStructure[];
  totalCount: number;
  answeredCount: number;
}

export const parseAnswerAndRank = (val: string | undefined): { answer: 'YA' | 'TIDAK' | null; rank: number } => {
  if (!val) return { answer: null, rank: 5 };
  const str = String(val).trim();
  let answer: 'YA' | 'TIDAK' | null = null;
  let rank = 5;

  if (str.toUpperCase().startsWith('TIDAK') || str.toUpperCase().startsWith('TDK')) {
    answer = 'TIDAK';
  } else if (str.toUpperCase().startsWith('YA')) {
    answer = 'YA';
  }

  const rankMatch = str.match(/-\s*(\d+)/);
  if (rankMatch) {
    const parsedRank = parseInt(rankMatch[1], 10);
    if (parsedRank >= 1 && parsedRank <= 10) {
      rank = parsedRank;
    }
  }

  return { answer, rank };
};

export const QuestionsPage: React.FC<QuestionsPageProps> = ({
  formData,
  questions,
  onUpdateForm,
  onBackToAssistance,
  onSubmitSuccess,
}) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState<string>('');
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'unanswered'>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Compute answers count
  const answeredCount = Object.keys(formData.answers).filter(
    (k) => formData.answers[Number(k)] !== undefined && formData.answers[Number(k)] !== null && String(formData.answers[Number(k)]).trim() !== ''
  ).length;

  const totalQuestions = questions.length;
  const isAllAnswered = answeredCount >= totalQuestions && totalQuestions > 0;
  const hasPhotos = formData.evidenPhotos.length > 0;
  const canSubmit = isAllAnswered && hasPhotos;

  // Handle answer selection
  const handleSelectAnswer = (qId: number, answer: 'YA' | 'TIDAK') => {
    const currentVal = formData.answers[qId];
    const { rank } = parseAnswerAndRank(currentVal);
    onUpdateForm({
      answers: {
        ...formData.answers,
        [qId]: `${answer} - ${rank}`,
      },
    });
  };

  // Handle rank selection (1 s/d 10)
  const handleSelectRank = (qId: number, rank: number) => {
    const currentVal = formData.answers[qId];
    const { answer } = parseAnswerAndRank(currentVal);
    const activeAnswer = answer || 'YA';
    onUpdateForm({
      answers: {
        ...formData.answers,
        [qId]: `${activeAnswer} - ${rank}`,
      },
    });
  };

  // Handle note change
  const handleNoteChange = (qId: number, text: string) => {
    onUpdateForm({
      notes: {
        ...formData.notes,
        [qId]: text,
      },
    });
  };

  // Process selected or captured photo
  const handlePhotoCapture = async (file: File) => {
    try {
      setIsCapturing(true);
      setSubmitProgress('Mengambil data lokasi GPS & memproses watermark...');

      // 1. Get GPS coordinates
      const loc = await getCurrentLocation();

      // 2. Apply watermark
      const watermarked = await applyWatermark(file, {
        division: formData.division,
        unit: formData.unit,
        assistedUnit: formData.assistedUnit,
        companion: formData.companion,
        officer1: formData.officer1,
        officer2: formData.officer2,
        latitude: loc?.latitude,
        longitude: loc?.longitude,
        locationString: loc?.locationString,
      });

      const newPhoto: EvidenPhoto = {
        id: `EVIDEN-${Date.now()}`,
        dataUrl: watermarked.dataUrl,
        blob: watermarked.blob,
        timestamp: new Date().toISOString(),
        latitude: loc?.latitude,
        longitude: loc?.longitude,
        locationString: loc ? `${loc.latitude?.toFixed(5)}, ${loc.longitude?.toFixed(5)}` : 'Lokasi Disematkan',
      };

      onUpdateForm({
        evidenPhotos: [...formData.evidenPhotos, newPhoto],
      });
    } catch (err: any) {
      console.error('Error processing photo watermark:', err);
      alert('Gagal memproses foto: ' + (err?.message || 'Error'));
    } finally {
      setIsCapturing(false);
      setSubmitProgress('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  // Delete photo
  const handleDeletePhoto = (photoId: string) => {
    onUpdateForm({
      evidenPhotos: formData.evidenPhotos.filter((p) => p.id !== photoId),
    });
  };

  // Submit complete report
  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setSubmitProgress('1/3: Mengunggah foto eviden ke Google Drive Folder (1rgh6LzMxuTz7LxkEZp1YxBcEluBd24s4)...');

      // 1. Upload all photos to Google Drive
      const uploadedPhotos: EvidenPhoto[] = [];
      for (let i = 0; i < formData.evidenPhotos.length; i++) {
        const p = formData.evidenPhotos[i];
        setSubmitProgress(`1/3: Mengunggah foto eviden ${i + 1} dari ${formData.evidenPhotos.length} ke Google Drive...`);

        const blob = p.blob || dataUrlToBlob(p.dataUrl);
        const fileName = `EVIDEN_${formData.division}_${formData.unit.replace(/\s+/g, '_')}_${Date.now()}_${i + 1}.jpg`;
        const driveResult = await uploadEvidenToDrive(blob, fileName);

        uploadedPhotos.push({
          ...p,
          driveFileId: driveResult.fileId,
          driveViewLink: driveResult.webViewLink,
        });
      }

      setSubmitProgress('2/3: Menyimpan data laporan pendampingan ke Google Spreadsheet...');

      const updatedFormData: InspectionFormData = {
        ...formData,
        evidenPhotos: uploadedPhotos,
        submittedAt: new Date().toISOString(),
      };

      // 2. Submit to Google Sheets (LAPORAN_YANTEK / LAPORAN_MANBILL)
      const reportRes = await submitInspectionReport(updatedFormData, questions);

      setSubmitProgress('3/3: Menyelesaikan sinkronisasi data...');

      onSubmitSuccess(reportRes.sheetName, {
        ...updatedFormData,
        reportId: reportRes.reportId || updatedFormData.reportId,
        reportResult: reportRes,
      });
    } catch (err: any) {
      console.error('Submission failed:', err);
      alert('Gagal mengirimkan laporan: ' + (err?.message || 'Terjadi kesalahan'));
    } finally {
      setIsSubmitting(false);
      setSubmitProgress('');
    }
  };

  const displayedQuestions = filterMode === 'unanswered'
    ? questions.filter((q) => !formData.answers[q.id])
    : questions;

  // Group questions by Kelompok & Sub-Pertanyaan
  const groupedStructure = useMemo(() => {
    const groupsMap = new Map<string, Map<string, QuestionItem[]>>();

    for (const q of displayedQuestions) {
      const groupKey = q.kelompokName?.trim() || q.category?.trim() || 'KELOMPOK UMUM';
      // Only keep subKey if it is present and not empty
      const rawSub = q.subKelompokName?.trim() || '';
      const subKey =
        rawSub &&
        rawSub !== '-' &&
        rawSub.toLowerCase() !== 'null' &&
        rawSub.toLowerCase() !== 'undefined' &&
        rawSub.toLowerCase() !== 'none'
          ? rawSub
          : '';

      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, new Map());
      }
      const subMap = groupsMap.get(groupKey)!;
      if (!subMap.has(subKey)) {
        subMap.set(subKey, []);
      }
      subMap.get(subKey)!.push(q);
    }

    const result: QuestionGroupStructure[] = [];
    for (const [groupName, subMap] of groupsMap.entries()) {
      const subGroups: QuestionSubGroupStructure[] = [];
      let groupTotal = 0;
      let groupAnswered = 0;

      for (const [subName, qList] of subMap.entries()) {
        subGroups.push({
          subName,
          questions: qList,
        });
        groupTotal += qList.length;
        for (const q of qList) {
          if (formData.answers[q.id] !== undefined && formData.answers[q.id] !== null) {
            groupAnswered++;
          }
        }
      }

      result.push({
        groupName,
        subGroups,
        totalCount: groupTotal,
        answeredCount: groupAnswered,
      });
    }

    return result;
  }, [displayedQuestions, formData.answers]);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-5 sm:py-7 space-y-6">
      {/* Session Quick Status Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToAssistance}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition cursor-pointer"
            title="Kembali ke Halaman Pendampingan"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {formData.division}
              </span>
              <span className="text-xs font-semibold text-slate-700">
                {formData.unit} {formData.assistedUnit ? `(Didampingi: ${formData.assistedUnit})` : ''}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Petugas: <span className="font-medium text-slate-700">{formData.officer1}</span> &{' '}
              <span className="font-medium text-slate-700">{formData.officer2}</span>
            </p>
          </div>
        </div>

        {/* Progress Pill */}
        <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
          <div className="text-right">
            <div className="text-xs font-bold text-slate-900">
              {answeredCount} / {totalQuestions} Terjawab
            </div>
            <div className="w-28 bg-slate-200 h-2 rounded-full overflow-hidden mt-1">
              <div
                className={`h-full transition-all duration-300 ${
                  isAllAnswered ? 'bg-emerald-500' : 'bg-blue-600'
                }`}
                style={{ width: `${totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: PERTANYAAN CHECKLIST (HIRARKI: KELOMPOK -> SUB PERTANYAAN -> PERTANYAAN) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              <span>Daftar Pertanyaan {formData.division}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Struktur Hirarki: Kelompok &rsaquo; Sub-Pertanyaan &rsaquo; Pertanyaan
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({questions.length})
            </button>
            <button
              onClick={() => setFilterMode('unanswered')}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                filterMode === 'unanswered'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Belum ({questions.length - answeredCount})
            </button>
          </div>
        </div>

        {/* Grouped Questions List matching PLN Checklist Template */}
        {groupedStructure.length === 0 ? (
          <div className="p-8 text-center bg-white border-2 border-slate-900 rounded-2xl text-slate-500 text-sm">
            Tidak ada pertanyaan yang sesuai dengan filter.
          </div>
        ) : (
          groupedStructure.map((group, groupIdx) => {
            const isGroupComplete = group.answeredCount === group.totalCount && group.totalCount > 0;
            // Generate Letter A, B, C, D... or use existing ID if letter
            const groupLetter = String.fromCharCode(65 + (groupIdx % 26));

            return (
              <div
                key={group.groupName || groupIdx}
                className="bg-white border-2 border-slate-900 rounded-xl overflow-hidden shadow-sm space-y-0"
              >
                {/* LEVEL 1: KELOMPOK_PERTANYAAN HEADER (DEEP NAVY BLUE LIKE PLN TEMPLATE) */}
                <div className="grid grid-cols-[48px_1fr] sm:grid-cols-[56px_1fr] bg-[#001080] text-white border-b-2 border-slate-900">
                  <div className="border-r-2 border-slate-900 flex items-center justify-center font-black text-xl sm:text-2xl py-3.5 px-2 bg-[#00085a] select-none">
                    {groupLetter}
                  </div>
                  <div className="flex items-center justify-between p-3 sm:p-4 gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-blue-200 block uppercase">
                        KELOMPOK PERTANYAAN {groupLetter}
                      </span>
                      <h4 className="text-sm sm:text-base md:text-lg font-black tracking-wide leading-snug break-words">
                        {group.groupName}
                      </h4>
                    </div>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-md shrink-0 border ${
                        isGroupComplete
                          ? 'bg-emerald-500/90 text-white border-emerald-400'
                          : 'bg-white/20 text-white border-white/30'
                      }`}
                    >
                      {group.answeredCount}/{group.totalCount} Selesai
                    </span>
                  </div>
                </div>

                {/* Sub-Groups inside Kelompok */}
                {(() => {
                  let namedSubCounter = 0;
                  return group.subGroups.map((subGroup, subIdx) => {
                    const hasSubGroup = Boolean(
                      subGroup.subName &&
                      subGroup.subName.trim() &&
                      subGroup.subName.trim() !== '-' &&
                      subGroup.subName.trim().toLowerCase() !== 'null' &&
                      subGroup.subName.trim().toLowerCase() !== 'undefined'
                    );

                    let displaySubTitle = '';
                    if (hasSubGroup) {
                      namedSubCounter++;
                      const subCode = `${groupLetter}${namedSubCounter}`;
                      const cleanSubName = subGroup.subName.trim();
                      displaySubTitle = cleanSubName.toUpperCase().startsWith(subCode)
                        ? cleanSubName
                        : `${subCode}. ${cleanSubName}`;
                    }

                    return (
                      <div key={subGroup.subName || subIdx} className="border-b-2 last:border-b-0 border-slate-900">
                        {/* LEVEL 2: SUB_PERTANYAAN_YANTEK (ONLY RENDER IF SUB-PERTANYAAN EXISTS) */}
                        {hasSubGroup && (
                          <div className="bg-[#FFB800] text-slate-950 font-black text-center py-2.5 px-4 text-xs sm:text-sm tracking-wider uppercase border-b-2 border-slate-900 shadow-inner select-none">
                            <div className="flex items-center justify-center gap-2">
                              <FolderTree className="w-4 h-4 text-slate-900 shrink-0" />
                              <span className="font-extrabold tracking-wide">
                                {displaySubTitle}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* LEVEL 3: PERTANYAAN_YANTEK (NUMBERED ROWS LIKE SPREADSHEET WITH YA/TIDAK INTERACTION) */}
                        <div className="divide-y-2 divide-slate-900">
                        {subGroup.questions.map((q, qIndex) => {
                          const rawVal = formData.answers[q.id];
                          const { answer: selectedAns, rank: selectedRank } = parseAnswerAndRank(rawVal);
                          const isAnswered = selectedAns !== null;

                          return (
                            <motion.div
                              key={q.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.15 }}
                              className={`grid grid-cols-[48px_1fr] sm:grid-cols-[56px_1fr] transition-colors ${
                                isAnswered
                                  ? selectedAns === 'YA'
                                    ? 'bg-emerald-50/70'
                                    : 'bg-rose-50/70'
                                  : 'bg-white hover:bg-slate-50/80'
                              }`}
                            >
                              {/* Question Number Column */}
                              <div className="border-r-2 border-slate-900 flex items-center justify-center font-black text-base sm:text-lg text-slate-950 p-2 select-none bg-slate-100/70">
                                {q.id}
                              </div>

                              {/* Question Text & YA / TIDAK Action Controls */}
                              <div className="p-3.5 sm:p-4 space-y-3">
                                <p className="text-sm sm:text-base font-bold text-slate-950 leading-relaxed">
                                  {q.text}
                                </p>

                                {/* Interactive YA / TIDAK Buttons & Status */}
                                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                                  <div className="grid grid-cols-2 gap-2.5 w-full sm:w-72">
                                    <button
                                      type="button"
                                      onClick={() => handleSelectAnswer(q.id, 'YA')}
                                      className={`min-h-[42px] flex items-center justify-center gap-2 rounded-lg text-xs sm:text-sm font-black border-2 transition-all active:scale-95 cursor-pointer ${
                                        selectedAns === 'YA'
                                          ? 'bg-emerald-600 border-emerald-700 text-white shadow-sm ring-2 ring-emerald-500/30'
                                          : 'bg-white border-slate-300 text-slate-700 hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-800'
                                      }`}
                                    >
                                      <Check className={`w-4 h-4 ${selectedAns === 'YA' ? 'stroke-[3]' : ''}`} />
                                      <span>YA</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleSelectAnswer(q.id, 'TIDAK')}
                                      className={`min-h-[42px] flex items-center justify-center gap-2 rounded-lg text-xs sm:text-sm font-black border-2 transition-all active:scale-95 cursor-pointer ${
                                        selectedAns === 'TIDAK'
                                          ? 'bg-rose-600 border-rose-700 text-white shadow-sm ring-2 ring-rose-500/30'
                                          : 'bg-white border-slate-300 text-slate-700 hover:bg-rose-50 hover:border-rose-500 hover:text-rose-800'
                                      }`}
                                    >
                                      <XCircle className={`w-4 h-4 ${selectedAns === 'TIDAK' ? 'stroke-[2.5]' : ''}`} />
                                      <span>TIDAK</span>
                                    </button>
                                  </div>

                                  {isAnswered && (
                                    <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 ml-auto bg-white px-2.5 py-1 rounded-lg border border-slate-300 shadow-2xs">
                                      <span>Jawaban:</span>
                                      <span
                                        className={`px-2 py-0.5 rounded font-black text-white ${
                                          selectedAns === 'YA'
                                            ? 'bg-emerald-600'
                                            : 'bg-rose-600'
                                        }`}
                                      >
                                        {selectedAns} - {selectedRank}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Nilai Rank 1 s/d 10 Selector */}
                                <div className="bg-slate-100/90 border border-slate-300/80 rounded-xl p-2.5 space-y-1.5 shadow-xs mt-2">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                      <span>Nilai Rank (1 s/d 10):</span>
                                    </span>
                                    {isAnswered && (
                                      <span className="text-[11px] font-black text-blue-900 bg-blue-100 border border-blue-300/60 px-2 py-0.5 rounded-full">
                                        Selected: {selectedAns} - {selectedRank}
                                      </span>
                                    )}
                                  </div>

                                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-1 sm:gap-1.5">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((r) => {
                                      const isSelectedRank = isAnswered && selectedRank === r;
                                      return (
                                        <button
                                          key={r}
                                          type="button"
                                          onClick={() => handleSelectRank(q.id, r)}
                                          className={`py-1.5 rounded-lg text-xs sm:text-sm font-black border transition-all cursor-pointer ${
                                            isSelectedRank
                                              ? 'bg-blue-600 border-blue-700 text-white shadow-md ring-2 ring-blue-500/40 scale-105 z-10'
                                              : 'bg-white border-slate-300 text-slate-800 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 active:scale-95'
                                          }`}
                                        >
                                          {r}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          );
        })
        )}
      </div>

      {/* SECTION 2: FOTO EVIDEN (DENGAN WATERMARK OTOMATIS) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-600" />
              <span>Foto Eviden Lapangan</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Otomatis dibubuhi watermark resmi & diunggah ke Google Drive folder EVIDEN
            </p>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            hasPhotos ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
          }`}>
            {formData.evidenPhotos.length} Foto
          </span>
        </div>

        {/* Hidden File Inputs */}
        <input
          type="file"
          ref={cameraInputRef}
          accept="image/*"
          capture="environment"
          onChange={(e) => {
            if (e.target.files?.[0]) handlePhotoCapture(e.target.files[0]);
          }}
          className="hidden"
        />
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={(e) => {
            if (e.target.files?.[0]) handlePhotoCapture(e.target.files[0]);
          }}
          className="hidden"
        />

        {/* Camera Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={isCapturing}
            className="min-h-[48px] flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 active:scale-[0.99] text-white text-sm font-bold rounded-xl py-3 px-4 shadow-md shadow-blue-600/25 transition cursor-pointer disabled:opacity-50"
          >
            {isCapturing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Camera className="w-5 h-5" />
            )}
            <span>Ambil Kamera (Watermark)</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isCapturing}
            className="min-h-[48px] flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 active:scale-[0.99] text-slate-700 text-sm font-bold rounded-xl py-3 px-4 border border-slate-200 transition cursor-pointer disabled:opacity-50"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Pilih dari Galeri</span>
          </button>
        </div>

        {/* Capturing / Watermarking Loader */}
        {isCapturing && (
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-center animate-pulse">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-blue-900">{submitProgress || 'Memproses watermark foto...'}</p>
          </div>
        )}

        {/* Photos Grid Preview */}
        {formData.evidenPhotos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            {formData.evidenPhotos.map((photo, idx) => (
              <div
                key={photo.id}
                className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 aspect-video shadow-sm"
              >
                <img
                  src={photo.dataUrl}
                  alt={`Eviden ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                {/* Overlay actions */}
                <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewPhoto(photo.dataUrl)}
                    className="p-2 rounded-lg bg-white/90 text-slate-900 hover:bg-white transition active:scale-95"
                    title="Lihat Foto Watermark"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="p-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition active:scale-95"
                    title="Hapus Foto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute bottom-1 left-1 bg-slate-900/80 backdrop-blur-xs text-[10px] text-white px-1.5 py-0.5 rounded font-mono">
                  Eviden #{idx + 1}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state photo reminder */}
        {formData.evidenPhotos.length === 0 && !isCapturing && (
          <div className="p-6 rounded-xl border-2 border-dashed border-slate-200 text-center text-slate-400">
            <Camera className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-semibold text-slate-600">Belum ada foto eviden</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Ambil minimal 1 foto kegiatan pendampingan menggunakan tombol kamera di atas.
            </p>
          </div>
        )}
      </div>

      {/* SECTION 3: SUBMIT BUTTON & SUMMARY */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-3">
          <div className="text-slate-400">
            Target Spreadsheet:
          </div>
          <div className="font-mono font-semibold text-emerald-400">
            Sheet LAPORAN_{formData.division}
          </div>
        </div>

        {/* Validation Checklist */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className={`flex items-center gap-1.5 ${isAllAnswered ? 'text-emerald-400' : 'text-amber-400'}`}>
            {isAllAnswered ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
            <span>Pertanyaan ({answeredCount}/{totalQuestions})</span>
          </div>
          <div className={`flex items-center gap-1.5 ${hasPhotos ? 'text-emerald-400' : 'text-amber-400'}`}>
            {hasPhotos ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
            <span>Foto Eviden ({formData.evidenPhotos.length})</span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className="w-full min-h-[52px] flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-[0.99] text-white text-base font-extrabold rounded-xl py-3.5 px-6 shadow-lg shadow-emerald-500/25 transition disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Menyimpan Laporan...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>KIRIM LAPORAN PENDAMPINGAN</span>
            </>
          )}
        </button>

        {isSubmitting && submitProgress && (
          <p className="text-xs text-center text-cyan-300 font-medium animate-pulse">
            {submitProgress}
          </p>
        )}
      </div>

      {/* FULL PHOTO PREVIEW MODAL */}
      <AnimatePresence>
        {previewPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm p-4 flex items-center justify-center"
            onClick={() => setPreviewPhoto(null)}
          >
            <div className="relative max-w-3xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
              <img
                src={previewPhoto}
                alt="Watermark Preview"
                className="w-full max-h-[80vh] object-contain"
              />
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/70 text-white hover:bg-black transition"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

