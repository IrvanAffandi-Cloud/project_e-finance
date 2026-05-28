'use client'
import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import Link from 'next/link'
import { getRadarDashboard, tambahUtang, bayarUtang, hapusUtang, getKategori, tambahKategori, tambahTransaksiHarian } from '@/app/actions'

export default function PeroranganPage() {
  const [utang, setUtang] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const res = await getRadarDashboard()
      setUtang(res.utang || [])
      setLoading(false)
    } catch (error) {
      window.location.href = '/'
    }
  }

  useEffect(() => { loadData() }, [])

  const baseSwalClass = {
    popup: '!rounded-[1.5rem] !p-5 !border !border-gray-200 !shadow-2xl',
    title: 'text-[13px] font-bold text-[#1D1D1F] uppercase',
    confirmButton: '!bg-gradient-to-br !from-[#6B21A8] !to-[#A855F7] !text-white !font-bold !text-[10px] !px-5 !py-3 !rounded-xl !uppercase w-full hover:!shadow-lg active:!scale-95 transition-all',
    cancelButton: '!bg-white !text-gray-500 !border !border-gray-200 !font-bold !text-[10px] !px-5 !py-3 !rounded-xl !uppercase w-full hover:!bg-gray-50 active:!scale-95 transition-all',
    actions: 'flex gap-3 mt-4 w-full'
  }

  const handleTambah = async () => {
    const htmlForm = `
      <input id="swal-nama" type="text" placeholder="Nama" class="w-full h-12 px-4 mb-3 bg-[#F5F5F7] border border-gray-200 rounded-xl text-center font-bold text-[#1D1D1F] uppercase outline-none focus:border-purple-500">
      <input id="swal-pokok" type="text" inputmode="numeric" oninput="this.value = this.value.replace(/[^0-9]/g, '').replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.')" placeholder="Jumlah" class="w-full h-12 px-4 mb-3 bg-[#F5F5F7] border border-gray-200 rounded-xl text-center font-bold text-[#1D1D1F] outline-none focus:border-purple-500">
      <p class="text-[9px] font-bold text-gray-400 mt-2 mb-1">JATUH TEMPO :</p>
      <input id="swal-tempo" type="date" class="w-full h-12 px-4 bg-[#F5F5F7] border border-gray-200 rounded-xl text-center font-bold text-sm text-[#1D1D1F] outline-none focus:border-purple-500">
    `
    const { value: form } = await Swal.fire({
      title: 'CATAT UTANG', html: htmlForm, showCancelButton: true, confirmButtonText: 'SIMPAN', cancelButtonText: 'BATAL', customClass: baseSwalClass, buttonsStyling: false,
      preConfirm: () => {
        const nama = (document.getElementById('swal-nama') as HTMLInputElement).value
        const rawPokok = (document.getElementById('swal-pokok') as HTMLInputElement).value.replace(/\./g, '')
        const pokok = Number(rawPokok)
        const tempo = (document.getElementById('swal-tempo') as HTMLInputElement).value
        
        if (!nama || !pokok || !tempo) { Swal.showValidationMessage('SEMUA DATA WAJIB DIISI!'); return false }
        return { nama, pokok, tempo }
      }
    })

    if (form) { setLoading(true); await tambahUtang(form.nama, form.pokok, form.tempo); await loadData() }
  }

  const handleBayar = async (id: string, nama: string, sisa_sekarang: number) => {
    const { value: nominal } = await Swal.fire({
      title: `BAYAR KE ${nama}`,
      input: 'text',
      inputValue: new Intl.NumberFormat('id-ID').format(sisa_sekarang),
      inputPlaceholder: 'NOMINAL BAYAR (Rp)',
      inputAttributes: {
        inputmode: 'numeric',
        oninput: "this.value = this.value.replace(/[^0-9]/g, '').replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.')"
      },
      showCancelButton: true, confirmButtonText: 'BAYAR SEKARANG', cancelButtonText: 'BATAL', customClass: baseSwalClass, buttonsStyling: false,
      preConfirm: (val) => {
        const cleanVal = Number(val.replace(/\./g, ''))
        if (!cleanVal || cleanVal <= 0) { Swal.showValidationMessage('NOMINAL TIDAK VALID!'); return false }
        return cleanVal
      }
    })

    if (nominal) {
      setLoading(true)

      // 1. Bayar utangnya di tabel utang
      await bayarUtang(id, sisa_sekarang, nominal)

      // 2. Cari/Bikin kategori khusus pemotong saldo
      let katRes = await getKategori()
      let katId = katRes.kategori?.find((k: any) => k.nama_kategori === 'BAYAR UTANG PRIBADI')?.id
      if (!katId) {
        await tambahKategori('BAYAR UTANG PRIBADI', 'PENGELUARAN')
        katRes = await getKategori()
        katId = katRes.kategori?.find((k: any) => k.nama_kategori === 'BAYAR UTANG PRIBADI')?.id
      }

      // 3. Potong Saldo Aktif secara otomatis
      await tambahTransaksiHarian(nominal, `BAYAR UTANG KE: ${nama}`, katId)

      await Swal.fire({ title: 'TERBAYAR!', icon: 'success', timer: 1500, showConfirmButton: false })
      await loadData()
    }
  }

  const handleHapus = async (id: string) => {
    const res = await Swal.fire({ title: 'HAPUS DATA UTANG?', text: 'Data akan hilang permanen!', icon: 'warning', showCancelButton: true, confirmButtonText: 'HAPUS', cancelButtonText: 'BATAL', customClass: { ...baseSwalClass, confirmButton: '!bg-red-600 !text-white !font-bold !text-[10px] !px-5 !py-3 !rounded-xl !uppercase w-full hover:!bg-red-700 transition-all' }, buttonsStyling: false })
    if (res.isConfirmed) { setLoading(true); await hapusUtang(id); await loadData() }
  }

  const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka)

  if (loading) return <div className="min-h-screen bg-[#FBFBFD] flex items-center justify-center"><div className="w-8 h-8 border-[3px] border-purple-500 border-t-transparent rounded-full animate-spin"></div></div>

  return (
    <main className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] flex flex-col font-sans pb-24 selection:bg-purple-100">
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 px-5 py-4 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="font-bold text-[15px] uppercase tracking-wider text-purple-800">UTANG PERORANGAN</h1>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5"></p>
        </div>
        <Link href="/dashboard" className="h-8 px-4 flex items-center justify-center bg-[#F5F5F7] border border-gray-200 hover:bg-gray-200 text-[#1D1D1F] font-bold text-[9px] uppercase rounded-full transition-all active:scale-95 shadow-sm">
          KEMBALI
        </Link>
      </header>

      <div className="w-full max-w-2xl mx-auto px-5 mt-6 flex flex-col gap-4">
        {utang.length === 0 ? (
          <div className="bg-white border border-purple-100 rounded-[1.5rem] p-8 text-center shadow-sm">
            <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">TIDAK ADA UTANG</p>
          </div>
        ) : (
          utang.map((u) => (
            <div key={u.id} className="bg-white border border-purple-100 rounded-[1.2rem] p-5 flex flex-col shadow-sm hover:shadow-md transition-all gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-purple-50 rounded-bl-full -z-0"></div>

              <div className="flex justify-between items-start relative z-10">
                <div>
                  <h2 className="font-bold text-[14px] uppercase tracking-wide text-[#1D1D1F]">{u.nama_kreditur}</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">
                    Jumlah : <span className="text-purple-600">{formatRupiah(Number(u.sisa_utang))}</span>
                  </p>
                </div>
                <button onClick={() => handleHapus(u.id)} className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-600 rounded-lg hover:bg-red-100 active:scale-95 transition-all text-xs border border-red-100">🗑️</button>
              </div>

              <div className="flex items-center justify-between bg-[#F5F5F7] p-3 rounded-xl border border-gray-200 relative z-10">
                <div className="flex flex-col text-right w-full">
                  <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">JATUH TEMPO</p>
                  <p className="font-bold text-[12px] text-red-600 mt-0.5">
                    {new Date(u.tanggal_jatuh_tempo).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <button onClick={() => handleBayar(u.id, u.nama_kreditur, Number(u.sisa_utang))} className="w-full h-12 bg-gradient-to-br from-purple-700 to-purple-500 text-white font-bold text-[10px] uppercase rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all relative z-10 tracking-widest">
                BAYAR
              </button>
            </div>
          ))
        )}
      </div>

      <button onClick={handleTambah} className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-purple-700 to-purple-500 text-white rounded-2xl flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all z-50 border border-purple-800">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
      </button>
    </main>
  )
}