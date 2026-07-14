import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { StatCard, Card, Spinner, Table, Tr, Td, Badge } from '../components/ui';
import { supabase } from '../lib/supabase';
import { formatRupiah, hitungNeracaSaldo, hitungLabaRugi, TIPE_AKUN } from '../lib/akuntansi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalAset: 0, totalPendapatan: 0, totalBeban: 0, labaRugi: 0 });
  const [transaksiTerbaru, setTransaksiTerbaru] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      // Ambil semua akun
      const { data: akunList } = await supabase.from('akun').select('*').eq('aktif', true);
      // Ambil semua jurnal
      const { data: jurnalList } = await supabase.from('jurnal_entri').select('*');
      // Ambil transaksi terbaru
      const { data: transaksi } = await supabase
        .from('transaksi')
        .select('*, profiles(nama)')
        .order('tanggal', { ascending: false })
        .limit(8);

      if (akunList && jurnalList) {
        const neraca = hitungNeracaSaldo(akunList, jurnalList);
        const lr = hitungLabaRugi(neraca);
        const totalAset = neraca
          .filter(a => a.tipe === TIPE_AKUN.ASET)
          .reduce((s, a) => s + Math.max(a.saldo, 0), 0);

        setStats({
          totalAset,
          totalPendapatan: lr.totalPendapatan,
          totalBeban: lr.totalBeban,
          labaRugi: lr.labaRugiBersih,
        });
      }

      if (transaksi) setTransaksiTerbaru(transaksi);

      // Chart data bulanan (6 bulan terakhir)
      buildChartData(jurnalList, akunList);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const buildChartData = (jurnalList, akunList) => {
    if (!jurnalList || !akunList) return;
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: format(d, 'MMM', { locale: id }),
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        pendapatan: 0,
        beban: 0,
      });
    }
    // Untuk chart sederhana ini kita perlu join dengan transaksi - simplifikasi
    setChartData(months);
  };

  if (loading) return <Layout title="Dashboard"><Spinner /></Layout>;

  const TIPE_WARNA = {
    aset: 'primary', kewajiban: 'warning', ekuitas: 'info', pendapatan: 'success', beban: 'danger',
  };

  return (
    <Layout title="Dashboard Keuangan">
      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16, marginBottom: 24,
      }}>
        <StatCard label="Total Aset" value={formatRupiah(stats.totalAset)}  color="var(--primary)" />
        <StatCard label="Total Pendapatan" value={formatRupiah(stats.totalPendapatan)}  color="var(--success)" />
        <StatCard label="Total Beban" value={formatRupiah(stats.totalBeban)}  color="var(--danger)" />
        <StatCard
          label={stats.labaRugi >= 0 ? 'Laba Bersih' : 'Rugi Bersih'}
          value={formatRupiah(Math.abs(stats.labaRugi))}
          color={stats.labaRugi >= 0 ? 'var(--success)' : 'var(--danger)'}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Chart */}
        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--primary)' }}>
            Ringkasan 6 Bulan Terakhir
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={12}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000000).toFixed(0)}jt`} />
              <Tooltip formatter={v => formatRupiah(v)} />
              <Bar dataKey="pendapatan" fill="var(--primary)" radius={4} name="Pendapatan" />
              <Bar dataKey="beban" fill="var(--accent)" radius={4} name="Beban" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Laba Rugi Summary */}
        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--primary)' }}>
            Posisi Keuangan
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Total Aset', value: stats.totalAset, color: 'var(--primary)' },
              { label: 'Total Pendapatan', value: stats.totalPendapatan, color: 'var(--success)' },
              { label: 'Total Beban', value: stats.totalBeban, color: 'var(--danger)' },
            ].map(item => (
              <div key={item.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', background: 'var(--surface)', borderRadius: 8,
              }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.label}</span>
                <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 700, color: item.color, fontSize: 13 }}>
                  {formatRupiah(item.value)}
                </span>
              </div>
            ))}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 14px',
              background: stats.labaRugi >= 0 ? 'var(--success-bg)' : 'var(--danger-bg)',
              borderRadius: 8,
              border: `1px solid ${stats.labaRugi >= 0 ? 'var(--success)' : 'var(--danger)'}20`,
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: stats.labaRugi >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {stats.labaRugi >= 0 ? 'Laba Bersih' : 'Rugi Bersih'}
              </span>
              <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 800, color: stats.labaRugi >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {formatRupiah(Math.abs(stats.labaRugi))}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Transaksi Terbaru */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>Transaksi Terbaru</h3>
          <a href="/transaksi" style={{ fontSize: 12, color: 'var(--primary-light)', fontWeight: 600 }}>Lihat Semua →</a>
        </div>
        <Table headers={['Tanggal', 'No. Bukti', 'Keterangan', 'Nilai', 'Dibuat Oleh']}>
          {transaksiTerbaru.length === 0 ? (
            <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
              Belum ada transaksi
            </td></tr>
          ) : transaksiTerbaru.map(t => (
            <Tr key={t.id}>
              <Td>{format(new Date(t.tanggal), 'dd MMM yyyy', { locale: id })}</Td>
              <Td><span style={{ fontFamily: 'DM Mono', fontSize: 12 }}>{t.nomor_bukti}</span></Td>
              <Td>{t.keterangan}</Td>
              <Td mono right>{formatRupiah(t.total_nilai)}</Td>
              <Td>{t.profiles?.nama || '-'}</Td>
            </Tr>
          ))}
        </Table>
      </Card>
    </Layout>
  );
}
