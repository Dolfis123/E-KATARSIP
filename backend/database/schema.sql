-- ============================================================
-- E-KATARSIP DATABASE SCHEMA
-- Aplikasi Web E-Katalog Arsip - Sub Bidang Perekonomian dan
-- Sosial Budaya, BAPPERIDA Provinsi Papua Barat Daya
--
-- Fokus aplikasi: ARSIPASI (pencatatan, klasifikasi, penyimpanan
-- salinan digital/tautan, dan penelusuran arsip fisik dokumen).
-- Tidak ada alur verifikasi/persetujuan atasan — hanya dua peran:
-- Super Admin dan Staf Admin.
-- ============================================================

CREATE DATABASE IF NOT EXISTS ekatarsip_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ekatarsip_db;

-- ---------------------------------------------------------------
-- Table: roles  (hanya 2 peran: Super Admin & Staf Admin)
-- ---------------------------------------------------------------
CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_role VARCHAR(50) NOT NULL UNIQUE,      -- Super Admin, Staf Admin
  deskripsi VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------
-- Table: users
-- ---------------------------------------------------------------
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_lengkap VARCHAR(150) NOT NULL,
  nip VARCHAR(30) UNIQUE,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  jabatan VARCHAR(150),
  sub_bidang VARCHAR(150) DEFAULT 'Perekonomian dan Sosial Budaya',
  role_id INT NOT NULL,
  foto_profil VARCHAR(255),
  status ENUM('aktif','nonaktif') DEFAULT 'aktif',
  email_terverifikasi TINYINT(1) NOT NULL DEFAULT 0,  -- diaktifkan via kode OTP yang dikirim ke email
  last_login DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- ---------------------------------------------------------------
