import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// 1. Tambahkan icon 'Eye' di import ini
import { ArrowLeft, Eye, FileText, Link2, ExternalLink, Trash2, UploadCloud, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import Layout from '../components/Layout';
import Badge from '../components/Badge';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function isValidUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function ArsipDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [arsip, setArsip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [linkLabel, setLinkLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [addingLink, setAddingLink] = useState(false);

  const canManage = arsip && (user?.nama_role === 'Super Admin' || arsip.diinput_oleh === user?.id);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/arsip/${id}`);
      setArsip(res.data.data);
    } catch (err) {
      toast.error('Arsip tidak ditemukan.');
      navigate('/arsip');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDeleteArsip = async () => {
    if (!confirm(`Hapus arsip "${arsip.judul}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await api.delete(`/arsip/${id}`);
      toast.success('Arsip berhasil dihapus.');
      navigate('/arsip');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus arsip.');
    }
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const fd = new FormData();
    files.forEach((f) => fd.append('lampiran', f));
    try {
      await api.post(`/arsip/${id}/lampiran`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Lampiran berhasil ditambahkan.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengunggah lampiran.');
    }
  };

  const handleAddLink = async () => {
    if (!linkUrl.trim() || !isValidUrl(linkUrl.trim())) {
      toast.error('Masukkan URL tautan yang valid (harus diawali http:// atau https://).');
      return;
    }
    setAddingLink(true);
    try {
      const fd = new FormData();
      fd.append('links', JSON.stringify([{ label: linkLabel.trim(), url: linkUrl.trim() }]));
      await api.post(`/arsip/${id}/lampiran`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Tautan berhasil ditambahkan.');
      setLinkLabel('');
      setLinkUrl('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menambahkan tautan.');
    } finally {
      setAddingLink(false);
    }
  };

  // 2. Mengubah handleDownload menjadi handleViewFile
  const handleViewFile = async (lampiran) => {
    try {
      const res = await api.get(`/arsip/lampiran/${lampiran.id}/unduh`, { responseType: 'blob' });
      
      // Ambil tipe file agar browser tau cara menampilkannya (misal: merender PDF atau menampil gambar)
      const file = new Blob([res.data], { type: res.headers['content-type'] });
      const url = window.URL.createObjectURL(file);
      
      // Buka dokumen di tab baru (Window Open)
      window.open(url, '_blank', 'noopener,noreferrer');
      
      // Beri waktu 30 detik untuk tab baru meload datanya, lalu hapus url object agar memori tidak bocor
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 30000);

      // Refresh data arsip agar counter "diunduh/dibuka" terupdate di layar
      fetchData();
    } catch (err) {
      toast.error('Gagal membuka file. Silakan login kembali jika masalah berlanjut.');
    }
  };

  const handleOpenLink = async (lampiran) => {
    try {
      // Catat aktivitas & hitungan "dibuka" di server, lalu buka tab baru.
      await api.get(`/arsip/lampiran/${lampiran.id}/unduh`, { maxRedirects: 0, validateStatus: () => true });
      fetchData(); // Update counter di UI
    } catch {
      /* abaikan, redirect memang tidak diikuti axios */
    }
    window.open(lampiran.path_file, '_blank', 'noopener,noreferrer');
  };

  const handleDeleteLampiran = async (lampiranId) => {
    if (!confirm('Hapus lampiran ini?')) return;
    try {
      await api.delete(`/arsip/lampiran/${lampiranId}`);
      toast.success('Lampiran dihapus.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus lampiran.');
    }
  };

  if (loading || !arsip) {
    return (
      <Layout title="Detail Arsip">
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Detail Arsip">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => navigate('/arsip')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft size={16} /> Kembali ke Katalog
        </button>
        {canManage && (
          <button onClick={handleDeleteArsip} className="btn-danger">
            <Trash2 size={16} /> Hapus Arsip
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <span className="text-xs font-mono text-primary-700 bg-primary-50 rounded px-2 py-1">{arsip.nomor_klasifikasi}</span>
          <h1 className="mt-3 text-xl font-bold text-gray-900">{arsip.judul}</h1>

          <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
            <div><dt className="text-gray-400">Jenis Dokumen</dt><dd className="font-medium text-gray-800">{arsip.nama_jenis}</dd></div>
            <div><dt className="text-gray-400">Sektor</dt><dd className="font-medium text-gray-800">{arsip.nama_sektor || '—'}</dd></div>
            <div><dt className="text-gray-400">Tanggal Dokumen</dt><dd className="font-medium text-gray-800">{format(new Date(arsip.tanggal_dokumen), 'd MMMM yyyy', { locale: localeId })}</dd></div>
            <div><dt className="text-gray-400">Nomor Surat</dt><dd className="font-medium text-gray-800">{arsip.nomor_surat || '—'}</dd></div>
            <div><dt className="text-gray-400">OPD Terkait</dt><dd className="font-medium text-gray-800">{arsip.nama_opd || '—'}</dd></div>
            <div><dt className="text-gray-400">Lokasi Fisik</dt><dd className="font-medium text-gray-800">{arsip.lokasi_fisik}</dd></div>
            <div><dt className="text-gray-400">Tingkat Kerahasiaan</dt><dd><Badge status={arsip.tingkat_kerahasiaan} /></dd></div>
            <div><dt className="text-gray-400">Diinput oleh</dt><dd className="font-medium text-gray-800">{arsip.diinput_oleh_nama}</dd></div>
          </dl>

          <div className="mt-6">
            <p className="text-gray-400 text-sm mb-1">Uraian Ringkas</p>
            <p className="text-gray-700 text-sm leading-relaxed">{arsip.uraian_ringkas || 'Tidak ada uraian.'}</p>
          </div>

          {arsip.kata_kunci && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {arsip.kata_kunci.split(',').map((k, i) => (
                <span key={i} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">#{k.trim()}</span>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-gray-800">Salinan Digital ({arsip.lampiran.length})</p>
          </div>

          {canManage && (
            <>
              <label className="mb-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-4 text-sm text-gray-500 hover:border-primary-400 hover:bg-primary-50/40 transition">
                <UploadCloud size={18} /> Tambah file lampiran
                <input type="file" multiple className="hidden" onChange={handleUpload} accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx" />
              </label>

              <div className="mb-4 flex flex-col gap-2 rounded-xl border border-gray-200 p-3">
                <p className="flex items-center gap-1.5 text-xs font-medium text-gray-500"><Link2 size={13} /> Tambahkan tautan</p>
                <input
                  value={linkLabel}
                  onChange={(e) => setLinkLabel(e.target.value)}
                  className="input-field text-sm"
                  placeholder="Label (opsional)"
                />
                <div className="flex gap-2">
                  <input
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="input-field text-sm flex-1"
                    placeholder="https://drive.google.com/..."
                  />
                  <button type="button" onClick={handleAddLink} disabled={addingLink} className="btn-secondary shrink-0 px-3">
                    <Plus size={15} />
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            {arsip.lampiran.map((l) => (
              <div key={l.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  {l.jenis_lampiran === 'link'
                    ? <Link2 size={16} className="text-blue-600 shrink-0" />
                    : <FileText size={16} className="text-primary-600 shrink-0" />}
                  <div className="min-w-0">
                    <p className="text-sm text-gray-700 truncate">{l.nama_file_asli}</p>
                    <p className="text-xs text-gray-400">
                      {l.jenis_lampiran === 'link' ? 'Tautan eksternal' : `${(l.ukuran_file_kb / 1024).toFixed(2)} MB`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {l.jenis_lampiran === 'link' ? (
                    <button onClick={() => handleOpenLink(l)} title="Buka Tautan" className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
                      <ExternalLink size={15} />
                    </button>
                  ) : (
                    // 3. Ubah event onclick dan ganti komponen <Download/> menjadi <Eye/> 
                    <button onClick={() => handleViewFile(l)} title="Lihat Dokumen" className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
                      <Eye size={15} />
                    </button>
                  )}
                  {canManage && <button onClick={() => handleDeleteLampiran(l.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"><Trash2 size={15} /></button>}
                </div>
              </div>
            ))}
            {arsip.lampiran.length === 0 && <p className="text-center text-sm text-gray-400 py-4">Belum ada salinan digital.</p>}
          </div>

          <div className="mt-5 border-t pt-4 grid grid-cols-2 gap-3 text-center text-xs text-gray-500">
            <div><p className="text-lg font-bold text-gray-800">{arsip.jumlah_dilihat}</p>Dilihat</div>
            <div><p className="text-lg font-bold text-gray-800">{arsip.jumlah_diunduh}</p>Diunduh/Dibuka</div>
          </div>
        </div>
      </div>
    </Layout>
  );
}