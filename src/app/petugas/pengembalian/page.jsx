// src/app/petugas/pengembalian/page.jsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { getUser } from '@/lib/client-auth';
import { 
  ArrowLeft, Wrench, User, Calendar, DollarSign, Package,
  AlertCircle, Search, CheckCircle, Clock
} from 'lucide-react';
import RoleProtection from '@/components/RoleProtection';

export default function PetugasPengembalianPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [peminjaman, setPeminjaman] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [processing, setProcessing] = useState(null);
  const [selectedPeminjaman, setSelectedPeminjaman] = useState(null);
  const [tanggalKembali, setTanggalKembali] = useState('');

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser || currentUser.role !== 'petugas') {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    loadPeminjaman();
    setTanggalKembali(formatDateInput(new Date()));
  }, [router]);

  function formatDateInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async function loadPeminjaman() {
    try {
      setLoading(true);
      const data = await apiFetch('/api/petugas/peminjaman?status=disetujui');
      setPeminjaman(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Gagal memuat data peminjaman');
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

  function calculateBiayaSewa(tanggalPinjam, tanggalKembali, hargaSewa, jumlah) {
    const pinjam = new Date(tanggalPinjam);
    const kembali = new Date(tanggalKembali);
    const diffTime = kembali - pinjam;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(1, diffDays) * (hargaSewa || 0) * (jumlah || 1);
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
    const biayaSewa = calculateBiayaSewa(
      selectedPeminjaman.tanggal_pinjam, 
      tanggalKembali, 
      selectedPeminjaman.harga_sewa,
      selectedPeminjaman.jumlah
    );
    const total = biayaSewa + denda;

    const confirmText = denda > 0
      ? `Proses pengembalian dengan:\n• Biaya Sewa: Rp ${biayaSewa.toLocaleString('id-ID')}\n• Denda: Rp ${denda.toLocaleString('id-ID')}\n• Total: Rp ${total.toLocaleString('id-ID')}`
      : `Proses pengembalian dengan biaya sewa Rp ${biayaSewa.toLocaleString('id-ID')}?`;

    if (!confirm(confirmText)) return;

    try {
      setProcessing(selectedPeminjaman.id_peminjaman);
      setError('');

      await apiFetch('/api/petugas/pengembalian', {
        method: 'POST',
        body: JSON.stringify({
          id_peminjaman: selectedPeminjaman.id_peminjaman,
          tanggal_kembali: tanggalKembali,
        }),
      });

      alert('Pengembalian berhasil diproses!');
      setSelectedPeminjaman(null);
      setTanggalKembali(formatDateInput(new Date()));
      await loadPeminjaman();
    } catch (e) {
      setError(e.message || 'Gagal memproses pengembalian');
    } finally {
      setProcessing(null);
    }
  }

  const filteredPeminjaman = peminjaman.filter(p => {
    if (!searchQuery) return true;
    return (
      p.nama_alat?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nama_user?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

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
            <h1 className="text-xl font-bold text-gray-800">Proses Pengembalian</h1>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Stats */}
        <div className="bg-linear-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Alat Yang Sedang Dipinjam</p>
              <p className="text-4xl font-bold">{peminjaman.length}</p>
            </div>
            <Clock size={48} className="opacity-50" />
          </div>
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

        <div className="grid lg:grid-cols-2 gap-6">
          {/* List Peminjaman */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-linear-to-r from-green-50 to-blue-50">
              <h2 className="text-xl font-bold text-gray-800">
                Pilih Peminjaman ({filteredPeminjaman.length})
              </h2>
            </div>

            {loading ? (
              <div className="py-20 text-center">
                <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">Memuat data...</p>
              </div>
            ) : filteredPeminjaman.length === 0 ? (
              <div className="py-20 text-center">
                <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Tidak ada alat yang sedang dipinjam</p>
              </div>
            ) : (
              <div className="max-h-150 overflow-y-auto divide-y divide-gray-100">
                {filteredPeminjaman.map((p) => {
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
                              <p className="text-xs text-gray-500">
                                {p.jumlah || 1} unit • Rp {(p.harga_sewa || 0).toLocaleString('id-ID')}/hari
                              </p>
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
                          <span>{p.nama_user || 'User'}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar size={14} />
                          <span>Target: {new Date(p.tanggal_kembali_rencana).toLocaleDateString('id-ID')}</span>
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
                        <span className="text-gray-600">Jumlah:</span>
                        <span className="font-semibold">{selectedPeminjaman.jumlah || 1} unit</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Peminjam:</span>
                        <span className="font-semibold">{selectedPeminjaman.nama_user}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tanggal Pinjam:</span>
                        <span className="font-semibold">
                          {new Date(selectedPeminjaman.tanggal_pinjam).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Target Kembali:</span>
                        <span className="font-semibold">
                          {new Date(selectedPeminjaman.tanggal_kembali_rencana).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Form Input - FIXED: min instead of max */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 text-green-600" />
                      Tanggal Pengembalian Aktual
                    </label>
                    <input
                      type="date"
                      value={tanggalKembali}
                      onChange={(e) => setTanggalKembali(e.target.value)}
                      min={selectedPeminjaman.tanggal_pinjam}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Minimal: {new Date(selectedPeminjaman.tanggal_pinjam).toLocaleDateString('id-ID')}
                    </p>
                  </div>

                  {/* Biaya & Denda Calculation */}
                  {tanggalKembali && (
                    <div className="space-y-3">
                      {/* Biaya Sewa */}
                      <div className="p-4 rounded-xl bg-blue-50 border-2 border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-700">Biaya Sewa:</span>
                          <span className="text-2xl font-bold text-blue-600">
                            Rp {calculateBiayaSewa(
                              selectedPeminjaman.tanggal_pinjam,
                              tanggalKembali,
                              selectedPeminjaman.harga_sewa,
                              selectedPeminjaman.jumlah
                            ).toLocaleString('id-ID')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">
                          {Math.ceil((new Date(tanggalKembali) - new Date(selectedPeminjaman.tanggal_pinjam)) / (1000 * 60 * 60 * 24))} hari × Rp {(selectedPeminjaman.harga_sewa || 0).toLocaleString('id-ID')} × {selectedPeminjaman.jumlah || 1} unit
                        </p>
                      </div>

                      {/* Denda */}
                      <div className={`p-4 rounded-xl ${
                        calculateDenda(selectedPeminjaman.tanggal_kembali_rencana, tanggalKembali) > 0
                          ? 'bg-orange-50 border-2 border-orange-200'
                          : 'bg-green-50 border-2 border-green-200'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-700">Denda Keterlambatan:</span>
                          <div className="flex items-center gap-2">
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

                      {/* Total */}
                      <div className="p-4 rounded-xl bg-purple-50 border-2 border-purple-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-700">Total Pembayaran:</span>
                          <span className="text-2xl font-bold text-purple-600">
                            Rp {(
                              calculateBiayaSewa(selectedPeminjaman.tanggal_pinjam, tanggalKembali, selectedPeminjaman.harga_sewa, selectedPeminjaman.jumlah) +
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
      </div>
    </div>
    </RoleProtection>
  );
}