// D:\Projek Coding\APA\src\app\admin\kategori\page.jsx

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import RoleProtection from '@/components/RoleProtection';

export default function KategoriPage() {
  const router = useRouter();
  const [kategori, setKategori] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    id_kategori: '',
    nama_kategori: '',
    deskripsi: ''
  });

  const fetchKategori = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    try {
      const res = await fetch('/api/admin/kategori', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setKategori(data.data || []);
    } catch (error) {
      console.error('Error fetching kategori:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchKategori();
  }, [fetchKategori]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    const method = editMode ? 'PUT' : 'POST';
    const res = await fetch('/api/admin/kategori', {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      alert(editMode ? 'Kategori berhasil diupdate' : 'Kategori berhasil ditambahkan');
      setShowModal(false);
      resetForm();
      fetchKategori();
    } else {
      const data = await res.json();
      alert(data.error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus kategori ini?')) return;
    
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/admin/kategori?id_kategori=${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      alert('Kategori berhasil dihapus');
      fetchKategori();
    }
  };

  const handleEdit = (item) => {
    setFormData({
      id_kategori: item.id_kategori,
      nama_kategori: item.nama_kategori,
      deskripsi: item.deskripsi || ''
    });
    setEditMode(true);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      id_kategori: '',
      nama_kategori: '',
      deskripsi: ''
    });
    setEditMode(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <RoleProtection allowedRoles={['admin']}>
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Manajemen Kategori</h1>
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
              Tambah Kategori
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">ID</th>
                <th className="px-6 py-3 text-left">Nama Kategori</th>
                <th className="px-6 py-3 text-left">Deskripsi</th>
                <th className="px-6 py-3 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {kategori.map((item) => (
                <tr key={item.id_kategori} className="border-t">
                  <td className="px-6 py-4">{item.id_kategori}</td>
                  <td className="px-6 py-4">{item.nama_kategori}</td>
                  <td className="px-6 py-4">{item.deskripsi || '-'}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleEdit(item)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded mr-2 hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id_kategori)}
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
                {editMode ? 'Edit Kategori' : 'Tambah Kategori'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block mb-2">Nama Kategori</label>
                  <input
                    type="text"
                    value={formData.nama_kategori}
                    onChange={(e) => setFormData({...formData, nama_kategori: e.target.value})}
                    className="w-full border px-3 py-2 rounded"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-2">Deskripsi</label>
                  <textarea
                    value={formData.deskripsi}
                    onChange={(e) => setFormData({...formData, deskripsi: e.target.value})}
                    className="w-full border px-3 py-2 rounded"
                    rows="3"
                  />
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
    </RoleProtection>
  );
}