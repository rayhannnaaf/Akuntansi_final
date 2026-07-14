import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { Card, Spinner, Empty, Button } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import { formatRupiah, hitungNeracaSaldo, hitungLabaRugi } from '../../lib/akuntansi';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function NeracaPage() {
  const [asetList, setAsetList] = useState([]);
  const [kewajibanList, setKewajibanList] = useState([]);
  const [ekuitasList, setEkuitasList] = useState([]);
  const [totalAset, setTotalAset] = useState(0);
  const [totalKewajiban, setTotalKewajiban] = useState(0);
  const [totalEkuitas, setTotalEkuitas] = useState(0);
  const [labaBersih, setLabaBersih] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [{ data: akunList }, { data: jurnalList }] = await Promise.all([
      supabase.from('akun').select('*').eq('aktif', true),
      supabase.from('jurnal_entri').select('*'),
    ]);

    if (akunList && jurnalList) {
      const neraca = hitungNeracaSaldo(akunList, jurnalList);
      const lr = hitungLabaRugi(neraca);

      const aset = neraca.filter(a => a.tipe === 'aset');
      const kewajiban = neraca.filter(a => a.tipe === 'kewajiban');
      const ekuitas = neraca.filter(a => a.tipe === 'ekuitas');

      setAsetList(aset);
      setKewajibanList(kewajiban);
      setEkuitasList(ekuitas);
      setTotalAset(aset.reduce((s, a) => s + Math.max(a.saldo, 0), 0));
      setTotalKewajiban(kewajiban.reduce((s, a) => s + Math.max(a.saldo, 0), 0));
      setTotalEkuitas(ekuitas.reduce((s, a) => s + Math.max(a.saldo, 0), 0));
      setLabaBersih(lr.labaRugiBersih);
    }
    setLoading(false);
  };

  const totalPassiva = totalKewajiban + totalEkuitas + labaBersih;
  const seimbang = Math.abs(totalAset - totalPassiva) < 1;

  const AkunRow = ({ akun }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px dashed var(--border)' }}>
      <span style={{ fontSize: 13 }}>
        <span style={{ color: 'var(--text-muted)', marginRight: 8, fontFamily: 'DM Mono', fontSize: 11 }}>{akun.kode}</span>
        {akun.nama}
      </span>
      <span style={{ fontFamily: 'DM Mono', fontSize: 13, fontWeight: 600 }}>{formatRupiah(Math.max(akun.saldo, 0))}</span>
    </div>
  );

  const Subtotal = ({ label, value }) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      padding: '10px 0', borderTop: '2px solid var(--border)',
      marginTop: 4,
    }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontFamily: 'DM Mono', fontWeight: 800, fontSize: 13 }}>{formatRupiah(value)}</span>
    </div>
  );

  return (
    <Layout title="Neraca Keuangan">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>Neraca (Balance Sheet)</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Per {format(new Date(), 'dd MMMM yyyy', { locale: id })}</p>
        </div>
        <Button onClick={loadData} variant="secondary" size="sm">↻ Refresh</Button>
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* Balance indicator */}
          <div style={{
            padding: '10px 16px', borderRadius: 8, marginBottom: 20,
            background: seimbang ? 'var(--success-bg)' : 'var(--danger-bg)',
            border: `1px solid ${seimbang ? 'var(--success)' : 'var(--danger)'}30`,
            fontSize: 13, fontWeight: 600,
            color: seimbang ? 'var(--success)' : 'var(--danger)',
          }}>
            {seimbang ? '✓ Neraca Seimbang — Aset = Kewajiban + Ekuitas' : `✗ Neraca tidak seimbang! Selisih: ${formatRupiah(Math.abs(totalAset - totalPassiva))}`}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* AKTIVA */}
            <Card>
              <div style={{
                background: 'var(--primary)', color: '#fff',
                padding: '10px 16px', borderRadius: 8, marginBottom: 16,
                fontSize: 14, fontWeight: 800, textAlign: 'center', letterSpacing: 1,
              }}>AKTIVA (ASET)</div>

              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                  Aset Lancar & Tetap
                </h4>
                {asetList.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '8px 0' }}>Tidak ada aset</div>
                ) : asetList.map(a => <AkunRow key={a.id} akun={a} />)}
              </div>

              <Subtotal label="TOTAL AKTIVA" value={totalAset} />
            </Card>

            {/* PASIVA */}
            <Card>
              <div style={{
                background: 'var(--accent)', color: '#fff',
                padding: '10px 16px', borderRadius: 8, marginBottom: 16,
                fontSize: 14, fontWeight: 800, textAlign: 'center', letterSpacing: 1,
              }}>PASIVA</div>

              {/* Kewajiban */}
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                  Kewajiban
                </h4>
                {kewajibanList.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '8px 0' }}>Tidak ada kewajiban</div>
                ) : kewajibanList.map(a => <AkunRow key={a.id} akun={a} />)}
                <Subtotal label="Total Kewajiban" value={totalKewajiban} />
              </div>

              {/* Ekuitas */}
              <div style={{ marginBottom: 8 }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--info)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                  Ekuitas
                </h4>
                {ekuitasList.map(a => <AkunRow key={a.id} akun={a} />)}

                {/* Laba/Rugi current period */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px dashed var(--border)' }}>
                  <span style={{ fontSize: 13, color: labaBersih >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                    {labaBersih >= 0 ? 'Laba' : 'Rugi'} Periode Berjalan
                  </span>
                  <span style={{ fontFamily: 'DM Mono', fontSize: 13, fontWeight: 700, color: labaBersih >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {formatRupiah(Math.abs(labaBersih))}
                  </span>
                </div>

                <Subtotal label="Total Ekuitas" value={totalEkuitas + labaBersih} />
              </div>

              <div style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'var(--primary)',
                borderRadius: 8,
                marginTop: 8,
              }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>TOTAL PASIVA</span>
                <span style={{ fontFamily: 'DM Mono', fontWeight: 900, fontSize: 14, color: 'var(--accent-light)' }}>
                  {formatRupiah(totalPassiva)}
                </span>
              </div>
            </Card>
          </div>
        </>
      )}
    </Layout>
  );
}
