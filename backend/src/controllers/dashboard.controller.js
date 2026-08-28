const ArsipModel = require('../models/arsip.model');
const UserModel = require('../models/user.model');
const { pool } = require('../config/db');

exports.summary = async (req, res, next) => {
  try {
    const [totalArsip, sektorBreakdown, jenisBreakdown, trend, recent, totalUsers] = await Promise.all([
      ArsipModel.countAll(),
      ArsipModel.countBySektor(),
      ArsipModel.countByJenis(),
      ArsipModel.trendPerBulan(),
      ArsipModel.recent(6),
      UserModel.countAll(),
    ]);

    const [totalLampiran] = await pool.query(
      `SELECT COUNT(*) AS total, COALESCE(SUM(al.ukuran_file_kb),0) AS total_kb
       FROM arsip_lampiran al JOIN arsip a ON al.arsip_id = a.id
       WHERE al.jenis_lampiran = 'file' AND a.dihapus_pada IS NULL`
    );
    const [totalTautan] = await pool.query(
      `SELECT COUNT(*) AS total FROM arsip_lampiran al JOIN arsip a ON al.arsip_id = a.id
       WHERE al.jenis_lampiran = 'link' AND a.dihapus_pada IS NULL`
    );
    const [totalTanpaLampiran] = await pool.query(
      `SELECT COUNT(*) AS total FROM arsip a
       WHERE a.dihapus_pada IS NULL AND NOT EXISTS (SELECT 1 FROM arsip_lampiran al WHERE al.arsip_id = a.id)`
    );

    res.json({
      success: true,
      data: {
        totalArsip,
        totalUsers,
        totalLampiran: totalLampiran[0].total,
        totalTautan: totalTautan[0].total,
        totalTanpaLampiran: totalTanpaLampiran[0].total,
        totalPenyimpananMB: Math.round((totalLampiran[0].total_kb || 0) / 1024 * 10) / 10,
        sektorBreakdown,
        jenisBreakdown,
        trend,
        recent,
      },
    });
  } catch (err) {
    next(err);
  }
};
