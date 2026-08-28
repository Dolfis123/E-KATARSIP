import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Archive } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Login berhasil! Selamat datang kembali.');
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (err) {
      const code = err.response?.data?.code;
      toast.error(err.response?.data?.message || 'Login gagal. Periksa kembali email dan password Anda.');
      if (code === 'EMAIL_BELUM_TERVERIFIKASI') {
        setTimeout(() => navigate('/verifikasi-email', { state: { email } }), 800);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Panel kiri - branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-primary-800 px-14 py-12 text-white relative overflow-hidden">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary-700/40" />
        <div className="absolute -left-16 bottom-0 h-72 w-72 rounded-full bg-primary-700/30" />

        <div className="relative flex items-center gap-3">
          <img src="/logo-papua-barat-daya.png" alt="Logo Provinsi Papua Barat Daya" className="h-14 w-14 object-contain" />
          <div>
            <p className="font-bold text-lg leading-tight">Pemerintah Provinsi</p>
            <p className="font-bold text-lg leading-tight">Papua Barat Daya</p>
          </div>
        </div>

        <div className="relative">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
            <Archive size={28} />
          </div>
          <h1 className="text-4xl font-extrabold leading-tight mb-4">E-KATARSIP</h1>
          <p className="text-primary-100 text-lg leading-relaxed max-w-md">
            Pusat Arsip Digital Sub Bidang Perekonomian dan Sosial Budaya —
            Badan Perencanaan Pembangunan, Riset dan Inovasi Daerah (BAPPERIDA)
            Provinsi Papua Barat Daya.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-primary-100">
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent-500" /> Klasifikasi &amp; penelusuran arsip otomatis</li>
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent-500" /> Salinan digital (scan) &amp; tautan (Google Drive, dsb.)</li>
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent-500" /> Riwayat aktivitas untuk akuntabilitas pengelolaan arsip</li>
          </ul>
        </div>

        <p className="relative text-xs text-primary-300">© {new Date().getFullYear()} BAPPERIDA Provinsi Papua Barat Daya — Mendukung Smart Governance</p>
      </div>

      {/* Panel kanan - form login */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center px-6 sm:px-16 py-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <img src="/logo-papua-barat-daya.png" alt="Logo" className="h-12 w-12 object-contain" />
            <div>
              <p className="font-bold text-primary-800">E-KATARSIP</p>
              <p className="text-xs text-gray-500">BAPPERIDA Papua Barat Daya</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900">Masuk ke Akun Anda</h2>
          <p className="mt-1.5 text-sm text-gray-500">Silakan masuk menggunakan akun kedinasan Anda.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="label-field">Alamat Email</label>
              <div className="relative">
                <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@papuabaratdaya.go.id"
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="label-field">Kata Sandi</label>
                <Link to="/lupa-password" className="text-xs font-medium text-primary-600 hover:underline">Lupa kata sandi?</Link>
              </div>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            Akun baru belum bisa login?{' '}
            <Link to="/verifikasi-email" className="font-medium text-primary-600 hover:underline">Verifikasi email di sini</Link>
          </p>

          <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-xs text-gray-500">
            <p className="font-semibold text-gray-600 mb-1">Akun Demo</p>
            <p>Email: admin@ekatarsip.papuabaratdaya.go.id</p>
            <p>Password: Password123!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
