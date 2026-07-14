import { requireAuth } from '../../../lib/auth';
import { supabase } from '../../../lib/supabase';
import { hitungNeracaSaldo, hitungLabaRugi } from '../../../lib/akuntansi';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  const [{ data: akunList, error: akunErr }, { data: jurnalList, error: jurnalErr }] = await Promise.all([
    supabase.from('akun').select('*').eq('aktif', true).order('kode'),
    supabase.from('jurnal_entri').select('*'),
  ]);

  if (akunErr || jurnalErr) {
    return res.status(500).json({ error: akunErr?.message || jurnalErr?.message });
  }

  const neracaSaldo = hitungNeracaSaldo(akunList || [], jurnalList || []);
  const labaRugi = hitungLabaRugi(neracaSaldo);

  return res.status(200).json({
    neracaSaldo,
    labaRugi,
    tanggal: new Date().toISOString(),
  });
}
