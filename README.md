# Penjelasan untuk README

## Latar belakang

Di aplikasi Next.js, request ke BE datang dari dua sumber:

- **SSR**: request keluar dari server Next.js, sehingga lognya ada di terminal/server log.
- **CSR**: request keluar dari browser, sehingga lognya ada di tab Network.

Kedua log ini terpisah, sehingga sulit dilacak sebagai satu alur.

## Solusi

Project ini adalah **proxy/middleware** berbasis Next.js. FE tidak lagi memanggil BE langsung, tetapi lewat project ini. Middleware meneruskan request ke BE, mencatat request dan response-nya, lalu menampilkannya di satu halaman log.

```
FE (SSR & CSR) ──► Middleware ──► BE
                       │
                       ├─ mencatat log request & response
                       └─ halaman /logs untuk melihat log
```

## Cara kerja

1. FE memanggil middleware dengan format `<alamat-middleware>/<nama-service>/<path>`.
2. Middleware membaca segmen pertama (`nama-service`) untuk menentukan BE tujuan.
3. Middleware menyambung base URL BE dengan sisa path dan query string, lalu meneruskan request.
4. Response BE dikembalikan ke FE apa adanya.
5. Request dan response dicatat dan bisa dilihat di halaman `/logs`.

Contoh:

```
FE memanggil : http://localhost:4000/service-a/api/users?page=1
Middleware   : service-a → https://api.service-a.com
Diteruskan   : https://api.service-a.com/api/users?page=1
```

## Konfigurasi

### Middleware

Setiap service didaftarkan lewat env dengan format `<NAMA_SERVICE>_URL`.

```env
SERVICE_A_URL=https://api.service-a.com
SERVICE_B_URL=https://api.service-b.com
```

Aturan penamaan: nama service di URL diubah menjadi huruf besar, tanda `-` menjadi `_`, lalu ditambah akhiran `_URL`.

| Path dari FE | Env yang dipakai |
|---|---|
| `/service-a/...` | `SERVICE_A_URL` |
| `/service-b/...` | `SERVICE_B_URL` |
| `/auth-user/...` | `AUTH_USER_URL` |

Menambah service baru cukup menambah satu baris env, tanpa mengubah kode.

### FE

FE hanya perlu alamat middleware dan nama service, tanpa mengetahui URL asli BE.

```env
API_URL=http://localhost:4000/service-a
```

Pemakaiannya tetap seperti biasa:

```ts
fetch(`${process.env.API_URL}/api/users`)
```

## Fitur

- Proxy untuk method GET, POST, PUT, PATCH, dan DELETE.
- Mapping ke banyak BE berdasarkan nama service.
- Pencatatan log: waktu, method, URL, query, header, body, status, dan durasi.
- Halaman `/logs` berisi tabel log, detail request/response, filter, dan tombol clear.
- Pembaruan log otomatis lewat polling.

## Struktur project

```
middleware-logger/
├─ app/
│  ├─ [service]/[...path]/route.ts   # proxy + logging
│  ├─ _logs/route.ts                 # data log (JSON)
│  └─ logs/page.tsx                  # halaman viewer
├─ lib/
│  ├─ logStore.ts                    # penyimpanan log
│  └─ proxy.ts                       # logika forward ke BE
└─ .env                              # daftar URL service
```

## Batasan saat ini

- **Hanya untuk project pribadi**: tidak ada autentikasi dan tidak ada masking data sensitif. Jangan dipakai di production.
- **Log disimpan di memori**: log hilang saat server restart, dan jumlahnya dibatasi (misalnya 500 log terakhir).
- **Tidak cocok untuk serverless** seperti Vercel, karena memori tidak dibagi antar instance. Jalankan secara lokal atau di server biasa.
- **SSR dan CSR belum dibedakan**: semua request dicatat sebagai satu jenis.
- **Nama service `logs` tidak boleh dipakai**, karena bentrok dengan halaman viewer.
- **Body non-teks** (file, gambar) tidak dicatat isinya, hanya ukuran dan content-type.

## Rencana pengembangan

- Membedakan SSR dan CSR lewat header `x-request-source`.
- Menyimpan log ke file atau SQLite agar tidak hilang saat restart.
- Tombol "copy as cURL" di halaman log.

## Menjalankan project

```bash
npm install
cp .env.example .env     # isi URL tiap service
npm run dev -- -p 4000
```

Lalu buka `http://localhost:4000/logs` untuk melihat log.

---

Bagian "Menjalankan project" saya tulis berdasarkan rencana, jadi sesuaikan setelah kodenya jadi. Kalau mau, saya bisa langsung membuat file `README.md`-nya dari penjelasan ini.