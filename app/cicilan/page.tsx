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

  // Cuma hitung beban bulanan, pokok udah gue hapus dari summary
  const totalBebanBulanan = cicilan.reduce((acc, curr) => acc + Number(curr.cicilan_wajib_per_bulan), 0)

  const baseSwalClass = {
    popup: '!max-w-[380px] !rounded-[2rem] border border-gray-200 shadow-2xl bg-white p-6',
    title: 'text-[#1D1D1F] font-black uppercase text-[12px] tracking-widest mb-4',
    actions: 'w-full flex flex-col gap-2 mt-5',
    confirmButton: 'w-full h-10 flex items-center justify-center bg-[#0B214A] text-white font-black text-[10px] tracking-[0.15em] uppercase px-5 rounded-xl shadow-sm hover:bg-blue-900 active:scale-95 transition-all duration-200',
    cancelButton: 'w-full h-10 flex items-center justify-center bg-[#F5F5F7] border border-transparent text-gray-500 font-black text-[10px] tracking-[0.15em] uppercase px-5 rounded-xl hover:bg-gray-200 active:scale-95 transition-all duration-200'
  }

  const handleTambah = async () => {
    const htmlForm = `
      <div class="flex flex-col gap-3 text-left">
        <input id="swal-nama" type="text" placeholder="NAMA KREDITUR" class="w-full h-10 px-4 bg-[#F5F5F7] border border-transparent focus:border-blue-400 focus:bg-white rounded-xl text-center font-bold text-[10px] uppercase outline-none tracking-widest">
        <input id="swal-pokok" type="text" inputmode="numeric" oninput="this.value = this.value.replace(/[^0-9]/g, '').replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.')" placeholder="TOTAL PINJAMAN (RP)" class="w-full h-10 px-4 bg-[#F5F5F7] border border-transparent focus:border-blue-400 focus:bg-white rounded-xl text-center font-bold text-[12px] outline-none tracking-widest">
        <input id="swal-tenor" type="number" placeholder="TENOR (BULAN)" class="w-full h-10 px-4 bg-[#F5F5F7] border border-transparent focus:border-blue-400 focus:bg-white rounded-xl text-center font-bold text-[10px] outline-none tracking-widest">
        <input id="swal-cicilan" type="text" inputmode="numeric" oninput="this.value = this.value.replace(/[^0-9]/g, '').replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.')" placeholder="CICILAN / BLN (RP)" class="w-full h-10 px-4 bg-[#F5F5F7] border border-transparent focus:border-blue-400 focus:bg-white rounded-xl text-center font-bold text-[12px] outline-none tracking-widest">
        <input id="swal-tempo" type="date" class="w-full h-10 px-4 bg-[#F5F5F7] border border-transparent focus:border-blue-400 focus:bg-white rounded-xl text-center font-bold text-[10px] outline-none text-gray-500 tracking-widest">
      </div>
    `
    const { value: form } = await Swal.fire({ title: 'BUKU CICILAN BARU', html: htmlForm, showCancelButton: true, confirmButtonText: 'CETAK BUKU', cancelButtonText: 'BATAL', customClass: baseSwalClass, buttonsStyling: false,
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
    const res = await Swal.fire({ title: 'BAKAR BUKU?', text: 'Riwayat bulanan bakal lenyap permanen!', icon: 'warning', showCancelButton: true, confirmButtonText: 'HAPUS', customClass: { ...baseSwalClass, confirmButton: baseSwalClass.confirmButton.replace('bg-[#0B214A]', 'bg-red-600') }, buttonsStyling: false })
    if (res.isConfirmed) { Swal.showLoading(); await hapusCicilanMaster(id); await loadData() }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>

  return (
    <main className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] flex flex-col font-sans pb-24 items-center">
      <style dangerouslySetInnerHTML={{__html: ` @keyframes shine-glossy { 0% { transform: translateX(-100%) skewX(-20deg); } 100% { transform: translateX(200%) skewX(-20deg); } } `}} />

      <header className="sticky top-0 z-50 w-full h-[68px] rounded-b-[2.5rem] bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 shadow-[0_10px_30px_rgba(37,99,235,0.3)] border-b border-blue-400/40 overflow-hidden flex flex-col items-center justify-center pt-1">
        <div className="absolute top-0 h-full w-[50%] bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shine-glossy_4s_infinite]"></div>
        <div className="w-full max-w-xl relative flex flex-col items-center justify-center">
          <Link href="/" className="absolute top-1/2 -translate-y-1/2 left-4 w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 hover:bg-white/30 active:scale-95 transition-all z-10">
            <svg className="w-4 h-4 text-white pr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
          </Link>
          <h1 className="text-white font-black text-[17px] tracking-[0.4em] uppercase drop-shadow-md z-10 leading-none">DATA CICILAN</h1>
        </div>
      </header>

      <div className="w-full max-w-xl px-4 mt-6 flex flex-col gap-4">
        
        {/* PAPAN REKAP: CUMA TOTAL BEBAN BULANAN */}
        <div className="bg-white border border-gray-200 p-6 rounded-[1.2rem] shadow-sm text-center">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-1">TOTAL BEBAN BULANAN</p>
          <h2 className="text-[20px] font-black text-[#1D1D1F] tracking-tight">{formatRupiah(totalBebanBulanan)}</h2>
        </div>

        {/* COMPACT LIST WRAPPER */}
        <div className="bg-white border border-gray-200 rounded-[1.2rem] shadow-sm overflow-hidden flex flex-col">
          {cicilan.length === 0 ? (
            <p className="text-[10px] font-bold tracking-[0.2em] text-gray-400 text-center py-6 uppercase">TIDAK ADA DATA</p>
          ) : (
            cicilan.map((c) => (
              <div 
                key={c.id} 
                onClick={() => router.push(`/cicilan/${c.id}`)} 
                className="flex justify-between items-center px-4 py-3 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <div className="flex flex-col">
                  <h2 className="font-bold text-[12px] uppercase tracking-tight text-[#1D1D1F]">{c.nama_kreditur}</h2>
                  <p className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.1em] mt-0.5">
                    POKOK : {formatRupiah(c.total_pinjaman)}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right flex flex-col items-end">
                    <p className="font-bold text-[12px] text-[#1D1D1F] tracking-tight">{formatRupiah(c.cicilan_wajib_per_bulan)}</p>
                    <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">/ BULAN</p>
                  </div>
                  <button 
                    onClick={(e) => handleHapus(e, c.id)} 
                    className="w-7 h-7 flex items-center justify-center bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-all text-[10px]"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <button onClick={handleTambah} className="fixed bottom-6 right-6 w-14 h-14 bg-[#0B214A] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 z-50">
        <span className="text-2xl font-black">+</span>
      </button>
    </main>
  )
}