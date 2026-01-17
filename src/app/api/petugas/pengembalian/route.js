// src/app/api/petugas/pengembalian/route.js

import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(req) {
  try {
    // Verify token & role
    const payload = await verifyToken(req);
    if (!payload || (payload.role !== 'petugas' && payload.role !== 'admin')) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { id_peminjaman, tanggal_kembali } = body || {};

    // Validate input
    if (!id_peminjaman || !tanggal_kembali) {
      return NextResponse.json({
        message: 'id_peminjaman dan tanggal_kembali diperlukan'
      }, { status: 400 });
    }

    // Validate date format
    const kembaliDate = new Date(tanggal_kembali);
    if (isNaN(kembaliDate.getTime())) {
      return NextResponse.json({
        message: 'Format tanggal tidak valid'
      }, { status: 400 });
    }

    // Use PostgreSQL function proses_pengembalian
    // Function signature: proses_pengembalian(p_id_peminjaman integer, p_tanggal_kembali date)
    await pool.query(
      'SELECT proses_pengembalian($1, $2)',
      [id_peminjaman, tanggal_kembali]
    );

    return NextResponse.json({
      success: true,
      message: 'Pengembalian berhasil diproses'
    });
  } catch (error) {
    console.error('Pengembalian API Error:', error);
    return NextResponse.json({
      message: 'Error processing pengembalian',
      error: error.message
    }, { status: 500 });
  }
}