import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { Card, Table, Tr, Td, Spinner, Empty, Badge, Input, Select } from '../components/ui';
import { authHeader } from '../lib/auth-client';
import { formatRupiah } from '../lib/akuntansi';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';

export default function JurnalPage() {
  const [jurnalData, setJurnalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    dari: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    sampai: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });

  useEffect(() => { loadJurnal(); }, [filter]);

  const loadJurnal = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ dari: filter.dari, sampai: filter.sampai });
      const res = await fetch(`/api/jurnal?${params}`, { headers: { ...authHeader() } });
      const json = await res.json();

      if (!res.ok) {
        setJurnalData([]);
      } else {
        setJurnalData(json.data || []);
      }
    } catch (err) {
      setJurnalData([]);
    }
    setLoading(false);
  };

  const totalDebit = jurnalData.reduce((s, j) => s + (j.debit || 0), 0);
  const totalKredit = jurnalData.reduce((s, j) => s + (j.kredit || 0), 0);

  const TIPE_COLOR = {
    aset: 'primary', kewajiban: 'warning', ekuitas: 'info',
    pendapatan: 'success', beban: 'danger',
  };

  return (
    <Layout title="Buku Jurnal Umum">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>Buku Jurnal Umum</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Seluruh entri transaksi dalam periode yang dipilih
        </p>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
          <Input
            label="Dari Tanggal"
            type="date"
            value={filter.dari}
            onChange={e => setFilter(f => ({ ...f, dari: e.target.value }))}
            style={{ width: 160 }}
          />
          <Input
            label="Sampai Tanggal"
            type="date"
            value={filter.sampai}
            onChange={e => setFilter(f => ({ ...f, sampai: e.target.value }))}
            style={{ width: 160 }}
          />
          <div style={{ fontSize: 13, color: 'var(--text-muted)', paddingBottom: 8 }}>
            {jurnalData.length} entri ditemukan
          </div>
        </div>
      </Card>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>
            Jurnal Umum — {format(new Date(filter.dari), 'dd MMM', { locale: id })} s/d {format(new Date(filter.sampai), 'dd MMM yyyy', { locale: id })}
          </h3>
          {Math.abs(totalDebit - totalKredit) < 0.01 && jurnalData.length > 0 && (
            <Badge color="success">✓ Jurnal Seimbang</Badge>
          )}
        </div>

        {loading ? <Spinner /> : jurnalData.length === 0 ? (
          <Empty message="Tidak ada jurnal dalam periode ini" icon="📋" />
        ) : (
          <>
            <Table headers={['Tanggal', 'No. Bukti', 'Keterangan', 'Kode Akun', 'Nama Akun', 'Tipe', 'Debit', 'Kredit']}>
              {jurnalData.map((j, idx) => (
                <Tr key={j.id}>
                  <Td>{format(new Date(j.transaksi.tanggal), 'dd/MM/yy')}</Td>
                  <Td><span style={{ fontFamily: 'DM Mono', fontSize: 11 }}>{j.transaksi.nomor_bukti}</span></Td>
                  <Td>{j.transaksi.keterangan}</Td>
                  <Td mono>{j.akun?.kode}</Td>
                  <Td>{j.akun?.nama}</Td>
                  <Td><Badge color={TIPE_COLOR[j.akun?.tipe] || 'default'}>{j.akun?.tipe}</Badge></Td>
                  <Td mono right>{j.debit > 0 ? formatRupiah(j.debit) : '-'}</Td>
                  <Td mono right>{j.kredit > 0 ? formatRupiah(j.kredit) : '-'}</Td>
                </Tr>
              ))}
            </Table>

            <div style={{
              display: 'grid', gridTemplateColumns: '1fr auto auto',
              gap: 0,
              padding: '12px 14px',
              background: 'var(--primary)',
              borderRadius: 8,
              marginTop: 8,
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>TOTAL</span>
              <span style={{ fontFamily: 'DM Mono', fontWeight: 800, color: '#fff', fontSize: 13, marginRight: 80 }}>
                {formatRupiah(totalDebit)}
              </span>
              <span style={{ fontFamily: 'DM Mono', fontWeight: 800, color: '#fff', fontSize: 13 }}>
                {formatRupiah(totalKredit)}
              </span>
            </div>
          </>
        )}
      </Card>
    </Layout>
  );
}