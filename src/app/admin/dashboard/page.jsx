/* eslint-disable react-hooks/exhaustive-deps */
// src/app/admin/dashboard/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RoleProtection from '@/components/RoleProtection';
import { LogOut, Users, Wrench, Package, RotateCcw, FolderTree, Activity } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAlat: 0,
    totalPeminjaman: 0,
    totalPengembalian: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
    } else {
      setUser(JSON.parse(userData));
    }

    // Fetch stats dari API
    fetchStats();
  }, []); // Empty dependency - hanya run sekali

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

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
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const menus = [
    { 
      name: 'Users', 
      path: '/admin/users', 
      icon: Users, 
      desc: 'Kelola data pengguna',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600'
    },
    { 
      name: 'Alat', 
      path: '/admin/alat', 
      icon: Wrench, 
      desc: 'Kelola data alat',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-600'
    },
    { 
      name: 'Kategori', 
      path: '/admin/kategori', 
      icon: FolderTree, 
      desc: 'Kelola kategori alat',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600'
    },
    { 
      name: 'Peminjaman', 
      path: '/admin/peminjaman', 
      icon: Package, 
      desc: 'Kelola peminjaman',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-100',
      textColor: 'text-green-600'
    },
    { 
      name: 'Pengembalian', 
      path: '/admin/pengembalian', 
      icon: RotateCcw, 
      desc: 'Proses pengembalian',
      color: 'from-teal-500 to-teal-600',
      bgColor: 'bg-teal-100',
      textColor: 'text-teal-600'
    },
    { 
      name: 'Log Aktivitas', 
      path: '/admin/log', 
      icon: Activity, 
      desc: 'Lihat riwayat aktivitas',
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-100',
      textColor: 'text-indigo-600'
    },
  ];

  return (
    <RoleProtection allowedRoles={['admin']}>
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50">
        {/* Header */}
        <nav className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                  A
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">Dashboard Admin</h1>
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
                  className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  <LogOut size={18} />
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
              <div className="w-20 h-20 bg-linear-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl">
                👋
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-800">Selamat Datang, {user.nama}!</h2>
                <p className="text-gray-600 mt-1">Kelola seluruh sistem peminjaman alat dari sini</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              icon={Users}
              color="bg-blue-500"
              loading={loadingStats}
            />
            <StatCard
              title="Total Alat"
              value={stats.totalAlat}
              icon={Wrench}
              color="bg-orange-500"
              loading={loadingStats}
            />
            <StatCard
              title="Peminjaman Aktif"
              value={stats.totalPeminjaman}
              icon={Package}
              color="bg-green-500"
              loading={loadingStats}
            />
            <StatCard
              title="Total Pengembalian"
              value={stats.totalPengembalian}
              icon={RotateCcw}
              color="bg-purple-500"
              loading={loadingStats}
            />
          </div>

          {/* Menu Grid */}
          <h3 className="text-xl font-bold text-gray-800 mb-4">Menu Admin</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menus.map((menu) => {
              const Icon = menu.icon;
              return (
                <Link
                  key={menu.path}
                  href={menu.path}
                  className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all p-6 group"
                >
                  <div className={`w-14 h-14 ${menu.bgColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-7 h-7 ${menu.textColor}`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{menu.name}</h3>
                  <p className="text-gray-600 text-sm">{menu.desc}</p>
                </Link>
              );
            })}
          </div>

          {/* Info Card */}
          <div className="mt-8 bg-linear-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">📢 Informasi</h3>
            <ul className="space-y-2">
              <li>✅ Anda login sebagai <strong>Admin</strong></li>
              <li>✅ Anda memiliki akses penuh ke seluruh fitur sistem</li>
              <li>✅ Pastikan data terkelola dengan baik dan aman</li>
            </ul>
          </div>
        </div>
      </div>
    </RoleProtection>
  );
}

function StatCard({ title, value, icon: Icon, color, loading }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm mb-1">{title}</p>
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin"></div>
            </div>
          ) : (
            <p className="text-3xl font-bold text-gray-800">{value}</p>
          )}
        </div>
        <div className={`${color} text-white p-4 rounded-full`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}