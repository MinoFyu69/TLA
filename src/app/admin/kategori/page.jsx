// src/app/admin/kategori/page.jsx

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Plus, Edit2, Trash2, Search, Tag, 
  FileText, AlertCircle, Folder
} from 'lucide-react';
import RoleProtection from '@/components/RoleProtection';

export default function KategoriPage() {
  const router = useRouter();
  const [kategori, setKategori] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    id_kategori: '',
    nama_kategori: '',
    deskripsi: ''
  });
  const [formError, setFormError] = useState('');

  const fetchKategori = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    try {
      setLoading(true);
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
    setFormError('');
    
    const token = localStorage.getItem('token');
    const method = editMode ? 'PUT' : 'POST';
    
    try {
      const res = await fetch('/api/admin/kategori', {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message || (editMode ? 'Kategori berhasil diupdate' : 'Kategori berhasil ditambahkan'));
        setShowModal(false);
        resetForm();
        fetchKategori();
      } else {
        setFormError(data.error || 'Gagal menyimpan data');
      }
    } catch (error) {
      setFormError('Terjadi kesalahan: ' + error.message);
    }
  };

  const handleDelete = async (id, namaKategori) => {
    if (!confirm(`Yakin ingin menghapus kategori "${namaKategori}"?`)) return;
    
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/admin/kategori?id_kategori=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        alert('Kategori berhasil dihapus');
        fetchKategori();
      } else {
        const data = await res.json();
        alert(data.error || 'Gagal menghapus kategori');
      }
    } catch (error) {
      alert('Terjadi kesalahan: ' + error.message);
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

  const handleOpenModal = () => {
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      id_kategori: '',
      nama_kategori: '',
      deskripsi: ''
    });
    setEditMode(false);
    setFormError('');
  };

  const filteredKategori = kategori.filter(k => {
    if (!searchQuery) return true;
    return k.nama_kategori?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           k.deskripsi?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <RoleProtection allowedRoles={['admin']}>
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data kategori...</p>
          </div>
        </div>
      </RoleProtection>
    );
  }

  return (
    <RoleProtection allowedRoles={['admin']}>
      <div className="min-h-screen bg-linear-to-brrom-slate-50 to-blue-50">
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
              <h1 className="text-xl font-bold text-gray-800">Manajemen Kategori</h1>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          {/* Stats Card */}
          <div className="bg-linear-to-br from-blue-500 to-indigo-600 text-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">Total Kategori</p>
                <p className="text-4xl font-bold">{kategori.length}</p>
              </div>
              <Folder size={48} className="opacity-50" />
            </div>
          </div>

          {/* Search & Add Button */}
          <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">Daftar Kategori</h2>
              <button
                onClick={handleOpenModal}
                className="flex items-center gap-2 bg-linear-to-brrom-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
              >
                <Plus size={20} />
                Tambah Kategori
              </button>
            </div>
            
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kategori..."
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              {filteredKategori.length === 0 ? (
                <div className="py-20 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Folder className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    {searchQuery ? 'Kategori tidak ditemukan' : 'Belum ada kategori'}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {searchQuery 
                      ? 'Coba kata kunci lain' 
                      : 'Klik tombol "Tambah Kategori" untuk membuat kategori baru'}
                  </p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-linear-to-brrom-blue-50 to-indigo-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Nama Kategori
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Deskripsi
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredKategori.map((item, idx) => (
                      <tr key={item.id_kategori} className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-gray-600">#{item.id_kategori}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Tag size={20} className="text-blue-600" />
                            </div>
                            <span className="font-semibold text-gray-800">{item.nama_kategori}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-2">
                            <FileText size={16} className="text-gray-400 mt-0.5 shrink-0" />
                            <span className="text-sm text-gray-600 line-clamp-2">
                              {item.deskripsi || '-'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id_kategori, item.nama_kategori)}
                              className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                              title="Hapus"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="text-sm text-gray-600 text-center">
            Menampilkan {filteredKategori.length} dari {kategori.length} kategori
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editMode ? 'Edit Kategori' : 'Tambah Kategori'}
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
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Tag className="w-4 h-4 text-blue-600" />
                    Nama Kategori
                  </label>
                  <input
                    type="text"
                    value={formData.nama_kategori}
                    onChange={(e) => setFormData({...formData, nama_kategori: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                    placeholder="Masukkan nama kategori"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Deskripsi
                  </label>
                  <textarea
                    value={formData.deskripsi}
                    onChange={(e) => setFormData({...formData, deskripsi: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all resize-none"
                    rows="4"
                    placeholder="Masukkan deskripsi kategori (opsional)"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-linear-to-br from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
                  >
                    {editMode ? 'Update' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RoleProtection>
  );
}