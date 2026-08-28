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
    // Wrapper utama dengan background yang beda antara mobile dan desktop
    <div className="min-h-screen flex bg-slate-50 lg:bg-white font-sans selection:bg-primary-500 selection:text-white">
      
      {/* ================= PANEL KIRI (BRANDING) ================= */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 px-16 py-14 text-white relative overflow-hidden">
        
        {/* Dekorasi Modern dengan efek Blur */}
        <div className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -left-32 -bottom-32 h-[500px] w-[500px] rounded-full bg-white/10 blur-3xl pointer-events-none" />

        {/* Header Logo */}
        <div className="relative flex items-center gap-4 animate-fade-in-down">
          <div className="rounded-xl bg-white/10 p-2 backdrop-blur-sm border border-white/20">
            <img src="/logo-papua-barat-daya.png" alt="Logo Provinsi Papua Barat Daya" className="h-12 w-12 object-contain drop-shadow-md" />
          </div>
          <div>
            <p className="font-semibold tracking-wide text-primary-100 text-sm uppercase">Pemerintah Provinsi</p>
            <p className="font-bold text-xl leading-tight">Papua Barat Daya</p>
          </div>
        </div>

        {/* Konten Tengah */}
        <div className="relative z-10 my-auto">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-md border border-white/20 shadow-xl">
            <Archive size={32} className="text-white" />
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight leading-tight mb-5 drop-shadow-sm">
            E-KATARSIP
          </h1>
          <p className="text-primary-100/90 text-lg leading-relaxed max-w-lg font-light">
            Pusat Arsip Digital Sub Bidang Perekonomian dan Sosial Budaya — Badan Perencanaan Pembangunan, Riset dan Inovasi Daerah (BAPPERIDA) Provinsi Papua Barat Daya.
          </p>
          
          <ul className="mt-10 space-y-4 text-primary-50">
            {[
              'Klasifikasi & penelusuran arsip otomatis',
              'Salinan digital (scan) & tautan (Google Drive, dsb.)',
              'Riwayat aktivitas untuk akuntabilitas pengelolaan arsip'
            ].map((item, index) => (
              <li key={index} className="flex items-start gap-3 group">
                <div className="mt-1.5 flex h-2 w-2 shrink-0 items-center justify-center rounded-full bg-accent-400 group-hover:scale-150 transition-transform" />
                <span className="text-base font-medium">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer Panel Kiri */}
        <p className="relative text-sm text-primary-200/60 font-medium">
          © {new Date().getFullYear()} BAPPERIDA Provinsi Papua Barat Daya <br />
          Mendukung <span className="text-white">Smart Governance</span>
        </p>
      </div>

      {/* ================= PANEL KANAN (FORM LOGIN) ================= */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center items-center p-4 sm:p-8 lg:p-12 relative z-10">
        
        {/* Kontainer Form - Berupa Card di Mobile, Menyatu di Desktop */}
        <div className="w-full max-w-[420px] bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:shadow-[0_8px_30px_rgb(0,0,0,0.08)] lg:shadow-none lg:bg-transparent p-8 sm:p-10 lg:p-0 border border-slate-100 lg:border-none transition-all">
          
          {/* Logo Mobile */}
          <div className="mb-8 flex flex-col items-center gap-3 lg:hidden text-center">
            <img src="/logo-papua-barat-daya.png" alt="Logo" className="h-16 w-16 object-contain drop-shadow-sm" />
            <div>
              <h2 className="font-extrabold text-xl text-slate-800 tracking-tight">E-KATARSIP</h2>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-1">BAPPERIDA Papua Barat Daya</p>
            </div>
          </div>

          <div className="text-center lg:text-left mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Selamat Datang 👋</h2>
            <p className="mt-2 text-sm text-slate-500">Silakan masuk menggunakan email kedinasan Anda.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Input Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 block">Alamat Email</label>
              <div className="relative group">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@papuabaratdaya.go.id"
                  className="input-field w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none"
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">Kata Sandi</label>
                <Link to="/lupa-password" className="text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline transition-colors">
                  Lupa kata sandi?
                </Link>
              </div>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                // Pastikan komponen ini menerima className atau membungkus inputnya dengan styling senada
              />
            </div>

            {/* Tombol Submit */}
            <button 
              type="submit" 
              disabled={loading} 
              className="btn-primary w-full py-3 mt-4 rounded-xl font-semibold text-sm shadow-md shadow-primary-500/30 hover:shadow-lg hover:shadow-primary-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Memproses...
                </span>
              ) : 'Masuk ke Sistem'}
            </button>
          </form>

          {/* Link Verifikasi */}
          <p className="mt-8 text-center text-sm text-slate-500">
            Akun baru belum bisa login?{' '}
            <Link to="/verifikasi-email" className="font-semibold text-primary-600 hover:text-primary-700 hover:underline transition-colors">
              Verifikasi di sini
            </Link>
          </p>

          {/* Kotak Info Demo (Dipercantik) */}
          <div className="mt-8 rounded-xl border border-primary-100 bg-primary-50/50 p-4 text-xs text-primary-900 shadow-inner">
            <div className="flex items-center gap-2 font-bold mb-2 text-primary-700">
              <Info size={16} />
              <span>Informasi Akun Demo</span>
            </div>
            <div className="space-y-1 font-medium bg-white/60 p-3 rounded-lg border border-primary-100">
              <div className="flex justify-between border-b border-primary-100/50 pb-1">
                <span className="text-slate-500">Email:</span>
                <span className="select-all">admin@ekatarsip.papuabaratdaya.go.id</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">Password:</span>
                <span className="select-all">Password123!</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}