'use client'
import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import { getDashboardKas, logoutPemilik, getKategori, tambahTransaksi, editTransaksi, hapusTransaksi } from '@/app/actions'

export default function Dashboard() {
  const [transaksi, setTransaksi] = useState<any[]>([])
  const [kategoriList, setKategoriList] = useState<any[]>([])
  const [ringkasanKat, setRingkasanKat] = useState<any[]>([])
  const [stats, setStats] = useState({ saldo: 0, masuk: 0, keluar: 0 })
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const res = await getDashboardKas()
      const resKat = await getKategori()
      
      const txs = res.transaksi || []
      setTransaksi(txs)
      setKategoriList(resKat.kategori || [])

      let masuk = 0
      let keluar = 0
      const ringkasan: Record<string, any> = {}

      txs.forEach((t: any) => {
        const nom = Number(t.nominal)
        const katId = t.kategori_id
        
        if (t.kategori?.tipe === 'PEMASUKAN') masuk += nom
        if (t.kategori?.tipe === 'PENGELUARAN') keluar += nom

        if (t.kategori) {
          if (!ringkasan[katId]) ringkasan[katId] = { nama: t.kategori.nama, tipe: t.kategori.tipe, total: 0 }
          ringkasan[katId].total += nom
        }
      })
      
      setRingkasanKat(Object.values(ringkasan).sort((a, b) => b.total - a.total))
      setStats({ masuk, keluar, saldo: masuk - keluar })
      setLoading(false)
    } catch (error) {
      window.location.href = '/'
    }
  }

  useEffect(() => { loadData() }, [])

  const baseSwalClass = {
    popup: '!rounded-[1.5rem] !p-5',
    title: 'text-[13px] font-bold text-[#1D1D1F]',
    confirmButton: '!bg-[#1D1D1F] !text-white !font-bold !text-[10px] !px-5 !py-3 !rounded-xl !uppercase w-full hover:!bg-black active:!scale-95 transition-all',
    cancelButton: '!bg-white !text-gray-500 !border !border-gray-200 !font-bold !text-[10px] !px-5 !py-3 !rounded-xl !uppercase w-full hover:!bg-gray-50 active:!scale-95 transition-all',
    actions: 'flex gap-3 mt-4 w-full'
  }

  const handleLogout = async () => {
    const res = await Swal.fire({ title: 'KUNCI BRANKAS?', showCancelButton: true, confirmButtonText: 'KUNCI', cancelButtonText: 'BATAL', customClass: baseSwalClass, buttonsStyling: false })
    if (res.isConfirmed) { setLoading(true); await logoutPemilik(); window.location.href = '/' }
  }

  const formModalHTML = (nominal = '', catatan = '', katId = '') => {
    const opsiKategori = kategoriList.map(k => `<option value="${k.id}" ${k.id === katId ? 'selected' : ''}>${k.tipe === 'PEMASUKAN' ? '🟢' : '🔴'} ${k.nama}</option>`).join('')
    return `
      <input id="swal-nominal" type="number" value="${nominal}" placeholder="NOMINAL (Cth: 50000)" class="w-full h-12 px-4 mb-3 bg-[#F5F5F7] border border-gray-200 rounded-xl text-center font-bold text-[#1D1D1F] outline-none focus:border-gray-400">
      <select id="swal-kategori" class="w-full h-12 px-4 mb-3 bg-[#F5F5F7] border border-gray-200 rounded-xl font-bold text-[#1D1D1F] outline-none focus:border-gray-400">
        <option value="" disabled ${!katId ? 'selected' : ''}>PILIH KATEGORI</option>
        ${opsiKategori}
      </select>
      <input id="swal-catatan" type="text" value="${catatan}" placeholder="CATATAN (Opsional)" class="w-full h-12 px-4 bg-[#F5F5F7] border border-gray-200 rounded-xl text-center font-bold text-[11px] text-[#1D1D1F] uppercase outline-none focus:border-gray-400">
    `
  }

  const getFormValues = () => {
    const nominal = (document.getElementById('swal-nominal') as HTMLInputElement).value
    const kategori = (document.getElementById('swal-kategori') as HTMLSelectElement).value
    const catatan = (document.getElementById('swal-catatan') as HTMLInputElement).value
    if (!nominal || !kategori) { Swal.showValidationMessage('NOMINAL & KATEGORI WAJIB DIISI!'); return false }
    return { nominal: Number(nominal), kategori, catatan }
  }

  const handleTambah = async () => {
    const { value: formValues } = await Swal.fire({ title: 'CATAT TRANSAKSI', html: formModalHTML(), showCancelButton: true, confirmButtonText: 'SIMPAN', cancelButtonText: 'BATAL', customClass: baseSwalClass, buttonsStyling: false, preConfirm: getFormValues })
    if (formValues) { setLoading(true); await tambahTransaksi(formValues.nominal, formValues.catatan, formValues.kategori); await loadData() }
  }

  const handleEdit = async (tx: any) => {
    const { value: formValues } = await Swal.fire({ title: 'EDIT TRANSAKSI', html: formModalHTML(tx.nominal, tx.catatan, tx.kategori_id), showCancelButton: true, confirmButtonText: 'UPDATE', cancelButtonText: 'BATAL', customClass: baseSwalClass, buttonsStyling: false, preConfirm: getFormValues })
    if (formValues) { setLoading(true); await editTransaksi(tx.id, formValues.nominal, formValues.catatan, formValues.kategori); await loadData() }
  }

  const handleHapus = async (id: string) => {
    const res = await Swal.fire({ title: 'HAPUS TRANSAKSI?', text: 'Data tidak bisa dikembalikan!', icon: 'warning', showCancelButton: true, confirmButtonText: 'HAPUS', cancelButtonText: 'BATAL', customClass: { ...baseSwalClass, confirmButton: '!bg-red-600 !text-white !font-bold !text-[10px] !px-5 !py-3 !rounded-xl !uppercase w-full hover:!bg-red-700 transition-all' }, buttonsStyling: false })
    if (res.isConfirmed) { setLoading(true); await hapusTransaksi(id); await loadData() }
  }

  const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka)

  if (loading) return (
    <div className="min-h-screen bg-[#FBFBFD] flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-[3px] border-[#F5F5F7] border-t-[#1D1D1F] rounded-full animate-spin"></div>
      <p className="font-bold text-[10px] text-gray-500 uppercase animate-pulse tracking-widest">SINKRONISASI DATA...</p>
    </div>
  )

  return (
    <main className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] flex flex-col font-sans pb-24 selection:bg-gray-200 overflow-x-hidden">
      <style dangerouslySetInnerHTML={{ __html: `.custom-scrollbar::-webkit-scrollbar { height: 4px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }`}} />
      
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 px-5 py-4 flex justify-between items-center">
        <div>
          <h1 className="font-bold text-[15px] uppercase tracking-wider">E-FINANCE</h1>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">VAULT DASHBOARD</p>
        </div>
        <button onClick={handleLogout} className="h-8 px-4 bg-[#F5F5F7] border border-gray-200 hover:bg-gray-200 text-[#1D1D1F] font-bold text-[9px] uppercase rounded-full transition-all active:scale-95 shadow-sm">KUNCI</button>
      </header>

      <div className="w-full max-w-2xl mx-auto px-5 mt-6 flex flex-col gap-6">
        
        {/* KARTU SALDO UTAMA */}
        <div className="bg-[#1D1D1F] text-white rounded-[1.5rem] p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 relative z-10">SISA SALDO AKTIF</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight relative z-10">{formatRupiah(stats.saldo)}</h2>
          <div className="flex gap-4 mt-6 relative z-10">
            <div className="flex-1 bg-white/10 rounded-2xl p-4 border border-white/5">
              <p className="text-[9px] font-bold text-green-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">🟢 MASUK</p>
              <p className="text-sm font-bold truncate">{formatRupiah(stats.masuk)}</p>
            </div>
            <div className="flex-1 bg-white/10 rounded-2xl p-4 border border-white/5">
              <p className="text-[9px] font-bold text-red-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">🔴 KELUAR</p>
              <p className="text-sm font-bold truncate">{formatRupiah(stats.keluar)}</p>
            </div>
          </div>
        </div>

        {/* RINGKASAN PER KATEGORI (SCROLL HORIZONTAL) */}
        {ringkasanKat.length > 0 && (
          <div>
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1 mb-3">RINGKASAN ALOKASI DANA</h3>
            <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2">
              {ringkasanKat.map((rk, idx) => (
                <div key={idx} className="bg-white border border-gray-100 rounded-xl p-3 min-w-[140px] shadow-sm shrink-0">
                  <p className={`text-[10px] font-bold uppercase mb-1 truncate ${rk.tipe === 'PEMASUKAN' ? 'text-green-600' : 'text-red-500'}`}>{rk.nama}</p>
                  <p className="text-xs font-bold text-[#1D1D1F]">{formatRupiah(rk.total)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LIST TRANSAKSI TERAKHIR */}
        <div>
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1 mb-3">RIWAYAT TRANSAKSI TERAKHIR</h3>
          <div className="flex flex-col gap-3">
            {transaksi.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-[1.5rem] p-8 text-center shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">BRANKAS MASIH KOSONG.</p>
              </div>
            ) : (
              transaksi.map((t) => (
                <div key={t.id} className="bg-white border border-gray-100 rounded-[1.2rem] p-4 flex flex-col md:flex-row md:items-center justify-between shadow-sm hover:shadow-md transition-all gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm font-bold text-lg shrink-0 ${t.kategori?.tipe === 'PEMASUKAN' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                       {t.kategori?.tipe === 'PEMASUKAN' ? '+' : '-'}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-[11px] font-bold uppercase text-[#1D1D1F] tracking-wide">{t.kategori?.nama || 'UNCATEGORIZED'}</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                        {new Date(t.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} {t.catatan && `• ${t.catatan}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between md:justify-end gap-4 ml-15 md:ml-0">
                    <p className={`font-bold text-sm tracking-wide ${t.kategori?.tipe === 'PEMASUKAN' ? 'text-green-600' : 'text-[#1D1D1F]'}`}>
                      {t.kategori?.tipe === 'PEMASUKAN' ? '+' : '-'}{formatRupiah(Number(t.nominal))}
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(t)} className="w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 active:scale-95 transition-all text-xs border border-blue-100">✏️</button>
                      <button onClick={() => handleHapus(t.id)} className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-600 rounded-lg hover:bg-red-100 active:scale-95 transition-all text-xs border border-red-100">🗑️</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <button onClick={handleTambah} className="fixed bottom-6 right-6 w-14 h-14 bg-[#1D1D1F] text-white rounded-2xl flex items-center justify-center shadow-2xl hover:scale-105 hover:bg-black active:scale-95 transition-all z-50">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
      </button>
      
    </main>
  )
                         }
      
