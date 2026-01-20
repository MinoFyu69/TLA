// src/app/api/admin/users/route.js

import { NextResponse } from 'next/server';
import pool from '@/lib/db.js';
import { verifyToken } from '@/lib/auth.js';
import bcrypt from 'bcryptjs';

// GET - Read all users
export async function GET(req) {
  try {
    const user = await verifyToken(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await pool.query(
      'SELECT id_user, nama, username, role, created_at FROM users ORDER BY id_user DESC'
    );

    return NextResponse.json({ data: result.rows });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST - Create user
export async function POST(req) {
  try {
    const admin = await verifyToken(req);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { nama, username, password, role } = await req.json();

    if (!nama || !username || !password || !role) {
      return NextResponse.json(
        { error: 'Semua field harus diisi' },
        { status: 400 }
      );
    }

    // Check duplicate username
    const existing = await pool.query(
      'SELECT id_user FROM users WHERE username = $1',
      [username]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'Username sudah digunakan' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (nama, username, password, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id_user, nama, username, role`,
      [nama, username, hashedPassword, role]
    );

    const newUser = result.rows[0];

    // Log aktivitas
    await pool.query(
      'INSERT INTO log_aktivitas (id_user, aktivitas) VALUES ($1, $2)',
      [admin.id_user, `Menambahkan user baru: ${newUser.nama} (${newUser.role})`]
    );

    return NextResponse.json({
      message: 'User berhasil ditambahkan',
      data: newUser
    }, { status: 201 });

  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// PUT - Update user
export async function PUT(req) {
  try {
    const admin = await verifyToken(req);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id_user, nama, username, password, role } = await req.json();

    if (!id_user || !nama || !username || !role) {
      return NextResponse.json(
        { error: 'Field id_user, nama, username, dan role harus diisi' },
        { status: 400 }
      );
    }

    // Check duplicate username (exclude current user)
    const existing = await pool.query(
      'SELECT id_user FROM users WHERE username = $1 AND id_user != $2',
      [username, id_user]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'Username sudah digunakan' },
        { status: 400 }
      );
    }

    let query, params;
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      query = `UPDATE users 
               SET nama = $1, username = $2, password = $3, role = $4 
               WHERE id_user = $5 
               RETURNING id_user, nama, username, role`;
      params = [nama, username, hashedPassword, role, id_user];
    } else {
      query = `UPDATE users 
               SET nama = $1, username = $2, role = $3 
               WHERE id_user = $4 
               RETURNING id_user, nama, username, role`;
      params = [nama, username, role, id_user];
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    const updatedUser = result.rows[0];

    // Log aktivitas
    await pool.query(
      'INSERT INTO log_aktivitas (id_user, aktivitas) VALUES ($1, $2)',
      [admin.id_user, `Mengupdate user: ${updatedUser.nama} (${updatedUser.role})`]
    );

    return NextResponse.json({
      message: 'User berhasil diupdate',
      data: updatedUser
    });

  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// DELETE - Delete user
export async function DELETE(req) {
  try {
    const admin = await verifyToken(req);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id_user = searchParams.get('id_user');

    if (!id_user) {
      return NextResponse.json({ error: 'ID user harus diisi' }, { status: 400 });
    }

    // Get user info before delete for logging
    const userInfo = await pool.query(
      'SELECT nama, role FROM users WHERE id_user = $1',
      [id_user]
    );

    if (userInfo.rows.length === 0) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    const deletedUser = userInfo.rows[0];

    // Delete user
    await pool.query('DELETE FROM users WHERE id_user = $1', [id_user]);

    // Log aktivitas
    await pool.query(
      'INSERT INTO log_aktivitas (id_user, aktivitas) VALUES ($1, $2)',
      [admin.id_user, `Menghapus user: ${deletedUser.nama} (${deletedUser.role})`]
    );

    return NextResponse.json({ message: 'User berhasil dihapus' });

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}