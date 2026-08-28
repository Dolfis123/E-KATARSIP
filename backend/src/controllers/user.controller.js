const bcrypt = require('bcryptjs');
const UserModel = require('../models/user.model');
const ActivityLogModel = require('../models/activityLog.model');
const { issueOtp } = require('../utils/otp');
const { notifySuperAdmins } = require('../utils/notify');

exports.list = async (req, res, next) => {
  try {
    const users = await UserModel.findAll();
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { nama_lengkap, nip, email, password, jabatan, role_id } = req.body;
    if (!nama_lengkap || !email || !password || !role_id) {
      return res.status(400).json({ success: false, message: 'Nama, email, password, dan role wajib diisi.' });
    }
    const existing = await UserModel.findByEmail(email);
    if (existing) return res.status(409).json({ success: false, message: 'Email sudah terdaftar.' });

    const hashed = await bcrypt.hash(password, 10);
    const userId = await UserModel.create({ nama_lengkap, nip, email, password: hashed, jabatan, role_id });

    // Akun baru wajib memverifikasi email lewat kode OTP sebelum bisa login,
    // supaya email yang didaftarkan benar-benar aktif dan bisa dihubungi.
    await issueOtp(email, 'verifikasi_email', {
      judul: 'Aktivasi Akun E-KATARSIP',
      catatan: 'Masukkan kode ini di halaman Verifikasi Email untuk mengaktifkan akun Anda.',
    });

    await ActivityLogModel.create({
      user_id: req.user.id, aksi: 'TAMBAH_USER', modul: 'user', referensi_id: userId,
      deskripsi: `Menambahkan pengguna baru: ${nama_lengkap}`, ip_address: req.ip,
    });
    await notifySuperAdmins(req.user.id, {
      judul: 'Pengguna baru ditambahkan',
      pesan: `${req.user.nama_lengkap} menambahkan pengguna baru: ${nama_lengkap}`,
      tipe: 'user', modul: 'user', referensi_id: userId,
    });

    const user = await UserModel.findById(userId);
    res.status(201).json({
      success: true,
      message: 'Pengguna berhasil ditambahkan. Kode OTP verifikasi telah dikirim ke email pengguna — akun belum bisa login sebelum diverifikasi.',
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const allowed = ['nama_lengkap', 'nip', 'jabatan', 'role_id', 'status', 'sub_bidang'];
    const fields = {};
    for (const f of allowed) if (req.body[f] !== undefined) fields[f] = req.body[f];

    if (req.body.password) fields.password = await bcrypt.hash(req.body.password, 10);

    await UserModel.update(id, fields);
    await ActivityLogModel.create({
      user_id: req.user.id, aksi: 'UBAH_USER', modul: 'user', referensi_id: id,
      deskripsi: `Memperbarui data pengguna ID ${id}`, ip_address: req.ip,
    });

    const user = await UserModel.findById(id);
    await notifySuperAdmins(req.user.id, {
      judul: 'Data pengguna diperbarui',
      pesan: `${req.user.nama_lengkap} memperbarui data pengguna: ${user.nama_lengkap}`,
      tipe: 'user', modul: 'user', referensi_id: id,
    });
    res.json({ success: true, message: 'Data pengguna berhasil diperbarui.', data: user });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (Number(id) === req.user.id) {
      return res.status(400).json({ success: false, message: 'Anda tidak dapat menghapus akun sendiri.' });
    }
    const existing = await UserModel.findById(id);
    await UserModel.delete(id);
    await ActivityLogModel.create({
      user_id: req.user.id, aksi: 'HAPUS_USER', modul: 'user', referensi_id: id,
      deskripsi: `Menghapus pengguna ID ${id}`, ip_address: req.ip,
    });
    if (existing) {
      await notifySuperAdmins(req.user.id, {
        judul: 'Pengguna dihapus',
        pesan: `${req.user.nama_lengkap} menghapus pengguna: ${existing.nama_lengkap}`,
        tipe: 'user', modul: 'user', referensi_id: id,
      });
    }
    res.json({ success: true, message: 'Pengguna berhasil dihapus.' });
  } catch (err) {
    next(err);
  }
};
