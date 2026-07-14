import { requireAuth } from '../../../lib/auth';
import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  const { tipe, aktif = 'true' } = req.query;

  let query = supabase.from('akun').select('*').order('kode');

  if (tipe) query = query.eq('tipe', tipe);
  if (aktif !== 'all') query = query.eq('aktif', aktif === 'true');

  const { data, error } = await query;

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ data });
}
