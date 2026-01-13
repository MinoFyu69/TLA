// D:\Projek Coding\APA\src\app\admin\log\page.jsx

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function LogAktivitasPage() {
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(100);

  const fetchLogs = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    try {
      const res = await fetch(`/api/admin/log-aktivitas?limit=${limit}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setLogs(data.data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  }, [router, limit]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Log Aktivitas</h1>
          <div className="flex gap-2 items-center">
            <label className="text-sm">Tampilkan:</label>
            <select
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              className="border px-3 py-2 rounded"
            >
              <option value="50">50 data</option>
              <option value="100">100 data</option>
              <option value="200">200 data</option>
              <option value="500">500 data</option>
            </select>
            <button
              onClick={fetchLogs}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Refresh
            </button>
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Kembali
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Aktivitas</th>
                <th className="px-4 py-3 text-left">Waktu</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id_log} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-4">{log.id_log}</td>
                  <td className="px-4 py-4">
                    {log.nama_user ? (
                      <div>
                        <div className="font-medium">{log.nama_user}</div>
                        <div className="text-xs text-gray-500">@{log.username}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">System</span>
                    )}
                  </td>
                  <td className="px-4 py-4">{log.aktivitas}</td>
                  <td className="px-4 py-4 text-gray-600">
                    {formatDate(log.waktu)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {logs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Belum ada aktivitas yang tercatat
            </div>
          )}
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Menampilkan {logs.length} aktivitas terakhir
        </div>
      </div>
    </div>
  );
}