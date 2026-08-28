const express = require('express');
const router = express.Router();
const arsipController = require('../controllers/arsip.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { upload } = require('../middlewares/upload.middleware');

router.use(verifyToken);

// Otorisasi hapus/ubah arsip & lampiran ditangani di controller berdasarkan
// kepemilikan (Super Admin bebas, Staf Admin hanya arsip miliknya sendiri).

// Rute statis ('sampah', 'lampiran') didaftarkan SEBELUM '/:id' agar tidak
// tertangkap oleh pola parameter dinamis tersebut.
router.get('/sampah', arsipController.trashList);

router.get('/', arsipController.list);
router.get('/:id', arsipController.detail);
router.post('/', upload.array('lampiran', 10), arsipController.create);
router.put('/:id', arsipController.update);
router.delete('/:id', arsipController.remove);

router.post('/:id/pulihkan', arsipController.restore);
router.delete('/:id/permanen', arsipController.permanentDelete);

router.post('/:id/lampiran', upload.array('lampiran', 10), arsipController.uploadLampiran);
router.get('/lampiran/:lampiranId/unduh', arsipController.downloadLampiran);
router.delete('/lampiran/:lampiranId', arsipController.deleteLampiran);

module.exports = router;
