import { useState } from 'react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import PasswordInput from '../components/PasswordInput';

export default function Profile() {
  const { user } = useAuth();
  const [form, setForm] = useState({ password_lama: '', password_baru: '', konfirmasi: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password_baru !== form.konfirmasi) {
      toast.error('Konfirmasi password baru tidak cocok.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/auth/change-password', form);
      toast.success('Password berhasil diperbarui.');
      setForm({ password_lama: '', password_baru: '', konfirmasi: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout title="Pengaturan Akun">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="card p-6 text-center lg:col-span-1">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary-600 text-2xl font-bold text-white">
            {user?.nama_lengkap?.charAt(0)}
          </div>
          <p className="mt-4 font-semibold text-gray-900">{user?.nama_lengkap}</p>
          <p className="text-sm text-gray-500">{user?.jabatan}</p>
          <span className="badge bg-primary-50 text-primary-700 mt-3">{user?.nama_role}</span>
          <div className="mt-5 space-y-2 text-left text-sm border-t pt-4">
            <p className="text-gray-400">NIP</p>
            <p className="text-gray-700 font-medium">{user?.nip || '—'}</p>
            <p className="text-gray-400 mt-2">Email</p>
            <p className="text-gray-700 font-medium">{user?.email}</p>
            <p className="text-gray-400 mt-2">Sub Bidang</p>
            <p className="text-gray-700 font-medium">{user?.sub_bidang}</p>
          </div>
        </div>

        <div className="card p-6 lg:col-span-2">
          <p className="font-semibold text-gray-800 mb-4">Ubah Kata Sandi</p>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="label-field">Password Lama</label>
              <PasswordInput required icon={false} value={form.password_lama} onChange={(e) => setForm((f) => ({ ...f, password_lama: e.target.value }))} autoComplete="current-password" />
            </div>
            <div>
              <label className="label-field">Password Baru</label>
              <PasswordInput required icon={false} minLength={8} value={form.password_baru} onChange={(e) => setForm((f) => ({ ...f, password_baru: e.target.value }))} autoComplete="new-password" placeholder="Minimal 8 karakter" />
            </div>
            <div>
              <label className="label-field">Konfirmasi Password Baru</label>
              <PasswordInput required icon={false} value={form.konfirmasi} onChange={(e) => setForm((f) => ({ ...f, konfirmasi: e.target.value }))} autoComplete="new-password" />
            </div>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Menyimpan...' : 'Perbarui Password'}</button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
