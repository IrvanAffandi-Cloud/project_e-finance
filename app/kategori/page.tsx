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

  const baseSwalClass = {
    popup: '!rounded-[1.5rem] !p-5',
    confirmButton: '!bg-blue-600 !text-white !font-bold !w-full !rounded-xl !py-3 !mt-3 text-[10px] uppercase tracking-widest', 
    cancelButton: '!bg-gray-100 !text-gray-500 !font-bold !w-full !rounded-xl !py-3 !mt-3 text-[10px] uppercase tracking-widest',
    actions: '!flex !flex-col w-full'
  }

  const handleTambah = async () => {
    const { value: form } = await Swal.fire({
      title: 'KATEGORI BARU',
      html: `
        <input id="swal-nama" type="text" placeholder="NAMA KATEGORI" class="w-full h-12 px-4 mb-3 bg-[#F5F5F7] border border-gray-200 rounded-xl text-center font-bold uppercase outline-none focus:border-blue-500 text-[12px]">
        <select id="swal-tipe" class="w-full h-12 px-4 bg-[#F5F5F7] border border-gray-200 rounded-xl text-center font-bold outline-none focus:border-blue-500 text-[12px] uppercase">
          <option value="PEMASUKAN">PEMASUKAN</option>
          <option value="PENGELUARAN">PENGELUARAN</option>
        </select>
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
      return Swal.fire('TERKUNCI', 'Kategori sistem ini tidak boleh diedit atau dihapus!', 'error')
    }

    const aksi = await Swal.fire({
      title: 'OPSI KATEGORI', text: `${k.nama_kategori} (${k.tipe})`,
      showCancelButton: true, showDenyButton: true, confirmButtonText: 'EDIT', denyButtonText: 'HAPUS', cancelButtonText: 'BATAL',
      customClass: { popup: '!rounded-[1.5rem] !p-5', confirmButton: '!bg-blue-600 !text-white !font-bold !rounded-xl !px-5 !py-3 w-full mb-2', denyButton: '!bg-red-600 !text-white !font-bold !rounded-xl !px-5 !py-3 w-full mb-2', cancelButton: '!bg-gray-100 !text-gray-500 !font-bold !rounded-xl !px-5 !py-3 w-full', actions: '!flex !flex-col w-full' }, buttonsStyling: false
    })

    if (aksi.isConfirmed) {
      const { value: formEdit } = await Swal.fire({
        title: 'EDIT KATEGORI',
        html: `
          <input id="swal-edit-nama" type="text" value="${k.nama_kategori}" class="w-full h-12 px-4 mb-3 bg-[#F5F5F7] border border-gray-200 rounded-xl text-center font-bold uppercase outline-none focus:border-blue-500 text-[12px]">
          <select id="swal-edit-tipe" class="w-full h-12 px-4 bg-[#F5F5F7] border border-gray-200 rounded-xl text-center font-bold outline-none focus:border-blue-500 text-[12px] uppercase">
            <option value="PEMASUKAN" ${k.tipe === 'PEMASUKAN' ? 'selected' : ''}>PEMASUKAN</option>
            <option value="PENGELUARAN" ${k.tipe === 'PENGELUARAN' ? 'selected' : ''}>PENGELUARAN</option>
          </select>
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
      const hapus = await Swal.fire({ title: 'YAKIN HAPUS?', text: 'Riwayat transaksi dengan kategori ini akan menjadi "TANPA KATEGORI".', icon: 'warning', showCancelButton: true, confirmButtonText: 'HAPUS', customClass: { confirmButton: '!bg-red-600 !text-white !font-bold !rounded-xl !px-5 !py-3', cancelButton: '!bg-gray-100 !text-gray-500 !font-bold !rounded-xl !px-5 !py-3' }, buttonsStyling: false })
      if (hapus.isConfirmed) { Swal.showLoading(); await hapusKategori(k.id); await loadData() }
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>

  return (
    <main className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] flex flex-col items-center px-5 pt-6 pb-24">
      <header className="w-full max-w-md mx-auto flex justify-between items-center mb-6">
        <div>
          <h1 className="font-bold text-[16px] text-blue-700 uppercase tracking-wider">DATABASE KATEGORI</h1>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">MANAJER TIPE TRANSAKSI</p>
        </div>
        <Link href="/" className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-[10px] font-bold shadow-sm hover:bg-gray-50">KEMBALI</Link>
      </header>

      <div className="w-full max-w-md mx-auto flex flex-col gap-3">
        {kategoriList.map(k => {
          const isSystem = k.nama_kategori === 'CICILAN BANK' || k.nama_kategori === 'BAYAR UTANG PRIBADI'
          return (
            <div key={k.id} onClick={() => !isSystem && handleAksi(k)} className={`p-4 rounded-[1.2rem] border shadow-sm flex justify-between items-center transition-all ${isSystem ? 'bg-gray-50 border-gray-200 opacity-70' : 'bg-white border-blue-100 cursor-pointer hover:border-blue-300 active:scale-95'}`}>
              <div className="flex flex-col">
                <span className="font-bold text-[12px] uppercase">{k.nama_kategori}</span>
                <span className={`text-[9px] font-bold mt-1 tracking-widest ${k.tipe === 'PEMASUKAN' ? 'text-green-600' : 'text-red-600'}`}>TIPE: {k.tipe}</span>
              </div>
              {isSystem && <span className="text-[7px] font-bold bg-gray-200 text-gray-500 px-2 py-1 rounded border border-gray-300 uppercase tracking-widest">SISTEM TERKUNCI</span>}
            </div>
          )
        })}
      </div>

      <button onClick={handleTambah} className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 z-50">
        <span className="text-2xl font-bold">+</span>
      </button>
    </main>
  )
}