'use client'
import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import Link from 'next/link'
import { getKategoriAll, tambahKategori, editKategori, hapusKategori } from '@/app/actions'

export default function KategoriPage() {
  const [kategoriList, setKategoriList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    const res = await getKategoriAll()
    setKategoriList(res.kategori || [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  // SIPEKAT SWEETALERT STYLE
  const baseSwalClass = {
    popup: '!max-w-[380px] !rounded-[2rem] border border-gray-200 shadow-2xl bg-white p-6',
    title: 'text-[#1D1D1F] font-black uppercase text-[12px] tracking-widest mb-4',
    actions: 'w-full flex flex-col gap-2 mt-5',
    confirmButton: 'w-full h-10 flex items-center justify-center bg-[#0B214A] text-white font-black text-[10px] tracking-[0.15em] uppercase px-5 rounded-xl shadow-sm hover:bg-blue-900 active:scale-95 transition-all duration-200',
    cancelButton: 'w-full h-10 flex items-center justify-center bg-[#F5F5F7] border border-transparent text-gray-500 font-black text-[10px] tracking-[0.15em] uppercase px-5 rounded-xl hover:bg-gray-200 active:scale-95 transition-all duration-200'
  }

  const handleTambah = async () => {
    const { value: form } = await Swal.fire({
      title: 'KATEGORI BARU',
      html: `
        <div class="flex flex-col gap-3 text-left">
          <input id="swal-nama" type="text" placeholder="NAMA KATEGORI" class="w-full h-10 px-4 bg-[#F5F5F7] border border-transparent focus:border-blue-500 rounded-xl text-center font-black text-[10px] uppercase outline-none tracking-widest">
          <select id="swal-tipe" class="w-full h-10 px-4 bg-[#F5F5F7] border border-transparent focus:border-blue-500 rounded-xl text-center font-black text-[10px] uppercase outline-none tracking-widest text-gray-600">
            <option value="PEMASUKAN">PEMASUKAN</option>
            <option value="PENGELUARAN">PENGELUARAN</option>
          </select>
        </div>
      `,
      showCancelButton: true, confirmButtonText: 'SIMPAN', buttonsStyling: false, customClass: baseSwalClass,
      preConfirm: () => {
        const nama = (document.getElementById('swal-nama') as HTMLInputElement).value
        const tipe = (document.getElementById('swal-tipe') as HTMLSelectElement).value
        if (!nama || !tipe) return Swal.showValidationMessage('DATA TIDAK VALID!')
        return { nama, tipe }
      }
    })

    if (form) { Swal.showLoading(); await tambahKategori(form.nama, form.tipe); await loadData() }
  }

  const handleAksi = async (k: any) => {
    if (k.nama_kategori === 'CICILAN BANK' || k.nama_kategori === 'BAYAR UTANG PRIBADI') {
      return Swal.fire({ title: 'TERKUNCI', text: 'Kategori sistem ini tidak bisa diubah!', icon: 'error', customClass: baseSwalClass, buttonsStyling: false })
    }

    const aksi = await Swal.fire({
      title: 'OPSI KATEGORI', text: `${k.nama_kategori} (${k.tipe})`,
      showCancelButton: true, showDenyButton: true, confirmButtonText: 'EDIT', denyButtonText: 'HAPUS', cancelButtonText: 'BATAL',
      customClass: { popup: baseSwalClass.popup, title: baseSwalClass.title, confirmButton: baseSwalClass.confirmButton, denyButton: baseSwalClass.confirmButton.replace('bg-[#0B214A]', 'bg-red-600'), cancelButton: baseSwalClass.cancelButton, actions: baseSwalClass.actions }, buttonsStyling: false
    })

    if (aksi.isConfirmed) {
      const { value: formEdit } = await Swal.fire({
        title: 'EDIT KATEGORI',
        html: `
          <div class="flex flex-col gap-3 text-left">
            <input id="swal-edit-nama" type="text" value="${k.nama_kategori}" class="w-full h-10 px-4 bg-[#F5F5F7] border border-transparent focus:border-blue-500 rounded-xl text-center font-black text-[10px] uppercase outline-none tracking-widest">
            <select id="swal-edit-tipe" class="w-full h-10 px-4 bg-[#F5F5F7] border border-transparent focus:border-blue-500 rounded-xl text-center font-black text-[10px] uppercase outline-none tracking-widest text-gray-600">
              <option value="PEMASUKAN" ${k.tipe === 'PEMASUKAN' ? 'selected' : ''}>PEMASUKAN</option>
              <option value="PENGELUARAN" ${k.tipe === 'PENGELUARAN' ? 'selected' : ''}>PENGELUARAN</option>
            </select>
          </div>
        `,
        showCancelButton: true, confirmButtonText: 'SIMPAN', buttonsStyling: false, customClass: baseSwalClass,
        preConfirm: () => {
          const nama = (document.getElementById('swal-edit-nama') as HTMLInputElement).value
          const tipe = (document.getElementById('swal-edit-tipe') as HTMLSelectElement).value
          if (!nama || !tipe) return Swal.showValidationMessage('DATA TIDAK VALID!')
          return { nama, tipe }
        }
      })
      if (formEdit) { Swal.showLoading(); await editKategori(k.id, formEdit.nama, formEdit.tipe); await loadData() }
    } else if (aksi.isDenied) {
      const hapus = await Swal.fire({ title: 'YAKIN HAPUS?', text: 'Riwayat transaksi akan menjadi "TANPA KATEGORI".', icon: 'warning', showCancelButton: true, confirmButtonText: 'HAPUS', customClass: { ...baseSwalClass, confirmButton: baseSwalClass.confirmButton.replace('bg-[#0B214A]', 'bg-red-600') }, buttonsStyling: false })
      if (hapus.isConfirmed) { Swal.showLoading(); await hapusKategori(k.id); await loadData() }
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>

  return (
    <main className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] flex flex-col items-center font-sans pb-24">
      <style dangerouslySetInnerHTML={{__html: ` @keyframes shine-glossy { 0% { transform: translateX(-100%) skewX(-20deg); } 100% { transform: translateX(200%) skewX(-20deg); } } `}} />

      {/* HEADER SLIM GLOSSY SIPEKAT (BLUE) */}
      <header className="sticky top-0 z-50 w-full h-[68px] rounded-b-[2.5rem] bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 shadow-[0_10px_30px_rgba(37,99,235,0.3)] border-b border-blue-400/40 overflow-hidden flex flex-col items-center justify-center pt-1">
        <div className="absolute top-0 h-full w-[50%] bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shine-glossy_4s_infinite]"></div>
        
        <div className="w-full max-w-xl relative flex flex-col items-center justify-center">
          <Link href="/" className="absolute top-1/2 -translate-y-1/2 left-4 w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 hover:bg-white/30 active:scale-95 transition-all z-10">
            <svg className="w-4 h-4 text-white pr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
          </Link>
          <h1 className="text-white font-black text-[13px] tracking-[0.4em] uppercase drop-shadow-md z-10 leading-none">DATABASE KATEGORI</h1>
          <p className="text-blue-100 text-[8px] font-black tracking-[0.3em] uppercase opacity-90 mt-1 z-10 leading-none">MANAJER TIPE TRANSAKSI</p>
        </div>
      </header>

      <div className="w-full max-w-xl px-4 mt-6 flex flex-col gap-3">
        {kategoriList.map(k => {
          const isSystem = k.nama_kategori === 'CICILAN BANK' || k.nama_kategori === 'BAYAR UTANG PRIBADI'
          return (
            <div key={k.id} onClick={() => !isSystem && handleAksi(k)} className={`p-4 rounded-[1.2rem] border shadow-sm flex justify-between items-center transition-all ${isSystem ? 'bg-gray-50 border-gray-200 opacity-70' : 'bg-white border-blue-100 cursor-pointer hover:border-blue-300 active:scale-95'}`}>
              <div className="flex flex-col">
                <span className="font-black text-[11px] uppercase tracking-tight">{k.nama_kategori}</span>
                <span className={`text-[8px] font-black mt-1 tracking-[0.2em] uppercase ${k.tipe === 'PEMASUKAN' ? 'text-green-600' : 'text-red-600'}`}>TIPE: {k.tipe}</span>
              </div>
              {isSystem && <span className="text-[6px] font-black bg-gray-200 text-gray-500 px-2 py-1 rounded border border-gray-300 uppercase tracking-widest">SISTEM TERKUNCI</span>}
            </div>
          )
        })}
      </div>

      <button onClick={handleTambah} className="fixed bottom-6 right-6 w-14 h-14 bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 z-50">
        <span className="text-2xl font-black">+</span>
      </button>
    </main>
  )
}