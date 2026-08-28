const NotifikasiModel = require('../models/notifikasi.model');

exports.list = async (req, res, next) => {
  try {
    const data = await NotifikasiModel.findForUser(req.user.id, { limit: req.query.limit || 15 });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.unreadCount = async (req, res, next) => {
  try {
    const total = await NotifikasiModel.countUnread(req.user.id);
    res.json({ success: true, data: { total } });
  } catch (err) {
    next(err);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    await NotifikasiModel.markRead(req.params.id, req.user.id);
    res.json({ success: true, message: 'Notifikasi ditandai sudah dibaca.' });
  } catch (err) {
    next(err);
  }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await NotifikasiModel.markAllRead(req.user.id);
    res.json({ success: true, message: 'Semua notifikasi ditandai sudah dibaca.' });
  } catch (err) {
    next(err);
  }
};
