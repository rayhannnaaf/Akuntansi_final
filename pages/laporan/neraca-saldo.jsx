import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { Card, Table, Tr, Td, Spinner, Empty, Badge, Button } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import { formatRupiah, hitungNeracaSaldo, hitungSaldo, SALDO_NORMAL } from '../../lib/akuntansi';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const TIPE_COLOR = {
  aset: 'primary', kewajiban: 'warning', ekuitas: 'info',
  pendapatan: 'success', beban: 'danger',
};

export default function NeracaSaldoPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalDebit, setTotalDebit] = useState(0);
  const [totalKredit, setTotalKredit] = useState(0);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [{ data: akunList }, { data: jurnalList }] = await Promise.all([
      supabase.from('akun').select('*').eq('aktif', true).order('kode'),
      supabase.from('jurnal_entri').select('*'),
    ]);

    if (akunList && jurnalList) {
      const neraca = hitungNeracaSaldo(akunList, jurnalList);

      // Hitung total berdasarkan saldo normal akun
      let tD = 0, tK = 0;
      neraca.forEach(a => {
        const saldoN = SALDO_NORMAL[a.tipe];
        if (saldoN === 'debit') tD += Math.max(a.saldo, 0);
        else tK += Math.max(a.saldo, 0);
      });

      setData(neraca);
      setTotalDebit(tD);
      setTotalKredit(tK);
    }
    setLoading(false);
  };

  const seimbang = Math.abs(totalDebit - totalKredit) < 0.01;

  return (
    <Layout title="Neraca Saldo">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>Neraca Saldo</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Per {format(new Date(), 'dd MMMM yyyy', { locale: id })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Badge color={seimbang ? 'success' : 'danger'}>
            {seimbang ? '✓ Seimbang' : '✗ Tidak Seimbang'}
          </Badge>
          <Button onClick={loadData} variant="secondary" size="sm">↻ Refresh</Button>
        </div>
      </div>

      <Card>
        <div style={{
          textAlign: 'center', padding: '16px 0 24px',
          borderBottom: '2px solid var(--primary)',
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
            SMA — Sistem Akuntansi Sekolah
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>NERACA SALDO</h2>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Per Tanggal {format(new Date(), 'dd MMMM yyyy', { locale: id })}
          </div>
        </div>

        {loading ? <Spinner /> : data.length === 0 ? (
          <Empty message="Belum ada data transaksi" icon="📊" />
        ) : (
          <>
            <Table headers={['Kode', 'Nama Akun', 'Tipe', 'Debit', 'Kredit']}>
              {data.map(a => {
                const saldoNormal = SALDO_NORMAL[a.tipe];
                const saldo = Math.max(a.saldo, 0);
                return (
                  <Tr key={a.id}>
                    <Td mono>{a.kode}</Td>
                    <Td>{a.nama}</Td>
                    <Td><Badge color={TIPE_COLOR[a.tipe]}>{a.tipe}</Badge></Td>
                    <Td mono right>
                      {saldoNormal === 'debit' && saldo > 0 ? formatRupiah(saldo) : '-'}
                    </Td>
                    <Td mono right>
                      {saldoNormal === 'kredit' && saldo > 0 ? formatRupiah(saldo) : '-'}
                    </Td>
                  </Tr>
                );
              })}
            </Table>

            {/* Footer Total */}
            <div style={{
              display: 'grid', gridTemplateColumns: '3fr 1fr 1fr',
              background: 'var(--primary)',
              padding: '14px 14px',
              borderRadius: 8,
              marginTop: 8,
            }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>TOTAL</span>
              <span style={{ fontFamily: 'DM Mono', fontWeight: 800, color: 'var(--accent-light)', fontSize: 13, textAlign: 'right' }}>
                {formatRupiah(totalDebit)}
              </span>
              <span style={{ fontFamily: 'DM Mono', fontWeight: 800, color: 'var(--accent-light)', fontSize: 13, textAlign: 'right' }}>
                {formatRupiah(totalKredit)}
              </span>
            </div>
          </>
        )}
      </Card>
    </Layout>
  );
}
