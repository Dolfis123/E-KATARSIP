import { useEffect, useState, useCallback } from 'react';
import { RotateCcw, Trash2, FileArchive } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, addDays, differenceInCalendarDays } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import Layout from '../components/Layout';
import Pagination from '../components/Pagination';
import api from '../services/api';

const RETENSI_HARI = 30;

export default function Sampah() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(9);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/arsip/sampah', { params: { page, limit } });
      setItems(res.data.data);
      setTotal(res.data.pagination.total);
    } catch (err) {
      toast.error('Gagal memuat data Sampah.');
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRestore = async (id, judul) => {
    if (!confirm(`Pulihkan arsip "${judul}" dari Sampah?`)) return;
    try {
      await api.post(`/arsip/${id}/pulihkan`);
      toast.success('Arsip berhasil dipulihkan.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memulihkan arsip.');
    }
  };

  const handlePermanentDelete = async (id, judul) => {
    if (!confirm(`Hapus permanen arsip "${judul}"? Tindakan ini TIDAK DAPAT DIBATALKAN — seluruh berkas lampirannya juga akan terhapus.`)) return;
    try {
      await api.delete(`/arsip/${id}/permanen`);
      toast.success('Arsip berhasil dihapus permanen.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus permanen arsip.');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <Layout title="Sampah">
      <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Arsip yang dihapus akan disimpan di sini selama {RETENSI_HARI} hari sebelum dihapus permanen secara otomatis oleh sistem. Pulihkan arsip di sini jika terhapus secara tidak sengaja.
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <FileArchive size={40} className="text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Sampah kosong</p>
          <p className="text-sm text-gray-400">Arsip yang dihapus akan muncul di sini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((a) => {
            const purgeDate = a.dihapus_pada ? addDays(new Date(a.dihapus_pada), RETENSI_HARI) : null;
            const sisaHari = purgeDate ? Math.max(differenceInCalendarDays(purgeDate, new Date()), 0) : null;
            return (
              <div key={a.id} className="card p-5 flex flex-col opacity-90">
                <span className="text-xs font-mono text-primary-700 bg-primary-50 rounded px-2 py-1 w-fit">{a.nomor_klasifikasi}</span>
                <p className="font-semibold text-gray-900 mt-2 line-clamp-2">{a.judul}</p>
                <p className="text-xs text-gray-500 mt-1">{a.nama_jenis}{a.nama_sektor ? ` · ${a.nama_sektor}` : ''}</p>
                <p className="text-xs text-gray-400 mt-2">
                  Dihapus: {a.dihapus_pada ? format(new Date(a.dihapus_pada), 'd MMMM yyyy, HH:mm', { locale: localeId }) : '—'}
                </p>
                {purgeDate && (
                  <p className="text-xs font-medium text-red-500 mt-1">
                    {sisaHari > 0 ? `Terhapus permanen dalam ${sisaHari} hari` : 'Akan dihapus permanen segera'}
                  </p>
                )}
                <div className="mt-4 flex items-center justify-end gap-2 border-t pt-3">
                  <button onClick={() => handleRestore(a.id, a.judul)} className="btn-secondary text-xs px-3 py-1.5">
                    <RotateCcw size={14} /> Pulihkan
                  </button>
                  <button onClick={() => handlePermanentDelete(a.id, a.judul)} className="btn-danger text-xs px-3 py-1.5">
                    <Trash2 size={14} /> Hapus Permanen
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </Layout>
  );
}
