'use client'
import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import Link from 'next/link'
import { getCicilanMaster, tambahCicilanMaster, hapusCicilanMaster } from '@/app/actions'

export default function CicilanPage() {
  const [cicilan, setCicilan] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const res = await getCicilanMaster()
      setCicilan(res.cicilan || [])
      setLoading(false)
    } catch (error) { window.location.href = '/' }
  }
  useEffect(() => { loadData() }, [])

  const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka)

  const handleTambah = async () => {
    const htmlForm = `
      <input id="swal-nama" type="text" placeholder="NAMA KREDITUR (Cth: BSI / KPR)" class="w-full h-12 px-4 mb-3 bg-[#F5F5F7] border border-gray-200 rounded-xl text-center font-bold text-[#1D1D1F] uppercase outline-none focus:border-blue-500">
      <input id="swal-pokok" type="text" inputmode="numeric" oninput="this.value = this.value.replace(/[^0-9]/g, '').replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.')" placeholder="TOTAL PINJAMAN (Rp)" class="w-full h-12 px-4 mb-3 bg-[#F5F5F7] border border-gray-200 rounded-xl text-center font-bold text-[#1D1D1F] outline-none focus:border-blue-500">
      <input id="swal-tenor" type="number" placeholder="TOTAL TENOR (Bulan)" class="w-full h-12 px-4 mb-3 bg-[#F5F5F7] border border-gray-200 rounded-xl text-center font-bold text-[#1D1D1F] outline-none focus:border-blue-500">
      <input id="swal-cicilan" type="text" inputmode="numeric" oninput="this.value = this.value.replace(/[^0-9]/g, '').replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.')" placeholder="CICILAN WAJIB PER BULAN (Rp)" class="w-full h-12 px-4 mb-3 bg-[#F5F5F7] border border-gray-200 rounded-xl text-center font-bold text-[#1D1D1F] outline-none focus:border-blue-500">
      <p class="text-[9px] font-bold text-gray-400 mt-2 mb-1">TANGGAL MULAI CICILAN PERTAMA:</p>
      <input id="swal-tempo" type="date" class="w-full h-12 px-4 bg-[#F5F5F7] border border-gray-200 rounded-xl text-center font-bold text-sm text-[#1D1D1F] outline-none focus:border-blue-500">
    `
    const { value: form } = await Swal.fire({
      title: 'BUKU CICILAN BARU', html: htmlForm, showCancelButton: true, confirmButtonText: 'CETAK BUKU', cancelButtonText: 'BATAL', buttonsStyling: false,
      customClass: { confirmButton: 'bg-blue-600 text-white font-bold w-full rounded-xl py-3 mt-3', cancelButton: 'bg-gray-100 text-gray-500 font-bold w-full rounded-xl py-3 mt-3', popup: 'rounded-[1.5rem]' },
      preConfirm: () => {
        const nama = (document.getElementById('swal-nama') as HTMLInputElement).value
        
        const rawPokok = (document.getElementById('swal-pokok') as HTMLInputElement).value.replace(/\./g, '')
        const pokok = Number(rawPokok)
        
        const tenor = Number((document.getElementById('swal-tenor') as HTMLInputElement).value)
        
        const rawCicilanBln = (document.getElementById('swal-cicilan') as HTMLInputElement).value.replace(/\./g, '')
        const cicilan_bln = Number(rawCicilanBln)
        
        const tempo = (document.getElementById('swal-tempo') as HTMLInputElement).value
        
        if (!nama || !pokok || !tenor || !cicilan_bln || !tempo) { Swal.showValidationMessage('DATA KOSONG ATAU TIDAK VALID!'); return false }
        return { nama, pokok, tenor, cicilan_bln, tempo }
      }
    })
    if (form) { setLoading(true); await tambahCicilanMaster(form.nama, form.pokok, form.tenor, form.cicilan_bln, form.tempo); await loadData() }
  }

  const handleHapus = async (id: string) => {
    const res = await Swal.fire({ title: 'BAKAR BUKU?', text: 'Riwayat bulanan bakal lenyap permanen!', icon: 'warning', showCancelButton: true, confirmButtonText: 'HAPUS', buttonsStyling: false, customClass: { confirmButton: 'bg-red-600 text-white font-bold w-full rounded-xl py-3 mt-3', cancelButton: 'bg-gray-100 text-gray-500 font-bold w-full rounded-xl py-3 mt-3', popup: 'rounded-[1.5rem]' } })
    if (res.isConfirmed) { setLoading(true); await hapusCicilanMaster(id); await loadData() }
  }

  if (loading) return <div className="min-h-screen bg-[#FBFBFD] flex items-center justify-center"><div className="w-8 h-8 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>

  return (
    <main className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] flex flex-col font-sans pb-24 px-5 pt-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="font-bold text-[18px] text-blue-800 uppercase">DATA CICILAN</h1>
        <Link href="/dashboard" className="text-[10px] font-bold bg-white border border-gray-200 px-4 py-2 rounded-lg">KEMBALI</Link>
      </header>

      <div className="flex flex-col gap-4">
        {cicilan.map((c) => {
          return (
            <div key={c.id} className="bg-white border border-blue-100 rounded-[1.5rem] p-5 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="font-bold text-[16px] uppercase">{c.nama_kreditur}</h2>
                  <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">TOTAL: {formatRupiah(c.total_pinjaman)}</p>
                </div>
                <button onClick={() => handleHapus(c.id)} className="text-[10px] bg-red-50 text-red-600 px-3 py-1.5 rounded-lg font-bold">HAPUS</button>
              </div>

              <Link href={`/cicilan/${c.id}`} className="flex items-center justify-center w-full bg-blue-50 text-blue-700 font-bold py-3 rounded-xl text-[11px] uppercase tracking-widest hover:bg-blue-100 transition-all">
                BUKA DATA
              </Link>
            </div>
          )
        })}
      </div>

      <button onClick={handleTambah} className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 z-50">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
      </button>
    </main>
  )
}