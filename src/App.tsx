import React, { useState, useEffect, useCallback } from 'react';
import {
  DivisionType,
  DivisionItem,
  UnitItem,
  CompanionItem,
  OfficerItem,
  QuestionItem,
  InspectionFormData,
  AppStep,
  GoogleAuthState,
} from './types';
import {
  initGoogleAuth,
  subscribeAuth,
  getAuthState,
} from './services/googleAuth';
import {
  getDivisions,
  getUnits,
  getDivisionItems,
  getUnitItems,
  getCompanions,
  getOfficers,
  getQuestions,
  getLaporanYantekFromSpreadsheet,
  FALLBACK_DIVISI,
  FALLBACK_ULP,
  FALLBACK_PENDAMPING,
  FALLBACK_YANTEK_PETUGAS,
  FALLBACK_PERTANYAAN_YANTEK,
} from './services/googleSheets';
import { Header } from './components/Header';
import { LoginPage } from './components/LoginPage';
import { AssistancePage } from './components/AssistancePage';
import { QuestionsPage } from './components/QuestionsPage';
import { SuccessModal } from './components/SuccessModal';
import { AdminDashboard } from './components/AdminDashboard';
import { AnimatePresence } from 'motion/react';

export default function App() {
  const [authState, setAuthState] = useState<GoogleAuthState>(getAuthState());
  const [step, setStep] = useState<AppStep>('login');
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  const [reports, setReports] = useState<InspectionFormData[]>([]);

  // Spreadsheet Data Collections
  const [divisions, setDivisions] = useState<string[]>(FALLBACK_DIVISI);
  const [units, setUnits] = useState<string[]>(FALLBACK_ULP);
  const [divisionItems, setDivisionItems] = useState<DivisionItem[]>([]);
  const [unitItems, setUnitItems] = useState<UnitItem[]>([]);
  const [companions, setCompanions] = useState<CompanionItem[]>(FALLBACK_PENDAMPING);
  const [officers, setOfficers] = useState<OfficerItem[]>(FALLBACK_YANTEK_PETUGAS);
  const [questions, setQuestions] = useState<QuestionItem[]>(FALLBACK_PERTANYAAN_YANTEK);

  // Form State
  const [formData, setFormData] = useState<InspectionFormData>({
    division: '',
    unit: '',
    companion: '',
    assistedUnit: '',
    workOrderNo: '',
    officer1: '',
    officer2: '',
    answers: {},
    notes: {},
    evidenPhotos: [],
    startedAt: new Date().toISOString(),
  });

  const [lastSubmittedSheet, setLastSubmittedSheet] = useState<string>('LAPORAN_YANTEK');

  // 1. Initialize Google Auth and subscribe to token updates
  useEffect(() => {
    initGoogleAuth();
    const unsub = subscribeAuth((state) => {
      setAuthState(state);
    });
    return unsub;
  }, []);

  // 2. Load Spreadsheet Data directly from Google Sheets
  const loadSpreadsheetData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [divs, unList, divObjs, unObjs, compList, offList, repList] = await Promise.all([
        getDivisions(),
        getUnits(),
        getDivisionItems(),
        getUnitItems(),
        getCompanions(),
        getOfficers(),
        getLaporanYantekFromSpreadsheet(),
      ]);

      if (divs && divs.length > 0) setDivisions(divs);
      if (unList && unList.length > 0) setUnits(unList);
      if (divObjs && divObjs.length > 0) setDivisionItems(divObjs);
      if (unObjs && unObjs.length > 0) setUnitItems(unObjs);
      if (compList && compList.length > 0) setCompanions(compList);
      if (offList && offList.length > 0) setOfficers(offList);
      if (repList && repList.length > 0) setReports(repList);
    } catch (err) {
      console.warn('Could not refresh spreadsheet data:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // Refresh data on mount and when Google Auth state changes
  useEffect(() => {
    loadSpreadsheetData();
  }, [authState.isSignedIn, loadSpreadsheetData]);

  // Update Form State Helper
  const handleUpdateForm = (updates: Partial<InspectionFormData>) => {
    setFormData((prev) => {
      const next = {
        ...prev,
        ...updates,
      };
      const normUnit = (next.unit || '').trim().toUpperCase();
      const isULPadang = normUnit === 'UL PADANG' || normUnit === 'ULPADANG' || normUnit.includes('PADANG');
      if (!isULPadang) {
        next.assistedUnit = next.unit;
      }
      return next;
    });
  };

  // Step 1 -> Step 2: Login Success
  const handleLogin = () => {
    if (formData.division && formData.unit && formData.companion) {
      const normUnit = (formData.unit || '').trim().toUpperCase();
      const isULPadang = normUnit === 'UL PADANG' || normUnit === 'ULPADANG' || normUnit.includes('PADANG');
      if (!isULPadang) {
        setFormData((prev) => ({ ...prev, assistedUnit: prev.unit }));
      }
      setStep('assistance');
    }
  };

  const handleAdminLogin = () => {
    setStep('admin-dashboard');
  };

  // Step 2 -> Step 3: Start Questions
  const handleStartQuestions = async () => {
    setIsLoadingData(true);
    try {
      const normUnit = (formData.unit || '').trim().toUpperCase();
      const isULPadang = normUnit === 'UL PADANG' || normUnit === 'ULPADANG' || normUnit.includes('PADANG');
      if (!isULPadang) {
        setFormData((prev) => ({ ...prev, assistedUnit: prev.unit }));
      }
      const loadedQuestions = await getQuestions(formData.division);
      setQuestions(loadedQuestions);
      setStep('questions');
    } catch (err) {
      console.warn('Error loading questions:', err);
      setStep('questions');
    } finally {
      setIsLoadingData(false);
    }
  };

  // Step 2 Batal: Reset assistance form fields
  const handleCancelAssistance = () => {
    handleUpdateForm({
      assistedUnit: '',
      workOrderNo: '',
      officer1: '',
      officer2: '',
    });
  };

  // Step 3 -> Step 2: Back to Assistance
  const handleBackToAssistance = () => {
    setStep('assistance');
  };

  // Step 3 -> Step 4: Submission Success
  const handleSubmitSuccess = (sheetName: string) => {
    setReports((prev) => [
      {
        ...formData,
        reportId: formData.reportId || `RPT-${Date.now()}`,
        submittedAt: new Date().toLocaleString('id-ID'),
      },
      ...prev,
    ]);
    setLastSubmittedSheet(sheetName);
    setStep('success');
  };

  // Reset to new inspection (keeps companion/unit login)
  const handleNewInspection = () => {
    setFormData((prev) => ({
      ...prev,
      assistedUnit: '',
      workOrderNo: '',
      officer1: '',
      officer2: '',
      answers: {},
      notes: {},
      evidenPhotos: [],
      startedAt: new Date().toISOString(),
    }));
    setStep('assistance');
  };

  // Full Logout / Reset to Login
  const handleFullLogout = () => {
    setFormData({
      division: '',
      unit: '',
      companion: '',
      assistedUnit: '',
      workOrderNo: '',
      officer1: '',
      officer2: '',
      answers: {},
      notes: {},
      evidenPhotos: [],
      startedAt: new Date().toISOString(),
    });
    setStep('login');
  };

  if (step === 'admin-dashboard') {
    return (
      <AdminDashboard
        units={units}
        divisions={divisions}
        companions={companions}
        officers={officers}
        onUpdateOfficers={setOfficers}
        questions={questions}
        onUpdateQuestions={setQuestions}
        reports={reports}
        onUpdateReports={setReports}
        onLogout={handleFullLogout}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Top Navigation Header */}
      <Header
        formData={formData}
        authState={authState}
        currentStep={step}
        onReset={handleFullLogout}
        onRefreshData={loadSpreadsheetData}
        isLoadingData={isLoadingData}
      />

      {/* Main Flow Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4">
        <AnimatePresence mode="wait">
          {step === 'login' && (
            <LoginPage
              key="login"
              divisions={divisions}
              units={units}
              companions={companions}
              divisionItems={divisionItems}
              unitItems={unitItems}
              selectedDivision={formData.division}
              selectedUnit={formData.unit}
              selectedCompanion={formData.companion}
              onSelectDivision={(val) => handleUpdateForm({ division: val })}
              onSelectUnit={(val) => handleUpdateForm({ unit: val })}
              onSelectCompanion={(val) => handleUpdateForm({ companion: val })}
              onLogin={handleLogin}
              onAdminLogin={handleAdminLogin}
              isLoading={isLoadingData}
            />
          )}

          {step === 'assistance' && (
            <AssistancePage
              key="assistance"
              formData={formData}
              units={units}
              officers={officers}
              onUpdateForm={handleUpdateForm}
              onStartQuestions={handleStartQuestions}
              onCancel={handleCancelAssistance}
            />
          )}

          {step === 'questions' && (
            <QuestionsPage
              key="questions"
              formData={formData}
              questions={questions}
              onUpdateForm={handleUpdateForm}
              onBackToAssistance={handleBackToAssistance}
              onSubmitSuccess={handleSubmitSuccess}
            />
          )}

          {step === 'success' && (
            <SuccessModal
              key="success"
              formData={formData}
              sheetName={lastSubmittedSheet}
              onNewInspection={handleNewInspection}
              onLogout={handleFullLogout}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Footer matching reference image */}
      <footer className="py-6 px-4 text-center text-xs text-slate-500 bg-slate-50/80">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-3">
          <div className="h-0.5 w-16 bg-blue-600 rounded-full" />
          <span className="font-bold tracking-wider text-slate-700 uppercase">One Day With Petugas</span>
          <div className="h-0.5 w-16 bg-amber-400 rounded-full" />
        </div>
      </footer>
    </div>
  );
}
