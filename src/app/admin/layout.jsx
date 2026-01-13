/* eslint-disable react-hooks/set-state-in-effect */
// src/app/admin/layout.jsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopNavigation from '@/components/NavbarAdmin';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      {/* 
        PILIH SALAH SATU NAVIGATION STYLE:
        
        1. Sidebar (Classic) - Uncomment NavigationSidebar
        2. Top Bar (Modern) - Uncomment TopNavigation  ✅ AKTIF
        3. Floating Mid Bar (Unique) - Uncomment FloatingMidBar
      */}
      
      {/* <NavigationSidebar /> */}
      <TopNavigation />
      {/* <FloatingMidBar /> */}

      {/* Main Content */}
      <main className="w-full">
        {/* 
          Padding adjustment based on navigation style:
          - Sidebar: use 'lg:ml-64' class
          - Top Bar: use 'pt-4' class  
          - Floating Mid Bar: no padding needed
        */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}