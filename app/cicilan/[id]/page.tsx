'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Swal from 'sweetalert2'
import Link from 'next/link'
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
    popup: '!max-w-[380px] !rounded-[2rem] border border-gray-200 shadow-2xl bg-white p-5',
    title: 'text-[#1D1D1F] font-black uppercase text-[12px] tracking-widest mb-3',
    actions: 'w-full flex flex-col gap-2 mt-4',
    confirmButton: 'w-full h-10 flex items-center justify-center bg-blue-600 text-white font-black text-[10px] tracking-[0.15em] uppercase px-5 rounded-xl shadow-sm hover:bg-blue-700 active:scale-95 transition-all duration-200',
    cancelButton: 'w-full h-10 flex items-center justify-center bg-[#F5F5F7] text-gray-500 font-black text-[10px] tracking-[0.15em] uppercase px-5 rounded-xl hover:bg-gray-200 active:scale-95 transition-all duration-200'
  }

  const handleEditMaster = async () => {
    const formatPokok = new Intl.NumberFormat('id-ID').format(master.total_pinjaman)
    const formatCicilan = new Intl.NumberFormat('id-ID').format(master.cicilan_wajib_per_bulan)

    const htmlForm = `
      <div class="flex flex-col gap-2 text-left">
        <input id="swal-edit-nama" type="text" value="${master.nama_kreditur}" class="w-full h-10 px-4 bg-[#F5F5F7] border border-transparent rounded-xl text-center font-black text-[11px] uppercase tracking-widest outline-none focus:border-blue-500">
        <input id="swal-edit-pokok" type="text" inputmode="numeric" value="${formatPokok}" oninput="this.value = this.value.replace(/[^0-9]/g, '').replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.')" class="w-full h-10 px-4 bg-[#F5F5F7] border border-transparent rounded-xl text-center font-black text-[11px] tracking-widest outline-none focus:border-blue-500">
        <input id="swal-edit-cicilan" type="text" inputmode="numeric" value="${formatCicilan}" oninput="this.value = this.value.replace(/[^0-9]/g, '').replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.')" class="w-full h-10 px-4 bg-[#F5F5F7] border border-transparent rounded-xl text-center font-black text-[11px] tracking-widest outline-none focus:border-blue-500">
      </div>
    `
    const { value: form } = await Swal.fire({ title: 'EDIT BUKU INDUK', html: htmlForm, showCancelButton: true, confirmButtonText: 'SIMPAN', customClass: baseSwalClass, buttonsStyling: false,
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
      class="w-full h-12 px-4 bg-[#F5F5F7] border border-transparent rounded-xl text-center font-black text-[14px] outline-none focus:border-blue-500 mb-4 tracking-widest">
      
      <div class="flex items-center justify-center gap-3 bg-blue-50 p-3 rounded-xl border border-blue-100">
        <input type="checkbox" id="swal-potong" class="w-5 h-5 accent-blue-600" checked>
        <span class="text-[9px] font-black text-blue-900 uppercase tracking-widest">POTONG SALDO AKTIF</span>
      </div>
    `
    const { value: form } = await Swal.fire({ title: `SETOR BLN KE-${d.bulan_ke}`, html: htmlForm, showCancelButton: true, confirmButtonText: 'SIMPAN', customClass: baseSwalClass, buttonsStyling: false,
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
          if (!katId) { await tambahKategori('CICILAN BANK', 'PENGELUARAN'); katRes = await getKategori(); katId = katRes.kategori?.find((k: any) => k.nama_kategori === 'CICILAN BANK')?.id }
          await tambahTransaksiHarian(selisih, `SETOR ${master.nama_kreditur} BLN-${d.bulan_ke}`, katId)
        }
      }
      await setorCicilan(d.id, form.nominal, master.cicilan_wajib_per_bulan)
      await loadData()
      Swal.fire({ title: 'TERCATAT!', icon: 'success', timer: 1000, showConfirmButton: false })
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>

  const totalBayar = detail.reduce((acc, curr) => acc + Number(curr.nominal_dibayar), 0)
  const totalKewajiban = (master?.tenor_bulan || 0) * (master?.cicilan_wajib_per_bulan || 0)
  const totalBunga = totalKewajiban - (master?.total_pinjaman || 0)
  const sisaKewajiban = totalKewajiban - totalBayar

  return (
    <main className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] flex flex-col font-sans pb-20 items-center">
      <style dangerouslySetInnerHTML={{__html: ` @keyframes shine-glossy { 0% { transform: translateX(-100%) skewX(-20deg); } 100% { transform: translateX(200%) skewX(-20deg); } } `}} />

      <header className="sticky top-0 z-50 w-full h-[68px] rounded-b-[2.5rem] bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 shadow-[0_10px_30px_rgba(37,99,235,0.3)] border-b border-blue-400/40 overflow-hidden flex flex-col items-center justify-center pt-1">
        <div className="absolute top-0 h-full w-[50%] bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shine-glossy_4s_infinite]"></div>
        <div className="w-full max-w-xl relative flex flex-col items-center justify-center px-4">
          <Link href="/cicilan" className="absolute top-1/2 -translate-y-1/2 left-4 w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 hover:bg-white/30 active:scale-95 transition-all z-10">
            <svg className="w-4 h-4 text-white pr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
          </Link>
          <h1 className="text-white font-black text-[12px] tracking-[0.3em] uppercase drop-shadow-md z-10 leading-none truncate max-w-[200px]">{master?.nama_kreditur}</h1>
        </div>
      </header>

      <div className="w-full max-w-xl px-4 mt-6 flex flex-col gap-4">
        <div className="bg-[#1D1D1F] p-5 rounded-[1.5rem] shadow-xl text-white grid grid-cols-2 gap-4 border border-blue-900">
          <div className="col-span-2 flex justify-between border-b border-gray-800 pb-3">
             <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em]">POKOK + BUNGA</span>
             <button onClick={handleEditMaster} className="text-[8px] font-black text-blue-400 uppercase tracking-[0.2em] underline">EDIT</button>
          </div>
          <div><p className="text-[7px] text-gray-500 uppercase tracking-widest">POKOK</p><p className="font-black text-[12px]">{formatRupiah(master?.total_pinjaman || 0)}</p></div>
          <div><p className="text-[7px] text-gray-500 uppercase tracking-widest">BUNGA</p><p className="font-black text-[12px] text-red-400">+{formatRupiah(totalBunga)}</p></div>
          <div><p className="text-[7px] text-gray-500 uppercase tracking-widest">BAYAR</p><p className="font-black text-[12px] text-green-400">{formatRupiah(totalBayar)}</p></div>
          <div><p className="text-[7px] text-gray-500 uppercase tracking-widest">SISA</p><p className="font-black text-[12px] text-yellow-400">{formatRupiah(sisaKewajiban)}</p></div>
        </div>

        <div className="flex flex-col gap-1.5 mt-2">
          <h2 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 mb-1 border-b border-gray-200 pb-1">RIWAYAT BULANAN</h2>
          {detail.map((d) => {
            const isTelat = new Date(d.tanggal_jatuh_tempo).getTime() < new Date().getTime() && d.status === 'BELUM BAYAR'
            let statusClass = 'bg-gray-100 text-gray-500'
            if (d.status === 'LUNAS') statusClass = 'bg-green-100 text-green-700'
            else if (d.status === 'KURANG') statusClass = 'bg-yellow-100 text-yellow-700'
            else if (isTelat) statusClass = 'bg-red-100 text-red-700 animate-pulse'

            return (
              <div key={d.id} onClick={() => handleSetor(d)} className="bg-white border border-gray-200 rounded-[1rem] p-4 flex justify-between items-center cursor-pointer hover:bg-blue-50 transition-all">
                <div>
                  <p className="font-black text-[11px] uppercase tracking-tight">BLN KE - {d.bulan_ke}</p>
                  <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                    {new Date(d.tanggal_jatuh_tempo).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest mb-1 block ${statusClass}`}>{d.status}</span>
                  <p className="font-black text-[12px]">{formatRupiah(Number(d.nominal_dibayar))}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}