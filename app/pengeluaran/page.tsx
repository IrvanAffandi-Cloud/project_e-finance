'use client'
import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import Link from 'next/link'
import { getKategori, tambahTransaksiHarian, getTransaksiHarian, hapusTransaksiHarian, editTransaksiHarian } from '@/app/actions'

export default function PengeluaranPage() {
  const [kategoriList, setKategoriList] = useState<any[]>([])
  const [transaksi, setTransaksi] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    const [katRes, txRes] = await Promise.all([getKategori(), getTransaksiHarian()])
    setKategoriList((katRes.kategori || []).filter((k: any) => k.tipe === 'PENGELUARAN'))
    setTransaksi((txRes.transaksi || []).filter((t: any) => t.kategori?.tipe === 'PENGELUARAN').slice(0, 50))
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  // SIPEKAT SWEETALERT STYLE
  const baseSwalClass = { popup: '!max-w-[380px] !rounded-[2rem] border border-gray-200 shadow-2xl bg-white p-5', title: 'text-[#1D1D1F] font-black uppercase text-[12px] tracking-widest mb-3', actions: 'w-full flex flex-col gap-2 mt-4', confirmButton: 'w-full h-10 flex items-center justify-center bg-orange-600 text-white font-black text-[10px] tracking-[0.15em] uppercase px-5 rounded-xl shadow-sm hover:bg-orange-700 active:scale-95 transition-all duration-200', cancelButton: 'w-full h-10 flex items-center justify-center bg-[#F5F5F7] text-gray-500 font-black text-[10px] tracking-[0.15em] uppercase px-5 rounded-xl hover:bg-gray-200 active:scale-95 transition-all duration-200' }

  const handleSimpan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const rawNominal = (form.elements.namedItem('nominal') as HTMLInputElement).value.replace(/\./g, '')
    const nominal = Number(rawNominal)
    const katId = (form.elements.namedItem('kategori') as HTMLSelectElement).value
    const catatan = (form.elements.namedItem('catatan') as HTMLInputElement).value

    const kategoriTerpilih = kategoriList.find(k => k.id === katId)
    if (kategoriTerpilih?.nama_kategori === 'CICILAN BANK' || kategoriTerpilih?.nama_kategori === 'BAYAR UTANG PRIBADI') {
      return Swal.fire({ title: 'DITOLAK!', text: 'Kategori khusus Mesin Otomatis!', icon: 'error', customClass: baseSwalClass, buttonsStyling: false })
    }

    if (!nominal || !katId) return Swal.fire({ title: 'GAGAL', text: 'NOMINAL & KATEGORI WAJIB DIISI!', icon: 'error', customClass: baseSwalClass, buttonsStyling: false })

    Swal.showLoading()
    const res = await tambahTransaksiHarian(nominal, catatan, katId)
    if (res.success) {
      form.reset()
      await loadData()
      Swal.fire({ title: 'TERCATAT!', icon: 'success', timer: 1000, showConfirmButton: false })
    } else {
      Swal.fire({ title: 'ERROR', text: res.message, icon: 'error', customClass: baseSwalClass, buttonsStyling: false })
    }
  }

  const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka)

  const handleAksi = async (t: any) => {
    if (t.kategori?.nama_kategori === 'CICILAN BANK' || t.kategori?.nama_kategori === 'BAYAR UTANG PRIBADI') {
      return Swal.fire({ title: 'TERKUNCI', text: 'Dikontrol sistem Cicilan/Utang. Tidak bisa diedit manual!', icon: 'error', customClass: baseSwalClass, buttonsStyling: false })
    }

    const aksi = await Swal.fire({
      title: 'OPSI DATA', text: `${t.kategori?.nama_kategori} - ${formatRupiah(t.nominal)}`,
      showCancelButton: true, showDenyButton: true, confirmButtonText: 'EDIT DATA', denyButtonText: 'HAPUS DATA', cancelButtonText: 'BATAL',
      customClass: { popup: baseSwalClass.popup, title: baseSwalClass.title, confirmButton: baseSwalClass.confirmButton.replace('bg-orange-600', 'bg-blue-600').replace('hover:bg-orange-700', 'hover:bg-blue-700'), denyButton: baseSwalClass.confirmButton.replace('bg-orange-600', 'bg-red-600').replace('hover:bg-orange-700', 'hover:bg-red-700'), cancelButton: baseSwalClass.cancelButton, actions: baseSwalClass.actions }, buttonsStyling: false
    })

    if (aksi.isConfirmed) {
      const optionsHtml = kategoriList
        .filter(k => k.nama_kategori !== 'CICILAN BANK' && k.nama_kategori !== 'BAYAR UTANG PRIBADI')
        .map(k => `<option value="${k.id}" ${k.id === t.kategori_id ? 'selected' : ''}>${k.nama_kategori}</option>`).join('')
        
      const { value: formEdit } = await Swal.fire({
        title: 'EDIT PENGELUARAN',
        html: `<input id="swal-edit-nom" type="text" inputmode="numeric" value="${new Intl.NumberFormat('id-ID').format(t.nominal)}" oninput="this.value = this.value.replace(/[^0-9]/g, '').replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.')" class="w-full h-10 px-4 mb-2 bg-[#F5F5F7] border border-transparent focus:border-red-400 focus:bg-white rounded-xl text-center font-black outline-none text-[12px]"><select id="swal-edit-kat" class="w-full h-10 px-4 mb-2 bg-[#F5F5F7] border border-transparent focus:border-red-400 focus:bg-white rounded-xl text-center font-black outline-none text-[10px] text-gray-600 uppercase tracking-widest">${optionsHtml}</select><input id="swal-edit-cat" type="text" value="${t.catatan || ''}" class="w-full h-10 px-4 bg-[#F5F5F7] border border-transparent focus:border-red-400 focus:bg-white rounded-xl text-center font-black text-[10px] uppercase outline-none placeholder:text-gray-400">`,
        showCancelButton: true, confirmButtonText: 'SIMPAN', customClass: baseSwalClass, buttonsStyling: false,
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
      const hapus = await Swal.fire({ title: 'YAKIN HAPUS?', icon: 'warning', showCancelButton: true, confirmButtonText: 'HAPUS', customClass: { ...baseSwalClass, confirmButton: baseSwalClass.confirmButton.replace('bg-orange-600', 'bg-red-600').replace('hover:bg-orange-700', 'hover:bg-red-700') }, buttonsStyling: false })
      if (hapus.isConfirmed) { Swal.showLoading(); await hapusTransaksiHarian(t.id); await loadData() }
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-[3px] border-red-500 border-t-transparent rounded-full animate-spin"></div></div>

  return (
    <main className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] flex flex-col font-sans pb-20 selection:bg-red-200 overflow-x-hidden items-center">
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shine-glossy { 0% { transform: translateX(-100%) skewX(-20deg); } 100% { transform: translateX(200%) skewX(-20deg); } }
      `}} />

      {/* HEADER SLIM GLOSSY SIPEKAT (ORANGE/RED) */}
      <header className="sticky top-0 z-50 w-full h-[68px] rounded-b-[2.5rem] bg-gradient-to-br from-orange-600 via-red-500 to-red-600 shadow-[0_10px_30px_rgba(239,68,68,0.3)] border-b border-red-300/40 overflow-hidden flex flex-col items-center justify-center pt-1">
        <div className="absolute top-0 h-full w-[50%] bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shine-glossy_4s_infinite]"></div>
        
        <div className="w-full max-w-xl relative flex flex-col items-center justify-center">
          <Link href="/" className="absolute top-1/2 -translate-y-1/2 left-4 w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 hover:bg-white/30 active:scale-95 transition-all z-10">
            <svg className="w-4 h-4 text-white pr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
          </Link>
          
          <h1 className="text-white font-black text-[13px] tracking-[0.4em] uppercase drop-shadow-md z-10 leading-none">PENGELUARAN</h1>
          <p className="text-red-100 text-[8px] font-black tracking-[0.3em] uppercase opacity-90 mt-1 z-10 leading-none">PENCATATAN DANA KELUAR</p>
        </div>
      </header>

      <div className="w-full max-w-xl px-4 mt-6 flex flex-col gap-4">
        
        {/* FORM SIPEKAT STYLE (COMPACT & SLIM) */}
        <div className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-gray-200 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-[9px] font-black tracking-widest uppercase text-gray-400">INPUT DATA BARU</h2>
            <span className="font-black text-[10px] text-red-500">-</span>
          </div>

          <form onSubmit={handleSimpan} className="flex flex-col gap-2">
            <input name="nominal" type="text" inputMode="numeric" onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.') }} placeholder="NOMINAL (RP)" className="w-full h-10 px-3 bg-[#F5F5F7] border border-transparent rounded-xl text-center font-black text-[12px] outline-none focus:border-red-400 focus:bg-white tracking-widest transition-all placeholder:text-gray-400 placeholder:font-bold" />
            
            <select name="kategori" defaultValue="" className="w-full h-10 px-3 bg-[#F5F5F7] border border-transparent rounded-xl text-center font-black text-[10px] outline-none focus:border-red-400 focus:bg-white text-gray-600 uppercase tracking-widest transition-all">
              <option value="" disabled>-- PILIH KATEGORI --</option>
              {kategoriList.filter(k => k.nama_kategori !== 'CICILAN BANK' && k.nama_kategori !== 'BAYAR UTANG PRIBADI').map(k => <option key={k.id} value={k.id}>{k.nama_kategori}</option>)}
            </select>
            
            <input name="catatan" type="text" placeholder="CATATAN / DESKRIPSI" className="w-full h-10 px-3 bg-[#F5F5F7] border border-transparent rounded-xl text-center font-black text-[10px] uppercase outline-none focus:border-red-400 focus:bg-white transition-all placeholder:text-gray-400 placeholder:font-bold tracking-widest" />
            
            <button type="submit" className="w-full h-10 bg-orange-600 text-white font-black text-[10px] uppercase rounded-xl shadow-sm hover:bg-orange-700 active:scale-95 transition-all mt-1 tracking-[0.15em]">
              SIMPAN DATA
            </button>
          </form>
        </div>

        {/* LIST HISTORY SIPEKAT STYLE */}
        <div className="flex flex-col gap-1.5 mt-2">
          <div className="flex justify-between items-end ml-1 mb-1 border-b border-gray-200 pb-1">
            <h2 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">RIWAYAT (50 TERBARU)</h2>
            {transaksi.length > 0 && (
              <span className="text-[10px] font-black text-red-600 tracking-tight">
                TOTAL: {formatRupiah(transaksi.reduce((acc, curr) => acc + Number(curr.nominal), 0))}
              </span>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-[1.2rem] shadow-sm overflow-hidden flex flex-col">
            {transaksi.length === 0 ? <p className="text-[9px] font-black tracking-[0.2em] text-gray-400 text-center py-6">BELUM ADA DATA</p> : 
              transaksi.map((t, i) => {
                const isSystemLocked = t.kategori?.nama_kategori === 'CICILAN BANK' || t.kategori?.nama_kategori === 'BAYAR UTANG PRIBADI'
                return (
                  <div key={t.id} onClick={() => !isSystemLocked && handleAksi(t)} className={`flex justify-between items-center px-4 py-3 border-b border-gray-100 last:border-b-0 transition-colors ${isSystemLocked ? 'bg-gray-50/50 opacity-80' : 'cursor-pointer hover:bg-red-50 active:bg-red-100'}`}>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-[11px] text-[#1D1D1F] uppercase tracking-tight">{t.kategori?.nama_kategori}</span>
                        {isSystemLocked && <span className="text-[6px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded border border-red-200 uppercase tracking-widest">AUTO</span>}
                      </div>
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.1em] mt-0.5">{t.catatan || '-'}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-black text-[12px] text-red-600 tracking-tight">{formatRupiah(t.nominal)}</span>
                      <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest mt-1">{new Date(t.waktu_transaksi).toLocaleDateString('id-ID')}</span>
                    </div>
                  </div>
                )
              })
            }
          </div>
        </div>

      </div>
    </main>
  )
}