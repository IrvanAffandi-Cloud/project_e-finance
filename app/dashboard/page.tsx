'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Swal from 'sweetalert2'
import { getRadarDashboard } from '@/app/actions'

export default function Dashboard() {
  const [bulan, setBulan] = useState(new Date().getMonth())
  const [tahun, setTahun] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)

  // LOGIKA TAHUN DINAMIS (Otomatis 2 tahun lalu sampai 7 tahun ke depan)
  const tahunSekarang = new Date().getFullYear()
  const daftarTahun = Array.from({ length: 21 }, (_, i) => tahunSekarang - 10 + i)

  const [data, setData] = useState({
    totalUtangHidup: 0,
    listTotalUtang: [] as any[],
    targetBulanIni: 0,
    listTagihan: [] as any[],
    totalTunggakan: 0,
    listTunggakan: [] as any[],
    pemasukanBulanIni: 0,
    pengeluaranBulanIni: 0,
    riwayatBulanIni: [] as any[]
  })

  const namaBulan = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"]

  const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka)

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getRadarDashboard()
      
      const batasBulanIni = new Date(tahun, bulan, 1)
      const batasBulanDepan = new Date(tahun, bulan + 1, 1) 

      const listTotal: any[] = []
      const listTunggakan: any[] = []
      const listTagihan: any[] = []

      let masukBulan = 0
      let keluarBulan = 0
      const logRiwayat: any[] = []

      // 1. ANALISIS KIAMAT (UTANG & CICILAN)
      res.cicilan.forEach((c: any) => {
        const d = new Date(c.tanggal_jatuh_tempo)
        const beban = (c.cicilan_master?.cicilan_wajib_per_bulan || 0) - Number(c.nominal_dibayar)
        
        if (beban > 0) {
          const item = { 
            nama: c.cicilan_master?.nama_kreditur, 
            beban, 
            tempo: d, 
            desc: `BLN KE-${c.bulan_ke} (CICILAN)` 
          }
          listTotal.push(item)
          
          if (d < batasBulanIni) listTunggakan.push(item)
          else if (d >= batasBulanIni && d < batasBulanDepan) listTagihan.push(item)
        }
      })
      
      res.utang.forEach((u: any) => {
        const d = new Date(u.tanggal_jatuh_tempo)
        const beban = Number(u.sisa_utang)
        
        if (beban > 0) {
          const item = { 
            nama: u.nama_kreditur, 
            beban, 
            tempo: d, 
            desc: 'UTANG PERORANGAN' 
          }
          listTotal.push(item)
          
          if (d < batasBulanIni) listTunggakan.push(item)
          else if (d >= batasBulanIni && d < batasBulanDepan) listTagihan.push(item)
        }
      })

      // 2. ANALISIS TRANSAKSI
      res.tx.forEach((t: any) => {
        const txDate = new Date(t.waktu_transaksi)
        if (txDate.getMonth() === bulan && txDate.getFullYear() === tahun) {
          const nominal = Number(t.nominal)
          logRiwayat.push(t)

          if (t.kategori?.tipe === 'PEMASUKAN') masukBulan += nominal
          if (t.kategori?.tipe === 'PENGELUARAN') keluarBulan += nominal
        }
      })

      setData({
        totalUtangHidup: listTotal.reduce((acc, curr) => acc + curr.beban, 0),
        listTotalUtang: listTotal.sort((a,b) => a.tempo - b.tempo),
        totalTunggakan: listTunggakan.reduce((acc, curr) => acc + curr.beban, 0),
        listTunggakan: listTunggakan.sort((a,b) => a.tempo - b.tempo),
        targetBulanIni: listTagihan.reduce((acc, curr) => acc + curr.beban, 0),
        listTagihan: listTagihan.sort((a,b) => a.tempo - b.tempo),
        pemasukanBulanIni: masukBulan,
        pengeluaranBulanIni: keluarBulan,
        riwayatBulanIni: logRiwayat.sort((a, b) => new Date(b.waktu_transaksi).getTime() - new Date(a.waktu_transaksi).getTime()).slice(0, 5)
      })
      setLoading(false)
    } catch (error) { window.location.href = '/' }
  }

  useEffect(() => { loadData() }, [bulan, tahun])

  const showDetailPopup = (title: string, list: any[]) => {
    Swal.fire({
      title: title,
      html: list.length === 0 ? `<div class="py-10 text-center"><p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">BERSIH</p></div>` :
        `<div class="flex flex-col mt-3 max-h-[50vh] overflow-y-auto pr-1">
          ${list.map(item => `
            <div class="flex justify-between items-center p-3 border-b border-gray-200 last:border-b-0 bg-[#F5F5F7] rounded-xl mb-2">
              <div class="flex flex-col text-left w-2/3">
                <span class="font-bold text-[11px] text-[#1D1D1F] uppercase truncate">${item.nama}</span>
                <span class="text-[8px] font-bold text-gray-500 uppercase tracking-widest">${item.desc}</span>
                <span class="text-[8px] font-bold text-red-500 uppercase tracking-widest">TEMPO: ${item.tempo.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>
              <span class="font-black text-[12px] text-[#1D1D1F] text-right w-1/3">${formatRupiah(item.beban)}</span>
            </div>
          `).join('')}
        </div>`,
      confirmButtonText: 'TUTUP',
      customClass: {
        popup: '!max-w-[400px] !rounded-[2rem] border border-gray-200 shadow-2xl bg-white p-5',
        title: 'text-[#1D1D1F] font-black uppercase text-[12px] tracking-widest mb-2 border-b border-gray-200 pb-3',
        confirmButton: 'w-full h-10 flex items-center justify-center bg-[#1D1D1F] text-white font-bold text-[10px] uppercase rounded-xl'
      }
    })
  }

  return (
    <main className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] flex flex-col items-center pb-20 font-sans">
      <header className="sticky top-0 z-50 w-full h-[68px] bg-white border-b border-gray-100 flex items-center justify-center px-4">
        <Link href="/" className="absolute left-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-black">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
        </Link>
        <h1 className="font-black text-[12px] tracking-widest uppercase">DASHBOARD</h1>
      </header>

      <div className="w-full max-w-xl px-4 mt-6 flex flex-col gap-4">
        <div onClick={() => showDetailPopup('DAFTAR SEMUA UTANG', data.listTotalUtang)} className="bg-[#1D1D1F] text-white p-6 rounded-[1.5rem] shadow-xl cursor-pointer">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">TOTAL SEMUA UTANG</p>
          <h2 className="text-3xl font-black mt-1">{formatRupiah(data.totalUtangHidup)}</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div onClick={() => showDetailPopup('DAFTAR TUNGGAKAN', data.listTunggakan)} className="bg-red-50 border border-red-100 p-4 rounded-[1.2rem] cursor-pointer">
            <p className="text-[9px] font-black text-red-600 uppercase tracking-[0.1em]">TUNGGAKAN</p>
            <p className="font-black text-[13px] mt-1">{formatRupiah(data.totalTunggakan)}</p>
          </div>
          <div onClick={() => showDetailPopup('TAGIHAN BULAN INI', data.listTagihan)} className="bg-white border border-gray-200 p-4 rounded-[1.2rem] cursor-pointer">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.1em]">TAGIHAN INI</p>
            <p className="font-black text-[13px] mt-1">{formatRupiah(data.targetBulanIni)}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <select value={bulan} onChange={(e) => setBulan(Number(e.target.value))} className="flex-1 h-10 bg-white border border-gray-200 rounded-[1rem] text-center font-black text-[10px] uppercase tracking-widest outline-none">
            {namaBulan.map((n, i) => <option key={i} value={i}>{n}</option>)}
          </select>
          <select value={tahun} onChange={(e) => setTahun(Number(e.target.value))} className="w-24 h-10 bg-white border border-gray-200 rounded-[1rem] text-center font-black text-[10px] uppercase tracking-widest outline-none">
            {daftarTahun.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <Link href="/pembayaran" className="w-full h-12 bg-blue-600 text-white font-black text-[10px] uppercase rounded-[1rem] flex items-center justify-center shadow-lg active:scale-95 transition-all tracking-widest">
          PUSAT TAGIHAN
        </Link>
      </div>
    </main>
  )
}