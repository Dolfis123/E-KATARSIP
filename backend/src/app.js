const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const { notFound, errorHandler } = require('./middlewares/error.middleware');

const authRoutes = require('./routes/auth.routes');
const arsipRoutes = require('./routes/arsip.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const userRoutes = require('./routes/user.routes');
const masterRoutes = require('./routes/master.routes');
const activityLogRoutes = require('./routes/activityLog.routes');
const notifikasiRoutes = require('./routes/notifikasi.routes');

const app = express();

// CLIENT_URL boleh berisi lebih dari satu origin dipisah koma, mis.
// "http://localhost:5173,https://arsip.papuabaratdaya.go.id".
// Saat berjalan di belakang Nginx satu origin (lihat panduan Docker),
// boleh dikosongkan / diisi "*" karena permintaan bersifat same-origin.
const allowedOrigins = (process.env.CLIENT_URL || '*').split(',').map((s) => s.trim());

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Ditolak oleh kebijakan CORS.'));
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true }));

// File statis hasil unggahan (scan arsip)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'E-KATARSIP API berjalan normal.', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/arsip', arsipRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/activity-log', activityLogRoutes);
app.use('/api/notifikasi', notifikasiRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
