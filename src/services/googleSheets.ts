import {
  SPREADSHEET_ID,
  DivisionItem,
  UnitItem,
  CompanionItem,
  OfficerItem,
  QuestionGroupItem,
  SubQuestionItem,
  QuestionItem,
  InspectionFormData,
  EvidenPhoto,
} from '../types';
import { parseGoogleDrivePhoto } from '../utils/photoUtils';
import { getAuthState, requestGoogleSignIn } from './googleAuth';
import { GAS_WEB_APP_URL } from './gasConfig';

// Fallback seed data in case Google Sheets is not yet authenticated or empty
export const FALLBACK_DIVISI = ['YANTEK', 'MANBILL'];

export const FALLBACK_ULP = [
  'UL PADANG',
  'ULP BELANTI',
  'ULP KURANJI',
  'ULP INDARUNG',
  'ULP TABING',
  'ULP PAINAN',
  'ULP BALAI SELASA',
];

export const FALLBACK_PENDAMPING: CompanionItem[] = [
  { name: 'MUL', division: 'YANTEK', unit: 'UL PADANG', ulpId: 'UL PADANG', divisiId: 'YANTEK' },
  { name: 'Ahmad Fauzi', division: 'YANTEK', unit: 'UL PADANG', ulpId: 'UL PADANG', divisiId: 'YANTEK' },
  { name: 'Budi Santoso', division: 'YANTEK', unit: 'UL PADANG', ulpId: 'UL PADANG', divisiId: 'YANTEK' },
  { name: 'Citra Dewi', division: 'YANTEK', unit: 'ULP BELANTI', ulpId: 'ULP BELANTI', divisiId: 'YANTEK' },
  { name: 'Dedi Kurniawan', division: 'YANTEK', unit: 'ULP KURANJI', ulpId: 'ULP KURANJI', divisiId: 'YANTEK' },
  { name: 'Eko Prasetyo', division: 'YANTEK', unit: 'ULP INDARUNG', ulpId: 'ULP INDARUNG', divisiId: 'YANTEK' },
  { name: 'Fajar Nugraha', division: 'MANBILL', unit: 'UL PADANG', ulpId: 'UL PADANG', divisiId: 'MANBILL' },
  { name: 'Gita Permata', division: 'MANBILL', unit: 'UL PADANG', ulpId: 'UL PADANG', divisiId: 'MANBILL' },
  { name: 'Hadi Saputra', division: 'MANBILL', unit: 'ULP BELANTI', ulpId: 'ULP BELANTI', divisiId: 'MANBILL' },
  { name: 'Indra Gunawan', division: 'MANBILL', unit: 'ULP KURANJI', ulpId: 'ULP KURANJI', divisiId: 'MANBILL' },
];

export const FALLBACK_YANTEK_PETUGAS: OfficerItem[] = [
  { name: 'Rian Pratama', unit: 'UL PADANG' },
  { name: 'Rizki Ramadhan', unit: 'UL PADANG' },
  { name: 'Bayu Saputra', unit: 'UL PADANG' },
  { name: 'Agus Setiawan', unit: 'UL PADANG' },
  { name: 'Doni Firmansyah', unit: 'ULP BELANTI' },
  { name: 'Irfan Hakim', unit: 'ULP BELANTI' },
  { name: 'Taufik Hidayat', unit: 'ULP BELANTI' },
  { name: 'Hendra Wijaya', unit: 'ULP KURANJI' },
  { name: 'Yudi Gunawan', unit: 'ULP KURANJI' },
  { name: 'Andi Saputra', unit: 'ULP INDARUNG' },
  { name: 'Bambang Irawan', unit: 'ULP INDARUNG' },
  { name: 'Candra Wijaya', unit: 'ULP TABING' },
  { name: 'Denny Sumargo', unit: 'ULP TABING' },
];

export const FALLBACK_KELOMPOK_PERTANYAAN: QuestionGroupItem[] = [
  { id: 'A', name: 'Kedatangan Petugas PLN ke Rumah Pelanggan', divisiId: 'YANTEK' },
  { id: 'B', name: 'Pelaksanaan Pekerjaan & SOP Keselamatan K3', divisiId: 'YANTEK' },
  { id: 'C', name: 'Penyelesaian Pekerjaan & Edukasi Pelanggan', divisiId: 'YANTEK' },
];

export const FALLBACK_SUB_PERTANYAAN_YANTEK: SubQuestionItem[] = [
  { id: '1', name: 'APAKAH CCTV DIGUNAKAN', kelompokId: 'A', divisiId: 'YANTEK' },
  { id: '2', name: 'PEMERIKSAAN KELENGKAPAN APD & PERALATAN KERJA', kelompokId: 'B', divisiId: 'YANTEK' },
  { id: '3', name: 'EDUKASI PLN MOBILE & INTEGRITAS PETUGAS', kelompokId: 'C', divisiId: 'YANTEK' },
];

export const FALLBACK_PERTANYAAN_YANTEK: QuestionItem[] = [
  {
    id: 1,
    text: 'Apakah Terdapat Nama Petugas Yantek yang mengunjungi rumah Pelanggan',
    kelompokId: 'A',
    kelompokName: 'Kedatangan Petugas PLN ke Rumah Pelanggan',
    subKelompokId: '1',
    subKelompokName: 'APAKAH CCTV DIGUNAKAN',
    category: 'Kedatangan Petugas',
  },
  {
    id: 2,
    text: 'Berapa Lama Waktu yang dibutuhkan oleh Petugas Yantek Sejak dari Pelanggan submit Laporan hingga Petugas tiba di lokasi, pakah kurang dari 30 menit',
    kelompokId: 'A',
    kelompokName: 'Kedatangan Petugas PLN ke Rumah Pelanggan',
    subKelompokId: '1',
    subKelompokName: 'APAKAH CCTV DIGUNAKAN',
    category: 'Kedatangan Petugas',
  },
  {
    id: 3,
    text: 'Apakah Petugas mengucapkan salam "Selamat pagi/siang/sore/malam" Saat Sampai Di Lokasi Pelanggan',
    kelompokId: 'A',
    kelompokName: 'Kedatangan Petugas PLN ke Rumah Pelanggan',
    subKelompokId: '1',
    subKelompokName: 'APAKAH CCTV DIGUNAKAN',
    category: 'Kedatangan Petugas',
  },
  {
    id: 4,
    text: 'Apakah Petugas memperkenalkan diri "Kami (menyebutkan nama petugas) Pegawai PT...(menyebut nama PT naungan) Mitra PLN"',
    kelompokId: 'A',
    kelompokName: 'Kedatangan Petugas PLN ke Rumah Pelanggan',
    subKelompokId: '1',
    subKelompokName: 'APAKAH CCTV DIGUNAKAN',
    category: 'Kedatangan Petugas',
  },
  {
    id: 5,
    text: 'Apakah Petugas menggunakan APD Lengkap (Helm Standar, Rompi, Sepatu Safety, Sarung Tangan 1kV/20kV)?',
    kelompokId: 'B',
    kelompokName: 'Pelaksanaan Pekerjaan & SOP Keselamatan K3',
    subKelompokId: '2',
    subKelompokName: 'PEMERIKSAAN KELENGKAPAN APD & PERALATAN KERJA',
    category: 'K3 & SOP',
  },
  {
    id: 6,
    text: 'Apakah dilakukan briefing keselamatan kerja (Safety Talk/JSA) & pemasangan safety line sebelum bekerja?',
    kelompokId: 'B',
    kelompokName: 'Pelaksanaan Pekerjaan & SOP Keselamatan K3',
    subKelompokId: '2',
    subKelompokName: 'PEMERIKSAAN KELENGKAPAN APD & PERALATAN KERJA',
    category: 'K3 & SOP',
  },
  {
    id: 7,
    text: 'Apakah Petugas melakukan pengetesan tegangan dan peralatan setelah pekerjaan selesai?',
    kelompokId: 'C',
    kelompokName: 'Penyelesaian Pekerjaan & Edukasi Pelanggan',
    subKelompokId: '3',
    subKelompokName: 'EDUKASI PLN MOBILE & INTEGRITAS PETUGAS',
    category: 'Penyelesaian & Edukasi',
  },
  {
    id: 8,
    text: 'Apakah Petugas memberikan sosialisasi rating bintang pada aplikasi PLN Mobile dan menolak segala bentuk gratifikasi/tips?',
    kelompokId: 'C',
    kelompokName: 'Penyelesaian Pekerjaan & Edukasi Pelanggan',
    subKelompokId: '3',
    subKelompokName: 'EDUKASI PLN MOBILE & INTEGRITAS PETUGAS',
    category: 'Penyelesaian & Edukasi',
  },
];

export const FALLBACK_PERTANYAAN_MANBILL: QuestionItem[] = [
  {
    id: 1,
    text: 'Apakah petugas Manbill membawa identitas resmi / tanda pengenal penugasan aktif?',
    kelompokId: '1',
    kelompokName: 'IDENTITAS & ADMINISTRASI',
    subKelompokId: '1',
    subKelompokName: 'Tanda Pengenal & Surat Tugas',
    category: 'Identitas',
  },
  {
    id: 2,
    text: 'Apakah rute penagihan/pembacaan meter sesuai dengan data target harian?',
    kelompokId: '2',
    kelompokName: 'TARGET & AKURASI',
    subKelompokId: '2',
    subKelompokName: 'Kesesuaian Rute Cater',
    category: 'Target',
  },
  {
    id: 3,
    text: 'Apakah pembacaan angka stand meter akurat dan foto stand meter jelas?',
    kelompokId: '2',
    kelompokName: 'TARGET & AKURASI',
    subKelompokId: '3',
    subKelompokName: 'Ketepatan Angka Stand Meter',
    category: 'Akurasi',
  },
  {
    id: 4,
    text: 'Apakah dilakukan edukasi pembayaran tepat waktu dan penggunaan PLN Mobile kepada pelanggan?',
    kelompokId: '3',
    kelompokName: 'PELAYANAN & EDUKASI',
    subKelompokId: '4',
    subKelompokName: 'Sosialisasi PLN Mobile',
    category: 'Edukasi',
  },
  {
    id: 5,
    text: 'Apakah terdapat kendala teknis atau indikasi kelainan kWh meter yang dicatat dan dilaporkan?',
    kelompokId: '4',
    kelompokName: 'TEMUAN & PROSEDUR',
    subKelompokId: '5',
    subKelompokName: 'Pencatatan Kelainan kWh Meter',
    category: 'Temuan',
  },
  {
    id: 6,
    text: 'Apakah penyampaian invoice/surat pemberitahuan penagihan dilakukan sesuai prosedur?',
    kelompokId: '4',
    kelompokName: 'TEMUAN & PROSEDUR',
    subKelompokId: '6',
    subKelompokName: 'Penyampaian Surat Tagihan',
    category: 'Prosedur',
  },
];

