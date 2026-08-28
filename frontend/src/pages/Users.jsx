import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Pencil, Send, ShieldCheck, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import PasswordInput from '../components/PasswordInput';
import api from '../services/api';

const initialForm = { nama_lengkap: '', nip: '', email: '', password: '', jabatan: '', role_id: '' };

export default function Users() {
  const [items, setItems] = useState([]);
  const [roles, setRoles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setItems(res.data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    api.get('/master/roles').then((res) => setRoles(res.data.data));
  }, [fetchData]);

  const openCreate = () => { setEditing(null); setForm(initialForm); setShowForm(true); };
  const openEdit = (u) => { setEditing(u); setForm({ ...u, password: '' }); setShowForm(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await api.put(`/users/${editing.id}`, payload);
        toast.success('Data pengguna diperbarui.');
      } else {
        const res = await api.post('/users', form);
        toast.success(res.data.message || 'Pengguna baru berhasil ditambahkan. Kode OTP verifikasi telah dikirim ke emailnya.');
      }
      setShowForm(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan data pengguna.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus pengguna ini?')) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('Pengguna berhasil dihapus.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus pengguna.');
    }
  };

  const handleResendOtp = async (email) => {
    try {
      await api.post('/auth/resend-verification', { email });
      toast.success(`Kode OTP verifikasi baru telah dikirim ke ${email}.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengirim ulang kode OTP.');
    }
  };

  return (
    <Layout title="Manajemen Pengguna">
      <div className="mb-5 flex justify-end">
        <button onClick={openCreate} className="btn-primary"><Plus size={16} /> Tambah Pengguna</button>
      </div>

      <div className="card overflow-x-auto">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Jabatan</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Verifikasi Email</th>
                <th className="px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{u.nama_lengkap}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3 text-gray-500">{u.jabatan}</td>
                  <td className="px-4 py-3"><span className="badge bg-primary-50 text-primary-700">{u.nama_role}</span></td>
                  <td className="px-4 py-3"><Badge status={u.status} /></td>
                  <td className="px-4 py-3">
                    {u.email_terverifikasi ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-green-600"><ShieldCheck size={14} /> Terverifikasi</span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="flex items-center gap-1 text-xs font-medium text-amber-600"><ShieldAlert size={14} /> Belum</span>
                        <button onClick={() => handleResendOtp(u.email)} title="Kirim ulang kode OTP" className="rounded p-1 text-primary-600 hover:bg-primary-50">
                          <Send size={13} />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(u)} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"><Pencil size={15} /></button>
                      <button onClick={() => handleDelete(u.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Ubah Pengguna' : 'Tambah Pengguna'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-field">Nama Lengkap *</label>
            <input required className="input-field" value={form.nama_lengkap} onChange={(e) => setForm((f) => ({ ...f, nama_lengkap: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">NIP</label>
              <input className="input-field" value={form.nip || ''} onChange={(e) => setForm((f) => ({ ...f, nip: e.target.value }))} />
            </div>
            <div>
              <label className="label-field">Jabatan</label>
              <input className="input-field" value={form.jabatan || ''} onChange={(e) => setForm((f) => ({ ...f, jabatan: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label-field">Email *</label>
            <input type="email" required disabled={!!editing} className="input-field disabled:bg-gray-100" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className="label-field">{editing ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password *'}</label>
            <PasswordInput required={!editing} icon={false} minLength={8} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} autoComplete="new-password" />
          </div>
          {!editing && (
            <p className="-mt-2 text-xs text-gray-400">Kode OTP verifikasi akan dikirim ke email pengguna. Akun tidak dapat login sebelum diverifikasi.</p>
          )}
          <div>
            <label className="label-field">Role *</label>
            <select required className="input-field" value={form.role_id} onChange={(e) => setForm((f) => ({ ...f, role_id: e.target.value }))}>
              <option value="">Pilih role</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.nama_role}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Batal</button>
            <button type="submit" className="btn-primary">Simpan</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
