// D:\Projek Coding\APA\src\app\api\admin\log-aktivitas\route.js

import { NextResponse } from 'next/server';
import pool from '@/lib/db.js';
import { verifyToken } from '@/lib/auth.js';

// GET - Read all log aktivitas
export async function GET(req) {
  try {
    const user = await verifyToken(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit') || '100';

    const result = await pool.query(
      `SELECT la.*, u.nama as nama_user, u.username
       FROM log_aktivitas la
       LEFT JOIN users u ON la.id_user = u.id_user
       ORDER BY la.waktu DESC
       LIMIT $1`,
      [limit]
    );

    return NextResponse.json({ data: result.rows });
  } catch (error) {
    console.error('Get log aktivitas error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
