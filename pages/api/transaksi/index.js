import { requireAuth } from '../../../lib/auth';
import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  const { dari, sampai, limit = 50, offset = 0 } = req.query;

  let query = supabase
    .from('transaksi')
    .select('*, profiles(nama), jurnal_entri(*, akun(kode, nama, tipe))', { count: 'exact' })
    .order('tanggal', { ascending: false })
    .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

  if (dari) query = query.gte('tanggal', dari);
  if (sampai) query = query.lte('tanggal', sampai);

  const { data, error, count } = await query;

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ data, total: count });
}
