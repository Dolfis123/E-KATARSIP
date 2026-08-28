const express = require('express');
const router = express.Router();
const notifikasiController = require('../controllers/notifikasi.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.use(verifyToken);

router.get('/', notifikasiController.list);
router.get('/unread-count', notifikasiController.unreadCount);
router.patch('/:id/baca', notifikasiController.markRead);
router.patch('/baca-semua', notifikasiController.markAllRead);

module.exports = router;
