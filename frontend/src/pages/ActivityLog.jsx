import { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { ScrollText } from 'lucide-react';
import Layout from '../components/Layout';
import Pagination from '../components/Pagination';
import api from '../services/api';

export default function ActivityLog() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 15;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/activity-log', { params: { page, limit } });
      setItems(res.data.data);
      setTotal(res.data.pagination.total);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <Layout title="Log Aktivitas Sistem">
      <p className="text-sm text-gray-500 mb-5 max-w-xl">
        Jejak audit (audit trail) seluruh aktivitas pengguna dalam sistem — mendukung akuntabilitas dan pengawasan pengelolaan arsip.
      </p>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      ) : (
        <div className="card divide-y divide-gray-100">
          {items.map((l) => (
            <div key={l.id} className="flex items-start gap-3 px-5 py-3.5">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                <ScrollText size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800">
                  <span className="font-semibold">{l.nama_lengkap || 'Sistem'}</span> — {l.deskripsi}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {l.aksi} · {format(new Date(l.created_at), 'd MMM yyyy, HH:mm', { locale: localeId })} WIT
                </p>
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="py-10 text-center text-gray-400">Belum ada aktivitas tercatat.</p>}
        </div>
      )}

      <Pagination page={page} totalPages={Math.ceil(total / limit)} onChange={setPage} />
    </Layout>
  );
}
