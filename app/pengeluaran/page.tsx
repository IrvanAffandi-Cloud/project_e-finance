'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Swal from 'sweetalert2'
import Link from 'next/link'
import { getKategori, tambahTransaksiHarian } from '@/app/actions'

export default function PengeluaranPage() {
  const router = useRouter()
  const [kategoriList, setKategoriList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getKategori().then(res => {
      setKategoriList((res.kategori || []).filter((k: any) => k.tipe === 'PENGELUARAN'))
      setLoading(false)
    })
  }, [])

  const handleSimpan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Mesin Penghancur Titik Kacamata Rupiah
    const rawNominal = (e.currentTarget.elements.namedItem('nominal') as HTMLInputElement).value.replace(/\./g, '')
    const nominal = Number(rawNominal)

    const katId = (e.currentTarget.elements.namedItem('kategori') as HTMLSelectElement).value
    const catatan = (e.currentTarget.elements.namedItem('catatan') as HTMLInputElement).value

    if (!nominal || !katId) return Swal.fire('GAGAL', 'NOMINAL & KATEGORI WAJIB DIISI!', 'error')

    setLoading(true)
    const res = await tambahTransaksiHarian(nominal, catatan, katId)
    if (res.success) {
      await Swal.fire({ title: 'TERCATAT!', icon: 'success', timer: 1000, showConfirmButton: false })
      router.push('/dashboard')
    } else {
      Swal.fire('ERROR', res.message, 'error')
      setLoading(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-[#FBFBFD] flex items-center justify-center"><div className="w-8 h-8 border-[3px] border-red-500 border-t-transparent rounded-full animate-spin"></div></div>

  return (
    <main className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] flex flex-col items-center px-5 pt-10">
      <div className="w-full max-w-md bg-white p-6 rounded-[1.5rem] shadow-xl border border-gray-100">
        <h1 className="font-bold text-[18px] tracking-wider text-red-600 mb-6 text-center">CATAT PENGELUARAN</h1>
        <form onSubmit={handleSimpan} className="flex flex-col gap-4">
          
          <input name="nominal" type="text" inputMode="numeric" 
          onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.') }} 
          placeholder="Nominal" className="w-full h-14 px-4 bg-[#F5F5F7] border border-gray-200 rounded-xl text-center font-bold text-lg outline-none focus:border-red-500" />
          
          <select name="kategori" defaultValue="" className="w-full h-14 px-4 bg-[#F5F5F7] border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-red-500 text-center text-gray-500 uppercase">
            <option value="" disabled>Pilih</option>
            {kategoriList.map(k => <option key={k.id} value={k.id}>{k.nama_kategori}</option>)}
          </select>
          
          <input name="catatan" type="text" placeholder="CATATAN" className="w-full h-14 px-4 bg-[#F5F5F7] border border-gray-200 rounded-xl text-center font-bold text-xs uppercase outline-none focus:border-red-500" />

          <button type="submit" className="w-full h-14 bg-gradient-to-br from-red-600 to-red-500 text-white font-bold text-sm uppercase rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition-all mt-4">
            SIMPAN
          </button>
          <Link href="/dashboard" className="w-full h-14 flex items-center justify-center bg-white border border-gray-200 text-gray-500 font-bold text-xs uppercase rounded-xl hover:bg-gray-50 active:scale-95 transition-all">
            BATAL
          </Link>
        </form>
      </div>
    </main>
  )
}