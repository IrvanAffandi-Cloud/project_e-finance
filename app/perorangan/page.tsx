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

  const baseSwalClass = { popup: '!rounded-[1.5rem] !p-5', confirmButton: '!bg-purple-600 !text-white !font-bold !text-[10px] !px-5 !py-3 !rounded-xl !uppercase w-full mb-2', cancelButton: '!bg-gray-100 !text-gray-500 !font-bold !text-[10px] !px-5 !py-3 !rounded-xl !uppercase w-full', actions: '!flex !flex-col w-full mt-4' }

  const handleTambah = async () => {
    const htmlForm = `<input id="swal-nama" type="text" placeholder="NAMA KREDITUR" class="w-full h-12 px-4 mb-3 bg-[#F5F5F7] border border-gray-200 rounded-xl text-center font-bold uppercase outline-none focus:border-purple-500 text-[12px]"><input id="swal-pokok" type="text" inputmode="numeric" oninput="this.value = this.value.replace(/[^0-9]/g, '').replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.')" placeholder="JUMLAH UTANG (Rp)" class="w-full h-12 px-4 mb-3 bg-[#F5F5F7] border border-gray-200 rounded-xl text-center font-bold outline-none focus:border-purple-500 text-[12px]"><p class="text-[9px] font-bold text-gray-400 mt-2 mb-1">JATUH TEMPO :</p><input id="swal-tempo" type="date" class="w-full h-12 px-4 bg-[#F5F5F7] border border-gray-200 rounded-xl text-center font-bold outline-none focus:border-purple-500 text-[12px]">`
    const { value: form } = await Swal.fire({
      title: 'CATAT UTANG', html: htmlForm, showCancelButton: true, confirmButtonText: 'SIMPAN', cancelButtonText: 'BATAL', customClass: baseSwalClass, buttonsStyling: false,
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
      title: 'OPSI UTANG', text: `${u.nama_kreditur}`, showCancelButton: true, showDenyButton: true, confirmButtonText: 'BAYAR', denyButtonText: 'EDIT UTANG', cancelButtonText: 'BATAL / TUTUP',
      customClass: { popup: '!rounded-[1.5rem] !p-5', confirmButton: '!bg-green-600 !text-white !font-bold !rounded-xl !px-5 !py-3 w-full mb-2 text-[10px] tracking-widest uppercase', denyButton: '!bg-purple-600 !text-white !font-bold !rounded-xl !px-5 !py-3 w-full mb-2 text-[10px] tracking-widest uppercase', cancelButton: '!bg-gray-100 !text-gray-500 !font-bold !rounded-xl !px-5 !py-3 w-full text-[10px] tracking-widest uppercase', actions: '!flex !flex-col w-full' }, buttonsStyling: false
    })

    if (aksi.isConfirmed) {
      const { value: nominal } = await Swal.fire({
        title: `BAYAR KE ${u.nama_kreditur}`, html: `<input id="swal-bayar" type="text" inputmode="numeric" value="${new Intl.NumberFormat('id-ID').format(u.sisa_utang)}" oninput="this.value = this.value.replace(/[^0-9]/g, '').replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.')" class="w-full h-12 px-4 bg-[#F5F5F7] border border-gray-200 rounded-xl text-center font-bold outline-none focus:border-green-500 mt-2"><p class="text-[8px] font-bold text-red-500 mt-2 tracking-widest">*SALDO AKTIF AKAN DIPOTONG OTOMATIS</p>`, showCancelButton: true, confirmButtonText: 'BAYAR SEKARANG', cancelButtonText: 'BATAL', customClass: { ...baseSwalClass, confirmButton: '!bg-green-600 !text-white !font-bold !rounded-xl !py-3 w-full mb-2' }, buttonsStyling: false,
        preConfirm: () => {
          const val = Number((document.getElementById('swal-bayar') as HTMLInputElement).value.replace(/\./g, ''))
          if (!val || val <= 0) return Swal.showValidationMessage('NOMINAL TIDAK VALID!')
          return val
        }
      })
      if (nominal) {
        Swal.showLoading()
        await bayarUtang(u.id, Number(u.sisa_utang), nominal)
        let katRes = await getKategori()
        let katId = katRes.kategori?.find((k: any) => k.nama_kategori === 'BAYAR UTANG PRIBADI')?.id
        if (!katId) { await tambahKategori('BAYAR UTANG PRIBADI', 'PENGELUARAN'); katRes = await getKategori(); katId = katRes.kategori?.find((k: any) => k.nama_kategori === 'BAYAR UTANG PRIBADI')?.id }
        await tambahTransaksiHarian(nominal, `BAYAR UTANG KE: ${u.nama_kreditur}`, katId)
        await loadData(); Swal.fire({ title: 'TERBAYAR!', icon: 'success', timer: 1500, showConfirmButton: false })
      }
    } else if (aksi.isDenied) {
      const { value: formEdit } = await Swal.fire({
        title: 'EDIT UTANG', html: `<input id="swal-edit-nama" type="text" value="${u.nama_kreditur}" class="w-full h-12 px-4 mb-3 bg-[#F5F5F7] border border-gray-200 rounded-xl text-center font-bold uppercase outline-none focus:border-purple-500 text-[12px]"><input id="swal-edit-pokok" type="text" inputmode="numeric" value="${new Intl.NumberFormat('id-ID').format(u.sisa_utang)}" oninput="this.value = this.value.replace(/[^0-9]/g, '').replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.')" class="w-full h-12 px-4 mb-3 bg-[#F5F5F7] border border-gray-200 rounded-xl text-center font-bold outline-none focus:border-purple-500 text-[12px]"><input id="swal-edit-tempo" type="date" value="${new Date(u.tanggal_jatuh_tempo).toISOString().split('T')[0]}" class="w-full h-12 px-4 bg-[#F5F5F7] border border-gray-200 rounded-xl text-center font-bold outline-none focus:border-purple-500 text-[12px]"><button id="btn-hapus-utang" class="w-full mt-4 py-3 bg-red-50 text-red-600 font-bold text-[10px] uppercase rounded-xl border border-red-200">HAPUS DATA UTANG INI PERMANEN</button>`, showCancelButton: true, confirmButtonText: 'SIMPAN', cancelButtonText: 'BATAL', customClass: baseSwalClass, buttonsStyling: false,
        didOpen: () => { document.getElementById('btn-hapus-utang')?.addEventListener('click', async () => { const res = await Swal.fire({ title: 'HAPUS?', icon: 'warning', showCancelButton: true, confirmButtonText: 'HAPUS' }); if (res.isConfirmed) { Swal.showLoading(); await hapusUtang(u.id); await loadData(); Swal.close() } }) },
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

  // MESIN PENJUMLAH OTOMATIS
  const totalUtangAktif = utang.reduce((acc, curr) => acc + Number(curr.sisa_utang), 0)

  if (loading) return <div className="min-h-screen bg-[#FBFBFD] flex items-center justify-center"><div className="w-8 h-8 border-[3px] border-purple-600 border-t-transparent rounded-full animate-spin"></div></div>

  return (
    <main className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] flex flex-col font-sans pb-24 px-5 pt-6">
      <header className="w-full max-w-md mx-auto flex justify-between items-center mb-6">
        <div><h1 className="font-bold text-[16px] uppercase tracking-wider text-purple-700">UTANG PERORANGAN</h1></div>
        <Link href="/" className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-[10px] font-bold shadow-sm hover:bg-gray-50">KEMBALI</Link>
      </header>

      {/* PAPAN REKAP TOTAL (BARU) */}
      <div className="w-full max-w-md mx-auto bg-gradient-to-br from-purple-700 to-purple-900 p-5 rounded-[1.5rem] shadow-xl mb-5 flex flex-col relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <div className="relative z-10 flex flex-col">
          <p className="text-[9px] font-bold text-purple-300 uppercase tracking-widest mb-1">TOTAL SISA UTANG KESELURUHAN</p>
          <h2 className="text-2xl font-bold tracking-tight">{formatRupiah(totalUtangAktif)}</h2>
        </div>
      </div>

      <div className="w-full max-w-md mx-auto flex flex-col gap-4">
        {utang.length === 0 ? (<div className="bg-white border border-dashed border-gray-200 rounded-[1.5rem] py-10 text-center shadow-sm"><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">TIDAK ADA UTANG AKTIF</p></div>) 
        : utang.map((u) => (
          <div key={u.id} onClick={() => handleAksi(u)} className="bg-white border border-purple-100 rounded-[1.2rem] p-5 flex flex-col shadow-sm cursor-pointer hover:border-purple-300 active:scale-95 transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-50 rounded-bl-full -z-0"></div>
            <div className="relative z-10 flex flex-col">
              <h2 className="font-bold text-[14px] uppercase tracking-wide text-[#1D1D1F] mb-1">{u.nama_kreditur}</h2>
              <div className="flex justify-between items-end mt-2">
                <div className="flex flex-col"><p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">JATUH TEMPO</p><p className="font-bold text-[11px] text-red-500 mt-0.5">{new Date(u.tanggal_jatuh_tempo).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p></div>
                <div className="flex flex-col items-end"><p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">SISA UTANG</p><p className="font-bold text-[14px] text-purple-700 mt-0.5">{formatRupiah(Number(u.sisa_utang))}</p></div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={handleTambah} className="fixed bottom-6 right-6 w-14 h-14 bg-purple-600 text-white rounded-2xl flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all z-50"><span className="text-2xl font-bold">+</span></button>
    </main>
  )
}