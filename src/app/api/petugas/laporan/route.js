// src/app/api/petugas/laporan/route.js

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
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const status = searchParams.get('status');

    // Validate required params
    if (!dateFrom || !dateTo) {
      return NextResponse.json({
        message: 'date_from dan date_to diperlukan'
      }, { status: 400 });
    }

    // Build query for peminjaman data
    let query = `
      SELECT 
        p.id_peminjaman,
        p.id_user,
        p.id_alat,
        p.tanggal_pinjam,
        p.tanggal_kembali_rencana,
        p.status,
        a.nama_alat,
        u.nama as nama_user,
        u.username,
        pen.denda,
        pen.tanggal_kembali as tanggal_kembali_aktual
      FROM peminjaman p
      LEFT JOIN alat a ON p.id_alat = a.id_alat
      LEFT JOIN users u ON p.id_user = u.id_user
      LEFT JOIN pengembalian pen ON p.id_peminjaman = pen.id_peminjaman
      WHERE p.tanggal_pinjam BETWEEN $1 AND $2
    `;

    const params = [dateFrom, dateTo];

    if (status && status !== 'all') {
      query += ` AND p.status = $3`;
      params.push(status);
    }

    query += ` ORDER BY p.tanggal_pinjam DESC`;

    const result = await pool.query(query, params);
    const peminjaman = result.rows;

    // Calculate summary statistics
    const summary = {
      total_peminjaman: peminjaman.length,
      menunggu: peminjaman.filter(p => p.status === 'menunggu').length,
      disetujui: peminjaman.filter(p => p.status === 'disetujui').length,
      ditolak: peminjaman.filter(p => p.status === 'ditolak').length,
      dikembalikan: peminjaman.filter(p => p.status === 'dikembalikan').length,
      total_denda: peminjaman.reduce((sum, p) => sum + (p.denda || 0), 0),
    };

    // Get top 5 most borrowed tools
    const topAlatQuery = `
      SELECT 
        a.id_alat,
        a.nama_alat,
        COUNT(p.id_peminjaman) as jumlah_peminjaman
      FROM peminjaman p
      JOIN alat a ON p.id_alat = a.id_alat
      WHERE p.tanggal_pinjam BETWEEN $1 AND $2
      GROUP BY a.id_alat, a.nama_alat
      ORDER BY jumlah_peminjaman DESC
      LIMIT 5
    `;
    
    const topAlatResult = await pool.query(topAlatQuery, [dateFrom, dateTo]);

    return NextResponse.json({
      summary,
      peminjaman,
      top_alat: topAlatResult.rows,
      periode: {
        from: dateFrom,
        to: dateTo
      }
    });
  } catch (error) {
    console.error('Laporan API Error:', error);
    return NextResponse.json({
      message: 'Error fetching laporan',
      error: error.message
    }, { status: 500 });
  }
}