// src/app/api/admin/alat/route.js

import { NextResponse } from 'next/server';
import pool from '@/lib/db.js';
import { verifyToken } from '@/lib/auth.js';

// GET - Read all alat
export async function GET(req) {
  try {
    const user = await verifyToken(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT a.*, k.nama_kategori 
       FROM alat a
       LEFT JOIN kategori k ON a.id_kategori = k.id_kategori
       ORDER BY a.id_alat DESC`
    );

    return NextResponse.json({ data: result.rows });
  } catch (error) {
    console.error('Get alat error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST - Create alat
export async function POST(req) {
  try {
    const user = await verifyToken(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { nama_alat, id_kategori, kondisi, status, gambar, stok, harga_sewa, deskripsi } = await req.json();

    if (!nama_alat) {
      return NextResponse.json(
        { error: 'Nama alat harus diisi' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO alat (nama_alat, id_kategori, kondisi, status, gambar, stok, harga_sewa, deskripsi) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [
        nama_alat,
        id_kategori || null,
        kondisi || 'baik',
        status || 'tersedia',
        gambar || null,
        stok || 1,
        harga_sewa || 0,
        deskripsi || null
      ]
    );

    // Log aktivitas
    await pool.query(
      'INSERT INTO log_aktivitas (id_user, aktivitas) VALUES ($1, $2)',
      [user.id_user, `Menambahkan alat baru: ${nama_alat}`]
    );

    return NextResponse.json({
      message: 'Alat berhasil ditambahkan',
      data: result.rows[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Create alat error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// PUT - Update alat
export async function PUT(req) {
  try {
    const user = await verifyToken(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id_alat, nama_alat, id_kategori, kondisi, status, gambar, stok, harga_sewa, deskripsi } = await req.json();

    if (!id_alat || !nama_alat) {
      return NextResponse.json(
        { error: 'ID alat dan nama alat harus diisi' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE alat 
       SET nama_alat = $1, id_kategori = $2, kondisi = $3, status = $4, gambar = $5, stok = $6, harga_sewa = $7, deskripsi = $8
       WHERE id_alat = $9 
       RETURNING *`,
      [
        nama_alat,
        id_kategori || null,
        kondisi || 'baik',
        status || 'tersedia',
        gambar || null,
        stok || 1,
        harga_sewa || 0,
        deskripsi || null,
        id_alat
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Alat tidak ditemukan' }, { status: 404 });
    }

    // Log aktivitas
    await pool.query(
      'INSERT INTO log_aktivitas (id_user, aktivitas) VALUES ($1, $2)',
      [user.id_user, `Mengupdate alat: ${nama_alat}`]
    );

    return NextResponse.json({
      message: 'Alat berhasil diupdate',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update alat error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// DELETE - Delete alat
export async function DELETE(req) {
  try {
    const user = await verifyToken(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id_alat = searchParams.get('id_alat');

    if (!id_alat) {
      return NextResponse.json({ error: 'ID alat harus diisi' }, { status: 400 });
    }

    // Get alat name before delete
    const alatInfo = await pool.query(
      'SELECT nama_alat FROM alat WHERE id_alat = $1',
      [id_alat]
    );

    if (alatInfo.rows.length === 0) {
      return NextResponse.json({ error: 'Alat tidak ditemukan' }, { status: 404 });
    }

    const namaAlat = alatInfo.rows[0].nama_alat;

    // Delete alat
    await pool.query('DELETE FROM alat WHERE id_alat = $1', [id_alat]);

    // Log aktivitas
    await pool.query(
      'INSERT INTO log_aktivitas (id_user, aktivitas) VALUES ($1, $2)',
      [user.id_user, `Menghapus alat: ${namaAlat}`]
    );

    return NextResponse.json({ message: 'Alat berhasil dihapus' });

  } catch (error) {
    console.error('Delete alat error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}