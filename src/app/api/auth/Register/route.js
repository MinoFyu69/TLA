// src/app/api/auth/register/route.js

import { NextResponse } from 'next/server';
import pool from '@/lib/db.js';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const { nama, username, password, role } = await req.json();

    if (!nama || !username || !password) {
      return NextResponse.json(
        { error: 'Semua field harus diisi' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUser = await pool.query(
      'SELECT id_user FROM users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'Username sudah digunakan' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const result = await pool.query(
      `INSERT INTO users (nama, username, password, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id_user, nama, username, role`,
      [nama, username, hashedPassword, role || 'peminjam']
    );

    const newUser = result.rows[0];

    // Log aktivitas registrasi
    await pool.query(
      'INSERT INTO log_aktivitas (id_user, aktivitas) VALUES ($1, $2)',
      [newUser.id_user, `Registrasi akun baru sebagai ${newUser.role}`]
    );

    return NextResponse.json({
      message: 'Registrasi berhasil',
      user: {
        id_user: newUser.id_user,
        nama: newUser.nama,
        username: newUser.username,
        role: newUser.role
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}