import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Archive, Info } from 'lucide-react';
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
    <div className="min-h-screen flex bg-gray-50 font-sans text-gray-900">
      
      {/* PANEL KIRI (BRANDING) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-emerald-900 px-12 py-10 text-white relative">
        
        {/* Header Logo */}
        <div className="flex items-center gap-4 z-10">
          <div className="rounded-xl bg-white/10 p-2 border border-white/20">
            <img src="/logo-papua-barat-daya.png" alt="Logo" className="h-12 w-12 object-contain" />
          </div>
          <div>
            <p className="font-semibold text-emerald-100 text-xs uppercase tracking-wider">Pemerintah Provinsi</p>
            <p className="font-bold text-lg leading-tight">Papua Barat Daya</p>
          </div>
        </div>

        {/* Konten Tengah */}
        <div className="z-10 my-auto pt-10">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm border border-white/20">
            <Archive size={28} className="text-white" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
            E-KATARSIP
          </h1>
          <p className="text-emerald-50/90 text-base lg:text-lg leading-relaxed max-w-lg mb-8">
            Pusat Arsip Digital Sub Bidang Perekonomian dan Sosial Budaya — BAPPERIDA Provinsi Papua Barat Daya.
          </p>
          
          <ul className="space-y-4">
            {[
              'Klasifikasi & penelusuran arsip otomatis',
              'Salinan digital (scan) & tautan terintegrasi',
              'Riwayat aktivitas untuk akuntabilitas pengelolaan arsip'
            ].map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="mt-1.5 block h-2 w-2 shrink-0 rounded-full bg-yellow-400"></span>
                <span className="text-sm font-medium text-emerald-50">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer Panel Kiri */}
        <div className="z-10 mt-8 text-xs text-emerald-200/70">
          <p>© {new Date().getFullYear()} BAPPERIDA Provinsi Papua Barat Daya.</p>
          <p>Mendukung <span className="font-semibold text-white">Smart Governance</span></p>
        </div>
      </div>

      {/* PANEL KANAN (FORM LOGIN) */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center items-center p-6 sm:p-10 relative z-10">
        
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl lg:shadow-none lg:bg-transparent p-8 lg:p-0 border border-gray-100 lg:border-none">
          
          {/* Logo Mobile */}
          <div className="mb-8 flex flex-col items-center gap-3 lg:hidden text-center">
            <img src="/logo-papua-barat-daya.png" alt="Logo" className="h-14 w-14 object-contain" />
            <div>
              <h2 className="font-extrabold text-xl text-gray-900 tracking-tight">E-KATARSIP</h2>
              <p className="text-xs font-medium text-gray-500 uppercase">BAPPERIDA Papua Barat Daya</p>
            </div>
          </div>

          <div className="text-center lg:text-left mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Selamat Datang 👋</h2>
            <p className="mt-2 text-sm text-gray-500">Silakan masuk menggunakan email kedinasan Anda.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Input Email */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block">Alamat Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@papuabaratdaya.go.id"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 focus:bg-white transition-all outline-none"
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">Kata Sandi</label>
                <Link to="/lupa-password" className="text-xs font-semibold text-emerald-700 hover:underline">
                  Lupa kata sandi?
                </Link>
              </div>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {/* Tombol Submit */}
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-3 mt-4 bg-emerald-700 text-white rounded-xl font-semibold text-sm hover:bg-emerald-800 transition-all disabled:opacity-70 flex justify-center items-center gap-2"
            >
              {loading ? 'Memproses...' : 'Masuk ke Sistem'}
            </button>
          </form>

          {/* Info Akun Demo */}
          {/* <div className="mt-8 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-xs text-emerald-900">
            <div className="flex items-center gap-2 font-bold mb-3 text-emerald-800">
              <Info size={16} />
              <span>Informasi Akun Demo</span>
            </div>
            <div className="space-y-2 font-medium bg-white p-3 rounded-lg border border-emerald-100">
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500">Email:</span>
                <span className="select-all text-gray-800">admin@ekatarsip.papuabaratdaya.go.id</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-gray-500">Password:</span>
                <span className="select-all text-gray-800">Password123!</span>
              </div>
            </div>
          </div> */}

        </div>
      </div>
    </div>
  );
}