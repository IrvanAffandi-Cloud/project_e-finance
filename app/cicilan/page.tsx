'use client'
import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getCicilanMaster, tambahCicilanMaster, hapusCicilanMaster } from '@/app/actions'

export default function CicilanPage() {
  const router = useRouter()
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

  // MESIN PENJUMLAH OTOMATIS
  const totalBebanBulanan = cicilan.reduce((acc, curr) => acc + Number(curr.cicilan_wajib_per_bulan), 0)
  const totalPokokPinjaman = cicilan.reduce((acc, curr) => acc + Number(curr.total_pinjaman), 0)

  const handleTambah = async () => {
    const htmlForm = `
      <input id="swal-nama" type="text" placeholder="NAMA KREDITUR" class="w-full h-12 px-4 mb-3 bg-[#F5F5F7] border border-gray-200 rounded-xl text-center font-bold uppercase outline-none focus:border-blue-500 text-[12px]">
      <input id="swal-pokok" type="text" inputmode="numeric" oninput="this.value = this.value.replace(/[^0-9]/g, '').replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.')" placeholder="TOTAL PINJAMAN MURNI (Rp)" class="w-full h-12 px-4 mb-3 bg-[#F5F5F7] border border-gray-200 rounded-xl text-center font-bold outline-none focus:border-blue-500 text-[12px]">
      <input id="swal-tenor" type="number" placeholder="TENOR (BULAN)" class="w-full h-12 px-4 mb-3 bg-[#F5F5F7] border border-gray-200 rounded-xl text-center font-bold outline-none focus:border-blue-500 text-[12px]">
      <input id="swal-cicilan" type="text" inputmode="numeric" oninput="this.value = this.value.replace(/[^0-9]/g, '').replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.')" placeholder="CICILAN WAJIB / BLN (Rp)" class="w-full h-12 px-4 mb-3 bg-[#F5F5F7] border border-gray-200 rounded-xl text-center font-bold outline-none focus:border-blue-500 text-[12px]">
      <p class="text-[9px] font-bold text-gray-400 mt-2 mb-1">TANGGAL MULAI CICILAN 1 :</p>
      <input id="swal-tempo" type="date" class="w-full h-12 px-4 bg-[#F5F5F7] border border-gray-200 rounded-xl text-center font-bold outline-none focus:border-blue-500 text-[12px]">
    `
    const { value: form } = await Swal.fire({
      title: 'BUKU CICILAN BARU', html: htmlForm, showCancelButton: true, confirmButtonText: 'CETAK BUKU', cancelButtonText: 'BATAL', buttonsStyling: false,
      customClass: { popup: '!rounded-[1.5rem] !p-5', confirmButton: '!bg-blue-600 !text-white !font-bold !w-full !rounded-xl !py-3 !mt-3 text-[10px] uppercase tracking-widest', cancelButton: '!bg-gray-100 !text-gray-500 !font-bold !w-full !rounded-xl !py-3 !mt-3 text-[10px] uppercase tracking-widest', actions: '!flex !flex-col w-full' },
      preConfirm: () => {
        const nama = (document.getElementById('swal-nama') as HTMLInputElement).value
        const pokok = Number((document.getElementById('swal-pokok') as HTMLInputElement).value.replace(/\./g, ''))
        const tenor = Number((document.getElementById('swal-tenor') as HTMLInputElement).value)
        const cicilan_bln = Number((document.getElementById('swal-cicilan') as HTMLInputElement).value.replace(/\./g, ''))
        const tempo = (document.getElementById('swal-tempo') as HTMLInputElement).value
        if (!nama || !pokok || !tenor || !cicilan_bln || !tempo) return Swal.showValidationMessage('DATA TIDAK VALID!')
        return { nama, pokok, tenor, cicilan_bln, tempo }
      }
    })
    if (form) { Swal.showLoading(); await tambahCicilanMaster(form.nama, form.pokok, form.tenor, form.cicilan_bln, form.tempo); await loadData() }
  }

  const handleHapus = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const res = await Swal.fire({ title: 'BAKAR BUKU?', text: 'Riwayat bulanan bakal lenyap permanen!', icon: 'warning', showCancelButton: true, confirmButtonText: 'HAPUS', customClass: { confirmButton: '!bg-red-600 !text-white !font-bold !rounded-xl !px-5 !py-3', cancelButton: '!bg-gray-100 !text-gray-500 !font-bold !rounded-xl !px-5 !py-3' }, buttonsStyling: false })
    if (res.isConfirmed) { Swal.showLoading(); await hapusCicilanMaster(id); await loadData() }
  }

  if (loading) return <div className="min-h-screen bg-[#FBFBFD] flex items-center justify-center"><div className="w-8 h-8 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>

  return (
    <main className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] flex flex-col font-sans pb-24 px-5 pt-6">
      <header className="w-full max-w-md mx-auto flex justify-between items-center mb-6">
        <div><h1 className="font-bold text-[16px] text-blue-700 uppercase tracking-wider">DATA CICILAN</h1><p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">BUKU INDUK PINJAMAN</p></div>
        <Link href="/" className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-[10px] font-bold shadow-sm hover:bg-gray-50">KEMBALI</Link>
      </header>

      {/* PAPAN REKAP TOTAL (BARU) */}
      <div className="w-full max-w-md mx-auto bg-blue-900 p-5 rounded-[1.5rem] shadow-xl mb-6 flex flex-col relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <div className="relative z-10 flex flex-col gap-4">
          <div>
            <p className="text-[9px] font-bold text-blue-300 uppercase tracking-widest mb-1">TOTAL BEBAN WAJIB BULANAN</p>
            <h2 className="text-2xl font-bold tracking-tight">{formatRupiah(totalBebanBulanan)}</h2>
          </div>
          <div className="border-t border-blue-800 pt-3">
            <p className="text-[8px] font-bold text-blue-300 uppercase tracking-widest mb-0.5">AKUMULASI POKOK PINJAMAN AKTIF</p>
            <p className="font-bold text-[13px]">{formatRupiah(totalPokokPinjaman)}</p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-md mx-auto flex flex-col gap-4">
        {cicilan.length === 0 ? (<div className="bg-white border border-dashed border-gray-200 rounded-[1.5rem] py-10 text-center shadow-sm"><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">TIDAK ADA DATA CICILAN</p></div>) 
        : cicilan.map((c) => (
            <div key={c.id} onClick={() => router.push(`/cicilan/${c.id}`)} className="bg-white border border-blue-100 rounded-[1.2rem] p-5 shadow-sm flex flex-col cursor-pointer hover:border-blue-300 active:scale-95 transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-bl-full -z-0"></div>
              <div className="relative z-10 flex justify-between items-start">
                <div><h2 className="font-bold text-[14px] uppercase">{c.nama_kreditur}</h2><p className="text-[10px] font-bold text-gray-400 uppercase mt-1">POKOK : <span className="text-blue-600">{formatRupiah(c.total_pinjaman)}</span></p></div>
                <button onClick={(e) => handleHapus(e, c.id)} className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-600 rounded-lg hover:bg-red-100 active:scale-95 transition-all text-xs border border-red-100">🗑️</button>
              </div>
              <div className="relative z-10 flex justify-between items-end mt-4 pt-4 border-t border-gray-100">
                <div className="flex flex-col"><p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">TENOR</p><p className="font-bold text-[11px] text-[#1D1D1F] mt-0.5">{c.tenor_bulan} BULAN</p></div>
                <div className="flex flex-col items-end"><p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">WAJIB PER BULAN</p><p className="font-bold text-[12px] text-red-500 mt-0.5">{formatRupiah(c.cicilan_wajib_per_bulan)}</p></div>
              </div>
            </div>
          ))
        }
      </div>
      <button onClick={handleTambah} className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 z-50"><span className="text-2xl font-bold">+</span></button>
    </main>
  )
}