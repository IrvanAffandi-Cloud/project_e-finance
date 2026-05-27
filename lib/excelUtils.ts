import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

// ==========================================
// STYLE TEMPLATE GENERATOR (BIAR SERAGAM & RAPI)
// ==========================================
const applyBordersAndAlign = (cell: any, alignment: any) => {
  cell.border = {
    top: { style: 'thin', color: { argb: 'CCCCCC' } },
    left: { style: 'thin', color: { argb: 'CCCCCC' } },
    bottom: { style: 'thin', color: { argb: 'CCCCCC' } },
    right: { style: 'thin', color: { argb: 'CCCCCC' } }
  }
  cell.alignment = alignment
}

// ==========================================
// 1. LAPORAN ABSENSI PARTISIPASI DETAIL DENGAN WAKTU
// ==========================================
export async function cetakExcelPartisipasi(members: any[], namaFase: 'Bakal Calon' | 'Calon Ketua') {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet(`Rekap_${namaFase.replace(' ', '_')}`)

  worksheet.columns = [
    { key: 'no', width: 8 },
    { key: 'nipp', width: 20 },
    { key: 'nama', width: 45 },
    { key: 'status', width: 25 },
    { key: 'waktu', width: 25 },
  ]

  worksheet.mergeCells('A1:E1')
  const titleCell = worksheet.getCell('A1')
  titleCell.value = `REKAP DATA ${namaFase.toUpperCase()}`
  titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFF' } }
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '064E3B' } } 
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  worksheet.getRow(1).height = 40

  const headerRow = worksheet.getRow(2)
  headerRow.values = ['NO', 'NIPP', 'NAMA ANGGOTA', 'STATUS', 'TANGGAL & WAKTU COBLOS']
  headerRow.height = 25
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, size: 11, color: { argb: 'FFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } } 
    applyBordersAndAlign(cell, { horizontal: 'center', vertical: 'middle' })
  })

  members.forEach((m, i) => {
    const sudahMemilih = namaFase === 'Bakal Calon' ? m.sudahMemilihBakalCalon : m.sudahMemilihCalonKetua
    const waktuRaw = namaFase === 'Bakal Calon' ? m.waktuCoblosBakalCalon : m.waktuCoblosCalonKetua
    const statusText = sudahMemilih ? 'SUDAH MEMILIH' : 'BELUM MEMILIH'
    
    let tanggalText = '-'
    if (sudahMemilih && waktuRaw) {
      try {
        const d = new Date(waktuRaw)
        const day = String(d.getDate()).padStart(2, '0')
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const year = d.getFullYear()
        const hours = String(d.getHours()).padStart(2, '0')
        const minutes = String(d.getMinutes()).padStart(2, '0')
        tanggalText = `${day}-${month}-${year} ${hours}:${minutes} WIB`
      } catch (e) {
        tanggalText = '-'
      }
    }

    const row = worksheet.addRow([i + 1, m.nipp, m.nama.toUpperCase(), statusText, tanggalText])
    row.height = 20

    row.eachCell((cell, colNumber) => {
      applyBordersAndAlign(cell, { horizontal: colNumber === 3 ? 'left' : 'center', vertical: 'middle' })
      if (colNumber === 4) {
        cell.font = { bold: true, size: 10, color: { argb: sudahMemilih ? '047857' : 'B91C1C' } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sudahMemilih ? 'E6F4EA' : 'FCE8E6' } }
      }
    })
  })

  const buffer = await workbook.xlsx.writeBuffer()
  saveAs(new Blob([buffer]), `Rekap_Data_${namaFase.replace(' ', '_')}.xlsx`)
}

