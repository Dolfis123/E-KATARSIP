import { useEffect, useState } from 'react';
import { Archive, Users, HardDrive, Link2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard/summary').then((res) => setData(res.data.data));
  }, []);

  if (!data) {
    return (
      <Layout title="Dashboard">
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      </Layout>
    );
  }

  const sektorData = data.sektorBreakdown.filter((s) => s.total > 0);
  const jenisData = data.jenisBreakdown.filter((j) => j.total > 0);
  const trendData = data.trend.map((t) => ({ bulan: t.bulan, total: t.total }));

  return (
    <Layout title="Dashboard">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Archive} label="Total Arsip Tercatat" value={data.totalArsip} sub="Seluruh dokumen dalam katalog" color="primary" />
        <StatCard icon={HardDrive} label="Salinan File Digital" value={data.totalLampiran} sub={`${data.totalPenyimpananMB} MB tersimpan`} color="accent" />
        <StatCard icon={Link2} label="Lampiran Berupa Tautan" value={data.totalTautan} sub="Google Drive, YouTube, dsb." color="blue" />
        <StatCard icon={Users} label="Pengguna Aktif" value={data.totalUsers} sub="Pegawai Sub Bidang" color="red" />
      </div>

      {data.totalTanpaLampiran > 0 && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          ⚠️ Ada <strong>{data.totalTanpaLampiran}</strong> arsip yang belum memiliki salinan digital maupun tautan. Segera lengkapi agar dokumen fisik memiliki cadangan.
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <p className="font-semibold text-gray-800 mb-4">Tren Input Arsip (12 Bulan Terakhir)</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="bulan" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#1f7355" strokeWidth={2.5} dot={{ r: 3 }} name="Jumlah Arsip" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <p className="font-semibold text-gray-800 mb-4">Arsip per Jenis Dokumen</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={jenisData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="nama_jenis" width={110} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="total" fill="#c8912b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <p className="font-semibold text-gray-800 mb-4">Arsip Terbaru</p>
          <div className="divide-y divide-gray-100">
            {data.recent.map((a) => (
              <Link to={`/arsip/${a.id}`} key={a.id} className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition">
                <div>
                  <p className="text-sm font-medium text-gray-800">{a.judul}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {a.nomor_klasifikasi} · {format(new Date(a.tanggal_dokumen), 'd MMM yyyy', { locale: localeId })}
                  </p>
                </div>
                <span className="text-xs text-gray-400">{a.jumlah_lampiran} lampiran</span>
              </Link>
            ))}
            {data.recent.length === 0 && <p className="py-6 text-center text-sm text-gray-400">Belum ada arsip.</p>}
          </div>
        </div>

        <div className="card p-5">
          <p className="font-semibold text-gray-800 mb-4">Distribusi per Sektor</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={sektorData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="nama_sektor" width={100} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="total" fill="#1f7355" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Layout>
  );
}
