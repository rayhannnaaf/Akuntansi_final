import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { Card, Spinner, Empty, Badge, Button } from '../../components/ui';
import { authHeader } from '../../lib/auth-client';
import { formatRupiah } from '../../lib/akuntansi';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function LabaRugiPage() {
  const [lrData, setLrData] = useState(null);
  const [pendapatanList, setPendapatanList] = useState([]);
  const [bebanList, setBebanList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    // Pengganti dua query supabase (akun + jurnal_entri) — sudah dihitung server-side
    const res = await fetch('/api/laporan/neraca-saldo', { headers: { ...authHeader() } });
    const result = await res.json();

    if (result.neracaSaldo) {
      setPendapatanList(result.neracaSaldo.filter(a => a.tipe === 'pendapatan' && a.saldo > 0));
      setBebanList(result.neracaSaldo.filter(a => a.tipe === 'beban' && a.saldo > 0));
      setLrData(result.labaRugi);
    }
    setLoading(false);
  };

  const SectionHeader = ({ title, color }) => (
    <div style={{
      background: color,
      padding: '10px 16px',
      borderRadius: 8,
      color: '#fff',
      fontSize: 13,
      fontWeight: 700,
      marginBottom: 4,
      marginTop: 16,
    }}>
      {title}
    </div>
  );

  const AkunRow = ({ akun, indent = false }) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      padding: '8px 16px',
      paddingLeft: indent ? 32 : 16,
      borderBottom: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>
        <span style={{ color: 'var(--text-muted)', marginRight: 8, fontFamily: 'DM Mono', fontSize: 11 }}>{akun.kode}</span>
        {akun.nama}
      </span>
      <span style={{ fontFamily: 'DM Mono', fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>
        {formatRupiah(akun.saldo)}
      </span>
    </div>
  );

  const TotalRow = ({ label, value, color, size = 'normal' }) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      padding: '12px 16px',
      background: color + '12',
      borderRadius: 8,
      marginTop: 4,
    }}>
      <span style={{
        fontSize: size === 'large' ? 15 : 13,
        fontWeight: 700, color,
      }}>{label}</span>
      <span style={{
        fontFamily: 'DM Mono', fontWeight: 800, color,
        fontSize: size === 'large' ? 15 : 13,
      }}>{formatRupiah(value)}</span>
    </div>
  );

  return (
    <Layout title="Laporan Laba Rugi">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>Laporan Laba Rugi</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Per {format(new Date(), 'dd MMMM yyyy', { locale: id })}
          </p>
        </div>
        <Button onClick={loadData} variant="secondary" size="sm">↻ Refresh</Button>
      </div>

      <Card style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: '16px 0 24px', borderBottom: '2px solid var(--primary)', marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
            SMA — Sistem Akuntansi Sekolah
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>LAPORAN LABA RUGI</h2>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Untuk Periode yang Berakhir {format(new Date(), 'dd MMMM yyyy', { locale: id })}
          </div>
        </div>

        {loading ? <Spinner /> : !lrData ? <Empty message="Tidak ada data" /> : (
          <div style={{ padding: '8px 0' }}>
            <SectionHeader title="PENDAPATAN" color="var(--success)" />
            {pendapatanList.length === 0 ? (
              <div style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 13 }}>Belum ada pendapatan</div>
            ) : pendapatanList.map(a => <AkunRow key={a.id} akun={a} indent />)}
            <TotalRow label="Total Pendapatan" value={lrData.totalPendapatan} color="var(--success)" />

            <SectionHeader title="BEBAN" color="var(--danger)" />
            {bebanList.length === 0 ? (
              <div style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 13 }}>Belum ada beban</div>
            ) : bebanList.map(a => <AkunRow key={a.id} akun={a} indent />)}
            <TotalRow label="Total Beban" value={lrData.totalBeban} color="var(--danger)" />

            <div style={{ marginTop: 20, padding: '0 0 8px' }}>
              <div style={{
                background: lrData.isLaba
                  ? 'linear-gradient(135deg, var(--success), #2d9966)'
                  : 'linear-gradient(135deg, var(--danger), #e74c3c)',
                padding: '16px 20px', borderRadius: 12,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              }}>
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>
                    Hasil Akhir Periode
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>
                    {lrData.isLaba ? '📈 LABA BERSIH' : '📉 RUGI BERSIH'}
                  </div>
                </div>
                <div style={{ fontFamily: 'DM Mono', fontSize: 22, fontWeight: 900, color: '#fff' }}>
                  {formatRupiah(Math.abs(lrData.labaRugiBersih))}
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </Layout>
  );
}