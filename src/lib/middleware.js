// src/middleware.js

import { NextResponse } from 'next/server';
import * as jose from 'jose';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Cek apakah route memerlukan autentikasi
  const isAdminRoute = pathname.startsWith('/admin');
  const isPetugasRoute = pathname.startsWith('/petugas');
  const isPeminjamRoute = pathname.startsWith('/peminjam');
  const isAuthRoute = pathname.startsWith('/login');

  const isProtectedRoute = isAdminRoute || isPetugasRoute || isPeminjamRoute;

  if (isProtectedRoute) {
    // Cek token dari cookie atau header
    const token = request.cookies.get('token')?.value || 
                  request.headers.get('authorization')?.split(' ')[1];

    if (!token) {
      console.log('No token found, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jose.jwtVerify(token, secret);
      
      console.log('Token valid for user:', payload.username, 'Role:', payload.role);
      
      // Check role-based access
      if (isAdminRoute && payload.role !== 'admin') {
        console.log('Non-admin trying to access admin route');
        return NextResponse.redirect(new URL(`/${payload.role}/dashboard`, request.url));
      }
      
      if (isPetugasRoute && payload.role !== 'petugas') {
        console.log('Non-petugas trying to access petugas route');
        return NextResponse.redirect(new URL(`/${payload.role}/dashboard`, request.url));
      }
      
      if (isPeminjamRoute && payload.role !== 'peminjam') {
        console.log('Non-peminjam trying to access peminjam route');
        return NextResponse.redirect(new URL(`/${payload.role}/dashboard`, request.url));
      }
      
      // Token valid dan role sesuai, lanjutkan
      return NextResponse.next();
    } catch (error) {
      console.error('Token invalid:', error.message);
      
      // Hapus cookie yang invalid
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.set('token', '', { maxAge: 0 });
      
      return response;
    }
  }

  // Redirect ke dashboard sesuai role jika sudah login dan akses /login
  if (isAuthRoute) {
    const token = request.cookies.get('token')?.value;
    if (token) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jose.jwtVerify(token, secret);
        
        // Redirect ke dashboard sesuai role
        const dashboardRoute = `/${payload.role}/dashboard`;
        return NextResponse.redirect(new URL(dashboardRoute, request.url));
      } catch (error) {
        console.log('Token invalid on login page, clearing cookie');
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/petugas/:path*',
    '/peminjam/:path*',
    '/login'
  ],
};