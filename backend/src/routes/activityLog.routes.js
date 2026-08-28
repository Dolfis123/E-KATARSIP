const express = require('express');
const router = express.Router();
const controller = require('../controllers/activityLog.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');

// Log aktivitas adalah alat audit — hanya Super Admin yang dapat melihatnya.
router.get('/', verifyToken, authorizeRoles('Super Admin'), controller.list);

module.exports = router;
