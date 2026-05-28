'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Swal from 'sweetalert2'
import { getCicilanDetail, setorCicilan, tambahTransaksiHarian, getKategori, tambahKategori, editCicilanMaster } from '@/app/actions'

export default function CicilanDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [master, setMaster] = useState<any>(null)
  const [detail, setDetail] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const res = await getCicilanDetail(id as string)
      setMaster(res.master)
      setDetail(res.detail)
      setLoading(false)
    } catch (error) { router.push('/cicilan') }
  }
  useEffect(() => { loadData() }, [id])

  const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka)

  const baseSwalClass = {
    popup: '!rounded-[1.5rem] !p-5',
    confirmButton: '!bg-blue-600 !text-white !font-bold !w-full !rounded-xl !py-3 !mt-3 text-[10px] uppercase tracking-widest', 
    cancelButton: '!bg-gray-100 !text-gray-500 !font-bold !w-full !rounded-xl !py-3 !mt-3 text-[10px] uppercase tracking-widest',
    actions: '!flex !flex-col w-full'
  }

  const handleEditMaster = async () => {
    const formatPokok = new Intl.NumberFormat('id-ID').format(master.total_pinjaman)
    const formatCicilan = new Intl.NumberFormat('id-ID').format(master.cicilan_wajib_per_bulan)

    const htmlForm = `
      <input id="swal-edit-nama" type="text" value="${master.nama_kreditur}" class="w-full h-12 px-4 mb-3 bg-[#F5F5F7] border border-gray-200 rounded-xl text-center font-bold uppercase outline-none focus:border-blue-500 text-[12px]">
      <input id="swal-edit-pokok" type="text" inputmode="numeric" value="${formatPokok}" oninput="this.value = this.value.replace(/[^0-9]/g, '').replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.')" placeholder="POKOK PINJAMAN MURNI (Rp)" class="w-full h-12 px-4 mb-3 bg-[#F5F5F7] border border-gray-200 rounded-xl text-center font-bold outline-none focus:border-blue-500 text-[12px]">
      <input id="swal-edit-cicilan" type="text" inputmode="numeric" value="${formatCicilan}" oninput="this.value = this.value.replace(/[^0-9]/g, '').replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.')" placeholder="CICILAN WAJIB / BLN (Rp)" class="w-full h-12 px-4 mb-1 bg-[#F5F5F7] border border-gray-200 rounded-xl text-center font-bold outline-none focus:border-blue-500 text-[12px]">
      <p class="text-[8px] font-bold text-red-500 text-center uppercase tracking-widest leading-relaxed mt-2">*Tenor & Tgl Mulai dikunci permanen agar riwayat baris bulan tidak hancur.</p>
    `

    const { value: form } = await Swal.fire({
      title: 'EDIT BUKU INDUK', html: htmlForm, showCancelButton: true, confirmButtonText: 'SIMPAN', buttonsStyling: false, customClass: baseSwalClass,
      preConfirm: () => {
        const nama = (document.getElementById('swal-edit-nama') as HTMLInputElement).value
        const pokok = Number((document.getElementById('swal-edit-pokok') as HTMLInputElement).value.replace(/\./g, ''))
        const cicilan_bln = Number((document.getElementById('swal-edit-cicilan') as HTMLInputElement).value.replace(/\./g, ''))
        if (!nama || !pokok || !cicilan_bln) return Swal.showValidationMessage('DATA TIDAK VALID!')
        return { nama, pokok, cicilan_bln }
      }
    })
    if (form) { Swal.showLoading(); await editCicilanMaster(master.id, form.nama, form.pokok, form.cicilan_bln); await loadData() }
  }

  const handleSetor = async (d: any) => {
    const defaultValue = d.nominal_dibayar > 0 ? d.nominal_dibayar : master.cicilan_wajib_per_bulan
    const formatAwal = new Intl.NumberFormat('id-ID').format(defaultValue)

    const htmlForm = `
      <input id="swal-nominal" type="text" inputmode="numeric" value="${formatAwal}" 
      oninput="this.value = this.value.replace(/[^0-9]/g, '').replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.')" 
      class="w-full h-14 px-4 bg-[#F5F5F7] border border-gray-200 rounded-xl text-center font-bold text-lg outline-none focus:border-blue-500 mb-4 tracking-wider">
      
      <div class="flex items-center justify-center gap-3 bg-blue-50 p-4 rounded-xl border border-blue-100">
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" id="swal-potong" class="sr-only peer" checked>
          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
        <span class="text-[10px] font-bold text-blue-900 uppercase tracking-widest">POTONG SALDO AKTIF</span>
      </div>
    `

    const { value: form } = await Swal.fire({
      title: `SETOR BLN KE-${d.bulan_ke}`, html: htmlForm, showCancelButton: true, confirmButtonText: 'SIMPAN TRANSAKSI', buttonsStyling: false, customClass: baseSwalClass,
      preConfirm: () => { 
        const nom = Number((document.getElementById('swal-nominal') as HTMLInputElement).value.replace(/\./g, ''))
        const potong = (document.getElementById('swal-potong') as HTMLInputElement).checked
        if (nom < 0 || isNaN(nom)) return Swal.showValidationMessage('NOMINAL TIDAK VALID!')
        return { nominal: nom, potong }
      }
    })

    if (form) {
      Swal.showLoading()
      if (form.potong) {
        const selisih = form.nominal - Number(d.nominal_dibayar)
        if (selisih > 0) {
          let katRes = await getKategori()
          let katId = katRes.kategori?.find((k: any) => k.nama_kategori === 'CICILAN BANK')?.id
          if (!katId) {
            await tambahKategori('CICILAN BANK', 'PENGELUARAN')
            katRes = await getKategori()
            katId = katRes.kategori?.find((k: any) => k.nama_kategori === 'CICILAN BANK')?.id
          }
          await tambahTransaksiHarian(selisih, `SETOR ${master.nama_kreditur} BLN-${d.bulan_ke}`, katId)
        }
      }
      await setorCicilan(d.id, form.nominal, master.cicilan_wajib_per_bulan)
      await loadData()
      Swal.fire({ title: 'TERCATAT!', icon: 'success', timer: 1000, showConfirmButton: false })
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>

  // Mesin Logika Bunga Bank
  const totalBayar = detail.reduce((acc, curr) => acc + Number(curr.nominal_dibayar), 0)
  const totalKewajiban = (master?.tenor_bulan || 0) * (master?.cicilan_wajib_per_bulan || 0)
  const totalBunga = totalKewajiban - (master?.total_pinjaman || 0)
  const sisaKewajiban = totalKewajiban - totalBayar
  const listKurang = detail.filter(d => d.status === 'KURANG')

  let estimasiLunas = '-'
  if (master?.tanggal_mulai && master?.tenor_bulan) {
    const tglMulai = new Date(master.tanggal_mulai)
    tglMulai.setMonth(tglMulai.getMonth() + master.tenor_bulan - 1)
    estimasiLunas = tglMulai.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }).toUpperCase()
  }

  return (
    <main className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] flex flex-col font-sans pb-24 px-5 pt-6">
      <header className="w-full max-w-xl mx-auto mb-6 flex justify-between items-start">
        <div className="flex gap-3">
          <button onClick={() => router.push('/cicilan')} className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center font-bold shadow-sm active:scale-95 transition-all text-xl">
            ←
          </button>
          <div>
            <h1 className="font-bold text-[15px] text-blue-800 uppercase tracking-wide">{master?.nama_kreditur}</h1>
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">{formatRupiah(master?.cicilan_wajib_per_bulan)} / BLN</p>
          </div>
        </div>
        <button onClick={handleEditMaster} className="bg-blue-50 text-blue-600 border border-blue-200 text-[9px] font-bold px-4 py-2 rounded-lg uppercase tracking-widest hover:bg-blue-100 active:scale-95 transition-all shadow-sm">
          EDIT
        </button>
      </header>

      {/* PAPAN REKAPITULASI DETAIL FULL SPEK BANK */}
      <div className="w-full max-w-xl mx-auto bg-gradient-to-br from-[#1D1D1F] to-[#374151] p-5 rounded-[1.5rem] shadow-xl mb-6 flex flex-col relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5 relative z-10">
          <div className="flex flex-col">
            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">PINJAMAN POKOK</span>
            <span className="font-bold text-[13px] text-white">{formatRupiah(master?.total_pinjaman || 0)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">TOTAL BUNGA</span>
            <span className="font-bold text-[13px] text-red-400">+{formatRupiah(totalBunga)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">SISA KONTRAK</span>
            <span className="font-bold text-[13px] text-yellow-400">{formatRupiah(sisaKewajiban)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">SUDAH BAYAR</span>
            <span className="font-bold text-[13px] text-green-400">{formatRupiah(totalBayar)}</span>
          </div>
          <div className="flex flex-col col-span-2">
            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">ESTIMASI LUNAS</span>
            <span className="font-bold text-[13px] text-white">{estimasiLunas} <span className="text-gray-400 text-[10px] ml-1">({master?.tenor_bulan} BLN)</span></span>
          </div>
        </div>

        {listKurang.length > 0 && (
          <div className="mt-5 pt-4 border-t border-gray-600 relative z-10">
             <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest mb-2 block">⚠️ TUNGGAKAN AKTIF</span>
             <div className="flex flex-wrap gap-2">
              {listKurang.map(k => {
                const selisih = master.cicilan_wajib_per_bulan - Number(k.nominal_dibayar)
                return (
                  <span key={k.id} className="text-[9px] font-bold text-white bg-red-500/20 border border-red-500/50 px-2 py-1 rounded-md">
                    BLN {k.bulan_ke} : -{formatRupiah(selisih)}
                  </span>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="w-full max-w-xl mx-auto flex flex-col gap-3">
        <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">RIWAYAT BULANAN</h2>
        {detail.map((d) => {
          const isTelat = new Date(d.tanggal_jatuh_tempo).getTime() < new Date().getTime() && d.status === 'BELUM BAYAR'

          let boxStyle = 'bg-white border-gray-200 text-gray-400'
          let statusColor = 'bg-gray-100 text-gray-500'
          
          if (d.status === 'LUNAS') { boxStyle = 'bg-green-50/50 border-green-200'; statusColor = 'bg-green-100 text-green-700' }
          else if (d.status === 'KURANG') { boxStyle = 'bg-yellow-50/50 border-yellow-300'; statusColor = 'bg-yellow-100 text-yellow-700' }
          else if (isTelat) { boxStyle = 'bg-red-50/50 border-red-300'; statusColor = 'bg-red-100 text-red-700 animate-pulse' }

          return (
            <div key={d.id} onClick={() => handleSetor(d)} className={`border rounded-[1rem] p-4 flex justify-between items-center cursor-pointer hover:shadow-md transition-all active:scale-95 ${boxStyle}`}>
              <div className="flex flex-col">
                <p className="font-bold text-[12px] text-[#1D1D1F] uppercase">BULAN KE - {d.bulan_ke}</p>
                <p className="text-[9px] font-bold text-gray-500 mt-1 uppercase tracking-widest">TEMPO : {new Date(d.tanggal_jatuh_tempo).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className={`text-[8px] font-bold px-2 py-1 rounded shadow-sm mb-1.5 uppercase tracking-widest ${statusColor}`}>{d.status}</span>
                <p className="font-bold text-[13px] text-[#1D1D1F]">{formatRupiah(Number(d.nominal_dibayar))}</p>
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}