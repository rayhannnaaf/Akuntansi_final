// pages/api/users/[id].js
import bcrypt from 'bcryptjs';
import { query } from '../../../lib/db';
import { requireRole } from '../../../lib/auth';

function generateSiswaPassword(nama) {
  const base = (nama || 'siswa')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // buang aksen
    .replace(/[^a-z]/g, '')
    .slice(0, 6) || 'siswa';
  const digits = Math.floor(1000 + Math.random() * 9000); // 4 digit acak
  return `${base}${digits}`;
}

export default async function handler(req, res) {
  const result = await requireRole(req, res, ['admin']);
  if (!result) return;
  const { user: currentUser } = result;

  const { id } = req.query;

  if (req.method === 'PATCH') {
    const { nama, role } = req.body;

    if (!nama || !nama.trim()) {
      return res.status(400).json({ error: 'Nama wajib diisi' });
    }
    if (!['admin', 'siswa'].includes(role)) {
      return res.status(400).json({ error: 'Role tidak valid' });
    }

    // Cegah admin menurunkan role dirinya sendiri (supaya tidak terkunci dari sistem)
    if (id === currentUser.id && role !== 'admin') {
      return res.status(400).json({ error: 'Tidak bisa mengubah role akun sendiri menjadi bukan admin' });
    }

    try {
      const { rows } = await query(
        `UPDATE profiles SET nama = $1, role = $2 WHERE id = $3 RETURNING id, nama, email, role`,
        [nama.trim(), role, id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
      }
      return res.status(200).json({ success: true, data: rows[0] });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Gagal memperbarui pengguna' });
    }
  }

  if (req.method === 'POST') {
    const { action } = req.body;

    if (action !== 'generate-password') {
      return res.status(400).json({ error: 'Aksi tidak dikenal' });
    }

    try {
      const { rows: profileRows } = await query(
        `SELECT id, nama, role FROM profiles WHERE id = $1`,
        [id]
      );
      const target = profileRows[0];
      if (!target) {
        return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
      }
      if (target.role !== 'siswa') {
        return res.status(400).json({ error: 'Generate password hanya berlaku untuk akun siswa' });
      }

      const newPassword = generateSiswaPassword(target.nama);
      const password_hash = await bcrypt.hash(newPassword, 10);

      const { rowCount } = await query(
        `UPDATE users SET password_hash = $1 WHERE id = $2`,
        [password_hash, id]
      );
      if (rowCount === 0) {
        return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
      }

      return res.status(200).json({ success: true, password: newPassword });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Gagal generate password' });
    }
  }

  if (req.method === 'DELETE') {
    if (id === currentUser.id) {
      return res.status(400).json({ error: 'Tidak bisa menghapus akun sendiri' });
    }

    try {
      const { rows } = await query(
        `DELETE FROM users WHERE id = $1 RETURNING id`,
        [id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
      }
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Gagal menghapus pengguna' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}