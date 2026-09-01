/**
 * Google Apps Script (code.gs) Backend untuk Aplikasi Pendampingan Yantek & Manbill
 * 
 * PETUNJUK PENGGUNAAN:
 * 1. Buka Spreadsheet Google tempat Anda menyimpan data.
 * 2. Klik menu Extensi > Apps Script.
 * 3. Hapus semua kode default, lalu salin (copy) dan tempel (paste) seluruh isi file code.gs ini.
 * 4. Klik "Simpan" (ikon disket).
 * 5. Klik "Terapkan" (Deploy) > "Terapkan Baru" (New Deployment).
 * 6. Pilih Jenis: "Aplikasi Web" (Web App).
 *    - Deskripsi: Update NO WORK ORDER & Fix Question Answer Mapping
 *    - Jalankan sebagai: "Saya" (Me - email akun Google Anda)
 *    - Siapa yang memiliki akses: "Siapa saja" (Anyone)
 * 7. Klik "Terapkan" (Deploy), lalu berikan izin akses (Authorize access).
 * 8. Salin URL Web App yang didapatkan dan pastikan sudah terpasang di file src/services/gasConfig.ts.
 */

function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : '';
  var sheetName = e && e.parameter ? e.parameter.sheetName : 'LAPORAN_YANTEK';

  if (action === 'getReports') {
    return handleGetReports(sheetName);
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    message: 'Google Apps Script Web App Aktif'
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action || 'submitReport';

    if (action === 'submitReport') {
      return handleSubmitReport(data);
    } else if (action === 'uploadEvidenPhoto' || action === 'uploadPhoto') {
      return handleUploadPhoto(data);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Aksi tidak dikenali: ' + action
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Terjadi kesalahan pada server Apps Script: ' + err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Identifikasi apakah header tertentu adalah kolom metadata (Bukan pertanyaan kuesioner)
 */
function isMetadataCol(headerStr) {
  var h = String(headerStr || '').toLowerCase().trim();
  if (h === 'id' || h === 'id laporan' || h === 'id_laporan' || h === 'kode id' || h === 'no id' || h === 'no. id') return 'id';
  if (h === 'timestamp' || h === 'waktu' || h === 'tanggal & waktu' || h === 'timestamp / waktu' || h === 'waktu / tanggal' || h === 'waktu input' || h === 'waktu submit' || h === 'tgl input' || h === 'hari/tgl' || h === 'hari / tanggal' || h === 'waktu pelaksanaan' || h === 'waktu inspeksi' || h === 'tanggal') return 'timestamp';
  if (h === 'divisi' || h === 'nama divisi' || h === 'bidang' || h === 'division') return 'division';
  if (h === 'unit asal' || h === 'ulp asal' || h === 'unit' || h === 'ulp' || h === 'unit kerja' || h === 'nama unit' || h === 'nama ulp') return 'unit';
  if (h === 'unit yang didampingi' || h === 'unit didampingi' || h.indexOf('didampingi') !== -1 || h.indexOf('tujuan') !== -1) return 'assistedUnit';
  if (h === 'nama pendamping' || h === 'pendamping' || (h.indexOf('pendamping') !== -1 && h.indexOf('petugas') === -1) || h.indexOf('pengawas') !== -1 || h.indexOf('evaluator') !== -1) return 'companion';
  if (h === 'no work order' || h === 'no. work order' || h === 'work order' || h === 'no wo' || h === 'no. wo' || h === 'nomor work order' || h === 'nomor wo') return 'workOrderNo';
  if (h === 'petugas 1' || h === 'petugas yantek 1' || h === 'petugas manbill 1' || h === 'nama petugas 1' || h === 'petugas yantek (1)') return 'officer1';
  if (h === 'petugas 2' || h === 'petugas yantek 2' || h === 'petugas manbill 2' || h === 'nama petugas 2' || h === 'petugas yantek (2)') return 'officer2';
  if (h.indexOf('catatan') !== -1 || h.indexOf('temuan') !== -1 || h.indexOf('keterangan') !== -1) return 'notes';
  if (h.indexOf('koordinat') !== -1 || h.indexOf('gps') !== -1 || h === 'lokasi') return 'gps';
  if (h.indexOf('foto') !== -1 || h.indexOf('eviden') !== -1 || h.indexOf('drive') !== -1) return 'photo';
  if (h === 'status' || h === 'status laporan') return 'status';
  return null;
}

/**
 * Menyimpan Laporan Pendampingan ke Sheet (LAPORAN_YANTEK / LAPORAN_MANBILL)
 */
function handleSubmitReport(payload) {
  var formData = payload.formData || {};
  var questions = payload.questions || [];
  
  var isManbill = (formData.division || '').toUpperCase() === 'MANBILL';
  var sheetName = isManbill ? 'LAPORAN_MANBILL' : 'LAPORAN_YANTEK';
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  // Cek Header Row 1
  var lastColumn = sheet.getLastColumn();
  var headers = [];
  if (lastColumn > 0) {
    headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  }

  // Jika Sheet kosong, buat Header Default
  if (headers.length === 0 || !headers[0]) {
    headers = [
      'ID Laporan',
      'Timestamp / Waktu',
      'Divisi',
      'Unit Asal',
      'Unit Yang Didampingi',
      'Nama Pendamping',
      'NO WORK ORDER',
      isManbill ? 'Petugas Manbill 1' : 'Petugas Yantek 1',
      isManbill ? 'Petugas Manbill 2' : 'Petugas Yantek 2'
    ];

    // Tambahkan kolom pertanyaan P1, P2, dst
    for (var q = 0; q < questions.length; q++) {
      headers.push('P' + (q + 1) + ': ' + (questions[q].text || questions[q]));
    }

    headers.push('Catatan / Temuan');
    headers.push('Titik Koordinat (GPS)');
    headers.push('Link Foto Eviden (Google Drive)');
    headers.push('Status');

    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#e2e8f0');
  }

  // Buat ID Laporan Unik
  var prefix = isManbill ? 'MBL' : 'YNT';
  var reportId = formData.reportId || (prefix + '-' + new Date().getTime());
  var timestampStr = new Date().toLocaleString('id-ID');

  // Format Rekap Jawaban & Catatan
  var answersObj = formData.answers || {};
  var notesObj = formData.notes || {};
  var evidenPhotos = formData.evidenPhotos || [];

  var photoUrls = [];
  for (var i = 0; i < evidenPhotos.length; i++) {
    var p = evidenPhotos[i];
    if (p.driveViewLink) {
      photoUrls.push(p.driveViewLink);
    } else if (p.dataUrl) {
      photoUrls.push(p.dataUrl);
    }
  }
  var photoUrlStr = photoUrls.join('\n');

  var allNotes = [];
  for (var k in notesObj) {
    if (notesObj[k]) {
      allNotes.push('P' + k + ': ' + notesObj[k]);
    }
  }
  var notesCombinedStr = allNotes.join('\n');

  // Count question columns
  var questionColIndex = 0;

  var uVal = (formData.unit || '').trim().toUpperCase();
  var isNeedsAssistedUnit = uVal === 'UL PADANG' || uVal === 'ULPADANG' || uVal.indexOf('PADANG') !== -1 || uVal === 'PLN';
  var effectiveAssistedUnit = isNeedsAssistedUnit ? (formData.assistedUnit || formData.unit || '') : (formData.unit || '');

  // Susun Baris Data Sesuai Kolom Header Secara Presisi
  var newRow = headers.map(function(rawH, colIdx) {
    var metaKey = isMetadataCol(rawH);

    if (metaKey === 'id') return reportId;
    if (metaKey === 'timestamp') return timestampStr;
    if (metaKey === 'division') return formData.division || (isManbill ? 'MANBILL' : 'YANTEK');
    if (metaKey === 'unit') return formData.unit || '';
    if (metaKey === 'assistedUnit') return effectiveAssistedUnit;
    if (metaKey === 'companion') return formData.companion || '';
    if (metaKey === 'workOrderNo') return formData.workOrderNo || '';
    if (metaKey === 'officer1') return formData.officer1 || '';
    if (metaKey === 'officer2') return formData.officer2 || '-';
    if (metaKey === 'notes') return notesCombinedStr || '-';
    if (metaKey === 'gps') {
      if (evidenPhotos.length > 0 && evidenPhotos[0].locationString) {
        return evidenPhotos[0].locationString;
      }
      return '-';
    }
    if (metaKey === 'photo') return photoUrlStr || '-';
    if (metaKey === 'status') return 'SELESAI';

    // Jika bukan kolom metadata -> ini adalah KOLOM PERTANYAAN KUESIONER
    questionColIndex++;
    var hStr = String(rawH || '').trim();

    // 1. Cek pencocokan nomor P1, P2, 1, 2, dst. pada header
    var qMatch = hStr.match(/^(?:pertanyaan|soal|item|p|q|no)[\s_\-\.\:]*0*([0-9]+)/i) || hStr.match(/^0*([0-9]+)[\s_\-\.\:\)\/]/) || hStr.match(/^0*([0-9]+)$/);
    if (qMatch && qMatch[1]) {
      var qNum = parseInt(qMatch[1], 10);
      var ansVal = answersObj[qNum] || answersObj[String(qNum)];
      if (ansVal !== undefined && ansVal !== null && String(ansVal).trim() !== '') {
        return ansVal;
      }
    }

    // 2. Cek kesamaan teks pertanyaan dengan daftar pertanyaan kuesioner
    var cleanH = hStr.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (var q = 0; q < questions.length; q++) {
      var qObj = questions[q];
      var qText = String(qObj.text || qObj || '');
      var cleanQ = qText.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanQ.length >= 6) {
        if (cleanH === cleanQ || cleanH.indexOf(cleanQ.substring(0, 15)) !== -1 || cleanQ.indexOf(cleanH.substring(0, 15)) !== -1) {
          var qId = qObj.id !== undefined ? qObj.id : (q + 1);
          var val = answersObj[qId] || answersObj[String(qId)] || answersObj[q + 1] || answersObj[String(q + 1)];
          if (val !== undefined && val !== null && String(val).trim() !== '') {
            return val;
          }
        }
      }
    }

    // 3. Fallback pencocokan posisi kolom pertanyaan (pertanyaan ke-1, ke-2, dst)
    var targetQ = questions[questionColIndex - 1];
    var posQId = targetQ && targetQ.id !== undefined ? targetQ.id : questionColIndex;
    var posVal = answersObj[posQId] || answersObj[String(posQId)] || answersObj[questionColIndex] || answersObj[String(questionColIndex)];
    if (posVal !== undefined && posVal !== null && String(posVal).trim() !== '') {
      return posVal;
    }

    return 'YA';
  });

  // Append Baris Baru ke Spreadsheet
  sheet.appendRow(newRow);

  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'Laporan berhasil disimpan ke Sheet ' + sheetName,
    sheetName: sheetName,
    reportId: reportId
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Membaca Data Laporan dari Sheet LAPORAN_YANTEK / LAPORAN_MANBILL
 */
function handleGetReports(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      reports: []
    })).setMimeType(ContentService.MimeType.JSON);
  }

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      reports: []
    })).setMimeType(ContentService.MimeType.JSON);
  }

  var headers = data[0];

  var reports = [];

  for (var r = 1; r < data.length; r++) {
    var row = data[r];
    if (!row || row.length === 0 || !row.some(function(c) { return String(c).trim(); })) continue;

    var reportId = 'RPT-' + r;
    var submittedAt = '';
    var division = 'YANTEK';
    var unit = '';
    var assistedUnit = '';
    var companion = '';
    var workOrderNo = '';
    var officer1 = '';
    var officer2 = '';
    var notesStr = '';
    var photoUrlStr = '';

    var answers = {};
    var qCounter = 0;

    headers.forEach(function(rawH, cIdx) {
      var metaKey = isMetadataCol(rawH);
      var cellVal = String(row[cIdx] || '').trim();

      if (metaKey === 'id' && cellVal) reportId = cellVal;
      else if (metaKey === 'timestamp' && cellVal) submittedAt = cellVal;
      else if (metaKey === 'division' && cellVal) division = cellVal;
      else if (metaKey === 'unit' && cellVal) unit = cellVal;
      else if (metaKey === 'assistedUnit' && cellVal) assistedUnit = cellVal;
      else if (metaKey === 'companion' && cellVal) companion = cellVal;
      else if (metaKey === 'workOrderNo' && cellVal) workOrderNo = cellVal;
      else if (metaKey === 'officer1' && cellVal) officer1 = cellVal;
      else if (metaKey === 'officer2' && cellVal) officer2 = cellVal;
      else if (metaKey === 'notes' && cellVal) notesStr = cellVal;
      else if (metaKey === 'photo' && cellVal) photoUrlStr = cellVal;
      else if (!metaKey) {
        // Kolom Pertanyaan
        var qNum = null;
        var hStr = String(rawH || '').trim();
        var qMatch = hStr.match(/^(?:pertanyaan|soal|item|p|q|no)[\s_\-\.\:]*0*([0-9]+)/i) || hStr.match(/^0*([0-9]+)[\s_\-\.\:\)\/]/) || hStr.match(/^0*([0-9]+)$/);
        if (qMatch && qMatch[1]) {
          qNum = parseInt(qMatch[1], 10);
        } else {
          qCounter++;
          qNum = qCounter;
        }

        if (qNum && cellVal) {
          answers[qNum] = cellVal;
        }
      }
    });

    var evidenPhotos = [];
    if (photoUrlStr) {
      var urls = photoUrlStr.split(/[\n,;]+/);
      for (var u = 0; u < urls.length; u++) {
        var cleanUrl = urls[u].trim();
        if (cleanUrl) {
          evidenPhotos.push({
            id: 'photo-' + u,
            dataUrl: cleanUrl,
            driveViewLink: cleanUrl,
            timestamp: submittedAt
          });
        }
      }
    }

    var uNorm = (unit || '').trim().toUpperCase();
    var isNeedsAssistedUnitRep = uNorm === 'UL PADANG' || uNorm === 'ULPADANG' || uNorm.indexOf('PADANG') !== -1 || uNorm === 'PLN';
    var finalAssistedUnit = isNeedsAssistedUnitRep ? (assistedUnit || unit) : unit;

    reports.push({
      reportId: reportId,
      submittedAt: submittedAt,
      division: division,
      unit: unit,
      assistedUnit: finalAssistedUnit,
      companion: companion,
      workOrderNo: workOrderNo,
      officer1: officer1,
      officer2: officer2,
      notes: notesStr ? { 0: notesStr } : {},
      answers: answers,
      evidenPhotos: evidenPhotos
    });
  }

  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    reports: reports
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle Upload Foto ke Google Drive
 */
function handleUploadPhoto(payload) {
  try {
    var base64Data = payload.base64Data;
    var fileName = payload.fileName || ('Eviden_' + new Date().getTime() + '.jpg');
    var folderName = payload.folderName || 'EVIDEN_PENILAIAN_YANTEK';

    var folder;
    var folders = DriveApp.getFoldersByName(folderName);
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
      folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }

    var contentType = 'image/jpeg';
    var bytes = Utilities.base64Decode(base64Data.substring(base64Data.indexOf(',') + 1));
    var blob = Utilities.newBlob(bytes, contentType, fileName);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      fileId: file.getId(),
      driveViewLink: file.getUrl(),
      webViewLink: file.getUrl()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Gagal mengunggah foto: ' + err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
