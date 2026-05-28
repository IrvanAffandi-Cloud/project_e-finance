'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getRadarDashboard } from '@/app/actions'

export default function PembayaranPage() {
  const [data, setData] = useState<{ tunggakan: any[], bulanIni: any[], bulanDepan: any[] }>({ tunggakan: [], bulanIni: [], bulanDepan: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getRadarDashboard().then(res => {
      const today = new Date()
      const currMonth = today.getMonth()
      const currYear = today.getFullYear()
      const all = [...res.cicilan, ...res.utang].map(t => ({
        ...t, nama: t.nama_kreditur || t.nama, beban: t.cicilan_master ? (t.cicilan_master.cicilan_wajib_per_bulan - t.nominal_dibayar) : Number(t.sisa_utang), tempo: new Date(t.tanggal_jatuh_tempo), tipe: t.cicilan_master ? 'CICILAN BANK' : 'UTANG PRIBADI'
      }))
      setData({
        tunggakan: all.filter(t => t.tempo < new Date(currYear, currMonth, 1)),
        bulanIni: all.filter(t => t.tempo.getMonth() === currMonth && t.tempo.getFullYear() === currYear),
        bulanDepan: all.filter(t => t.tempo.getMonth() === (currMonth + 1) % 12 && t.tempo.getFullYear() === (currMonth === 11 ? currYear + 1 : currYear))
      })
      setLoading(false)
    })
  }, [])

  const formatRupiah = (a: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(a)

  if (loading) return <div className="min-h-screen bg-[#FBFBFD] flex items-center justify-center"><div className="w-8 h-8 border-[3px] border-red-600 border-t-transparent rounded-full animate-spin"></div></div>

  return (
    <main className="min-h-screen bg-[#FBFBFD] px-5 pt-6 pb-20 font-sans text-[#1D1D1F]">
      <header className="w-full max-w-md mx-auto flex justify-between items-center mb-6">
        <div><h1 className="font-bold text-[16px] text-red-600 uppercase tracking-wider">PUSAT TAGIHAN</h1><p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">RADAR JATUH TEMPO</p></div>
        <Link href="/" className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-[10px] font-bold shadow-sm hover:bg-gray-50">KEMBALI</Link>
      </header>
      <div className="w-full max-w-md mx-auto flex flex-col gap-6">
        {[
          { label: 'TUNGGAKAN DARURAT', items: data.tunggakan, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
          { label: 'BULAN INI', items: data.bulanIni, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
          { label: 'BULAN DEPAN', items: data.bulanDepan, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' }
        ].map((section, idx) => {
          // MESIN PENJUMLAH OTOMATIS
          const subTotal = section.items.reduce((acc, curr) => acc + curr.beban, 0)
          return (
          <div key={idx}>
            <div className="flex justify-between items-end mb-3">
              <h2 className={`text-[10px] font-bold uppercase tracking-widest ${section.color}`}>{section.label}</h2>
              {subTotal > 0 && <span className={`text-[12px] font-bold ${section.color}`}>{formatRupiah(subTotal)}</span>}
            </div>
            <div className="grid gap-3">
              {section.items.length === 0 ? (<div className="w-full py-4 bg-white rounded-xl border border-dashed border-gray-200 text-center"><p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">BERSIH</p></div>) 
              : section.items.map((t: any, i: number) => (
                <div key={i} className={`p-4 rounded-[1.2rem] border shadow-sm flex justify-between items-center ${section.bg}`}>
                  <div className="flex flex-col"><p className="font-bold text-[12px] uppercase">{t.nama}</p><div className="flex items-center gap-2 mt-1"><span className="text-[8px] font-bold bg-white px-2 py-0.5 rounded shadow-sm opacity-80">{t.tipe}</span><span className="text-[9px] font-bold opacity-70">JATUH TEMPO : {t.tempo.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span></div></div>
                  <p className={`font-bold text-[13px] ${section.color}`}>{formatRupiah(t.beban)}</p>
                </div>
              ))}
            </div>
          </div>
        )})}
      </div>
    </main>
  )
}