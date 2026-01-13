// D:\Projek Coding\APA\src\app\admin\pengembalian\page.jsx

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function PengembalianPage() {
  const router = useRouter();
  const [pengembalian, setPengembalian] = useState([]);
  const [peminjaman, setPeminjaman] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    id_pengembalian: '',
    id_peminjaman: '',
    tanggal_kembali: '',
    denda: 0
  });

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    try {
      const [pengembalianRes, peminjamanRes] = await Promise.all([
        fetch('/api/admin/pengembalian', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/peminjaman', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      const pengembalianData = await pengembalianRes.json();
      const peminjamanData = await peminjamanRes.json();
      
      setPengembalian(pengembalianData.data || []);
      // Filter hanya peminjaman yang disetujui
      setPeminjaman((peminjamanData.data || []).filter(p => p.status === 'disetujui'));
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
    const res = await fetch('/api/admin/pengembalian', {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      alert(editMode ? 'Pengembalian berhasil diupdate' : 'Pengembalian berhasil diproses');
      setShowModal(false);
      resetForm();
      fetchData();
    } else {
      const data = await res.json();
      alert(data.error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus pengembalian ini?')) return;
    
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/admin/pengembalian?id_pengembalian=${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      alert('Pengembalian berhasil dihapus');
      fetchData();
    }
  };

  const handleEdit = (item) => {
    setFormData({
      id_pengembalian: item.id_pengembalian,
      id_peminjaman: item.id_peminjaman,
      tanggal_kembali: item.tanggal_kembali,
      denda: item.denda
    });
    setEditMode(true);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      id_pengembalian: '',
      id_peminjaman: '',
      tanggal_kembali: '',
      denda: 0
    });
    setEditMode(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Manajemen Pengembalian</h1>
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
              Proses Pengembalian
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
                <th className="px-4 py-3 text-left">Tgl Kembali Rencana</th>
                <th className="px-4 py-3 text-left">Tgl Kembali Aktual</th>
                <th className="px-4 py-3 text-left">Denda</th>
                <th className="px-4 py-3 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pengembalian.map((item) => (
                <tr key={item.id_pengembalian} className="border-t">
                  <td className="px-4 py-4">{item.id_pengembalian}</td>
                  <td className="px-4 py-4">{item.nama_peminjam}</td>
                  <td className="px-4 py-4">{item.nama_alat}</td>
                  <td className="px-4 py-4">{item.tanggal_pinjam}</td>
                  <td className="px-4 py-4">{item.tanggal_kembali_rencana}</td>
                  <td className="px-4 py-4">{item.tanggal_kembali}</td>
                  <td className="px-4 py-4">
                    <span className={item.denda > 0 ? 'text-red-600 font-semibold' : ''}>
                      Rp {item.denda?.toLocaleString('id-ID') || 0}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(item)}
                        className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id_pengembalian)}
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
                {editMode ? 'Edit Pengembalian' : 'Proses Pengembalian'}
              </h2>
              <form onSubmit={handleSubmit}>
                {!editMode && (
                  <div className="mb-4">
                    <label className="block mb-2">Peminjaman</label>
                    <select
                      value={formData.id_peminjaman}
                      onChange={(e) => setFormData({...formData, id_peminjaman: e.target.value})}
                      className="w-full border px-3 py-2 rounded"
                      required
                    >
                      <option value="">Pilih Peminjaman</option>
                      {peminjaman.map((item) => (
                        <option key={item.id_peminjaman} value={item.id_peminjaman}>
                          {item.nama_peminjam} - {item.nama_alat} ({item.tanggal_pinjam})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="mb-4">
                  <label className="block mb-2">Tanggal Kembali</label>
                  <input
                    type="date"
                    value={formData.tanggal_kembali}
                    onChange={(e) => setFormData({...formData, tanggal_kembali: e.target.value})}
                    className="w-full border px-3 py-2 rounded"
                    required
                  />
                </div>
                {editMode && (
                  <div className="mb-4">
                    <label className="block mb-2">Denda (Rp)</label>
                    <input
                      type="number"
                      value={formData.denda}
                      onChange={(e) => setFormData({...formData, denda: parseInt(e.target.value) || 0})}
                      className="w-full border px-3 py-2 rounded"
                      min="0"
                    />
                  </div>
                )}
                {!editMode && (
                  <div className="mb-4 p-3 bg-blue-50 rounded">
                    <p className="text-sm text-blue-800">
                      💡 Denda akan dihitung otomatis: Rp 5.000/hari keterlambatan
                    </p>
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