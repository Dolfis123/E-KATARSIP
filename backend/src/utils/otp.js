const crypto = require('crypto');
const OtpModel = require('../models/otp.model');
const { sendMail, otpEmailTemplate } = require('./email');

const MAX_ATTEMPTS = 5;

function generateCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

function hashCode(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}

function expiryMinutes() {
  return Number(process.env.OTP_EXPIRY_MINUTES) || 10;
}

// Membuat kode OTP baru, membatalkan kode lama yang belum dipakai untuk
// kombinasi email+tipe yang sama, menyimpan hash-nya, lalu mengirim email.
async function issueOtp(email, tipe, { judul, catatan } = {}) {
  await OtpModel.invalidatePrevious(email, tipe);

  const code = generateCode();
  const menit = expiryMinutes();
  const kedaluwarsa = new Date(Date.now() + menit * 60 * 1000);

  await OtpModel.create({ email, kode_hash: hashCode(code), tipe, kedaluwarsa });

  const subjectMap = {
    verifikasi_email: 'Kode Verifikasi Email — E-KATARSIP',
    reset_password: 'Kode Reset Kata Sandi — E-KATARSIP',
  };

  await sendMail({
    to: email,
    subject: subjectMap[tipe] || 'Kode OTP — E-KATARSIP',
    html: otpEmailTemplate({
      judul: judul || subjectMap[tipe],
      kode: code,
      menit,
      catatan,
    }),
    text: `Kode OTP Anda: ${code} (berlaku ${menit} menit)`,
  });

  return code;
}

// Memverifikasi kode OTP yang dimasukkan pengguna. Mengembalikan { valid, reason }.
async function verifyOtp(email, tipe, code) {
  const row = await OtpModel.findLatestActive(email, tipe);
  if (!row) return { valid: false, reason: 'Kode OTP tidak ditemukan atau sudah kedaluwarsa. Silakan minta kode baru.' };

  if (row.percobaan >= MAX_ATTEMPTS) {
    return { valid: false, reason: 'Terlalu banyak percobaan salah. Silakan minta kode OTP baru.' };
  }

  if (row.kode_hash !== hashCode(code)) {
    await OtpModel.incrementAttempt(row.id);
    return { valid: false, reason: 'Kode OTP tidak sesuai.' };
  }

  await OtpModel.markUsed(row.id);
  return { valid: true, row };
}

module.exports = { issueOtp, verifyOtp };
