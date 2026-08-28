const STYLES = {
  aktif: 'bg-emerald-50 text-emerald-700',
  nonaktif: 'bg-gray-100 text-gray-500',
  file: 'bg-primary-50 text-primary-700',
  link: 'bg-blue-50 text-blue-700',
  biasa: 'bg-gray-100 text-gray-600',
  terbatas: 'bg-amber-50 text-amber-700',
  rahasia: 'bg-red-50 text-red-700',
};

const LABELS = {
  aktif: 'Aktif',
  nonaktif: 'Nonaktif',
  file: 'File',
  link: 'Tautan',
  biasa: 'Biasa',
  terbatas: 'Terbatas',
  rahasia: 'Rahasia',
};

export default function Badge({ status }) {
  return (
    <span className={`badge ${STYLES[status] || 'bg-gray-100 text-gray-600'}`}>
      {LABELS[status] || status}
    </span>
  );
}
