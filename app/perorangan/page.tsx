'use client'
import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import Link from 'next/link'
import { getRadarDashboard, tambahUtang, bayarUtang, hapusUtang, editUtang, getKategori, tambahKategori, tambahTransaksiHarian } from '@/app/actions'

export default function PeroranganPage() {
  const [utang, setUtang] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const res = await getRadarDashboard()
      setUtang(res.utang || [])
      setLoading(false)
    } catch (error) { window.location.href = '/' }
  }
  useEffect(() => { loadData() }, [])

  // UBAH: actions jadi flex-row, semua tombol pakai flex-1 biar sejajar 1 baris
  const baseSwalClass = {
    popup: '!max-w-[380px] !rounded-[2rem] border border-gray-200 shadow-2xl bg-white p-5',
    title: 'text-[#1D1D1F] font-black uppercase text-[12px] tracking-widest mb-3',
    actions: 'w-full flex flex-row gap-2 mt-4',
    confirmButton: 'flex-1 h-10 flex items-center justify-center bg-[#0B214A] text-white font-black text-[9px] tracking-[0.1em] uppercase px-1 rounded-xl shadow-sm hover:bg-blue-900 active:scale-95 transition-all duration-200',
    cancelButton: 'flex-1 h-10 flex items-center justify-center bg-[#F5F5F7] text-gray-500 font-black text-[9px] tracking-[0.1em] uppercase px-1 rounded-xl hover:bg-gray-200 active:scale-95 transition-all duration-200',
    denyButton: 'flex-1 h-10 flex items-center justify-center bg-gray-200 text-[#1D1D1F] font-black text-[9px] tracking-[0.1em] uppercase px-1 rounded-xl hover:bg-gray-300 active:scale-95 transition-all duration-200'
  }

  const handleTambah = async () => {
    // UBAH: flex-row biar form inputnya nyamping (1 baris), tulisan dikecilin, padding dikurangi
    const htmlForm = `
      <div class="flex flex-row gap-2 text-left w-full">
        <input id="swal-nama" type="text" placeholder="NAMA" class="flex-1 w-full h-10 px-2 bg-[#F5F5F7] border border-transparent focus:border-blue-400 focus:bg-white rounded-xl text-center font-bold text-[9px] uppercase outline-none tracking-widest">
        <input id="swal-pokok" type="text" inputmode="numeric" oninput="this.value = this.value.replace(/[^0-9]/g, '').replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.')" placeholder="JUMLAH" class="flex-[1.2] w-full h-10 px-2 bg-[#F5F5F7] border border-transparent focus:border-blue-400 focus:bg-white rounded-xl text-center font-bold text-[10px] outline-none tracking-widest">
        <input id="swal-tempo" type="date" class="flex-1 w-full h-10 px-1 bg-[#F5F5F7] border border-transparent focus:border-blue-400 focus:bg-white rounded-xl text-center font-bold text-[9px] outline-none text-gray-500 tracking-widest">
      </div>
    `
    const { value: form } = await Swal.fire({ 
      title: 'CATAT UTANG BARU', html: htmlForm, showCancelButton: true, confirmButtonText: 'SIMPAN', cancelButtonText: 'BATAL', customClass: baseSwalClass, buttonsStyling: false,
      preConfirm: () => {
        const nama = (document.getElementById('swal-nama') as HTMLInputElement).value
        const pokok = Number((document.getElementById('swal-pokok') as HTMLInputElement).value.replace(/\./g, ''))
        const tempo = (document.getElementById('swal-tempo') as HTMLInputElement).value
        if (!nama || !pokok || !tempo) return Swal.showValidationMessage('DATA WAJIB DIISI!')
        return { nama, pokok, tempo }
      }
    })
    if (form) { Swal.showLoading(); await tambahUtang(form.nama, form.pokok, form.tempo); await loadData() }
  }

  const handleAksi = async (u: any) => {
    const aksi = await Swal.fire({
      title: 'OPSI UTANG', text: `${u.nama_kreditur}`, showCancelButton: true, showDenyButton: true, confirmButtonText: 'BAYAR', denyButtonText: 'EDIT', cancelButtonText: 'BATAL',
      customClass: { popup: baseSwalClass.popup, title: baseSwalClass.title, confirmButton: baseSwalClass.confirmButton.replace('bg-[#0B214A]', 'bg-green-600').replace('hover:bg-blue-900', 'hover:bg-green-700'), denyButton: baseSwalClass.denyButton, cancelButton: baseSwalClass.cancelButton, actions: baseSwalClass.actions }, buttonsStyling: false
    })

    if (aksi.isConfirmed) {
      const { value: nominal } = await Swal.fire({
        title: `BAYAR KE ${u.nama_kreditur}`, 
        html: `<div class="flex flex-col gap-2"><input id="swal-bayar" type="text" inputmode="numeric" value="${new Intl.NumberFormat('id-ID').format(u.sisa_utang)}" oninput="this.value = this.value.replace(/[^0-9]/g, '').replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.')" class="w-full h-10 px-4 bg-[#F5F5F7] border border-transparent rounded-xl text-center font-bold outline-none focus:border-green-500 text-[12px] tracking-widest"><p class="text-[8px] font-bold text-[#1D1D1F] tracking-widest text-center uppercase">*POTONG SALDO OTOMATIS</p></div>`, 
        showCancelButton: true, confirmButtonText: 'BAYAR SEKARANG', cancelButtonText: 'BATAL', customClass: { ...baseSwalClass, confirmButton: baseSwalClass.confirmButton.replace('bg-[#0B214A]', 'bg-green-600').replace('hover:bg-blue-900', 'hover:bg-green-700') }, buttonsStyling: false,
        preConfirm: () => {
          const val = Number((document.getElementById('swal-bayar') as HTMLInputElement).value.replace(/\./g, ''))
          if (!val || val <= 0) return Swal.showValidationMessage('NOMINAL TIDAK VALID!')
          return val
        }
      })
      if (nominal) {
        Swal.showLoading(); await bayarUtang(u.id, Number(u.sisa_utang), nominal);
        let katRes = await getKategori(); let katId = katRes.kategori?.find((k: any) => k.nama_kategori === 'BAYAR UTANG PRIBADI')?.id
        if (!katId) { await tambahKategori('BAYAR UTANG PRIBADI', 'PENGELUARAN'); katRes = await getKategori(); katId = katRes.kategori?.find((k: any) => k.nama_kategori === 'BAYAR UTANG PRIBADI')?.id }
        await tambahTransaksiHarian(nominal, `BAYAR UTANG KE: ${u.nama_kreditur}`, katId); await loadData(); Swal.fire({ title: 'TERBAYAR!', icon: 'success', timer: 1500, showConfirmButton: false })
      }
    } else if (aksi.isDenied) {
      const { value: formEdit } = await Swal.fire({
        title: 'EDIT UTANG', 
        html: `<div class="flex flex-col gap-2"><input id="swal-edit-nama" type="text" value="${u.nama_kreditur}" class="w-full h-10 px-4 bg-[#F5F5F7] border border-transparent rounded-xl text-center font-bold text-[10px] uppercase outline-none tracking-widest"><input id="swal-edit-pokok" type="text" inputmode="numeric" value="${new Intl.NumberFormat('id-ID').format(u.sisa_utang)}" oninput="this.value = this.value.replace(/[^0-9]/g, '').replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.')" class="w-full h-10 px-4 bg-[#F5F5F7] border border-transparent rounded-xl text-center font-bold text-[12px] outline-none tracking-widest"><input id="swal-edit-tempo" type="date" value="${new Date(u.tanggal_jatuh_tempo).toISOString().split('T')[0]}" class="w-full h-10 px-4 bg-[#F5F5F7] border border-transparent rounded-xl text-center font-bold text-[10px] outline-none tracking-widest"><button id="btn-hapus-utang" class="w-full mt-2 py-3 bg-red-50 text-red-600 font-bold text-[9px] uppercase rounded-xl border border-red-200 tracking-widest">HAPUS UTANG PERMANEN</button></div>`, 
        showCancelButton: true, confirmButtonText: 'SIMPAN', cancelButtonText: 'BATAL', customClass: baseSwalClass, buttonsStyling: false,
        didOpen: () => { document.getElementById('btn-hapus-utang')?.addEventListener('click', async () => { const res = await Swal.fire({ title: 'HAPUS?', icon: 'warning', showCancelButton: true, confirmButtonText: 'HAPUS', cancelButtonText: 'BATAL', customClass: { ...baseSwalClass, confirmButton: baseSwalClass.confirmButton.replace('bg-[#0B214A]', 'bg-red-600') }, buttonsStyling: false }); if (res.isConfirmed) { Swal.showLoading(); await hapusUtang(u.id); await loadData(); Swal.close() } }) },
        preConfirm: () => {
          const nama = (document.getElementById('swal-edit-nama') as HTMLInputElement).value
          const pokok = Number((document.getElementById('swal-edit-pokok') as HTMLInputElement).value.replace(/\./g, ''))
          const tempo = (document.getElementById('swal-edit-tempo') as HTMLInputElement).value
          if (!nama || !pokok || !tempo) return Swal.showValidationMessage('DATA WAJIB DIISI!')
          return { nama, pokok, tempo }
        }
      })
      if (formEdit) { Swal.showLoading(); await editUtang(u.id, formEdit.nama, formEdit.pokok, formEdit.tempo); await loadData() }
    }
  }

  const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka)
  const totalUtangAktif = utang.reduce((acc, curr) => acc + Number(curr.sisa_utang), 0)

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-[3px] border-purple-600 border-t-transparent rounded-full animate-spin"></div></div>

  return (
    <main className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] flex flex-col font-sans pb-24 items-center">
      <style dangerouslySetInnerHTML={{__html: ` @keyframes shine-glossy { 0% { transform: translateX(-100%) skewX(-20deg); } 100% { transform: translateX(200%) skewX(-20deg); } } `}} />

      <header className="sticky top-0 z-50 w-full h-[68px] rounded-b-[2.5rem] bg-gradient-to-br from-purple-800 via-purple-700 to-purple-900 shadow-[0_10px_30px_rgba(147,51,234,0.3)] border-b border-purple-400/40 overflow-hidden flex flex-col items-center justify-center pt-1">
        <div className="absolute top-0 h-full w-[50%] bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shine-glossy_4s_infinite]"></div>
        <div className="w-full max-w-xl relative flex flex-col items-center justify-center">
          <Link href="/" className="absolute top-1/2 -translate-y-1/2 left-4 w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 hover:bg-white/30 active:scale-95 transition-all z-10">
            <svg className="w-4 h-4 text-white pr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
          </Link>
          <h2 className="text-white font-black text-[17px] tracking-[0.4em] uppercase text-center drop-shadow-md z-10 leading-none mt-1">PERORANGAN</h2>
        </div>
      </header>

      <div className="w-full max-w-xl px-4 mt-6 flex flex-col gap-4">
        
        <div className="bg-white border border-gray-200 p-4 rounded-[1.2rem] shadow-sm flex justify-between items-center">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">TOTAL</p>
          <h2 className="text-[14px] font-black text-[#1D1D1F] tracking-tight">{formatRupiah(totalUtangAktif)}</h2>
        </div>

        <div className="bg-white border border-gray-200 rounded-[1.2rem] shadow-sm overflow-hidden flex flex-col">
          {utang.length === 0 ? (
            <p className="text-[10px] font-bold tracking-[0.2em] text-gray-400 text-center py-6 uppercase">TIDAK ADA DATA</p>
          ) : (
            utang.map((u) => (
              <div 
                key={u.id} 
                onClick={() => handleAksi(u)} 
                className="flex justify-between items-center px-4 py-2.5 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <div className="flex flex-col">
                  <h2 className="font-bold text-[12px] uppercase tracking-tight text-[#1D1D1F]">{u.nama_kreditur}</h2>
                  <p className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.1em] mt-0.5">
                    TEMPO: {new Date(u.tanggal_jatuh_tempo).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <p className="font-bold text-[12px] text-[#1D1D1F] tracking-tight">{formatRupiah(Number(u.sisa_utang))}</p>
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
