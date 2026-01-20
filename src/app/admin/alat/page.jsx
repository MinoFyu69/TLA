/* eslint-disable react-hooks/exhaustive-deps */
// D:\Projek Coding\APA\src\app\admin\Alat\page.jsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RoleProtection from '@/components/RoleProtection';
import { ArrowLeft, Plus, Edit2, Trash2, Image as ImageIcon, Wrench, DollarSign } from 'lucide-react';
import Image from 'next/image';

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
    status: 'tersedia',
    gambar: '',
    stok: 1,
    harga_sewa: 0,
    deskripsi: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    try {
      setLoading(true);
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
  };

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
      status: item.status,
      gambar: item.gambar || '',
      stok: item.stok || 1,
      harga_sewa: item.harga_sewa || 0,
      deskripsi: item.deskripsi || ''
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
      status: 'tersedia',
      gambar: '',
      stok: 1,
      harga_sewa: 0,
      deskripsi: ''
    });
    setEditMode(false);
  };

  if (loading) {
    return (
      <RoleProtection allowedRoles={['admin']}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
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
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/admin/dashboard')}
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <ArrowLeft size={20} />
                  <span className="font-medium">Kembali</span>
                </button>
                <div className="h-6 w-px bg-gray-300"></div>
                <h1 className="text-xl font-bold text-gray-800">Manajemen Alat</h1>
              </div>
              <button
                onClick={() => { resetForm(); setShowModal(true); }}
                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus size={18} />
                Tambah Alat
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {alat.map((item) => (
              <div key={item.id_alat} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden">
                {/* Image */}
                <div className="relative h-48 bg-linear-to-br from-slate-100 to-slate-200 overflow-hidden">
                  {item.gambar ? (
                    <Image
                      src={item.gambar}
                      alt={item.nama_alat}
                      fill
                      className="object-cover"
                      unoptimized
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget
                          .parentElement
                          ?.querySelector(".fallback-icon")
                          ?.classList.remove("hidden");
                      }}
                    />
                  ) : null}

                  <div className={`fallback-icon absolute inset-0 flex items-center justify-center ${item.gambar ? 'hidden' : 'flex'}`}>
                    <Wrench className="w-16 h-16 text-slate-300" />
                  </div>
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      item.status === 'tersedia' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  
                  {/* Stok Badge */}
                  <div className="absolute bottom-3 left-3">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-gray-800">
                      Stok: {item.stok || 0}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800 line-clamp-1">{item.nama_alat}</h3>
                    <p className="text-sm text-gray-500">ID: #{item.id_alat}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-gray-700">
                      Rp {(item.harga_sewa || 0).toLocaleString('id-ID')}/hari
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg font-medium">
                      {item.nama_kategori || 'Umum'}
                    </span>
                    <span className={`px-2 py-1 rounded-lg font-medium ${
                      item.kondisi === 'baik' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {item.kondisi}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="flex-1 flex items-center justify-center gap-2 bg-yellow-500 text-white px-3 py-2 rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id_alat)}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                    >
                      <Trash2 size={16} />
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {alat.length === 0 && (
            <div className="text-center py-20">
              <Wrench className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Belum ada alat yang terdaftar</p>
            </div>
          )}
        </div>

        {/* Modal with BLUR Background */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Blur Backdrop */}
            <div 
              className="absolute inset-0 bg-black/30 backdrop-blur-md"
              onClick={() => { setShowModal(false); resetForm(); }}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl z-10">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editMode ? 'Edit Alat' : 'Tambah Alat'}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nama Alat *
                  </label>
                  <input
                    type="text"
                    value={formData.nama_alat}
                    onChange={(e) => setFormData({...formData, nama_alat: e.target.value})}
                    className="w-full border-2 border-gray-200 px-4 py-2 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Kategori
                  </label>
                  <select
                    value={formData.id_kategori}
                    onChange={(e) => setFormData({...formData, id_kategori: e.target.value})}
                    className="w-full border-2 border-gray-200 px-4 py-2 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                  >
                    <option value="">Pilih Kategori</option>
                    {kategori.map((kat) => (
                      <option key={kat.id_kategori} value={kat.id_kategori}>
                        {kat.nama_kategori}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <ImageIcon size={16} />
                    URL Gambar
                  </label>
                  <input
                    type="url"
                    value={formData.gambar}
                    onChange={(e) => setFormData({...formData, gambar: e.target.value})}
                    className="w-full border-2 border-gray-200 px-4 py-2 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                    placeholder="https://example.com/image.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Masukkan link URL gambar alat</p>
                  
                  {/* Preview */}
                  {formData.gambar && (
                    <div className="mt-3 relative h-40 bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={formData.gambar}
                        alt="preview"
                        fill
                        className="object-cover"
                        unoptimized
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget
                            .parentElement
                            ?.querySelector(".error-text")
                            ?.classList.remove("hidden");
                        }}
                      />
                      <div className="error-text absolute inset-0 items-center justify-center bg-red-50 flex">
                        <p className="text-red-600 text-sm">✘ Gambar gagal dimuat</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Stok *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.stok}
                      onChange={(e) => setFormData({...formData, stok: parseInt(e.target.value) || 0})}
                      className="w-full border-2 border-gray-200 px-4 py-2 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <DollarSign size={16} className="text-green-600" />
                      Harga Sewa/Hari *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={formData.harga_sewa}
                      onChange={(e) => setFormData({...formData, harga_sewa: parseInt(e.target.value) || 0})}
                      className="w-full border-2 border-gray-200 px-4 py-2 rounded-lg focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                      placeholder="50000"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Deskripsi
                  </label>
                  <textarea
                    value={formData.deskripsi}
                    onChange={(e) => setFormData({...formData, deskripsi: e.target.value})}
                    className="w-full border-2 border-gray-200 px-4 py-2 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                    rows="3"
                    placeholder="Deskripsi detail tentang alat..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Kondisi
                    </label>
                    <select
                      value={formData.kondisi}
                      onChange={(e) => setFormData({...formData, kondisi: e.target.value})}
                      className="w-full border-2 border-gray-200 px-4 py-2 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                    >
                      <option value="baik">Baik</option>
                      <option value="rusak">Rusak</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full border-2 border-gray-200 px-4 py-2 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                    >
                      <option value="tersedia">Tersedia</option>
                      <option value="dipinjam">Dipinjam</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition-colors font-semibold"
                  >
                    {editMode ? 'Update' : 'Simpan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                  >
                    Batal
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