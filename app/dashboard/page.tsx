'use client'
import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import { useRouter } from 'next/navigation'
import { getRadarDashboard, logoutPemilik } from '@/app/actions'

export default function Dashboard() {
  const router = useRouter()
  const [data, setData] = useState({
    saldo: 0,
    targetDana: 0,
    sisaSurplus: 0,
    topTagihan: [] as any[],
    namaBulan: ''
  })
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const res = await getRadarDashboard()
      
      const today = new Date()
      const currMonth = today.getMonth()
      const currYear = today.getFullYear()
      const namaBulanStr = today.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }).toUpperCase()

      // 1. HITUNG SALDO AKTIF
      let masukTotal = 0
      let keluarTotal = 0
      res.tx.forEach((t: any) => {
        const nominal = Number(t.nominal)
        if (t.kategori?.tipe === 'PEMASUKAN') masukTotal += nominal
        if (t.kategori?.tipe === 'PENGELUARAN') keluarTotal += nominal
      })
      const saldoAktif = masukTotal - keluarTotal

      // 2. KUMPULKAN SEMUA ANCAMAN (CICILAN & UTANG)
      const semuaTagihan: any[] = []
      
      res.cicilan.forEach((c: any) => {
        const beban = (c.cicilan_master?.cicilan_wajib_per_bulan || 0) - Number(c.nominal_dibayar)
        if (beban > 0) semuaTagihan.push({ nama: c.cicilan_master?.nama_kreditur, beban, tempo: new Date(c.tanggal_jatuh_tempo), tipe: 'CICILAN BANK' })
      })
      
      res.utang.forEach((u: any) => {
        if (Number(u.sisa_utang) > 0) semuaTagihan.push({ nama: u.nama_kreditur, beban: Number(u.sisa_utang), tempo: new Date(u.tanggal_jatuh_tempo), tipe: 'UTANG PRIBADI' })
      })

      // 3. SARING TARGET BULAN INI (TUNGGAKAN + BULAN INI)
      const awalBulanDepan = new Date(currYear, currMonth + 1, 1)
      const targetBulanIni = semuaTagihan.filter(t => t.tempo < awalBulanDepan)
      
      const totalTarget = targetBulanIni.reduce((acc, curr) => acc + curr.beban, 0)
      const sisaSurplus = saldoAktif - totalTarget

      // 4. AMBIL TOP 5 TAGIHAN PALING MENDESAK
      const top5 = targetBulanIni.sort((a, b) => a.tempo.getTime() - b.tempo.getTime()).slice(0, 5)

      setData({
        saldo: saldoAktif,
        targetDana: totalTarget,
        sisaSurplus: sisaSurplus,
        topTagihan: top5,
        namaBulan: namaBulanStr
      })
      setLoading(false)
    } catch (error) {
      window.location.href = '/'
    }
  }

  useEffect(() => { loadData() }, [])

  // SIPEKAT SWEETALERT STYLE
  const baseSwalClass = {
    popup: '!max-w-[380px] !rounded-[2rem] border border-gray-200 shadow-2xl bg-white p-6',
    title: 'text-[#1D1D1F] font-black uppercase text-[12px] tracking-widest mb-4',
    actions: 'w-full flex flex-col gap-2 mt-5',
    confirmButton: 'w-full h-10 flex items-center justify-center bg-red-600 text-white font-black text-[10px] tracking-[0.15em] uppercase px-5 rounded-xl shadow-sm hover:bg-red-700 active:scale-95 transition-all duration-200',
    cancelButton: 'w-full h-10 flex items-center justify-center bg-[#F5F5F7] border border-transparent text-gray-500 font-black text-[10px] tracking-[0.15em] uppercase px-5 rounded-xl hover:bg-gray-200 active:scale-95 transition-all duration-200'
  }

  const handleLogout = async () => {
    const res = await Swal.fire({ title: 'KUNCI BRANKAS?', showCancelButton: true, confirmButtonText: 'KUNCI SEKARANG', cancelButtonText: 'BATAL', customClass: baseSwalClass, buttonsStyling: false })
    if (res.isConfirmed) { setLoading(true); await logoutPemilik(); window.location.href = '/' }
  }

  const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka)

  if (loading) return (
    <div className="min-h-screen bg-[#FBFBFD] flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-[3px] border-[#F5F5F7] border-t-[#0B214A] rounded-full animate-spin"></div>
      <p className="font-black text-[9px] text-[#0B214A] uppercase tracking-[0.2em] animate-pulse">MENARIK DATA KIAMAT...</p>
    </div>
  )

  const isBangkrut = data.sisaSurplus < 0

  return (
    <main className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] flex flex-col font-sans pb-10 selection:bg-blue-200 overflow-x-hidden items-center">
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shine-glossy { 0% { transform: translateX(-100%) skewX(-20deg); } 100% { transform: translateX(200%) skewX(-20deg); } }
      `}} />

      {/* HEADER SLIM GLOSSY SIPEKAT */}
      <header className="sticky top-0 z-50 w-full h-[68px] rounded-b-[2.5rem] bg-gradient-to-br from-[#0B214A] via-[#1E3A8A] to-[#0B214A] shadow-[0_10px_30px_rgba(30,58,138,0.3)] border-b border-blue-300/40 overflow-hidden flex flex-col items-center justify-center pt-1">
        <div className="absolute top-0 h-full w-[50%] bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shine-glossy_4s_infinite]"></div>
        
        <div className="w-full max-w-xl relative flex flex-col items-center justify-center px-4">
          <div className="absolute top-1/2 -translate-y-1/2 right-4 flex gap-1.5 z-40">
            <button onClick={() => router.push('/')} className="bg-white/10 backdrop-blur-md border border-white/20 text-white font-black text-[7px] px-3 py-2 rounded-lg uppercase tracking-[0.2em] hover:bg-white/20 transition-all shadow-sm">
              MENU
            </button>
            <button onClick={handleLogout} className="bg-red-500/80 backdrop-blur-md border border-red-400/50 text-white font-black text-[7px] px-3 py-2 rounded-lg uppercase tracking-[0.2em] hover:bg-red-600 transition-all shadow-sm">
              LOCK
            </button>
          </div>
          
          <h1 className="text-white font-black text-[13px] tracking-[0.4em] uppercase drop-shadow-md z-10 leading-none">RADAR ANALITIK</h1>
          <p className="text-blue-200 text-[8px] font-black tracking-[0.3em] uppercase opacity-90 mt-1 z-10 leading-none">TARGET {data.namaBulan}</p>
        </div>
      </header>

      <div className="w-full max-w-xl px-4 mt-8 flex flex-col gap-4 items-center">
        
        {/* REAKTOR SALDO VS TARGET */}
        <div className="w-full bg-[#1D1D1F] rounded-[1.5rem] p-5 shadow-2xl border border-gray-800 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
          
          <div className="flex justify-between items-end border-b border-gray-800 pb-4 mb-4 relative z-10">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] mb-1">SALDO AKTIF</span>
              <span className="text-xl font-black text-white tracking-tight">{formatRupiah(data.saldo)}</span>
            </div>
            <div className="flex flex-col items-end text-right">
              <span className="text-[9px] font-black text-red-500 uppercase tracking-[0.3em] mb-1">WAJIB BAYAR BULAN INI</span>
              <span className="text-xl font-black text-red-500 tracking-tight">{formatRupiah(data.targetDana)}</span>
            </div>
          </div>

          {/* STATUS KIAMAT / AMAN */}
          <div className={`relative z-10 p-4 rounded-xl flex flex-col items-center text-center ${isBangkrut ? 'bg-red-500/20 border border-red-500/50' : 'bg-green-500/20 border border-green-500/50'}`}>
            <span className={`text-[9px] font-black uppercase tracking-[0.3em] mb-1 ${isBangkrut ? 'text-red-400' : 'text-green-400'}`}>
              {isBangkrut ? '⚠️ DEFISIT KEUANGAN (KURANG)' : '✅ SURPLUS KEUANGAN (SISA AMAN)'}
            </span>
            <span className={`text-2xl font-black tracking-tighter ${isBangkrut ? 'text-red-500' : 'text-green-500'}`}>
              {formatRupiah(Math.abs(data.sisaSurplus))}
            </span>
          </div>
        </div>

        {/* TOP 5 PENAGIH PRIORITAS */}
        <div className="w-full mt-4 flex flex-col gap-2">
          <div className="flex justify-between items-end ml-1 mb-1 border-b border-gray-200 pb-2">
            <h2 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">TOP 5 TAGIHAN MENDESAK</h2>
          </div>

          <div className="bg-white border border-gray-200 rounded-[1.2rem] shadow-sm overflow-hidden flex flex-col">
            {data.topTagihan.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center bg-green-50/50">
                <span className="text-2xl mb-2">🎉</span>
                <p className="text-[10px] font-black tracking-[0.2em] text-green-600 uppercase">BERSIH! TIDAK ADA TAGIHAN</p>
              </div>
            ) : (
              data.topTagihan.map((t, idx) => {
                const isTunggakan = t.tempo < new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                return (
                  <div key={idx} className={`flex justify-between items-center px-4 py-3 border-b border-gray-100 last:border-b-0 ${isTunggakan ? 'bg-red-50/30' : 'bg-white'}`}>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-[11px] text-[#1D1D1F] uppercase tracking-tight truncate max-w-[140px]">{t.nama}</span>
                        {isTunggakan && <span className="text-[6px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded border border-red-200 uppercase tracking-widest animate-pulse">TELAT</span>}
                      </div>
                      <span className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.1em] mt-0.5">
                        {t.tipe} | TEMPO: {t.tempo.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                    <span className="font-black text-[12px] text-red-600 tracking-tight">{formatRupiah(t.beban)}</span>
                  </div>
                )
              })
            )}
          </div>

          <button onClick={() => router.push('/pembayaran')} className="w-full mt-2 h-12 bg-[#0B214A] text-white font-black text-[10px] uppercase rounded-xl shadow-md hover:bg-blue-900 active:scale-95 transition-all tracking-[0.15em] border border-blue-400/20 flex items-center justify-center gap-2">
            BUKA PUSAT TAGIHAN
            <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
          </button>
        </div>

      </div>
    </main>
  )
    }
  
