// pages/api/users.js
import { query } from '../../lib/db';
import { requireRole } from '../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Hanya admin yang boleh lihat daftar user
  const result = await requireRole(req, res, ['admin']);
  if (!result) return;

  try {
    const { rows } = await query(
      `SELECT id, nama, email, role, created_at
       FROM profiles
       ORDER BY created_at ASC`
    );
    return res.status(200).json({ data: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Gagal memuat daftar pengguna' });
  }
}
