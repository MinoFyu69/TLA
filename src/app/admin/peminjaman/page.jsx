// src/app/admin/peminjaman/page.jsx

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Calendar, User, Wrench, AlertCircle, ArrowLeft, Plus, Edit2, Trash2, Package, DollarSign } from 'lucide-react';
import RoleProtection from '@/components/RoleProtection';

export default function PeminjamanPage() {
  const router = useRouter();
  const [peminjaman, setPeminjaman] = useState([]);
  const [alat, setAlat] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [formData, setFormData] = useState({
    id_peminjaman: '',
    id_user: '',
    id_alat: '',
    tanggal_pinjam: '',
    tanggal_kembali_rencana: '',
    jumlah: 1
  });
  const [formError, setFormError] = useState('');

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    try {
      setLoading(true);
      const [peminjamanRes, alatRes, usersRes] = await Promise.all([
        fetch('/api/admin/peminjaman', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/alat', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      const peminjamanData = await peminjamanRes.json();
      const alatData = await alatRes.json();
      const usersData = await usersRes.json();
      
      setPeminjaman(peminjamanData.data || []);
      setAlat(alatData.data || []);
      setUsers(usersData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const calculateEstimasiBiaya = (tanggalPinjam, tanggalKembali, hargaSewa, jumlah) => {
    if (!tanggalPinjam || !tanggalKembali) return 0;
    const pinjam = new Date(tanggalPinjam);
    const kembali = new Date(tanggalKembali);
    const diffTime = kembali - pinjam;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays) * (hargaSewa || 0) * (jumlah || 1);
  };

  const getStatusBadge = (status) => {
    const badges = {
      menunggu: 'bg-yellow-100 text-yellow-800',
      disetujui: 'bg-green-100 text-green-800',
      ditolak: 'bg-red-100 text-red-800',
      dikembalikan: 'bg-blue-100 text-blue-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const handleOpenModal = (mode, item = null) => {
    setModalMode(mode);
    if (mode === 'edit' && item) {
      setFormData({
        id_peminjaman: item.id_peminjaman,
        id_user: item.id_user,
        id_alat: item.id_alat,
        tanggal_pinjam: formatDateInput(item.tanggal_pinjam),
        tanggal_kembali_rencana: formatDateInput(item.tanggal_kembali_rencana),
        jumlah: item.jumlah || 1
      });
    } else {
      setFormData({
        id_peminjaman: '',
        id_user: '',
        id_alat: '',
        tanggal_pinjam: '',
        tanggal_kembali_rencana: '',
        jumlah: 1
      });
    }
    setFormError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const token = localStorage.getItem('token');
    const url = '/api/admin/peminjaman';
    const method = modalMode === 'create' ? 'POST' : 'PUT';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        handleCloseModal();
        fetchData();
      } else {
        setFormError(data.error || 'Gagal menyimpan data');
      }
    } catch (error) {
      setFormError('Terjadi kesalahan: ' + error.message);
    }
  };

  const handleDelete = async (id, namaAlat) => {
    if (!confirm(`Hapus peminjaman alat "${namaAlat}"?`)) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/admin/peminjaman?id_peminjaman=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        fetchData();
      } else {
        alert(data.error || 'Gagal menghapus data');
      }
    } catch (error) {
      alert('Terjadi kesalahan: ' + error.message);
    }
  };

  const filteredPeminjaman = peminjaman.filter(p => {
    const matchesSearch = !searchQuery || 
      p.nama_alat?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nama_peminjam?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const selectedAlat = alat.find(a => a.id_alat === parseInt(formData.id_alat));
  const estimasiBiaya = calculateEstimasiBiaya(
    formData.tanggal_pinjam,
    formData.tanggal_kembali_rencana,
    selectedAlat?.harga_sewa,
    formData.jumlah
  );

  if (loading) {
    return (
      <RoleProtection allowedRoles={['admin']}>
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data...</p>
          </div>
        </div>
      </RoleProtection>
    );
  }

  return (
    <RoleProtection allowedRoles={['admin']}>
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50">
        {/* Header */}
        <nav className="bg-white shadow-md sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft size={20} />
                <span className="font-medium">Kembali ke Dashboard</span>
              </button>
              <h1 className="text-xl font-bold text-gray-800">Manajemen Peminjaman</h1>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          {/* Stats Card */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              title="Menunggu"
              value={peminjaman.filter(p => p.status === 'menunggu').length}
              color="bg-yellow-500"
            />
            <StatCard
              title="Disetujui"
              value={peminjaman.filter(p => p.status === 'disetujui').length}
              color="bg-green-500"
            />
            <StatCard
              title="Ditolak"
              value={peminjaman.filter(p => p.status === 'ditolak').length}
              color="bg-red-500"
            />
            <StatCard
              title="Dikembalikan"
              value={peminjaman.filter(p => p.status === 'dikembalikan').length}
              color="bg-blue-500"
            />
          </div>

          {/* Filters & Add Button */}
          <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">Filter & Pencarian</h2>
              <button
                onClick={() => handleOpenModal('create')}
                className="flex items-center gap-2 bg-linear-to-br from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
              >
                <Plus size={20} />
                Tambah Peminjaman
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari peminjam atau alat..."
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all appearance-none bg-white cursor-pointer"
              >
                <option value="all">Semua Status</option>
                <option value="menunggu">Menunggu</option>
                <option value="disetujui">Disetujui</option>
                <option value="ditolak">Ditolak</option>
                <option value="dikembalikan">Dikembalikan</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-linear-to-br from-blue-50 to-indigo-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Peminjam</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Alat</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Jumlah</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Tanggal Pinjam</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Tanggal Kembali</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Estimasi Biaya</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPeminjaman.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <AlertCircle className="w-12 h-12 text-gray-300" />
                          <p className="text-gray-500">Tidak ada data peminjaman</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredPeminjaman.map((item) => {
                      const estimasi = calculateEstimasiBiaya(
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
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <User size={20} className="text-blue-600" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-800">{item.nama_peminjam}</div>
                                <div className="text-xs text-gray-500">@{item.username}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Wrench size={16} className="text-orange-500" />
                              <div>
                                <span className="font-medium text-gray-800">{item.nama_alat}</span>
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
                                Rp {estimasi.toLocaleString('id-ID')}
                              </div>
                              <div className="text-xs text-gray-500">
                                {hariSewa} hari × {item.jumlah || 1} unit
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusBadge(item.status)}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleOpenModal('edit', item)}
                                className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                title="Edit"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id_peminjaman, item.nama_alat)}
                                className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                title="Hapus"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        
          <div className="text-sm text-gray-600 text-center">
            Menampilkan {filteredPeminjaman.length} dari {peminjaman.length} data peminjaman
          </div>
        </div>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">
                {modalMode === 'create' ? 'Tambah Peminjaman' : 'Edit Peminjaman'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {formError && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
                  <AlertCircle size={20} />
                  <p>{formError}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Peminjam
                </label>
                <select
                  value={formData.id_user}
                  onChange={(e) => setFormData({...formData, id_user: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                  required
                >
                  <option value="">Pilih Peminjam</option>
                  {users.filter(u => u.role === 'peminjam').map(u => (
                    <option key={u.id_user} value={u.id_user}>
                      {u.nama} (@{u.username})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Alat
                </label>
                <select
                  value={formData.id_alat}
                  onChange={(e) => setFormData({...formData, id_alat: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                  required
                >
                  <option value="">Pilih Alat</option>
                  {alat.map(a => (
                    <option key={a.id_alat} value={a.id_alat}>
                      {a.nama_alat} - Rp {(a.harga_sewa || 0).toLocaleString('id-ID')}/hari (Stok: {a.stok})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Jumlah Unit
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.jumlah}
                  onChange={(e) => setFormData({...formData, jumlah: parseInt(e.target.value) || 1})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tanggal Pinjam
                  </label>
                  <input
                    type="date"
                    value={formData.tanggal_pinjam}
                    onChange={(e) => setFormData({...formData, tanggal_pinjam: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tanggal Kembali (Rencana)
                  </label>
                  <input
                    type="date"
                    value={formData.tanggal_kembali_rencana}
                    onChange={(e) => setFormData({...formData, tanggal_kembali_rencana: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                    required
                  />
                </div>
              </div>

              {formData.tanggal_pinjam && formData.tanggal_kembali_rencana && selectedAlat && (
                <div className="p-4 bg-linear-to-br from-green-50 to-blue-50 rounded-xl border-2 border-green-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Estimasi Biaya Sewa:</span>
                    <div className="flex items-center gap-2">
                      <DollarSign size={20} className="text-green-600" />
                      <span className="text-2xl font-bold text-green-600">
                        Rp {estimasiBiaya.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    {Math.ceil((new Date(formData.tanggal_kembali_rencana) - new Date(formData.tanggal_pinjam)) / (1000 * 60 * 60 * 24))} hari 
                    × Rp {(selectedAlat.harga_sewa || 0).toLocaleString('id-ID')} 
                    × {formData.jumlah} unit
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-linear-to-br from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
                >
                  {modalMode === 'create' ? 'Tambah' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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