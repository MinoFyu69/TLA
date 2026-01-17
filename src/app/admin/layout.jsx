/* eslint-disable react-hooks/set-state-in-effect */
// src/app/admin/layout.jsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

// Import navigation components
// import NavigationSidebar from '@/components/NavigationSidebar';
import TopNavigation from '@/components/NavbarAdmin';
// import FloatingMidBar from '@/components/FloatingMidBar';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  
  // Hook untuk auto-check dan refresh token
  useAuth();

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
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 pt-4">
      
      {/* <NavigationSidebar /> */}
      <TopNavigation />
      {/* <FloatingMidBar /> */}

      {/* Main Content */}
      <main className="w-full pt-4">
        {/* 
          Padding adjustment based on navigation style:
          - Sidebar: use 'lg:ml-64' class
          - Top Bar: use 'pt-4' class  
          - Floating Mid Bar: no padding needed
        */}
        <div className="max-w-7xl mx-auto px-4 py-6 pt-4">
          {children}
        </div>
      </main>
    </div>
  );
}