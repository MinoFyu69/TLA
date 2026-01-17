// D:\Projek Coding\APA\src\app\petugas\dashboard\page.jsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PetugasDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
    } else {
      setUser(JSON.parse(userData));
    }
  }, [router]);

  const handleLogout = async () => {
    if (!confirm('Yakin ingin logout?')) return;

    try {
      const token = localStorage.getItem('token');
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const menus = [
    { name: 'Peminjaman', path: '/petugas/peminjaman', icon: '📋', desc: 'Kelola peminjaman alat' },
    { name: 'Pengembalian', path: '/petugas/pengembalian', icon: '✅', desc: 'Proses pengembalian alat' },
    { name: 'Alat', path: '/petugas/alat', icon: '🔧', desc: 'Lihat daftar alat' },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 to-blue-50">
      {/* Header */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-linear-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                P
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Dashboard Petugas</h1>
                <p className="text-sm text-gray-500">Sistem Peminjaman Alat</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800">{user.nama}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-linear-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl">
              👋
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-800">Selamat Datang, {user.nama}!</h2>
              <p className="text-gray-600 mt-1">Kelola peminjaman dan pengembalian alat dengan mudah</p>
            </div>
          </div>
        </div>

        {/* Menu Grid */}
        <h3 className="text-xl font-bold text-gray-800 mb-4">Menu Petugas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {menus.map((menu) => (
            <Link
              key={menu.path}
              href={menu.path}
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all p-6 group"
            >
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                {menu.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{menu.name}</h3>
              <p className="text-gray-600 text-sm">{menu.desc}</p>
            </Link>
          ))}
        </div>

        {/* Info Card */}
        <div className="mt-8 bg-linear-to-r from-green-500 to-blue-600 rounded-2xl shadow-lg p-8 text-white">
          <h3 className="text-2xl font-bold mb-4">📢 Informasi</h3>
          <ul className="space-y-2">
            <li>✅ Anda login sebagai <strong>Petugas</strong></li>
            <li>✅ Anda dapat mengelola peminjaman dan pengembalian alat</li>
            <li>✅ Pastikan semua transaksi tercatat dengan baik</li>
          </ul>
        </div>
      </div>
    </div>
  );
}