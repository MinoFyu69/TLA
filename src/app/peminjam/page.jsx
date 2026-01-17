// src/app/peminjam/page.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, Search, LogOut, AlertCircle, Filter, X, Package, History, Wrench } from "lucide-react";

export default function PeminjamPage() {
  const [alat, setAlat] = useState([]);
  const [kategori, setKategori] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKategori, setSelectedKategori] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const userData = localStorage.getItem('user');
        if (!userData) {
          window.location.href = '/login';
          return;
        }
        
        const currentUser = JSON.parse(userData);
        setUser(currentUser);

        const token = localStorage.getItem('token');
        
        // Load alat
        const alatRes = await fetch('/api/peminjam/alat', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const alatData = await alatRes.json();
        setAlat(Array.isArray(alatData.data) ? alatData.data : []);
        
        // Load kategori
        try {
          const kategoriRes = await fetch('/api/peminjam/kategori', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const kategoriData = await kategoriRes.json();
          setKategori(Array.isArray(kategoriData.data) ? kategoriData.data : []);
        } catch (err) {
          console.warn('Failed to load kategori:', err);
        }
        
      } catch (e) {
        setError(e.message || "Gagal memuat data alat");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredAlat = useMemo(() => {
    let result = alat;
    
    if (selectedKategori !== "all") {
      result = result.filter(item => item.id_kategori === parseInt(selectedKategori));
    }
    
    if (searchQuery) {
      const keyword = searchQuery.toLowerCase();
      result = result.filter((item) => {
        return item.nama_alat.toLowerCase().includes(keyword);
      });
    }
    
    return result;
  }, [alat, searchQuery, selectedKategori]);

  const handleLogout = async () => {
    if (!confirm('Yakin ingin logout?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-50 via-white to-cyan-50">
        <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-linear-to-br from-indigo-500 to-cyan-500 rounded-full mx-auto animate-pulse"></div>
          <h1 className="text-lg font-semibold text-slate-800">
            Menyiapkan halaman peminjam...
          </h1>
        </div>
      </div>
    );
  }

  const totalTersedia = alat.filter(item => item.status === 'tersedia').length;
  const totalAlat = alat.length;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-indigo-50/30 to-cyan-50/30">
      {/* Header */}
      <div className="relative overflow-hidden bg-linear-to-r from-indigo-600 via-purple-600 to-cyan-500">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-12 text-white">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3 animate-fadeInUp">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <p className="text-xs uppercase tracking-wider text-white/90 font-medium">
                  Portal Peminjam
                </p>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold">
                Halo, {user?.nama || "Peminjam"}! 👋
              </h1>
              <p className="text-white/90 text-base md:text-lg max-w-2xl">
                Jelajahi katalog alat berat dan ajukan peminjaman dengan mudah.
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="self-start md:self-auto group inline-flex items-center gap-2 rounded-full border-2 border-white/30 bg-white/10 backdrop-blur-sm px-5 py-3 text-sm font-medium hover:bg-white/20 hover:scale-105 transition-all duration-300"
            >
              <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* Stats Cards */}
        <section className="grid gap-6 md:grid-cols-3 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
          <div className="group relative overflow-hidden rounded-2xl bg-linear-to-br from-indigo-500 to-indigo-600 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <Wrench className="w-8 h-8 text-white/90" />
                <div className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold">
                  Total
                </div>
              </div>
              <p className="text-4xl font-bold text-white mb-1">{totalAlat}</p>
              <p className="text-sm text-indigo-100">Alat Tersedia</p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-linear-to-br from-emerald-500 to-emerald-600 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <Package className="w-8 h-8 text-white/90" />
                <div className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold">
                  Ready
                </div>
              </div>
              <p className="text-4xl font-bold text-white mb-1">{totalTersedia}</p>
              <p className="text-sm text-emerald-100">Siap Dipinjam</p>
            </div>
          </div>

          <button
            onClick={() => window.location.href = "/peminjam/history"}
            className="group relative overflow-hidden rounded-2xl bg-linear-to-br from-purple-500 to-purple-600 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-left"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <History className="w-8 h-8 text-white/90 group-hover:rotate-12 transition-transform" />
                <div className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold">
                  Klik
                </div>
              </div>
              <p className="text-2xl font-bold text-white mb-2">📦 History</p>
              <p className="text-sm text-purple-100">Lihat riwayat peminjaman</p>
            </div>
          </button>
        </section>

        {/* Katalog Alat */}
        <section className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          <div className="p-6 md:p-8 space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  🏗️ Katalog Alat Berat
                </h2>
                <p className="text-sm text-slate-500">
                  Temukan alat yang Anda butuhkan dari {filteredAlat.length} hasil
                </p>
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filter & Cari
                {showFilters ? <X className="w-4 h-4" /> : null}
              </button>
            </div>

            {/* Search and Filter */}
            <div className={`${showFilters ? 'block' : 'hidden lg:block'} space-y-4`}>
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama alat..."
                    className="w-full border-2 border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  )}
                </div>

                <div className="lg:w-64">
                  <select
                    value={selectedKategori}
                    onChange={(e) => setSelectedKategori(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all appearance-none bg-white cursor-pointer"
                  >
                    <option value="all">🏗️ Semua Kategori</option>
                    {kategori.map((kat) => (
                      <option key={kat.id_kategori} value={kat.id_kategori}>
                        {kat.nama_kategori}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {(searchQuery || selectedKategori !== "all") && (
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-slate-500 font-medium">Filter aktif:</span>
                  {searchQuery && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
                      🔍 &quot;{searchQuery}&quot;
                      <button onClick={() => setSearchQuery("")} className="hover:bg-indigo-200 rounded-full p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {selectedKategori !== "all" && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                      🏗️ {kategori.find(k => k.id_kategori === parseInt(selectedKategori))?.nama_kategori}
                      <button onClick={() => setSelectedKategori("all")} className="hover:bg-purple-200 rounded-full p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Alat Grid */}
            {filteredAlat.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                  <Wrench className="w-10 h-10 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">
                    {searchQuery || selectedKategori !== "all" ? "Tidak ada hasil" : "Belum ada alat"}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {searchQuery || selectedKategori !== "all" 
                      ? "Coba ubah filter atau kata kunci pencarian"
                      : "Belum ada alat yang tersedia saat ini"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredAlat.map((item, index) => {
                  const available = item.status === 'tersedia';
                  return (
                    <div
                      key={item.id_alat}
                      className="group relative bg-white border-2 border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 hover:-translate-y-1 animate-fadeInUp"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="absolute top-3 right-3 z-10">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          available 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${available ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                          {available ? 'Tersedia' : 'Dipinjam'}
                        </span>
                      </div>

                      <div className="relative w-full aspect-3/4 bg-linear-to-br from-slate-100 to-slate-200 rounded-xl mb-4 overflow-hidden group-hover:scale-105 transition-transform duration-300">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Wrench className="w-16 h-16 text-slate-300" />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <h3 className="text-base font-bold text-slate-900 line-clamp-2 group-hover:text-indigo-600 transition-colors mb-1">
                            {item.nama_alat}
                          </h3>
                          <p className="text-xs text-slate-500 line-clamp-1">
                            Kondisi: {item.kondisi}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600 font-medium">
                            {item.nama_kategori || "Umum"}
                          </span>
                          <span className={`font-medium ${available ? 'text-emerald-600' : 'text-red-600'}`}>
                            {available ? '✓ Ready' : '✗ Busy'}
                          </span>
                        </div>

                        <button
                          onClick={() => window.location.href = `/peminjam/alat/${item.id_alat}`}
                          className="w-full py-2.5 rounded-xl bg-linear-to-r from-slate-800 to-slate-900 text-white text-sm font-semibold hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl group-hover:scale-105"
                        >
                          Lihat Detail →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}