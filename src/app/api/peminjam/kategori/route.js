// src/app/api/peminjam/kategori/route.js

import { NextResponse } from 'next/server';
import pool from '@/lib/db.js';
import { verifyToken } from '@/lib/auth.js';

export async function GET(req) {
  try {
    const user = await verifyToken(req);
    if (!user || user.role !== 'peminjam') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const result = await pool.query(`
      SELECT id_kategori, nama_kategori, deskripsi 
      FROM kategori 
      ORDER BY nama_kategori ASC
    `);
    
    return NextResponse.json({ data: result.rows });
  } catch (error) {
    console.error('Get kategori error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}