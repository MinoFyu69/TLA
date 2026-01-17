// src/app/api/auth/logout/route.js

import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth.js';

export async function POST(req) {
  try {
    // Verifikasi token untuk keamanan
    const user = await verifyToken(req);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Di sini kamu bisa tambahkan logging aktivitas logout jika perlu
    // await pool.query('INSERT INTO log_aktivitas ...');

    const response = NextResponse.json({
      message: 'Logout berhasil'
    });

    // Hapus cookie token
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0 // Hapus cookie
    });

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}