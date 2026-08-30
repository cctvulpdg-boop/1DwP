export interface WatermarkData {
  division: string;
  unit: string;
  assistedUnit?: string;
  companion: string;
  officer1: string;
  officer2: string;
  timestamp?: string;
  latitude?: number | null;
  longitude?: number | null;
  locationString?: string;
  customNote?: string;
}

/**
 * Renders a crisp, highly professional watermark onto an image.
 */
export async function applyWatermark(
  imageSource: string | File | Blob,
  data: WatermarkData
): Promise<{ dataUrl: string; blob: Blob }> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Maintain full image resolution (cap maximum width to 2048px for smooth upload)
        let width = img.width;
        let height = img.height;
        const maxDimension = 2048;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw main photo
        ctx.drawImage(img, 0, 0, width, height);

        // Compute proportional scaling
        const baseScale = Math.max(width / 1200, 0.6);
        const pad = Math.round(24 * baseScale);
        const fontSizeTitle = Math.round(22 * baseScale);
        const fontSizeBody = Math.round(17 * baseScale);
        const fontSizeSmall = Math.round(14 * baseScale);
        const lineHeight = Math.round(26 * baseScale);

        // 1. TOP BANNER / LOGO BADGE
        const topBannerHeight = Math.round(44 * baseScale);
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.beginPath();
        ctx.roundRect(pad, pad, Math.round(360 * baseScale), topBannerHeight, 8 * baseScale);
        ctx.fill();

        // Accent yellow/electric border
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2 * baseScale;
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = `bold ${fontSizeBody}px 'Plus Jakarta Sans', sans-serif`;
        ctx.fillText('⚡ PLN PENDAMPINGAN LAPANGAN', pad + 16 * baseScale, pad + topBannerHeight / 2 + fontSizeBody / 3);
        ctx.restore();

        // 2. BOTTOM WATERMARK CARD OVERLAY
        const now = new Date();
        const formattedDate = now.toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        const formattedTime = now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WIB';

        const lines: { label: string; value: string; color?: string }[] = [
          {
            label: '🕒 WAKTU',
            value: `${formattedDate}, ${formattedTime}`,
            color: '#38bdf8',
          },
          {
            label: '🏢 DIVISI / UNIT',
            value: `${data.division} - ${data.unit}${data.assistedUnit ? ` (Didampingi: ${data.assistedUnit})` : ''}`,
            color: '#f8fafc',
          },
          {
            label: '👤 PENDAMPING',
            value: data.companion || '-',
            color: '#fde047',
          },
          {
            label: '👷 PETUGAS',
            value: `1. ${data.officer1 || '-'}  |  2. ${data.officer2 || '-'}`,
            color: '#4ade80',
          },
        ];

        if (data.latitude && data.longitude) {
          lines.push({
            label: '📍 GPS KOORDINAT',
            value: `${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}${data.locationString ? ` (${data.locationString})` : ''}`,
            color: '#fb923c',
          });
        }

        const cardHeight = Math.round((lines.length * lineHeight) + (pad * 1.8));
        const cardY = height - cardHeight - pad;

        // Bottom gradient backdrop
        ctx.save();
        const grad = ctx.createLinearGradient(0, height - cardHeight - pad * 2, 0, height);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        grad.addColorStop(0.3, 'rgba(15, 23, 42, 0.7)');
        grad.addColorStop(1, 'rgba(15, 23, 42, 0.95)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, height - cardHeight - pad * 2, width, cardHeight + pad * 2);

        // Semi-transparent rounded info box
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1.5 * baseScale;
        ctx.beginPath();
        ctx.roundRect(pad, cardY, width - (pad * 2), cardHeight, 12 * baseScale);
        ctx.fill();
        ctx.stroke();

        // Left accent bar
        ctx.fillStyle = '#0ea5e9';
        ctx.beginPath();
        ctx.roundRect(pad, cardY, 6 * baseScale, cardHeight, [12 * baseScale, 0, 0, 12 * baseScale]);
        ctx.fill();

        // Draw lines
        let curY = cardY + pad * 0.9 + fontSizeBody;
        lines.forEach((line) => {
          // Label
          ctx.font = `bold ${fontSizeSmall}px 'JetBrains Mono', monospace`;
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(line.label, pad + 20 * baseScale, curY);

          // Value
          ctx.font = `600 ${fontSizeBody}px 'Plus Jakarta Sans', sans-serif`;
          ctx.fillStyle = line.color || '#ffffff';
          const labelWidth = Math.round(170 * baseScale);
          ctx.fillText(line.value, pad + 20 * baseScale + labelWidth, curY);

          curY += lineHeight;
        });

        // Verification Footer Tag
        const tagText = `ID EVIDEN: ${Math.random().toString(36).substring(2, 9).toUpperCase()} | DRIVE FOLDER: 1rgh6LzMxuTz7LxkEZp1YxBcEluBd24s4`;
        ctx.font = `500 ${fontSizeSmall * 0.85}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.textAlign = 'right';
        ctx.fillText(tagText, width - pad - 16 * baseScale, cardY + cardHeight - 12 * baseScale);

        ctx.restore();

        // Export as High Quality JPEG
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ dataUrl, blob });
            } else {
              reject(new Error('Failed to create image blob'));
            }
          },
          'image/jpeg',
          0.92
        );
      } catch (e) {
        reject(e);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image source'));

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        }
      };
      reader.readAsDataURL(imageSource);
    }
  });
}

/**
 * Requests GPS location from browser geolocation API
 */
export function getCurrentLocation(): Promise<{ latitude: number; longitude: number; locationString?: string } | null> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          locationString: 'GPS Akurat',
        });
      },
      (err) => {
        console.warn('Geolocation denied or unavailable:', err.message);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 10000,
      }
    );
  });
}
