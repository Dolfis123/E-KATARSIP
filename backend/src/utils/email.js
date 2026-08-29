const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (!process.env.SMTP_HOST) return null; // Mode pengembangan: tidak ada SMTP terkonfigurasi
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transporter;
}

// Mengirim email. Jika SMTP belum dikonfigurasi (SMTP_HOST kosong), isi email
// hanya dicetak ke console/log server — memudahkan pengujian tanpa server SMTP
// sungguhan, namun TIDAK disarankan untuk lingkungan produksi.
async function sendMail({ to, subject, html, text }) {
  const t = getTransporter();
  if (!t) {
    console.log('========================================');
    console.log('✉️  [MODE DEV] SMTP belum dikonfigurasi — email berikut TIDAK benar-benar dikirim:');
    console.log(`   Kepada : ${to}`);
    console.log(`   Perihal: ${subject}`);
    console.log(`   Isi    : ${text || html}`);
    console.log('========================================');
    return { simulated: true };
  }

  return t.sendMail({
    from: process.env.SMTP_FROM || 'E-KATARSIP <kdolfis@gmail.com>',
    to,
    subject,
    html,
    text,
  });
}

function otpEmailTemplate({ judul, kode, menit, catatan }) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
      <h2 style="color:#1e3a5f;margin-bottom:4px;">E-KATARSIP</h2>
      <p style="color:#6b7280;font-size:13px;margin-top:0;">BAPPERIDA Provinsi Papua Barat Daya</p>
      <h3 style="color:#111827;">${judul}</h3>
      <p style="color:#374151;font-size:14px;">Gunakan kode berikut untuk melanjutkan proses:</p>
      <p style="font-size:32px;font-weight:bold;letter-spacing:6px;color:#1e3a5f;background:#eff3f7;padding:14px 0;text-align:center;border-radius:8px;">${kode}</p>
      <p style="color:#6b7280;font-size:13px;">Kode ini berlaku selama ${menit} menit. ${catatan || 'Jangan bagikan kode ini kepada siapa pun, termasuk pihak yang mengaku dari tim IT.'}</p>
      <p style="color:#9ca3af;font-size:12px;margin-top:24px;">Jika Anda tidak meminta kode ini, abaikan email ini.</p>
    </div>
  `;
}

module.exports = { sendMail, otpEmailTemplate };
