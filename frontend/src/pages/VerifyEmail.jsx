import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, ArrowLeft, KeyRound, Archive, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [kode, setKode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/verify-email', { email, kode });
      toast.success('Email berhasil diverifikasi! Silakan login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memverifikasi email.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error('Masukkan email terlebih dahulu.');
      return;
    }
    setResending(true);
    try {
      await api.post('/auth/resend-verification', { email });
      toast.success('Kode OTP baru telah dikirim ke email Anda.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengirim ulang kode OTP.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-800 text-white">
            <Archive size={22} />
          </div>
          <div>
            <p className="font-bold text-primary-800">E-KATARSIP</p>
            <p className="text-xs text-gray-500">BAPPERIDA Papua Barat Daya</p>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2">
            <ShieldCheck size={22} className="text-primary-600" />
            <h2 className="text-xl font-bold text-gray-900">Verifikasi Email</h2>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Masukkan email dan kode OTP yang dikirim saat akun Anda dibuat untuk mengaktifkan akun.
          </p>

          <form onSubmit={handleVerify} className="mt-6 space-y-4">
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
              <label className="label-field">Kode OTP</label>
              <div className="relative">
                <KeyRound size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  required
                  inputMode="numeric"
                  maxLength={6}
                  value={kode}
                  onChange={(e) => setKode(e.target.value.replace(/\D/g, ''))}
                  placeholder="6 digit kode OTP"
                  className="input-field pl-10 tracking-widest"
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? 'Memverifikasi...' : 'Verifikasi Email'}
            </button>
            <button type="button" onClick={handleResend} disabled={resending} className="w-full text-center text-xs text-gray-500 hover:underline">
              {resending ? 'Mengirim...' : 'Belum menerima kode? Kirim ulang'}
            </button>
          </form>

          <Link to="/login" className="mt-6 flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft size={15} /> Kembali ke halaman login
          </Link>
        </div>
      </div>
    </div>
  );
}
