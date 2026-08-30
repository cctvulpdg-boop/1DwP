# 1DwP - One Day With Petugas (PLN)

Aplikasi Pendampingan Yantek & Manbill dengan integrasi Google Spreadsheet & Google Drive via Google Apps Script (GAS).

## 🚀 Panduan Deployment ke Vercel & GitHub

### 1. Push ke Repository GitHub
1. Buat repository baru di [GitHub](https://github.com/new).
2. Jalankan perintah berikut di terminal lokal Anda:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: 1DwP App"
   git branch -M main
   git remote add origin https://github.com/USERNAME/REPOSITORY_NAME.git
   git push -u origin main
   ```

### 2. Deploy ke Vercel
1. Login ke [Vercel Dashboard](https://vercel.com).
2. Klik **Add New...** > **Project**.
3. Hubungkan akun GitHub Anda dan pilih repository `1DwP`.
4. Pada bagian **Configure Project**:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Klik **Deploy**.

### 3. Konfigurasi Google Apps Script (GAS)
Pastikan Anda telah menyalin script `code.gs` ke Google Spreadsheet Anda dan melakukan Deploy sebagai Web App (`Execute as: Me`, `Who has access: Anyone`), lalu pastikan URL Web App sudah dimasukkan ke `/src/services/gasConfig.ts`.
