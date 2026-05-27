'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Swal from 'sweetalert2'
import { fetchCalonKetuaData, coblosCalonKetua } from '@/app/actions'

export default function CalonKetua() {
  const router = useRouter()
  const [kandidat, setKandidat] = useState<any[]>([])
  const [userLogin, setUserLogin] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isDone, setIsDone] = useState(false) 

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchCalonKetuaData()
        setKandidat(data.kandidat)
        setUserLogin(data.user)
        if (data.user.sudahMemilihCalonKetua) setIsDone(true)
      } catch (error) {
        if (!isDone) router.push('/')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [router, isDone])

  const baseCustomClass = {
    popup: '!max-w-[420px] !rounded-[1.5rem] !border !border-gray-200 !shadow-2xl !bg-white !p-5',
    title: 'text-[#1D1D1F] font-bold uppercase text-[15px] drop-shadow-sm mb-1',
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

  const handleCoblos = async (pilihan: any) => {
    const confirm = await swalUI.fire({
      title: 'KUNCI PILIHAN ANDA?',
      html: `<div class="mt-3 py-3 px-4 bg-[#F5F5F7] rounded-xl border border-gray-200 break-words whitespace-normal"><b class="text-[#166534] text-[15px] md:text-[16px] font-bold uppercase drop-shadow-sm leading-tight">${pilihan.nama}</b></div>`,
      showCancelButton: true,
      confirmButtonText: 'PILIH',
      cancelButtonText: 'BATAL',
    })

    if (!confirm.isConfirmed) return
    
    Swal.fire({ title: 'MEMPROSES...', allowOutsideClick: false, didOpen: () => Swal.showLoading() })

    const res = await coblosCalonKetua(pilihan.nipp) 

    if (res.success) {
      setIsDone(true) 
      swalUI.fire({ 
        title: 'VOTING SELESAI', 
        icon: 'success', 
        showConfirmButton: false,
        timer: 1500 
      })
    } else {
      swalUI.fire({ title: 'GAGAL!', html: res.message || 'TERJADI GANGGUAN SISTEM.', icon: 'error' })
    }
  }

  const handleKeluar = async () => {
    const confirm = await swalUI.fire({
      title: 'KELUAR BILIK?',
      showCancelButton: true,
      confirmButtonText: 'KELUAR',
      cancelButtonText: 'BATAL',
      customClass: {
        ...baseCustomClass,
        confirmButton: '!flex-1 !h-11 !flex !items-center !justify-center !bg-red-600 !text-white font-bold !text-[10px] uppercase !px-5 !rounded-xl !shadow-sm hover:!bg-red-700 active:!scale-95 transition-all duration-200'
      }
    })

    if (confirm.isConfirmed) {
      router.push('/')
    }
  }

  if (loading || !userLogin) return (
    <div className="min-h-screen bg-[#FBFBFD] flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-[3px] border-[#F5F5F7] border-t-[#166534] rounded-full animate-spin shadow-sm"></div>
      <p className="font-bold text-[10px] text-gray-500 uppercase animate-pulse">MEMUAT KOTAK SUARA...</p>
    </div>
  )
  
  return (
    <main className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] flex flex-col items-center relative overflow-x-hidden font-sans pb-8 selection:bg-green-100">
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shine-glossy { 0% { transform: translateX(-100%) skewX(-20deg); } 100% { transform: translateX(200%) skewX(-20deg); } }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      <header className="sticky top-0 z-50 w-full h-[85px] md:h-[100px] flex-shrink-0 transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-[#166534] via-[#22c55e] to-[#14532d] rounded-b-[2rem] shadow-md overflow-hidden">
          <div className="absolute top-0 h-full w-[50%] bg-white/10 animate-[shine-glossy_4s_infinite]"></div>
        </div>

        <div className="relative z-30 h-full w-full max-w-6xl mx-auto px-4 flex items-center justify-center mt-1">
          
          <button 
            onClick={handleKeluar} 
            className="absolute left-5 w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-red-500 text-white rounded-full backdrop-blur-md border border-white/20 transition-all active:scale-95 shadow-sm z-50">
            <svg className="w-4 h-4 pr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"></path></svg>
          </button>

          <div className="flex flex-col items-center text-center mt-1 w-full px-14">
            <h2 className="text-white font-bold text-[15px] md:text-[18px] uppercase drop-shadow-sm whitespace-nowrap">PEMILIHAN CALON KETUA</h2>
            <div className="bg-black/20 px-3 py-1.5 rounded-xl border border-white/10 mt-1 flex items-center gap-1.5 shadow-sm max-w-full overflow-hidden">
              <div className={`w-1.5 h-1.5 shrink-0 rounded-full ${isDone ? 'bg-gray-400' : 'bg-green-400 animate-pulse shadow-[0_0_6px_rgba(74,222,128,0.8)]'}`}></div>
              <p className="text-white text-[9px] font-bold uppercase truncate">
                PEMILIH: <span className="text-green-200 ml-1">{userLogin.nama}</span> {isDone && " (VOTED)"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full flex-1 flex flex-col justify-center mt-6 z-10">
        <div className="w-full max-w-6xl mx-auto flex flex-row overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-5 md:grid md:grid-cols-3 md:gap-6 px-5 pb-5 pt-2">
          
          {kandidat.length > 0 ? kandidat.map((k) => (
            <div key={k.nipp} className={`min-w-[85vw] sm:min-w-[300px] md:min-w-0 snap-center shrink-0 bg-white p-5 rounded-[1.5rem] border border-gray-200 shadow-sm flex flex-col items-center text-center relative overflow-hidden group transition-all duration-300 ${isDone ? 'opacity-60 bg-[#F5F5F7]' : 'hover:shadow-md hover:border-green-400 hover:-translate-y-1'}`}>
              
              <div className="absolute top-0 w-full h-1/2 bg-[#F5F5F7]/50 z-0"></div>

              <div className="relative z-10 w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-[#F5F5F7] border border-gray-200 shadow-sm group-hover:scale-105 transition-transform duration-500 overflow-hidden mb-4 flex items-center justify-center shrink-0 mt-2">
                <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              </div>

              <div className="flex-1 flex flex-col justify-center items-center mb-5 w-full">
                <h3 className="relative z-10 font-bold text-[#1D1D1F] text-[15px] md:text-[16px] uppercase mb-1.5 leading-tight break-words whitespace-normal px-2">
                  {k.nama}
                </h3>
                <p className="relative z-10 text-[9px] md:text-[10px] text-gray-500 font-bold uppercase">
                  {k.nipp}
                </p>
              </div>

              <button 
                onClick={() => !isDone && handleCoblos(k)}
                disabled={isDone}
                className={`relative z-10 w-full h-12 rounded-xl font-bold text-[10px] uppercase transition-all px-5 shadow-sm flex items-center justify-center ${isDone ? 'bg-white text-gray-400 border border-gray-200 cursor-not-allowed' : 'bg-gradient-to-br from-[#166534] to-[#22c55e] text-white hover:shadow-md active:scale-[0.98] border border-transparent'}`}>
                {isDone ? 'SUARA TERKUNCI' : 'PILIH KANDIDAT'}
              </button>
            </div>
          )) : (
            <div className="col-span-full py-20 text-center flex flex-col items-center justify-center gap-3 bg-white rounded-[1.5rem] border border-gray-200 shadow-sm mx-4">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              <p className="text-gray-400 font-bold uppercase text-[9px]">DATA CALON KETUA BELUM DISAHKAN</p>
            </div>
          )}

        </div>
        
        {kandidat.length > 0 && (
          <div className="md:hidden text-center flex flex-col items-center gap-1.5 opacity-50 mt-3 mb-6">
            <span className="text-[8px] font-bold text-gray-500 uppercase">GESER UNTUK KANDIDAT LAIN</span>
            <div className="flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
              <span className="w-2 h-2 bg-[#166534] rounded-full"></span>
              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
            </div>
          </div>
        )}
      </div>

    </main>
  )
}