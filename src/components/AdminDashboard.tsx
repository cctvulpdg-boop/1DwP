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
  ExternalLink,
  Trophy,
  Award,
  Star,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ShieldAlert,
  Filter,
  Search,
  Sparkles,
  Medal
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
  const [activeTab, setActiveTab] = useState<'overview' | 'top-performers' | 'bottom-performers' | 'master' | 'reports'>('overview');
  const [selectedUlpFilter, setSelectedUlpFilter] = useState<string>('SEMUA');
  const [searchOfficerQuery, setSearchOfficerQuery] = useState<string>('');

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
    if (activeTab === 'reports' || activeTab === 'top-performers' || activeTab === 'bottom-performers') {
      handleFetchSpreadsheetReports();
    }
  }, [activeTab]);

  // List of available unique ULPs for filtering
  const availableUlps = React.useMemo(() => {
    const ulpSet = new Set<string>();
    units.forEach((u) => u && ulpSet.add(u.trim()));
    officers.forEach((o) => o.unit && ulpSet.add(o.unit.trim()));
    reports.forEach((r) => {
      if (r.unit) ulpSet.add(r.unit.trim());
      if (r.assistedUnit) ulpSet.add(r.assistedUnit.trim());
    });
    return Array.from(ulpSet).filter(Boolean).sort();
  }, [units, officers, reports]);

  // Helper function to extract numeric rank from answer value
  const getRankFromAnswer = (val: any): number | null => {
    if (val === undefined || val === null) return null;
    const str = String(val).trim();
    if (!str) return null;

    const rankMatch = str.match(/-\s*(\d+)/);
    if (rankMatch) {
      const r = parseInt(rankMatch[1], 10);
      if (!isNaN(r) && r >= 1 && r <= 10) return r;
    }

    const num = parseInt(str, 10);
    if (!isNaN(num) && num >= 1 && num <= 10 && String(num) === str) {
      return num;
    }

    const upper = str.toUpperCase();
    if (upper.startsWith('YA') || upper === '1' || upper === 'TRUE' || upper === 'ADA' || upper === 'SESUAI' || upper === 'LENGKAP') {
      return 5;
    }
    if (upper.startsWith('TIDAK') || upper.startsWith('TDK') || upper === '0' || upper === 'FALSE') {
      return 1;
    }

    return null;
  };

  interface OfficerPerformance {
    id: string;
    name: string;
    unit: string;
    totalReports: number;
    totalRankPoints: number;
    totalRankedQuestions: number;
    avgRank: number;
    totalYa: number;
    totalTidak: number;
  }

  const officerPerformanceData = React.useMemo(() => {
    const statsMap = new Map<string, OfficerPerformance>();

    // 1. Register master officers first
    officers.forEach((off) => {
      const nameKey = off.name.trim().toLowerCase();
      if (!nameKey) return;
      statsMap.set(nameKey, {
        id: off.id || nameKey,
        name: off.name.trim(),
        unit: off.unit || 'ULP PADANG KOTA',
        totalReports: 0,
        totalRankPoints: 0,
        totalRankedQuestions: 0,
        avgRank: 0,
        totalYa: 0,
        totalTidak: 0,
      });
    });

    // 2. Accumulate performance scores from all submitted reports
    reports.forEach((rep) => {
      const repUnit = rep.assistedUnit || rep.unit || '';
      const reportOfficers = [rep.officer1, rep.officer2].filter((n) => n && n.trim() !== '');

      let reportRankPoints = 0;
      let reportRankedQuestions = 0;
      let reportYa = 0;
      let reportTidak = 0;

      const answersObj = rep.answers || {};
      Object.values(answersObj).forEach((ansVal) => {
        const rank = getRankFromAnswer(ansVal);
        if (rank !== null) {
          reportRankPoints += rank;
          reportRankedQuestions += 1;
        }
        const str = String(ansVal).toUpperCase().trim();
        if (str.startsWith('YA') || str === '1' || str === 'TRUE' || str === 'ADA' || str === 'SESUAI') {
          reportYa += 1;
        } else if (str.startsWith('TIDAK') || str.startsWith('TDK') || str === '0' || str === 'FALSE') {
          reportTidak += 1;
        }
      });

      // Fallback check report properties if answers dictionary was empty
      if (reportRankedQuestions === 0 && rep) {
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
            lk.includes('workorder') ||
            lk.includes('work order') ||
            lk.includes('wo') ||
            lk.includes('note') ||
            lk.includes('catatan') ||
            lk.includes('photo') ||
            lk.includes('foto') ||
            lk.includes('eviden') ||
            lk.includes('answers') ||
            lk.includes('startedat') ||
            lk.includes('submittedat');

          if (!isMeta) {
            const rank = getRankFromAnswer(v);
            if (rank !== null) {
              reportRankPoints += rank;
              reportRankedQuestions += 1;
            }
          }
        });
      }

      reportOfficers.forEach((officerName) => {
        const cleanName = officerName.trim();
        const nameKey = cleanName.toLowerCase();

        let stat = statsMap.get(nameKey);
        if (!stat) {
          stat = {
            id: `off-rep-${nameKey}`,
            name: cleanName,
            unit: repUnit || 'ULP PADANG KOTA',
            totalReports: 0,
            totalRankPoints: 0,
            totalRankedQuestions: 0,
            avgRank: 0,
            totalYa: 0,
            totalTidak: 0,
          };
          statsMap.set(nameKey, stat);
        } else if (repUnit && (!stat.unit || stat.unit === 'ULP PADANG KOTA')) {
          stat.unit = repUnit;
        }

        stat.totalReports += 1;
        stat.totalRankPoints += reportRankPoints;
        stat.totalRankedQuestions += reportRankedQuestions;
        stat.totalYa += reportYa;
        stat.totalTidak += reportTidak;
      });
    });

    const resultList: OfficerPerformance[] = [];
    statsMap.forEach((stat) => {
      const avg = stat.totalRankedQuestions > 0 ? stat.totalRankPoints / stat.totalRankedQuestions : 0;
      resultList.push({
        ...stat,
        avgRank: Number(avg.toFixed(2)),
      });
    });

    return resultList;
  }, [officers, reports]);

  const filteredOfficerPerformance = React.useMemo(() => {
    return officerPerformanceData
      .filter((off) => {
        const matchUlp =
          selectedUlpFilter === 'SEMUA' ||
          off.unit.toUpperCase().includes(selectedUlpFilter.toUpperCase());
        const matchSearch =
          !searchOfficerQuery.trim() ||
          off.name.toLowerCase().includes(searchOfficerQuery.toLowerCase());
        return matchUlp && matchSearch;
      })
      .sort((a, b) => {
        if (b.avgRank !== a.avgRank) return b.avgRank - a.avgRank;
        if (b.totalReports !== a.totalReports) return b.totalReports - a.totalReports;
        return a.name.localeCompare(b.name);
      });
  }, [officerPerformanceData, selectedUlpFilter, searchOfficerQuery]);

  const filteredBottomOfficerPerformance = React.useMemo(() => {
    return officerPerformanceData
      .filter((off) => {
        const matchUlp =
          selectedUlpFilter === 'SEMUA' ||
          off.unit.toUpperCase().includes(selectedUlpFilter.toUpperCase());
        const matchSearch =
          !searchOfficerQuery.trim() ||
          off.name.toLowerCase().includes(searchOfficerQuery.toLowerCase());
        return matchUlp && matchSearch;
      })
      .sort((a, b) => {
        // Ascending sort by average rank (lowest score first)
        if (a.avgRank !== b.avgRank) return a.avgRank - b.avgRank;
        if (b.totalReports !== a.totalReports) return b.totalReports - a.totalReports;
        return a.name.localeCompare(b.name);
      });
  }, [officerPerformanceData, selectedUlpFilter, searchOfficerQuery]);

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
            onClick={() => setActiveTab('top-performers')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'top-performers'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-300" />
            <span>Top Performa Petugas</span>
          </button>

          <button
            onClick={() => setActiveTab('bottom-performers')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'bottom-performers'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <TrendingDown className="w-4 h-4 text-rose-300" />
            <span>Bottom Performa Petugas</span>
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

        {/* TAB: TOP PERFORMA PETUGAS */}
        {activeTab === 'top-performers' && (
          <div className="space-y-6">
            {/* Header & Filter Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-white flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                      <span>Top Performa Petugas Yantek</span>
                      <span className="text-xs bg-amber-100 text-amber-800 font-extrabold px-2.5 py-0.5 rounded-full border border-amber-300">
                        Skor Rata-Rata Rank (1 - 10)
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Peringkat dan penilaian rata-rata berdasarkan Nilai Rank kuesioner pendampingan petugas.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleFetchSpreadsheetReports}
                  disabled={isLoadingReports}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition disabled:opacity-50 cursor-pointer self-start md:self-auto"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingReports ? 'animate-spin' : ''}`} />
                  <span>{isLoadingReports ? 'Memuat Data...' : 'Refresh Nilai Rank'}</span>
                </button>
              </div>

              {/* Filters & Search */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {/* ULP Filter */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-blue-600" />
                    <span>Filter Unit / ULP:</span>
                  </label>
                  <select
                    value={selectedUlpFilter}
                    onChange={(e) => setSelectedUlpFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition cursor-pointer"
                  >
                    <option value="SEMUA">-- SEMUA ULP ({availableUlps.length} Unit) --</option>
                    {availableUlps.map((u, i) => (
                      <option key={i} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Officer Search */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-blue-600" />
                    <span>Cari Nama Petugas:</span>
                  </label>
                  <input
                    type="text"
                    value={searchOfficerQuery}
                    onChange={(e) => setSearchOfficerQuery(e.target.value)}
                    placeholder="Ketik nama petugas..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
                  />
                </div>

                {/* Stat quick summary */}
                <div className="sm:col-span-2 lg:col-span-1 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-xl p-2.5 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-bold text-blue-700 uppercase">Total Petugas Evaluasi</div>
                    <div className="text-lg font-black text-blue-950">{filteredOfficerPerformance.length} Orang</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-bold text-indigo-700 uppercase">Filter ULP Aktif</div>
                    <div className="text-xs font-black text-indigo-900 truncate max-w-[140px]">{selectedUlpFilter}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Podium Top 3 Performers */}
            {filteredOfficerPerformance.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* RANK 2 - SILVER */}
                {filteredOfficerPerformance[1] && (
                  <div className="order-2 md:order-1 bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 bg-slate-200 text-slate-700 font-black text-xs px-3 py-1 rounded-bl-xl border-l border-b border-slate-300">
                      RANK #2
                    </div>
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-black text-lg mb-3 shadow-inner border border-slate-300">
                        🥈
                      </div>
                      <span className="inline-block text-[10px] font-black tracking-wider uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md mb-1">
                        JUARA 2 PERFORMA
                      </span>
                      <h3 className="text-lg font-black text-slate-900 leading-tight">
                        {filteredOfficerPerformance[1].name}
                      </h3>
                      <p className="text-xs text-slate-500 font-bold mt-0.5">
                        {filteredOfficerPerformance[1].unit}
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Total Pendampingan</div>
                        <div className="text-sm font-extrabold text-slate-800">
                          {filteredOfficerPerformance[1].totalReports} Laporan
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Rata-Rata Rank</div>
                        <div className="text-xl font-black text-slate-700 flex items-center gap-1 justify-end">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                          <span>{filteredOfficerPerformance[1].avgRank}</span>
                          <span className="text-xs font-bold text-slate-400">/10</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* RANK 1 - GOLD */}
                {filteredOfficerPerformance[0] && (
                  <div className="order-1 md:order-2 bg-gradient-to-b from-amber-500 via-amber-600 to-yellow-600 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between scale-105 z-10 border-2 border-yellow-300">
                    <div className="absolute top-0 right-0 bg-yellow-300 text-yellow-950 font-black text-xs px-4 py-1.5 rounded-bl-xl shadow-md">
                      👑 RANK #1
                    </div>
                    <div>
                      <div className="w-14 h-14 rounded-2xl bg-yellow-400/30 text-yellow-200 flex items-center justify-center font-black text-2xl mb-3 shadow-inner border border-yellow-300/40">
                        🏆
                      </div>
                      <span className="inline-block text-[10px] font-black tracking-widest uppercase bg-yellow-300 text-yellow-950 px-2.5 py-0.5 rounded-md mb-1.5 shadow-sm">
                        PERFORMA TERBAIK #1
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-white leading-tight drop-shadow-sm">
                        {filteredOfficerPerformance[0].name}
                      </h3>
                      <p className="text-xs text-yellow-100 font-bold mt-1">
                        {filteredOfficerPerformance[0].unit}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-yellow-400/40 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-bold text-yellow-200 uppercase">Total Pendampingan</div>
                        <div className="text-base font-black text-white">
                          {filteredOfficerPerformance[0].totalReports} Laporan
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-yellow-200 uppercase">Rata-Rata Rank</div>
                        <div className="text-2xl font-black text-yellow-300 flex items-center gap-1 justify-end drop-shadow">
                          <Star className="w-5 h-5 fill-yellow-300 text-yellow-200" />
                          <span>{filteredOfficerPerformance[0].avgRank}</span>
                          <span className="text-xs font-bold text-yellow-200">/10</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* RANK 3 - BRONZE */}
                {filteredOfficerPerformance[2] && (
                  <div className="order-3 bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 bg-amber-100 text-amber-800 font-black text-xs px-3 py-1 rounded-bl-xl border-l border-b border-amber-200">
                      RANK #3
                    </div>
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-black text-lg mb-3 shadow-inner border border-amber-200">
                        🥉
                      </div>
                      <span className="inline-block text-[10px] font-black tracking-wider uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md mb-1">
                        JUARA 3 PERFORMA
                      </span>
                      <h3 className="text-lg font-black text-slate-900 leading-tight">
                        {filteredOfficerPerformance[2].name}
                      </h3>
                      <p className="text-xs text-slate-500 font-bold mt-0.5">
                        {filteredOfficerPerformance[2].unit}
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Total Pendampingan</div>
                        <div className="text-sm font-extrabold text-slate-800">
                          {filteredOfficerPerformance[2].totalReports} Laporan
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Rata-Rata Rank</div>
                        <div className="text-xl font-black text-amber-700 flex items-center gap-1 justify-end">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                          <span>{filteredOfficerPerformance[2].avgRank}</span>
                          <span className="text-xs font-bold text-slate-400">/10</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Complete Leaderboard Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                    <Award className="w-5 h-5 text-blue-600" />
                    <span>Daftar Klasemen Performa Petugas</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Nilai rata-rata dihitung dari akumulasi Nilai Rank kuesioner pada setiap sesi pendampingan.
                  </p>
                </div>
                <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-lg">
                  Total: {filteredOfficerPerformance.length} Petugas
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 uppercase font-bold tracking-wider text-[11px]">
                      <th className="p-3.5 text-center">POSISI</th>
                      <th className="p-3.5">NAMA PETUGAS</th>
                      <th className="p-3.5">UNIT / ULP</th>
                      <th className="p-3.5 text-center">PENDAMPINGAN</th>
                      <th className="p-3.5 text-center">SOAL DINILAI</th>
                      <th className="p-3.5 text-center">RATA-RATA RANK</th>
                      <th className="p-3.5 text-center">PREDIKAT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredOfficerPerformance.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                          Tidak ditemukan data petugas untuk filter yang dipilih.
                        </td>
                      </tr>
                    ) : (
                      filteredOfficerPerformance.map((item, index) => {
                        const rankPos = index + 1;
                        let badgeColor = 'bg-slate-100 text-slate-600 border-slate-200';
                        let predikatText = 'Belum Dinilai';

                        if (item.avgRank >= 8.5) {
                          badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                          predikatText = 'Sangat Baik';
                        } else if (item.avgRank >= 7.0) {
                          badgeColor = 'bg-blue-100 text-blue-800 border-blue-300';
                          predikatText = 'Baik';
                        } else if (item.avgRank >= 5.0) {
                          badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
                          predikatText = 'Cukup';
                        } else if (item.avgRank > 0) {
                          badgeColor = 'bg-rose-100 text-rose-800 border-rose-300';
                          predikatText = 'Perlu Evaluasi';
                        }

                        return (
                          <tr key={item.id || index} className="hover:bg-slate-50 transition">
                            <td className="p-3.5 text-center font-black">
                              {rankPos === 1 ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-400 text-yellow-950 font-black text-xs shadow-sm">
                                  1
                                </span>
                              ) : rankPos === 2 ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-900 font-black text-xs shadow-sm">
                                  2
                                </span>
                              ) : rankPos === 3 ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-600 text-white font-black text-xs shadow-sm">
                                  3
                                </span>
                              ) : (
                                <span className="text-slate-500 font-bold">#{rankPos}</span>
                              )}
                            </td>
                            <td className="p-3.5">
                              <div className="font-bold text-slate-900">{item.name}</div>
                              {item.totalReports > 0 && (
                                <div className="text-[10px] text-slate-400 font-medium">
                                  {item.totalYa} YA • {item.totalTidak} TIDAK
                                </div>
                              )}
                            </td>
                            <td className="p-3.5 font-semibold text-slate-700">
                              <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md text-xs border border-slate-200">
                                {item.unit}
                              </span>
                            </td>
                            <td className="p-3.5 text-center font-extrabold text-slate-800">
                              {item.totalReports} Laporan
                            </td>
                            <td className="p-3.5 text-center font-semibold text-slate-600">
                              {item.totalRankedQuestions} Soal
                            </td>
                            <td className="p-3.5 text-center">
                              <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-300 px-3 py-1 rounded-xl font-black text-sm">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                                <span>{item.avgRank > 0 ? item.avgRank : '-'}</span>
                                <span className="text-[10px] text-amber-700 font-bold">/10</span>
                              </div>
                            </td>
                            <td className="p-3.5 text-center">
                              <span className={`inline-block text-xs font-bold px-3 py-1 rounded-lg border ${badgeColor}`}>
                                {predikatText}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: BOTTOM PERFORMA PETUGAS */}
        {activeTab === 'bottom-performers' && (
          <div className="space-y-6">
            {/* Header & Filter Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30">
                    <TrendingDown className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                      <span>Bottom Performa Petugas Yantek</span>
                      <span className="text-xs bg-rose-100 text-rose-800 font-extrabold px-2.5 py-0.5 rounded-full border border-rose-300">
                        Skor Rank Terendah (1 - 10)
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Evaluasi petugas dengan rata-rata Nilai Rank terendah untuk prioritas pembinaan dan peningkatan kinerja.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleFetchSpreadsheetReports}
                  disabled={isLoadingReports}
                  className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition disabled:opacity-50 cursor-pointer self-start md:self-auto"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingReports ? 'animate-spin' : ''}`} />
                  <span>{isLoadingReports ? 'Memuat Data...' : 'Refresh Nilai Rank'}</span>
                </button>
              </div>

              {/* Filters & Search */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {/* ULP Filter */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-rose-600" />
                    <span>Filter Unit / ULP:</span>
                  </label>
                  <select
                    value={selectedUlpFilter}
                    onChange={(e) => setSelectedUlpFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-slate-800 focus:ring-2 focus:ring-rose-500 focus:bg-white outline-none transition cursor-pointer"
                  >
                    <option value="SEMUA">-- SEMUA ULP ({availableUlps.length} Unit) --</option>
                    {availableUlps.map((u, i) => (
                      <option key={i} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Officer Search */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-rose-600" />
                    <span>Cari Nama Petugas:</span>
                  </label>
                  <input
                    type="text"
                    value={searchOfficerQuery}
                    onChange={(e) => setSearchOfficerQuery(e.target.value)}
                    placeholder="Ketik nama petugas..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 focus:ring-2 focus:ring-rose-500 focus:bg-white outline-none transition"
                  />
                </div>

                {/* Stat quick summary */}
                <div className="sm:col-span-2 lg:col-span-1 bg-gradient-to-r from-rose-50 to-red-50 border border-rose-200/80 rounded-xl p-2.5 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-bold text-rose-700 uppercase">Total Petugas Ditemukan</div>
                    <div className="text-lg font-black text-rose-950">{filteredBottomOfficerPerformance.length} Orang</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-bold text-red-700 uppercase">Filter ULP Aktif</div>
                    <div className="text-xs font-black text-red-900 truncate max-w-[140px]">{selectedUlpFilter}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Spotlight 3 Lowest Performers */}
            {filteredBottomOfficerPerformance.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* BOTTOM 1 - LOWEST RANK */}
                {filteredBottomOfficerPerformance[0] && (
                  <div className="bg-gradient-to-b from-rose-50 to-red-100 rounded-2xl border-2 border-rose-400 p-5 shadow-md relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 bg-rose-600 text-white font-black text-[11px] px-3 py-1 rounded-bl-xl shadow-sm">
                      EVALUASI UTAMA #1
                    </div>
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black text-lg mb-3 shadow-md">
                        <ShieldAlert className="w-6 h-6" />
                      </div>
                      <span className="inline-block text-[10px] font-black tracking-wider uppercase bg-rose-200 text-rose-900 px-2 py-0.5 rounded-md mb-1 border border-rose-300">
                        NILAI RANK TERENDAH #1
                      </span>
                      <h3 className="text-lg font-black text-slate-900 leading-tight">
                        {filteredBottomOfficerPerformance[0].name}
                      </h3>
                      <p className="text-xs text-rose-800 font-bold mt-0.5">
                        {filteredBottomOfficerPerformance[0].unit}
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-rose-200 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Total Pendampingan</div>
                        <div className="text-sm font-extrabold text-slate-800">
                          {filteredBottomOfficerPerformance[0].totalReports} Laporan
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Rata-Rata Rank</div>
                        <div className="text-xl font-black text-rose-700 flex items-center gap-1 justify-end">
                          <Star className="w-4 h-4 fill-rose-500 text-rose-600" />
                          <span>{filteredBottomOfficerPerformance[0].avgRank}</span>
                          <span className="text-xs font-bold text-slate-500">/10</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* BOTTOM 2 */}
                {filteredBottomOfficerPerformance[1] && (
                  <div className="bg-gradient-to-b from-amber-50 to-orange-100 rounded-2xl border-2 border-amber-300 p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 bg-amber-600 text-white font-black text-[11px] px-3 py-1 rounded-bl-xl shadow-sm">
                      EVALUASI #2
                    </div>
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-lg mb-3 shadow-md">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <span className="inline-block text-[10px] font-black tracking-wider uppercase bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md mb-1 border border-amber-300">
                        NILAI RANK TERENDAH #2
                      </span>
                      <h3 className="text-lg font-black text-slate-900 leading-tight">
                        {filteredBottomOfficerPerformance[1].name}
                      </h3>
                      <p className="text-xs text-amber-800 font-bold mt-0.5">
                        {filteredBottomOfficerPerformance[1].unit}
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-amber-200 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Total Pendampingan</div>
                        <div className="text-sm font-extrabold text-slate-800">
                          {filteredBottomOfficerPerformance[1].totalReports} Laporan
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Rata-Rata Rank</div>
                        <div className="text-xl font-black text-amber-800 flex items-center gap-1 justify-end">
                          <Star className="w-4 h-4 fill-amber-500 text-amber-600" />
                          <span>{filteredBottomOfficerPerformance[1].avgRank}</span>
                          <span className="text-xs font-bold text-slate-500">/10</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* BOTTOM 3 */}
                {filteredBottomOfficerPerformance[2] && (
                  <div className="bg-gradient-to-b from-slate-50 to-slate-100 rounded-2xl border-2 border-slate-300 p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 bg-slate-600 text-white font-black text-[11px] px-3 py-1 rounded-bl-xl shadow-sm">
                      EVALUASI #3
                    </div>
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-slate-700 text-white flex items-center justify-center font-black text-lg mb-3 shadow-md">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <span className="inline-block text-[10px] font-black tracking-wider uppercase bg-slate-200 text-slate-800 px-2 py-0.5 rounded-md mb-1 border border-slate-300">
                        NILAI RANK TERENDAH #3
                      </span>
                      <h3 className="text-lg font-black text-slate-900 leading-tight">
                        {filteredBottomOfficerPerformance[2].name}
                      </h3>
                      <p className="text-xs text-slate-600 font-bold mt-0.5">
                        {filteredBottomOfficerPerformance[2].unit}
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Total Pendampingan</div>
                        <div className="text-sm font-extrabold text-slate-800">
                          {filteredBottomOfficerPerformance[2].totalReports} Laporan
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Rata-Rata Rank</div>
                        <div className="text-xl font-black text-slate-700 flex items-center gap-1 justify-end">
                          <Star className="w-4 h-4 fill-slate-400 text-slate-500" />
                          <span>{filteredBottomOfficerPerformance[2].avgRank}</span>
                          <span className="text-xs font-bold text-slate-500">/10</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Complete Bottom Performance Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-rose-600" />
                    <span>Urutan Evaluasi Bottom Performa Petugas (Dari Nilai Terendah)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tabel disusun urut dari Nilai Rank rata-rata paling rendah ke yang lebih tinggi.
                  </p>
                </div>
                <span className="text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 px-3 py-1 rounded-lg">
                  Total: {filteredBottomOfficerPerformance.length} Petugas
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 uppercase font-bold tracking-wider text-[11px]">
                      <th className="p-3.5 text-center">POSISI EVALUASI</th>
                      <th className="p-3.5">NAMA PETUGAS</th>
                      <th className="p-3.5">UNIT / ULP</th>
                      <th className="p-3.5 text-center">PENDAMPINGAN</th>
                      <th className="p-3.5 text-center">SOAL DINILAI</th>
                      <th className="p-3.5 text-center">RATA-RATA RANK</th>
                      <th className="p-3.5 text-center">PREDIKAT & STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredBottomOfficerPerformance.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                          Tidak ditemukan data petugas untuk filter yang dipilih.
                        </td>
                      </tr>
                    ) : (
                      filteredBottomOfficerPerformance.map((item, index) => {
                        const rankPos = index + 1;
                        let badgeColor = 'bg-slate-100 text-slate-600 border-slate-200';
                        let predikatText = 'Belum Dinilai';

                        if (item.avgRank > 0 && item.avgRank < 5.0) {
                          badgeColor = 'bg-rose-100 text-rose-800 border-rose-300';
                          predikatText = 'Perlu Evaluasi Ketat';
                        } else if (item.avgRank >= 5.0 && item.avgRank < 7.0) {
                          badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
                          predikatText = 'Perlu Pembinaan';
                        } else if (item.avgRank >= 7.0 && item.avgRank < 8.5) {
                          badgeColor = 'bg-blue-100 text-blue-800 border-blue-300';
                          predikatText = 'Baik';
                        } else if (item.avgRank >= 8.5) {
                          badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                          predikatText = 'Sangat Baik';
                        }

                        return (
                          <tr key={item.id || index} className="hover:bg-slate-50 transition">
                            <td className="p-3.5 text-center font-black">
                              <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 font-extrabold text-xs">
                                Terendah #{rankPos}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <div className="font-bold text-slate-900">{item.name}</div>
                              {item.totalReports > 0 && (
                                <div className="text-[10px] text-slate-400 font-medium">
                                  {item.totalYa} YA • {item.totalTidak} TIDAK
                                </div>
                              )}
                            </td>
                            <td className="p-3.5 font-semibold text-slate-700">
                              <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md text-xs border border-slate-200">
                                {item.unit}
                              </span>
                            </td>
                            <td className="p-3.5 text-center font-extrabold text-slate-800">
                              {item.totalReports} Laporan
                            </td>
                            <td className="p-3.5 text-center font-semibold text-slate-600">
                              {item.totalRankedQuestions} Soal
                            </td>
                            <td className="p-3.5 text-center">
                              <div className="inline-flex items-center gap-1 bg-rose-50 text-rose-900 border border-rose-300 px-3 py-1 rounded-xl font-black text-sm">
                                <Star className="w-3.5 h-3.5 fill-rose-400 text-rose-500" />
                                <span>{item.avgRank > 0 ? item.avgRank : '-'}</span>
                                <span className="text-[10px] text-rose-700 font-bold">/10</span>
                              </div>
                            </td>
                            <td className="p-3.5 text-center">
                              <span className={`inline-block text-xs font-bold px-3 py-1 rounded-lg border ${badgeColor}`}>
                                {predikatText}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
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
                            lk.includes('workorder') ||
                            lk.includes('work order') ||
                            lk.includes('wo') ||
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
