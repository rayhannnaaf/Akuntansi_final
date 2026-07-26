import bcrypt from 'bcryptjs';
import { requireRole } from '../../../lib/auth';
import { query } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Hanya admin yang bisa daftarkan user baru
  const result = await requireRole(req, res, ['admin']);
  if (!result) return;

  const { email, password, nama, role = 'siswa' } = req.body;

  if (!email || !password || !nama) {
    return res.status(400).json({ error: 'Email, password, dan nama wajib diisi' });
  }

  if (!['admin', 'siswa'].includes(role)) {
    return res.status(400).json({ error: 'Role tidak valid. Gunakan: admin atau siswa' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password minimal 6 karakter' });
  }

  const { rows: existing } = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.length > 0) {
    return res.status(400).json({ error: `Email "${email}" sudah terdaftar` });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    // (dengan nama='Pengguna Baru', role='siswa' sebagai default)
    const { rows } = await query(
      `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id`,
      [email, passwordHash]
    );
    const userId = rows[0].id;


    await query(
      `UPDATE profiles SET nama = $1, role = $2 WHERE id = $3`,
      [nama, role, userId]
    );

    return res.status(201).json({
      success: true,
      message: `Pengguna "${nama}" berhasil didaftarkan`,
      userId,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Gagal mendaftarkan pengguna' });
  }
}