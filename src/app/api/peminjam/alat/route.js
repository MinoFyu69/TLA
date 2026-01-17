// src/app/api/peminjam/alat/route.js

import { NextResponse } from 'next/server';
import pool from '@/lib/db.js';
import { verifyToken } from '@/lib/auth.js';

// GET - Read all alat yang tersedia untuk peminjam
export async function GET(req) {
  try {
    const user = await verifyToken(req);
    if (!user || user.role !== 'peminjam') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT a.*, k.nama_kategori 
       FROM alat a 
       LEFT JOIN kategori k ON a.id_kategori = k.id_kategori 
       WHERE a.kondisi = 'baik'
       ORDER BY a.nama_alat ASC`
    );

    return NextResponse.json({ data: result.rows });
  } catch (error) {
    console.error('Get alat error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}