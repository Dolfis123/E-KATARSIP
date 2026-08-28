const express = require('express');
const router = express.Router();
const masterController = require('../controllers/master.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');

router.use(verifyToken);

// Kedua peran (Super Admin & Staf Admin) boleh menambah data referensi
// (sektor/jenis dokumen/OPD) karena dibutuhkan sehari-hari saat mengarsip.
// Penghapusan dibatasi Super Admin saja agar data acuan tidak sengaja rusak.

router.get('/sektor', masterController.listSektor);
router.post('/sektor', masterController.createSektor);
router.delete('/sektor/:id', authorizeRoles('Super Admin'), masterController.deleteSektor);

router.get('/jenis-dokumen', masterController.listJenisDokumen);
router.post('/jenis-dokumen', masterController.createJenisDokumen);
router.delete('/jenis-dokumen/:id', authorizeRoles('Super Admin'), masterController.deleteJenisDokumen);

router.get('/opd', masterController.listOpd);
router.post('/opd', masterController.createOpd);
router.put('/opd/:id', masterController.updateOpd);
router.delete('/opd/:id', authorizeRoles('Super Admin'), masterController.deleteOpd);

router.get('/roles', masterController.listRoles);

module.exports = router;
