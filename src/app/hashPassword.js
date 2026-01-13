import bcrypt from 'bcryptjs';

// Tinggal ganti password di sini
const passwords = [
  'mino',
];

console.log('=== Hashed Passwords ===\n');

for (const password of passwords) {
  const hash = bcrypt.hashSync(password, 10);
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}\n`);
}