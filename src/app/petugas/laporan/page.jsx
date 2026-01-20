// src/app/petugas/laporan/page.jsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { getUser } from '@/lib/client-auth';
import { 
  ArrowLeft, FileText, Download, Calendar, DollarSign,
  TrendingUp, Package, Users, Wrench, Filter
} from 'lucide-react';
import RoleProtection from '@/components/RoleProtection';

export default function PetugasLaporanPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Filter states
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Data states
  const [laporanData, setLaporanData] = useState(null);

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser || currentUser.role !== 'petugas') {
      router.push('/login');
      return;
    }
    setUser(currentUser);

    // Set default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setDateFrom(formatDateInput(thirtyDaysAgo));
    setDateTo(formatDateInput(today));
  }, [router]);

  function formatDateInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async function loadLaporan() {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        date_from: dateFrom,
        date_to: dateTo,
        status: filterStatus,
      });

      const data = await apiFetch(`/api/petugas/laporan?${params}`);
      setLaporanData(data);
    } catch (e) {
      setError(e.message || 'Gagal memuat laporan');
    } finally {
      setLoading(false);
    }
  }

  function handleExportPDF() {
    if (!laporanData) return;
    
    // Create printable content
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Laporan Peminjaman Alat - ${dateFrom} s/d ${dateTo}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              color: #333;
            }
            h1 {
              color: #059669;
              border-bottom: 3px solid #059669;
              padding-bottom: 10px;
            }
            .header {
              margin-bottom: 30px;
            }
            .summary {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 20px;
              margin-bottom: 30px;
            }
            .summary-card {
              border: 2px solid #e5e7eb;
              border-radius: 8px;
              padding: 15px;
              text-align: center;
            }
            .summary-card h3 {
              margin: 0 0 10px 0;
              font-size: 14px;
              color: #6b7280;
            }
            .summary-card p {
              margin: 0;
              font-size: 28px;
              font-weight: bold;
              color: #059669;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #e5e7eb;
              padding: 12px;
              text-align: left;
            }
            th {
              background-color: #f3f4f6;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
            .footer {
              margin-top: 40px;
              text-align: right;
              font-size: 12px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 Laporan Peminjaman Alat</h1>
            <p><strong>Periode:</strong> ${new Date(dateFrom).toLocaleDateString('id-ID')} - ${new Date(dateTo).toLocaleDateString('id-ID')}</p>
            <p><strong>Dicetak oleh:</strong> ${user?.nama || 'Petugas'}</p>
            <p><strong>Tanggal Cetak:</strong> ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
          </div>

          <div class="summary">
            <div class="summary-card">
              <h3>Total Peminjaman</h3>
              <p>${laporanData.summary.total_peminjaman}</p>
            </div>
            <div class="summary-card">
              <h3>Disetujui</h3>
              <p>${laporanData.summary.disetujui}</p>
            </div>
            <div class="summary-card">
              <h3>Dikembalikan</h3>
              <p>${laporanData.summary.dikembalikan}</p>
            </div>
            <div class="summary-card">
              <h3>Total Denda</h3>
              <p style="color: #dc2626;">Rp ${laporanData.summary.total_denda.toLocaleString('id-ID')}</p>
            </div>
          </div>

          <h2>Detail Peminjaman</h2>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Peminjam</th>
                <th>Alat</th>
                <th>Tanggal Pinjam</th>
                <th>Tanggal Kembali</th>
                <th>Status</th>
                <th>Denda</th>
              </tr>
            </thead>
            <tbody>
              ${laporanData.peminjaman.map((p, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${p.nama_user || '-'}</td>
                  <td>${p.nama_alat || '-'}</td>
                  <td>${new Date(p.tanggal_pinjam).toLocaleDateString('id-ID')}</td>
                  <td>${new Date(p.tanggal_kembali_rencana).toLocaleDateString('id-ID')}</td>
                  <td>${p.status}</td>
                  <td>Rp ${(p.denda || 0).toLocaleString('id-ID')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>Dicetak dari Sistem Peminjaman Alat - ${new Date().toLocaleString('id-ID')}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }

  function handleExportExcel() {
    if (!laporanData) return;

    // Create CSV content
    let csv = 'No,Peminjam,Alat,Tanggal Pinjam,Tanggal Kembali,Status,Denda\n';
    
    laporanData.peminjaman.forEach((p, idx) => {
      csv += `${idx + 1},"${p.nama_user || '-'}","${p.nama_alat || '-'}",${new Date(p.tanggal_pinjam).toLocaleDateString('id-ID')},${new Date(p.tanggal_kembali_rencana).toLocaleDateString('id-ID')},${p.status},${p.denda || 0}\n`;
    });

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `laporan-peminjaman-${dateFrom}-${dateTo}.csv`;
    link.click();
  }

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
            <h1 className="text-xl font-bold text-gray-800">Laporan Peminjaman</h1>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Filter Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Filter className="text-green-600" size={24} />
            <h2 className="text-xl font-bold text-gray-800">Filter Laporan</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4 text-green-600" />
                Dari Tanggal
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4 text-green-600" />
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Filter className="w-4 h-4 text-green-600" />
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
              >
                <option value="all">Semua Status</option>
                <option value="menunggu">Menunggu</option>
                <option value="disetujui">Disetujui</option>
                <option value="ditolak">Ditolak</option>
                <option value="dikembalikan">Dikembalikan</option>
              </select>
            </div>
          </div>

          <button
            onClick={loadLaporan}
            disabled={loading || !dateFrom || !dateTo}
            className="w-full py-3 bg-linear-to-r from-green-600 to-blue-600 text-white rounded-xl font-bold hover:from-green-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Memuat Laporan...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <FileText size={20} />
                Tampilkan Laporan
              </span>
            )}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        {laporanData && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-linear-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <Package size={24} className="opacity-80" />
                </div>
                <p className="text-sm opacity-90 mb-1">Total Peminjaman</p>
                <p className="text-3xl font-bold">{laporanData.summary.total_peminjaman}</p>
              </div>

              <div className="bg-linear-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp size={24} className="opacity-80" />
                </div>
                <p className="text-sm opacity-90 mb-1">Disetujui</p>
                <p className="text-3xl font-bold">{laporanData.summary.disetujui}</p>
              </div>

              <div className="bg-linear-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <Wrench size={24} className="opacity-80" />
                </div>
                <p className="text-sm opacity-90 mb-1">Dikembalikan</p>
                <p className="text-3xl font-bold">{laporanData.summary.dikembalikan}</p>
              </div>

              <div className="bg-linear-to-br from-orange-500 to-red-600 text-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign size={24} className="opacity-80" />
                </div>
                <p className="text-sm opacity-90 mb-1">Total Denda</p>
                <p className="text-2xl font-bold">
                  Rp {laporanData.summary.total_denda.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleExportPDF}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <Download size={20} />
                Export PDF
              </button>
              <button
                onClick={handleExportExcel}
                className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <Download size={20} />
                Export Excel (CSV)
              </button>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-linear-to-r from-green-50 to-blue-50">
                <h2 className="text-xl font-bold text-gray-800">
                  Detail Peminjaman ({laporanData.peminjaman.length})
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">No</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Peminjam</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Alat</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Tanggal</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase">Denda</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {laporanData.peminjaman.map((p, idx) => (
                      <tr key={p.id_peminjaman} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                        <td className="px-6 py-4 text-sm text-gray-800">{idx + 1}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Users size={16} className="text-gray-400" />
                            <span className="text-sm font-medium text-gray-800">{p.nama_user || '-'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Wrench size={16} className="text-orange-500" />
                            <span className="text-sm font-medium text-gray-800">{p.nama_alat || '-'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(p.tanggal_pinjam).toLocaleDateString('id-ID')} - {new Date(p.tanggal_kembali_rencana).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            p.status === 'menunggu' ? 'bg-yellow-100 text-yellow-700' :
                            p.status === 'disetujui' ? 'bg-blue-100 text-blue-700' :
                            p.status === 'ditolak' ? 'bg-red-100 text-red-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`font-bold ${(p.denda || 0) > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                            Rp {(p.denda || 0).toLocaleString('id-ID')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
    </RoleProtection>
  );
}