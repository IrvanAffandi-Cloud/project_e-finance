'use client'
import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import Link from 'next/link'
import { getRadarDashboard, logoutPemilik } from '@/app/actions'

export default function Dashboard() {
  const [saldoAktif, setSaldoAktif] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const res = await getRadarDashboard()
      
      let masuk = 0
      let keluar = 0
      res.tx.forEach((t: any) => {
        if (t.kategori?.tipe === 'PEMASUKAN') masuk += Number(t.nominal)
        if (t.kategori?.tipe === 'PENGELUARAN') keluar += Number(t.nominal)
      })
      setSaldoAktif(masuk - keluar)
      setLoading(false)
    } catch (error) {
      window.location.href = '/'
    }
  }

  useEffect(() => { loadData() }, [])

  const handleLogout = async () => {
    const res = await Swal.fire({ 
      title: 'KUNCI BRANKAS?', 
      showCancelButton: true, 
      confirmButtonText: 'KUNCI', 
      cancelButtonText: 'BATAL', 
      customClass: {
        popup: '!rounded-[1.5rem] !p-5 !border !border-gray-200 !shadow-2xl',
        title: 'text-[13px] font-bold text-[#1D1D1F] uppercase',
        confirmButton: '!bg-gradient-to-br !from-[#1D1D1F] !to-[#4B5563] !text-white !font-bold !text-[10px] !px-5 !py-3 !rounded-xl !uppercase w-full hover:!shadow-lg active:!scale-95 transition-all',
        cancelButton: '!bg-white !text-gray-500 !border !border-gray-200 !font-bold !text-[10px] !px-5 !py-3 !rounded-xl !uppercase w-full hover:!bg-gray-50 active:!scale-95 transition-all',
        actions: 'flex gap-3 mt-4 w-full'
      }, 
      buttonsStyling: false 
    })
    if (res.isConfirmed) { setLoading(true); await logoutPemilik(); window.location.href = '/' }
  }

  const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka)

  if (loading) return (
    <div className="min-h-screen bg-[#FBFBFD] flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-[3px] border-[#F5F5F7] border-t-[#1D1D1F] rounded-full animate-spin"></div>
      <p className="font-bold text-[10px] text-gray-500 uppercase animate-pulse tracking-widest">PROCESSING...</p>
    </div>
  )

  return (
    <main className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] flex flex-col font-sans pb-10 selection:bg-gray-200 overflow-x-hidden">
      
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 px-5 py-4 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="font-bold text-[15px] uppercase tracking-wider">DIGITAL FINANCE</h1>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5"></p>
        </div>
        <button onClick={handleLogout} className="h-8 px-4 bg-[#F5F5F7] border border-gray-200 hover:bg-gray-200 text-[#1D1D1F] font-bold text-[9px] uppercase rounded-full transition-all active:scale-95 shadow-sm">
          LOCK
        </button>
      </header>

      <div className="w-full max-w-2xl mx-auto px-5 mt-6 flex flex-col gap-6">
        
        {/* KARTU SALDO UTAMA */}
        <div className="bg-[#1D1D1F] text-white rounded-[1.5rem] p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 relative z-10">SALDO</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight relative z-10">{formatRupiah(saldoAktif)}</h2>
        </div>

        {/* RUANG EKSEKUSI */}
        <div className="flex flex-col gap-3">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">DATABASE CONTROLLER</h3>
          
          {/* PRIORITAS UTAMA: PUSAT TAGIHAN */}
          <Link href="/pembayaran" className="w-full bg-white border border-red-600 rounded-2xl p-4 flex flex-row items-center justify-center gap-3 shadow-sm hover:shadow-md hover:bg-red-50 transition-all active:scale-95">
            <span className="text-2xl">📅</span>
            <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider">TAGIHAN</span>
          </Link>

          {/* NAVIGASI LAINNYA */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/pemasukan" className="bg-white border border-green-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow-md hover:bg-green-50 transition-all active:scale-95">
              <span className="text-2xl">🟢</span>
              <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">PEMASUKAN</span>
            </Link>
            <Link href="/pengeluaran" className="bg-white border border-red-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow-md hover:bg-red-50 transition-all active:scale-95">
              <span className="text-2xl">🔴</span>
              <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider">PENGELUARAN</span>
            </Link>
            <Link href="/cicilan" className="bg-white border border-blue-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow-md hover:bg-blue-50 transition-all active:scale-95">
              <span className="text-2xl">🏦</span>
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">CICILAN</span>
            </Link>
            <Link href="/perorangan" className="bg-white border border-purple-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow-md hover:bg-purple-50 transition-all active:scale-95">
              <span className="text-2xl">🤝</span>
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">PERORANGAN</span>
            </Link>
          </div>
        </div>

      </div>
    </main>
  )
}