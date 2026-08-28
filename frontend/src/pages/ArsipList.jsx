import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Filter, Eye, Trash2, Pencil, FileArchive, Paperclip } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import Layout from '../components/Layout';
import Badge from '../components/Badge';
import Pagination from '../components/Pagination';
import ArsipFormModal from '../components/ArsipFormModal';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ArsipList() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(9);
  const [search, setSearch] = useState('');
  const [jenisList, setJenisList] = useState([]);
  const [sektorList, setSektorList] = useState([]);
  const [filters, setFilters] = useState({ jenis_dokumen_id: '', sektor_id: '' });
  const [showFilter, setShowFilter] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingArsip, setEditingArsip] = useState(null);
  const [loading, setLoading] = useState(true);

  const canManage = (item) => user?.nama_role === 'Super Admin' || item.diinput_oleh === user?.id;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit, search, ...filters };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const res = await api.get('/arsip', { params });
      setItems(res.data.data);
      setTotal(res.data.pagination.total);
    } catch (err) {
      toast.error('Gagal memuat data arsip.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, filters]);

  useEffect(() => {
    api.get('/master/jenis-dokumen').then((res) => setJenisList(res.data.data));
    api.get('/master/sektor').then((res) => setSektorList(res.data.data));
  }, []);

  useEffect(() => {
    const timeout = setTimeout(fetchData, 300);
    return () => clearTimeout(timeout);
  }, [fetchData]);

  const handleDelete = async (id, judul) => {
    if (!confirm(`Pindahkan arsip "${judul}" ke Sampah? Arsip dapat dipulihkan dalam 30 hari sebelum dihapus permanen.`)) return;
    try {
      await api.delete(`/arsip/${id}`);
      toast.success('Arsip dipindahkan ke Sampah.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memindahkan arsip ke Sampah.');
    }
  };

  const openEdit = (item) => { setEditingArsip(item); setShowForm(true); };
  const openCreate = () => { setEditingArsip(null); setShowForm(true); };

  const totalPages = Math.ceil(total / limit);

  return (
    <Layout title="Katalog Arsip">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
        <div className="relative flex-1 max-w-md">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari judul, kata kunci, nomor klasifikasi..."
            className="input-field pl-10"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowFilter((v) => !v)} className="btn-secondary">
            <Filter size={16} /> Filter
          </button>
          <button onClick={openCreate} className="btn-primary">
            <Plus size={16} /> Tambah Arsip
          </button>
        </div>
      </div>

      {showFilter && (
        <div className="card p-4 mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select className="input-field" value={filters.jenis_dokumen_id} onChange={(e) => { setFilters((f) => ({ ...f, jenis_dokumen_id: e.target.value })); setPage(1); }}>
            <option value="">Semua Jenis Dokumen</option>
            {jenisList.map((j) => <option key={j.id} value={j.id}>{j.nama_jenis}</option>)}
          </select>
          <select className="input-field" value={filters.sektor_id} onChange={(e) => { setFilters((f) => ({ ...f, sektor_id: e.target.value })); setPage(1); }}>
            <option value="">Semua Sektor</option>
            {sektorList.map((s) => <option key={s.id} value={s.id}>{s.nama_sektor}</option>)}
          </select>
        </div>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <FileArchive size={40} className="text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Belum ada arsip yang cocok</p>
          <p className="text-sm text-gray-400">Coba ubah kata kunci pencarian atau filter Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((a) => (
            <div key={a.id} className="card p-5 flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-mono text-primary-700 bg-primary-50 rounded px-2 py-1">{a.nomor_klasifikasi}</span>
                <Badge status={a.tingkat_kerahasiaan} />
              </div>
              <p className="font-semibold text-gray-900 line-clamp-2">{a.judul}</p>
              <p className="text-xs text-gray-500 mt-1">{a.nama_jenis}{a.nama_sektor ? ` · ${a.nama_sektor}` : ''}</p>
              <p className="text-xs text-gray-400 mt-1">{format(new Date(a.tanggal_dokumen), 'd MMMM yyyy', { locale: localeId })}</p>
              <p className="text-sm text-gray-600 mt-2 line-clamp-2 flex-1">{a.uraian_ringkas || '—'}</p>
              <div className="mt-4 flex items-center justify-between border-t pt-3">
                <span className="flex items-center gap-1 text-xs text-gray-400"><Paperclip size={13} /> {a.jumlah_lampiran} lampiran</span>
                <div className="flex items-center gap-2">
                  <Link to={`/arsip/${a.id}`} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" title="Lihat detail">
                    <Eye size={16} />
                  </Link>
                  {canManage(a) && (
                    <>
                      <button onClick={() => openEdit(a)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" title="Ubah arsip">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(a.id, a.judul)} className="rounded-lg p-2 text-red-500 hover:bg-red-50" title="Pindahkan ke Sampah">
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <ArsipFormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditingArsip(null); }}
        onSuccess={() => { setShowForm(false); setEditingArsip(null); fetchData(); }}
        jenisList={jenisList}
        sektorList={sektorList}
        editingArsip={editingArsip}
      />
    </Layout>
  );
}
