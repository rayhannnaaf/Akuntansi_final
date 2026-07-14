import { requireAuth } from '../../../lib/auth';
import { supabase } from '../../../lib/supabase';
import { validasiTransaksi } from '../../../lib/akuntansi';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Autentikasi
  const user = await requireAuth(req, res);
  if (!user) return;

  const { tanggal, nomorBukti, keterangan, totalNilai, entri } = req.body;

  // Validasi input
  if (!tanggal || !nomorBukti || !keterangan) {
    return res.status(400).json({ error: 'Data transaksi tidak lengkap' });
  }

  // Validasi double-entry
  const { valid, pesan } = validasiTransaksi(entri || []);
  if (!valid) {
    return res.status(400).json({ error: pesan });
  }

  // Validasi nomor bukti unik
  const { data: existing } = await supabase
    .from('transaksi')
    .select('id')
    .eq('nomor_bukti', nomorBukti)
    .single();

  if (existing) {
    return res.status(400).json({ error: `Nomor bukti "${nomorBukti}" sudah digunakan` });
  }

  console.log('BODY:', req.body);
console.log('ENTRI:', entri);
  // Validasi akun ada semua
  const akunIds = entri.map(e => parseInt(e.akunId));
  console.log('AKUN IDS:', akunIds);
  const { data: akunCheck, error: akunErr } = await supabase
    .from('akun')
    .select('id, aktif')
    .in('id', akunIds);

  if (akunErr || !akunCheck || akunCheck.length !== [...new Set(akunIds)].length) {
    return res.status(400).json({ error: 'Satu atau lebih akun tidak ditemukan' });
  }

  const nonaktif = akunCheck.filter(a => !a.aktif);
  if (nonaktif.length > 0) {
    return res.status(400).json({ error: 'Beberapa akun sudah tidak aktif' });
  }

  // Simpan transaksi (header)
  const { data: transaksi, error: transaksiErr } = await supabase
    .from('transaksi')
    .insert({
      tanggal,
      nomor_bukti: nomorBukti,
      keterangan,
      total_nilai: totalNilai || 0,
      created_by: user.id,
    })
    .select()
    .single();

  if (transaksiErr) {
    return res.status(500).json({ error: 'Gagal menyimpan transaksi: ' + transaksiErr.message });
  }

  // Simpan entri jurnal (detail)
  const entriData = entri.map(e => ({
    transaksi_id: transaksi.id,
    akun_id: parseInt(e.akunId),
    debit: parseFloat(e.debit) || 0,
    kredit: parseFloat(e.kredit) || 0,
    keterangan: e.keterangan || keterangan,
  }));

  const { error: jurnalErr } = await supabase
    .from('jurnal_entri')
    .insert(entriData);

  if (jurnalErr) {
    // Rollback transaksi header
    await supabase.from('transaksi').delete().eq('id', transaksi.id);
    return res.status(500).json({ error: 'Gagal menyimpan jurnal: ' + jurnalErr.message });
  }

  return res.status(201).json({
    success: true,
    message: 'Transaksi berhasil disimpan',
    data: { transaksiId: transaksi.id, nomorBukti },
  });
}
