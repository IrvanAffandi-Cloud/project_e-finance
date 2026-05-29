'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getRadarDashboard } from '@/app/actions'

export default function PembayaranPage() {
  const [data, setData] = useState<{ tunggakan: any[], bulanIni: any[], bulanDepan: any[] }>({ tunggakan: [], bulanIni: [], bulanDepan: [] })
  const [loading, setLoading] = useState(true)
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({ 0: true, 1: true, 2: false })

  useEffect(() => {
    getRadarDashboard().then(res => {
      const today = new Date()
      const currMonth = today.getMonth()
      const currYear = today.getFullYear()
      const batasBulanIni = new Date(currYear, currMonth, 1)
      const batasBulanDepan = new Date(currYear, currMonth + 1, 1)

      const tunggakan: any[] = []
      const bulanIni: any[] = []
      const bulanDepan: any[] = []

      // PROSES CICILAN
      res.cicilan.forEach((c: any) => {
        const d = new Date(c.tanggal_jatuh_tempo)
        const item = {
          nama: c.cicilan_master?.nama_kreditur || 'CICILAN',
          beban: (c.cicilan_master?.cicilan_wajib_per_bulan || 0) - Number(c.nominal_dibayar || 0),
          totalPinjaman: Number(c.cicilan_master?.total_pinjaman || 0), // <-- DATA INI YANG LO MAU
          tempo: d,
          desc: `BLN KE-${c.bulan_ke} (CICILAN)`,
          tipe: 'CICILAN'
        }
        
        if (item.beban > 0) {
          if (d < batasBulanIni) tunggakan.push(item)
          else if (d >= batasBulanIni && d < batasBulanDepan) bulanIni.push(item)
          else if (d >= batasBulanDepan && d < new Date(currYear, currMonth + 2, 1)) bulanDepan.push(item)
        }
      })

      // PROSES UTANG
      res.utang.forEach((u: any) => {
        const d = new Date(u.tanggal_jatuh_tempo)
        const item = {
          nama: u.nama_kreditur,
          beban: Number(u.sisa_utang || 0),
          totalPinjaman: Number(u.sisa_utang || 0), // Utang biasanya = sisa utang saat input
          tempo: d,
          desc: 'UTANG PERORANGAN',
          tipe: 'PERORANGAN'
        }
        
        if (item.beban > 0) {
          if (d < batasBulanIni) tunggakan.push(item)
          else if (d >= batasBulanIni && d < batasBulanDepan) bulanIni.push(item)
          else if (d >= batasBulanDepan && d < new Date(currYear, currMonth + 2, 1)) bulanDepan.push(item)
        }
      })

      setData({
        tunggakan: tunggakan.sort((a,b) => a.tempo - b.tempo),
        bulanIni: bulanIni.sort((a,b) => a.tempo - b.tempo),
        bulanDepan: bulanDepan.sort((a,b) => a.tempo - b.tempo)
      })
      setLoading(false)
    })
  }, [])

  const formatRupiah = (a: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(a)

  const toggleSection = (idx: number) => {
    setOpenSections(prev => ({ ...prev, [idx]: !prev[idx] }))
  }

  if (loading) return (
    <div className="min-h-screen bg-[#FBFBFD] flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-[3px] border-[#F5F5F7] border-t-red-600 rounded-full animate-spin"></div>
      <p className="font-black text-[9px] text-red-600 uppercase tracking-[0.2em] animate-pulse">MENYISIR TAGIHAN...</p>
    </div>
  )

  return (
    <main className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] flex flex-col font-sans pb-24 items-center">
      <header className="sticky top-0 z-50 w-full h-[68px] rounded-b-[2.5rem] bg-gradient-to-br from-red-700 via-red-600 to-red-800 shadow-[0_10px_30px_rgba(220,38,38,0.3)] border-b border-red-400/40 overflow-hidden flex flex-col items-center justify-center pt-1">
        <div className="w-full max-w-xl relative flex flex-col items-center justify-center">
          <Link href="/" className="absolute top-1/2 -translate-y-1/2 left-4 w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 hover:bg-white/30 active:scale-95 transition-all z-10">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
          </Link>
          <h1 className="text-white font-black text-[17px] tracking-[0.4em] uppercase drop-shadow-md z-10">PUSAT TAGIHAN</h1>
        </div>
      </header>

      <div className="w-full max-w-xl px-4 mt-6 flex flex-col gap-4">
        {[
          { label: 'TUNGGAKAN', items: data.tunggakan, color: 'text-red-600', borderColor: 'border-red-200', bgCard: 'bg-red-50/50' },
          { label: 'TAGIHAN BULAN INI', items: data.bulanIni, color: 'text-orange-600', borderColor: 'border-orange-200', bgCard: 'bg-white' },
          { label: 'ESTIMASI BULAN DEPAN', items: data.bulanDepan, color: 'text-blue-600', borderColor: 'border-blue-200', bgCard: 'bg-white' }
        ].map((section, idx) => {
          const subTotal = section.items.reduce((acc, curr) => acc + curr.beban, 0)
          return (
          <div key={idx} className="flex flex-col">
            <div onClick={() => toggleSection(idx)} className={`flex justify-between items-center px-4 py-4 bg-white border ${section.borderColor} rounded-[1.2rem] shadow-sm cursor-pointer hover:shadow-md transition-all`}>
              <div className="flex flex-col">
                <h2 className={`text-[10px] font-black uppercase tracking-[0.2em] ${section.color}`}>{section.label}</h2>
                <span className="text-[8px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{section.items.length} TAGIHAN</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[12px] font-black tracking-tight ${section.color}`}>{formatRupiah(subTotal)}</span>
                <svg className={`w-5 h-5 text-gray-400 transform transition-transform ${openSections[idx] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
            
            {openSections[idx] && (
              <div className="mt-2 bg-white border border-gray-200 rounded-[1.2rem] shadow-sm overflow-hidden flex flex-col">
                {section.items.length === 0 ? (
                  <p className="text-[9px] font-bold tracking-[0.2em] text-gray-400 text-center py-6 uppercase">BERSIH</p>
                ) : (
                  section.items.map((t: any, i: number) => (
                    <div key={i} className={`flex justify-between items-center px-4 py-3 border-b border-gray-100 last:border-b-0 ${section.bgCard}`}>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[12px] text-[#1D1D1F] uppercase tracking-tight truncate">{t.nama}</span>
                          <span className={`text-[6px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-widest ${t.tipe === 'CICILAN' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-purple-50 text-purple-600 border-purple-200'}`}>{t.tipe}</span>
                        </div>
                        <span className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.1em] mt-0.5">
                          PINJAMAN: {formatRupiah(t.totalPinjaman)} | TEMPO: {t.tempo.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`font-black text-[12px] tracking-tight ${section.color}`}>{formatRupiah(t.beban)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )})}
      </div>
    </main>
  )
}