# Middleware Studio — Dev API Gateway, Logger & Mock Manager

**Middleware Studio** adalah *developer workspace & API proxy gateway* lokal berbasis **Next.js 16 (Turbopack)**. Aplikasi ini dirancang untuk mengatasi kendala pengembangan Frontend (FE) dan Backend (BE), seperti masalah CORS, pemantauan trafik HTTP real-time dari SSR/CSR, simulasi respon API (*mocking*), serta pengujian API interaktif (*built-in API tester*).

---

## 🌟 Fitur Utama

### 1. 🌐 Proxy Gateway & CORS Bypass
- **Otomatis Bypass CORS**: Mengatasi batasan CORS browser saat FE memanggil backend staging/production lokal secara langsung.
- **Dynamic Routing**: Cukup gunakan format URL `http://localhost:4000/[nama-service]/[path-endpoint]`.
- **Environment Mapping**: Meneruskan request ke target service yang didaftarkan pada `.env` tanpa perlu mengubah kode sumber.
- **Preflight & Hop-by-Hop Handling**: Menangani `OPTIONS` preflight dan membersihkan header yang tidak diperlukan secara aman.

### 2. 📊 Live Logs & Traffic Inspector (`/logs`)
- **Real-time Monitoring**: Memantau setiap lalu lintas HTTP masuk & keluar secara langsung dengan fitur *Live Polling*.
- **Detail Request & Response**: Memeriksa HTTP Method, Status Code, Durasi Latensi (ms), URL, Query Params, Headers, serta Payload Request & Response.
- **JSON Viewer Canggih**: Syntax highlighting, mode *Formatted JSON* vs *Raw Text*, fullscreen preview, dan tombol copy.
- **Salin cURL**: 1-klik untuk mengonversi log traffic menjadi perintah `curl` siap pakai di terminal.
- **Simpan Langsung Jadi Mock**: Mengubah respon nyata dari log menjadi Mock API aktif hanya dengan 1 klik!

### 3. 🎭 Mock API Manager (`/mocks`)
- **Simulasi Endpoint Mandiri**: Mocking respon API tanpa menyentuh backend sama sekali—sangat berguna jika backend belum selesai dibuat atau sedang *down*.
- **Kontrol Penuh Respon**: Atur HTTP Status Code (200, 201, 400, 404, 500, dll.), Response Headers (JSON object), dan Response Body.
- **Simulasi Latensi Jaringan**: Atur *Delay (ms)* untuk mensimulasikan kondisi koneksi jaringan lambat.
- **Toggle On/Off Instan**: Mengaktifkan atau menonaktifkan mock tertentu kapan saja tanpa menghapus data.
- **Penyimpanan Permanen**: Disimpan otomatis dalam file lokal `mocks.json`.

### 4. ⚡ API Tester & cURL Importer (`/tester`)
- **Built-in HTTP Client**: Pengujian endpoint ala Postman/Insomnia langsung di dalam browser via proxy gateway.
- **Request Builder Fleksibel**:
  - Pilihan HTTP Method (GET, POST, PUT, PATCH, DELETE).
  - Key-Value builder untuk Query Parameters dan Request Headers (lengkap dengan auto-suggestions).
  - Pilihan Request Body: `none`, `JSON` (dengan validasi format), `Form (x-www-form-urlencoded)`, atau `Plain Text`.
- **Import dari cURL (Paste cURL)**: Salin cURL dari *Browser DevTools (Copy as cURL)* dan tempelkan langsung ke form pengujian secara otomatis.
- **Live cURL Generator**: Menghasilkan perintah cURL secara dinamis sesuai konfigurasi form saat ini.
- **Riwayat Pengujian (History)**: Riwayat request tersimpan secara lokal dan dapat dimuat ulang (*reload*) kapan saja.

### 5. 🧭 Navigasi & Panduan Fitur
- **Header Terpadu**: Navigasi tab modern dan konsisten di seluruh halaman aplikasi.
- **Modal Panduan Fitur**: Pop-up dokumentasi interaktif yang menjelaskan seluruh menu dan cara pemakaian.
- **Root Redirect**: Mengakses `http://localhost:4000/` otomatis mengarahkan pengguna ke dashboard log utama.

---

## 🏗️ Alur & Cara Kerja

