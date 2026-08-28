import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Tags, FileType2, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import api from '../services/api';

const TABS = [
  { key: 'sektor', label: 'Sektor', icon: Tags },
  { key: 'jenis-dokumen', label: 'Jenis Dokumen', icon: FileType2 },
  { key: 'opd', label: 'OPD Mitra', icon: Building2 },
];

export default function MasterData() {
  const [tab, setTab] = useState('sektor');
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/master/${tab}`);
      setItems(res.data.data);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { setForm({}); fetchData(); }, [tab, fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/master/${tab}`, form);
      toast.success('Data berhasil ditambahkan.');
      setForm({});
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menambahkan data.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus data ini?')) return;
    try {
      await api.delete(`/master/${tab}/${id}`);
      toast.success('Data berhasil dihapus.');
      fetchData();
    } catch (err) {
      toast.error('Gagal menghapus data. Mungkin masih digunakan oleh arsip lain.');
    }
  };

  return (
    <Layout title="Data Master">
      <div className="mb-5 flex gap-2 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              tab === t.key ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="card p-5">
          <p className="font-semibold text-gray-800 mb-4">Tambah {TABS.find((t) => t.key === tab).label}</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            {tab === 'sektor' && (
              <>
                <input required placeholder="Nama sektor" className="input-field" value={form.nama_sektor || ''} onChange={(e) => setForm((f) => ({ ...f, nama_sektor: e.target.value }))} />
                <input required placeholder="Kode (3 huruf, contoh: PTN)" maxLength={10} className="input-field" value={form.kode_sektor || ''} onChange={(e) => setForm((f) => ({ ...f, kode_sektor: e.target.value }))} />
              </>
            )}
            {tab === 'jenis-dokumen' && (
              <>
                <input required placeholder="Nama jenis dokumen" className="input-field" value={form.nama_jenis || ''} onChange={(e) => setForm((f) => ({ ...f, nama_jenis: e.target.value }))} />
                <input required placeholder="Kode (contoh: RPK)" maxLength={10} className="input-field" value={form.kode_jenis || ''} onChange={(e) => setForm((f) => ({ ...f, kode_jenis: e.target.value }))} />
                <input type="number" placeholder="Masa retensi (tahun)" className="input-field" value={form.masa_retensi_tahun || ''} onChange={(e) => setForm((f) => ({ ...f, masa_retensi_tahun: e.target.value }))} />
              </>
            )}
            {tab === 'opd' && (
              <>
                <input required placeholder="Nama OPD" className="input-field" value={form.nama_opd || ''} onChange={(e) => setForm((f) => ({ ...f, nama_opd: e.target.value }))} />
                <input placeholder="Singkatan" className="input-field" value={form.singkatan || ''} onChange={(e) => setForm((f) => ({ ...f, singkatan: e.target.value }))} />
                <input placeholder="Kontak person" className="input-field" value={form.kontak_person || ''} onChange={(e) => setForm((f) => ({ ...f, kontak_person: e.target.value }))} />
                <input placeholder="Email" className="input-field" value={form.email || ''} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                <input placeholder="Telepon" className="input-field" value={form.telepon || ''} onChange={(e) => setForm((f) => ({ ...f, telepon: e.target.value }))} />
              </>
            )}
            <button type="submit" className="btn-primary w-full"><Plus size={16} /> Tambah</button>
          </form>
        </div>

        <div className="card lg:col-span-2 overflow-x-auto">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{item.nama_sektor || item.nama_jenis || item.nama_opd}</p>
                      <p className="text-xs text-gray-400">{item.kode_sektor || item.kode_jenis || item.singkatan || ''}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(item.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && <tr><td className="px-4 py-8 text-center text-gray-400">Belum ada data.</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}
