// D:\Projek Coding\APA\src\app\api\admin\pengembalian\route.js

import { NextResponse } from 'next/server';
import pool from '@/lib/db.js';
import { verifyToken } from '@/lib/auth.js';

// GET - Read all pengembalian
export async function GET(req) {
  try {
    const user = await verifyToken(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT pg.*, p.tanggal_pinjam, p.tanggal_kembali_rencana,
              u.nama as nama_peminjam, a.nama_alat
       FROM pengembalian pg
       JOIN peminjaman p ON pg.id_peminjaman = p.id_peminjaman
       JOIN users u ON p.id_user = u.id_user
       JOIN alat a ON p.id_alat = a.id_alat
       ORDER BY pg.id_pengembalian DESC`
    );

    return NextResponse.json({ data: result.rows });
  } catch (error) {
    console.error('Get pengembalian error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST - Create pengembalian (using stored procedure)
export async function POST(req) {
  try {
    const user = await verifyToken(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id_peminjaman, tanggal_kembali } = await req.json();

    if (!id_peminjaman || !tanggal_kembali) {
      return NextResponse.json(
        { error: 'ID peminjaman dan tanggal kembali harus diisi' },
        { status: 400 }
      );
    }

    // Check if peminjaman exists and is approved
    const peminjamanCheck = await pool.query(
      'SELECT status FROM peminjaman WHERE id_peminjaman = $1',
      [id_peminjaman]
    );

    if (peminjamanCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Peminjaman tidak ditemukan' }, { status: 404 });
    }

    if (peminjamanCheck.rows[0].status !== 'disetujui') {
      return NextResponse.json(
        { error: 'Peminjaman belum disetujui' },
        { status: 400 }
      );
    }

    // Use stored procedure
    await pool.query(
      'SELECT proses_pengembalian($1, $2)',
      [id_peminjaman, tanggal_kembali]
    );

    // Get the created pengembalian
    const result = await pool.query(
      `SELECT pg.*, p.tanggal_pinjam, p.tanggal_kembali_rencana,
              u.nama as nama_peminjam, a.nama_alat
       FROM pengembalian pg
       JOIN peminjaman p ON pg.id_peminjaman = p.id_peminjaman
       JOIN users u ON p.id_user = u.id_user
       JOIN alat a ON p.id_alat = a.id_alat
       WHERE pg.id_peminjaman = $1`,
      [id_peminjaman]
    );

    return NextResponse.json({
      message: 'Pengembalian berhasil diproses',
      data: result.rows[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Create pengembalian error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// PUT - Update pengembalian
export async function PUT(req) {
  try {
    const user = await verifyToken(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id_pengembalian, tanggal_kembali, denda } = await req.json();

    if (!id_pengembalian || !tanggal_kembali) {
      return NextResponse.json(
        { error: 'ID pengembalian dan tanggal kembali harus diisi' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE pengembalian 
       SET tanggal_kembali = $1, denda = $2
       WHERE id_pengembalian = $3 
       RETURNING *`,
      [tanggal_kembali, denda || 0, id_pengembalian]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Pengembalian tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Pengembalian berhasil diupdate',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update pengembalian error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// DELETE - Delete pengembalian
export async function DELETE(req) {
  try {
    const user = await verifyToken(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id_pengembalian = searchParams.get('id_pengembalian');

    if (!id_pengembalian) {
      return NextResponse.json({ error: 'ID pengembalian harus diisi' }, { status: 400 });
    }

    // Get id_peminjaman before deleting
    const pengembalianData = await pool.query(
      'SELECT id_peminjaman FROM pengembalian WHERE id_pengembalian = $1',
      [id_pengembalian]
    );

    if (pengembalianData.rows.length === 0) {
      return NextResponse.json({ error: 'Pengembalian tidak ditemukan' }, { status: 404 });
    }

    const id_peminjaman = pengembalianData.rows[0].id_peminjaman;

    // Delete pengembalian
    await pool.query(
      'DELETE FROM pengembalian WHERE id_pengembalian = $1',
      [id_pengembalian]
    );

    // Revert peminjaman status
    await pool.query(
      'UPDATE peminjaman SET status = $1 WHERE id_peminjaman = $2',
      ['disetujui', id_peminjaman]
    );

    // Revert alat status
    await pool.query(
      `UPDATE alat SET status = 'dipinjam' 
       WHERE id_alat = (SELECT id_alat FROM peminjaman WHERE id_peminjaman = $1)`,
      [id_peminjaman]
    );

    return NextResponse.json({ message: 'Pengembalian berhasil dihapus' });

  } catch (error) {
    console.error('Delete pengembalian error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}