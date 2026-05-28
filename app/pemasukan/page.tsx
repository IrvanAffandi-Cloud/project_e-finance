'use client'
import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import Link from 'next/link'
import { getKategori, tambahTransaksiHarian, getTransaksiHarian, hapusTransaksiHarian, editTransaksiHarian } from '@/app/actions'

export default function PemasukanPage() {
  const [kategoriList, setKategoriList] = useState<any[]>([])
  const [transaksi, setTransaksi] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    const [katRes, txRes] = await Promise.all([getKategori(), getTransaksiHarian()])
    setKategoriList((katRes.kategori || []).filter((k: any) => k.tipe === 'PEMASUKAN'))
    // LIMITASI UI: Potong paksa, cuma render 50 baris teratas biar RAM HP ga jebol
    setTransaksi((txRes.transaksi || []).filter((t: any) => t.kategori?.tipe === 'PEMASUKAN').slice(0, 50))
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const handleSimpan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const rawNominal = (form.elements.namedItem('nominal') as HTMLInputElement).value.replace(/\./g, '')
    const nominal = Number(rawNominal)
    const katId = (form.elements.namedItem('kategori') as HTMLSelectElement).value
    const catatan = (form.elements.namedItem('catatan') as HTMLInputElement).value

    if (!nominal || !katId) return Swal.fire('GAGAL', 'NOMINAL & KATEGORI WAJIB DIISI!', 'error')

    Swal.showLoading()
    const res = await tambahTransaksiHarian(nominal, catatan, katId)
    if (res.success) {
      form.reset()
      await loadData()
      Swal.fire({ title: 'TERCATAT!', icon: 'success', timer: 1000, showConfirmButton: false })
    } else {
      Swal.fire('ERROR', res.message, 'error')
    }
  }

  const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka)

  const handleAksi = async (t: any) => {
    const aksi = await Swal.fire({
      title: 'OPSI DATA', text: `${t.kategori?.nama_kategori} - ${formatRupiah(t.nominal)}`,
      showCancelButton: true, showDenyButton: true, confirmButtonText: 'EDIT', denyButtonText: 'HAPUS', cancelButtonText: 'BATAL',
      customClass: { popup: '!rounded-[1.5rem] !p-5', confirmButton: '!bg-green-600 !text-white !font-bold !rounded-xl !px-5 !py-3 w-full mb-2', denyButton: '!bg-red-600 !text-white !font-bold !rounded-xl !px-5 !py-3 w-full mb-2', cancelButton: '!bg-gray-100 !text-gray-500 !font-bold !rounded-xl !px-5 !py-3 w-full', actions: '!flex !flex-col w-full' }, buttonsStyling: false
    })

    if (aksi.isConfirmed) {
      const optionsHtml = kategoriList.map(k => `<option value="${k.id}" ${k.id === t.kategori_id ? 'selected' : ''}>${k.nama_kategori}</option>`).join('')
      const { value: formEdit } = await Swal.fire({
        title: 'EDIT PEMASUKAN',
        html: `<input id="swal-edit-nom" type="text" inputmode="numeric" value="${new Intl.NumberFormat('id-ID').format(t.nominal)}" oninput="this.value = this.value.replace(/[^0-9]/g, '').replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.')" class="w-full h-12 px-4 mb-3 bg-[#F5F5F7] border border-gray-200 rounded-xl text-center font-bold outline-none focus:border-green-500"><select id="swal-edit-kat" class="w-full h-12 px-4 mb-3 bg-[#F5F5F7] border border-gray-200 rounded-xl text-center font-bold outline-none text-gray-500 uppercase">${optionsHtml}</select><input id="swal-edit-cat" type="text" value="${t.catatan || ''}" class="w-full h-12 px-4 bg-[#F5F5F7] border border-gray-200 rounded-xl text-center font-bold text-xs uppercase outline-none focus:border-green-500">`,
        showCancelButton: true, confirmButtonText: 'SIMPAN',
        customClass: { confirmButton: '!bg-green-600 !text-white !font-bold !w-full !rounded-xl !py-3 !mt-3', cancelButton: '!bg-gray-100 !text-gray-500 !font-bold !w-full !rounded-xl !py-3 !mt-3', popup: '!rounded-[1.5rem]' }, buttonsStyling: false,
        preConfirm: () => {
          const nom = Number((document.getElementById('swal-edit-nom') as HTMLInputElement).value.replace(/\./g, ''))
          const kat = (document.getElementById('swal-edit-kat') as HTMLSelectElement).value
          const cat = (document.getElementById('swal-edit-cat') as HTMLInputElement).value
          if (!nom || !kat) return Swal.showValidationMessage('DATA TIDAK VALID!')
          return { nom, kat, cat }
        }
      })
      if (formEdit) { Swal.showLoading(); await editTransaksiHarian(t.id, formEdit.nom, formEdit.cat, formEdit.kat); await loadData() }
    } else if (aksi.isDenied) {
      const hapus = await Swal.fire({ title: 'YAKIN HAPUS?', icon: 'warning', showCancelButton: true, confirmButtonText: 'HAPUS', customClass: { confirmButton: '!bg-red-600 !text-white !font-bold !rounded-xl !px-5 !py-3', cancelButton: '!bg-gray-100 !text-gray-500 !font-bold !rounded-xl !px-5 !py-3' }, buttonsStyling: false })
      if (hapus.isConfirmed) { Swal.showLoading(); await hapusTransaksiHarian(t.id); await loadData() }
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-[3px] border-green-500 border-t-transparent rounded-full animate-spin"></div></div>

  return (
    <main className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] flex flex-col items-center px-5 pt-6 pb-20">
      <header className="w-full max-w-md flex justify-between items-center mb-6">
        <h1 className="font-bold text-[16px] uppercase tracking-wider text-green-600">PEMASUKAN</h1>
        <Link href="/" className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-[10px] font-bold shadow-sm hover:bg-gray-50">KEMBALI</Link>
      </header>

      <div className="w-full max-w-md bg-white p-6 rounded-[1.5rem] shadow-sm border border-gray-100 mb-6">
        <form onSubmit={handleSimpan} className="flex flex-col gap-4">
          <input name="nominal" type="text" inputMode="numeric" onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.') }} placeholder="NOMINAL" className="w-full h-14 px-4 bg-[#F5F5F7] border border-gray-200 rounded-xl text-center font-bold text-lg outline-none focus:border-green-500 tracking-wider" />
          <select name="kategori" defaultValue="" className="w-full h-14 px-4 bg-[#F5F5F7] border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-green-500 text-center text-gray-500 uppercase">
            <option value="" disabled>SUMBER DANA</option>
            {kategoriList.map(k => <option key={k.id} value={k.id}>{k.nama_kategori}</option>)}
          </select>
          <input name="catatan" type="text" placeholder="CATATAN (OPSIONAL)" className="w-full h-14 px-4 bg-[#F5F5F7] border border-gray-200 rounded-xl text-center font-bold text-xs uppercase outline-none focus:border-green-500" />
          <button type="submit" className="w-full h-14 bg-gradient-to-br from-green-600 to-green-500 text-white font-bold text-[11px] uppercase rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all mt-2 tracking-widest">
            SIMPAN DATA
          </button>
        </form>
      </div>

      <div className="w-full max-w-md flex flex-col gap-3">
        <div className="flex justify-between items-end ml-1 mb-1">
          <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">RIWAYAT (50 TERBARU)</h2>
          {transaksi.length > 0 && (
            <span className="text-[11px] font-bold text-green-600">
              TOTAL: {formatRupiah(transaksi.reduce((acc, curr) => acc + Number(curr.nominal), 0))}
            </span>
          )}
        </div>
        {transaksi.length === 0 ? <p className="text-[10px] font-bold text-gray-400 text-center py-4">BELUM ADA DATA</p> : 
          transaksi.map(t => (
            <div key={t.id} onClick={() => handleAksi(t)} className="bg-white p-4 rounded-[1.2rem] border border-gray-100 shadow-sm flex justify-between items-center cursor-pointer active:scale-95 hover:border-green-200 transition-all">
              <div className="flex flex-col">
                <span className="font-bold text-[12px] text-[#1D1D1F] uppercase">{t.kategori?.nama_kategori}</span>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{t.catatan || '-'}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-bold text-[13px] text-green-600">{formatRupiah(t.nominal)}</span>
                <span className="text-[8px] font-bold text-gray-400 uppercase mt-1">{new Date(t.waktu_transaksi).toLocaleDateString('id-ID')}</span>
              </div>
            </div>
          ))
        }
      </div>
    </main>
  )
}