/* eslint-disable react-hooks/exhaustive-deps */
// src/app/admin/pengembalian/page.jsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Wrench, User, Calendar, DollarSign, AlertCircle, Search, CheckCircle } from 'lucide-react';
import RoleProtection from '@/components/RoleProtection';

export default function PengembalianPage() {
  const router = useRouter();
  const [peminjamanAktif, setPeminjamanAktif] = useState([]);
  const [riwayatPengembalian, setRiwayatPengembalian] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [processing, setProcessing] = useState(null);
  const [selectedPeminjaman, setSelectedPeminjaman] = useState(null);
  const [tanggalKembali, setTanggalKembali] = useState('');
  const [activeTab, setActiveTab] = useState('proses');

  // Initialize tanggal kembali saat component mount
  useEffect(() => {
    setTanggalKembali(formatDateInput(new Date()));
  }, []);

  // Fetch data saat component mount
  useEffect(() => {
    fetchData();
  }, []); // PENTING: Empty dependency array agar hanya run sekali

  function formatDateInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

  async function fetchData() {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    try {
      setLoading(true);
      
      // Fetch peminjaman yang disetujui (belum dikembalikan)
      const peminjamanRes = await fetch('/api/admin/peminjaman', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const peminjamanData = await peminjamanRes.json();
      const aktif = (peminjamanData.data || []).filter(p => p.status === 'disetujui');
      setPeminjamanAktif(aktif);

      // Fetch riwayat pengembalian
      const pengembalianRes = await fetch('/api/admin/pengembalian', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const pengembalianData = await pengembalianRes.json();
      setRiwayatPengembalian(pengembalianData.data || []);
      
    } catch (e) {
      setError(e.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }

  function calculateDenda(tanggalRencana, tanggalAktual) {
    const rencana = new Date(tanggalRencana);
    const aktual = new Date(tanggalAktual);
    const diffTime = aktual - rencana;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      return diffDays * 5000;
    }
    return 0;
  }

  function calculateBiayaSewa(tanggalPinjam, tanggalKembali, hargaSewa) {
    const pinjam = new Date(tanggalPinjam);
    const kembali = new Date(tanggalKembali);
    const diffTime = kembali - pinjam;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(1, diffDays) * (hargaSewa || 0);
  }

  function handleSelectPeminjaman(p) {
    setSelectedPeminjaman(p);
    setError('');
  }

  async function handleProsesPengembalian() {
    if (!selectedPeminjaman) return;
    if (!tanggalKembali) {
      setError('Tanggal kembali harus diisi');
      return;
    }

    const denda = calculateDenda(selectedPeminjaman.tanggal_kembali_rencana, tanggalKembali);
    const confirmText = denda > 0
      ? `Proses pengembalian dengan denda Rp ${denda.toLocaleString('id-ID')}?`
      : 'Proses pengembalian alat?';

    if (!confirm(confirmText)) return;

    try {
      setProcessing(selectedPeminjaman.id_peminjaman);
      setError('');

      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/pengembalian', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id_peminjaman: selectedPeminjaman.id_peminjaman,
          tanggal_kembali: tanggalKembali,
        }),
      });

      if (response.ok) {
        alert('Pengembalian berhasil diproses!');
        setSelectedPeminjaman(null);
        setTanggalKembali(formatDateInput(new Date()));
        await fetchData();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Gagal memproses pengembalian');
      }
    } catch (e) {
      setError(e.message || 'Gagal memproses pengembalian');
    } finally {
      setProcessing(null);
    }
  }

  const filteredPeminjamanAktif = peminjamanAktif.filter(p => {
    if (!searchQuery) return true;
    return (
      p.nama_alat?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nama_peminjam?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const filteredRiwayat = riwayatPengembalian.filter(p => {
    if (!searchQuery) return true;
    return (
      p.nama_alat?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nama_peminjam?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (loading) {
    return (
      <RoleProtection allowedRoles={['admin']}>
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data...</p>
          </div>
        </div>
      </RoleProtection>
    );
  }

  return (
    <RoleProtection allowedRoles={['admin']}>
      <div className="min-h-screen bg-linear-to-br from-green-50 to-blue-50">
        {/* Header */}
        <nav className="bg-white shadow-md sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
              >
                <ArrowLeft size={20} />
                <span className="font-medium">Kembali ke Dashboard</span>
              </button>
              <h1 className="text-xl font-bold text-gray-800">Manajemen Pengembalian</h1>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-md p-2 flex gap-2">
            <button
              onClick={() => setActiveTab('proses')}
              className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
                activeTab === 'proses'
                  ? 'bg-linear-to-r from-green-600 to-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Proses Pengembalian ({peminjamanAktif.length})
            </button>
            <button
              onClick={() => setActiveTab('riwayat')}
              className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
                activeTab === 'riwayat'
                  ? 'bg-linear-to-r from-green-600 to-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Riwayat Pengembalian ({riwayatPengembalian.length})
            </button>
          </div>

          {/* Search */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama alat atau peminjam..."
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
              <AlertCircle size={20} />
              <p>{error}</p>
            </div>
          )}

          {activeTab === 'proses' ? (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* List Peminjaman Aktif */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-linear-to-r from-green-50 to-blue-50">
                  <h2 className="text-xl font-bold text-gray-800">
                    Alat Dipinjam ({filteredPeminjamanAktif.length})
                  </h2>
                </div>

                {filteredPeminjamanAktif.length === 0 ? (
                  <div className="py-20 text-center">
                    <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Tidak ada alat yang sedang dipinjam</p>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                    {filteredPeminjamanAktif.map((p) => {
                      const isSelected = selectedPeminjaman?.id_peminjaman === p.id_peminjaman;
                      const hariTerlambat = Math.max(0, Math.floor(
                        (new Date() - new Date(p.tanggal_kembali_rencana)) / (1000 * 60 * 60 * 24)
                      ));

                      return (
                        <button
                          key={p.id_peminjaman}
                          onClick={() => handleSelectPeminjaman(p)}
                          className={`w-full p-4 text-left transition-all ${
                            isSelected 
                              ? 'bg-green-50 border-l-4 border-green-500' 
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                  <Wrench size={20} className="text-orange-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-800">{p.nama_alat}</p>
                                  <p className="text-xs text-gray-500">ID: #{p.id_alat}</p>
                                </div>
                              </div>
                              {hariTerlambat > 0 && (
                                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                                  +{hariTerlambat} hari
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <User size={14} />
                              <span>{p.nama_peminjam || 'User'}</span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar size={14} />
                              <span>Target: {formatDate(p.tanggal_kembali_rencana)}</span>
                            </div>

                            {hariTerlambat > 0 && (
                              <div className="flex items-center gap-2 text-sm text-red-600 font-semibold">
                                <AlertCircle size={14} />
                                <span>Terlambat {hariTerlambat} hari</span>
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Form Pengembalian */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-linear-to-r from-green-50 to-blue-50">
                  <h2 className="text-xl font-bold text-gray-800">Form Pengembalian</h2>
                </div>

                <div className="p-6 space-y-6">
                  {!selectedPeminjaman ? (
                    <div className="py-20 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500">Pilih peminjaman dari daftar</p>
                    </div>
                  ) : (
                    <>
                      {/* Info Peminjaman */}
                      <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                        <h3 className="font-bold text-gray-800">Detail Peminjaman</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Alat:</span>
                            <span className="font-semibold">{selectedPeminjaman.nama_alat}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Peminjam:</span>
                            <span className="font-semibold">{selectedPeminjaman.nama_peminjam}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tanggal Pinjam:</span>
                            <span className="font-semibold">{formatDate(selectedPeminjaman.tanggal_pinjam)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Target Kembali:</span>
                            <span className="font-semibold">{formatDate(selectedPeminjaman.tanggal_kembali_rencana)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Form Input */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                          <Calendar className="w-4 h-4 text-green-600" />
                          Tanggal Pengembalian Aktual
                        </label>
                        <input
                          type="date"
                          value={tanggalKembali}
                          onChange={(e) => setTanggalKembali(e.target.value)}
                          max={formatDateInput(new Date())}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                        />
                      </div>

                      {/* Denda & Biaya Calculation */}
                      {tanggalKembali && (
                        <div className="space-y-3">
                          <div className={`p-4 rounded-xl ${
                            calculateDenda(selectedPeminjaman.tanggal_kembali_rencana, tanggalKembali) > 0
                              ? 'bg-orange-50 border-2 border-orange-200'
                              : 'bg-green-50 border-2 border-green-200'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold text-gray-700">Denda Keterlambatan:</span>
                              <div className="flex items-center gap-2">
                                <DollarSign size={20} className={
                                  calculateDenda(selectedPeminjaman.tanggal_kembali_rencana, tanggalKembali) > 0
                                    ? 'text-orange-600'
                                    : 'text-green-600'
                                } />
                                <span className={`text-2xl font-bold ${
                                  calculateDenda(selectedPeminjaman.tanggal_kembali_rencana, tanggalKembali) > 0
                                    ? 'text-orange-600'
                                    : 'text-green-600'
                                }`}>
                                  Rp {calculateDenda(selectedPeminjaman.tanggal_kembali_rencana, tanggalKembali).toLocaleString('id-ID')}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600">
                              {calculateDenda(selectedPeminjaman.tanggal_kembali_rencana, tanggalKembali) > 0
                                ? `Terlambat ${Math.floor((new Date(tanggalKembali) - new Date(selectedPeminjaman.tanggal_kembali_rencana)) / (1000 * 60 * 60 * 24))} hari × Rp 5.000`
                                : 'Tidak ada denda (tepat waktu)'}
                            </p>
                          </div>

                          <div className="p-4 rounded-xl bg-blue-50 border-2 border-blue-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold text-gray-700">Biaya Sewa:</span>
                              <span className="text-2xl font-bold text-blue-600">
                                Rp {calculateBiayaSewa(
                                  selectedPeminjaman.tanggal_pinjam,
                                  tanggalKembali,
                                  selectedPeminjaman.harga_sewa
                                ).toLocaleString('id-ID')}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600">
                              {Math.ceil((new Date(tanggalKembali) - new Date(selectedPeminjaman.tanggal_pinjam)) / (1000 * 60 * 60 * 24))} hari × Rp {(selectedPeminjaman.harga_sewa || 0).toLocaleString('id-ID')}
                            </p>
                          </div>

                          <div className="p-4 rounded-xl bg-purple-50 border-2 border-purple-200">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-gray-700">Total Pembayaran:</span>
                              <span className="text-2xl font-bold text-purple-600">
                                Rp {(
                                  calculateBiayaSewa(selectedPeminjaman.tanggal_pinjam, tanggalKembali, selectedPeminjaman.harga_sewa) +
                                  calculateDenda(selectedPeminjaman.tanggal_kembali_rencana, tanggalKembali)
                                ).toLocaleString('id-ID')}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Submit Button */}
                      <button
                        onClick={handleProsesPengembalian}
                        disabled={processing || !tanggalKembali}
                        className="w-full py-4 bg-linear-to-r from-green-600 to-blue-600 text-white rounded-xl font-bold text-lg hover:from-green-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processing ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Memproses...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <CheckCircle size={20} />
                            Proses Pengembalian
                          </span>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Riwayat Pengembalian */
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-linear-to-r from-green-50 to-blue-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Peminjam</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Alat</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Tgl Pinjam</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Tgl Kembali Rencana</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Tgl Kembali Aktual</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Denda</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRiwayat.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center">
                          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">Belum ada riwayat pengembalian</p>
                        </td>
                      </tr>
                    ) : (
                      filteredRiwayat.map((item) => (
                        <tr key={item.id_pengembalian} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <User size={16} className="text-blue-500" />
                              <span className="font-medium text-gray-800">{item.nama_peminjam}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Wrench size={16} className="text-orange-500" />
                              <span className="font-medium text-gray-800">{item.nama_alat}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-700">{formatDate(item.tanggal_pinjam)}</td>
                          <td className="px-6 py-4 text-gray-700">{formatDate(item.tanggal_kembali_rencana)}</td>
                          <td className="px-6 py-4 text-gray-700">{formatDate(item.tanggal_kembali)}</td>
                          <td className="px-6 py-4">
                            <span className={`font-semibold ${item.denda > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              Rp {(item.denda || 0).toLocaleString('id-ID')}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </RoleProtection>
  );
}