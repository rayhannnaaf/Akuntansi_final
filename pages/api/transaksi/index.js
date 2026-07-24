import { requireAuth } from '../../../lib/auth';
import { query } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  const { dari, sampai, limit = 50, offset = 0 } = req.query;

  const conditions = [];
  const params = [];

  if (dari) {
    params.push(dari);
    conditions.push(`t.tanggal >= $${params.length}`);
  }
  if (sampai) {
    params.push(sampai);
    conditions.push(`t.tanggal <= $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const dataParams = [...params, parseInt(limit), parseInt(offset)];
  const limitIdx = dataParams.length - 1;
  const offsetIdx = dataParams.length;

  const { rows } = await query(
    `SELECT
       t.*,
       p.nama AS profiles_nama,
       COALESCE(
         json_agg(
           json_build_object(
             'id', j.id, 'debit', j.debit, 'kredit', j.kredit,
             'akun', json_build_object('kode', a.kode, 'nama', a.nama, 'tipe', a.tipe)
           )
         ) FILTER (WHERE j.id IS NOT NULL), '[]'
       ) AS jurnal_entri
     FROM transaksi t
     LEFT JOIN profiles p ON p.id = t.created_by
     LEFT JOIN jurnal_entri j ON j.transaksi_id = t.id
     LEFT JOIN akun a ON a.id = j.akun_id
     ${where}
     GROUP BY t.id, p.nama
     ORDER BY t.tanggal DESC
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    dataParams
  );

  const { rows: countRows } = await query(
    `SELECT COUNT(*) FROM transaksi t ${where}`,
    params
  );

  return res.status(200).json({ data: rows, total: parseInt(countRows[0].count, 10) });
}