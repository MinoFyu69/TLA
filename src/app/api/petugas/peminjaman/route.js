// src/app/api/petugas/peminjaman/route.js

import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(req) {
  try {
    // Verify token & role
    const payload = await verifyToken(req);
    if (!payload || (payload.role !== 'petugas' && payload.role !== 'admin')) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Get filter from query params
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    // Build query
    let query = `
      SELECT 
        p.id_peminjaman,
        p.id_user,
        p.id_alat,
        p.tanggal_pinjam,
        p.tanggal_kembali_rencana,
        p.status,
        a.nama_alat,
        a.kondisi,
        u.nama as nama_user,
        u.username
      FROM peminjaman p
      LEFT JOIN alat a ON p.id_alat = a.id_alat
      LEFT JOIN users u ON p.id_user = u.id_user
    `;

    const params = [];
    
    if (status && status !== 'all') {
      query += ` WHERE p.status = $1`;
      params.push(status);
    }

    query += ` ORDER BY 
      CASE 
        WHEN p.status = 'menunggu' THEN 1
        WHEN p.status = 'disetujui' THEN 2
        WHEN p.status = 'ditolak' THEN 3
        WHEN p.status = 'dikembalikan' THEN 4
      END,
      p.tanggal_pinjam DESC
    `;

    const result = await pool.query(query, params);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Petugas Peminjaman API Error:', error);
    return NextResponse.json({
      message: 'Error fetching peminjaman',
      error: error.message
    }, { status: 500 });
  }
}