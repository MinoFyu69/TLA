/* eslint-disable react-hooks/exhaustive-deps */
// src/app/peminjam/alat/[id]/page.jsx

"use client";

import { useEffect, useState, use } from "react";
import { 
  ArrowLeft, Package, FileText, Tag, Wrench, DollarSign, Calendar, AlertCircle, CheckCircle, Calculator
} from "lucide-react";
import RoleProtection from "@/components/RoleProtection";
import Image from "next/image";

export default function AlatDetailPage({ params }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const [alat, setAlat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    tanggal_pinjam: '',
    tanggal_kembali_rencana: '',
    jumlah: 1
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        window.location.href = '/login';
        return;
      }

      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/peminjam/alat', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      const foundAlat = data.data.find((a) => a.id_alat === parseInt(id));

      if (!foundAlat) {
        setError("Alat tidak ditemukan.");
      } else {
        setAlat(foundAlat);
        
        // Set default tanggal
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        setFormData({
          tanggal_pinjam: formatDateInput(today),
          tanggal_kembali_rencana: formatDateInput(tomorrow),
          jumlah: 1
        });
      }
    } catch (e) {
      setError(e.message || "Gagal memuat detail alat.");
    } finally {
      setLoading(false);
    }
  }

  function formatDateInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Hitung durasi dan total biaya
  function calculateRentalCost() {
    if (!formData.tanggal_pinjam || !formData.tanggal_kembali_rencana || !alat) {
      return { days: 0, totalCost: 0 };
    }

    const startDate = new Date(formData.tanggal_pinjam);
    const endDate = new Date(formData.tanggal_kembali_rencana);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const totalCost = diffDays * (alat.harga_sewa || 0) * (formData.jumlah || 1);
    
    return { days: diffDays, totalCost };
  }

  async function handleSubmitPeminjaman(e) {
    e.preventDefault();
    
    if (!formData.tanggal_pinjam || !formData.tanggal_kembali_rencana || !formData.jumlah) {
      alert('Mohon lengkapi semua field');
      return;
    }

    if (formData.jumlah <= 0) {
      alert('Jumlah harus lebih dari 0');
      return;
    }

    if (formData.jumlah > alat.stok) {
      alert(`Stok tidak mencukupi. Stok tersedia: ${alat.stok}`);
      return;
    }

    const pinjam = new Date(formData.tanggal_pinjam);
    const kembali = new Date(formData.tanggal_kembali_rencana);
    
    if (kembali <= pinjam) {
      alert('Tanggal kembali harus setelah tanggal pinjam');
      return;
    }

    const { days, totalCost } = calculateRentalCost();
    
    if (!confirm(`Ajukan peminjaman ${formData.jumlah}x ${alat.nama_alat} selama ${days} hari?\n\nTotal Biaya: Rp ${totalCost.toLocaleString('id-ID')}`)) return;

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));

      const response = await fetch('/api/peminjam/peminjaman', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id_user: user.id_user,
          id_alat: alat.id_alat,
          tanggal_pinjam: formData.tanggal_pinjam,
          tanggal_kembali_rencana: formData.tanggal_kembali_rencana,
          jumlah: formData.jumlah
        })
      });

      const result = await response.json();

      if (response.ok) {
        alert('Peminjaman berhasil diajukan! Menunggu persetujuan admin.');
        setShowModal(false);
        window.location.href = '/peminjam/history';
      } else {
        alert(result.error || 'Gagal mengajukan peminjaman');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Terjadi kesalahan saat mengajukan peminjaman');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <RoleProtection allowedRoles={['peminjam']}>
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-indigo-50/30 to-cyan-50/30">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-600 font-medium">Memuat detail alat...</p>
          </div>
        </div>
      </RoleProtection>
    );
  }

  if (!alat && !loading) {
    return (
      <RoleProtection allowedRoles={['peminjam']}>
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-indigo-50/30 to-cyan-50/30">
          <div className="text-center space-y-6 animate-fadeIn">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
              <Wrench className="w-12 h-12 text-slate-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 mb-2">Alat Tidak Ditemukan</h1>
              <p className="text-slate-500 mb-6">Alat yang Anda cari tidak tersedia</p>
              <button
                onClick={() => window.location.href = "/peminjam"}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Katalog
              </button>
            </div>
          </div>
        </div>
      </RoleProtection>
    );
  }

  const available = alat.status === 'tersedia' && (alat.stok || 0) > 0;
  const { days, totalCost } = calculateRentalCost();

  return (
    <RoleProtection allowedRoles={['peminjam']}>
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-indigo-50/30 to-cyan-50/30 py-10 px-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <button
            onClick={() => window.location.href = "/peminjam"}
            className="group inline-flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Kembali ke Katalog
          </button>

          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-fadeInUp">
            <div className="lg:flex">
              {/* Image Section */}
              <div className="lg:w-2/5 bg-linear-to-br from-slate-100 to-slate-200 p-10 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iYmxhY2siIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50"></div>
                
                <div className="relative w-64 h-96 bg-white shadow-2xl rounded-2xl overflow-hidden group hover:scale-105 transition-transform duration-300 flex items-center justify-center">
                  {alat.gambar ? (
                    <Image
                      src={alat.gambar}
                      alt={alat.nama_alat}
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
                  <div className={`fallback-icon w-full h-full items-center justify-center ${alat.gambar ? 'hidden' : 'flex'}`}>
                    <Wrench className="w-32 h-32 text-slate-300" />
                  </div>
                </div>
              </div>

              {/* Info Section */}
              <div className="lg:w-3/5 p-8 lg:p-12 space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold">
                    {alat.nama_kategori || "Umum"}
                  </span>
                  <span className={`px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 ${
                    available 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${available ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                    {available ? 'Tersedia' : 'Tidak Tersedia'}
                  </span>
                  <span className="px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                    Stok: {alat.stok || 0}
                  </span>
                </div>

                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 leading-tight mb-3">
                    {alat.nama_alat}
                  </h1>
                  <p className="text-lg text-slate-600">
                    ID Alat: <span className="font-semibold">#{alat.id_alat}</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 py-6 border-y-2 border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wider font-semibold">
                      <Tag className="w-3 h-3" />
                      Kategori
                    </div>
                    <p className="font-semibold text-slate-800">{alat.nama_kategori || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wider font-semibold">
                      <Wrench className="w-3 h-3" />
                      Kondisi
                    </div>
                    <p className="font-semibold text-slate-800 capitalize">{alat.kondisi || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wider font-semibold">
                      <Package className="w-3 h-3" />
                      Status
                    </div>
                    <p className={`font-semibold capitalize ${available ? 'text-emerald-600' : 'text-red-600'}`}>
                      {alat.status}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wider font-semibold">
                      <DollarSign className="w-3 h-3" />
                      Harga Sewa/Hari
                    </div>
                    <p className="font-semibold text-slate-800">
                      Rp {(alat.harga_sewa || 0).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                {/* Deskripsi */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-xl font-bold text-slate-800">Deskripsi Alat</h2>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                    <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                      {alat.deskripsi || "Tidak ada deskripsi untuk alat ini."}
                    </p>
                  </div>
                </div>

                {/* Tombol Ajukan Peminjaman */}
                {available ? (
                  <button
                    onClick={() => setShowModal(true)}
                    className="w-full py-4 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={24} />
                    Ajukan Peminjaman
                  </button>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                    <div>
                      <p className="font-semibold text-red-800">Alat Tidak Tersedia</p>
                      <p className="text-sm text-red-600">Stok habis atau sedang dipinjam</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Peminjaman */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Blur Backdrop */}
            <div 
              className="absolute inset-0 bg-black/30 backdrop-blur-md"
              onClick={() => setShowModal(false)}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">Form Peminjaman</h2>
                <p className="text-sm text-gray-600 mt-1">Ajukan peminjaman untuk {alat.nama_alat}</p>
              </div>

              <form onSubmit={handleSubmitPeminjaman} className="p-6 space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Package className="w-4 h-4 text-green-600" />
                    Jumlah Item
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={alat.stok}
                    value={formData.jumlah}
                    onChange={(e) => setFormData({...formData, jumlah: parseInt(e.target.value) || 1})}
                    className="w-full border-2 border-gray-200 px-4 py-2 rounded-lg focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Stok tersedia: {alat.stok}</p>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    Tanggal Pinjam
                  </label>
                  <input
                    type="date"
                    value={formData.tanggal_pinjam}
                    onChange={(e) => setFormData({...formData, tanggal_pinjam: e.target.value})}
                    min={formatDateInput(new Date())}
                    className="w-full border-2 border-gray-200 px-4 py-2 rounded-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    Tanggal Kembali (Rencana)
                  </label>
                  <input
                    type="date"
                    value={formData.tanggal_kembali_rencana}
                    onChange={(e) => setFormData({...formData, tanggal_kembali_rencana: e.target.value})}
                    min={formData.tanggal_pinjam || formatDateInput(new Date())}
                    className="w-full border-2 border-gray-200 px-4 py-2 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all"
                    required
                  />
                </div>

                {/* Ringkasan Biaya */}
                {days > 0 && (
                  <div className="bg-linear-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-green-800 font-bold mb-2">
                      <Calculator className="w-5 h-5" />
                      <span>Ringkasan Biaya</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Durasi Sewa:</span>
                        <span className="font-semibold text-gray-800">{days} hari</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Harga/Hari:</span>
                        <span className="font-semibold text-gray-800">Rp {(alat.harga_sewa || 0).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Jumlah Item:</span>
                        <span className="font-semibold text-gray-800">{formData.jumlah}x</span>
                      </div>
                      <div className="border-t-2 border-green-300 pt-2 mt-2 flex justify-between">
                        <span className="text-green-800 font-bold">Total Biaya:</span>
                        <span className="text-green-800 font-bold text-lg">Rp {totalCost.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">Catatan:</span> Peminjaman akan menunggu persetujuan dari admin. Anda akan mendapat notifikasi setelah disetujui.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Mengirim...' : 'Ajukan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
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

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }
      `}</style>
    </RoleProtection>
  );
}