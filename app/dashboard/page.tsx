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

      // MESIN PEMISAH ALL-TIME VS BULAN INI
      res.tx.forEach((t: any) => {
        const nominal = Number(t.nominal)
        const isPemasukan = t.kategori?.tipe === 'PEMASUKAN'
        const isPengeluaran = t.kategori?.tipe === 'PENGELUARAN'

        // 1. Hitung All-Time untuk Saldo Aktif
        if (isPemasukan) masukTotal += nominal
        if (isPengeluaran) keluarTotal += nominal

        // 2. Hitung khusus Bulan Ini untuk Radar Grid
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

  const baseSwalClass = { popup: '!rounded-[1.5rem] !p-5 !border !border-gray-200 !shadow-2xl', title: 'text-[13px] font-bold text-[#1D1D1F] uppercase', confirmButton: '!bg-gradient-to-br !from-[#1D1D1F] !to-[#4B5563] !text-white !font-bold !text-[10px] !px-5 !py-3 !rounded-xl !uppercase w-full hover:!shadow-lg active:!scale-95 transition-all', cancelButton: '!bg-white !text-gray-500 !border !border-gray-200 !font-bold !text-[10px] !px-5 !py-3 !rounded-xl !uppercase w-full hover:!bg-gray-50 active:!scale-95 transition-all', actions: 'flex gap-3 mt-4 w-full' }

  const handleLogout = async () => {
    const res = await Swal.fire({ title: 'KUNCI BRANKAS?', showCancelButton: true, confirmButtonText: 'KUNCI', cancelButtonText: 'BATAL', customClass: baseSwalClass, buttonsStyling: false })
    if (res.isConfirmed) { setLoading(true); await logoutPemilik(); window.location.href = '/' }
  }

  const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka)

  if (loading) return (
    <div className="min-h-screen bg-[#FBFBFD] flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-[3px] border-[#F5F5F7] border-t-[#1D1D1F] rounded-full animate-spin"></div>
      <p className="font-bold text-[10px] text-gray-500 uppercase animate-pulse tracking-widest">MENGHIMPUN DATA...</p>
    </div>
  )

  return (
    <main className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] flex flex-col font-sans pb-10 selection:bg-gray-200 overflow-x-hidden">
      
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 px-5 py-4 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="font-bold text-[15px] uppercase tracking-wider">RADAR ANALITIK</h1>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">RINGKASAN FINANSIAL</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.push('/')} className="h-8 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-[#1D1D1F] font-bold text-[9px] uppercase rounded-full transition-all active:scale-95 shadow-sm">
            MENU
          </button>
          <button onClick={handleLogout} className="h-8 px-4 bg-[#1D1D1F] text-white font-bold text-[9px] uppercase rounded-full transition-all active:scale-95 shadow-sm">
            LOCK
          </button>
        </div>
      </header>

      <div className="w-full max-w-2xl mx-auto px-5 mt-6 flex flex-col gap-4">
        
        {/* KARTU SALDO UTAMA (ALL-TIME) */}
        <div className="bg-gradient-to-br from-[#1D1D1F] to-[#374151] text-white rounded-[1.5rem] p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 relative z-10">SALDO AKTIF BERSIH</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight relative z-10">{formatRupiah(data.saldo)}</h2>
        </div>

        {/* GRID ANALITIK (KHUSUS BULAN INI & TUNGGAKAN) */}
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="bg-white border border-green-100 rounded-[1.2rem] p-4 shadow-sm flex flex-col justify-center relative overflow-hidden">
            <div className="flex justify-between items-start mb-1">
              <p className="text-[9px] font-bold text-green-600 uppercase tracking-widest">PEMASUKAN</p>
              <span className="text-[7px] font-bold bg-green-50 text-green-600 px-1.5 py-0.5 rounded border border-green-200 uppercase">{data.namaBulan}</span>
            </div>
            <p className="font-bold text-[13px] text-[#1D1D1F]">{formatRupiah(data.pemasukanBulanIni)}</p>
          </div>
          
          <div className="bg-white border border-red-100 rounded-[1.2rem] p-4 shadow-sm flex flex-col justify-center relative overflow-hidden">
            <div className="flex justify-between items-start mb-1">
              <p className="text-[9px] font-bold text-red-600 uppercase tracking-widest">PENGELUARAN</p>
              <span className="text-[7px] font-bold bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-200 uppercase">{data.namaBulan}</span>
            </div>
            <p className="font-bold text-[13px] text-[#1D1D1F]">{formatRupiah(data.pengeluaranBulanIni)}</p>
          </div>

          <div className="bg-white border border-yellow-100 rounded-[1.2rem] p-4 shadow-sm flex flex-col justify-center">
            <p className="text-[9px] font-bold text-yellow-600 uppercase tracking-widest mb-1">TUNGGAKAN CICILAN</p>
            <p className="font-bold text-[13px] text-[#1D1D1F]">{formatRupiah(data.tunggakan)}</p>
          </div>
          
          <div className="bg-white border border-purple-100 rounded-[1.2rem] p-4 shadow-sm flex flex-col justify-center">
            <p className="text-[9px] font-bold text-purple-600 uppercase tracking-widest mb-1">UTANG PERORANGAN</p>
            <p className="font-bold text-[13px] text-[#1D1D1F]">{formatRupiah(data.utang)}</p>
          </div>
        </div>

      </div>
    </main>
  )
}