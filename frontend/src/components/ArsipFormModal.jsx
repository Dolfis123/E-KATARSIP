import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { UploadCloud, FileText, X, Link2, Plus } from 'lucide-react';
import Modal from './Modal';
import api from '../services/api';

const initialForm = {
  judul: '', jenis_dokumen_id: '', sektor_id: '', tanggal_dokumen: '',
  nomor_surat: '', uraian_ringkas: '', opd_terkait_id: '', kata_kunci: '', tingkat_kerahasiaan: 'biasa',
};

function isValidUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function ArsipFormModal({ open, onClose, onSuccess, jenisList, sektorList, editingArsip }) {
  const isEdit = Boolean(editingArsip);
  const [form, setForm] = useState(initialForm);
  const [files, setFiles] = useState([]);
  const [links, setLinks] = useState([]);
  const [linkLabel, setLinkLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [opdList, setOpdList] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (editingArsip) {
        setForm({
          judul: editingArsip.judul || '',
          jenis_dokumen_id: editingArsip.jenis_dokumen_id || '',
          sektor_id: editingArsip.sektor_id || '',
          tanggal_dokumen: editingArsip.tanggal_dokumen ? String(editingArsip.tanggal_dokumen).slice(0, 10) : '',
          nomor_surat: editingArsip.nomor_surat || '',
          uraian_ringkas: editingArsip.uraian_ringkas || '',
          opd_terkait_id: editingArsip.opd_terkait_id || '',
          kata_kunci: editingArsip.kata_kunci || '',
          tingkat_kerahasiaan: editingArsip.tingkat_kerahasiaan || 'biasa',
        });
      } else {
        setForm(initialForm);
      }
      setFiles([]);
      setLinks([]);
      setLinkLabel('');
      setLinkUrl('');
      api.get('/master/opd').then((res) => setOpdList(res.data.data));
    }
  }, [open, editingArsip]);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const addLink = () => {
    if (!linkUrl.trim() || !isValidUrl(linkUrl.trim())) {
      toast.error('Masukkan URL tautan yang valid (harus diawali http:// atau https://).');
      return;
    }
    setLinks((prev) => [...prev, { label: linkLabel.trim(), url: linkUrl.trim() }]);
    setLinkLabel('');
    setLinkUrl('');
  };

  const removeLink = (idx) => setLinks((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        // Data inti arsip diperbarui sebagai JSON biasa; lampiran baru (jika
        // ada) ditambahkan lewat panggilan terpisah ke endpoint lampiran,
        // sama seperti yang dipakai halaman Detail Arsip.
        await api.put(`/arsip/${editingArsip.id}`, form);

        if (files.length || links.length) {
          const fd = new FormData();
          files.forEach((f) => fd.append('lampiran', f));
          if (links.length) fd.append('links', JSON.stringify(links));
          await api.post(`/arsip/${editingArsip.id}/lampiran`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        }

        toast.success('Arsip berhasil diperbarui.');
      } else {
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
        files.forEach((f) => fd.append('lampiran', f));
        if (links.length) fd.append('links', JSON.stringify(links));

        await api.post('/arsip', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Arsip berhasil ditambahkan ke katalog.');
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan arsip.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Ubah Arsip' : 'Tambah Arsip Baru'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label-field">Judul Dokumen *</label>
          <input name="judul" required value={form.judul} onChange={handleChange} className="input-field" placeholder="Contoh: Notula Rapat Koordinasi Sektor Perikanan" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label-field">Jenis Dokumen *</label>
            <select name="jenis_dokumen_id" required value={form.jenis_dokumen_id} onChange={handleChange} className="input-field">
              <option value="">Pilih jenis dokumen</option>
              {jenisList.map((j) => <option key={j.id} value={j.id}>{j.nama_jenis}</option>)}
            </select>
          </div>
          <div>
            <label className="label-field">Sektor</label>
            <select name="sektor_id" value={form.sektor_id} onChange={handleChange} className="input-field">
              <option value="">Pilih sektor (opsional)</option>
              {sektorList.map((s) => <option key={s.id} value={s.id}>{s.nama_sektor}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label-field">Tanggal Dokumen *</label>
            <input type="date" name="tanggal_dokumen" required value={form.tanggal_dokumen} onChange={handleChange} className="input-field" />
          </div>
          <div>
            <label className="label-field">Nomor Surat</label>
            <input name="nomor_surat" value={form.nomor_surat} onChange={handleChange} className="input-field" placeholder="Opsional" />
          </div>
        </div>

        <div>
          <label className="label-field">OPD Terkait</label>
          <select name="opd_terkait_id" value={form.opd_terkait_id} onChange={handleChange} className="input-field">
            <option value="">Tidak ada / internal</option>
            {opdList.map((o) => <option key={o.id} value={o.id}>{o.nama_opd}</option>)}
          </select>
        </div>

        <div>
          <label className="label-field">Uraian Ringkas</label>
          <textarea name="uraian_ringkas" value={form.uraian_ringkas} onChange={handleChange} rows={3} className="input-field" placeholder="Ringkasan isi dokumen..." />
        </div>

        <div>
          <label className="label-field">Kata Kunci</label>
          <input name="kata_kunci" value={form.kata_kunci} onChange={handleChange} className="input-field" placeholder="pisahkan dengan koma, contoh: perikanan, rapat, 2026" />
        </div>

        <div>
          <label className="label-field">Tingkat Kerahasiaan</label>
          <select name="tingkat_kerahasiaan" value={form.tingkat_kerahasiaan} onChange={handleChange} className="input-field">
            <option value="biasa">Biasa</option>
            <option value="terbatas">Terbatas</option>
            <option value="rahasia">Rahasia</option>
          </select>
        </div>

        <div>
          <label className="label-field">
            {isEdit ? 'Tambah Salinan Digital Baru (opsional)' : 'Unggah Salinan Digital (Scan)'}
          </label>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-6 hover:border-primary-400 hover:bg-primary-50/40 transition">
            <UploadCloud size={26} className="text-gray-400 mb-2" />
            <span className="text-sm text-gray-500">Klik untuk pilih file (PDF, JPG, PNG, DOCX, XLSX)</span>
            <input type="file" multiple onChange={handleFileChange} className="hidden" accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx" />
          </label>
          {files.length > 0 && (
            <ul className="mt-3 space-y-2">
              {files.map((f, idx) => (
                <li key={idx} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                  <span className="flex items-center gap-2 text-gray-700 truncate"><FileText size={15} /> {f.name}</span>
                  <button type="button" onClick={() => removeFile(idx)} className="text-gray-400 hover:text-red-500"><X size={15} /></button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label className="label-field">Tambahkan Tautan (Google Drive, YouTube, dsb.)</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={linkLabel}
              onChange={(e) => setLinkLabel(e.target.value)}
              className="input-field sm:w-2/5"
              placeholder="Label (opsional), mis. Video Dokumentasi"
            />
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="input-field flex-1"
              placeholder="https://drive.google.com/..."
            />
            <button type="button" onClick={addLink} className="btn-secondary shrink-0">
              <Plus size={16} /> Tambah
            </button>
          </div>
          {links.length > 0 && (
            <ul className="mt-3 space-y-2">
              {links.map((l, idx) => (
                <li key={idx} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                  <span className="flex items-center gap-2 text-gray-700 truncate">
                    <Link2 size={15} className="text-blue-600 shrink-0" /> {l.label || l.url}
                  </span>
                  <button type="button" onClick={() => removeLink(idx)} className="text-gray-400 hover:text-red-500"><X size={15} /></button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Batal</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Arsip'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
