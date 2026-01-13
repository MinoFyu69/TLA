// D:\Projek Coding\APA\src\app\api\admin\peminjaman\route.js

import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET - Read all peminjaman
export async function GET(req) {
  try {
    const user = await verifyToken(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT p.*, u.nama as nama_peminjam, u.username, a.nama_alat, k.nama_kategori
       FROM peminjaman p
       JOIN users u ON p.id_user = u.id_user
       JOIN alat a ON p.id_alat = a.id_alat
       LEFT JOIN kategori k ON a.id_kategori = k.id_kategori
       ORDER BY p.id_peminjaman DESC`
    );

    return NextResponse.json({ data: result.rows });
  } catch (error) {
    console.error('Get peminjaman error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST - Create peminjaman
export async function POST(req) {
  try {
    const user = await verifyToken(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id_user, id_alat, tanggal_pinjam, tanggal_kembali_rencana } = await req.json();

    if (!id_user || !id_alat || !tanggal_pinjam || !tanggal_kembali_rencana) {
      return NextResponse.json(
        { error: 'Semua field harus diisi' },
        { status: 400 }
      );
    }

    // Check if alat is available
    const alatCheck = await pool.query(
      'SELECT status FROM alat WHERE id_alat = $1',
      [id_alat]
    );

    if (alatCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Alat tidak ditemukan' }, { status: 404 });
    }

    if (alatCheck.rows[0].status !== 'tersedia') {
      return NextResponse.json(
        { error: 'Alat sedang tidak tersedia' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO peminjaman (id_user, id_alat, tanggal_pinjam, tanggal_kembali_rencana, status) 
       VALUES ($1, $2, $3, $4, 'menunggu') 
       RETURNING *`,
      [id_user, id_alat, tanggal_pinjam, tanggal_kembali_rencana]
    );

    return NextResponse.json({
      message: 'Peminjaman berhasil ditambahkan',
      data: result.rows[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Create peminjaman error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// PUT - Update peminjaman
export async function PUT(req) {
  try {
    const user = await verifyToken(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id_peminjaman, id_user, id_alat, tanggal_pinjam, tanggal_kembali_rencana, status } = await req.json();

    if (!id_peminjaman || !id_user || !id_alat || !tanggal_pinjam || !tanggal_kembali_rencana) {
      return NextResponse.json(
        { error: 'Semua field harus diisi' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE peminjaman 
       SET id_user = $1, id_alat = $2, tanggal_pinjam = $3, tanggal_kembali_rencana = $4, status = $5
       WHERE id_peminjaman = $6 
       RETURNING *`,
      [id_user, id_alat, tanggal_pinjam, tanggal_kembali_rencana, status || 'menunggu', id_peminjaman]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Peminjaman tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Peminjaman berhasil diupdate',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update peminjaman error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// DELETE - Delete peminjaman
export async function DELETE(req) {
  try {
    const user = await verifyToken(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id_peminjaman = searchParams.get('id_peminjaman');

    if (!id_peminjaman) {
      return NextResponse.json({ error: 'ID peminjaman harus diisi' }, { status: 400 });
    }

    const result = await pool.query(
      'DELETE FROM peminjaman WHERE id_peminjaman = $1 RETURNING id_peminjaman',
      [id_peminjaman]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Peminjaman tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Peminjaman berhasil dihapus' });

  } catch (error) {
    console.error('Delete peminjaman error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
