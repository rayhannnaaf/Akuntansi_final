// pages/api/jurnal.js
import { query } from '../../lib/db';
import { requireAuth } from '../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireAuth(req, res);
  if (!user) return; // requireAuth sudah kirim response error-nya

  const { dari, sampai } = req.query;
  if (!dari || !sampai) {
    return res.status(400).json({ error: 'Parameter dari dan sampai wajib diisi' });
  }

  try {
    const { rows } = await query(
      `SELECT
         j.id, j.debit, j.kredit, j.created_at,
         a.kode  AS akun_kode,
         a.nama  AS akun_nama,
         a.tipe  AS akun_tipe,
         t.tanggal,
         t.nomor_bukti,
         t.keterangan AS transaksi_keterangan
       FROM jurnal_entri j
       JOIN akun a ON a.id = j.akun_id
       JOIN transaksi t ON t.id = j.transaksi_id
       WHERE t.tanggal >= $1 AND t.tanggal <= $2
       ORDER BY j.created_at ASC`,
      [dari, sampai]
    );

    // Bentuk ulang jadi nested object, meniru hasil .select() Supabase
    const data = rows.map(r => ({
      id: r.id,
      debit: Number(r.debit),
      kredit: Number(r.kredit),
      akun: { kode: r.akun_kode, nama: r.akun_nama, tipe: r.akun_tipe },
      transaksi: {
        tanggal: r.tanggal,
        nomor_bukti: r.nomor_bukti,
        keterangan: r.transaksi_keterangan,
      },
    }));

    return res.status(200).json({ data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Gagal mengambil data jurnal' });
  }
}