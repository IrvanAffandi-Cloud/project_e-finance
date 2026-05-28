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

  if (loading) return (
    <div className="min-h-screen bg-[#FBFBFD] flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-[3px] border-[#F5F5F7] border-t-red-600 rounded-full animate-spin"></div>
      <p className="font-black text-[9px] text-red-600 uppercase tracking-[0.2em] animate-pulse">MENYISIR TAGIHAN...</p>
    </div>
  )

  return (
    <main className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] flex flex-col font-sans pb-24 selection:bg-red-200 overflow-x-hidden items-center">
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shine-glossy { 0% { transform: translateX(-100%) skewX(-20deg); } 100% { transform: translateX(200%) skewX(-20deg); } }
      `}} />

      {/* HEADER SLIM GLOSSY SIPEKAT (DARK RED) */}
      <header className="sticky top-0 z-50 w-full h-[68px] rounded-b-[2.5rem] bg-gradient-to-br from-red-700 via-red-600 to-red-800 shadow-[0_10px_30px_rgba(220,38,38,0.3)] border-b border-red-400/40 overflow-hidden flex flex-col items-center justify-center pt-1">
        <div className="absolute top-0 h-full w-[50%] bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shine-glossy_4s_infinite]"></div>
        
        <div className="w-full max-w-xl relative flex flex-col items-center justify-center">
          <Link href="/" className="absolute top-1/2 -translate-y-1/2 left-4 w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 hover:bg-white/30 active:scale-95 transition-all z-10">
            <svg className="w-4 h-4 text-white pr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
          </Link>
          
          <h1 className="text-white font-black text-[13px] tracking-[0.4em] uppercase drop-shadow-md z-10 leading-none">PUSAT TAGIHAN</h1>
          <p className="text-red-100 text-[8px] font-black tracking-[0.3em] uppercase opacity-90 mt-1 z-10 leading-none">RADAR JATUH TEMPO</p>
        </div>
      </header>

      <div className="w-full max-w-xl px-4 mt-6 flex flex-col gap-6">
        {[
          { label: 'TUNGGAKAN DARURAT', items: data.tunggakan, color: 'text-red-600', bgBorder: 'border-red-200', bgCard: 'bg-red-50/50' },
          { label: 'TAGIHAN BULAN INI', items: data.bulanIni, color: 'text-orange-600', bgBorder: 'border-orange-200', bgCard: 'bg-white' },
          { label: 'ESTIMASI BULAN DEPAN', items: data.bulanDepan, color: 'text-blue-600', bgBorder: 'border-blue-200', bgCard: 'bg-white' }
        ].map((section, idx) => {
          const subTotal = section.items.reduce((acc, curr) => acc + curr.beban, 0)
          return (
          <div key={idx} className="flex flex-col gap-1.5">
            <div className="flex justify-between items-end ml-1 mb-1 border-b border-gray-200 pb-1">
              <h2 className={`text-[9px] font-black uppercase tracking-[0.2em] ${section.color}`}>{section.label}</h2>
              {subTotal > 0 && <span className={`text-[10px] font-black tracking-tight ${section.color}`}>{formatRupiah(subTotal)}</span>}
            </div>
            
            <div className="bg-white border border-gray-200 rounded-[1.2rem] shadow-sm overflow-hidden flex flex-col">
              {section.items.length === 0 ? (
                <p className="text-[9px] font-black tracking-[0.2em] text-gray-400 text-center py-5 uppercase">BERSIH</p>
              ) : (
                section.items.map((t: any, i: number) => (
                  <div key={i} className={`flex justify-between items-center px-4 py-3 border-b border-gray-100 last:border-b-0 ${section.bgCard}`}>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-[11px] text-[#1D1D1F] uppercase tracking-tight truncate max-w-[120px] md:max-w-[180px]">{t.nama}</span>
                        <span className={`text-[6px] font-black px-1.5 py-0.5 rounded border uppercase tracking-widest ${t.tipe === 'CICILAN BANK' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-purple-50 text-purple-600 border-purple-200'}`}>{t.tipe}</span>
                      </div>
                      <span className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.1em] mt-0.5">
                        TEMPO: {t.tempo.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`font-black text-[12px] tracking-tight ${section.color}`}>{formatRupiah(t.beban)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )})}
      </div>
    </main>
  )
}