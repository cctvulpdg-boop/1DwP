import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  LogOut, 
  Users, 
  Building2, 
  Layers, 
  FileSpreadsheet, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  X, 
  Save, 
  Image as ImageIcon,
  Check,
  HelpCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { OfficerItem, QuestionItem, InspectionFormData, DivisionType } from '../types';
import { getLaporanYantekFromSpreadsheet } from '../services/googleSheets';
import { parseGoogleDrivePhoto } from '../utils/photoUtils';

interface AdminDashboardProps {
  onLogout: () => void;
  units: string[];
  divisions: string[];
  companions: any[];
  officers: OfficerItem[];
  onUpdateOfficers: (newOfficers: OfficerItem[]) => void;
  questions: QuestionItem[];
  onUpdateQuestions: (newQuestions: QuestionItem[]) => void;
  reports: InspectionFormData[];
  onUpdateReports: (newReports: InspectionFormData[]) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onLogout,
  units,
  divisions,
  companions,
  officers,
  onUpdateOfficers,
  questions,
  onUpdateQuestions,
  reports,
  onUpdateReports,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'master' | 'reports'>('overview');

  // Master Data Sub-tabs: 'officers' | 'questions'
  const [masterSubTab, setMasterSubTab] = useState<'officers' | 'questions'>('officers');

  // Officer Form State
  const [showOfficerModal, setShowOfficerModal] = useState(false);
  const [editingOfficerIndex, setEditingOfficerIndex] = useState<number | null>(null);
  const [officerName, setOfficerName] = useState('');
  const [officerUnit, setOfficerUnit] = useState(units[0] || 'ULP PADANG KOTA');

  // Question Form State
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [questionCategory, setQuestionCategory] = useState('KELOMPOK UMUM');
  const [questionDivision, setQuestionDivision] = useState<DivisionType>('YANTEK');

  // Report Edit Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [editingReportIndex, setEditingReportIndex] = useState<number | null>(null);
  const [reportCompanion, setReportCompanion] = useState('');
  const [reportUnit, setReportUnit] = useState('');
  const [reportDivision, setReportDivision] = useState('');
  const [reportAssistedUnit, setReportAssistedUnit] = useState('');

  // Spreadsheet Fetch State for LAPORAN_YANTEK
  const [isLoadingReports, setIsLoadingReports] = useState(false);

  const handleFetchSpreadsheetReports = async () => {
    setIsLoadingReports(true);
    try {
      const fetchedReports = await getLaporanYantekFromSpreadsheet();
      if (fetchedReports) {
        onUpdateReports(fetchedReports);
      }
    } catch (err) {
      console.warn('Error fetching LAPORAN_YANTEK from spreadsheet:', err);
    } finally {
      setIsLoadingReports(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'reports') {
      handleFetchSpreadsheetReports();
    }
  }, [activeTab]);

  // --- OFFICER HANDLERS ---
  const handleOpenAddOfficer = () => {
    setEditingOfficerIndex(null);
    setOfficerName('');
    setOfficerUnit(units[0] || 'ULP PADANG KOTA');
    setShowOfficerModal(true);
  };

  const handleOpenEditOfficer = (index: number) => {
    const off = officers[index];
    setEditingOfficerIndex(index);
    setOfficerName(off.name);
    setOfficerUnit(off.unit || units[0] || '');
    setShowOfficerModal(true);
  };

