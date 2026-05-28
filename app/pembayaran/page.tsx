'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getRadarDashboard } from '@/app/actions'

export default function PembayaranPage() {
  // Fix: Menentukan tipe data secara eksplisit agar TypeScript tidak error
  const [data, setData] = useState<{ tunggakan: any[], bulanIni: any[], bulanDepan: any[] }>({ 
    tunggakan: [], 
    bulanIni: [], 
    bulanDepan: [] 
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getRadarDashboard().then(res => {
      const today = new Date()
      const currMonth = today.getMonth()
      const currYear = today.getFullYear()

      const all = [...res.cicilan, ...res.utang].map(t => ({
        ...t,
        nama: t.nama_kreditur || t.nama,
        beban: t.cicilan_master ? (t.cicilan_master.cicilan_wajib_per_bulan - t.nominal_dibayar) : Number(t.sisa_utang),
        tempo: new Date(t.tanggal_jatuh_tempo)
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

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold">MENYISIR TAGIHAN...</div>

  return (
    <main className="min-h-screen bg-[#FBFBFD] p-5">
      <header className="flex justify-between items-center mb-6">
        <h1 className="font-bold text-lg text-red-600 uppercase">PUSAT KOMANDO TAGIHAN</h1>
        <Link href="/dashboard" className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-[10px] font-bold">KEMBALI</Link>
      </header>

      <div className="flex flex-col gap-6">
        {['TUNGGAKAN (HARUS DIBAYAR SEKARANG)', 'BULAN INI (JATUH TEMPO)', 'BULAN DEPAN (PERSIAPAN)'].map((label, idx) => {
          const list = [data.tunggakan, data.bulanIni, data.bulanDepan][idx]
          return (
            <div key={label}>
              <h2 className={`text-[10px] font-bold mb-3 ${idx === 0 ? 'text-red-600' : 'text-gray-500'}`}>{label}</h2>
              <div className="grid gap-3">
                {list.length === 0 ? <p className="text-[10px] text-gray-400 italic">Bersih.</p> : list.map((t: any, i) => (
                  <div key={i} className="bg-white p-4 rounded-xl border border-gray-200 flex justify-between">
                    <div>
                      <p className="font-bold text-[12px]">{t.nama}</p>
                      <p className="text-[9px] text-gray-400">Tempo: {t.tempo.toLocaleDateString('id-ID')}</p>
                    </div>
                    <p className="font-bold text-red-600">{formatRupiah(t.beban)}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}