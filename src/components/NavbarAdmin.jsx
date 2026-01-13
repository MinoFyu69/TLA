// src/components/FloatingMidBar.jsx

'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';

export default function FloatingMidBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const getUserData = () => {
    if (typeof window === 'undefined') return null;
    const userData = localStorage.getItem('user');
    if (!userData) return null;
    return JSON.parse(userData);
  };

  const user = getUserData();

  const handleLogout = async () => {
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
      router.push('/login');
    }
  };

  const menus = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: '🏠', color: 'from-blue-500 to-blue-600' },
    { name: 'Users', path: '/admin/users', icon: '👥', color: 'from-purple-500 to-purple-600' },
    { name: 'Kategori', path: '/admin/kategori', icon: '📁', color: 'from-pink-500 to-pink-600' },
    { name: 'Alat', path: '/admin/alat', icon: '🔧', color: 'from-orange-500 to-orange-600' },
    { name: 'Peminjaman', path: '/admin/peminjaman', icon: '📋', color: 'from-green-500 to-green-600' },
    { name: 'Pengembalian', path: '/admin/pengembalian', icon: '✅', color: 'from-teal-500 to-teal-600' },
    { name: 'Log', path: '/admin/log', icon: '📊', color: 'from-indigo-500 to-indigo-600' },
  ];

  return (
    <>
      {/* Floating Mid Bar */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
        <div 
          className={`pointer-events-auto bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 transition-all duration-500 ease-out ${
            isExpanded 
              ? 'w-[90vw] max-w-4xl h-[80vh] max-h-150' 
              : 'w-16 h-16'
          }`}
        >
          {/* Toggle Button */}
          <button
            onClick={() => {
              setIsExpanded(!isExpanded);
              setShowLogoutConfirm(false);
            }}
            className={`absolute transition-all duration-300 ${
              isExpanded 
                ? 'top-4 right-4' 
                : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
            }`}
          >
            <div className={`bg-linear-to-br from-blue-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 ${
              isExpanded ? 'w-10 h-10' : 'w-16 h-16'
            } flex items-center justify-center`}>
              <span className="text-2xl text-white">
                {isExpanded ? '✕' : '☰'}
              </span>
            </div>
          </button>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="h-full p-8 flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-linear-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-xl">
                  {user?.nama?.charAt(0) || 'A'}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Halo, {user?.nama}! 👋</h2>
                  <p className="text-gray-500">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      {user?.role} • {user?.username}
                    </span>
                  </p>
                </div>
              </div>

              {/* Menu Grid */}
              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {menus.map((menu) => {
                    const isActive = pathname === menu.path;
                    return (
                      <Link
                        key={menu.path}
                        href={menu.path}
                        onClick={() => setIsExpanded(false)}
                        className={`group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                          isActive 
                            ? 'ring-4 ring-blue-500 shadow-xl' 
                            : 'hover:ring-2 hover:ring-gray-300'
                        }`}
                      >
                        <div className={`bg-linear-to-br ${menu.color} p-6 h-32 flex flex-col items-center justify-center text-white relative`}>
                          {/* Background Pattern */}
                          <div className="absolute inset-0 opacity-10">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.5),transparent_50%)]" />
                          </div>
                          
                          <span className="text-4xl mb-2 relative z-10 group-hover:scale-110 transition-transform">
                            {menu.icon}
                          </span>
                          <span className="text-sm font-semibold relative z-10 text-center">
                            {menu.name}
                          </span>
                          
                          {isActive && (
                            <div className="absolute top-2 right-2 w-3 h-3 bg-white rounded-full animate-pulse" />
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Footer with Logout */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                {!showLogoutConfirm ? (
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="w-full bg-linear-to-r from-red-500 to-pink-500 text-white px-6 py-4 rounded-2xl font-semibold hover:from-red-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-3"
                  >
                    <span className="text-2xl">🚪</span>
                    <span>Logout</span>
                  </button>
                ) : (
                  <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 space-y-3">
                    <p className="text-center text-gray-800 font-semibold">
                      Yakin ingin logout?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleLogout}
                        className="flex-1 bg-red-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-red-600 transition-colors"
                      >
                        Ya, Logout
                      </button>
                      <button
                        onClick={() => setShowLogoutConfirm(false)}
                        className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overlay when expanded */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => {
            setIsExpanded(false);
            setShowLogoutConfirm(false);
          }}
        />
      )}

      {/* Quick Access Hint (when collapsed) */}
      {!isExpanded && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
          <div className="bg-white/90 backdrop-blur px-6 py-3 rounded-full shadow-lg border border-gray-200/50 animate-bounce">
            <p className="text-sm text-gray-600 font-medium">
              Klik untuk membuka menu ☰
            </p>
          </div>
        </div>
      )}
    </>
  );
}