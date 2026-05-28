'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Swal from 'sweetalert2'
import { getRadarDashboard } from '@/app/actions'

export default function Dashboard() {
  const [bulan, setBulan] = useState(new Date().getMonth())
  const [tahun, setTahun] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)

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
  const daftarTahun = [2024, 2025, 2026, 2027, 2028, 2029, 2030]

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
          listTotal.push(item) // Masuk ke total semua
          
          if (d < batasBulanIni) {
            listTunggakan.push(item) // Jatuh tempo di masa lalu = Tunggakan
          } else if (d >= batasBulanIni && d < batasBulanDepan) {
            listTagihan.push(item) // Jatuh tempo di bulan ini = Tagihan Aktif
          }
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
          
          if (d < batasBulanIni) {
            listTunggakan.push(item)
          } else if (d >= batasBulanIni && d < batasBulanDepan) {
            listTagihan.push(item)
          }
        }
      })

      // 2. ANALISIS TRANSAKSI (ARUS KAS)
      res.tx.forEach((t: any) => {
        const txDate = new Date(t.waktu_transaksi)
        if (txDate.getMonth() === bulan && txDate.getFullYear() === tahun) {
          const nominal = Number(t.nominal)
          logRiwayat.push(t)

          if (t.kategori?.tipe === 'PEMASUKAN') masukBulan += nominal
          if (t.kategori?.tipe === 'PENGELUARAN') keluarBulan += nominal
        }
      })

      // Hitung total dari masing-masing list
      const totalAll = listTotal.reduce((acc, curr) => acc + curr.beban, 0)
      const totalTunggak = listTunggakan.reduce((acc, curr) => acc + curr.beban, 0)
      const totalTagih = listTagihan.reduce((acc, curr) => acc + curr.beban, 0)

      // Sorting list berdasarkan waktu terdekat
      const sortTempo = (a: any, b: any) => a.tempo.getTime() - b.tempo.getTime()

      setData({
        totalUtangHidup: totalAll,
        listTotalUtang: listTotal.sort(sortTempo),
        totalTunggakan: totalTunggak,
        listTunggakan: listTunggakan.sort(sortTempo),
        targetBulanIni: totalTagih,
        listTagihan: listTagihan.sort(sortTempo),
        pemasukanBulanIni: masukBulan,
        pengeluaranBulanIni: keluarBulan,
        riwayatBulanIni: logRiwayat.sort((a, b) => new Date(b.waktu_transaksi).getTime() - new Date(a.waktu_transaksi).getTime()).slice(0, 10)
      })
      setLoading(false)
    } catch (error) { window.location.href = '/' }
  }

  useEffect(() => { loadData() }, [bulan, tahun])

  // FUNGSI POPUP DETAIL LIST
  const showDetailPopup = (title: string, list: any[]) => {
    let htmlContent = ''
    
    if (list.length === 0) {
      htmlContent = `<div class="py-10 text-center"><p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">TIDAK ADA DATA</p></div>`
    } else {
      const listItems = list.map(item => `
        <div class="flex justify-between items-center p-3 border-b border-gray-200 last:border-b-0 bg-[#F5F5F7] rounded-xl mb-2">
          <div class="flex flex-col text-left w-2/3">
            <span class="font-bold text-[11px] text-[#1D1D1F] uppercase truncate">${item.nama}</span>
            <span class="text-[8px] font-bold text-gray-500 uppercase mt-0.5 tracking-widest">${item.desc}</span>
            <span class="text-[8px] font-bold text-red-500 uppercase mt-0.5 tracking-widest">TEMPO: ${item.tempo.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>
          <span class="font-black text-[12px] text-[#1D1D1F] text-right w-1/3">${formatRupiah(item.beban)}</span>
        </div>
      `).join('')
      
      htmlContent = `<div class="flex flex-col mt-3 max-h-[50vh] overflow-y-auto pr-1">${listItems}</div>`
    }

    Swal.fire({
      title: title,
      html: htmlContent,
      showConfirmButton: true,
      confirmButtonText: 'TUTUP',
      buttonsStyling: false,
      customClass: {
        popup: '!max-w-[400px] !rounded-[2rem] border border-gray-200 shadow-2xl bg-white p-5',
        title: 'text-[#1D1D1F] font-black uppercase text-[12px] tracking-widest mb-2 border-b border-gray-200 pb-3',
        actions: 'w-full flex mt-4',
        confirmButton: 'w-full h-10 flex items-center justify-center bg-[#1D1D1F] text-white font-bold text-[10px] tracking-[0.15em] uppercase px-5 rounded-xl shadow-sm hover:bg-black active:scale-95 transition-all'
      }
    })
  }

  return (
    <main className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] flex flex-col font-sans pb-20 selection:bg-blue-200 overflow-x-hidden items-center">
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shine-glossy { 0% { transform: translateX(-100%) skewX(-20deg); } 100% { transform: translateX(200%) skewX(-20deg); } }
        /* Scrollbar custom untuk modal */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
      `}} />

      {/* HEADER SLIM GLOSSY */}
      <header className="sticky top-0 z-50 w-full h-[68px] rounded-b-[2.5rem] bg-gradient-to-br from-[#0B214A] via-[#1E3A8A] to-[#0B214A] shadow-[0_10px_30px_rgba(30,58,138,0.3)] border-b border-blue-300/40 overflow-hidden flex flex-col items-center justify-center pt-1">
        <div className="absolute top-0 h-full w-[50%] bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shine-glossy_4s_infinite]"></div>
        <div className="w-full max-w-xl relative flex flex-col items-center justify-center px-4">
          <Link href="/" className="absolute top-1/2 -translate-y-1/2 left-4 w-8 h-8 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 hover:bg-white/20 active:scale-95 transition-all z-10">
            <svg className="w-4 h-4 text-white pr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
          </Link>
          <h1 className="text-white font-black text-[17px] tracking-[0.4em] uppercase drop-shadow-md z-10 leading-none">RADAR REKAP</h1>
        </div>
      </header>

      {/* KONTROL FILTER BULAN & TAHUN */}
      <div className="w-full max-w-xl px-4 mt-6 flex gap-2 relative z-40">
        <select 
          value={bulan} onChange={(e) => setBulan(Number(e.target.value))}
          className="flex-1 h-10 bg-white border border-gray-200 rounded-xl text-center font-black text-[11px] text-[#1D1D1F] outline-none focus:border-blue-400 shadow-sm uppercase tracking-widest cursor-pointer"
        >
          {namaBulan.map((nama, i) => <option key={i} value={i}>{nama}</option>)}
        </select>
        <select 
          value={tahun} onChange={(e) => setTahun(Number(e.target.value))}
          className="w-24 h-10 bg-white border border-gray-200 rounded-xl text-center font-black text-[11px] text-[#1D1D1F] outline-none focus:border-blue-400 shadow-sm uppercase tracking-widest cursor-pointer"
        >
          {daftarTahun.map((t, i) => <option key={i} value={t}>{t}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 mt-20">
          <div className="w-8 h-8 border-[3px] border-[#F5F5F7] border-t-[#0B214A] rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="w-full max-w-xl px-4 mt-4 flex flex-col gap-4">
          
          {/* PAPAN 1: TOTAL SEMUA HUTANG */}
          <div 
            onClick={() => showDetailPopup('RINCIAN SEMUA UTANG (ALL-TIME)', data.listTotalUtang)}
            className="bg-[#1D1D1F] border border-gray-800 p-5 rounded-[1.5rem] shadow-2xl flex flex-col relative overflow-hidden cursor-pointer active:scale-95 transition-all group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-white/10 transition-colors"></div>
            <div className="flex justify-between items-center z-10 mb-1">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">TOTAL SEMUA UTANG</p>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tighter z-10">{formatRupiah(data.totalUtangHidup)}</h2>
          </div>

          {/* GRID: TUNGGAKAN & TAGIHAN BULAN INI */}
          <div className="grid grid-cols-2 gap-3 w-full mt-1">
            {/* KOTAK TUNGGAKAN */}
            <div 
              onClick={() => showDetailPopup('DAFTAR TUNGGAKAN TERLEWAT', data.listTunggakan)}
              className="bg-red-50 border border-red-200 rounded-[1.2rem] p-4 shadow-sm flex flex-col justify-center cursor-pointer active:scale-95 transition-all hover:bg-red-100"
            >
              <div className="flex justify-between items-center mb-1">
                <p className="text-[9px] font-black text-red-600 uppercase tracking-[0.1em]">TUNGGAKAN</p>
                <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
              </div>
              <p className="font-black text-[14px] text-red-600 tracking-tight">{formatRupiah(data.totalTunggakan)}</p>
            </div>

            {/* KOTAK TAGIHAN */}
            <div 
              onClick={() => showDetailPopup(`TAGIHAN BULAN ${namaBulan[bulan]}`, data.listTagihan)}
              className="bg-white border border-gray-200 rounded-[1.2rem] p-4 shadow-sm flex flex-col justify-center cursor-pointer active:scale-95 transition-all hover:bg-gray-50"
            >
              <div className="flex justify-between items-center mb-1">
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.1em]">TAGIHAN</p>
                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
              </div>
              <p className="font-black text-[14px] text-[#1D1D1F] tracking-tight">{formatRupiah(data.targetBulanIni)}</p>
            </div>
          </div>

          {/* GRID REKAPITULASI ARUS KAS (KOMPAK) */}
          <div className="grid grid-cols-2 gap-3 w-full">
            <div className="bg-white border border-green-200 rounded-[1.2rem] p-4 shadow-sm flex flex-col justify-center">
              <p className="text-[9px] font-black text-green-600 uppercase tracking-[0.1em] mb-1">PEMASUKAN</p>
              <p className="font-black text-[13px] text-[#1D1D1F] tracking-tight">{formatRupiah(data.pemasukanBulanIni)}</p>
            </div>
            <div className="bg-white border border-orange-200 rounded-[1.2rem] p-4 shadow-sm flex flex-col justify-center">
              <p className="text-[9px] font-black text-orange-600 uppercase tracking-[0.1em] mb-1">PENGELUARAN</p>
              <p className="font-black text-[13px] text-[#1D1D1F] tracking-tight">{formatRupiah(data.pengeluaranBulanIni)}</p>
            </div>
          </div>

          {/* LOG TRANSAKSI (RAPET & PADET) */}
          <div className="flex flex-col gap-1.5 mt-2">
            <h2 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 mb-1 border-b border-gray-200 pb-1">RIWAYAT TRANSAKSI ({namaBulan[bulan]})</h2>
            
            <div className="bg-white border border-gray-200 rounded-[1.2rem] shadow-sm overflow-hidden flex flex-col">
              {data.riwayatBulanIni.length === 0 ? (
                <p className="text-[9px] font-bold tracking-[0.2em] text-gray-400 text-center py-6 uppercase">TIDAK ADA TRANSAKSI</p>
              ) : (
                data.riwayatBulanIni.map((tx, i) => {
                  let displayName = tx.kategori?.nama_kategori || 'TANPA KATEGORI'
                  if (displayName === 'CICILAN BANK') displayName = 'CICILAN'
                  if (displayName === 'BAYAR UTANG PRIBADI') displayName = 'PERORANGAN'

                  const isMasuk = tx.kategori?.tipe === 'PEMASUKAN'

                  return (
                    <div key={i} className="flex justify-between items-center px-4 py-2.5 border-b border-gray-100 last:border-b-0">
                      <div className="flex flex-col">
                        <span className="font-bold text-[11px] text-[#1D1D1F] uppercase tracking-tight">{displayName}</span>
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.1em] mt-0.5 truncate max-w-[150px]">
                          {new Date(tx.waktu_transaksi).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} | {tx.catatan || '-'}
                        </span>
                      </div>
                      <span className={`font-bold text-[12px] tracking-tight ${isMasuk ? 'text-green-600' : 'text-[#1D1D1F]'}`}>
                        {isMasuk ? '+' : '-'}{formatRupiah(Number(tx.nominal))}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>

        </div>
      )}
    </main>
  )
}