# E-KATARSIP — Aplikasi Web E-Katalog Arsip

Aplikasi web ARSIPASI (arsip digital) untuk **Sub Bidang Perekonomian dan Sosial Budaya**,
**Badan Perencanaan Pembangunan, Riset dan Inovasi Daerah (BAPPERIDA) Provinsi Papua Barat Daya**.

Dikembangkan berdasarkan Rancangan Aktualisasi Latsar CPNS Gelombang VI Angkatan XXI
oleh **Berselius Mesak Smori, S.E.** Aplikasi ini murni difokuskan sebagai media
**ARSIPASI**: pencatatan, klasifikasi otomatis, penyimpanan salinan digital (file
maupun tautan), dan penelusuran arsip fisik dokumen — tanpa alur verifikasi/persetujuan
berjenjang, dan tanpa modul di luar kebutuhan arsip.

## Arsitektur

- **Frontend**: React 18 + Vite + Tailwind CSS, React Router, Axios, Recharts
- **Backend**: Node.js + Express.js dengan pola **MVC** (Model - Route - Controller)
- **Database**: MySQL 8 / MariaDB (cocok untuk XAMPP di pengembangan lokal)
- **Autentikasi**: JWT (JSON Web Token) + bcrypt
- **Upload**: Multer — file (PDF, JPG, PNG, DOCX, XLSX, maks. 15MB/file) **atau** tautan
  eksternal (Google Drive, YouTube, situs OPD, dsb.)
