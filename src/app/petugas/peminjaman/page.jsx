// src/app/petugas/peminjaman/page.jsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { getUser } from '@/lib/client-auth';
import { 
  ArrowLeft, CheckCircle, XCircle, Clock, Wrench,
  User, Calendar, AlertCircle, Search, Filter
} from 'lucide-react';

const StatusBadge = ({ status }) => {
  const config = {
    menunggu: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, text: 'Menunggu' },
    disetujui: { color: 'bg-blue-100 text-blue-700', icon: CheckCircle, text: 'Disetujui' },
    ditolak: { color: 'bg-red-100 text-red-700', icon: XCircle, text: 'Ditolak' },
    dikembalikan: { color: 'bg-green-100 text-green-700', icon: CheckCircle, text: 'Dikembalikan' },
  };

  const { color, icon: Icon, text } = config[status] || config.menunggu;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${color}`}>
      <Icon size={14} />
      {text}
    </span>
  );
};

export default function PetugasPeminjamanPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [peminjaman, setPeminjaman] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser || currentUser.role !== 'petugas') {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    loadPeminjaman();
  }, [router]);

  async function loadPeminjaman() {
    try {
      setLoading(true);
      const data = await apiFetch('/api/petugas/peminjaman');
      setPeminjaman(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Gagal memuat data peminjaman');
    } finally {
      setLoading(false);
    }
  }

  async function handleApproval(id, action) {
    const confirmText = action === 'disetujui' 
      ? 'Apakah Anda yakin ingin menyetujui peminjaman ini?'
      : 'Apakah Anda yakin ingin menolak peminjaman ini?';

    if (!confirm(confirmText)) return;

    try {
      setProcessing(id);
      setError('');

      await apiFetch('/api/petugas/approval', {
        method: 'POST',
        body: JSON.stringify({ id_peminjaman: id, status: action }),
      });

      alert(`Peminjaman berhasil ${action === 'disetujui' ? 'disetujui' : 'ditolak'}!`);
      await loadPeminjaman();
    } catch (e) {
      setError(e.message || 'Gagal memproses approval');
    } finally {
      setProcessing(null);
    }
  }

  const filteredPeminjaman = peminjaman.filter(p => {
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchSearch = !searchQuery || 
      p.nama_alat?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nama_user?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const stats = {
    total: peminjaman.length,
    menunggu: peminjaman.filter(p => p.status === 'menunggu').length,
    disetujui: peminjaman.filter(p => p.status === 'disetujui').length,
    ditolak: peminjaman.filter(p => p.status === 'ditolak').length,
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 to-blue-50">
      {/* Header */}
      <nav className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <button
              onClick={() => router.push('/petugas/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Kembali ke Dashboard</span>
            </button>
            <h1 className="text-xl font-bold text-gray-800">Kelola Peminjaman</h1>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: stats.total, color: 'from-gray-500 to-gray-600', onClick: () => setFilterStatus('all') },
            { label: 'Menunggu', value: stats.menunggu, color: 'from-yellow-500 to-yellow-600', onClick: () => setFilterStatus('menunggu') },
            { label: 'Disetujui', value: stats.disetujui, color: 'from-blue-500 to-blue-600', onClick: () => setFilterStatus('disetujui') },
            { label: 'Ditolak', value: stats.ditolak, color: 'from-red-500 to-red-600', onClick: () => setFilterStatus('ditolak') },
          ].map((stat) => (
            <button
              key={stat.label}
              onClick={stat.onClick}
              className={`bg-linear-to-br ${stat.color} text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:scale-105`}
            >
              <p className="text-sm opacity-90 mb-1">{stat.label}</p>
              <p className="text-3xl font-bold">{stat.value}</p>
            </button>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama alat atau peminjam..."
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
            >
              <option value="all">Semua Status</option>
              <option value="menunggu">Menunggu</option>
              <option value="disetujui">Disetujui</option>
              <option value="ditolak">Ditolak</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
            <AlertCircle size={20} />
            <p>{error}</p>
          </div>
        )}

        {/* Peminjaman List */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800">
              Daftar Peminjaman ({filteredPeminjaman.length})
            </h2>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Memuat data...</p>
            </div>
          ) : filteredPeminjaman.length === 0 ? (
            <div className="py-20 text-center">
              <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Tidak ada data peminjaman</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-linear-to-r from-green-50 to-blue-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Peminjam</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Alat</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Tanggal</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPeminjaman.map((p, idx) => (
                    <tr key={p.id_peminjaman} className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User size={20} className="text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{p.nama_user || 'User'}</p>
                            <p className="text-xs text-gray-500">ID: #{p.id_user}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Wrench size={20} className="text-orange-500" />
                          <div>
                            <p className="font-semibold text-gray-800">{p.nama_alat}</p>
                            <p className="text-xs text-gray-500">ID: #{p.id_alat}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-start gap-2">
                          <Calendar size={16} className="text-gray-400 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-700">
                              {new Date(p.tanggal_pinjam).toLocaleDateString('id-ID')}
                            </p>
                            <p className="text-xs text-gray-500">
                              s/d {new Date(p.tanggal_kembali_rencana).toLocaleDateString('id-ID')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        {p.status === 'menunggu' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApproval(p.id_peminjaman, 'disetujui')}
                              disabled={processing === p.id_peminjaman}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <CheckCircle size={16} />
                              Setujui
                            </button>
                            <button
                              onClick={() => handleApproval(p.id_peminjaman, 'ditolak')}
                              disabled={processing === p.id_peminjaman}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <XCircle size={16} />
                              Tolak
                            </button>
                          </div>
                        )}
                        {p.status !== 'menunggu' && (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}