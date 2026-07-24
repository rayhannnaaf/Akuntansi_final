import { requireAuth } from '../../../lib/auth';
import { query } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  const { tipe, aktif = 'true' } = req.query;

  const conditions = [];
  const params = [];

  if (tipe) {
    params.push(tipe);
    conditions.push(`tipe = $${params.length}`);
  }
  if (aktif !== 'all') {
    params.push(aktif === 'true');
    conditions.push(`aktif = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows } = await query(`SELECT * FROM akun ${where} ORDER BY kode`, params);

  return res.status(200).json({ data: rows });
}