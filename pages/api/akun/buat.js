import { requireRole } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/supabase';

const TIPE_VALID = ['aset', 'kewajiban', 'ekuitas', 'pendapatan', 'beban'];

export default async function handler(req, res) {
  const db = supabaseAdmin();
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
  const { data: existing } = await db
    .from('akun')
    .select('id')
    .eq('kode', kode)
    .single();

  if (existing) {
    return res.status(400).json({ error: `Kode akun "${kode}" sudah digunakan` });
  }

  const { data, error } = await db
    .from('akun')
    .insert({ kode, nama, tipe, saldo_awal: parseFloat(saldo_awal) || 0, keterangan, aktif: true })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  return res.status(201).json({ success: true, data });
}