// ==========================================
// 2. LAPORAN HASIL MUTLAK + DAFTAR HADIR (SUPER DETAIL)
// ==========================================
export async function cetakExcelHasilMutlak(hasilFinal: any[], members: any[]) {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Hasil Pengumuman')

  sheet.columns = [
    { key: 'col1', width: 15 },
    { key: 'col2', width: 25 },
    { key: 'col3', width: 45 },
    { key: 'col4', width: 30 },
    { key: 'col5', width: 25 },
  ]

  // KALKULASI STATISTIK MUTLAK DARI DATA MEMBERS
  const totalAnggota = members.length
  const totalSuaraMasuk = members.filter(m => m.sudahMemilihCalonKetua).length
  const totalGolput = totalAnggota - totalSuaraMasuk
  const partisipasi = totalAnggota > 0 ? ((totalSuaraMasuk / totalAnggota) * 100).toFixed(1) : '0.0'

  // ---------------------------------------------------------
  // HEADER BERITA ACARA
  // ---------------------------------------------------------
  sheet.mergeCells('A1:E1')
  const titleCell1 = sheet.getCell('A1')
  titleCell1.value = `BERITA ACARA RESMI HASIL AKHIR PEROLEHAN SUARA KETUA KOPERASI`
  titleCell1.font = { bold: true, size: 14, color: { argb: 'FFFFFF' } }
  titleCell1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '7F1D1D' } } // Maroon Merah
  titleCell1.alignment = { horizontal: 'center', vertical: 'middle' }
  sheet.getRow(1).height = 45

  // ---------------------------------------------------------
  // PAPAN REKAPITULASI STATISTIK KPU
  // ---------------------------------------------------------
  sheet.mergeCells('A3:B3'); sheet.getCell('A3').value = 'TOTAL DAFTAR PEMILIH TETAP (DPT)'
  sheet.getCell('C3').value = `: ${totalAnggota} JIWA`
  
  sheet.mergeCells('A4:B4'); sheet.getCell('A4').value = 'TOTAL SUARA SAH MASUK'
  sheet.getCell('C4').value = `: ${totalSuaraMasuk} SUARA`
  
  sheet.mergeCells('A5:B5'); sheet.getCell('A5').value = 'TOTAL TIDAK MEMILIH (GOLPUT)'
  sheet.getCell('C5').value = `: ${totalGolput} JIWA`
  
  sheet.mergeCells('A6:B6'); sheet.getCell('A6').value = 'TINGKAT PARTISIPASI PEMILIH'
  sheet.getCell('C6').value = `: ${partisipasi}%`

  // Styling Box Statistik
  for (let i = 3; i <= 6; i++) {
    sheet.getRow(i).font = { bold: true, size: 11 }
    sheet.getCell(`A${i}`).alignment = { horizontal: 'left' }
    sheet.getCell(`C${i}`).alignment = { horizontal: 'left' }
  }

  // ---------------------------------------------------------
  // TABEL 1: HASIL KEMENANGAN KANDIDAT
  // ---------------------------------------------------------
  const startRowTabel1 = 8
  const headerRow1 = sheet.getRow(startRowTabel1)
  headerRow1.values = ['PERINGKAT', 'NIPP KANDIDAT', 'NAMA LENGKAP KANDIDAT', 'TOTAL PEROLEHAN SUARA SAH', 'PERSENTASE KEMENANGAN']
  headerRow1.height = 25
  headerRow1.eachCell((cell) => {
    cell.font = { bold: true, size: 11, color: { argb: 'FFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } }
    applyBordersAndAlign(cell, { horizontal: 'center', vertical: 'middle' })
  })

  hasilFinal.forEach((k, i) => {
    const row = sheet.addRow([
      `JUARA ${i + 1}`,
      k.nipp,
      k.nama.toUpperCase(),
      k.totalSuara,
      `${k.percentage || '0.0'}%`
    ])
    row.height = 22

    row.eachCell((cell, colNumber) => {
      applyBordersAndAlign(cell, { horizontal: colNumber === 3 ? 'left' : 'center', vertical: 'middle' })
      if (i === 0) {
        cell.font = { bold: true, color: { argb: '78350F' } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF3C7' } } 
      }
    })
  })

  const totalRow = sheet.addRow(['', '', 'TOTAL SELURUH SUARA SAH MASUK', totalSuaraSum(hasilFinal), '100%'])
  totalRow.height = 25
  totalRow.eachCell((cell, colNumber) => {
    if (colNumber >= 3) {
      cell.font = { bold: true, size: 11, color: { argb: 'FFFFFF' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F172A' } } 
      applyBordersAndAlign(cell, { horizontal: 'center', vertical: 'middle' })
    }
  })

  // ---------------------------------------------------------
  // SPACER
  // ---------------------------------------------------------
  sheet.addRow([])
  sheet.addRow([])

  // ---------------------------------------------------------
  // TABEL 2: DAFTAR HADIR ANGGOTA (Fase Calon Ketua)
  // ---------------------------------------------------------
  const startRowTitle2 = sheet.lastRow!.number + 1

  sheet.mergeCells(`A${startRowTitle2}:E${startRowTitle2}`)
  const titleCell2 = sheet.getCell(`A${startRowTitle2}`)
  titleCell2.value = `REKAP DATA DAFTAR HADIR ANGGOTA CALON KETUA`
  titleCell2.font = { bold: true, size: 14, color: { argb: 'FFFFFF' } }
  titleCell2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '064E3B' } }
  titleCell2.alignment = { horizontal: 'center', vertical: 'middle' }
  sheet.getRow(startRowTitle2).height = 40

  const headerRow2 = sheet.addRow(['NO', 'NIPP', 'NAMA ANGGOTA', 'STATUS', 'TANGGAL & WAKTU COBLOS'])
  headerRow2.height = 25
  headerRow2.eachCell((cell) => {
    cell.font = { bold: true, size: 11, color: { argb: 'FFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } } 
    applyBordersAndAlign(cell, { horizontal: 'center', vertical: 'middle' })
  })

  members.forEach((m, i) => {
    const sudahMemilih = m.sudahMemilihCalonKetua
    const waktuRaw = m.waktuCoblosCalonKetua
    const statusText = sudahMemilih ? 'SUDAH MEMILIH' : 'BELUM MEMILIH'
    
    let tanggalText = '-'
    if (sudahMemilih && waktuRaw) {
      try {
        const d = new Date(waktuRaw)
        const day = String(d.getDate()).padStart(2, '0')
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const year = d.getFullYear()
        const hours = String(d.getHours()).padStart(2, '0')
        const minutes = String(d.getMinutes()).padStart(2, '0')
        tanggalText = `${day}-${month}-${year} ${hours}:${minutes} WIB`
      } catch (e) {
        tanggalText = '-'
      }
    }

    const row = sheet.addRow([i + 1, m.nipp, m.nama.toUpperCase(), statusText, tanggalText])
    row.height = 20

    row.eachCell((cell, colNumber) => {
      applyBordersAndAlign(cell, { horizontal: colNumber === 3 ? 'left' : 'center', vertical: 'middle' })
      if (colNumber === 4) {
        cell.font = { bold: true, size: 10, color: { argb: sudahMemilih ? '047857' : 'B91C1C' } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sudahMemilih ? 'E6F4EA' : 'FCE8E6' } }
      }
    })
  })

  const buffer = await workbook.xlsx.writeBuffer()
  saveAs(new Blob([buffer]), `Berita_Acara_Hasil_Pengumuman.xlsx`)
}

// Helper Hitung Total Intern
function totalSuaraSum(arr: any[]) {
  return arr.reduce((acc, curr) => acc + curr.totalSuara, 0)
}