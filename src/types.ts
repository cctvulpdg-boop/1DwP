export const SPREADSHEET_ID = "1OLoqrLsAuG0t_BNiANGfhvZwGRWTzEvrBR70WWxNmhw";
export const FOLDER_EVIDEN_ID = "1rgh6LzMxuTz7LxkEZp1YxBcEluBd24s4";
export const OAUTH_CLIENT_ID = "784886439702-3vric2r4pg68q4u8qn961uupsmsvsfa8.apps.googleusercontent.com";

export type DivisionType = 'YANTEK' | 'MANBILL' | string;

export interface DivisionItem {
  id?: string;
  name: string;
}

export interface UnitItem {
  id?: string;
  name: string;
}

export interface CompanionItem {
  id?: string;
  name: string;
  division?: string;
  unit?: string;
  ulpId?: string;
  divisiId?: string;
}

export interface OfficerItem {
  id?: string;
  name: string;
  unit: string;
  ulpId?: string;
  role?: string;
}

export interface QuestionGroupItem {
  id?: string;
  name: string;
  divisiId?: string;
}

export interface SubQuestionItem {
  id?: string;
  name: string;
  kelompokId?: string;
  divisiId?: string;
}

export interface QuestionItem {
  id: number;
  text: string;
  kelompokId?: string;
  kelompokName?: string;
  subKelompokId?: string;
  subKelompokName?: string;
  divisiId?: string;
  category?: string;
  required?: boolean;
}

export interface EvidenPhoto {
  id: string;
  dataUrl: string; // Base64 with watermark
  blob?: Blob;
  driveFileId?: string;
  driveViewLink?: string;
  timestamp: string;
  latitude?: number | null;
  longitude?: number | null;
  locationString?: string;
  notes?: string;
}

export interface InspectionFormData {
  // Login phase
  division: DivisionType;
  unit: string;
  companion: string;

  // Assistance phase
  assistedUnit: string; // filled if unit === "UL PADANG"
  officer1: string;
  officer2: string;

  // Questions phase
  answers: Record<number, 'YA' | 'TIDAK' | string>;
  notes: Record<number, string>;
  evidenPhotos: EvidenPhoto[];

  // Meta
  reportId?: string;
  startedAt: string;
  submittedAt?: string;
}

export type AppStep = 'login' | 'assistance' | 'questions' | 'success' | 'admin-dashboard';

export interface GoogleAuthState {
  isSignedIn: boolean;
  accessToken: string | null;
  expiresAt: number | null;
  userEmail: string | null;
  userName: string | null;
  error: string | null;
}
