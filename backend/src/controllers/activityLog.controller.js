const ActivityLogModel = require('../models/activityLog.model');

exports.list = async (req, res, next) => {
  try {
    const { page, limit, modul, user_id } = req.query;
    const result = await ActivityLogModel.findAll({ page, limit, modul, user_id });
    res.json({ success: true, data: result.data, pagination: { total: result.total, page: Number(page) || 1, limit: Number(limit) || 20 } });
  } catch (err) { next(err); }
};
