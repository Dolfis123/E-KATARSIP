const cron = require('node-cron');
const app = require('./app');
const { testConnection } = require('./config/db');
const { purgeExpiredTrash } = require('./jobs/purgeTrash.job');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log('========================================');
  console.log(' E-KATARSIP API — BAPPERIDA Papua Barat Daya');
  console.log(`  Server berjalan di http://localhost:${PORT}`);
  console.log('========================================');
  await testConnection();

  // Jalankan pembersihan Sampah otomatis sekali saat server baru menyala,
  // lalu jadwalkan berjalan setiap hari pukul 03:00.
  purgeExpiredTrash();
  cron.schedule('0 3 * * *', purgeExpiredTrash);
});
