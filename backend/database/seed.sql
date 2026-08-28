-- ============================================================
-- SEED DATA E-KATARSIP
-- Password default untuk semua akun contoh: "Password123!"
-- (hash bcrypt di bawah sudah sesuai, jangan diubah manual)
-- Segera ganti password akun ini setelah login pertama kali.
-- ============================================================
USE ekatarsip_db;

-- Hanya 2 peran: Super Admin (kelola semua + pengguna) dan Staf Admin
-- (input & kelola arsip). Tidak ada alur verifikasi/persetujuan.
INSERT INTO roles (nama_role, deskripsi) VALUES
('Super Admin', 'Akses penuh: kelola arsip, data master, pengguna, dan log aktivitas'),
('Staf Admin', 'Mengelola arsip: input, unggah salinan digital/tautan, dan menelusuri katalog arsip');

-- Password hash untuk "Password123!" (bcrypt, 10 rounds)
-- Akun contoh langsung berstatus terverifikasi (email_terverifikasi=1) agar
-- bisa langsung login tanpa perlu mengonfigurasi SMTP terlebih dahulu.
INSERT INTO users (nama_lengkap, nip, email, password, jabatan, role_id, email_terverifikasi) VALUES
('Berselius Mesak Smori, S.E.', '198105122025041001', 'admin@gmail.com', '$2b$10$1HOjkjKXQucpGBYXaoMmBuSJaqyuDtdH45gn5wIANHCszyB4n8B2a', 'Analis SDM Aparatur Ahli Pertama', 1, 1),
('Staf Kearsipan', '199001012020011002', 'staff@gmail.com', '$2b$10$1HOjkjKXQucpGBYXaoMmBuSJaqyuDtdH45gn5wIANHCszyB4n8B2a', 'Pengadministrasi Umum', 2, 1);

INSERT INTO sektor (nama_sektor, kode_sektor) VALUES
('Pertanian', 'PTN'),
('Kehutanan', 'KHT'),
('Lingkungan Hidup', 'LGH'),
('Perikanan dan Kelautan', 'PRK'),
('Perindustrian', 'IND'),
('Perdagangan dan ESDM', 'DEG'),
('Dunia Usaha dan Investasi', 'INV');

INSERT INTO jenis_dokumen (nama_jenis, kode_jenis, masa_retensi_tahun) VALUES
('Notula/Hasil Rapat Koordinasi', 'RPK', 5),
('Perjanjian Kerja Sama (MoU/PKS)', 'PKS', 10),
('Dokumentasi Rapat Internal', 'RPI', 3),
('Dokumentasi Kegiatan', 'DOK', 3),
('Surat Masuk', 'SMK', 5),
('Surat Keluar', 'SKL', 5),
('Kajian/Dokumen Perencanaan', 'KJN', 10);

INSERT INTO opd (nama_opd, singkatan, kontak_person, email, telepon) VALUES
('Dinas Kehutanan Provinsi Papua Barat Daya', 'Dishut', 'Kasubbag Program', 'dishut@papuabaratdaya.go.id', '0951-xxxxxx'),
('Dinas Kelautan dan Perikanan Provinsi Papua Barat Daya', 'DKP', 'Kasubbag Program', 'dkp@papuabaratdaya.go.id', '0951-xxxxxx'),
('Dinas Perindustrian dan Perdagangan Provinsi Papua Barat Daya', 'Disperindag', 'Kasubbag Program', 'disperindag@papuabaratdaya.go.id', '0951-xxxxxx'),
('Dinas Pertanian dan Ketahanan Pangan Provinsi Papua Barat Daya', 'Distan', 'Kasubbag Program', 'distan@papuabaratdaya.go.id', '0951-xxxxxx'),
('Dinas Penanaman Modal dan PTSP Provinsi Papua Barat Daya', 'DPMPTSP', 'Kasubbag Program', 'dpmptsp@papuabaratdaya.go.id', '0951-xxxxxx');