- **Deploy produksi**: Docker + Nginx (lihat bagian [Deploy ke VPS](#deploy-ke-vps-dengan-docker--nginx))

```
ekatarsip/
├── backend/                  # REST API (Express MVC)
│   ├── database/
│   │   ├── schema.sql        # struktur tabel
│   │   └── seed.sql          # data awal (2 role, 2 akun contoh, sektor, jenis dokumen, OPD)
│   ├── Dockerfile
│   └── src/
│       ├── config/db.js      # koneksi pool MySQL
│       ├── models/           # Model — query database
│       ├── controllers/      # Controller — logika bisnis
│       ├── routes/           # Routing endpoint API
│       ├── middlewares/      # auth JWT, role guard, upload, error handler
│       ├── utils/            # email (SMTP), OTP, notifikasi CRUD
│       ├── jobs/             # pembersihan Sampah otomatis (30 hari, terjadwal)
│       ├── uploads/arsip/    # penyimpanan file hasil scan
│       └── app.js / server.js
├── frontend/                 # Aplikasi web (React + Vite + Tailwind)
│   ├── Dockerfile
│   ├── nginx.conf            # Nginx di dalam kontainer frontend (serve + proxy API)
│   ├── public/logo-papua-barat-daya.png
│   └── src/
│       ├── pages/            # Login, Dashboard, ArsipList, ArsipDetail, dst.
│       ├── components/       # Sidebar, Topbar, Modal, StatCard, dst.
│       ├── context/          # AuthContext (state login)
│       └── services/api.js   # instance Axios (baseURL relatif "/api")
├── docker-compose.yml
└── nginx/ekatarsip.conf.example   # contoh reverse proxy Nginx di HOST VPS
```

## Fitur Utama

1. **CRUD arsip lengkap** — tambah, lihat, **ubah**, dan hapus arsip. Nomor klasifikasi
   dibangkitkan otomatis oleh sistem (`KODEJENIS/KODESEKTOR/URUT/BULAN-ROMAWI/TAHUN`,
   contoh: `RPK/PRK/001/VII/2026`)
2. **Salinan digital ganda & multi-berkas**: unggah **lebih dari satu file sekaligus**
   (scan PDF/gambar/DOCX/XLSX) **dan/atau** tambahkan tautan eksternal (Google Drive,
   YouTube, dsb.) — campuran file dan tautan, jumlah lampiran per arsip tidak dibatasi
3. **Sampah (Trash) dengan retensi 30 hari** — arsip yang dihapus TIDAK langsung hilang,
   melainkan dipindahkan ke Sampah dan dapat **dipulihkan** kapan saja dalam 30 hari.
   Setelah 30 hari, sistem otomatis menghapusnya permanen setiap hari pukul 03:00
   (dapat juga dihapus permanen secara manual dari halaman Sampah)
4. **Pencarian & filter** arsip berdasarkan kata kunci, jenis dokumen, sektor, dan tahun
5. **Dashboard ringkasan** — total arsip, salinan file vs tautan, tren input 12 bulan,
   distribusi per jenis dokumen & sektor, arsip yang belum punya salinan digital
6. **Data master terkelola** — sektor, jenis dokumen, dan OPD/instansi terkait dapat
   dikelola langsung dari aplikasi tanpa mengubah kode
7. **Riwayat aktivitas (audit trail)** — jejak seluruh aksi penting (login, CRUD arsip,
   unggah/hapus lampiran, pulihkan/hapus permanen dari Sampah, dsb.) untuk akuntabilitas,
   khusus dilihat Super Admin
8. **Notifikasi dalam-aplikasi** — lonceng notifikasi di pojok kanan atas memberi tahu
   seluruh pengguna setiap kali ada aksi CRUD (tambah/ubah/hapus arsip, lampiran, atau
   pengguna) yang dilakukan pengguna lain
9. **Keamanan akun berlapis**:
   - Tombol tampilkan/sembunyikan (show/hide) pada setiap input kata sandi
   - **Verifikasi email via kode OTP** saat akun baru dibuat — akun baru tidak dapat
     login sebelum kode OTP yang dikirim ke emailnya diverifikasi, memastikan email
     yang didaftarkan benar-benar aktif
   - **Lupa kata sandi via kode OTP email** — reset password mandiri tanpa perlu
     menghubungi Super Admin
10. **Checksum SHA-256** pada setiap file unggahan untuk menjaga integritas dokumen
11. **Dua peran pengguna saja** — **Super Admin** dan **Staf Admin** — tanpa proses
    verifikasi/persetujuan atasan; keduanya bisa langsung mencatat & mengelola arsip

## Hak Akses

| Aksi | Super Admin | Staf Admin |
|---|---|---|
| Login, dashboard, katalog arsip | ✅ | ✅ |
| Tambah arsip + lampiran (file/tautan, multi-berkas) | ✅ | ✅ |
| Ubah arsip, hapus (ke Sampah) arsip & lampiran | ✅ (semua arsip) | ✅ (arsip yang ia input sendiri) |
| Pulihkan / hapus permanen arsip dari Sampah | ✅ (semua arsip) | ✅ (arsip yang ia input sendiri) |
| Kelola data master (sektor/jenis dokumen/OPD) — tambah | ✅ | ✅ |
| Kelola data master — hapus | ✅ | ❌ |
| Manajemen pengguna | ✅ | ❌ |
| Riwayat aktivitas (audit trail) | ✅ | ❌ |
| Notifikasi CRUD, ubah kata sandi sendiri | ✅ | ✅ |

Tidak ada proses verifikasi/persetujuan (approval workflow). Aplikasi ini murni sebagai
media arsip digital internal Sub Bidang — sesuai kebutuhan ARSIPASI.

## 1. Menjalankan Secara Lokal (development, XAMPP/MySQL)

### Prasyarat
- Node.js ≥ 18
- MySQL 8 / MariaDB ≥ 10.6 (XAMPP cocok untuk ini)

### Backend

```bash
cd backend
npm install
cp .env.example .env        # sesuaikan kredensial database Anda
```

Buat database dan impor skema (lewat terminal, atau import manual via phpMyAdmin):

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

Jalankan server:

```bash
npm run dev        # mode development (nodemon)
# atau
npm start           # mode production
```

API berjalan di `http://localhost:5000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Aplikasi web berjalan di `http://localhost:5173` (proxy otomatis ke API backend, lihat
`vite.config.js`).

### Akun Demo (dari `seed.sql`)

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@ekatarsip.papuabaratdaya.go.id | Password123! |
| Staf Admin | staff@ekatarsip.papuabaratdaya.go.id | Password123! |

**Segera ganti password default** setelah instalasi (menu **Pengaturan Akun**).

### Konfigurasi Email (SMTP) — wajib untuk fitur OTP

Kode OTP (verifikasi email akun baru & lupa kata sandi) dikirim lewat email. Isi
variabel `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, dan `SMTP_FROM` pada
`backend/.env` sesuai penyedia SMTP Anda (Gmail SMTP, kantor pos instansi, SendGrid,
Mailgun, dsb).

**Jika `SMTP_HOST` dikosongkan**, sistem tetap berjalan normal — kode OTP hanya akan
dicetak ke log/console server (`npm run dev` di terminal, atau `docker compose logs -f
backend` di produksi) alih-alih benar-benar terkirim ke email. Ini memudahkan uji coba
tanpa perlu server SMTP, namun **tidak boleh dipakai di lingkungan produksi** karena
pengguna baru/lupa password tidak akan benar-benar menerima kodenya.

## 2. Deploy ke VPS dengan Docker + Nginx

### Prasyarat di VPS
- Docker & Docker Compose terpasang
- Nginx terpasang di VPS (di luar Docker) sebagai reverse proxy utama
- (Opsional) domain yang sudah mengarah ke IP VPS

### Langkah

1. Salin/clone folder proyek ini ke VPS, lalu siapkan environment:
   ```bash
   cp .env.example .env
   nano .env   # sesuaikan DB_PASSWORD, JWT_SECRET, SMTP_*, dsb.
   ```
   **Jangan lupa isi variabel `SMTP_*`** (lihat bagian [Konfigurasi Email
   (SMTP)](#konfigurasi-email-smtp--wajib-untuk-fitur-otp) di atas) agar kode OTP
   verifikasi email & lupa kata sandi benar-benar terkirim ke pengguna.
2. Build dan jalankan seluruh layanan (MySQL, backend, frontend+Nginx internal):
   ```bash
   docker compose up -d --build
   ```
   Saat kontainer MySQL dibuat **pertama kali**, `database/schema.sql` dan
   `database/seed.sql` otomatis diimpor (lihat `docker-compose.yml`).
3. Cek status & log:
   ```bash
   docker compose ps
   docker compose logs -f backend
   ```
4. Aplikasi kini dapat diakses di VPS melalui `http://127.0.0.1:8080` (port dapat diubah
   lewat `FRONTEND_PORT` di `.env`).
