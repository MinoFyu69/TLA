// src/app/api/auth/refresh/route.js

import { NextResponse } from 'next/server';
import { verifyToken, createToken } from '@/lib/auth.js';

export async function POST(req) {
  try {
    const user = await verifyToken(req);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Token invalid atau expired' },
        { status: 401 }
      );
    }

    // Buat token baru dengan data user yang sama
    const newToken = await createToken({
      id_user: user.id_user,
      username: user.username,
      role: user.role,
      nama: user.nama
    });

    const response = NextResponse.json({
      message: 'Token refreshed',
      token: newToken,
      user: {
        id_user: user.id_user,
        nama: user.nama,
        username: user.username,
        role: user.role
      }
    });

    // Update cookie
    response.cookies.set('token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 hari
    });

    return response;

  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}