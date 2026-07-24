import { requireRole } from '../../../lib/auth';
import { query } from '../../../lib/db';

const TIPE_VALID = ['aset', 'kewajiban', 'ekuitas', 'pendapatan', 'beban'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Hanya admin yang bisa membuat akun baru
  const result = await requireRole(req, res, ['admin']);
  if (!result) return;

  const { kode, nama, tipe, saldo_awal = 0, keterangan } = req.body;

  if (!kode || !nama || !tipe) {
    return res.status(400).json({ error: 'Kode, nama, dan tipe akun wajib diisi' });
  }

  if (!TIPE_VALID.includes(tipe)) {
    return res.status(400).json({ error: `Tipe akun tidak valid. Gunakan: ${TIPE_VALID.join(', ')}` });
  }

  // Cek kode sudah ada
  const { rows: existing } = await query('SELECT id FROM akun WHERE kode = $1', [kode]);
  if (existing.length > 0) {
    return res.status(400).json({ error: `Kode akun "${kode}" sudah digunakan` });
  }

  const { rows } = await query(
    `INSERT INTO akun (kode, nama, tipe, saldo_awal, keterangan, aktif)
     VALUES ($1, $2, $3, $4, $5, true) RETURNING *`,
    [kode, nama, tipe, parseFloat(saldo_awal) || 0, keterangan]
  );

  return res.status(201).json({ success: true, data: rows[0] });
}