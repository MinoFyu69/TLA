// src/middleware.js

import { NextResponse } from 'next/server';
import * as jose from 'jose';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Cek apakah route memerlukan autentikasi
  const isProtectedRoute = pathname.startsWith('/admin');
  const isAuthRoute = pathname.startsWith('/login');

  if (isProtectedRoute) {
    const token = request.cookies.get('token')?.value || 
                  request.headers.get('authorization')?.split(' ')[1];

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      await jose.jwtVerify(token, secret);
      return NextResponse.next();
    } catch (error) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect ke dashboard jika sudah login dan akses /login
  if (isAuthRoute) {
    const token = request.cookies.get('token')?.value;
    if (token) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        await jose.jwtVerify(token, secret);
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      } catch (error) {
        // Token invalid, lanjut ke login
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/login'
  ],
};