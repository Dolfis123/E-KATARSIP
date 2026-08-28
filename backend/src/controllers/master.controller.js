const MasterModel = require('../models/master.model');

exports.listSektor = async (req, res, next) => {
  try {
    res.json({ success: true, data: await MasterModel.sektor.findAll() });
  } catch (err) { next(err); }
};
exports.createSektor = async (req, res, next) => {
  try {
    const { nama_sektor, kode_sektor } = req.body;
    const id = await MasterModel.sektor.create(nama_sektor, kode_sektor.toUpperCase());
    res.status(201).json({ success: true, message: 'Sektor berhasil ditambahkan.', data: { id } });
  } catch (err) { next(err); }
};
exports.deleteSektor = async (req, res, next) => {
  try {
    await MasterModel.sektor.delete(req.params.id);
    res.json({ success: true, message: 'Sektor berhasil dihapus.' });
  } catch (err) { next(err); }
};

exports.listJenisDokumen = async (req, res, next) => {
  try {
    res.json({ success: true, data: await MasterModel.jenisDokumen.findAll() });
  } catch (err) { next(err); }
};
exports.createJenisDokumen = async (req, res, next) => {
  try {
    const { nama_jenis, kode_jenis, masa_retensi_tahun } = req.body;
    const id = await MasterModel.jenisDokumen.create(nama_jenis, kode_jenis.toUpperCase(), masa_retensi_tahun);
    res.status(201).json({ success: true, message: 'Jenis dokumen berhasil ditambahkan.', data: { id } });
  } catch (err) { next(err); }
};
exports.deleteJenisDokumen = async (req, res, next) => {
  try {
    await MasterModel.jenisDokumen.delete(req.params.id);
    res.json({ success: true, message: 'Jenis dokumen berhasil dihapus.' });
  } catch (err) { next(err); }
};

exports.listOpd = async (req, res, next) => {
  try {
    res.json({ success: true, data: await MasterModel.opd.findAll() });
  } catch (err) { next(err); }
};
exports.createOpd = async (req, res, next) => {
  try {
    const id = await MasterModel.opd.create(req.body);
    res.status(201).json({ success: true, message: 'OPD berhasil ditambahkan.', data: { id } });
  } catch (err) { next(err); }
};
exports.updateOpd = async (req, res, next) => {
  try {
    await MasterModel.opd.update(req.params.id, req.body);
    res.json({ success: true, message: 'OPD berhasil diperbarui.' });
  } catch (err) { next(err); }
};
exports.deleteOpd = async (req, res, next) => {
  try {
    await MasterModel.opd.delete(req.params.id);
    res.json({ success: true, message: 'OPD berhasil dihapus.' });
  } catch (err) { next(err); }
};

exports.listRoles = async (req, res, next) => {
  try {
    res.json({ success: true, data: await MasterModel.roles.findAll() });
  } catch (err) { next(err); }
};
