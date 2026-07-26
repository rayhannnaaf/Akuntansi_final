// pages/api/laporan/neraca-saldo.js
import { query } from '../../../lib/db';
import { requireAuth } from '../../../lib/auth';
import { hitungNeracaSaldo, hitungLabaRugi } from '../../../lib/akuntansi';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    const { rows: akunList } = await query(
      `SELECT id, kode, nama, tipe, saldo_awal FROM akun WHERE aktif = true ORDER BY kode ASC`
    );
    const { rows: jurnalList } = await query(
      `SELECT akun_id, debit, kredit FROM jurnal_entri`
    );

    const neracaSaldo = hitungNeracaSaldo(akunList, jurnalList);
    const labaRugi = hitungLabaRugi(neracaSaldo);

    return res.status(200).json({ neracaSaldo, labaRugi });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Gagal menghitung neraca saldo' });
  }
}