  const handleSaveOfficer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!officerName.trim()) return;

    if (editingOfficerIndex !== null) {
      const updated = [...officers];
      updated[editingOfficerIndex] = { ...updated[editingOfficerIndex], name: officerName.trim(), unit: officerUnit };
      onUpdateOfficers(updated);
    } else {
      const newOff: OfficerItem = {
        id: `off-${Date.now()}`,
        name: officerName.trim(),
        unit: officerUnit,
      };
      onUpdateOfficers([...officers, newOff]);
    }
    setShowOfficerModal(false);
  };

  const handleDeleteOfficer = (index: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus petugas ini?')) {
      const updated = officers.filter((_, i) => i !== index);
      onUpdateOfficers(updated);
    }
  };

  // --- QUESTION HANDLERS ---
  const handleOpenAddQuestion = () => {
    setEditingQuestionIndex(null);
    setQuestionText('');
    setQuestionCategory('KELOMPOK UMUM');
    setQuestionDivision('YANTEK');
    setShowQuestionModal(true);
  };

  const handleOpenEditQuestion = (index: number) => {
    const q = questions[index];
    setEditingQuestionIndex(index);
    setQuestionText(q.text);
    setQuestionCategory(q.kelompokName || q.category || 'KELOMPOK UMUM');
    setQuestionDivision(q.divisiId || 'YANTEK');
    setShowQuestionModal(true);
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    if (editingQuestionIndex !== null) {
      const updated = [...questions];
      updated[editingQuestionIndex] = {
        ...updated[editingQuestionIndex],
        text: questionText.trim(),
        kelompokName: questionCategory,
        category: questionCategory,
        divisiId: questionDivision,
      };
      onUpdateQuestions(updated);
    } else {
      const newQ: QuestionItem = {
        id: questions.length > 0 ? Math.max(...questions.map((q) => q.id)) + 1 : 1,
        text: questionText.trim(),
        kelompokName: questionCategory,
        category: questionCategory,
        divisiId: questionDivision,
      };
      onUpdateQuestions([...questions, newQ]);
    }
    setShowQuestionModal(false);
  };

  const handleDeleteQuestion = (index: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus pertanyaan ini?')) {
      const updated = questions.filter((_, i) => i !== index);
      onUpdateQuestions(updated);
    }
  };

  // --- REPORT HANDLERS ---
  const handleOpenEditReport = (index: number) => {
    const rep = reports[index];
    setEditingReportIndex(index);
    setReportCompanion(rep.companion || '');
    setReportUnit(rep.unit || '');
    setReportDivision(rep.division || 'YANTEK');
    setReportAssistedUnit(rep.assistedUnit || '');
    setShowReportModal(true);
  };

  const handleSaveReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingReportIndex !== null) {
      const updated = [...reports];
      updated[editingReportIndex] = {
        ...updated[editingReportIndex],
        companion: reportCompanion,
        unit: reportUnit,
        division: reportDivision,
        assistedUnit: reportAssistedUnit,
      };
      onUpdateReports(updated);
    }
    setShowReportModal(false);
  };

  const handleDeleteReport = (index: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus laporan pendampingan ini?')) {
      const updated = reports.filter((_, i) => i !== index);
      onUpdateReports(updated);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-12">
      {/* Admin Top Navbar */}
      <header className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 border-b border-blue-800/60 text-white shadow-xl sticky top-0 z-30 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 shrink-0">
            <img
              src="https://lh3.googleusercontent.com/d/1HGB_XQgMAG99kFWvUFNptJv6F319KX6_"
              alt="1DwP Logo"
              className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-md"
            />
            <div>
              <div 
                className="text-xs sm:text-sm md:text-base font-black tracking-wider text-yellow-300 uppercase leading-tight"
                style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.9), 0 0 12px rgba(253, 224, 71, 0.5)' }}
              >
                ADMINISTRATION DASHBOARD
              </div>
              <div 
                className="text-[11px] sm:text-xs font-bold tracking-wide text-yellow-200 uppercase leading-tight mt-0.5"
                style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.9)' }}
              >
                1DwP - PLN UP4 SUMATERA BARAT (UNIT LAYANAN PADANG)
              </div>
            </div>
          </div>
          
          <button
            onClick={onLogout}
            className="flex items-center gap-2 bg-rose-600/90 hover:bg-rose-700 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-rose-600/20 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Admin</span>
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 mt-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-slate-300 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Ringkasan Master Data</span>
          </button>
          
          <button
            onClick={() => setActiveTab('master')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'master'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Master Data (Petugas & Pertanyaan)</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'reports'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Laporan Pendampingan ({reports.length})</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Total Unit (ULP)</p>
                  <p className="text-2xl font-black text-slate-800">{units.length}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Total Petugas</p>
                  <p className="text-2xl font-black text-slate-800">{officers.length}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Total Pertanyaan</p>
                  <p className="text-2xl font-black text-slate-800">{questions.length}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Total Laporan</p>
                  <p className="text-2xl font-black text-slate-800">{reports.length}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <span>Daftar Unit Layanan (ULP)</span>
                </h3>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {units.map((unit, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm font-semibold">
                      <span>{unit}</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg">Aktif</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-600" />
                  <span>Daftar Divisi / Bidang</span>
                </h3>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {divisions.map((div, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm font-semibold">
                      <span>{div}</span>
                      <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-lg">Aktif</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MASTER DATA (PETUGAS & PERTANYAAN) */}
        {activeTab === 'master' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            {/* Sub-navigation */}
            <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
              <button
                onClick={() => setMasterSubTab('officers')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition cursor-pointer ${
                  masterSubTab === 'officers'
                    ? 'bg-slate-900 text-white shadow'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Manajemen Petugas ({officers.length})
              </button>
              <button
                onClick={() => setMasterSubTab('questions')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition cursor-pointer ${
                  masterSubTab === 'questions'
                    ? 'bg-slate-900 text-white shadow'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Manajemen Pertanyaan ({questions.length})
              </button>
            </div>

            {/* OFFICERS SUB-TAB */}
            {masterSubTab === 'officers' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-800">Daftar Petugas Pendampingan</h3>
                  <button
                    onClick={handleOpenAddOfficer}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Petugas</span>
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 uppercase text-xs font-bold tracking-wider">
                        <th className="p-3.5">No</th>
                        <th className="p-3.5">Nama Petugas</th>
                        <th className="p-3.5">Unit / ULP</th>
                        <th className="p-3.5 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {officers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-8 text-slate-400 font-medium">
                            Belum ada data petugas.
                          </td>
                        </tr>
                      ) : (
                        officers.map((off, idx) => (
                          <tr key={off.id || idx} className="hover:bg-slate-50 transition">
                            <td className="p-3.5 text-slate-500 font-semibold">{idx + 1}</td>
                            <td className="p-3.5 font-bold text-slate-900">{off.name}</td>
                            <td className="p-3.5 text-slate-600 font-medium">{off.unit}</td>
                            <td className="p-3.5 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleOpenEditOfficer(idx)}
                                  className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition"
                                  title="Edit Petugas"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteOfficer(idx)}
                                  className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition"
                                  title="Hapus Petugas"
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
            )}

            {/* QUESTIONS SUB-TAB */}
            {masterSubTab === 'questions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-800">Daftar Pertanyaan Kuesioner</h3>
                  <button
                    onClick={handleOpenAddQuestion}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Pertanyaan</span>
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 uppercase text-xs font-bold tracking-wider">
                        <th className="p-3.5">ID / No</th>
                        <th className="p-3.5">Teks Pertanyaan</th>
                        <th className="p-3.5">Kelompok</th>
                        <th className="p-3.5">Divisi</th>
                        <th className="p-3.5 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {questions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-slate-400 font-medium">
                            Belum ada data pertanyaan.
                          </td>
                        </tr>
                      ) : (
                        questions.map((q, idx) => (
                          <tr key={q.id || idx} className="hover:bg-slate-50 transition">
                            <td className="p-3.5 text-slate-500 font-semibold">#{q.id}</td>
                            <td className="p-3.5 font-bold text-slate-900 max-w-md">{q.text}</td>
                            <td className="p-3.5 text-slate-600 text-xs font-semibold">
                              <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md">
                                {q.kelompokName || q.category || 'UMUM'}
                              </span>
                            </td>
                            <td className="p-3.5 text-slate-600 text-xs font-bold">
                              <span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-md uppercase">
                                {q.divisiId || 'YANTEK'}
                              </span>
                            </td>
                            <td className="p-3.5 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleOpenEditQuestion(idx)}
                                  className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition"
                                  title="Edit Pertanyaan"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteQuestion(idx)}
                                  className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition"
                                  title="Hapus Pertanyaan"
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
            )}
          </div>
        )}

        {/* TAB 3: LAPORAN PENDAMPINGAN */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-800">Laporan Pendampingan Petugas</h3>
                <p className="text-xs text-slate-500">Membaca dan menampilkan data dari isi Spreadsheet "LAPORAN_YANTEK".</p>
              </div>
              <button
                onClick={handleFetchSpreadsheetReports}
                disabled={isLoadingReports}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition disabled:opacity-50 cursor-pointer self-start sm:self-auto"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingReports ? 'animate-spin' : ''}`} />
                <span>{isLoadingReports ? 'Membaca LAPORAN_YANTEK...' : 'Sinkronkan LAPORAN_YANTEK'}</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 uppercase font-bold tracking-wider">
                    <th className="p-3">TANGGAL</th>
                    <th className="p-3">PENDAMPING</th>
                    <th className="p-3">UNIT</th>
                    <th className="p-3">DIVISI</th>
                    <th className="p-3">UNIT YANG DIDAMPINGI</th>
                    <th className="p-3 text-center">JML YA</th>
                    <th className="p-3 text-center">JML TIDAK</th>
                    <th className="p-3">FOTO EVIDEN</th>
                    <th className="p-3 text-center">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {reports.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-slate-400 font-medium">
                        Belum ada laporan pendampingan yang tersimpan.
                      </td>
                    </tr>
                  ) : (
                    reports.map((rep, idx) => {
                      let countYa = 0;
                      let countTidak = 0;

                      const isYaVal = (v: any): boolean => {
                        if (v === undefined || v === null) return false;
                        const s = String(v).trim().toUpperCase();
                        if (!s) return false;
                        return (
                          s === 'YA' ||
                          s === 'Y' ||
                          s === 'ADA' ||
                          s === 'SESUAI' ||
                          s === 'LENGKAP' ||
                          s === 'BAIK' ||
                          s === '1' ||
                          s === 'TRUE' ||
                          s === 'OK' ||
                          s === 'YES' ||
                          s === 'S' ||
                          s.startsWith('YA') ||
                          s.startsWith('SESUAI') ||
                          s.startsWith('ADA') ||
                          s.startsWith('LENGKAP')
                        );
                      };

                      const isTidakVal = (v: any): boolean => {
                        if (v === undefined || v === null) return false;
                        const s = String(v).trim().toUpperCase();
                        if (!s) return false;
                        return (
                          s === 'TIDAK' ||
                          s === 'T' ||
                          s === 'N' ||
                          s === 'NO' ||
                          s === 'TS' ||
                          s === '0' ||
                          s === 'FALSE' ||
                          s === 'RUSAK' ||
                          s === 'TDK' ||
                          s === 'TDAK' ||
                          s.startsWith('TIDAK') ||
                          s.startsWith('TDK') ||
                          s.startsWith('TDAK') ||
                          s.startsWith('TS')
                        );
                      };

                      // 1. Check rep.answers dictionary
                      const answersObj = rep.answers || {};
                      if (typeof answersObj === 'object' && answersObj !== null) {
                        Object.values(answersObj).forEach((ans) => {
                          if (isTidakVal(ans)) countTidak++;
                          else if (isYaVal(ans)) countYa++;
                        });
                      }

                      // 2. Fallback: If answers dictionary was empty or missed answers, check rep object properties
                      if (countYa === 0 && countTidak === 0 && rep) {
                        Object.entries(rep).forEach(([k, v]) => {
                          const lk = k.toLowerCase();
                          const isMeta =
                            lk.includes('id') ||
                            lk.includes('time') ||
                            lk.includes('date') ||
                            lk.includes('waktu') ||
                            lk.includes('tanggal') ||
                            lk.includes('unit') ||
                            lk.includes('divis') ||
                            lk.includes('companion') ||
                            lk.includes('pendamping') ||
                            lk.includes('officer') ||
                            lk.includes('petugas') ||
                            lk.includes('note') ||
                            lk.includes('catatan') ||
                            lk.includes('photo') ||
                            lk.includes('foto') ||
                            lk.includes('eviden') ||
                            lk.includes('answers') ||
                            lk.includes('startedat') ||
                            lk.includes('submittedat');

                          if (!isMeta) {
                            if (isTidakVal(v)) countTidak++;
                            else if (isYaVal(v)) countYa++;
                          }
                        });
                      }

                      // Rule: Kolom UNIT YANG DIDAMPINGI sama dengan UNIT kecuali kalau UNIT adalah UL PADANG maka UNIT YANG DIDAMPINGI sesuai dengan yang di Inputkan.
                      const unitVal = (rep.unit || '').trim();
                      const isUlPadang = unitVal.toUpperCase() === 'UL PADANG' || unitVal.toUpperCase().includes('PADANG');
                      const displayAssistedUnit = isUlPadang ? (rep.assistedUnit || unitVal || '-') : (unitVal || '-');

                      const fotos = rep.evidenPhotos || [];

                      return (
                        <tr key={rep.reportId || idx} className="hover:bg-slate-50 transition">
                          <td className="p-3 text-slate-600 whitespace-nowrap font-medium">
                            {rep.submittedAt || new Date().toLocaleDateString('id-ID')}
                          </td>
                          <td className="p-3 font-bold text-slate-900">{rep.companion}</td>
                          <td className="p-3 text-slate-700 font-semibold">{unitVal || '-'}</td>
                          <td className="p-3">
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">
                              {rep.division || 'YANTEK'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-700 font-semibold">{displayAssistedUnit}</td>
                          <td className="p-3 text-center font-bold text-emerald-600">{countYa}</td>
                          <td className="p-3 text-center font-bold text-rose-600">{countTidak}</td>
                          <td className="p-3">
                            {fotos.length > 0 ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {fotos.map((f, fIdx) => {
                                  const rawUrl = f.driveViewLink || f.dataUrl || '';
                                  const parsedPhoto = parseGoogleDrivePhoto(rawUrl);
                                  return (
                                    <a
                                      key={fIdx}
                                      href={parsedPhoto.linkUrl || '#'}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="group relative block w-10 h-10 rounded-lg overflow-hidden border border-slate-300 shadow-sm hover:scale-105 transition bg-slate-100"
                                      title="Buka Foto Eviden"
                                    >
                                      <img
                                        src={parsedPhoto.displayUrl}
                                        alt={`Eviden ${fIdx + 1}`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          const img = e.currentTarget;
                                          if (parsedPhoto.fileId && !img.dataset.failed) {
                                            img.dataset.failed = 'true';
                                            img.src = `https://drive.google.com/thumbnail?id=${parsedPhoto.fileId}&sz=w300`;
                                          }
                                        }}
                                      />
                                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                        <ExternalLink className="w-3.5 h-3.5" />
                                      </div>
                                    </a>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-xs">Tanpa Foto</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleOpenEditReport(idx)}
                                className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition cursor-pointer"
                                title="Edit Laporan"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteReport(idx)}
                                className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition cursor-pointer"
                                title="Hapus Laporan"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* OFFICER MODAL (ADD / EDIT) */}
      {showOfficerModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setShowOfficerModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-4">
              {editingOfficerIndex !== null ? 'Edit Petugas' : 'Tambah Petugas Baru'}
            </h3>

            <form onSubmit={handleSaveOfficer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Nama Petugas
                </label>
                <input
                  type="text"
                  required
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  placeholder="Masukkan nama lengkap petugas..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold focus:bg-white focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Unit / ULP
                </label>
                <select
                  value={officerUnit}
                  onChange={(e) => setOfficerUnit(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold focus:bg-white focus:border-blue-600 outline-none"
                >
                  {units.map((u, i) => (
                    <option key={i} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowOfficerModal(false)}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-bold py-3 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUESTION MODAL (ADD / EDIT) */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setShowQuestionModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-4">
              {editingQuestionIndex !== null ? 'Edit Pertanyaan' : 'Tambah Pertanyaan Baru'}
            </h3>

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Teks Pertanyaan
                </label>
                <textarea
                  required
                  rows={3}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Masukkan kalimat pertanyaan..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold focus:bg-white focus:border-blue-600 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Kelompok / Kategori
                  </label>
                  <input
                    type="text"
                    required
                    value={questionCategory}
                    onChange={(e) => setQuestionCategory(e.target.value)}
                    placeholder="Contoh: KELOMPOK I"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold focus:bg-white focus:border-blue-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Divisi
                  </label>
                  <select
                    value={questionDivision}
                    onChange={(e) => setQuestionDivision(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold focus:bg-white focus:border-blue-600 outline-none uppercase"
                  >
                    {divisions.map((d, i) => (
                      <option key={i} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowQuestionModal(false)}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-bold py-3 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPORT EDIT MODAL */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setShowReportModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-4">Edit Laporan Pendampingan</h3>

            <form onSubmit={handleSaveReport} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Nama Pendamping
                </label>
                <input
                  type="text"
                  required
                  value={reportCompanion}
                  onChange={(e) => setReportCompanion(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold focus:bg-white focus:border-blue-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Unit Asal
                  </label>
                  <input
                    type="text"
                    required
                    value={reportUnit}
                    onChange={(e) => setReportUnit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold focus:bg-white focus:border-blue-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Divisi
                  </label>
                  <input
                    type="text"
                    required
                    value={reportDivision}
                    onChange={(e) => setReportDivision(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold focus:bg-white focus:border-blue-600 outline-none uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Unit Yang Didampingi
                </label>
                <input
                  type="text"
                  value={reportAssistedUnit}
                  onChange={(e) => setReportAssistedUnit(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold focus:bg-white focus:border-blue-600 outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-bold py-3 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
