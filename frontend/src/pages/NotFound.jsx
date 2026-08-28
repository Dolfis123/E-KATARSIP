import { Link } from 'react-router-dom';
import { FileWarning } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 text-center px-4">
      <FileWarning size={48} className="text-primary-300 mb-4" />
      <h1 className="text-3xl font-bold text-gray-800">404</h1>
      <p className="text-gray-500 mt-1 mb-6">Halaman yang Anda cari tidak ditemukan.</p>
      <Link to="/dashboard" className="btn-primary">Kembali ke Dashboard</Link>
    </div>
  );
}
