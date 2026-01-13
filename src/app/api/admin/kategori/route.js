// D:\Projek Coding\APA\src\app\api\admin\kategori\route.js

import { NextResponse } from 'next/server';
import pool from '@/lib/db.js';
import { verifyToken } from '@/lib/auth.js';

// GET - Read all kategori
export async function GET(req) {
  try {
    const user = await verifyToken(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await pool.query(
      'SELECT * FROM kategori ORDER BY id_kategori DESC'
    );

    return NextResponse.json({ data: result.rows });
  } catch (error) {
    console.error('Get kategori error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST - Create kategori
export async function POST(req) {
  try {
    const user = await verifyToken(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { nama_kategori, deskripsi } = await req.json();

    if (!nama_kategori) {
      return NextResponse.json(
        { error: 'Nama kategori harus diisi' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      'INSERT INTO kategori (nama_kategori, deskripsi) VALUES ($1, $2) RETURNING *',
      [nama_kategori, deskripsi || null]
    );

    return NextResponse.json({
      message: 'Kategori berhasil ditambahkan',
      data: result.rows[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Create kategori error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// PUT - Update kategori
export async function PUT(req) {
  try {
    const user = await verifyToken(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id_kategori, nama_kategori, deskripsi } = await req.json();

    if (!id_kategori || !nama_kategori) {
      return NextResponse.json(
        { error: 'ID kategori dan nama kategori harus diisi' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      'UPDATE kategori SET nama_kategori = $1, deskripsi = $2 WHERE id_kategori = $3 RETURNING *',
      [nama_kategori, deskripsi || null, id_kategori]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Kategori berhasil diupdate',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update kategori error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// DELETE - Delete kategori
export async function DELETE(req) {
  try {
    const user = await verifyToken(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id_kategori = searchParams.get('id_kategori');

    if (!id_kategori) {
      return NextResponse.json({ error: 'ID kategori harus diisi' }, { status: 400 });
    }

    const result = await pool.query(
      'DELETE FROM kategori WHERE id_kategori = $1 RETURNING id_kategori',
      [id_kategori]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Kategori berhasil dihapus' });

  } catch (error) {
    console.error('Delete kategori error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}