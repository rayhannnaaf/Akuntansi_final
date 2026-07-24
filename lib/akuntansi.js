export const TIPE_AKUN = {
  ASET: 'aset',
  KEWAJIBAN: 'kewajiban',
  EKUITAS: 'ekuitas',
  PENDAPATAN: 'pendapatan',
  BEBAN: 'beban',
};

// Saldo normal berdasarkan tipe akun
export const SALDO_NORMAL = {
  aset: 'debit',
  kewajiban: 'kredit',
  ekuitas: 'kredit',
  pendapatan: 'kredit',
  beban: 'debit',
};

/**
 * Hitung saldo akun berdasarkan jurnal
 * @param {string} tipeAkun - Tipe akun (aset/kewajiban/ekuitas/pendapatan/beban)
 * @param {number} totalDebit
 * @param {number} totalKredit
 * @returns {number} Saldo akun
 */
export function hitungSaldo(tipeAkun, totalDebit, totalKredit) {
  const saldoNormal = SALDO_NORMAL[tipeAkun];
  if (saldoNormal === 'debit') {
    return totalDebit - totalKredit;
  } else {
    return totalKredit - totalDebit;
  }
}

/**
 * Validasi transaksi double-entry (jumlah debit harus = kredit)
 * @param {Array} entri - Array of { akunId, debit, kredit }
 * @returns {{ valid: boolean, pesan: string }}
 */
export function validasiTransaksi(entri) {
  if (!entri || entri.length < 2) {
    return { valid: false, pesan: 'Transaksi harus memiliki minimal 2 entri jurnal' };
  }

  const totalDebit = entri.reduce((sum, e) => sum + (Number(e.debit) || 0), 0);
  const totalKredit = entri.reduce((sum, e) => sum + (Number(e.kredit) || 0), 0);

  // Toleransi pembulatan
  if (Math.abs(totalDebit - totalKredit) > 0.01) {
    return {
      valid: false,
      pesan: `Total debit (${formatRupiah(totalDebit)}) tidak sama dengan total kredit (${formatRupiah(totalKredit)})`,
    };
  }

  for (const e of entri) {
    if (!e.akunId) return { valid: false, pesan: 'Semua entri harus memiliki akun' };
    const d = Number(e.debit) || 0;
    const k = Number(e.kredit) || 0;
    if (d === 0 && k === 0) return { valid: false, pesan: 'Nilai debit atau kredit tidak boleh keduanya nol' };
    if (d < 0 || k < 0) return { valid: false, pesan: 'Nilai tidak boleh negatif' };
  }

  return { valid: true, pesan: 'Valid' };
}

/**
 * Format angka ke format Rupiah
 */
export function formatRupiah(angka) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka || 0);
}

/**
 * Hitung neraca saldo dari semua jurnal
 * @param {Array} akunList - Daftar akun
 * @param {Array} jurnalList - Daftar entri jurnal
 * @returns {Array} Neraca saldo
 */
export function hitungNeracaSaldo(akunList, jurnalList) {
  const saldoMap = {};

  // Inisialisasi saldo
  for (const akun of akunList) {
    saldoMap[akun.id] = { ...akun, totalDebit: 0, totalKredit: 0, saldo: 0 };
  }

  // Akumulasi dari jurnal
  for (const jurnal of jurnalList) {
    if (saldoMap[jurnal.akun_id]) {
      saldoMap[jurnal.akun_id].totalDebit += Number(jurnal.debit) || 0;
      saldoMap[jurnal.akun_id].totalKredit += Number(jurnal.kredit) || 0;
    }
  }

  // Hitung saldo akhir
  for (const id in saldoMap) {
    const akun = saldoMap[id];
    akun.saldo = hitungSaldo(akun.tipe, akun.totalDebit, akun.totalKredit);
  }

  return Object.values(saldoMap).filter(a => a.totalDebit > 0 || a.totalKredit > 0 || a.saldo_awal > 0);
}

/**
 * Buat laporan laba rugi
 */
export function hitungLabaRugi(neracaSaldo) {
  const pendapatan = neracaSaldo
    .filter(a => a.tipe === TIPE_AKUN.PENDAPATAN)
    .reduce((sum, a) => sum + a.saldo, 0);

  const beban = neracaSaldo
    .filter(a => a.tipe === TIPE_AKUN.BEBAN)
    .reduce((sum, a) => sum + a.saldo, 0);

  return {
    totalPendapatan: pendapatan,
    totalBeban: beban,
    labaRugiBersih: pendapatan - beban,
    isLaba: pendapatan >= beban,
  };
}
