export interface FormattedPhoto {
  fileId?: string;
  displayUrl: string;
  linkUrl: string;
}

export function parseGoogleDrivePhoto(rawUrl: string): FormattedPhoto {
  if (!rawUrl) {
    return { displayUrl: '', linkUrl: '' };
  }

  const str = rawUrl.trim();

  if (str.startsWith('data:image')) {
    return { displayUrl: str, linkUrl: str };
  }

  let fileId: string | undefined;

  const dMatch = str.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (dMatch && dMatch[1]) {
    fileId = dMatch[1];
  } else {
    const idMatch = str.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      fileId = idMatch[1];
    } else if (/^[a-zA-Z0-9_-]{20,60}$/.test(str)) {
      fileId = str;
    }
  }

  if (fileId) {
    return {
      fileId,
      displayUrl: `https://lh3.googleusercontent.com/d/${fileId}`,
      linkUrl: `https://drive.google.com/file/d/${fileId}/view`,
    };
  }

  return {
    displayUrl: str,
    linkUrl: str,
  };
}
