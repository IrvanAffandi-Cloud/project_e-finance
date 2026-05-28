import * as XLSX from 'xlsx'

export const cetakLaporanExcel = (transaksi: any[], stats: any) => {
  // BIKIN TABEL RIWAYAT
  const dataRiwayat = transaksi.map((t, index) => ({
    'NO': index + 1,
    'TANGGAL': new Date(t.waktu_transaksi).toLocaleDateString('id-ID'),
    'KATEGORI': t.kategori?.nama_kategori || 'UNCATEGORIZED',
    'TIPE': t.kategori?.tipe || '-',
    'CATATAN': t.catatan || '-',
    'NOMINAL (Rp)': Number(t.nominal)
  }))
  const wsRiwayat = XLSX.utils.json_to_sheet(dataRiwayat)

  // BIKIN TABEL RINGKASAN SALDO
  const dataRingkasan = [
    { 'URAIAN': 'TOTAL PEMASUKAN', 'NOMINAL (Rp)': stats.masuk },
    { 'URAIAN': 'TOTAL PENGELUARAN', 'NOMINAL (Rp)': stats.keluar },
    { 'URAIAN': 'SISA SALDO BERSIH', 'NOMINAL (Rp)': stats.saldo }
  ]
  const wsRingkasan = XLSX.utils.json_to_sheet(dataRingkasan)

  // GABUNGKAN & UNDUH
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, wsRingkasan, "RINGKASAN KAS")
  XLSX.utils.book_append_sheet(wb, wsRiwayat, "RIWAYAT TRANSAKSI")

  XLSX.writeFile(wb, `Laporan_Keuangan_Vault.xlsx`)
}