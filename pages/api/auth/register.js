import { requireRole } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/supabase';

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

  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nama, role },
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(201).json({
    success: true,
    message: `Pengguna "${nama}" berhasil didaftarkan`,
    userId: data.user.id,
  });
}