-- Table: sektor  (Pertanian, Kehutanan, Perikanan, dst.)
-- ---------------------------------------------------------------
CREATE TABLE sektor (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_sektor VARCHAR(150) NOT NULL UNIQUE,
  kode_sektor VARCHAR(10) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------
-- Table: jenis_dokumen  (Notula Rapat, MoU/PKS, Dokumentasi, Surat Masuk, dst.)
-- ---------------------------------------------------------------
CREATE TABLE jenis_dokumen (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_jenis VARCHAR(150) NOT NULL UNIQUE,
  kode_jenis VARCHAR(10) NOT NULL UNIQUE,
  masa_retensi_tahun INT DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------
-- Table: opd  (Organisasi Perangkat Daerah / instansi terkait arsip)
-- ---------------------------------------------------------------
CREATE TABLE opd (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_opd VARCHAR(200) NOT NULL,
  singkatan VARCHAR(30),
  kontak_person VARCHAR(150),
  email VARCHAR(150),
  telepon VARCHAR(30),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------
-- Table: arsip  (inti aplikasi — murni pencatatan & klasifikasi arsip,
-- tanpa status verifikasi/persetujuan)
-- ---------------------------------------------------------------
CREATE TABLE arsip (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nomor_klasifikasi VARCHAR(50) NOT NULL UNIQUE,  -- otomatis: JENIS/SEKTOR/NNN/BULAN/TAHUN
  judul VARCHAR(255) NOT NULL,
  jenis_dokumen_id INT NOT NULL,
  sektor_id INT NULL,
  tanggal_dokumen DATE NOT NULL,
  nomor_surat VARCHAR(100),
  uraian_ringkas TEXT,
  opd_terkait_id INT NULL,
  lokasi_fisik VARCHAR(150) DEFAULT 'Ruang Sub Bidang Ekonomi & Sosbud',
  tingkat_kerahasiaan ENUM('biasa','terbatas','rahasia') DEFAULT 'biasa',
  kata_kunci VARCHAR(255),
  diinput_oleh INT NOT NULL,
  jumlah_dilihat INT DEFAULT 0,
  jumlah_diunduh INT DEFAULT 0,
  dihapus_pada DATETIME NULL DEFAULT NULL,  -- soft-delete: diisi saat dipindah ke Sampah, dikosongkan saat dipulihkan
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (jenis_dokumen_id) REFERENCES jenis_dokumen(id),
  FOREIGN KEY (sektor_id) REFERENCES sektor(id),
  FOREIGN KEY (opd_terkait_id) REFERENCES opd(id),
  FOREIGN KEY (diinput_oleh) REFERENCES users(id),
  FULLTEXT KEY ft_pencarian (judul, uraian_ringkas, kata_kunci)
);

-- ---------------------------------------------------------------
-- Table: arsip_lampiran  (salinan digital: file hasil scan ATAU
-- tautan eksternal seperti Google Drive/YouTube/dsb. Bisa multi
-- lampiran per arsip, campuran file dan tautan.)
-- ---------------------------------------------------------------
CREATE TABLE arsip_lampiran (
  id INT AUTO_INCREMENT PRIMARY KEY,
  arsip_id INT NOT NULL,
  jenis_lampiran ENUM('file','link') NOT NULL DEFAULT 'file',
  nama_file VARCHAR(255) NULL,           -- nama file fisik di server (khusus jenis 'file')
  nama_file_asli VARCHAR(255) NOT NULL,  -- nama asli file ATAU label/judul tautan
  path_file VARCHAR(1000) NOT NULL,      -- path relatif file ATAU URL tautan lengkap
  tipe_file VARCHAR(50),                 -- mime-type file, atau 'link' untuk tautan
  ukuran_file_kb INT NULL,               -- NULL untuk tautan
  checksum_sha256 VARCHAR(64) NULL,      -- NULL untuk tautan
  diunggah_oleh INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (arsip_id) REFERENCES arsip(id) ON DELETE CASCADE,
  FOREIGN KEY (diunggah_oleh) REFERENCES users(id)
);

-- ---------------------------------------------------------------
-- Table: activity_log  (riwayat aktivitas / audit trail)
-- ---------------------------------------------------------------
CREATE TABLE activity_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  aksi VARCHAR(100) NOT NULL,          -- LOGIN, TAMBAH_ARSIP, UBAH_ARSIP, HAPUS_ARSIP, UNDUH_LAMPIRAN, dst
  modul VARCHAR(50),                   -- arsip, user, master, auth
  referensi_id INT NULL,
  deskripsi VARCHAR(500),
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------
-- Table: otp_codes  (kode OTP untuk verifikasi email & lupa password,
-- dikirim ke email pengguna. Kode disimpan dalam bentuk hash.)
-- ---------------------------------------------------------------
CREATE TABLE otp_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(150) NOT NULL,
  kode_hash VARCHAR(64) NOT NULL,
  tipe ENUM('verifikasi_email','reset_password') NOT NULL,
  kedaluwarsa DATETIME NOT NULL,
  digunakan_pada DATETIME NULL,
  percobaan INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------
-- Table: notifikasi  (notifikasi dalam-aplikasi untuk aksi CRUD —
-- satu baris per penerima, dibuat_oleh mencatat pelaku aksi)
-- ---------------------------------------------------------------
CREATE TABLE notifikasi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,           -- penerima notifikasi
  dibuat_oleh INT NULL,           -- pelaku aksi (NULL = sistem)
  judul VARCHAR(150) NOT NULL,
  pesan VARCHAR(500),
  tipe VARCHAR(30) DEFAULT 'info',
  modul VARCHAR(30),
  referensi_id INT NULL,
  dibaca TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (dibuat_oleh) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX idx_arsip_tanggal ON arsip(tanggal_dokumen);
CREATE INDEX idx_arsip_jenis ON arsip(jenis_dokumen_id);
CREATE INDEX idx_arsip_sektor ON arsip(sektor_id);
CREATE INDEX idx_arsip_dihapus_pada ON arsip(dihapus_pada);
CREATE INDEX idx_log_created ON activity_log(created_at);
CREATE INDEX idx_otp_email_tipe ON otp_codes(email, tipe);
CREATE INDEX idx_notif_user ON notifikasi(user_id, dibaca);
