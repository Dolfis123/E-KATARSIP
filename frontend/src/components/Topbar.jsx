import { useEffect, useRef, useState, useCallback } from 'react';
import { Menu, LogOut, ChevronDown, User as UserIcon, Bell, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Topbar({ onMenuClick, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const profileRef = useRef();
  const notifRef = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.get('/notifikasi/unread-count');
      setUnreadCount(res.data.data.total);
    } catch (err) {
      /* abaikan kegagalan polling notifikasi */
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const openNotif = async () => {
    setNotifOpen((v) => !v);
    if (!notifOpen) {
      try {
        const res = await api.get('/notifikasi', { params: { limit: 10 } });
        setNotifications(res.data.data);
      } catch (err) {
        /* abaikan */
      }
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/notifikasi/${id}/baca`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, dibaca: 1 } : n)));
      fetchUnreadCount();
    } catch (err) {
      /* abaikan */
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifikasi/baca-semua');
      setNotifications((prev) => prev.map((n) => ({ ...n, dibaca: 1 })));
      setUnreadCount(0);
    } catch (err) {
      toast.error('Gagal menandai semua notifikasi sebagai dibaca.');
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Anda berhasil logout.');
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 lg:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="rounded-md p-2 text-gray-500 hover:bg-gray-100 lg:hidden">
          <Menu size={22} />
        </button>
        <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative" ref={notifRef}>
          <button onClick={openNotif} className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-xl border border-gray-200 bg-white shadow-lg">
              <div className="flex items-center justify-between border-b px-4 py-2.5">
                <p className="text-sm font-semibold text-gray-800">Notifikasi</p>
                <button onClick={handleMarkAllRead} className="flex items-center gap-1 text-xs text-primary-600 hover:underline">
                  <CheckCheck size={13} /> Tandai semua dibaca
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-gray-400">Belum ada notifikasi.</p>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleMarkRead(n.id)}
                      className={`block w-full border-b px-4 py-2.5 text-left last:border-b-0 hover:bg-gray-50 ${!n.dibaca ? 'bg-primary-50/50' : ''}`}
                    >
                      <p className="text-sm font-medium text-gray-800">{n.judul}</p>
                      {n.pesan && <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{n.pesan}</p>}
                      <p className="mt-1 text-[11px] text-gray-400">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: localeId })}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={profileRef}>
          <button onClick={() => setProfileOpen((v) => !v)} className="flex items-center gap-2 rounded-full px-2 py-1.5 hover:bg-gray-100">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-sm font-semibold text-white">
              {user?.nama_lengkap?.charAt(0) || 'U'}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium leading-tight">{user?.nama_lengkap}</p>
              <p className="text-xs text-gray-400 leading-tight">{user?.nama_role}</p>
            </div>
            <ChevronDown size={16} className="text-gray-400" />
          </button>
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-xl border border-gray-200 bg-white shadow-lg py-1">
              <button
                onClick={() => { setProfileOpen(false); navigate('/profil'); }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                <UserIcon size={16} /> Profil Saya
              </button>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut size={16} /> Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
