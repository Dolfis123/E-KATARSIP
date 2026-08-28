import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import ArsipList from './pages/ArsipList';
import ArsipDetail from './pages/ArsipDetail';
import Sampah from './pages/Sampah';
import MasterData from './pages/MasterData';
import Users from './pages/Users';
import ActivityLog from './pages/ActivityLog';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/lupa-password" element={<ForgotPassword />} />
      <Route path="/verifikasi-email" element={<VerifyEmail />} />

      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/arsip" element={<ProtectedRoute><ArsipList /></ProtectedRoute>} />
      <Route path="/arsip/:id" element={<ProtectedRoute><ArsipDetail /></ProtectedRoute>} />
      <Route path="/sampah" element={<ProtectedRoute><Sampah /></ProtectedRoute>} />
      <Route path="/master-data" element={<ProtectedRoute><MasterData /></ProtectedRoute>} />
      <Route
        path="/users"
        element={
          <ProtectedRoute allowedRoles={['Super Admin']}>
            <Users />
          </ProtectedRoute>
        }
      />
      <Route
        path="/log-aktivitas"
        element={
          <ProtectedRoute allowedRoles={['Super Admin']}>
            <ActivityLog />
          </ProtectedRoute>
        }
      />
      <Route path="/profil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
