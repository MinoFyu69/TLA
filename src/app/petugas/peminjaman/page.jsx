// src/app/petugas/peminjaman/page.jsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { getUser } from '@/lib/client-auth';
import RoleProtection from '@/components/RoleProtection';
import { 
  ArrowLeft, Wrench, User, Calendar, Package, CheckCircle, XCircle,
  AlertCircle, Search, Clock, DollarSign
} from 'lucide-react';

export default function PetugasPeminjamanPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [peminjaman, setPeminjaman] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('menunggu');
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

  function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  function calculateEstimasiBiaya(tanggalPinjam, tanggalKembaliRencana, hargaSewa, jumlah) {
    const pinjam = new Date(tanggalPinjam);
    const kembali = new Date(tanggalKembaliRencana);
    const diffTime = kembali - pinjam;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(1, diffDays) * (hargaSewa || 0) * (jumlah || 1);
  }

  async function handleApproval(id_peminjaman, status, namaAlat) {
    const confirmText = status === 'disetujui' 
      ? `Setujui peminjaman ${namaAlat}?`
      : `Tolak peminjaman ${namaAlat}?`;

    if (!confirm(confirmText)) return;

    try {
      setProcessing(id_peminjaman);
      setError('');

      await apiFetch('/api/petugas/approval', {
        method: 'POST',
        body: JSON.stringify({ id_peminjaman, status }),
      });

      alert(`Peminjaman berhasil ${status}!`);
      await loadPeminjaman();
    } catch (e) {
      setError(e.message || 'Gagal memproses approval');
    } finally {
      setProcessing(null);
    }
  }

  const filteredPeminjaman = peminjaman.filter(p => {
    const matchesSearch = !searchQuery || 
      p.nama_alat?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nama_user?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    menunggu: peminjaman.filter(p => p.status === 'menunggu').length,
    disetujui: peminjaman.filter(p => p.status === 'disetujui').length,
    ditolak: peminjaman.filter(p => p.status === 'ditolak').length,
    dikembalikan: peminjaman.filter(p => p.status === 'dikembalikan').length,
  };

  if (!user) return null;

  return (
    <RoleProtection allowedRoles={['petugas']}>
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
              <h1 className="text-xl font-bold text-gray-800">Approval Peminjaman</h1>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard title="Menunggu" value={stats.menunggu} color="bg-yellow-500" />
            <StatCard title="Disetujui" value={stats.disetujui} color="bg-green-500" />
            <StatCard title="Ditolak" value={stats.ditolak} color="bg-red-500" />
            <StatCard title="Dikembalikan" value={stats.dikembalikan} color="bg-blue-500" />
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari peminjam atau alat..."
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all appearance-none bg-white cursor-pointer"
              >
                <option value="all">Semua Status</option>
                <option value="menunggu">Menunggu</option>
                <option value="disetujui">Disetujui</option>
                <option value="ditolak">Ditolak</option>
                <option value="dikembalikan">Dikembalikan</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
              <AlertCircle size={20} />
              <p>{error}</p>
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-linear-to-r from-green-50 to-blue-50">
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
                <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Tidak ada data peminjaman</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-linear-to-r from-green-50 to-blue-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Peminjam</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Alat</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Jumlah</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Tanggal Pinjam</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Tanggal Kembali</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Estimasi Biaya</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPeminjaman.map((item) => {
                      const estimasiBiaya = calculateEstimasiBiaya(
                        item.tanggal_pinjam,
                        item.tanggal_kembali_rencana,
                        item.harga_sewa,
                        item.jumlah
                      );
                      const hariSewa = Math.ceil(
                        (new Date(item.tanggal_kembali_rencana) - new Date(item.tanggal_pinjam)) / (1000 * 60 * 60 * 24)
                      );

                      return (
                        <tr key={item.id_peminjaman} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <User size={18} className="text-blue-600" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-800">{item.nama_user}</div>
                                <div className="text-xs text-gray-500">@{item.username}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Wrench size={18} className="text-orange-500" />
                              <div>
                                <div className="font-semibold text-gray-800">{item.nama_alat}</div>
                                <div className="text-xs text-gray-500">
                                  Rp {(item.harga_sewa || 0).toLocaleString('id-ID')}/hari
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Package size={16} className="text-purple-500" />
                              <span className="font-semibold text-gray-800">{item.jumlah || 1} unit</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-gray-700">
                              <Calendar size={16} className="text-gray-400" />
                              {formatDate(item.tanggal_pinjam)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-gray-700">
                              <Calendar size={16} className="text-gray-400" />
                              {formatDate(item.tanggal_kembali_rencana)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-semibold text-green-600">
                                Rp {estimasiBiaya.toLocaleString('id-ID')}
                              </div>
                              <div className="text-xs text-gray-500">
                                {hariSewa} hari × {item.jumlah || 1} unit
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={item.status} />
                          </td>
                          <td className="px-6 py-4">
                            {item.status === 'menunggu' ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleApproval(item.id_peminjaman, 'disetujui', item.nama_alat)}
                                  disabled={processing === item.id_peminjaman}
                                  className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Setujui"
                                >
                                  <CheckCircle size={18} />
                                </button>
                                <button
                                  onClick={() => handleApproval(item.id_peminjaman, 'ditolak', item.nama_alat)}
                                  disabled={processing === item.id_peminjaman}
                                  className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Tolak"
                                >
                                  <XCircle size={18} />
                                </button>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="text-sm text-gray-600 text-center">
            Menampilkan {filteredPeminjaman.length} dari {peminjaman.length} data peminjaman
          </div>
        </div>
      </div>
    </RoleProtection>
  );
}

function StatCard({ title, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
        <div className={`${color} w-12 h-12 rounded-full opacity-20`}></div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const badges = {
    menunggu: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
    disetujui: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
    ditolak: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
    dikembalikan: { bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircle }
  };

  const badge = badges[status] || badges.menunggu;
  const Icon = badge.icon;

  return (
    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${badge.bg} ${badge.text} flex items-center gap-1 w-fit`}>
      <Icon size={14} />
      {status}
    </span>
  );
}