import bcrypt from 'bcryptjs';
import { query } from '../../../lib/db';
import { signToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email dan password wajib diisi' });
  }

  const { rows } = await query(
    `SELECT u.id, u.email, u.password_hash, p.nama, p.role
     FROM users u
     JOIN profiles p ON p.id = u.id
     WHERE u.email = $1`,
    [email]
  );
  const user = rows[0];

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Email atau password salah' });
  }

  const token = signToken(user);

  return res.status(200).json({
    token,
    user: { id: user.id, email: user.email, nama: user.nama, role: user.role },
  });
}