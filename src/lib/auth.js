// src/lib/auth.js

import * as jose from 'jose';

export async function verifyToken(req) {
  try {
    // Cek dari header Authorization dulu
    let token = req.headers.get('authorization')?.split(' ')[1];
    
    // Kalau tidak ada, cek dari cookies
    if (!token) {
      token = req.cookies.get('token')?.value;
    }
    
    if (!token) {
      return null;
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    
    return payload;
  } catch (error) {
    console.error('Token verification error:', error.message);
    return null;
  }
}

export async function createToken(payload) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  
  // Token berlaku 7 hari (lebih lama)
  const token = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // 7 hari
    .sign(secret);
  
  return token;
}

// Helper untuk decode token tanpa verify (untuk debugging)
export async function decodeToken(token) {
  try {
    const decoded = jose.decodeJwt(token);
    return decoded;
  } catch (error) {
    console.error('Token decode error:', error);
    return null;
  }
}