```
Frontend (SSR & CSR)
         │
         ▼
  [Middleware Studio] (http://localhost:4000)
         │
         ├─► Cek Mock Aktif di mocks.json ──► (Jika cocok) Return Mock Response
         │
         ├─► Forward ke Backend (env: <SERVICE>_URL)
         │
         ├─► Bypass CORS & Normalisasi Header
         │
         ├─► Catat ke Log Store (Live Logs)
         │
         ▼
Target Backend Service (Kong / Microservices / Third-Party)
```

### Pola Pemanggilan Endpoint:

Format URL:
```
http://localhost:4000/[nama-service]/[path-endpoint]
```

Contoh:
```
Request dari FE : http://localhost:4000/pos-service/v1/business-unit?page=1
Service         : pos-service → POS_SERVICE_URL (di .env)
Target Backend  : https://api.internal.com/pos-service/v1/business-unit?page=1
```

---

## ⚙️ Konfigurasi Environment (`.env`)

Setiap backend service didaftarkan pada file `.env` menggunakan format `<NAMA_SERVICE>_URL`:

```env
# Port aplikasi dev server
PORT=4000

# Service URL Mapping
KONG_URL=https://kong.staging.internal.id
USER_SERVICE_URL=https://user-api.internal.id
ORDER_SERVICE_URL=https://order-api.internal.id
AUTH_URL=https://auth.internal.id
```

### Aturan Penamaan Service:
- Nama service di URL diubah ke huruf kapital.
- Tanda hubung (`-`) diubah menjadi garis bawah (`_`).
- Ditambahkan akhiran `_URL`.

| Path dari Frontend | Environment Variable yang Digunakan |
|---|---|
| `/kong/...` | `KONG_URL` |
| `/user-service/...` | `USER_SERVICE_URL` |
| `/auth/...` | `AUTH_URL` |

> **Catatan:** Nama service berikut dilindungi (*reserved*) untuk halaman internal dan tidak boleh dijadikan nama service: `logs`, `api`, `mocks`, `tester`.

---

## 🚀 Memulai Aplikasi

### 1. Prasyarat
- **Node.js** v18+ (disarankan v20+)
- **npm** atau package manager lainnya

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Buat File Konfigurasi `.env`
Salin template dari `.env.example`:
```bash
cp .env.example .env
```
Sesuaikan URL backend target Anda di dalam file `.env`.

### 4. Jalankan Dev Server
```bash
npm run dev
```

Aplikasi akan berjalan di:
- **Dashboard Logs**: [http://localhost:4000/logs](http://localhost:4000/logs)
- **Mock Manager**: [http://localhost:4000/mocks](http://localhost:4000/mocks)
- **API Tester**: [http://localhost:4000/tester](http://localhost:4000/tester)

---

## 📁 Struktur Direktori

```
middleware-api/
├── src/
│   ├── app/
│   │   ├── [service]/[...path]/     # Route proxy gateway & handler CORS
│   │   ├── api/
│   │   │   ├── logs/                # API REST internal untuk data log (GET, DELETE)
│   │   │   └── mocks/               # API CRUD internal mock ([id]/route.ts)
│   │   ├── logs/                    # Halaman UI Live Logs & Inspector
│   │   ├── mocks/                   # Halaman UI Mock API Manager
│   │   ├── tester/                  # Halaman UI API Tester & cURL importer
│   │   ├── layout.tsx               # Root layout
│   │   └── page.tsx                 # Root redirect ke /logs
│   ├── components/
│   │   └── Header.tsx               # Komponen Header navigasi bersama & modal panduan
│   └── lib/
│       ├── cors.ts                  # Konfigurasi header CORS & preflight
│       ├── logStore.ts              # In-memory store untuk data log traffic
│       ├── mockStore.ts             # Store persistence mock ke mocks.json
│       └── proxy.ts                 # Core forwarding fetch, proxy logic, & header normalizer
├── mocks.json                       # File penyimpanan konfigurasi mock aktif
├── .env                             # Konfigurasi URL backend target
└── package.json
```

---

## 🛡️ Catatan Keamanan & Penggunaan
- Aplikasi ini ditujukan untuk **lingkungan pengembangan lokal (development / testing)**.
- CORS disetel mengizinkan semua origin (`*`) agar fleksibel saat proses development.
- Data log disimpan dalam memori sementara (maks. 500 data terbaru), sedangkan konfigurasi Mock disimpan permanen di file `mocks.json`.