// src/components/RoleProtection.jsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, LogIn } from 'lucide-react';

export default function RoleProtection({ children, allowedRoles = [] }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roleError, setRoleError] = useState(false);

  useEffect(() => {
    // Function untuk check auth
    const checkAuth = () => {
      try {
        const userData = localStorage.getItem('user');
        
        if (!userData) {
          // Tidak ada user, redirect ke login
          router.push('/login');
          return;
        }

        const currentUser = JSON.parse(userData);
        
        // Cek apakah role user diizinkan
        if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
          setRoleError(true);
          setLoading(false);
          return;
        }

        setUser(currentUser);
        setLoading(false);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/login');
      }
    };

    // Panggil checkAuth sekali saja
    checkAuth();
  }, [router, allowedRoles]); // Dependency array yang benar

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memverifikasi akses...</p>
        </div>
      </div>
    );
  }

  if (roleError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-red-50 to-orange-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert className="w-10 h-10 text-red-600" />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Akses Ditolak
              </h1>
              <p className="text-gray-600">
                Role Anda tidak sesuai untuk mengakses halaman ini.
              </p>
            </div>

            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-700">
                <span className="font-semibold">Role yang diizinkan:</span>{' '}
                {allowedRoles.map(role => role.charAt(0).toUpperCase() + role.slice(1)).join(', ')}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  // Redirect berdasarkan role user
                  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                  if (currentUser.role === 'admin') {
                    router.push('/admin/dashboard');
                  } else if (currentUser.role === 'petugas') {
                    router.push('/petugas/dashboard');
                  } else if (currentUser.role === 'peminjam') {
                    router.push('/peminjam');
                  } else {
                    router.push('/login');
                  }
                }}
                className="w-full py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
              >
                Kembali ke Dashboard
              </button>
              
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  router.push('/login');
                }}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
              >
                <LogIn size={18} />
                Login dengan Akun Lain
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}