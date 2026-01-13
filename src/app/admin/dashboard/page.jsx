// src/app/admin/dashboard/page.jsx

'use client';

import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAlat: 0,
    totalPeminjaman: 0,
    totalPengembalian: 0
  });

  const getUserData = () => {
    if (typeof window === 'undefined') return null;
    const userData = localStorage.getItem('user');
    if (!userData) return null;
    return JSON.parse(userData);
  };

  const user = getUserData();

  useEffect(() => {
    // Fetch statistics jika ada API-nya
    const fetchStats = async () => {
      const token = localStorage.getItem('token');
      try {
        // Contoh fetch stats
        // const res = await fetch('/api/admin/stats', {
        //   headers: { 'Authorization': `Bearer ${token}` }
        // });
        // const data = await res.json();
        // setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mt-2">Selamat datang, {user?.nama}!</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon="👥"
          color="bg-blue-500"
        />
        <StatCard
          title="Total Alat"
          value={stats.totalAlat}
          icon="🔧"
          color="bg-green-500"
        />
        <StatCard
          title="Peminjaman Aktif"
          value={stats.totalPeminjaman}
          icon="📋"
          color="bg-yellow-500"
        />
        <StatCard
          title="Total Pengembalian"
          value={stats.totalPengembalian}
          icon="✅"
          color="bg-purple-500"
        />
      </div>

      {/* Quick Info */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Informasi</h2>
        <div className="space-y-3">
          <InfoItem label="Nama" value={user?.nama} />
          <InfoItem label="Username" value={user?.username} />
          <InfoItem label="Role" value={user?.role?.toUpperCase()} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className={`${color} text-white p-4 rounded-full text-2xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b last:border-0">
      <span className="text-gray-600">{label}:</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}