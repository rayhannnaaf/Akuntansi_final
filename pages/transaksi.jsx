import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { Card, Button, Input, Select, Table, Tr, Td, Spinner, Empty } from '../components/ui';
import { supabase } from '../lib/supabase';
import { formatRupiah, validasiTransaksi } from '../lib/akuntansi';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import toast from 'react-hot-toast';

const ENTRI_AWAL = [
  { akunId: '', debit: '', kredit: '' },
  { akunId: '', debit: '', kredit: '' },
];

export default function TransaksiPage() {
  const [transaksiList, setTransaksiList] = useState([]);
  const [akunList, setAkunList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [form, setForm] = useState({
    tanggal: format(new Date(), 'yyyy-MM-dd'),
    nomorBukti: '',
    keterangan: '',
  });
  const [entri, setEntri] = useState(ENTRI_AWAL);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [{ data: transaksi }, { data: akun }] = await Promise.all([
      supabase.from('transaksi').select('*, profiles(nama)').order('tanggal', { ascending: false }).limit(50),
      supabase.from('akun').select('*').eq('aktif', true).order('kode'),
    ]);
    setTransaksiList(transaksi || []);
    setAkunList(akun || []);
    setLoading(false);
  };

  const handleSimpan = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { toast.error('Sesi habis, silakan login kembali'); return; }

    if (!form.tanggal || !form.nomorBukti || !form.keterangan) {
      toast.error('Lengkapi data transaksi');
      return;
    }

    const entriValid = entri.map(e => ({
      akunId: e.akunId,
      debit: parseFloat(e.debit) || 0,
      kredit: parseFloat(e.kredit) || 0,
    })).filter(e => e.akunId);

    const { valid, pesan } = validasiTransaksi(entriValid);
    if (!valid) { toast.error(pesan); return; }

    const totalNilai = entriValid.reduce((s, e) => s + e.debit, 0);

    setSaving(true);
    const token = session.access_token;

    const res = await fetch('/api/transaksi/buat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, entri: entriValid, totalNilai }),
    });
    const result = await res.json();
    setSaving(false);

    if (!res.ok) {
      toast.error(result.error || 'Gagal menyimpan transaksi');
    } else {
      toast.success('Transaksi berhasil disimpan');
      setShowForm(false);
      setForm({ tanggal: format(new Date(), 'yyyy-MM-dd'), nomorBukti: '', keterangan: '' });
      setEntri(ENTRI_AWAL);
      loadData();
    }
  };

  const updateEntri = (idx, field, val) => {
    setEntri(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  };

  const addEntri = () => setEntri(prev => [...prev, { akunId: '', debit: '', kredit: '' }]);
  const removeEntri = (idx) => {
    if (entri.length <= 2) { toast.error('Minimal 2 baris jurnal'); return; }
    setEntri(prev => prev.filter((_, i) => i !== idx));
  };

  const totalDebit = entri.reduce((s, e) => s + (parseFloat(e.debit) || 0), 0);
  const totalKredit = entri.reduce((s, e) => s + (parseFloat(e.kredit) || 0), 0);
  const seimbang = Math.abs(totalDebit - totalKredit) < 0.01 && totalDebit > 0;

  if (loading) return <Layout title="Transaksi"><Spinner /></Layout>;

  return (
    <Layout title="Input Transaksi">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>Transaksi</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Catat transaksi keuangan dengan metode double-entry</p>
        </div>
        <Button onClick={() => setShowForm(v => !v)} variant={showForm ? 'secondary' : 'primary'}>
          {showForm ? '✕ Tutup' : '+ Transaksi Baru'}
        </Button>
      </div>

      {/* Form Input Transaksi */}
      {showForm && (
        <Card style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20, color: 'var(--primary)', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
             Form Input Transaksi
          </h3>

          {/* Header Transaksi */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 12, marginBottom: 20 }}>
            <Input
              label="Tanggal"
              type="date"
              value={form.tanggal}
              onChange={e => setForm(f => ({ ...f, tanggal: e.target.value }))}
            />
            <Input
              label="No. Bukti"
              placeholder="JU-001"
              value={form.nomorBukti}
              onChange={e => setForm(f => ({ ...f, nomorBukti: e.target.value }))}
            />
            <Input
              label="Keterangan Transaksi"
              placeholder="Deskripsi transaksi..."
              value={form.keterangan}
              onChange={e => setForm(f => ({ ...f, keterangan: e.target.value }))}
            />
          </div>

          {/* Entri Jurnal */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Entri Jurnal (Double Entry)
              </label>
              <Button onClick={addEntri} variant="ghost" size="sm">+ Tambah Baris</Button>
            </div>

            {/* Header tabel jurnal */}
            <div style={{
              display: 'grid', gridTemplateColumns: '3fr 2fr 2fr 36px',
              gap: 8, padding: '6px 0',
              fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
            }}>
              <span>Akun</span><span>Debit (Rp)</span><span>Kredit (Rp)</span><span></span>
            </div>

            {entri.map((e, idx) => (
              <div key={idx} style={{
                display: 'grid', gridTemplateColumns: '3fr 2fr 2fr 36px',
                gap: 8, marginBottom: 8,
              }}>
                <select
                  value={e.akunId}
                  onChange={ev => updateEntri(idx, 'akunId', ev.target.value)}
                  style={{
                    padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8,
                    background: 'var(--surface-raised)', fontSize: 13, outline: 'none',
                  }}
                >
                  <option value="">Pilih Akun...</option>
                  {akunList.map(a => (
                    <option key={a.id} value={a.id}>{a.kode} - {a.nama}</option>
                  ))}
                </select>
                <input
                  type="number" min="0" step="1000"
                  placeholder="0"
                  value={e.debit}
                  onChange={ev => updateEntri(idx, 'debit', ev.target.value)}
                  style={{
                    padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8,
                    background: 'var(--surface-raised)', fontSize: 13, textAlign: 'right',
                    fontFamily: 'DM Mono, monospace', outline: 'none',
                  }}
                />
                <input
                  type="number" min="0" step="1000"
                  placeholder="0"
                  value={e.kredit}
                  onChange={ev => updateEntri(idx, 'kredit', ev.target.value)}
                  style={{
                    padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8,
                    background: 'var(--surface-raised)', fontSize: 13, textAlign: 'right',
                    fontFamily: 'DM Mono, monospace', outline: 'none',
                  }}
                />
                <button
                  onClick={() => removeEntri(idx)}
                  style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: 'var(--danger-bg)', border: 'none',
                    color: 'var(--danger)', cursor: 'pointer', fontSize: 14,
                  }}
                >✕</button>
              </div>
            ))}

            {/* Total */}
            <div style={{
              display: 'grid', gridTemplateColumns: '3fr 2fr 2fr 36px',
              gap: 8, padding: '10px 0',
              borderTop: '2px solid var(--border)',
              marginTop: 8,
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', alignSelf: 'center' }}>TOTAL</span>
              <span style={{ textAlign: 'right', fontFamily: 'DM Mono', fontWeight: 700, color: 'var(--primary)', fontSize: 13, alignSelf: 'center' }}>
                {formatRupiah(totalDebit)}
              </span>
              <span style={{ textAlign: 'right', fontFamily: 'DM Mono', fontWeight: 700, color: 'var(--primary)', fontSize: 13, alignSelf: 'center' }}>
                {formatRupiah(totalKredit)}
              </span>
              <span></span>
            </div>

            {/* Balance indicator */}
            <div style={{
              padding: '8px 12px', borderRadius: 8, marginTop: 8,
              background: seimbang ? 'var(--success-bg)' : 'var(--danger-bg)',
              border: `1px solid ${seimbang ? 'var(--success)' : 'var(--danger)'}30`,
              fontSize: 12, color: seimbang ? 'var(--success)' : 'var(--danger)',
              fontWeight: 600,
            }}>
              {seimbang ? '✓ Debit = Kredit — Jurnal seimbang' : `✗ Selisih: ${formatRupiah(Math.abs(totalDebit - totalKredit))}`}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button onClick={() => setShowForm(false)} variant="secondary">Batal</Button>
            <Button onClick={handleSimpan} disabled={saving || !seimbang} variant="primary">
              {saving ? 'Menyimpan...' : ' Simpan Transaksi'}
            </Button>
          </div>
        </Card>
      )}

      {/* Daftar Transaksi */}
      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--primary)' }}>
          Riwayat Transaksi ({transaksiList.length})
        </h3>
        {transaksiList.length === 0 ? (
          <Empty message="Belum ada transaksi. Buat transaksi pertama Anda!" icon="📒" />
        ) : (
          <Table headers={['Tanggal', 'No. Bukti', 'Keterangan', 'Total Nilai', 'Input Oleh']}>
            {transaksiList.map(t => (
              <Tr key={t.id}>
                <Td>{format(new Date(t.tanggal), 'dd MMM yyyy', { locale: id })}</Td>
                <Td><span style={{ fontFamily: 'DM Mono', fontSize: 11, background: 'var(--surface)', padding: '2px 6px', borderRadius: 4 }}>{t.nomor_bukti}</span></Td>
                <Td>{t.keterangan}</Td>
                <Td mono right>{formatRupiah(t.total_nilai)}</Td>
                <Td>{t.profiles?.nama || '-'}</Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>
    </Layout>
  );
}
