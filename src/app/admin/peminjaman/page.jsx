// D:\Projek Coding\APA\src\app\admin\peminjaman\page.jsx

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function PeminjamanPage() {
  const router = useRouter();
  const [peminjaman, setPeminjaman] = useState([]);
  const [users, setUsers] = useState([]);
  const [alat, setAlat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    id_peminjaman: '',
    id_user: '',
    id_alat: '',
    tanggal_pinjam: '',
    tanggal_kembali_rencana: '',
    status: 'menunggu'
  });

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    try {
      const [peminjamanRes, usersRes, alatRes] = await Promise.all([
        fetch('/api/admin/peminjaman', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/alat', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      const peminjamanData = await peminjamanRes.json();
      const usersData = await usersRes.json();
      const alatData = await alatRes.json();
      
      setPeminjaman(peminjamanData.data || []);
      setUsers(usersData.data || []);
      setAlat(alatData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    const method = editMode ? 'PUT' : 'POST';
    const res = await fetch('/api/admin/peminjaman', {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      alert(editMode ? 'Peminjaman berhasil diupdate' : 'Peminjaman berhasil ditambahkan');
      setShowModal(false);
      resetForm();
      fetchData();
    } else {
      const data = await res.json();
      alert(data.error);
    }
  };

  const handleApprove = async (id, status) => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/admin/peminjaman/approve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ id_peminjaman: id, status })
    });

    if (res.ok) {
      alert(`Peminjaman berhasil ${status}`);
      fetchData();
    } else {
      const data = await res.json();
      alert(data.error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus peminjaman ini?')) return;
    
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/admin/peminjaman?id_peminjaman=${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      alert('Peminjaman berhasil dihapus');
      fetchData();
    }
  };

  const handleEdit = (item) => {
    setFormData({
      id_peminjaman: item.id_peminjaman,
      id_user: item.id_user,
      id_alat: item.id_alat,
      tanggal_pinjam: item.tanggal_pinjam,
      tanggal_kembali_rencana: item.tanggal_kembali_rencana,
      status: item.status
    });
    setEditMode(true);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      id_peminjaman: '',
      id_user: '',
      id_alat: '',
      tanggal_pinjam: '',
      tanggal_kembali_rencana: '',
      status: 'menunggu'
    });
    setEditMode(false);
  };

  const getStatusBadge = (status) => {
    const colors = {
      menunggu: 'bg-yellow-100 text-yellow-800',
      disetujui: 'bg-green-100 text-green-800',
      ditolak: 'bg-red-100 text-red-800',
      dikembalikan: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Manajemen Peminjaman</h1>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Kembali
            </button>
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Tambah Peminjaman
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Peminjam</th>
                <th className="px-4 py-3 text-left">Alat</th>
                <th className="px-4 py-3 text-left">Tgl Pinjam</th>
                <th className="px-4 py-3 text-left">Tgl Kembali</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {peminjaman.map((item) => (
                <tr key={item.id_peminjaman} className="border-t">
                  <td className="px-4 py-4">{item.id_peminjaman}</td>
                  <td className="px-4 py-4">{item.nama_peminjam}</td>
                  <td className="px-4 py-4">{item.nama_alat}</td>
                  <td className="px-4 py-4">{item.tanggal_pinjam}</td>
                  <td className="px-4 py-4">{item.tanggal_kembali_rencana}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-1">
                      {item.status === 'menunggu' && (
                        <>
                          <button
                            onClick={() => handleApprove(item.id_peminjaman, 'disetujui')}
                            className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                          >
                            Setuju
                          </button>
                          <button
                            onClick={() => handleApprove(item.id_peminjaman, 'ditolak')}
                            className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                          >
                            Tolak
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleEdit(item)}
                        className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id_peminjaman)}
                        className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96">
              <h2 className="text-xl font-bold mb-4">
                {editMode ? 'Edit Peminjaman' : 'Tambah Peminjaman'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block mb-2">Peminjam</label>
                  <select
                    value={formData.id_user}
                    onChange={(e) => setFormData({...formData, id_user: e.target.value})}
                    className="w-full border px-3 py-2 rounded"
                    required
                  >
                    <option value="">Pilih User</option>
                    {users.map((user) => (
                      <option key={user.id_user} value={user.id_user}>
                        {user.nama} ({user.username})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block mb-2">Alat</label>
                  <select
                    value={formData.id_alat}
                    onChange={(e) => setFormData({...formData, id_alat: e.target.value})}
                    className="w-full border px-3 py-2 rounded"
                    required
                  >
                    <option value="">Pilih Alat</option>
                    {alat.filter(a => a.status === 'tersedia').map((item) => (
                      <option key={item.id_alat} value={item.id_alat}>
                        {item.nama_alat}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block mb-2">Tanggal Pinjam</label>
                  <input
                    type="date"
                    value={formData.tanggal_pinjam}
                    onChange={(e) => setFormData({...formData, tanggal_pinjam: e.target.value})}
                    className="w-full border px-3 py-2 rounded"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-2">Tanggal Kembali Rencana</label>
                  <input
                    type="date"
                    value={formData.tanggal_kembali_rencana}
                    onChange={(e) => setFormData({...formData, tanggal_kembali_rencana: e.target.value})}
                    className="w-full border px-3 py-2 rounded"
                    required
                  />
                </div>
                {editMode && (
                  <div className="mb-4">
                    <label className="block mb-2">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full border px-3 py-2 rounded"
                    >
                      <option value="menunggu">Menunggu</option>
                      <option value="disetujui">Disetujui</option>
                      <option value="ditolak">Ditolak</option>
                      <option value="dikembalikan">Dikembalikan</option>
                    </select>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Simpan
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}