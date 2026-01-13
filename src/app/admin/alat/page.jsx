// D:\Projek Coding\APA\src\app\admin\Alat\page.jsx

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function AlatPage() {
  const router = useRouter();
  const [alat, setAlat] = useState([]);
  const [kategori, setKategori] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    id_alat: '',
    nama_alat: '',
    id_kategori: '',
    kondisi: 'baik',
    status: 'tersedia'
  });

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    try {
      const [alatRes, kategoriRes] = await Promise.all([
        fetch('/api/admin/alat', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/kategori', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      const alatData = await alatRes.json();
      const kategoriData = await kategoriRes.json();
      
      setAlat(alatData.data || []);
      setKategori(kategoriData.data || []);
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
    const res = await fetch('/api/admin/alat', {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      alert(editMode ? 'Alat berhasil diupdate' : 'Alat berhasil ditambahkan');
      setShowModal(false);
      resetForm();
      fetchData();
    } else {
      const data = await res.json();
      alert(data.error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus alat ini?')) return;
    
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/admin/alat?id_alat=${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      alert('Alat berhasil dihapus');
      fetchData();
    }
  };

  const handleEdit = (item) => {
    setFormData({
      id_alat: item.id_alat,
      nama_alat: item.nama_alat,
      id_kategori: item.id_kategori || '',
      kondisi: item.kondisi,
      status: item.status
    });
    setEditMode(true);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      id_alat: '',
      nama_alat: '',
      id_kategori: '',
      kondisi: 'baik',
      status: 'tersedia'
    });
    setEditMode(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Manajemen Alat</h1>
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
              Tambah Alat
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">ID</th>
                <th className="px-6 py-3 text-left">Nama Alat</th>
                <th className="px-6 py-3 text-left">Kategori</th>
                <th className="px-6 py-3 text-left">Kondisi</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {alat.map((item) => (
                <tr key={item.id_alat} className="border-t">
                  <td className="px-6 py-4">{item.id_alat}</td>
                  <td className="px-6 py-4">{item.nama_alat}</td>
                  <td className="px-6 py-4">{item.nama_kategori || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${item.kondisi === 'baik' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {item.kondisi}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${item.status === 'tersedia' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleEdit(item)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded mr-2 hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id_alat)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Hapus
                    </button>
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
                {editMode ? 'Edit Alat' : 'Tambah Alat'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block mb-2">Nama Alat</label>
                  <input
                    type="text"
                    value={formData.nama_alat}
                    onChange={(e) => setFormData({...formData, nama_alat: e.target.value})}
                    className="w-full border px-3 py-2 rounded"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-2">Kategori</label>
                  <select
                    value={formData.id_kategori}
                    onChange={(e) => setFormData({...formData, id_kategori: e.target.value})}
                    className="w-full border px-3 py-2 rounded"
                  >
                    <option value="">Pilih Kategori</option>
                    {kategori.map((kat) => (
                      <option key={kat.id_kategori} value={kat.id_kategori}>
                        {kat.nama_kategori}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block mb-2">Kondisi</label>
                  <select
                    value={formData.kondisi}
                    onChange={(e) => setFormData({...formData, kondisi: e.target.value})}
                    className="w-full border px-3 py-2 rounded"
                  >
                    <option value="baik">Baik</option>
                    <option value="rusak">Rusak</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full border px-3 py-2 rounded"
                  >
                    <option value="tersedia">Tersedia</option>
                    <option value="dipinjam">Dipinjam</option>
                  </select>
                </div>
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