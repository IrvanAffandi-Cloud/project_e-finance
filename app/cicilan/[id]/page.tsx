'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Swal from 'sweetalert2'
import { getCicilanDetail, setorCicilan, tambahTransaksiHarian, getKategori, tambahKategori, editCicilanMaster } from '@/app/actions'

export default function CicilanDetailPage() {
  const { id } = useParams()
  const [master, setMaster] = useState<any>(null)
  const [detail, setDetail] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const res = await getCicilanDetail(id as string)
      setMaster(res.master)
      setDetail(res.detail)
      setLoading(false)
    } catch (error) { window.location.href = '/cicilan' }
  }
  useEffect(() => { loadData() }, [id])

  const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka)

  const handleEditMaster = async () => {
    const formatPokok = new Intl.NumberFormat('id-ID').format(master.total_pinjaman)
    const formatCicilan = new Intl.NumberFormat('id-ID').format(master.cicilan_wajib_per_bulan)

    const htmlForm = `
      <input id="swal-edit-nama" type="text" value="${master.nama_kreditur}" class="w-full h-12 px-4 mb-3 bg-[#F5F5F7] border border-gray-200 rounded-xl text-center font-bold text-[#1D1D1F] uppercase outline-none focus:border-blue-500">
      <input id="swal-edit-pokok" type="text" inputmode="numeric" value="${formatPokok}" oninput="this.value = this.value.replace(/[^0-9]/g, '').replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.')" placeholder="POKOK PINJAMAN MURNI (Rp)" class="w-full h-12 px-4 mb-3 bg-[#F5F5F7] border border-gray-200 rounded-xl text-center font-bold text-[#1D1D1F] outline-none focus:border-blue-500">
      <input id="swal-edit-cicilan" type="text" inputmode="numeric" value="${formatCicilan}" oninput="this.value = this.value.replace(/[^0-9]/g, '').replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.')" placeholder="CICILAN WAJIB / BLN (Rp)" class="w-full h-12 px-4 mb-1 bg-[#F5F5F7] border border-gray-200 rounded-xl text-center font-bold text-[#1D1D1F] outline-none focus:border-blue-500">
      <p class="text-[8px] font-bold text-red-500 text-center uppercase tracking-widest leading-relaxed mt-2">*Tenor & Tgl Mulai dikunci permanen agar riwayat baris bulan tidak hancur.</p>
    `

    const { value: form } = await Swal.fire({
      title: 'EDIT BUKU INDUK', html: htmlForm, showCancelButton: true, confirmButtonText: 'SIMPAN PERUBAHAN', buttonsStyling: false,
      customClass: { confirmButton: 'bg-blue-600 text-white font-bold w-full rounded-xl py-3 mt-3 text-[10px]', cancelButton: 'bg-gray-100 text-gray-500 font-bold w-full rounded-xl py-3 mt-3 text-[10px]', popup: 'rounded-[1.5rem]' },
      preConfirm: () => {
        const nama = (document.getElementById('swal-edit-nama') as HTMLInputElement).value
        const pokok = Number((document.getElementById('swal-edit-pokok') as HTMLInputElement).value.replace(/\./g, ''))
        const cicilan_bln = Number((document.getElementById('swal-edit-cicilan') as HTMLInputElement).value.replace(/\./g, ''))
        if (!nama || !pokok || !cicilan_bln) { Swal.showValidationMessage('DATA TIDAK VALID!'); return false }
        return { nama, pokok, cicilan_bln }
      }
    })

    if (form) { setLoading(true); await editCicilanMaster(master.id, form.nama, form.pokok, form.cicilan_bln); await loadData() }
  }

  const handleSetor = async (d: any) => {
    const defaultValue = d.nominal_dibayar > 0 ? d.nominal_dibayar : master.cicilan_wajib_per_bulan
    const formatAwal = new Intl.NumberFormat('id-ID').format(defaultValue)

    const htmlForm = `
      <input id="swal-nominal" type="text" inputmode="numeric" value="${formatAwal}" 
      oninput="this.value = this.value.replace(/[^0-9]/g, '').replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.')" 
      placeholder="Jumlah" class="w-full h-12 px-4 bg-[#F5F5F7] border border-gray-200 rounded-xl text-center font-bold text-[#1D1D1F] outline-none focus:border-blue-500 mb-4">
      
      <label class="flex items-center justify-center gap-2 text-[10px] font-bold text-[#1D1D1F] uppercase cursor-pointer bg-blue-50 py-3 rounded-xl border border-blue-100">
        <input id="swal-potong" type="checkbox" checked class="w-4 h-4 accent-blue-600 cursor-pointer">
        POTONG SALDO ?
      </label>
    `

    const { value: form } = await Swal.fire({
      title: `Setor bulan ke - ${d.bulan_ke}`, html: htmlForm, showCancelButton: true, confirmButtonText: 'SIMPAN', buttonsStyling: false,
      customClass: { confirmButton: 'bg-blue-600 text-white font-bold w-full rounded-xl py-3 mt-3 text-[10px]', cancelButton: 'bg-gray-100 text-gray-500 font-bold w-full rounded-xl py-3 mt-3 text-[10px]', popup: 'rounded-[1.5rem]' },
      preConfirm: () => { 
        const nom = Number((document.getElementById('swal-nominal') as HTMLInputElement).value.replace(/\./g, ''))
        const potong = (document.getElementById('swal-potong') as HTMLInputElement).checked
        if (nom < 0 || isNaN(nom)) return Swal.showValidationMessage('UANG TIDAK VALID!')
        return { nominal: nom, potong }
      }
    })

    if (form) {
      setLoading(true)
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
    }
  }

  if (loading) return <div className="min-h-screen bg-[#FBFBFD] flex items-center justify-center"><div className="w-8 h-8 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>

  // Mesin Logika Bunga Bank
  const totalBayar = detail.reduce((acc, curr) => acc + Number(curr.nominal_dibayar), 0)
  const totalKewajiban = (master?.tenor_bulan || 0) * (master?.cicilan_wajib_per_bulan || 0)
  const totalBunga = totalKewajiban - (master?.total_pinjaman || 0)
  const sisaKewajiban = totalKewajiban - totalBayar
  const listKurang = detail.filter(d => d.status === 'KURANG')
  
  // Kalkulasi Waktu Kiamat (Bulan Lunas)
  let estimasiLunas = '-'
  if (master?.tanggal_mulai && master?.tenor_bulan) {
    const tglMulai = new Date(master.tanggal_mulai)
    tglMulai.setMonth(tglMulai.getMonth() + master.tenor_bulan - 1)
    estimasiLunas = tglMulai.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }).toUpperCase()
  }

  return (
    <main className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] flex flex-col font-sans pb-24 px-5 pt-6">
      <header className="mb-6 flex justify-between items-start">
        <div className="flex gap-4">
          <Link href="/cicilan" className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center font-bold shadow-sm active:scale-95 transition-all">←</Link>
          <div>
            <h1 className="font-bold text-[16px] text-blue-800 uppercase">{master?.nama_kreditur}</h1>
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">JUMLAH : {formatRupiah(master?.cicilan_wajib_per_bulan)} / Bulan</p>
          </div>
        </div>
        <button onClick={handleEditMaster} className="bg-blue-50 text-blue-600 border border-blue-200 text-[9px] font-bold px-4 py-2 rounded-lg uppercase tracking-widest hover:bg-blue-100 active:scale-95 transition-all">
          EDIT
        </button>
      </header>

      {/* PAPAN REKAPITULASI DETAIL FULL SPEK BANK */}
      <div className="bg-white p-5 rounded-[1.2rem] shadow-sm border border-gray-200 mb-6 flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-3 py-1 rounded-md uppercase tracking-widest">DETAIL PINJAMAN</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 border-b border-gray-100 pb-5">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">POKOK</span>
            <span className="font-bold text-[13px] text-[#1D1D1F]">{formatRupiah(master?.total_pinjaman || 0)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">BUNGA</span>
            <span className="font-bold text-[13px] text-red-500">+{formatRupiah(totalBunga)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">TOTAL</span>
            <span className="font-bold text-[13px] text-red-600">{formatRupiah(totalKewajiban)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">SUDAH BAYAR</span>
            <span className="font-bold text-[13px] text-green-600">{formatRupiah(totalBayar)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">SISA</span>
            <span className="font-bold text-[13px] text-red-600">{formatRupiah(sisaKewajiban)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">SELESAI PADA</span>
            <span className="font-bold text-[13px] text-[#1D1D1F]">{estimasiLunas} <span className="text-gray-400 text-[10px]">( {master?.tenor_bulan} BULAN )</span></span>
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-1">
            Detektor ({listKurang.length} BULAN)
          </span>
          {listKurang.length === 0 ? (
            <p className="text-[10px] font-bold text-green-600 bg-green-50 px-3 py-2 rounded-lg inline-block w-fit">TIDAK ADA TUNGGAKAN</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {listKurang.map(k => {
                const selisihKurang = master.cicilan_wajib_per_bulan - Number(k.nominal_dibayar)
                return (
                  <span key={k.id} className="text-[10px] font-bold text-yellow-700 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-lg">
                    BLN KE-{k.bulan_ke} : -{formatRupiah(selisihKurang)}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {detail.map((d) => {
          const isTelat = new Date(d.tanggal_jatuh_tempo).getTime() < new Date().getTime() && d.status === 'BELUM BAYAR'

          let boxStyle = 'bg-white border-gray-200'
          let textStatus = 'text-gray-400'

          if (d.status === 'LUNAS') { boxStyle = 'bg-green-50 border-green-200'; textStatus = 'text-green-600' }
          else if (d.status === 'KURANG') { boxStyle = 'bg-yellow-50 border-yellow-300'; textStatus = 'text-yellow-600' }
          else if (isTelat) { boxStyle = 'bg-red-50 border-red-300 animate-pulse'; textStatus = 'text-red-600' }

          return (
            <div key={d.id} onClick={() => handleSetor(d)} className={`border rounded-[1rem] p-4 flex justify-between items-center cursor-pointer hover:shadow-md transition-all active:scale-95 ${boxStyle}`}>
              <div className="flex flex-col">
                <p className="font-bold text-[12px]">Bulan ke - {d.bulan_ke}</p>
                <p className="text-[9px] font-bold text-gray-500 uppercase mt-1">TEMPO : {new Date(d.tanggal_jatuh_tempo).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}</p>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className={`text-[8px] font-bold px-2 py-1 bg-white rounded shadow-sm border mb-1 uppercase ${textStatus}`}>{d.status}</span>
                <p className="font-bold text-[12px] text-[#1D1D1F]">{formatRupiah(Number(d.nominal_dibayar))}</p>
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}