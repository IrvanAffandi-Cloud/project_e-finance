'use client'
import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import { useRouter } from 'next/navigation'
import { getRadarDashboard, logoutPemilik } from '@/app/actions'

export default function Dashboard() {
  const router = useRouter()
  const [data, setData] = useState({
    saldo: 0,
    pemasukanBulanIni: 0,
    pengeluaranBulanIni: 0,
    tunggakan: 0,
    utang: 0,
    namaBulan: ''
  })
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const res = await getRadarDashboard()
      
      const today = new Date()
      const currMonth = today.getMonth()
      const currYear = today.getFullYear()
      const namaBulanStr = today.toLocaleDateString('id-ID', { month: 'short' }).toUpperCase()

      let masukTotal = 0
      let keluarTotal = 0
      let masukBulanIni = 0
      let keluarBulanIni = 0

      res.tx.forEach((t: any) => {
        const nominal = Number(t.nominal)
        const isPemasukan = t.kategori?.tipe === 'PEMASUKAN'
        const isPengeluaran = t.kategori?.tipe === 'PENGELUARAN'

        if (isPemasukan) masukTotal += nominal
        if (isPengeluaran) keluarTotal += nominal

        const txDate = new Date(t.waktu_transaksi)
        if (txDate.getMonth() === currMonth && txDate.getFullYear() === currYear) {
          if (isPemasukan) masukBulanIni += nominal
          if (isPengeluaran) keluarBulanIni += nominal
        }
      })
      
      let tunggakanCicilan = 0
      res.cicilan.forEach((c: any) => {
        tunggakanCicilan += (c.cicilan_master?.cicilan_wajib_per_bulan || 0) - Number(c.nominal_dibayar)
      })

      let utangPribadi = 0
      res.utang.forEach((u: any) => {
        utangPribadi += Number(u.sisa_utang)
      })

      setData({
        saldo: masukTotal - keluarTotal,
        pemasukanBulanIni: masukBulanIni,
        pengeluaranBulanIni: keluarBulanIni,
        tunggakan: tunggakanCicilan,
        utang: utangPribadi,
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
      <p className="font-black text-[9px] text-[#0B214A] uppercase tracking-[0.2em] animate-pulse">MENARIK DATA...</p>
    </div>
  )

  return (
    <main className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] flex flex-col font-sans pb-10 selection:bg-blue-200 overflow-x-hidden items-center">
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shine-glossy { 0% { transform: translateX(-100%) skewX(-20deg); } 100% { transform: translateX(200%) skewX(-20deg); } }
      `}} />

      {/* HEADER SLIM GLOSSY SIPEKAT */}
      <header className="sticky top-0 z-50 w-full h-[68px] rounded-b-[2.5rem] bg-gradient-to-br from-[#0B214A] via-[#1E3A8A] to-[#0B214A] shadow-[0_10px_30px_rgba(30,58,138,0.3)] border-b border-blue-300/40 overflow-hidden flex flex-col items-center justify-center pt-1">
        <div className="absolute top-0 h-full w-[50%] bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shine-glossy_4s_infinite]"></div>
        
        <div className="w-full max-w-2xl relative flex flex-col items-center justify-center px-4">
          <div className="absolute top-1/2 -translate-y-1/2 right-4 flex gap-1.5 z-40">
            <button onClick={() => router.push('/')} className="bg-white/10 backdrop-blur-md border border-white/20 text-white font-black text-[7px] px-3 py-2 rounded-lg uppercase tracking-[0.2em] hover:bg-white/20 transition-all shadow-sm">
              MENU
            </button>
            <button onClick={handleLogout} className="bg-red-500/80 backdrop-blur-md border border-red-400/50 text-white font-black text-[7px] px-3 py-2 rounded-lg uppercase tracking-[0.2em] hover:bg-red-600 transition-all shadow-sm">
              LOCK
            </button>
          </div>
          
          <h1 className="text-white font-black text-[13px] tracking-[0.4em] uppercase drop-shadow-md z-10 leading-none">RADAR ANALITIK</h1>
          <p className="text-blue-200 text-[8px] font-black tracking-[0.3em] uppercase opacity-90 mt-1 z-10 leading-none">RINGKASAN FINANSIAL</p>
        </div>
      </header>

      <div className="w-full max-w-2xl px-5 mt-8 flex flex-col gap-4 items-center">
        
        {/* KARTU SALDO UTAMA GLOWING */}
        <div className="relative group w-full max-w-sm">
          <div className="absolute -inset-1 bg-blue-600/40 blur-xl rounded-full opacity-80 group-hover:opacity-100 transition duration-500"></div>
          <div className="relative bg-gradient-to-br from-[#0B214A] to-[#1E3A8A] text-white rounded-[1.5rem] p-6 shadow-2xl border border-blue-400/20 overflow-hidden flex flex-col items-center text-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <p className="text-[9px] font-black text-blue-300 uppercase tracking-[0.3em] mb-1 relative z-10">SALDO AKTIF BERSIH</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter relative z-10">{formatRupiah(data.saldo)}</h2>
          </div>
        </div>

        {/* GRID ANALITIK (INDUSTRIAL COMPACT) */}
        <div className="grid grid-cols-2 gap-3 w-full mt-4">
          
          <div className="bg-white border border-green-200 rounded-[1.2rem] p-4 shadow-sm flex flex-col justify-center relative overflow-hidden group hover:border-green-400 transition-all">
            <div className="flex justify-between items-start mb-1.5">
              <p className="text-[9px] font-black text-green-600 uppercase tracking-[0.1em]">PEMASUKAN</p>
              <span className="text-[7px] font-black bg-green-50 text-green-600 px-1.5 py-0.5 rounded border border-green-200 uppercase tracking-widest">{data.namaBulan}</span>
            </div>
            <p className="font-black text-[13px] text-[#1D1D1F] tracking-tight">{formatRupiah(data.pemasukanBulanIni)}</p>
          </div>
          
          <div className="bg-white border border-red-200 rounded-[1.2rem] p-4 shadow-sm flex flex-col justify-center relative overflow-hidden group hover:border-red-400 transition-all">
            <div className="flex justify-between items-start mb-1.5">
              <p className="text-[9px] font-black text-red-600 uppercase tracking-[0.1em]">PENGELUARAN</p>
              <span className="text-[7px] font-black bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-200 uppercase tracking-widest">{data.namaBulan}</span>
            </div>
            <p className="font-black text-[13px] text-[#1D1D1F] tracking-tight">{formatRupiah(data.pengeluaranBulanIni)}</p>
          </div>

          <div className="bg-white border border-yellow-200 rounded-[1.2rem] p-4 shadow-sm flex flex-col justify-center group hover:border-yellow-400 transition-all">
            <p className="text-[9px] font-black text-yellow-600 uppercase tracking-[0.1em] mb-1.5">TUNGGAKAN CICILAN</p>
            <p className="font-black text-[13px] text-[#1D1D1F] tracking-tight">{formatRupiah(data.tunggakan)}</p>
          </div>
          
          <div className="bg-white border border-purple-200 rounded-[1.2rem] p-4 shadow-sm flex flex-col justify-center group hover:border-purple-400 transition-all">
            <p className="text-[9px] font-black text-purple-600 uppercase tracking-[0.1em] mb-1.5">UTANG PRIBADI</p>
            <p className="font-black text-[13px] text-[#1D1D1F] tracking-tight">{formatRupiah(data.utang)}</p>
          </div>

        </div>
      </div>
    </main>
  )
}