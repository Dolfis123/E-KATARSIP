// Script untuk membuat ulang password hash default & memverifikasi seed data.
// Jalankan: npm run seed  (setelah schema.sql & seed.sql diimpor ke MySQL)
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function run() {
  const passwordDefault = 'Password123!';
  const hash = await bcrypt.hash(passwordDefault, 10);

  const emails = [
    'admin@gmail.com',
    'staff@gmail.com',
  ];

  for (const email of emails) {
    await pool.query('UPDATE users SET password = ? WHERE email = ?', [hash, email]);
  }

  console.log('✅ Seed password berhasil diperbarui.');
  console.log(`   Semua akun contoh menggunakan password: ${passwordDefault}`);
  console.log('   Akun tersedia:');
  emails.forEach((e) => console.log('   -', e));
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Gagal menjalankan seed:', err.message);
  process.exit(1);
});