/**
 * Cache for discovered sheet titles
 */
let existingSheetTitles: string[] = [];

/**
 * Fetch spreadsheet metadata to discover sheet titles and verify access
 */
export async function getSpreadsheetMetadata(): Promise<{ title: string; sheets: string[] } | null> {
  const auth = getAuthState();
  if (!auth.accessToken) return null;

  try {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`, {
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        console.log('Google Access Token expired, clearing session token.');
        localStorage.removeItem('g_access_token');
        localStorage.removeItem('g_token_expiry');
        sessionStorage.removeItem('g_access_token');
        sessionStorage.removeItem('g_token_expiry');
      } else {
        const errText = await res.text().catch(() => '');
        console.log(`Spreadsheet metadata fetch status (${res.status}):`, errText);
      }
      return null;
    }

    const data = await res.json();
    const sheets = (data.sheets || []).map((s: any) => s.properties?.title as string).filter(Boolean);
    existingSheetTitles = sheets;
    console.log('Discovered Spreadsheet sheets:', sheets);
    return {
      title: data.properties?.title || 'Spreadsheet',
      sheets,
    };
  } catch (err) {
    console.warn('Network info: unable to fetch spreadsheet metadata, using fallback mode:', err);
    return null;
  }
}

/**
 * Fetch data via Google Visualization API (GViz) as a resilient fallback
 */
async function fetchSheetViaGViz(sheetName: string): Promise<string[][] | null> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const text = await res.text();
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');
    if (startIdx === -1 || endIdx === -1) return null;

    const json = JSON.parse(text.substring(startIdx, endIdx + 1));
    if (!json?.table) return null;

    const rows: string[][] = [];
    if (json.table.cols && json.table.cols.some((c: any) => c.label)) {
      rows.push(json.table.cols.map((c: any) => (c.label ? String(c.label) : '')));
    }

    if (json.table.rows && Array.isArray(json.table.rows)) {
      for (const r of json.table.rows) {
        if (!r?.c) continue;
        const rowVals = r.c.map((cell: any) => {
          if (!cell || cell.v === null || cell.v === undefined) return '';
          return String(cell.f || cell.v);
        });
        rows.push(rowVals);
      }
    }

    if (rows.length > 0) {
      console.log(`[GViz] Successfully fetched ${rows.length} rows from sheet "${sheetName}"`);
      return rows;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch raw sheet data via Google Sheets API v4 with case-insensitive sheet matching and GViz fallback
 */
async function fetchSheetValues(targetSheetName: string, alternativeNames: string[] = []): Promise<string[][] | null> {
  const auth = getAuthState();
  const allNamesToTry = [targetSheetName, ...alternativeNames];

  // 1. If Google Access Token is available, try official Google Sheets API v4
  if (auth.accessToken) {
    if (existingSheetTitles.length === 0) {
      await getSpreadsheetMetadata();
    }

    // 1st Priority: Exact match across all candidates (case-insensitive & stripped of whitespace/underscores)
    let matchedTitle: string | null = null;
    for (const name of allNamesToTry) {
      const cleanName = name.toLowerCase().replace(/[\s_\-\.]/g, '');
      const found = existingSheetTitles.find((t) => {
        const cleanT = t.toLowerCase().replace(/[\s_\-\.]/g, '');
        return cleanT === cleanName || t.toLowerCase() === name.toLowerCase();
      });
      if (found) {
        matchedTitle = found;
        break;
      }
    }

    // 2nd Priority: Fallback substring match, strictly preventing collision with other sheets
    if (!matchedTitle) {
      for (const name of allNamesToTry) {
        const cleanName = name.toLowerCase().replace(/[\s_\-\.]/g, '');
        const found = existingSheetTitles.find((t) => {
          const cleanT = t.toLowerCase().replace(/[\s_\-\.]/g, '');
          // When searching for YANTEK or PETUGAS, do NOT match PERTANYAAN, SUB, or LAPORAN sheets
          if (cleanName === 'yantek' || cleanName.includes('petugas')) {
            if (cleanT.includes('pertanyaan') || cleanT.includes('laporan') || cleanT.includes('sub')) {
              return false;
            }
          }
          // When searching for PERTANYAAN, do NOT match SUB or KELOMPOK
          if (cleanName === 'pertanyaanyantek' || cleanName === 'pertanyaan') {
            if (cleanT.includes('sub') || cleanT.includes('kelompok') || cleanT.includes('laporan')) {
              return false;
            }
          }
          return cleanT.includes(cleanName) || cleanName.includes(cleanT);
        });
        if (found) {
          matchedTitle = found;
          break;
        }
      }
    }

    const actualTitle = matchedTitle || targetSheetName;

    try {
      const encodedSheet = encodeURIComponent(actualTitle);
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodedSheet}!A1:ZZ1000`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`Successfully fetched ${data.values?.length || 0} rows from sheet "${actualTitle}" via API`);
        if (data.values && data.values.length > 0) {
          return data.values;
        }
      } else if (res.status === 401) {
        console.log(`Token expired when fetching sheet "${actualTitle}", falling back to public mode.`);
        localStorage.removeItem('g_access_token');
        localStorage.removeItem('g_token_expiry');
        sessionStorage.removeItem('g_access_token');
        sessionStorage.removeItem('g_token_expiry');
      } else {
        const errText = await res.text().catch(() => '');
        console.log(`Sheet "${actualTitle}" fetch status (${res.status}):`, errText);
      }
    } catch (err) {
      console.log(`Network info: API fetch for sheet ${targetSheetName} failed, trying GViz fallback:`, err);
    }
  }

  // 2. Try Google Visualization API (GViz) fallback across all candidate names
  for (const name of allNamesToTry) {
    const gvizRows = await fetchSheetViaGViz(name);
    if (gvizRows && gvizRows.length > 0) {
      return gvizRows;
    }
  }

  return null;
}

/**
 * Ensures a sheet exists before appending; creates it with headers if missing
 */
