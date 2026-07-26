import { requireAuth } from '../../../lib/auth';
import { query } from '../../../lib/db';
import pool from '../../../lib/db';
import { validasiTransaksi } from '../../../lib/akuntansi';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await requireAuth(req, res);
  if (!user) return;

  const { tanggal, nomorBukti, keterangan, totalNilai, entri } = req.body;

  if (!tanggal || !nomorBukti || !keterangan) {
    return res.status(400).json({ error: 'Data transaksi tidak lengkap' });
  }

  const { valid, pesan } = validasiTransaksi(entri || []);
  if (!valid) {
    return res.status(400).json({ error: pesan });
  }

  // Validasi nomor bukti unik
  const { rows: existing } = await query('SELECT id FROM transaksi WHERE nomor_bukti = $1', [nomorBukti]);
  if (existing.length > 0) {
    return res.status(400).json({ error: `Nomor bukti "${nomorBukti}" sudah digunakan` });
  }

  // Validasi akun ada semua & aktif
  const akunIds = entri.map(e => parseInt(e.akunId));
  const uniqueIds = [...new Set(akunIds)];
  const { rows: akunCheck } = await query(
    'SELECT id, aktif FROM akun WHERE id = ANY($1::int[])',
    [uniqueIds]
  );

  if (akunCheck.length !== uniqueIds.length) {
    return res.status(400).json({ error: 'Satu atau lebih akun tidak ditemukan' });
  }
  if (akunCheck.some(a => !a.aktif)) {
    return res.status(400).json({ error: 'Beberapa akun sudah tidak aktif' });
  }

  // Simpan transaksi + jurnal dalam satu DB transaction (rollback otomatis kalau gagal)
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: transaksiRows } = await client.query(
      `INSERT INTO transaksi (tanggal, nomor_bukti, keterangan, total_nilai, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [tanggal, nomorBukti, keterangan, totalNilai || 0, user.id]
    );
    const transaksi = transaksiRows[0];

    for (const e of entri) {
      await client.query(
        `INSERT INTO jurnal_entri (transaksi_id, akun_id, debit, kredit, keterangan)
         VALUES ($1, $2, $3, $4, $5)`,
        [transaksi.id, parseInt(e.akunId), parseFloat(e.debit) || 0, parseFloat(e.kredit) || 0, e.keterangan || keterangan]
      );
    }

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'Transaksi berhasil disimpan',
      data: { transaksiId: transaksi.id, nomorBukti },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    return res.status(500).json({ error: 'Gagal menyimpan transaksi: ' + err.message });
  } finally {
    client.release();
  }
}