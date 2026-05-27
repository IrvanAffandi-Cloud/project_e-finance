'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Swal from 'sweetalert2'
import { fetchDashboardData, logoutAdmin, setStatusFaseBaru, finalizeBakalCalonAction, updateBypassPin, resetSistemTotalAction, fetchExcelRekapCalonKetua } from '@/app/actions'
import { cetakExcelPartisipasi, cetakExcelHasilMutlak } from '@/lib/excelUtils'

export default function Admin() {
  const [fases, setFases] = useState({ bakalCalon: 'LOCKED', calonKetua: 'LOCKED', pengumuman: 'LOCKED' })
  const [stats, setStats] = useState({ total: 0, voted: 0 })
  const [members, setMembers] = useState<any[]>([])
  const [top3, setTop3] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [search, setSearch] = useState('')
  const router = useRouter()

  const loadDashboard = async (isInitial = false) => {
    try {
      const data = await fetchDashboardData()
      setFases({ bakalCalon: data.fase_bakal_calon, calonKetua: data.fase_calon_ketua, pengumuman: data.fase_pengumuman })
      setStats(data.stats)
      setMembers(data.members)
      setTop3(data.top3)
      // PROTEKSI MUTLAK: LOADING HANYA BOLEH FALSE JIKA DATA BERHASIL DIAMBIL (ADMIN SAH)
      if (isInitial) setLoading(false)
    } catch (error) {
      // JANGAN SET LOADING FALSE APABILA ERROR, BIAR LAYOUT TETEP BLANK LOADING SAAT DITENDANG
      router.push('/')
    }
  }

  useEffect(() => {
    loadDashboard(true)
    const interval = setInterval(() => {
      loadDashboard(false)
    }, 5000)
    return () => clearInterval(interval)
  }, [router])

  // EKSTRAKSI CUSTOM CLASS (SUPER PADAT & ANTI FONT BLACK)
  const baseCustomClass = {
    popup: '!max-w-[420px] !rounded-[1.5rem] !border !border-gray-200 !shadow-2xl !bg-white !p-5',
    title: 'text-[#1D1D1F] font-bold uppercase text-[15px] mb-1',
    htmlContainer: 'text-[9px] font-bold text-gray-500 uppercase',
    input: '!h-10 !px-3 !bg-[#F5F5F7] !border !border-transparent focus:!border-green-500 focus:!bg-white !rounded-xl !text-[10px] font-bold !text-center text-[#1D1D1F] transition-all !w-full !mt-3 !shadow-sm placeholder:text-gray-400',
    actions: '!w-full !flex !gap-3 !mt-5',
    confirmButton: '!flex-1 !h-11 !flex !items-center !justify-center !bg-gradient-to-br !from-[#166534] !to-[#22c55e] !text-white font-bold !text-[10px] uppercase !px-5 !rounded-xl !shadow-sm hover:!shadow-md active:!scale-95 transition-all duration-200',
    cancelButton: '!flex-1 !h-11 !flex !items-center !justify-center !bg-white !border !border-gray-200 !text-gray-500 font-bold !text-[10px] uppercase !px-5 !rounded-xl !shadow-sm hover:!bg-slate-50 active:!scale-95 transition-all duration-200',
    validationMessage: '!bg-red-50 !text-red-600 font-bold !text-[10px] uppercase !rounded-xl !border !border-red-200 !mt-3 !py-2 !px-3 !shadow-sm'
  }

  const swalUI = Swal.mixin({
    width: '90%',
    customClass: baseCustomClass,
    buttonsStyling: false
  })

  const handleLogout = async () => {
    const res = await swalUI.fire({
      title: 'LOGOUT ADMIN?',
      showCancelButton: true,
      confirmButtonText: 'LOGOUT',
      cancelButtonText: 'BATAL'
    })
    if (res.isConfirmed) {
      setLoading(true)
      await logoutAdmin()
      router.push('/')
    }
  }

  const handleFaseAksi = async (idFase: number, namaFase: string, targetStatus: 'ACTIVE' | 'DONE' | 'LOCKED') => {
    const pesan = targetStatus === 'ACTIVE'
      ? `MULAI FASE ${namaFase.toUpperCase()}?`
      : targetStatus === 'DONE'
        ? `SELESAIKAN FASE ${namaFase.toUpperCase()}?`
        : `GEMBOK FASE ${namaFase.toUpperCase()}?`

    const res = await swalUI.fire({
      title: pesan,
      showCancelButton: true,
      confirmButtonText: 'KONFIRMASI',
      cancelButtonText: 'BATAL'
    })

    if (res.isConfirmed) {
      setLoading(true)
      await setStatusFaseBaru(idFase, targetStatus)
      await loadDashboard(false)
      setLoading(false)
    }
  }

  const handleTutupBakalCalon = async () => {
    const confirm = await swalUI.fire({
      title: 'KUNCI BAKAL CALON & REKAP TOP 3?',
      showCancelButton: true,
      confirmButtonText: 'KUNCI',
      cancelButtonText: 'BATAL'
    })
    if (!confirm.isConfirmed) return
    setLoading(true)
    const res = await finalizeBakalCalonAction()
    if (res.success) {
      await loadDashboard(false)
      swalUI.fire({ title: 'SUKSES DIKUNCI', icon: 'success', showConfirmButton: false, timer: 1500 })
    }
    setLoading(false)
  }

  const handleResetSistem = async () => {
    const { value: textConfirm } = await swalUI.fire({
      title: 'RESET TOTAL SISTEM?',
      input: 'text',
      inputPlaceholder: 'KETIK: HAPUS SEMUA',
      showCancelButton: true,
      confirmButtonText: 'RESET',
      cancelButtonText: 'BATAL',
      customClass: {
        ...baseCustomClass,
        confirmButton: '!flex-1 !h-11 !flex !items-center !justify-center !bg-red-600 !text-white font-bold !text-[10px] uppercase !px-5 !rounded-xl !shadow-sm hover:!bg-red-700 active:!scale-95 transition-all duration-200'
      }
    })

    if (textConfirm === 'HAPUS SEMUA') {
      setLoading(true)
      await resetSistemTotalAction()
      await loadDashboard(false)
      setLoading(false)
      swalUI.fire({ title: 'BERSIH', html: 'Sistem dikunci total.', icon: 'success', showConfirmButton: false, timer: 1500 })
    } else if (textConfirm !== undefined) {
      swalUI.fire({ title: 'GAGAL', html: 'Konfirmasi salah.', icon: 'error', showConfirmButton: false, timer: 1500 })
    }
  }

  const downloadExcel = async (namaFile: string) => {
    const confirm = await swalUI.fire({
      title: `UNDUH LAPORAN ${namaFile.toUpperCase()}?`,
      showCancelButton: true,
      confirmButtonText: 'UNDUH',
      cancelButtonText: 'BATAL'
    })
    if (!confirm.isConfirmed) return
    setLoading(true)
    await cetakExcelPartisipasi(members, namaFile as 'Bakal Calon' | 'Calon Ketua')
    setLoading(false)
  }

  const downloadExcelHasilAkhir = async () => {
    const confirm = await swalUI.fire({
      title: 'UNDUH LAPORAN PENGUMUMAN?',
      showCancelButton: true,
      confirmButtonText: 'UNDUH',
      cancelButtonText: 'BATAL'
    })
    if (!confirm.isConfirmed) return
    setLoading(true)
    try {
      const hasilFinal = await fetchExcelRekapCalonKetua()
      await cetakExcelHasilMutlak(hasilFinal, members)
    } catch (e) {
      swalUI.fire({ title: 'ERROR', html: 'Gagal proses data.', icon: 'error', showConfirmButton: false, timer: 1500 })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateBypass = async (nipp: string, current: string, nama: string) => {
    const { value: newPin } = await swalUI.fire({
      title: `UPDATE PIN`,
      html: `<p class="font-bold text-[10px] uppercase text-gray-500 mb-1">${nama}</p>`,
      input: 'text',
      inputValue: current || '',
      inputPlaceholder: '6 DIGIT ANGKA',
      showCancelButton: true,
      confirmButtonText: 'SIMPAN',
      cancelButtonText: 'BATAL',
      inputAttributes: { inputmode: 'numeric', maxlength: '6', pattern: '[0-9]*' },
      preConfirm: (pin) => {
        if (!pin || pin.length !== 6 || !/^\d+$/.test(pin)) {
          Swal.showValidationMessage('WAJIB 6 DIGIT ANGKA!')
          return false
        }
        return pin
      }
    })

    if (newPin) {
      setLoading(true)
      const res = await updateBypassPin(nipp, newPin.trim())
      if (res.success) {
        await loadDashboard(false)
        swalUI.fire({ title: 'BERHASIL', icon: 'success', showConfirmButton: false, timer: 1000 })
      }
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#FBFBFD] flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-[3px] border-[#F5F5F7] border-t-[#166534] rounded-full animate-spin shadow-sm"></div>
      <p className="font-bold text-[10px] text-gray-500 uppercase animate-pulse">PROCESSING DATA...</p>
    </div>
  )

  return (
    <main className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] flex flex-col font-sans pb-8 selection:bg-green-100 overflow-x-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shine-glossy { 0% { transform: translateX(-100%) skewX(-20deg); } 100% { transform: translateX(200%) skewX(-20deg); } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D1D5DB; }
      `}} />

      {/* STICKY HEADER U-SHAPE (RAMPING) */}
      <header className="sticky top-0 z-50 w-full h-[85px] md:h-[100px] flex flex-col items-center justify-center text-center flex-shrink-0 transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-[#166534] via-[#22c55e] to-[#14532d] rounded-b-[2rem] shadow-md overflow-hidden">
          <div className="absolute top-0 h-full w-[50%] bg-white/10 animate-[shine-glossy_4s_infinite]"></div>
        </div>
        
        <button onClick={handleLogout} className="absolute top-7 left-5 w-8 h-8 flex items-center justify-center bg-white/20 backdrop-blur-md border border-white/20 text-white font-bold text-[9px] rounded-full shadow-sm hover:bg-red-500 active:scale-95 transition-all duration-200 z-50">
          OUT
        </button>
        
        <div className="relative z-30 flex flex-col items-center justify-center w-full px-4 mt-1">
          <h2 className="text-white font-bold text-[15px] md:text-[18px] uppercase drop-shadow-sm whitespace-nowrap">
            COMMAND CENTER
          </h2>
          <p className="text-green-100 text-[9px] font-bold uppercase opacity-90">
            ADMINISTRATOR AREA
          </p>
        </div>
      </header>

      <div className="w-full max-w-6xl mx-auto px-4 mt-6 flex flex-col gap-5 z-10">
        
        {/* KONTROL SISTEM (SEAMLESS FLEX TABLE) */}
        <div className="bg-white rounded-[1.5rem] p-4 border border-gray-200 shadow-sm flex flex-col gap-3">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase ml-2 mt-1">SYSTEM CONTROLLER</h3>
          <div className="w-full overflow-x-auto custom-scrollbar pb-1">
            <div className="min-w-[650px] flex flex-col gap-1.5">
              
              {/* Header Tabel Flex */}
              <div className="flex items-center px-4 py-2.5 bg-[#F5F5F7] border border-gray-200 rounded-xl">
                <div className="w-[130px] text-[9px] font-bold text-gray-500 uppercase">FASE</div>
                <div className="w-[100px] text-center text-[9px] font-bold text-gray-500 uppercase">STATUS</div>
                <div className="flex-1 text-center text-[9px] font-bold text-gray-500 uppercase">KONTROL AKSI</div>
                <div className="w-[100px] text-right text-[9px] font-bold text-gray-500 uppercase">DATABASE</div>
              </div>

              {/* Baris 1: Bakal Calon */}
              <div className="flex items-center px-4 py-2 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-all shadow-sm">
                <div className="w-[130px] text-[10px] font-bold text-[#1D1D1F] uppercase">1. BAKAL CALON</div>
                <div className="w-[100px] flex justify-center">
                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold border uppercase ${fases.bakalCalon === 'ACTIVE' ? 'bg-green-50 text-green-600 border-green-200' : fases.bakalCalon === 'DONE' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-[#F5F5F7] text-gray-500 border-transparent'}`}>{fases.bakalCalon}</span>
                </div>
                <div className="flex-1 flex justify-center gap-1.5">
                  <button onClick={() => handleFaseAksi(1, 'Bakal Calon', 'ACTIVE')} disabled={fases.bakalCalon !== 'LOCKED'} className="h-8 px-3 bg-gradient-to-br from-[#166534] to-[#22c55e] text-white font-bold text-[9px] rounded-lg shadow-sm hover:shadow-md active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all uppercase">MULAI</button>
                  <button onClick={() => handleFaseAksi(1, 'Bakal Calon', 'DONE')} disabled={fases.bakalCalon !== 'ACTIVE'} className="h-8 px-3 bg-white border border-gray-200 text-gray-700 font-bold text-[9px] rounded-lg shadow-sm hover:bg-gray-50 active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all uppercase">SELESAI</button>
                  <button onClick={handleTutupBakalCalon} disabled={fases.bakalCalon !== 'DONE'} className="h-8 px-3 bg-[#1D1D1F] text-white font-bold text-[9px] rounded-lg shadow-sm hover:bg-black active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all uppercase">REKAP TOP 3</button>
                </div>
                <div className="w-[100px] flex justify-end">
                  <button onClick={() => downloadExcel('Bakal Calon')} className="h-8 px-3 bg-[#F5F5F7] border border-gray-200 text-gray-600 text-[9px] font-bold rounded-lg transition-all active:scale-95 uppercase hover:bg-gray-200">UNDUH</button>
                </div>
              </div>

              {/* Baris 2: Calon Ketua */}
              <div className="flex items-center px-4 py-2 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-all shadow-sm">
                <div className="w-[130px] text-[10px] font-bold text-[#1D1D1F] uppercase">2. CALON KETUA</div>
                <div className="w-[100px] flex justify-center">
                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold border uppercase ${fases.calonKetua === 'ACTIVE' ? 'bg-green-50 text-green-600 border-green-200' : fases.calonKetua === 'DONE' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-[#F5F5F7] text-gray-500 border-transparent'}`}>{fases.calonKetua}</span>
                </div>
                <div className="flex-1 flex justify-center gap-1.5">
                  <button onClick={() => handleFaseAksi(2, 'Calon Ketua', 'ACTIVE')} disabled={fases.calonKetua !== 'LOCKED' || fases.bakalCalon !== 'DONE'} className="h-8 px-3 bg-gradient-to-br from-[#1E40AF] to-[#3B82F6] text-white font-bold text-[9px] rounded-lg shadow-sm hover:shadow-md active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all uppercase">MULAI</button>
                  <button onClick={() => handleFaseAksi(2, 'Calon Ketua', 'DONE')} disabled={fases.calonKetua !== 'ACTIVE'} className="h-8 px-3 bg-white border border-gray-200 text-gray-700 font-bold text-[9px] rounded-lg shadow-sm hover:bg-gray-50 active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all uppercase">SELESAI</button>
                </div>
                <div className="w-[100px] flex justify-end">
                  <button onClick={() => downloadExcel('Calon Ketua')} className="h-8 px-3 bg-[#F5F5F7] border border-gray-200 text-gray-600 text-[9px] font-bold rounded-lg transition-all active:scale-95 uppercase hover:bg-gray-200">UNDUH</button>
                </div>
              </div>

              {/* Baris 3: Pengumuman */}
              <div className="flex items-center px-4 py-2 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-all shadow-sm">
                <div className="w-[130px] text-[10px] font-bold text-[#1D1D1F] uppercase">3. PENGUMUMAN</div>
                <div className="w-[100px] flex justify-center">
                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold border uppercase ${fases.pengumuman === 'ACTIVE' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-[#F5F5F7] text-gray-500 border-transparent'}`}>{fases.pengumuman === 'ACTIVE' ? 'BUKA' : 'LOCKED'}</span>
                </div>
                <div className="flex-1 flex justify-center gap-1.5">
                  <button onClick={() => handleFaseAksi(3, 'Pengumuman', 'LOCKED')} disabled={fases.pengumuman !== 'ACTIVE'} className="h-8 px-3 bg-white border border-gray-200 text-gray-700 font-bold text-[9px] rounded-lg shadow-sm hover:bg-gray-50 active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all uppercase">KUNCI</button>
                  <button onClick={() => handleFaseAksi(3, 'Pengumuman', 'ACTIVE')} disabled={fases.pengumuman === 'ACTIVE' || fases.calonKetua !== 'DONE'} className="h-8 px-3 bg-gradient-to-br from-yellow-400 to-yellow-500 text-slate-900 font-bold text-[9px] rounded-lg shadow-sm hover:shadow-md active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all uppercase">BUKA</button> 
                </div>
                <div className="w-[100px] flex justify-end">
                  <button onClick={downloadExcelHasilAkhir} disabled={fases.calonKetua !== 'DONE'} className="h-8 px-3 bg-[#1D1D1F] text-white text-[9px] font-bold rounded-lg transition-all active:scale-95 disabled:opacity-30 disabled:scale-100 shadow-sm uppercase hover:bg-black">UNDUH</button>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* DATA UTAMA ANGGOTA (SEAMLESS FLEX TABLE) */}
        <div className="bg-white rounded-[1.5rem] p-4 border border-gray-200 shadow-sm flex flex-col gap-3">
          
          {/* HEADER & PENCARIAN */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 px-1">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase shrink-0 w-full md:w-auto text-left">
              DATA ANGGOTA : <span className="text-[#1D1D1F] ml-1">{stats.total} JIWA</span>
            </h3>
            <div className="flex w-full md:w-auto flex-col md:flex-row gap-2 mt-1 md:mt-0">
              <input type="text" placeholder="CARI NAMA ATAU NIPP" onChange={(e) => setSearch(e.target.value)} className="h-10 w-full md:w-[220px] bg-[#F5F5F7] border border-transparent focus:border-green-500 focus:bg-white rounded-xl px-3 text-[10px] font-bold text-[#1D1D1F] placeholder:text-gray-400 transition-all outline-none" />
              <button onClick={handleResetSistem} className="h-10 px-4 bg-red-50 text-red-600 font-bold text-[9px] uppercase rounded-xl transition-all shadow-sm active:scale-95 hover:bg-red-100 border border-red-100 shrink-0 w-full md:w-auto mt-1 md:mt-0">
                RESET DATABASE
              </button>
            </div>
          </div>

          <div className="w-full overflow-x-auto custom-scrollbar pb-2">
            <div className="min-w-[800px] flex flex-col border border-gray-200 rounded-xl overflow-hidden">
              
              {/* Header Tabel Flex */}
              <div className="flex items-center px-4 py-2.5 bg-[#F5F5F7] border-b border-gray-200">
                <div className="w-[40px] text-[9px] font-bold text-gray-500 uppercase">NO</div>
                <div className="w-[90px] text-[9px] font-bold text-gray-500 uppercase">NIPP</div>
                <div className="flex-1 text-[9px] font-bold text-gray-500 uppercase">NAMA</div>
                <div className="w-[110px] text-center text-[9px] font-bold text-gray-500 uppercase">BAKAL CALON</div>
                <div className="w-[110px] text-center text-[9px] font-bold text-gray-500 uppercase">CALON KETUA</div>
                <div className="w-[100px] text-center text-[9px] font-bold text-gray-500 uppercase">PIN</div>
              </div>

              {/* AREA SCROLL INTERNAL 60VH */}
              <div className="flex flex-col max-h-[60vh] overflow-y-auto custom-scrollbar bg-white divide-y divide-gray-100">
                {members.filter(m => m.nama.toLowerCase().includes(search.toLowerCase()) || m.nipp.includes(search)).map((m, index) => (
                  <div key={m.nipp} className="flex items-center px-4 py-2 hover:bg-gray-50 transition-all">
                    <div className="w-[40px] text-[10px] font-bold text-gray-400">{index + 1}</div>
                    <div className="w-[90px] text-[10px] font-bold text-gray-400">{m.nipp}</div>
                    <div className="flex-1 text-[10px] font-bold text-[#1D1D1F] uppercase pr-3 truncate">{m.nama}</div>
                    <div className="w-[110px] flex justify-center">
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border uppercase ${m.sudahMemilihBakalCalon ? 'bg-green-50 text-green-600 border-green-200' : 'bg-[#F5F5F7] text-gray-400 border-transparent'}`}>{m.sudahMemilihBakalCalon ? 'VOTED' : 'BELUM'}</span>
                    </div>
                    <div className="w-[110px] flex justify-center">
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border uppercase ${m.sudahMemilihCalonKetua ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-[#F5F5F7] text-gray-400 border-transparent'}`}>{m.sudahMemilihCalonKetua ? 'VOTED' : 'BELUM'}</span>
                    </div>
                    <div className="w-[100px] flex justify-center">
                      <button onClick={() => handleUpdateBypass(m.nipp, m.tglLahir, m.nama)} className="h-7 px-3 bg-white border border-gray-200 text-[#1D1D1F] font-bold text-[9px] rounded-lg shadow-sm hover:border-green-500 hover:text-green-600 active:scale-95 transition-all uppercase">
                        {m.tglLahir || 'SET PIN'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </main>
  )
}