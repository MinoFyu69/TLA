// src/app/api/auth/login/route.js

import { NextResponse } from 'next/server';
import pool from '@/lib/db.js';
import { createToken } from '@/lib/auth.js';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username dan password harus diisi' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Username atau password salah' },
        { status: 401 }
      );
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Username atau password salah' },
        { status: 401 }
      );
    }

    // Log aktivitas login
    await pool.query(
      'INSERT INTO log_aktivitas (id_user, aktivitas) VALUES ($1, $2)',
      [user.id_user, `Login ke sistem sebagai ${user.role}`]
    );

    const token = await createToken({
      id_user: user.id_user,
      username: user.username,
      role: user.role,
      nama: user.nama
    });

    return NextResponse.json({
      message: 'Login berhasil',
      token,
      user: {
        id_user: user.id_user,
        nama: user.nama,
        username: user.username,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}