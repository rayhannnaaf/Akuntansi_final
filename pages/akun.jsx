import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { Card, Table, Tr, Td, Button, Input, Select, Spinner, Empty, Badge } from '../components/ui';
import { supabase } from '../lib/supabase';
import { formatRupiah } from '../lib/akuntansi';
import toast from 'react-hot-toast';

const TIPE_AKUN_OPSI = ['aset', 'kewajiban', 'ekuitas', 'pendapatan', 'beban'];
const TIPE_COLOR = {
  aset: 'primary', kewajiban: 'warning', ekuitas: 'info',
  pendapatan: 'success', beban: 'danger',
};

export default function AkunPage() {
  const [akunList, setAkunList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ kode: '', nama: '', tipe: 'aset', saldo_awal: '', keterangan: '' });
  const [filterTipe, setFilterTipe] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        setProfile(data);
      }
    });
    loadAkun();
  }, []);

  const loadAkun = async () => {
    setLoading(true);
    const { data } = await supabase.from('akun').select('*').order('kode');
    setAkunList(data || []);
    setLoading(false);
  };

  const handleSimpan = async () => {
    if (!form.kode || !form.nama || !form.tipe) {
      toast.error('Lengkapi data akun');
      return;
    }
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/akun/buat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ ...form, saldo_awal: parseFloat(form.saldo_awal) || 0 }),
    });
    const result = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast.error(result.error || 'Gagal menyimpan akun');
    } else {
      toast.success('Akun berhasil dibuat');
      setShowForm(false);
      setForm({ kode: '', nama: '', tipe: 'aset', saldo_awal: '', keterangan: '' });
      loadAkun();
    }
  };

  const filtered = filterTipe ? akunList.filter(a => a.tipe === filterTipe) : akunList;

  const groupByTipe = TIPE_AKUN_OPSI.map(tipe => ({
    tipe,
    akun: filtered.filter(a => a.tipe === tipe),
  })).filter(g => g.akun.length > 0);

  return (
    <Layout title="Daftar Akun">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>Daftar Akun (Chart of Accounts)</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {akunList.length} akun terdaftar
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={filterTipe}
            onChange={e => setFilterTipe(e.target.value)}
            style={{
              padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8,
              background: 'var(--surface-raised)', fontSize: 13,
            }}
          >
            <option value="">Semua Tipe</option>
            {TIPE_AKUN_OPSI.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
          {profile?.role === 'admin' && (
            <Button onClick={() => setShowForm(v => !v)} variant={showForm ? 'secondary' : 'accent'}>
              {showForm ? '✕ Tutup' : '+ Akun Baru'}
            </Button>
          )}
        </div>
      </div>

      {/* Form Akun Baru (Admin Only) */}
      {showForm && profile?.role === 'admin' && (
        <Card style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--primary)', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
            ➕ Tambah Akun Baru
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            <Input label="Kode Akun" placeholder="1-1000" value={form.kode} onChange={e => setForm(f => ({ ...f, kode: e.target.value }))} />
            <Input label="Nama Akun" placeholder="Kas" value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} />
            <Select label="Tipe Akun" value={form.tipe} onChange={e => setForm(f => ({ ...f, tipe: e.target.value }))}>
              {TIPE_AKUN_OPSI.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </Select>
            <Input label="Saldo Awal (Rp)" type="number" placeholder="0" value={form.saldo_awal} onChange={e => setForm(f => ({ ...f, saldo_awal: e.target.value }))} />
          </div>
          <Input label="Keterangan (opsional)" placeholder="Deskripsi akun..." value={form.keterangan} onChange={e => setForm(f => ({ ...f, keterangan: e.target.value }))} />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <Button onClick={() => setShowForm(false)} variant="secondary">Batal</Button>
            <Button onClick={handleSimpan} disabled={saving} variant="accent">
              {saving ? 'Menyimpan...' : '💾 Simpan Akun'}
            </Button>
          </div>
        </Card>
      )}

      {/* Akun List by Group */}
      {loading ? <Spinner /> : akunList.length === 0 ? (
        <Empty message="Belum ada akun. Jalankan SQL schema terlebih dahulu." icon="📒" />
      ) : (
        groupByTipe.map(group => (
          <Card key={group.tipe} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Badge color={TIPE_COLOR[group.tipe]}>{group.tipe.toUpperCase()}</Badge>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{group.akun.length} akun</span>
            </div>
            <Table headers={['Kode', 'Nama Akun', 'Tipe', 'Saldo Awal', 'Keterangan', 'Status']}>
              {group.akun.map(a => (
                <Tr key={a.id}>
                  <Td mono>{a.kode}</Td>
                  <Td><strong>{a.nama}</strong></Td>
                  <Td><Badge color={TIPE_COLOR[a.tipe]}>{a.tipe}</Badge></Td>
                  <Td mono right>{formatRupiah(a.saldo_awal)}</Td>
                  <Td>{a.keterangan || '-'}</Td>
                  <Td><Badge color={a.aktif ? 'success' : 'danger'}>{a.aktif ? 'Aktif' : 'Nonaktif'}</Badge></Td>
                </Tr>
              ))}
            </Table>
          </Card>
        ))
      )}
    </Layout>
  );
}
