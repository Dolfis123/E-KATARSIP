const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');
const ActivityLogModel = require('../models/activityLog.model');
const { issueOtp, verifyOtp } = require('../utils/otp');

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email dan password wajib diisi.' });
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email atau password salah.' });
    }
    if (user.status !== 'aktif') {
      return res.status(403).json({ success: false, message: 'Akun Anda tidak aktif. Hubungi Super Admin.' });
    }
    if (!user.email_terverifikasi) {
      return res.status(403).json({
        success: false,
        code: 'EMAIL_BELUM_TERVERIFIKASI',
        message: 'Email Anda belum diverifikasi. Silakan verifikasi email terlebih dahulu menggunakan kode OTP yang dikirim ke email Anda.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email atau password salah.' });
    }

    const payload = { id: user.id, email: user.email, role_id: user.role_id, nama_role: user.nama_role, nama_lengkap: user.nama_lengkap };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });

    await UserModel.updateLastLogin(user.id);
    await ActivityLogModel.create({
      user_id: user.id, aksi: 'LOGIN', modul: 'auth',
      deskripsi: `${user.nama_lengkap} berhasil login`, ip_address: req.ip,
    });

    delete user.password;
    res.json({ success: true, message: 'Login berhasil.', data: { token, user } });
  } catch (err) {
    next(err);
  }
};

exports.me = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { password_lama, password_baru } = req.body;
    const user = await UserModel.findByEmail(req.user.email);
    const isMatch = await bcrypt.compare(password_lama, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Password lama tidak sesuai.' });
    if (!password_baru || password_baru.length < 8) {
      return res.status(400).json({ success: false, message: 'Password baru minimal 8 karakter.' });
    }
    const hashed = await bcrypt.hash(password_baru, 10);
    await UserModel.update(user.id, { password: hashed });
    res.json({ success: true, message: 'Password berhasil diubah.' });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    await ActivityLogModel.create({
      user_id: req.user.id, aksi: 'LOGOUT', modul: 'auth',
      deskripsi: `${req.user.nama_lengkap} logout`, ip_address: req.ip,
    });
    res.json({ success: true, message: 'Logout berhasil.' });
  } catch (err) {
    next(err);
  }
};

// ------------------------------------------------------------------
// Verifikasi email (dipakai saat akun baru dibuat oleh Super Admin) —
// akun tidak bisa login sebelum kode OTP yang dikirim ke email diverifikasi.
// ------------------------------------------------------------------
exports.verifyEmail = async (req, res, next) => {
  try {
    const { email, kode } = req.body;
    if (!email || !kode) {
      return res.status(400).json({ success: false, message: 'Email dan kode OTP wajib diisi.' });
    }
    const user = await UserModel.findByEmail(email);
    if (!user) return res.status(404).json({ success: false, message: 'Akun dengan email tersebut tidak ditemukan.' });
    if (user.email_terverifikasi) {
      return res.status(400).json({ success: false, message: 'Email ini sudah terverifikasi. Silakan login.' });
    }

    const result = await verifyOtp(email, 'verifikasi_email', kode);
    if (!result.valid) return res.status(400).json({ success: false, message: result.reason });

    await UserModel.update(user.id, { email_terverifikasi: 1 });
    await ActivityLogModel.create({
      user_id: user.id, aksi: 'VERIFIKASI_EMAIL', modul: 'auth',
      deskripsi: `${user.nama_lengkap} berhasil memverifikasi email`, ip_address: req.ip,
    });

    res.json({ success: true, message: 'Email berhasil diverifikasi. Silakan login menggunakan akun Anda.' });
  } catch (err) {
    next(err);
  }
};

// Mengirim ulang kode OTP verifikasi email — dipakai pengguna baru yang belum
// menerima/kehilangan kode, atau Super Admin dari halaman Manajemen Pengguna.
exports.resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email wajib diisi.' });
    const user = await UserModel.findByEmail(email);
    if (!user) return res.status(404).json({ success: false, message: 'Akun dengan email tersebut tidak ditemukan.' });
    if (user.email_terverifikasi) {
      return res.status(400).json({ success: false, message: 'Email ini sudah terverifikasi.' });
    }

    await issueOtp(email, 'verifikasi_email', {
      judul: 'Kode Verifikasi Email E-KATARSIP',
      catatan: 'Masukkan kode ini di halaman Verifikasi Email untuk mengaktifkan akun Anda.',
    });

    res.json({ success: true, message: 'Kode OTP verifikasi baru telah dikirim ke email Anda.' });
  } catch (err) {
    next(err);
  }
};

// ------------------------------------------------------------------
// Lupa kata sandi — reset password via kode OTP yang dikirim ke email.
// ------------------------------------------------------------------
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email wajib diisi.' });

    const user = await UserModel.findByEmail(email);
    // Pesan generik dikembalikan baik email terdaftar maupun tidak, supaya
    // orang lain tidak bisa menebak email mana saja yang terdaftar di sistem.
    if (user && user.status === 'aktif') {
      await issueOtp(email, 'reset_password', {
        judul: 'Kode Reset Kata Sandi E-KATARSIP',
        catatan: 'Jika Anda tidak meminta reset kata sandi, segera hubungi Super Admin.',
      });
      await ActivityLogModel.create({
        user_id: user.id, aksi: 'LUPA_PASSWORD_REQUEST', modul: 'auth',
        deskripsi: `${user.nama_lengkap} meminta kode reset kata sandi`, ip_address: req.ip,
      });
    }

    res.json({ success: true, message: 'Jika email terdaftar, kode OTP reset kata sandi telah dikirim.' });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { email, kode, password_baru } = req.body;
    if (!email || !kode || !password_baru) {
      return res.status(400).json({ success: false, message: 'Email, kode OTP, dan password baru wajib diisi.' });
    }
    if (password_baru.length < 8) {
      return res.status(400).json({ success: false, message: 'Password baru minimal 8 karakter.' });
    }

    const user = await UserModel.findByEmail(email);
    if (!user) return res.status(404).json({ success: false, message: 'Akun dengan email tersebut tidak ditemukan.' });

    const result = await verifyOtp(email, 'reset_password', kode);
    if (!result.valid) return res.status(400).json({ success: false, message: result.reason });

    const hashed = await bcrypt.hash(password_baru, 10);
    await UserModel.update(user.id, { password: hashed });
    await ActivityLogModel.create({
      user_id: user.id, aksi: 'RESET_PASSWORD', modul: 'auth',
      deskripsi: `${user.nama_lengkap} berhasil mereset kata sandi melalui OTP email`, ip_address: req.ip,
    });

    res.json({ success: true, message: 'Kata sandi berhasil direset. Silakan login dengan kata sandi baru Anda.' });
  } catch (err) {
    next(err);
  }
};