5. Arahkan Nginx **di host VPS** (di luar Docker) sebagai reverse proxy ke port
   tersebut. Contoh konfigurasi tersedia di `nginx/ekatarsip.conf.example` — salin ke
   `/etc/nginx/sites-available/`, sesuaikan `server_name`, aktifkan via symlink ke
   `sites-enabled/`, lalu:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```
6. (Sangat disarankan) Aktifkan HTTPS dengan Certbot:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d arsip.domain-anda.go.id
   ```

### Struktur Docker

- `mysql` — MySQL 8, skema & seed diimpor otomatis, data disimpan di volume persisten
  `ekatarsip_mysql_data`
- `backend` — API Node.js/Express, file arsip disimpan di volume persisten
  `ekatarsip_uploads` (aman dari kehilangan data saat `docker compose up --build` ulang)
- `frontend` — hasil build React disajikan oleh Nginx di dalam kontainer, sekaligus
  meneruskan (`proxy_pass`) permintaan `/api/*` dan `/uploads/*` ke kontainer `backend`

### Perintah Berguna

```bash
docker compose logs -f              # lihat log semua layanan
docker compose up -d --build        # build ulang & restart setelah update kode
docker compose down                 # matikan seluruh layanan (data tetap aman di volume)

# Backup database
docker exec ekatarsip_mysql sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" ekatarsip_db' > backup.sql
```

> ⚠️ **Ganti password default!** Setelah deployment pertama, segera login dengan akun
> Super Admin dan ubah password melalui menu **Pengaturan Akun**, atau ganti kredensial
> di `backend/database/seed.sql` sebelum data pertama kali diimpor.

## Mengganti Logo Instansi

Ganti file `frontend/public/logo-papua-barat-daya.png` dengan logo resmi resolusi tinggi
(disarankan PNG transparan, minimal 256×256px). Logo otomatis tampil di sidebar dan
halaman login tanpa perlu mengubah kode.

## Keamanan

- Password di-hash dengan bcrypt (10 rounds); setiap input kata sandi memiliki tombol
  tampilkan/sembunyikan agar pengguna dapat memeriksa ketikannya
- Autentikasi berbasis JWT dengan masa berlaku token dapat dikonfigurasi (`JWT_EXPIRES_IN`)
- Akun baru wajib diverifikasi via kode OTP email sebelum dapat login (mencegah
  pendaftaran dengan email yang tidak aktif/salah ketik)
- Lupa kata sandi diselesaikan lewat kode OTP email (bukan pertanyaan keamanan yang
  mudah ditebak), kode OTP hanya berlaku 10 menit dan sekali pakai
- Arsip yang dihapus masuk ke Sampah (soft-delete) selama 30 hari sebelum benar-benar
  hilang — melindungi dari penghapusan tidak sengaja
- Validasi tipe & ukuran file saat unggah; validasi format URL untuk lampiran tautan
- Hak akses berbasis peran & kepemilikan arsip di setiap endpoint sensitif
- Helmet.js untuk header keamanan HTTP dasar
- Checksum SHA-256 setiap file untuk menjaga integritas dokumen

## Panduan Pengguna

Lihat dokumen **Buku Panduan E-KATARSIP** (format Word) yang disertakan bersama proyek
ini untuk petunjuk lengkap cara mengelola sistem sehari-hari (login, tambah arsip,
unggah salinan digital/tautan, kelola data master, kelola pengguna, dsb.)

## Lisensi Internal

Aplikasi ini dikembangkan untuk kebutuhan internal BAPPERIDA Provinsi Papua Barat Daya
sebagai bagian dari aktualisasi Latsar CPNS. Silakan sesuaikan lebih lanjut sesuai
kebijakan instansi.
