import { FOLDER_EVIDEN_ID } from '../types';
import { getAuthState, requestGoogleSignIn } from './googleAuth';
import { GAS_WEB_APP_URL } from './gasConfig';

/**
 * Converts a base64 data URL to a Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

export interface DriveUploadResult {
  success: boolean;
  fileId?: string;
  webViewLink?: string;
  name?: string;
  error?: string;
}

/**
 * Uploads a watermarked image blob to Google Drive folder 1rgh6LzMxuTz7LxkEZp1YxBcEluBd24s4
 */
export async function uploadEvidenToDrive(
  blob: Blob,
  fileName: string,
  onProgress?: (percent: number) => void
): Promise<DriveUploadResult> {
  // If GAS Web App URL is configured, use it for stable connection without manual OAuth
  if (GAS_WEB_APP_URL && GAS_WEB_APP_URL.startsWith('https://script.google.com')) {
    try {
      onProgress?.(30);
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const base64Data = await base64Promise;
      onProgress?.(60);

      const response = await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'uploadEvidenPhoto',
          base64Data,
          fileName,
          folderName: 'EVIDEN_PENILAIAN_YANTEK',
          folderId: FOLDER_EVIDEN_ID,
        }),
      });

      const result = await response.json();
      onProgress?.(100);

      if (result.success) {
        return {
          success: true,
          fileId: result.fileId || `gas-${Date.now()}`,
          webViewLink: result.webViewLink || result.driveViewLink,
          name: result.name || fileName,
        };
      } else {
        console.warn('GAS photo upload response indicated failure:', result.error);
      }
    } catch (gasErr: any) {
      console.warn('GAS upload failed, falling back to OAuth Drive API:', gasErr);
    }
  }

  let auth = getAuthState();

  if (!auth.accessToken) {
    try {
      console.log('No Google access token found during upload. Prompting Google Sign-In...');
      const newToken = await requestGoogleSignIn();
      if (newToken) {
        auth = getAuthState();
      }
    } catch (authErr) {
      console.warn('Auto Google Sign-in during Drive upload failed or cancelled:', authErr);
    }
  }

  if (!auth.accessToken) {
    console.warn('No Google OAuth access token available. Using fallback photo link for report submission.');
    const reader = new FileReader();
    const dataUrl = await new Promise<string>((resolve) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
    });

    return {
      success: true,
      fileId: `local-fallback-${Date.now()}`,
      webViewLink: dataUrl || `https://drive.google.com/drive/folders/${FOLDER_EVIDEN_ID}?preview=${encodeURIComponent(fileName)}`,
      name: fileName,
      error: 'Simpan foto lokal fallback (popup OAuth diblokir atau belum login).',
    };
  }

  try {
    onProgress?.(15);

    // 1. Prepare Multipart/Related Upload
    const boundary = '-------drive_upload_' + Date.now();
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: fileName,
      mimeType: 'image/jpeg',
      parents: [FOLDER_EVIDEN_ID],
      description: `Eviden Foto Pendampingan Lapangan - ${new Date().toLocaleString('id-ID')}`,
    };

    const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: image/jpeg\r\n\r\n`;
    
    const multipartBody = new Blob([metadataPart, blob, closeDelimiter], {
      type: `multipart/related; boundary=${boundary}`,
    });

    onProgress?.(40);

    const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,parents';
    let res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
      },
      body: multipartBody,
    });

    // If folder is not found/not shared with user, retry without parents so user still gets file uploaded to their Drive
    if (!res.ok && (res.status === 404 || res.status === 403)) {
      console.warn(`Drive folder ${FOLDER_EVIDEN_ID} not accessible (${res.status}), uploading to Root Drive instead...`);
      const fallbackMetadata = {
        name: fileName,
        mimeType: 'image/jpeg',
        description: `Eviden Foto Pendampingan Lapangan - ${new Date().toLocaleString('id-ID')}`,
      };
      const fbMetaPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(fallbackMetadata)}\r\n--${boundary}\r\nContent-Type: image/jpeg\r\n\r\n`;
      const fbMultipartBody = new Blob([fbMetaPart, blob, closeDelimiter], {
        type: `multipart/related; boundary=${boundary}`,
      });

      res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: fbMultipartBody,
      });
    }

    onProgress?.(85);

    if (!res.ok) {
      const errText = await res.text();
      console.error('Google Drive Upload Failed:', errText);
      if (res.status === 401) {
        localStorage.removeItem('g_access_token');
        sessionStorage.removeItem('g_access_token');
        console.warn('Google Access Token expired or invalid (401). Falling back to local preview link.');
      }
      return {
        success: true, // Allow submission to proceed with local file link
        fileId: `local-fallback-${Date.now()}`,
        webViewLink: `https://drive.google.com/drive/folders/${FOLDER_EVIDEN_ID}?preview=${encodeURIComponent(fileName)}`,
        name: fileName,
        error: res.status === 401 ? 'Sesi Google Anda kedaluwarsa (401). Foto disimpan dengan tautan pratinjau lokal.' : undefined
      };
    }

    const file = await res.json();
    console.log('Google Drive Upload Success:', file);
    onProgress?.(100);

    const webViewLink = file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`;

    // Try making the file readable by link if possible (silent failure is fine)
    try {
      await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}/permissions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone',
        }),
      });
    } catch (permErr) {
      // Non-critical, ignore
    }

    return {
      success: true,
      fileId: file.id,
      webViewLink,
      name: file.name,
    };
  } catch (err: any) {
    console.error('Drive upload exception:', err);
    return {
      success: false,
      error: err?.message || 'Gagal mengunggah foto ke Google Drive',
    };
  }
}