async function ensureSheetExistsWithHeaders(
  sheetName: string,
  headers: string[],
  accessToken: string
): Promise<boolean> {
  try {
    if (existingSheetTitles.length === 0) {
      await getSpreadsheetMetadata();
    }

    const exists = existingSheetTitles.some(
      (t) => t.toLowerCase() === sheetName.toLowerCase()
    );

    if (!exists) {
      console.log(`Sheet "${sheetName}" does not exist, creating new tab...`);
      // 1. Create sheet tab
      const createRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetName,
                  gridProperties: {
                    frozenRowCount: 1,
                  },
                },
              },
            },
          ],
        }),
      });

      if (!createRes.ok) {
        const err = await createRes.text();
        console.warn(`Could not auto-create sheet "${sheetName}":`, err);
      } else {
        existingSheetTitles.push(sheetName);
        // 2. Add header row
        const encodedSheet = encodeURIComponent(sheetName);
        await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodedSheet}!A1:append?valueInputOption=USER_ENTERED`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              range: `${sheetName}!A1`,
              majorDimension: 'ROWS',
              values: [headers],
            }),
          }
        );
      }
    }
    return true;
  } catch (e) {
    console.warn('ensureSheetExists error:', e);
    return false;
  }
}

/**
 * Fetch Division items ({ id, name }) from Sheet "DIVISI"
 */
export async function getDivisionItems(): Promise<DivisionItem[]> {
  const rows = await fetchSheetValues('DIVISI');
  if (!rows || rows.length === 0) {
    return FALLBACK_DIVISI.map((name, i) => ({ id: String(i + 1), name }));
  }

  // Scan first 3 rows to find actual header row
  let headerRowIdx = 0;
  for (let r = 0; r < Math.min(3, rows.length); r++) {
    const rowStr = rows[r].join(' ').toLowerCase();
    if (rowStr.includes('name') || rowStr.includes('nama') || rowStr.includes('divisi') || rowStr.includes('id')) {
      headerRowIdx = r;
      break;
    }
  }

  const headerRow = rows[headerRowIdx].map((h) => (h || '').trim());
  let nameCol = headerRow.findIndex((h) => {
    const l = h.toLowerCase().trim();
    return l === 'name' || l === 'nama' || l === 'divisi' || l === 'division';
  });
  if (nameCol === -1) {
    nameCol = headerRow.findIndex((h) => {
      const l = h.toLowerCase().trim();
      return l.includes('name') || l.includes('nama') || l.includes('divisi');
    });
  }
  if (nameCol === -1) nameCol = headerRow.length > 1 ? 1 : 0;

  let idCol = headerRow.findIndex((h) => {
    const l = h.toLowerCase().replace(/[\s_\-\.]/g, '');
    return l === 'id' || l === 'divisiid' || l === 'iddivisi';
  });

  const list: DivisionItem[] = [];
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    const name = row[nameCol]?.trim();
    if (!name || name === '-' || name.toLowerCase() === 'name' || name.toLowerCase() === 'nama') continue;
    const id = idCol !== -1 && row[idCol]?.trim() ? row[idCol].trim() : String(list.length + 1);
    list.push({ id, name: name.toUpperCase() });
  }

  return list.length > 0 ? list : FALLBACK_DIVISI.map((name, i) => ({ id: String(i + 1), name }));
}

/**
 * Fetch Divisions from Sheet "DIVISI" - reads 'name' column
 */
export async function getDivisions(): Promise<string[]> {
  const items = await getDivisionItems();
  const names = Array.from(new Set(items.map((i) => i.name)));
  return names.length > 0 ? names : FALLBACK_DIVISI;
}

/**
 * Fetch Unit items ({ id, name }) from Sheet "ULP"
 */
export async function getUnitItems(): Promise<UnitItem[]> {
  const rows = await fetchSheetValues('ULP');
  if (!rows || rows.length === 0) {
    return FALLBACK_ULP.map((name, i) => ({ id: String(i + 1), name }));
  }

  let headerRowIdx = 0;
  for (let r = 0; r < Math.min(3, rows.length); r++) {
    const rowStr = rows[r].join(' ').toLowerCase();
    if (rowStr.includes('name') || rowStr.includes('nama') || rowStr.includes('ulp') || rowStr.includes('unit') || rowStr.includes('id')) {
      headerRowIdx = r;
      break;
    }
  }

  const headerRow = rows[headerRowIdx].map((h) => (h || '').trim());
  let nameCol = headerRow.findIndex((h) => {
    const l = h.toLowerCase().trim();
    return l === 'name' || l === 'nama' || l === 'ulp' || l === 'unit';
  });
  if (nameCol === -1) {
    nameCol = headerRow.findIndex((h) => {
      const l = h.toLowerCase().trim();
      return l.includes('name') || l.includes('nama') || l.includes('ulp') || l.includes('unit');
    });
  }
  if (nameCol === -1) nameCol = headerRow.length > 1 ? 1 : 0;

  let idCol = headerRow.findIndex((h) => {
    const l = h.toLowerCase().replace(/[\s_\-\.]/g, '');
    return l === 'id' || l === 'ulpid' || l === 'idulp' || l === 'unitid' || l === 'idunit';
  });

  const list: UnitItem[] = [];
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    const name = row[nameCol]?.trim();
    if (!name || name === '-' || name.toLowerCase() === 'name' || name.toLowerCase() === 'nama') continue;
    const id = idCol !== -1 && row[idCol]?.trim() ? row[idCol].trim() : String(list.length + 1);
    list.push({ id, name: name.toUpperCase() });
  }

  return list.length > 0 ? list : FALLBACK_ULP.map((name, i) => ({ id: String(i + 1), name }));
}

/**
 * Fetch Units from Sheet "ULP" - reads 'name' column
 */
export async function getUnits(): Promise<string[]> {
  const items = await getUnitItems();
  const names = Array.from(new Set(items.map((i) => i.name)));
  return names.length > 0 ? names : FALLBACK_ULP;
}

/**
 * Fetch Companions from Sheet "PENDAMPING" - reads 'name', 'ulpId', and 'divisiId' columns
 */
export async function getCompanions(): Promise<CompanionItem[]> {
  const rows = await fetchSheetValues('PENDAMPING');
  if (!rows || rows.length === 0) {
    return FALLBACK_PENDAMPING;
  }

  // Scan first 3 rows to find actual header row
  let headerRowIdx = 0;
  for (let r = 0; r < Math.min(3, rows.length); r++) {
    const rowStr = rows[r].join(' ').toLowerCase();
    if (
      rowStr.includes('name') ||
      rowStr.includes('nama') ||
      rowStr.includes('pendamping') ||
      rowStr.includes('ulpid') ||
      rowStr.includes('ulp_id') ||
      rowStr.includes('divisiid') ||
      rowStr.includes('divisi_id') ||
      rowStr.includes('unit') ||
      rowStr.includes('divisi')
    ) {
      headerRowIdx = r;
      break;
    }
  }

  const headerRow = rows[headerRowIdx].map((h) => (h || '').trim());

  // 1. Find 'name' column
  let nameCol = headerRow.findIndex((h) => {
    const l = h.toLowerCase().trim();
    return l === 'name' || l === 'nama' || l === 'nama pendamping' || l === 'pendamping' || l === 'nama_pendamping';
  });
  if (nameCol === -1) {
    nameCol = headerRow.findIndex((h) => {
      const l = h.toLowerCase().trim();
      return l.includes('name') || l.includes('nama') || l.includes('pendamping') || l.includes('pegawai');
    });
  }
  if (nameCol === -1) nameCol = headerRow.length > 1 ? 1 : 0;

  // 2. Find 'ulpId' column
  let ulpIdCol = headerRow.findIndex((h) => {
    const l = h.toLowerCase().replace(/[\s_\-\.]/g, '');
    return l === 'ulpid' || l === 'idulp' || l === 'unitid' || l === 'idunit';
  });
  if (ulpIdCol === -1) {
    ulpIdCol = headerRow.findIndex((h) => {
      const l = h.toLowerCase().trim();
      return l === 'ulp' || l === 'unit' || l.includes('ulp') || l.includes('unit');
    });
  }

  // 3. Find 'divisiId' column
  let divisiIdCol = headerRow.findIndex((h) => {
    const l = h.toLowerCase().replace(/[\s_\-\.]/g, '');
    return l === 'divisiid' || l === 'iddivisi' || l === 'divisionid' || l === 'iddivision' || l === 'divid' || l === 'iddiv';
  });
  if (divisiIdCol === -1) {
    divisiIdCol = headerRow.findIndex((h) => {
      const l = h.toLowerCase().trim();
      return l === 'divisi' || l === 'division' || l.includes('divisi') || l.includes('division');
    });
  }

  // 4. Find optional 'id' column
  let idCol = headerRow.findIndex((h) => {
    const l = h.toLowerCase().trim();
    return l === 'id' || l === 'no' || l === 'id_pendamping' || l === 'pendampingid';
  });

  const companions: CompanionItem[] = [];

  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const name = row[nameCol]?.trim();
    if (!name || name === '-' || name.toLowerCase() === 'name' || name.toLowerCase() === 'nama') continue;

    const ulpVal = ulpIdCol !== -1 && row[ulpIdCol] ? row[ulpIdCol].trim() : '';
    const divisiVal = divisiIdCol !== -1 && row[divisiIdCol] ? row[divisiIdCol].trim() : '';
    const idVal = idCol !== -1 && row[idCol] ? row[idCol].trim() : String(i);

    companions.push({
      id: idVal,
      name,
      division: divisiVal.toUpperCase(),
      unit: ulpVal.toUpperCase(),
      ulpId: ulpVal,
      divisiId: divisiVal,
    });
  }

  console.log(`[GoogleSheets] Loaded ${companions.length} companions with ulpId & divisiId:`, companions);
  return companions.length > 0 ? companions : FALLBACK_PENDAMPING;
}

/**
 * Fetch Officers from Sheet "YANTEK" - reads 'name' column and 'ulp/unit'
 */
export async function getOfficers(): Promise<OfficerItem[]> {
  const rows = await fetchSheetValues('YANTEK', [
    'PETUGAS_YANTEK',
    'PETUGAS YANTEK',
    'PETUGAS',
    'YANTEK_PETUGAS',
    'DATA_YANTEK',
    'DATA YANTEK',
    'Yantek',
    'Petugas',
  ]);

  // Also load unit items to map ulpId <-> unit name
  let unitItems: UnitItem[] = [];
  try {
    unitItems = await getUnitItems();
  } catch {
    // ignore
  }

  const unitById = new Map<string, string>();
  const unitByName = new Map<string, string>();
  for (const u of unitItems) {
    unitById.set(u.id.toUpperCase(), u.name.toUpperCase());
    unitByName.set(u.name.toUpperCase(), u.name.toUpperCase());
    const clean = u.name.replace(/^(ULP|UL)\s+/i, '').trim().toUpperCase();
    if (clean) unitByName.set(clean, u.name.toUpperCase());
  }

  if (!rows || rows.length === 0) {
    return FALLBACK_YANTEK_PETUGAS;
  }

  // Scan first 5 rows to detect header row
  let headerRowIdx = -1;
  for (let r = 0; r < Math.min(rows.length, 5); r++) {
    const rJoined = rows[r].map((c) => (c || '').toLowerCase()).join(' ');
    if (
      rJoined.includes('name') ||
      rJoined.includes('nama') ||
      rJoined.includes('petugas') ||
      rJoined.includes('personil') ||
      rJoined.includes('ulp') ||
      rJoined.includes('unit')
    ) {
      headerRowIdx = r;
      break;
    }
  }

  const headerRow = headerRowIdx !== -1 ? rows[headerRowIdx].map((h) => (h || '').trim()) : rows[0].map((h) => (h || '').trim());
  const startRow = headerRowIdx !== -1 ? headerRowIdx + 1 : 0;

  // USER REQUIREMENT: Column "name" on Sheet "YANTEK"
  let nameCol = headerRow.findIndex((h) => {
    const l = h.toLowerCase().replace(/[\s_\-\.]/g, '');
    return l === 'name' || l === 'nama';
  });

  if (nameCol === -1) {
    nameCol = headerRow.findIndex((h) => {
      const lower = h.toLowerCase().replace(/[\s_\-\.]/g, '');
      return (
        lower === 'namapetugas' ||
        lower === 'petugas' ||
        lower === 'namapersonil' ||
        lower === 'personil' ||
        lower === 'namapegawai' ||
        lower === 'pegawai' ||
        lower === 'petugas1' ||
        lower === 'petugas2'
      );
    });
  }

  if (nameCol === -1) {
    nameCol = headerRow.findIndex((h) => {
      const lower = h.toLowerCase();
      if (lower.includes('id') || lower.includes('ulp') || lower.includes('unit') || lower.includes('divisi')) {
        return false;
      }
      return lower.includes('name') || lower.includes('nama') || lower.includes('petugas');
    });
  }

  if (nameCol === -1) nameCol = headerRow.length > 1 ? 1 : 0;

  let unitCol = headerRow.findIndex((h) => {
    const lower = h.toLowerCase().replace(/[\s_\-\.]/g, '');
    return (
      lower === 'ulpid' ||
      lower === 'idulp' ||
      lower === 'unitid' ||
      lower === 'idunit' ||
      lower === 'ulp' ||
      lower === 'unit' ||
      lower === 'namaulp' ||
      lower === 'namaunit'
    );
  });
  if (unitCol === -1) {
    unitCol = headerRow.findIndex((h) => {
      const lower = h.toLowerCase();
      return lower.includes('ulp') || lower.includes('unit');
    });
  }

  let idCol = headerRow.findIndex((h) => {
    const lower = h.toLowerCase().replace(/[\s_\-\.]/g, '');
    return lower === 'id' || lower === 'no' || lower === 'nomor' || lower === 'idpetugas' || lower === 'petugasid';
  });

  let roleCol = headerRow.findIndex((h) => {
    const lower = h.toLowerCase().replace(/[\s_\-\.]/g, '');
    return lower === 'role' || lower === 'jabatan' || lower === 'posisi';
  });

  const officers: OfficerItem[] = [];
  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const rawName = row[nameCol]?.trim();
    if (!rawName || rawName === '-' || rawName.toLowerCase() === 'name' || rawName.toLowerCase() === 'nama') continue;

    const rawUnit = unitCol !== -1 && row[unitCol] ? row[unitCol].trim() : '';
    let resolvedUnit = rawUnit.toUpperCase();
    let ulpId = rawUnit;

    if (rawUnit) {
      const upperUnit = rawUnit.toUpperCase();
      if (unitById.has(upperUnit)) {
        resolvedUnit = unitById.get(upperUnit)!;
        ulpId = rawUnit;
      } else if (unitByName.has(upperUnit)) {
        resolvedUnit = unitByName.get(upperUnit)!;
      }
    }

    const id = idCol !== -1 && row[idCol] ? row[idCol].trim() : String(officers.length + 1);
    const role = roleCol !== -1 && row[roleCol] ? row[roleCol].trim() : undefined;

    officers.push({
      id,
      name: rawName,
      unit: resolvedUnit,
      ulpId,
      role,
    });
  }

  console.log(`[GoogleSheets] Loaded ${officers.length} officers from Sheet YANTEK:`, officers);
  return officers.length > 0 ? officers : FALLBACK_YANTEK_PETUGAS;
}

/**
 * Fetch Question Groups from Sheet "KELOMPOK_PERTANYAAN"
 */
export async function getQuestionGroups(): Promise<QuestionGroupItem[]> {
  const rows = await fetchSheetValues('KELOMPOK_PERTANYAAN', [
    'KELOMPOK PERTANYAAN',
    'KELOMPOK',
    'KELOMPOK_PERTANYAAN_YANTEK',
  ]);
  if (!rows || rows.length === 0) {
    return FALLBACK_KELOMPOK_PERTANYAAN;
  }

  // Header detection
  let headerRowIdx = -1;
  for (let r = 0; r < Math.min(rows.length, 4); r++) {
    const rJoined = rows[r].map((c) => (c || '').toLowerCase()).join(' ');
    if (
      rJoined.includes('name') ||
      rJoined.includes('nama') ||
      rJoined.includes('kelompok') ||
      rJoined.includes('id') ||
      rJoined.includes('no')
    ) {
      headerRowIdx = r;
      break;
    }
  }

  const headerRow = headerRowIdx !== -1 ? rows[headerRowIdx].map((h) => (h || '').trim()) : [];

  // USER SPECIFICATION: Prioritize column "name" on Sheet "KELOMPOK_PERTANYAAN"
  let nameCol = headerRow.findIndex((h) => {
    const l = h.toLowerCase().replace(/[\s_\-\.]/g, '');
    return l === 'name' || l === 'nama';
  });

  if (nameCol === -1) {
    nameCol = headerRow.findIndex((h) => {
      const l = h.toLowerCase().replace(/[\s_\-\.]/g, '');
      return (
        l === 'namakelompok' ||
        l === 'kelompok' ||
        l === 'namakelompokpertanyaan' ||
        l === 'kelompokpertanyaan' ||
        l === 'uraian'
      );
    });
  }

  if (nameCol === -1) {
    nameCol = headerRow.findIndex((h) => {
      const l = h.toLowerCase();
      return l.includes('kelompok') || l.includes('nama') || l.includes('name');
    });
  }
  if (nameCol === -1) nameCol = headerRow.length > 1 ? 1 : 0;

  // Find id column
  let idCol = headerRow.findIndex((h) => {
    const l = h.toLowerCase().replace(/[\s_\-\.]/g, '');
    return (
      l === 'id' ||
      l === 'idkelompok' ||
      l === 'kelompokid' ||
      l === 'idkelompokpertanyaan' ||
      l === 'kelompokpertanyaanid' ||
      l === 'no' ||
      l === 'nomor'
    );
  });

  // Find divisiId column
  let divisiIdCol = headerRow.findIndex((h) => {
    const l = h.toLowerCase().replace(/[\s_\-\.]/g, '');
    return l === 'divisiid' || l === 'iddivisi' || l === 'divisi' || l === 'division';
  });

  const groups: QuestionGroupItem[] = [];
  const startRow = headerRowIdx !== -1 ? headerRowIdx + 1 : 0;

  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const name = row[nameCol]?.trim();
    if (
      !name ||
      name === '-' ||
      name.toLowerCase() === 'nama' ||
      name.toLowerCase() === 'kelompok' ||
      name.toLowerCase() === 'name' ||
      name.toLowerCase() === 'id' ||
      name.toLowerCase() === 'no'
    ) {
      continue;
    }

    const idVal = idCol !== -1 && row[idCol] ? row[idCol].trim() : String(groups.length + 1);
    const divVal = divisiIdCol !== -1 && row[divisiIdCol] ? row[divisiIdCol].trim().toUpperCase() : undefined;

    groups.push({
      id: idVal,
      name,
      divisiId: divVal,
    });
  }

  console.log(`[GoogleSheets] Loaded ${groups.length} question groups from Sheet:`, groups);
  return groups.length > 0 ? groups : FALLBACK_KELOMPOK_PERTANYAAN;
}

/**
 * Fetch Sub Questions from Sheet "SUB_PERTANYAAN_YANTEK"
 */
export async function getSubQuestions(division?: string): Promise<SubQuestionItem[]> {
  const isManbill = division?.toUpperCase() === 'MANBILL';
  const sheetNames = isManbill
    ? [
        'SUB_PERTANYAAN_MANBILL',
        'SUB PERTANYAAN MANBILL',
        'SUB_PERTANYAAN',
        'SUB PERTANYAAN',
        'SUB_PERTANYAAN_YANTEK',
        'SUB PERTANYAAN YANTEK',
      ]
    : [
        'SUB_PERTANYAAN_YANTEK',
        'SUB PERTANYAAN YANTEK',
        'SUB_PERTANYAAN',
        'SUB PERTANYAAN',
      ];

  const rows = await fetchSheetValues(sheetNames[0], sheetNames.slice(1));
  if (!rows || rows.length === 0) {
    return FALLBACK_SUB_PERTANYAAN_YANTEK;
  }

  // Header detection
  let headerRowIdx = -1;
  for (let r = 0; r < Math.min(rows.length, 4); r++) {
    const rJoined = rows[r].map((c) => (c || '').toLowerCase()).join(' ');
    if (
      rJoined.includes('name') ||
      rJoined.includes('nama') ||
      rJoined.includes('sub') ||
      rJoined.includes('pertanyaan') ||
      rJoined.includes('id')
    ) {
      headerRowIdx = r;
      break;
    }
  }

  const headerRow = headerRowIdx !== -1 ? rows[headerRowIdx].map((h) => (h || '').trim()) : [];

  // USER SPECIFICATION: Prioritize column "name" on Sheet "SUB_PERTANYAAN_YANTEK"
  let nameCol = headerRow.findIndex((h) => {
    const l = h.toLowerCase().replace(/[\s_\-\.]/g, '');
    return l === 'name' || l === 'nama';
  });

  if (nameCol === -1) {
    nameCol = headerRow.findIndex((h) => {
      const l = h.toLowerCase().replace(/[\s_\-\.]/g, '');
      return (
        l === 'subpertanyaan' ||
        l === 'namasubpertanyaan' ||
        l === 'namasub' ||
        l === 'subkelompok' ||
        l === 'sub' ||
        l === 'uraian'
      );
    });
  }

  if (nameCol === -1) {
    nameCol = headerRow.findIndex((h) => {
      const l = h.toLowerCase();
      return l.includes('sub') || l.includes('nama') || l.includes('name') || l.includes('pertanyaan');
    });
  }
  if (nameCol === -1) nameCol = headerRow.length > 1 ? 1 : 0;

  let idCol = headerRow.findIndex((h) => {
    const l = h.toLowerCase().replace(/[\s_\-\.]/g, '');
    return (
      l === 'id' ||
      l === 'idsub' ||
      l === 'subid' ||
      l === 'idsubpertanyaan' ||
      l === 'subpertanyaanid' ||
      l === 'idsubpertanyaanyantek' ||
      l === 'subpertanyaanyantekid' ||
      l === 'no'
    );
  });

  let kelompokIdCol = headerRow.findIndex((h) => {
    const l = h.toLowerCase().replace(/[\s_\-\.]/g, '');
    return (
      l === 'kelompokpertanyaanid' ||
      l === 'idkelompokpertanyaan' ||
      l === 'idkelompok' ||
      l === 'kelompokid' ||
      l === 'kelompok'
    );
  });

  let divisiIdCol = headerRow.findIndex((h) => {
    const l = h.toLowerCase().replace(/[\s_\-\.]/g, '');
    return l === 'divisiid' || l === 'iddivisi' || l === 'divisi' || l === 'division';
  });

  const subs: SubQuestionItem[] = [];
  const startRow = headerRowIdx !== -1 ? headerRowIdx + 1 : 0;

  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const name = row[nameCol]?.trim();
    if (
      !name ||
      name === '-' ||
      name.toLowerCase() === 'sub_pertanyaan' ||
      name.toLowerCase() === 'sub' ||
      name.toLowerCase() === 'nama' ||
      name.toLowerCase() === 'name' ||
      name.toLowerCase() === 'id'
    ) {
      continue;
    }

    const idVal = idCol !== -1 && row[idCol] ? row[idCol].trim() : String(subs.length + 1);
    const kelVal = kelompokIdCol !== -1 && row[kelompokIdCol] ? row[kelompokIdCol].trim() : undefined;
    const divVal = divisiIdCol !== -1 && row[divisiIdCol] ? row[divisiIdCol].trim().toUpperCase() : undefined;

    subs.push({
      id: idVal,
      name,
      kelompokId: kelVal,
      divisiId: divVal,
    });
  }

  console.log(`[GoogleSheets] Loaded ${subs.length} sub-questions from Sheet:`, subs);
  return subs.length > 0 ? subs : FALLBACK_SUB_PERTANYAAN_YANTEK;
}

/**
 * Fetch Questions from Sheet "PERTANYAAN YANTEK" (or selected Division),
 * resolved against "KELOMPOK_PERTANYAAN" and "SUB_PERTANYAAN_YANTEK".
 * Headers from spreadsheet are strictly filtered out.
 */
export async function getQuestions(division: string): Promise<QuestionItem[]> {
  const normDivision = (division || 'YANTEK').trim().toUpperCase();
  const isManbill = normDivision === 'MANBILL';

  // 1. Fetch Question Groups & Sub Questions concurrently
  const [groupItems, subItems] = await Promise.all([
    getQuestionGroups(),
    getSubQuestions(normDivision),
  ]);

  // Create lookup maps for fast resolution
  const groupById = new Map<string, QuestionGroupItem>();
  const groupByName = new Map<string, QuestionGroupItem>();
  for (const g of groupItems) {
    if (g.id) groupById.set(g.id.trim().toUpperCase(), g);
    groupByName.set(g.name.trim().toUpperCase(), g);
  }

  const subById = new Map<string, SubQuestionItem>();
  const subByName = new Map<string, SubQuestionItem>();
  for (const s of subItems) {
    if (s.id) subById.set(s.id.trim().toUpperCase(), s);
    subByName.set(s.name.trim().toUpperCase(), s);
  }

  // 2. Fetch Question rows from division sheet
  const primarySheet = isManbill ? 'PERTANYAAN_MANBILL' : 'PERTANYAAN_YANTEK';
  const altSheets = isManbill
    ? ['PERTANYAAN MANBILL', 'PERTANYAAN_YANTEK', 'PERTANYAAN YANTEK', 'PERTANYAAN']
    : ['PERTANYAAN YANTEK', 'PERTANYAAN_YANTEK', 'PERTANYAAN'];

  const rows = await fetchSheetValues(primarySheet, altSheets);
  if (!rows || rows.length === 0) {
    return isManbill ? FALLBACK_PERTANYAAN_MANBILL : FALLBACK_PERTANYAAN_YANTEK;
  }

  // 3. Detect Header Row in question sheet
  let headerRowIdx = -1;
  for (let r = 0; r < Math.min(rows.length, 5); r++) {
    const rJoined = rows[r].map((c) => (c || '').toLowerCase()).join(' ');
    if (
      rJoined.includes('name') ||
      rJoined.includes('pertanyaan') ||
      rJoined.includes('soal') ||
      rJoined.includes('uraian') ||
      rJoined.includes('deskripsi') ||
      rJoined.includes('kelompok') ||
      rJoined.includes('sub_pertanyaan') ||
      (rJoined.includes('id') && rJoined.includes('nama')) ||
      (rJoined.includes('no') && rows[r].length >= 2)
    ) {
      headerRowIdx = r;
      break;
    }
  }

  const headerRow = headerRowIdx !== -1 ? rows[headerRowIdx].map((h) => (h || '').trim()) : [];

  // Column detection:
  // USER SPECIFICATION: Prioritize column "name" on Sheet "PERTANYAAN_YANTEK"
  let textCol = headerRow.findIndex((h) => {
    const l = h.toLowerCase().replace(/[\s_\-\.]/g, '');
    return (
      l === 'name' ||
      l === 'nama' ||
      l === 'namepertanyaan' ||
      l === 'namapertanyaan' ||
      l === 'pertanyaanname' ||
      l === 'questionname' ||
      l === 'text'
    );
  });

  if (textCol === -1) {
    textCol = headerRow.findIndex((h) => {
      const l = h.toLowerCase().replace(/[\s_\-\.]/g, '');
      return (
        l === 'pertanyaan' ||
        l === 'pertanyaanyantek' ||
        l === 'pertanyaanmanbill' ||
        l === 'uraianpertanyaan' ||
        l === 'uraian' ||
        l === 'soal' ||
        l === 'deskripsi' ||
        l === 'pertanyaaninspeksi' ||
        l === 'pertanyaanpendampingan'
      );
    });
  }

  if (textCol === -1) {
    textCol = headerRow.findIndex((h) => {
      const l = h.toLowerCase();
      // Exclude ID / sub / kelompok columns from textCol match
      if (l.includes('id') || l.includes('sub') || l.includes('kelompok') || l.includes('divisi')) {
        return false;
      }
      return l.includes('name') || l.includes('nama') || l.includes('pertanyaan') || l.includes('uraian') || l.includes('soal');
    });
  }

  if (textCol === -1) {
    textCol = rows.some((r) => r.length > 1 && !isNaN(Number(r[0]))) ? 1 : 0;
  }

  // ID column
  let idCol = headerRow.findIndex((h) => {
    const l = h.toLowerCase().replace(/[\s_\-\.]/g, '');
    return (
      l === 'id' ||
      l === 'idpertanyaan' ||
      l === 'pertanyaanid' ||
      l === 'no' ||
      l === 'nomor' ||
      l === 'nourut'
    );
  });

  // Kelompok column (e.g. kelompok_pertanyaan_id, kelompok_id, kelompokId, id_kelompok)
  let kelompokCol = headerRow.findIndex((h) => {
    const l = h.toLowerCase().replace(/[\s_\-\.]/g, '');
    return (
      l === 'kelompokpertanyaanid' ||
      l === 'idkelompokpertanyaan' ||
      l === 'kelompokid' ||
      l === 'idkelompok' ||
      l === 'kelompok' ||
      l === 'kategori' ||
      l === 'group'
    );
  });
  if (kelompokCol === -1) {
    kelompokCol = headerRow.findIndex((h) => {
      const l = h.toLowerCase();
      return l.includes('kelompok') || l.includes('kategori');
    });
  }

  // Sub-Kelompok column (e.g. sub_pertanyaan_yantek_id, sub_pertanyaan_id, subKelompokId, id_sub_pertanyaan)
  let subCol = headerRow.findIndex((h) => {
    const l = h.toLowerCase().replace(/[\s_\-\.]/g, '');
    return (
      l === 'subpertanyaanyantekid' ||
      l === 'subpertanyaanmanbillid' ||
      l === 'idsubpertanyaanyantek' ||
      l === 'idsubpertanyaanmanbill' ||
      l === 'subpertanyaanid' ||
      l === 'idsubpertanyaan' ||
      l === 'subkelompokid' ||
      l === 'idsubkelompok' ||
      l === 'subid' ||
      l === 'idsub' ||
      l === 'subpertanyaan' ||
      l === 'subkelompok' ||
      l === 'sub'
    );
  });
  if (subCol === -1) {
    subCol = headerRow.findIndex((h) => {
      const l = h.toLowerCase();
      return l.includes('sub_pertanyaan') || l.includes('sub pert') || l.includes('subkelompok') || l.includes('sub kelompok');
    });
  }

  // Divisi column
  let divisiIdCol = headerRow.findIndex((h) => {
    const l = h.toLowerCase().replace(/[\s_\-\.]/g, '');
    return l === 'divisiid' || l === 'iddivisi' || l === 'divisionid' || l === 'divisi' || l === 'division';
  });

  // Header exclusion phrases - STRICT: Prevents spreadsheet headers from being treated as questions
  const headerBlacklist = new Set([
    'pertanyaan',
    'pertanyaan yantek',
    'pertanyaan_yantek',
    'pertanyaan manbill',
    'pertanyaan_manbill',
    'uraian',
    'uraian pertanyaan',
    'daftar pertanyaan',
    'daftar pertanyaan yantek',
    'daftar pertanyaan manbill',
    'soal',
    'no',
    'nomor',
    'id',
    'name',
    'nama',
    'kelompok',
    'kelompok pertanyaan',
    'sub kelompok',
    'sub_kelompok',
    'sub pertanyaan',
    'sub_pertanyaan',
    'kategori',
    'divisi',
    'divisiid',
    'header',
    'judul',
    'keterangan',
    'action',
    'jawaban',
    'status',
  ]);

  const questions: QuestionItem[] = [];
  const startRow = headerRowIdx !== -1 ? headerRowIdx + 1 : 0;
  let counter = 1;

  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const rawText = row[textCol]?.trim();
    if (!rawText || rawText === '-' || rawText.toLowerCase() === 'null') continue;

    const normText = rawText.toLowerCase().replace(/[\s_\-\.\:]+/g, ' ').trim();
    if (headerBlacklist.has(normText)) continue;
    if (/^(pertanyaan|uraian|soal|daftar)\s*(yantek|manbill)?$/i.test(rawText.trim())) continue;

    // Check Divisi filter if divisiId column exists and is populated
    const rowDiv = divisiIdCol !== -1 && row[divisiIdCol] ? row[divisiIdCol].trim().toUpperCase() : '';
    if (rowDiv && rowDiv !== 'ALL' && rowDiv !== '*' && rowDiv !== '-') {
      if (!rowDiv.includes(normDivision) && !normDivision.includes(rowDiv)) {
        continue;
      }
    }

    // Resolve Kelompok & Sub Kelompok
    const rawKelompokVal = kelompokCol !== -1 && row[kelompokCol] ? row[kelompokCol].trim() : '';
    const rawSubVal = subCol !== -1 && row[subCol] ? row[subCol].trim() : '';

    let resolvedKelompokName = '';
    let resolvedSubName = '';

    // Match sub-kelompok
    if (
      rawSubVal &&
      rawSubVal !== '-' &&
      rawSubVal.toLowerCase() !== 'null' &&
      rawSubVal.toLowerCase() !== 'undefined' &&
      rawSubVal.toLowerCase() !== 'none'
    ) {
      const subNorm = rawSubVal.toUpperCase();
      const matchedSub = subById.get(subNorm) || subByName.get(subNorm);
      if (matchedSub) {
        resolvedSubName = matchedSub.name;
        if (!rawKelompokVal && matchedSub.kelompokId) {
          const matchedGroupFromSub =
            groupById.get(matchedSub.kelompokId.toUpperCase()) ||
            groupByName.get(matchedSub.kelompokId.toUpperCase());
          if (matchedGroupFromSub) {
            resolvedKelompokName = matchedGroupFromSub.name;
          }
        }
      } else {
        resolvedSubName = rawSubVal;
      }
    }

    // Match kelompok
    if (
      rawKelompokVal &&
      rawKelompokVal !== '-' &&
      rawKelompokVal.toLowerCase() !== 'null' &&
      rawKelompokVal.toLowerCase() !== 'undefined'
    ) {
      const kelNorm = rawKelompokVal.toUpperCase();
      const matchedGroup = groupById.get(kelNorm) || groupByName.get(kelNorm);
      if (matchedGroup) {
        resolvedKelompokName = matchedGroup.name;
      } else {
        resolvedKelompokName = rawKelompokVal;
      }
    }

    const category = resolvedKelompokName || resolvedSubName || (isManbill ? 'Manbill' : 'Yantek');
    const idVal = idCol !== -1 && row[idCol] && !isNaN(Number(row[idCol])) ? Number(row[idCol]) : counter++;

    questions.push({
      id: idVal,
      text: rawText,
      kelompokId: rawKelompokVal || undefined,
      kelompokName: resolvedKelompokName || undefined,
      subKelompokId: rawSubVal || undefined,
      subKelompokName: resolvedSubName || undefined,
      divisiId: rowDiv || normDivision,
      category,
      required: true,
    });
  }

  console.log(`[GoogleSheets] Loaded ${questions.length} clean questions for division "${division}":`, questions);
  return questions.length > 0 ? questions : (isManbill ? FALLBACK_PERTANYAAN_MANBILL : FALLBACK_PERTANYAAN_YANTEK);
}

/**
 * Generates a guaranteed unique ID for inspection reports (e.g. "YNT-20260830-160512-A8K2").
 * Checks against existing IDs in the spreadsheet to strictly prevent duplicates.
 */
export function generateUniqueReportId(division: string, existingIds?: Set<string>): string {
  const isManbill = division?.toUpperCase() === 'MANBILL';
  const prefix = isManbill ? 'MBL' : 'YNT';
  const now = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const datePart = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const timePart = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

  let uniqueId = '';
  let attempts = 0;
  do {
    const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    uniqueId = `${prefix}-${datePart}-${timePart}-${randPart}`;
    attempts++;
  } while (existingIds && existingIds.has(uniqueId.toUpperCase()) && attempts < 100);

  return uniqueId;
}

/**
 * Intelligently maps the form data to an array of cell values strictly matching the existing headers of the sheet.
 * Guarantees that ALL questions (P1..Pn) and their exact inputs ('YA' / 'TIDAK') are mapped correctly,
 * uniquely assigns ID Laporan, and prevents false positive matches on question text.
 */
export function mapFormDataToHeaders(
  headers: string[],
  formData: InspectionFormData,
  questions: QuestionItem[],
  userEmail?: string | null,
  assignedReportId?: string
): string[] {
  const reportId = assignedReportId || formData.reportId || generateUniqueReportId(formData.division);
  // Format dates & times
  const now = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const dateStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
  const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const timestampStr = `${dateStr} ${timeStr}`;

  // Photo drive links
  const photoLinks = formData.evidenPhotos
    .map((p) => p.driveViewLink || '')
    .filter(Boolean);
  const photoLinksCombined = photoLinks.length > 0
    ? photoLinks.join('\n')
    : formData.evidenPhotos.length > 0
      ? `[${formData.evidenPhotos.length} Foto Eviden]`
      : '-';

  // Extract GPS coordinates
  const firstPhotoWithGps = formData.evidenPhotos.find((p) => p.latitude && p.longitude);
  const gpsCoord = firstPhotoWithGps
    ? `${firstPhotoWithGps.latitude?.toFixed(6)}, ${firstPhotoWithGps.longitude?.toFixed(6)}`
    : formData.evidenPhotos[0]?.locationString || '-';

  // Notes summary
  const allNotes = Object.entries(formData.notes)
    .filter(([_, note]) => Boolean(note && note.trim()))
    .map(([qId, note]) => {
      const qIdx = questions.findIndex((q) => q.id === Number(qId));
      const pLabel = qIdx !== -1 ? `P${qIdx + 1}` : `P${qId}`;
      return `${pLabel}: ${note.trim()}`;
    })
    .join(' | ');

  // All answers summary string
  const allAnswersSummary = questions
    .map((q, idx) => `P${idx + 1}: ${formData.answers[q.id] || '-'}`)
    .join(' | ');

  console.log(`[GoogleSheets] Mapping form values to ${headers.length} headers for ${questions.length} questions...`);

  // Build lookup maps for fast, robust resolution
  const questionMapById = new Map<number, QuestionItem>();
  const questionMapByIndex = new Map<number, QuestionItem>(); // 1-based index
  questions.forEach((q, idx) => {
    questionMapById.set(q.id, q);
    questionMapByIndex.set(idx + 1, q);
  });

  // Standard prefix columns count: [0: Timestamp, 1: Divisi, 2: Unit Asal, 3: Unit Didampingi, 4: Pendamping, 5: Petugas 1, 6: Petugas 2]
  const prefixCount = 7;

  return headers.map((rawHeader, index) => {
    if (!rawHeader) return '';
    const raw = rawHeader.trim();
    const h = raw.toLowerCase();
    const cleanH = h.replace(/[^a-z0-9]/g, '');

    // -------------------------------------------------------------
    // STEP 1: Check if this header is a SPECIFIC QUESTION or NOTE
    // -------------------------------------------------------------

    // 1A. Specific Question Note: e.g. "Catatan 1", "Catatan P1", "Keterangan P1", "Temuan 1"
    const isSpecificNote =
      (h.startsWith('catatan p') ||
        h.startsWith('catatan so') ||
        h.startsWith('catatan per') ||
        h.startsWith('keterangan p') ||
        h.startsWith('note p') ||
        h.startsWith('temuan p')) &&
      /[0-9]+/.test(h);

    if (isSpecificNote) {
      const numMatch = h.match(/[0-9]+/);
      if (numMatch) {
        const qNum = parseInt(numMatch[0], 10);
        const targetQ = questionMapById.get(qNum) || questionMapByIndex.get(qNum);
        if (targetQ && formData.notes[targetQ.id]) return formData.notes[targetQ.id];
        if (formData.notes[qNum]) return formData.notes[qNum];
        return '';
      }
    }

    // 1B. Question with numbered prefix: "P1", "P1: ...", "P.1", "Pertanyaan 1", "Soal 1", "1. APD...", "2", "3" (Excluding short 1-letter labels like "id")
    const qNumMatch =
      (h !== 'id' && h !== 'no' && h !== 'p' && h !== 'q') ? (
        h.match(/^(?:pertanyaan|soal|item|p|q|no)[\s_\-\.\:]*0*([0-9]+)/i) ||
        h.match(/^0*([0-9]+)[\s_\-\.\:\)\/]/) ||
        h.match(/^0*([0-9]+)$/)
      ) : null;

    if (qNumMatch && qNumMatch[1]) {
      const qNum = parseInt(qNumMatch[1], 10);
      const targetQ = questionMapById.get(qNum) || questionMapByIndex.get(qNum);
      if (targetQ && formData.answers[targetQ.id] !== undefined) {
        return formData.answers[targetQ.id];
      }
      if (formData.answers[qNum] !== undefined) {
        return formData.answers[qNum];
      }
      return 'YA';
    }

    // 1C. Check Question Text Similarity / Matching against list of questions
    for (let idx = 0; idx < questions.length; idx++) {
      const q = questions[idx];
      const normQText = q.text.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (normQText.length >= 8) {
        if (
          cleanH === normQText ||
          cleanH.includes(normQText) ||
          normQText.includes(cleanH) ||
          (cleanH.length >= 15 && normQText.includes(cleanH.substring(0, 25))) ||
          (cleanH.length >= 15 && cleanH.includes(normQText.substring(0, 25)))
        ) {
          return formData.answers[q.id] ?? formData.answers[idx + 1] ?? 'YA';
        }
      }
    }

    // 1D. Check Question Sentence Characteristics (Indonesian question starters or checklist items)
    const isQuestionSentence =
      h.startsWith('apakah ') ||
      h.startsWith('bagaimana ') ||
      h.startsWith('pastikan ') ||
      h.startsWith('petugas meminta ') ||
      h.startsWith('petugas menanyakan ') ||
      h.startsWith('petugas izin ') ||
      h.startsWith('petugas melakukan ') ||
      h.startsWith('petugas menjelaskan ') ||
      h.startsWith('petugas memeriksa ') ||
      h.startsWith('petugas membawa ') ||
      h.startsWith('petugas mengenakan ') ||
      h.startsWith('petugas menggunakan ') ||
      h.startsWith('berapa lama ') ||
      h.startsWith('kelengkapan ') ||
      h.startsWith('kondisi ') ||
      h.includes('kwh meter') ||
      h.includes('pln mobile') ||
      (raw.length > 30 &&
        (h.includes('petugas') ||
          h.includes('pelanggan') ||
          h.includes('gangguan') ||
          h.includes('laporan') ||
          h.includes('pengecekan') ||
          h.includes('pengaduan')));

    if (isQuestionSentence) {
      // Find question closest to this index or text
      const relativeQIdx = index >= prefixCount ? index - prefixCount : 0;
      const targetQ = questions[relativeQIdx] || questions[0];
      if (targetQ && formData.answers[targetQ.id] !== undefined) {
        return formData.answers[targetQ.id];
      }
      return 'YA';
    }

    // 1E. Positional Question column (between prefix columns and trailing metadata)
    const trailingMetadataNames = ['catatan', 'temuan', 'koordinat', 'gps', 'foto', 'eviden', 'drive', 'link', 'status'];
    const isTrailingCol = trailingMetadataNames.some((tm) => h.includes(tm));

    if (index >= prefixCount && index < prefixCount + questions.length && !isTrailingCol) {
      const qIndex = index - prefixCount;
      const targetQ = questions[qIndex];
      if (targetQ && formData.answers[targetQ.id] !== undefined) {
        return formData.answers[targetQ.id];
      }
      return 'YA';
    }

    // -------------------------------------------------------------
    // STEP 2: Strict Metadata Headers Matching
    // -------------------------------------------------------------

    // 2A. ID Laporan / Unique ID (STRICT match)
    if (
      h === 'id' ||
      h === 'id laporan' ||
      h === 'id_laporan' ||
      h === 'kode id' ||
      h === 'kode laporan' ||
      h === 'id inspeksi' ||
      h === 'nomor id' ||
      h === 'no id' ||
      h === 'no. id' ||
      h === 'no registrasi' ||
      h === 'kode unik' ||
      h === 'id tiket'
    ) {
      return reportId;
    }

    // 2B. Timestamp / Waktu / Tanggal
    if (
      h === 'timestamp' ||
      h === 'waktu' ||
      h === 'tanggal & waktu' ||
      h === 'timestamp / waktu' ||
      h === 'waktu / tanggal' ||
      h === 'waktu input' ||
      h === 'waktu submit' ||
      h === 'tgl input' ||
      h === 'hari/tgl' ||
      h === 'hari / tanggal' ||
      h === 'waktu pelaksanaan' ||
      h === 'waktu inspeksi' ||
      h.startsWith('timestamp') ||
      h.startsWith('waktu input')
    ) {
      return timestampStr;
    }

    if (h === 'tanggal' || h === 'tgl' || h === 'date' || h === 'hari') {
      return dateStr;
    }

    if (h === 'jam' || h === 'pukul' || h === 'time') {
      return timeStr;
    }

    // 2B. Divisi (STRICT match - NO loose substring)
    if (
      h === 'divisi' ||
      h === 'nama divisi' ||
      h === 'bidang' ||
      h === 'nama bidang' ||
      h === 'fungsi divisi' ||
      h === 'division'
    ) {
      return formData.division || 'YANTEK';
    }

    // 2C. Unit / ULP Didampingi (Tujuan)
    if (
      h === 'unit yang didampingi' ||
      h === 'unit didampingi' ||
      h === 'unit damping' ||
      h === 'ulp didampingi' ||
      h === 'ulp tujuan' ||
      h === 'unit tujuan' ||
      h === 'lokasi damping' ||
      h === 'lokasi penugasan' ||
      h === 'ulp damping' ||
      h === 'unit/ulp yang didampingi' ||
      h === 'ulp/unit yang didampingi'
    ) {
      return formData.assistedUnit || formData.unit || '';
    }

    // 2D. Unit / ULP Asal
    if (
      h === 'unit asal' ||
      h === 'ulp asal' ||
      h === 'unit' ||
      h === 'ulp' ||
      h === 'unit kerja' ||
      h === 'asal unit' ||
      h === 'nama unit' ||
      h === 'nama ulp' ||
      h === 'unit pendamping'
    ) {
      return formData.unit || '';
    }

    // 2E. Nama Pendamping (STRICT match - NO loose substring)
    if (
      h === 'nama pendamping' ||
      h === 'pendamping' ||
      h === 'pengawas' ||
      h === 'nama pengawas' ||
      h === 'auditor' ||
      h === 'nama auditor' ||
      h === 'penilai' ||
      h === 'nama penilai' ||
      h === 'evaluator' ||
      h === 'nama evaluator'
    ) {
      return formData.companion || '';
    }

    // 2E_WO. No Work Order / Work Order Number
    if (
      h === 'no work order' ||
      h === 'no. work order' ||
      h === 'work order' ||
      h === 'no wo' ||
      h === 'no. wo' ||
      h === 'nomor work order' ||
      h === 'nomor wo'
    ) {
      return formData.workOrderNo || '';
    }

    // 2F. Petugas 1
    if (
      h === 'petugas 1' ||
      h === 'petugas yantek 1' ||
      h === 'petugas manbill 1' ||
      h === 'nama petugas 1' ||
      h === 'nama petugas yantek 1' ||
      h === 'petugas pertama' ||
      h === 'personil 1' ||
      h === 'anggota 1' ||
      h === 'petugas yantek (1)'
    ) {
      return formData.officer1 || '';
    }

    // 2G. Petugas 2
    if (
      h === 'petugas 2' ||
      h === 'petugas yantek 2' ||
      h === 'petugas manbill 2' ||
      h === 'nama petugas 2' ||
      h === 'nama petugas yantek 2' ||
      h === 'petugas kedua' ||
      h === 'personil 2' ||
      h === 'anggota 2' ||
      h === 'petugas yantek (2)'
    ) {
      return formData.officer2 || '-';
    }

    // 2H. Petugas Gabungan / Generic Petugas Single Column
    if (
      h === 'petugas' ||
      h === 'nama petugas' ||
      h === 'petugas yantek' ||
      h === 'petugas manbill' ||
      h === 'personil' ||
      h === 'nama personil' ||
      h === 'tim' ||
      h === 'regu' ||
      h === 'anggota regu' ||
      h === 'daftar petugas'
    ) {
      return formData.officer2 ? `${formData.officer1} & ${formData.officer2}` : formData.officer1;
    }

    // 2I. General Catatan / Temuan / Rekomendasi
    if (
      h === 'catatan / temuan' ||
      h === 'catatan temuan' ||
      h === 'catatan' ||
      h === 'keterangan' ||
      h === 'temuan' ||
      h === 'uraian temuan' ||
      h === 'catatan khusus' ||
      h === 'catatan umum' ||
      h === 'rekomendasi' ||
      h === 'hasil temuan'
    ) {
      return allNotes || '-';
    }

    // 2J. Ringkasan / Rekap Jawaban
    if (
      h === 'ringkasan' ||
      h === 'rekap' ||
      h === 'hasil checklist' ||
      h === 'evaluasi' ||
      h === 'ringkasan jawaban'
    ) {
      return allAnswersSummary;
    }

    // 2K. Foto Eviden & Google Drive Links
    if (h.includes('foto 1') || h.includes('eviden 1') || h.includes('link foto 1')) {
      return photoLinks[0] || '';
    }
    if (h.includes('foto 2') || h.includes('eviden 2') || h.includes('link foto 2')) {
      return photoLinks[1] || '';
    }
    if (h.includes('foto 3') || h.includes('eviden 3') || h.includes('link foto 3')) {
      return photoLinks[2] || '';
    }
    if (
      h.includes('foto') ||
      h.includes('eviden') ||
      h.includes('drive') ||
      h.includes('link') ||
      h.includes('dokumentasi') ||
      h.includes('lampiran') ||
      h.includes('gambar')
    ) {
      return photoLinksCombined;
    }

    // 2L. Titik Koordinat / GPS
    if (
      h.includes('koordinat') ||
      h.includes('gps') ||
      h.includes('lat') ||
      h === 'titik koordinat' ||
      h === 'titik lokasi' ||
      h === 'lokasi'
    ) {
      return gpsCoord;
    }

    // 2M. Email User / Akun
    if (h === 'email' || h === 'pengirim' || h === 'akun' || h === 'user' || h === 'email pengirim') {
      return userEmail || '';
    }

    // 2N. Status
    if (h === 'status' || h === 'kondisi' || h === 'status laporan') {
      return 'SELESAI';
    }

    return '';
  });
}

/**
 * Standard default headers when creating or updating LAPORAN sheet.
 * Includes complete individual columns for every question and unique ID column.
 */
export function getDefaultReportHeaders(division: string, questions: QuestionItem[]): string[] {
  const isManbill = division?.toUpperCase() === 'MANBILL';
  return [
    'ID Laporan',
    'Timestamp / Waktu',
    'Divisi',
    'Unit Asal',
    'Unit Yang Didampingi',
    'Nama Pendamping',
    'NO WORK ORDER',
    isManbill ? 'Petugas Manbill 1' : 'Petugas Yantek 1',
    isManbill ? 'Petugas Manbill 2' : 'Petugas Yantek 2',
    ...questions.map((q, idx) => `P${idx + 1}: ${q.text}`),
    'Catatan / Temuan',
    'Titik Koordinat (GPS)',
    'Link Foto Eviden (Google Drive)',
    'Status',
  ];
}

/**
 * Append Inspection Report to Sheet "LAPORAN_YANTEK" or "LAPORAN_MANBILL"
 * with dynamic header detection, automatic header synchronization, unique report ID generation,
 * and complete question input mapping without duplicates.
 */
export async function submitInspectionReport(
  formData: InspectionFormData,
  questions: QuestionItem[]
): Promise<{ success: boolean; message: string; sheetName: string; reportId?: string }> {
  const isManbill = formData.division?.toUpperCase() === 'MANBILL';
  const sheetName = isManbill ? 'LAPORAN_MANBILL' : 'LAPORAN_YANTEK';
  const defaultHeaders = getDefaultReportHeaders(formData.division, questions);

  // If GAS Web App URL is configured, use it for stable connection without manual OAuth
  if (GAS_WEB_APP_URL && GAS_WEB_APP_URL.startsWith('https://script.google.com')) {
    try {
      const response = await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'submitReport',
          formData,
          questions,
        }),
      });
      const result = await response.json();
      if (result.success) {
        return {
          success: true,
          message: result.message || 'Laporan berhasil disimpan via GAS ke Google Spreadsheet',
          sheetName: result.sheetName || sheetName,
          reportId: result.reportId,
        };
      } else {
        throw new Error(result.error || 'Gagal menyimpan via GAS');
      }
    } catch (gasErr: any) {
      console.warn('GAS submit failed, falling back to OAuth Sheets API:', gasErr);
    }
  }

  let auth = getAuthState();

  try {
    // 1. Check existing sheet and inspect its headers & existing rows for ID deduplication
    console.log(`[GoogleSheets] Fetching existing headers and records from sheet "${sheetName}"...`);
    const existingRows = await fetchSheetValues(sheetName);

    const existingIdSet = new Set<string>();
    let activeHeaders: string[] = defaultHeaders;
    const encodedSheet = encodeURIComponent(sheetName);

    if (existingRows && existingRows.length > 0 && existingRows[0].length > 0) {
      const existingHeaders = existingRows[0];
      console.log(`[GoogleSheets] Found ${existingHeaders.length} existing columns in "${sheetName}":`, existingHeaders);

      // Locate existing ID column index
      let idColIdx = existingHeaders.findIndex((h) => {
        const clean = (h || '').trim().toLowerCase();
        return (
          clean === 'id' ||
          clean === 'id laporan' ||
          clean === 'id_laporan' ||
          clean === 'kode id' ||
          clean === 'id inspeksi' ||
          clean === 'no id' ||
          clean === 'no. id' ||
          clean === 'no registrasi' ||
          clean === 'kode unik'
        );
      });

      // If no explicit ID header name found, check if first column contains ID pattern (e.g. YNT- or MBL-)
      if (idColIdx === -1 && existingRows.length > 1) {
        const firstRowFirstCell = String(existingRows[1][0] || '').trim();
        if (/^(?:YNT|MBL|ID)-/i.test(firstRowFirstCell)) {
          idColIdx = 0;
        }
      }

      // Collect all already existing IDs to prevent duplicates
      if (idColIdx !== -1) {
        for (let r = 1; r < existingRows.length; r++) {
          const val = existingRows[r][idColIdx];
          if (val) {
            existingIdSet.add(String(val).trim().toUpperCase());
          }
        }
      }

      // Check if existing sheet has question columns and ID column
      const hasIdInHeader = idColIdx !== -1;
      const hasQuestionsInHeader =
        existingHeaders.length >= defaultHeaders.length - 4 ||
        existingHeaders.some((h) => /^p[0-9]+/i.test(h.trim()) || /pertanyaan/i.test(h));

      if (!hasIdInHeader || !hasQuestionsInHeader) {
        // Update header row to ensure ID column and question columns are present in Google Sheets
        console.log(`[GoogleSheets] Sheet "${sheetName}" headers need synchronization. Updating Row 1 with full ID and question headers...`);
        try {
          await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodedSheet}!A1?valueInputOption=USER_ENTERED`,
            {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${auth.accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                range: `${sheetName}!A1`,
                majorDimension: 'ROWS',
                values: [defaultHeaders],
              }),
            }
          );
        } catch (hErr) {
          console.warn('[GoogleSheets] Header update non-fatal error:', hErr);
        }
        activeHeaders = defaultHeaders;
      } else {
        activeHeaders = existingHeaders;
      }
    } else {
      // Sheet does not exist or has no headers, ensure sheet exists with default headers
      console.log(`[GoogleSheets] Sheet "${sheetName}" is empty or new. Creating with default headers...`);
      await ensureSheetExistsWithHeaders(sheetName, defaultHeaders, auth.accessToken);
      activeHeaders = defaultHeaders;
    }

    // 2. Generate a guaranteed unique report ID that does not exist in the spreadsheet
    const uniqueReportId = generateUniqueReportId(formData.division, existingIdSet);
    formData.reportId = uniqueReportId;
    console.log(`[GoogleSheets] Generated Unique Report ID for ${sheetName}: "${uniqueReportId}" (Verified against ${existingIdSet.size} existing IDs)`);

    // 3. Map form data accurately to the active headers
    const rowValues = mapFormDataToHeaders(activeHeaders, formData, questions, auth.userEmail, uniqueReportId);
    console.log(`[GoogleSheets] Prepared ${rowValues.length} row values for "${sheetName}":`, rowValues);

    // 4. Append row to Google Sheet
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodedSheet}!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

    console.log(`[GoogleSheets] Appending row to Google Sheet "${sheetName}"...`);
    const res = await fetch(appendUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `${sheetName}!A1`,
        majorDimension: 'ROWS',
        values: [rowValues],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[GoogleSheets] Append to ${sheetName} failed (${res.status}):`, errText);

      if (res.status === 401) {
        localStorage.removeItem('g_access_token');
        sessionStorage.removeItem('g_access_token');
        console.warn('Google Access Token expired or invalid (401). Falling back to local storage backup.');
      }

      // Save local backup as well
      const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
      const localReports = JSON.parse(localStorage.getItem(`local_reports_${sheetName}`) || '[]');
      localReports.push({ id: uniqueReportId, timestamp, formData, rowValues, error: errText });
      localStorage.setItem(`local_reports_${sheetName}`, JSON.stringify(localReports));

      const is401 = res.status === 401;
      return {
        success: true, // Mark success so user completes their submission flow via local backup
        message: is401 
          ? `Sesi Google Anda kedaluwarsa (401). Laporan dengan ID ${uniqueReportId} berhasil disimpan ke cadangan lokal. Silakan klik "Hubungkan Google" di atas untuk menyinkronkan ulang.`
          : `Gagal mengirim data ke Sheet ${sheetName} (${res.status}): ${errText}. Laporan tersimpan di cadangan lokal.`,
        sheetName,
        reportId: uniqueReportId,
      };
    }

    const responseJson = await res.json();
    console.log('[GoogleSheets] Successfully appended row to Google Sheet:', responseJson);

    return {
      success: true,
      message: `Laporan berhasil tersimpan dengan ID: ${uniqueReportId} dan seluruh jawaban (P1..P${questions.length}) terinput ke Sheet "${sheetName}".`,
      sheetName,
      reportId: uniqueReportId,
    };
  } catch (err: any) {
    console.error(`[GoogleSheets] Exception submitting to sheet ${sheetName}:`, err);
    const fallbackId = formData.reportId || generateUniqueReportId(formData.division);
    return {
      success: false,
      message: `Kendala jaringan: ${err?.message || err}. Data telah dicadangkan di perangkat dengan ID ${fallbackId}.`,
      sheetName,
      reportId: fallbackId,
    };
  }
}

/**
 * Read and parse inspection reports from Spreadsheet sheet "LAPORAN_YANTEK"
 */
export async function getLaporanYantekFromSpreadsheet(): Promise<InspectionFormData[]> {
  // If GAS Web App URL is configured, try fetching via GAS
  if (GAS_WEB_APP_URL && GAS_WEB_APP_URL.startsWith('https://script.google.com')) {
    try {
      const response = await fetch(`${GAS_WEB_APP_URL}?action=getReports&sheetName=LAPORAN_YANTEK`);
      const result = await response.json();
      if (result && result.success && Array.isArray(result.reports)) {
        return result.reports;
      }
    } catch (e) {
      console.warn('GAS fetch LAPORAN_YANTEK failed, using sheet fetch fallback:', e);
    }
  }

  const rows = await fetchSheetValues('LAPORAN_YANTEK', ['LAPORAN YANTEK', 'LAPORAN_YANTEK_1DWP']);
  if (!rows || rows.length <= 1) {
    return [];
  }

  const headerRow = rows[0].map((h) => (h || '').toLowerCase().trim());

  const idCol = headerRow.findIndex((h) => h === 'id' || h === 'id laporan' || h.includes('kode id') || h === 'no id');
  const timestampCol = headerRow.findIndex(
    (h) =>
      h === 'timestamp' ||
      h === 'waktu' ||
      h === 'tanggal & waktu' ||
      h === 'timestamp / waktu' ||
      h === 'waktu / tanggal' ||
      h === 'waktu input' ||
      h === 'waktu submit' ||
      h.startsWith('timestamp') ||
      (h.includes('timestamp') && !h.includes('petugas'))
  );
  const divisionCol = headerRow.findIndex((h) => h === 'divisi');
  const unitCol = headerRow.findIndex((h) => h.includes('unit asal') || h === 'unit' || h === 'ulp');
  const assistedUnitCol = headerRow.findIndex((h) => h.includes('didampingi'));
  const companionCol = headerRow.findIndex((h) => h.includes('pendamping'));
  const workOrderNoCol = headerRow.findIndex((h) => h.includes('work order') || h === 'no wo' || h === 'wo');
  const officer1Col = headerRow.findIndex((h) => h.includes('petugas 1') || h.includes('petugas yantek 1') || h.includes('petugas manbill 1'));
  const officer2Col = headerRow.findIndex((h) => h.includes('petugas 2') || h.includes('petugas yantek 2') || h.includes('petugas manbill 2'));
  const notesCol = headerRow.findIndex((h) => h.includes('catatan') || h.includes('temuan'));
  const photoCol = headerRow.findIndex((h) => h.includes('foto') || h.includes('eviden') || h.includes('drive'));

  const reports: InspectionFormData[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0 || row.every((c) => !c || !c.trim())) continue;

    const reportId = idCol !== -1 && row[idCol]?.trim() ? row[idCol].trim() : `RPT-YNT-${r}`;
    const submittedAt = timestampCol !== -1 && row[timestampCol]?.trim() ? row[timestampCol].trim() : '';
    const division = divisionCol !== -1 && row[divisionCol]?.trim() ? row[divisionCol].trim() : 'YANTEK';
    const unit = unitCol !== -1 && row[unitCol]?.trim() ? row[unitCol].trim() : '';
    const assistedUnit = assistedUnitCol !== -1 && row[assistedUnitCol]?.trim() ? row[assistedUnitCol].trim() : '';
    const companion = companionCol !== -1 && row[companionCol]?.trim() ? row[companionCol].trim() : '';
    const workOrderNo = workOrderNoCol !== -1 && row[workOrderNoCol]?.trim() ? row[workOrderNoCol].trim() : '';
    const officer1 = officer1Col !== -1 && row[officer1Col]?.trim() ? row[officer1Col].trim() : '';
    const officer2 = officer2Col !== -1 && row[officer2Col]?.trim() ? row[officer2Col].trim() : '';
    const notesStr = notesCol !== -1 && row[notesCol]?.trim() ? row[notesCol].trim() : '';
    const photoUrl = photoCol !== -1 && row[photoCol]?.trim() ? row[photoCol].trim() : '';

    const isMetadataHeader = (h: string, colIdx: number): boolean => {
      // Column G (index 6) to Column AL (index 37) are strictly question columns
      if (colIdx >= 6 && colIdx <= 37) {
        return false;
      }
      if (
        colIdx === idCol ||
        colIdx === timestampCol ||
        colIdx === divisionCol ||
        colIdx === unitCol ||
        colIdx === assistedUnitCol ||
        colIdx === companionCol ||
        colIdx === workOrderNoCol ||
        colIdx === officer1Col ||
        colIdx === officer2Col ||
        colIdx === notesCol ||
        colIdx === photoCol
      ) {
        return true;
      }
      const clean = h.trim().toLowerCase();
      if (/^p\d+/i.test(clean) || clean.includes('pertanyaan')) {
        return false;
      }
      if (
        clean.includes('id') ||
        clean.includes('waktu') ||
        clean.includes('tanggal') ||
        clean.includes('timestamp') ||
        clean === 'divisi' ||
        clean.includes('unit') ||
        clean.includes('ulp') ||
        clean.includes('pendamping') ||
        clean.includes('work order') ||
        clean.includes('wo') ||
        clean.includes('petugas') ||
        clean.includes('catatan') ||
        clean.includes('temuan') ||
        clean.includes('foto') ||
        clean.includes('eviden') ||
        clean.includes('drive') ||
        clean.includes('koordinat') ||
        clean.includes('gps') ||
        clean.includes('status') ||
        clean.includes('email') ||
        clean === 'no' ||
        clean === 'no.' ||
        clean === 'nomor'
      ) {
        return true;
      }
      return false;
    };

    const answers: Record<number, string> = {};

    // 1. Explicitly process Column G (index 6) to Column AL (index 37)
    for (let colIdx = 6; colIdx <= 37; colIdx++) {
      if (colIdx < row.length) {
        const rawVal = (row[colIdx] || '').trim();
        const val = rawVal.toUpperCase();
        const qKey = colIdx - 5; // Question index 1..32

        if (
          val === 'TIDAK' ||
          val === 'T' ||
          val === 'N' ||
          val === 'NO' ||
          val === 'TS' ||
          val === '0' ||
          val === 'FALSE' ||
          val === 'RUSAK' ||
          val === 'TDK' ||
          val === 'TDAK' ||
          val.startsWith('TIDAK') ||
          val.startsWith('TDK') ||
          val.startsWith('TDAK') ||
          val.startsWith('TS')
        ) {
          answers[qKey] = rawVal;
        } else if (
          val === 'YA' ||
          val === 'Y' ||
          val === 'ADA' ||
          val === 'SESUAI' ||
          val === 'LENGKAP' ||
          val === 'BAIK' ||
          val === '1' ||
          val === 'TRUE' ||
          val === 'OK' ||
          val === 'YES' ||
          val === 'S' ||
          val.startsWith('YA') ||
          val.startsWith('SESUAI') ||
          val.startsWith('ADA') ||
          val.startsWith('LENGKAP')
        ) {
          answers[qKey] = rawVal;
        }
      }
    }

    // 2. Also check any other non-metadata columns for additional/flexible layout
    headerRow.forEach((h, colIdx) => {
      if ((colIdx < 6 || colIdx > 37) && !isMetadataHeader(h, colIdx)) {
        const rawVal = (row[colIdx] || '').trim();
        const val = rawVal.toUpperCase();
        const qNumMatch = h.match(/^p(\d+)/i) || h.match(/(\d+)/);
        const qKey = qNumMatch ? parseInt(qNumMatch[1], 10) : colIdx;

        if (
          val === 'TIDAK' ||
          val === 'T' ||
          val === 'N' ||
          val === 'NO' ||
          val === 'TS' ||
          val === '0' ||
          val === 'FALSE' ||
          val === 'RUSAK' ||
          val === 'TDK' ||
          val === 'TDAK' ||
          val.startsWith('TIDAK') ||
          val.startsWith('TDK') ||
          val.startsWith('TDAK') ||
          val.startsWith('TS')
        ) {
          answers[qKey] = rawVal;
        } else if (
          val === 'YA' ||
          val === 'Y' ||
          val === 'ADA' ||
          val === 'SESUAI' ||
          val === 'LENGKAP' ||
          val === 'BAIK' ||
          val === '1' ||
          val === 'TRUE' ||
          val === 'OK' ||
          val === 'YES' ||
          val === 'S' ||
          val.startsWith('YA') ||
          val.startsWith('SESUAI') ||
          val.startsWith('ADA') ||
          val.startsWith('LENGKAP')
        ) {
          answers[qKey] = rawVal;
        }
      }
    });

    const evidenPhotos: EvidenPhoto[] = photoUrl
      ? photoUrl
          .split(/[\n,;]+/)
          .map((u) => u.trim())
          .filter(Boolean)
          .map((rawUrl, i) => {
            const parsed = parseGoogleDrivePhoto(rawUrl);
            return {
              id: `photo-${i}`,
              dataUrl: parsed.displayUrl,
              driveViewLink: parsed.linkUrl,
              timestamp: submittedAt || new Date().toISOString(),
            };
          })
      : [];

    reports.push({
      reportId,
      submittedAt,
      division,
      unit,
      assistedUnit,
      companion,
      workOrderNo,
      officer1,
      officer2,
      notes: notesStr ? { 0: notesStr } : {},
      answers,
      evidenPhotos,
      startedAt: submittedAt || new Date().toISOString(),
    });
  }

  return reports;
}

