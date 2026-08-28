import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, KeyRound, Archive } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import PasswordInput from '../components/PasswordInput';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = minta OTP, 2 = masukkan OTP + password baru
  const [email, setEmail] = useState('');
  const [kode, setKode] = useState('');
  const [passwordBaru, setPasswordBaru] = useState('');
  const [konfirmasi, setKonfirmasi] = useState('');
  const [loading, setLoading] = useState(false);

  const requestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('Jika email terdaftar, kode OTP telah dikirim. Silakan periksa email Anda.');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengirim kode OTP.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    if (passwordBaru !== konfirmasi) {
      toast.error('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, kode, password_baru: passwordBaru });
      toast.success('Kata sandi berhasil direset. Silakan login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mereset kata sandi.');
    } finally {
      setLoading(false);
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
          <h2 className="text-xl font-bold text-gray-900">Lupa Kata Sandi</h2>
          <p className="mt-1 text-sm text-gray-500">
            {step === 1
              ? 'Masukkan email akun Anda, kami akan mengirimkan kode OTP untuk mereset kata sandi.'
              : 'Masukkan kode OTP yang dikirim ke email Anda beserta kata sandi baru.'}
          </p>

          {step === 1 ? (
            <form onSubmit={requestOtp} className="mt-6 space-y-4">
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
              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                {loading ? 'Mengirim...' : 'Kirim Kode OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={resetPassword} className="mt-6 space-y-4">
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
              <div>
                <label className="label-field">Kata Sandi Baru</label>
                <PasswordInput value={passwordBaru} onChange={(e) => setPasswordBaru(e.target.value)} required minLength={8} autoComplete="new-password" placeholder="Minimal 8 karakter" />
              </div>
              <div>
                <label className="label-field">Konfirmasi Kata Sandi Baru</label>
                <PasswordInput value={konfirmasi} onChange={(e) => setKonfirmasi(e.target.value)} required autoComplete="new-password" placeholder="Ulangi kata sandi baru" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                {loading ? 'Menyimpan...' : 'Reset Kata Sandi'}
              </button>
              <button type="button" onClick={() => setStep(1)} className="w-full text-center text-xs text-gray-500 hover:underline">
                Belum menerima kode? Kirim ulang
              </button>
            </form>
          )}

          <Link to="/login" className="mt-6 flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft size={15} /> Kembali ke halaman login
          </Link>
        </div>
      </div>
    </div>
  );
}
