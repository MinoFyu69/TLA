// src/app/api/peminjam/peminjaman/route.js

import { NextResponse } from 'next/server';
import pool from '@/lib/db.js';
import { verifyToken } from '@/lib/auth.js';

// GET - Read peminjaman history untuk peminjam
export async function GET(req) {
  try {
    const user = await verifyToken(req);
    if (!user || user.role !== 'peminjam') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id_user') || user.id_user;

    // Peminjam hanya bisa lihat peminjaman mereka sendiri
    if (user.role === 'peminjam' && parseInt(userId) !== user.id_user) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await pool.query(`
      SELECT 
        p.*,
        a.nama_alat,
        a.kondisi,
        a.harga_sewa,
        k.nama_kategori,
        u.nama as nama_peminjam,
        pen.tanggal_kembali as tanggal_kembali_aktual,
        pen.denda,
        CASE 
          WHEN p.status = 'disetujui' AND pen.tanggal_kembali IS NULL THEN 
            GREATEST(0, CURRENT_DATE - p.tanggal_kembali_rencana)
          ELSE 0 
        END as hari_terlambat,
        CASE 
          WHEN p.status = 'disetujui' AND pen.tanggal_kembali IS NULL THEN 
            GREATEST(0, (CURRENT_DATE - p.tanggal_kembali_rencana) * 5000)
          ELSE COALESCE(pen.denda, 0)
        END as total_denda,
        CASE
          WHEN p.status = 'disetujui' AND pen.tanggal_kembali IS NULL THEN
            (p.tanggal_kembali_rencana - p.tanggal_pinjam) * COALESCE(a.harga_sewa, 0) * COALESCE(p.jumlah, 1)
          WHEN pen.tanggal_kembali IS NOT NULL THEN
            (pen.tanggal_kembali - p.tanggal_pinjam) * COALESCE(a.harga_sewa, 0) * COALESCE(p.jumlah, 1)
          ELSE
            (p.tanggal_kembali_rencana - p.tanggal_pinjam) * COALESCE(a.harga_sewa, 0) * COALESCE(p.jumlah, 1)
        END as biaya_sewa
      FROM peminjaman p
      LEFT JOIN alat a ON p.id_alat = a.id_alat
      LEFT JOIN kategori k ON a.id_kategori = k.id_kategori
      LEFT JOIN users u ON p.id_user = u.id_user
      LEFT JOIN pengembalian pen ON p.id_peminjaman = pen.id_peminjaman
      WHERE p.id_user = $1
      ORDER BY p.id_peminjaman DESC
    `, [userId]);

    return NextResponse.json({ data: result.rows });
  } catch (error) {
    console.error('Get peminjaman error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST - Create peminjaman (ajukan peminjaman)
export async function POST(req) {
  try {
    const user = await verifyToken(req);
    if (!user || user.role !== 'peminjam') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id_alat, tanggal_pinjam, tanggal_kembali_rencana, jumlah } = await req.json();

    if (!id_alat || !tanggal_pinjam || !tanggal_kembali_rencana || !jumlah) {
      return NextResponse.json({
        error: 'Semua field harus diisi'
      }, { status: 400 });
    }

    // Validasi jumlah
    if (jumlah <= 0) {
      return NextResponse.json({
        error: 'Jumlah harus lebih dari 0'
      }, { status: 400 });
    }

    // Cek apakah alat tersedia dan stok cukup
    const alatCheck = await pool.query(
      'SELECT nama_alat, stok FROM alat WHERE id_alat = $1 AND kondisi = $2',
      [id_alat, 'baik']
    );

    if (alatCheck.rows.length === 0) {
      return NextResponse.json({
        error: 'Alat tidak ditemukan'
      }, { status: 400 });
    }

    const { nama_alat, stok } = alatCheck.rows[0];

    if (stok < jumlah) {
      return NextResponse.json({
        error: `Stok tidak mencukupi. Stok tersedia: ${stok}`
      }, { status: 400 });
    }

    // Cek apakah user sudah meminjam alat yang sama dan belum dikembalikan
    const existingBorrow = await pool.query(`
      SELECT * FROM peminjaman 
      WHERE id_user = $1 
      AND id_alat = $2 
      AND status IN ('menunggu', 'disetujui')
    `, [user.id_user, id_alat]);

    if (existingBorrow.rows.length > 0) {
      return NextResponse.json({
        error: 'Anda sudah mengajukan peminjaman alat ini atau sedang meminjamnya'
      }, { status: 400 });
    }

    // Insert peminjaman baru dengan jumlah
    const result = await pool.query(`
      INSERT INTO peminjaman (id_user, id_alat, tanggal_pinjam, tanggal_kembali_rencana, jumlah, status) 
      VALUES ($1, $2, $3, $4, $5, 'menunggu') 
      RETURNING *
    `, [user.id_user, id_alat, tanggal_pinjam, tanggal_kembali_rencana, jumlah]);

    // Log aktivitas pengajuan peminjaman
    await pool.query(
      'INSERT INTO log_aktivitas (id_user, aktivitas) VALUES ($1, $2)',
      [user.id_user, `Mengajukan peminjaman ${jumlah}x ${nama_alat} (Status: Menunggu Persetujuan)`]
    );

    return NextResponse.json({
      message: 'Peminjaman berhasil diajukan, menunggu persetujuan',
      data: result.rows[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Create peminjaman error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}