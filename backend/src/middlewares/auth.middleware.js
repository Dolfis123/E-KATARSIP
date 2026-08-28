const jwt = require('jsonwebtoken');
require('dotenv').config();

// Memverifikasi token JWT pada header Authorization: Bearer <token>
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token akses tidak ditemukan. Silakan login kembali.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Token tidak valid atau sudah kedaluwarsa.' });
    }
    req.user = decoded; // { id, email, role_id, nama_role }
    next();
  });
}

// Membatasi akses hanya untuk role tertentu, contoh: authorizeRoles('Super Admin')
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.nama_role)) {
      return res.status(403).json({ success: false, message: 'Anda tidak memiliki hak akses untuk aksi ini.' });
    }
    next();
  };
}

module.exports = { verifyToken, authorizeRoles };
