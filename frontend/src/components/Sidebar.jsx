import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Archive, FolderKanban, Users, ScrollText, Settings, Trash2, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const menuItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: null },
  { to: '/arsip', label: 'Katalog Arsip', icon: Archive, roles: null },
  { to: '/sampah', label: 'Sampah', icon: Trash2, roles: null },
  { to: '/master-data', label: 'Data Master', icon: FolderKanban, roles: null },
  { to: '/users', label: 'Manajemen Pengguna', icon: Users, roles: ['Super Admin'] },
  { to: '/log-aktivitas', label: 'Riwayat Aktivitas', icon: ScrollText, roles: ['Super Admin'] },
  { to: '/profil', label: 'Pengaturan Akun', icon: Settings, roles: null },
];

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();

  const visibleItems = menuItems.filter((item) => !item.roles || item.roles.includes(user?.nama_role));

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed z-40 inset-y-0 left-0 w-72 transform bg-primary-800 text-white transition-transform duration-200 lg:static lg:translate-x-0 flex flex-col ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-primary-700/60">
          <div className="flex items-center gap-3">
            <img
              src="/logo-papua-barat-daya.png"
              alt="Logo Provinsi Papua Barat Daya"
              className="h-11 w-11 object-contain drop-shadow"
            />
            <div className="leading-tight">
              <p className="font-bold text-base tracking-wide">E-KATARSIP</p>
              <p className="text-[11px] text-primary-200">BAPPERIDA Papua Barat Daya</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-primary-200 hover:text-white">
            <X size={22} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white text-primary-800 shadow-sm'
                    : 'text-primary-100 hover:bg-primary-700/70'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-primary-700/60 text-[11px] text-primary-300">
          <p>Sub Bidang Perekonomian &amp;</p>
          <p>Sosial Budaya &copy; {new Date().getFullYear()}</p>
        </div>
      </aside>
    </>
  );
}
