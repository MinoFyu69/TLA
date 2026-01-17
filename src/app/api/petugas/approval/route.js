// src/app/api/petugas/approval/route.js

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
    const { id_peminjaman, status } = body || {};

    // Validate input
    if (!id_peminjaman || !status) {
      return NextResponse.json({
        message: 'id_peminjaman dan status diperlukan'
      }, { status: 400 });
    }

    if (status !== 'disetujui' && status !== 'ditolak') {
      return NextResponse.json({
        message: 'Status harus disetujui atau ditolak'
      }, { status: 400 });
    }

    // Use PostgreSQL function approve_peminjaman
    // Function signature: approve_peminjaman(p_id_peminjaman integer, p_status character varying)
    await pool.query(
      'SELECT approve_peminjaman($1, $2)',
      [id_peminjaman, status]
    );

    return NextResponse.json({
      success: true,
      message: `Peminjaman berhasil ${status}`
    });
  } catch (error) {
    console.error('Approval API Error:', error);
    return NextResponse.json({
      message: 'Error processing approval',
      error: error.message
    }, { status: 500 });
  }
}