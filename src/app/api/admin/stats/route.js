// src/app/api/admin/stats/route.js

import { NextResponse } from 'next/server';
import pool from '@/lib/db.js';
import { verifyToken } from '@/lib/auth.js';

export async function GET(req) {
  try {
    const user = await verifyToken(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get total users
    const usersResult = await pool.query('SELECT COUNT(*) as count FROM users');
    const totalUsers = parseInt(usersResult.rows[0].count);

    // Get total alat
    const alatResult = await pool.query('SELECT COUNT(*) as count FROM alat');
    const totalAlat = parseInt(alatResult.rows[0].count);

    // Get total peminjaman aktif (disetujui)
    const peminjamanResult = await pool.query(
      "SELECT COUNT(*) as count FROM peminjaman WHERE status = 'disetujui'"
    );
    const totalPeminjaman = parseInt(peminjamanResult.rows[0].count);

    // Get total pengembalian
    const pengembalianResult = await pool.query('SELECT COUNT(*) as count FROM pengembalian');
    const totalPengembalian = parseInt(pengembalianResult.rows[0].count);

    return NextResponse.json({
      data: {
        totalUsers,
        totalAlat,
        totalPeminjaman,
        totalPengembalian
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}