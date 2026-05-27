'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Swal from 'sweetalert2'
import { fetchResultData } from '@/app/actions' 

export default function Pengumuman() {
  const router = useRouter()
  const [results, setResults] = useState<any[]>([])
  const [totalVotes, setTotalVotes] = useState(0)
  const [totalAnggota, setTotalAnggota] = useState(0)
  const [isLocked, setIsLocked] = useState(true)
  const [loading, setLoading] = useState(true)

  const getResults = async () => {
    try {
      const data = await fetchResultData()
      setIsLocked(data.isLocked)
      setResults(data.results)
      setTotalVotes(data.totalVotes)
      setTotalAnggota(data.totalAnggota)
    } catch (error) {
      setIsLocked(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getResults()
  }, [])

  const baseCustomClass = {
    popup: '!max-w-[420px] !rounded-[1.5rem] !border !border-gray-200 !shadow-2xl !bg-white !p-5',
    title: 'text-[#1D1D1F] font-bold uppercase text-[15px] drop-shadow-sm mb-1',
    htmlContainer: 'text-[9px] font-bold text-gray-500 uppercase',
    confirmButton: '!flex-1 !h-11 !flex !items-center !justify-center !bg-gradient-to-br !from-[#166534] !to-[#22c55e] !text-white font-bold !text-[10px] uppercase !px-5 !rounded-xl !shadow-sm hover:!shadow-md active:!scale-95 transition-all duration-200',
    cancelButton: '!flex-1 !h-11 !flex !items-center !justify-center !bg-white !border !border-gray-200 !text-gray-500 font-bold !text-[10px] uppercase !px-5 !rounded-xl !shadow-sm hover:!bg-slate-50 active:!scale-95 transition-all duration-200',
  }

  const swalUI = Swal.mixin({
    width: '90%',
    customClass: baseCustomClass,
    buttonsStyling: false
  })

  const handleKembali = async () => {
    const confirm = await swalUI.fire({
      title: 'KELUAR DARI PORTAL?',
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

  if (loading) return (
    <div className="min-h-screen bg-[#FBFBFD] flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-[3px] border-[#F5F5F7] border-t-[#166534] rounded-full animate-spin shadow-sm"></div>
      <p className="font-bold text-[10px] text-gray-500 uppercase animate-pulse">MENGHITUNG HASIL...</p>
    </div>
  )

  if (isLocked) {
    return (
      <main className="min-h-screen bg-[#FBFBFD] flex flex-col items-center justify-center p-5 text-center font-sans">
        <div className="max-w-[400px] w-full bg-white border border-gray-200 p-6 rounded-[1.5rem] shadow-sm flex flex-col items-center">
          <div className="w-14 h-14 bg-[#F5F5F7] rounded-xl flex items-center justify-center mb-5 border border-gray-100 shadow-sm animate-pulse">
            <svg className="w-6 h-6 text-[#1D1D1F]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>
          <h1 className="text-[#1D1D1F] font-bold text-[16px] uppercase mb-1 drop-shadow-sm">HASIL TERKUNCI</h1>
          <p className="text-gray-500 text-[10px] font-bold uppercase mb-6 px-2">
            HASIL BELUM DISAHKAN ATAU PEMILIHAN MASIH BERLANGSUNG.
          </p>
          <button onClick={() => router.push('/')} className="w-full h-11 flex items-center justify-center rounded-xl bg-[#F5F5F7] border border-gray-200 text-[#1D1D1F] font-bold text-[10px] uppercase active:scale-95 hover:bg-white hover:border-gray-300 transition-all shadow-sm px-5">
            KEMBALI KE BERANDA
          </button>
        </div>
      </main>
    )
  }

  const getPodiumStyle = (index: number) => {
    switch (index) {
      case 0: return { order: 'order-1 md:order-2', scale: 'md:-translate-y-6 z-30 scale-105', border: 'border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.15)]', badge: 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-[#1D1D1F] border border-yellow-300', title: 'KETUA TERPILIH', icon: <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg> }
      case 1: return { order: 'order-2 md:order-1', scale: 'z-20', border: 'border-gray-200 shadow-sm', badge: 'bg-[#F5F5F7] text-gray-500 border border-gray-200', title: 'RUNNER UP 1', icon: <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg> }
      case 2: return { order: 'order-3 md:order-3', scale: 'z-10', border: 'border-gray-200 shadow-sm', badge: 'bg-[#F5F5F7] text-gray-500 border border-gray-200', title: 'RUNNER UP 2', icon: <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg> }
      default: return { order: 'order-last', scale: '', border: 'border-gray-200 shadow-sm', badge: 'bg-[#F5F5F7] text-gray-500 border border-gray-200', title: 'KANDIDAT', icon: <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7"></path></svg> }
    }
  }

  const persentasePartisipasi = totalAnggota > 0 ? ((totalVotes / totalAnggota) * 100).toFixed(1) : "0.0"

  return (
    <main className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] flex flex-col items-center font-sans pb-12 selection:bg-green-100 overflow-x-hidden">
      <style dangerouslySetInnerHTML={{__html: `@keyframes shine-glossy { 0% { transform: translateX(-100%) skewX(-20deg); } 100% { transform: translateX(200%) skewX(-20deg); } }`}} />

      {/* STICKY HEADER U-SHAPE (DIUPDATE BIAR TRANSPARAN) */}
      <header className="sticky top-0 z-50 w-full h-[110px] md:h-[120px] flex-shrink-0 transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-[#166534] via-[#22c55e] to-[#14532d] rounded-b-[2rem] shadow-md overflow-hidden">
          <div className="absolute top-0 h-full w-[50%] bg-white/10 animate-[shine-glossy_4s_infinite]"></div>
        </div>

        <div className="relative z-30 h-full w-full max-w-6xl mx-auto px-4 flex items-center justify-center mt-1">
          
          <button onClick={handleKembali} className="absolute left-5 w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-red-500 text-white rounded-full backdrop-blur-md border border-white/20 transition-all active:scale-95 shadow-sm z-50">
            <svg className="w-4 h-4 pr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"></path></svg>
          </button>

          <div className="flex flex-col items-center text-center mt-2 w-full px-12">
            <h2 className="text-white font-bold text-[15px] md:text-[18px] uppercase drop-shadow-sm whitespace-nowrap">HASIL REKAPITULASI</h2>
            
            {/* BOX STATISTIK HEADER (TRANSPARAN MUTLAK) */}
            <div className="bg-black/20 px-4 py-2 rounded-xl border border-white/10 mt-2 flex flex-col md:flex-row items-center gap-2 md:gap-4 shadow-sm w-fit overflow-hidden">
              <div className="flex items-center gap-1.5">
                 <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0"></span>
                 <p className="text-white text-[9px] font-bold uppercase truncate">
                   SUARA MASUK: <span className="ml-1">{totalVotes}</span> / {totalAnggota} <span className="text-green-200 ml-1">({persentasePartisipasi}%)</span>
                 </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* PODIUM AREA */}
      <div className="w-full max-w-5xl px-5 mt-10 md:mt-14 z-10">
        {results.length > 0 ? (
          <div className="flex flex-col md:flex-row justify-center items-center md:items-end gap-10 md:gap-5 lg:gap-6 pb-2">
            {results.slice(0, 3).map((k, index) => {
              const style = getPodiumStyle(index)
              return (
                <div key={k.nipp} className={`w-full max-w-[300px] bg-white p-5 md:p-6 rounded-[2rem] border flex flex-col items-center text-center relative transition-all duration-700 hover:-translate-y-1 ${style.order} ${style.scale} ${style.border}`}>
                  
                  {/* BADGE PREMIUM */}
                  <div className={`absolute -top-3.5 px-4 py-1.5 rounded-xl font-bold text-[9px] uppercase shadow-sm flex items-center gap-1.5 ${style.badge}`}>
                    {style.icon} <span>{style.title}</span>
                  </div>

                  <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#F5F5F7] border-[4px] border-white shadow-sm flex items-center justify-center overflow-hidden mb-5 mt-3 shrink-0`}>
                     <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                  </div>

                  <div className="flex-1 w-full flex flex-col items-center justify-center mb-5">
                    <h3 className="font-bold text-[#1D1D1F] text-[15px] md:text-[16px] uppercase mb-1.5 leading-tight break-words whitespace-normal px-2">
                      {k.nama}
                    </h3>
                    <p className="text-[10px] text-gray-500 font-bold">{k.nipp}</p>
                  </div>

                  <div className="w-full bg-[#F5F5F7] p-5 rounded-2xl border border-transparent shadow-inner mt-auto">
                    <p className="text-3xl font-bold text-[#1D1D1F] leading-none mb-1">{k.votes}</p>
                    <p className="text-[9px] font-bold text-gray-500 uppercase mb-3">DARI TOTAL SUARA MASUK</p>
                    
                    <div className="relative w-full h-2.5 bg-gray-200 rounded-full overflow-hidden shadow-inner border border-gray-300/50">
                      <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#166534] to-[#22c55e] transition-all duration-1000 ease-out" style={{ width: `${k.percentage}%` }}></div>
                    </div>
                    <p className="text-[10px] font-bold text-[#166534] mt-2">{k.percentage}%</p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-20 text-center text-gray-500 font-bold uppercase text-[9px] flex flex-col items-center gap-3 bg-white rounded-[2rem] border border-gray-200 shadow-sm mx-4">
             <div className="w-8 h-8 border-[3px] border-[#F5F5F7] border-t-[#166534] rounded-full animate-spin"></div>
             MEREKAP HASIL SUARA...
          </div>
        )}
      </div>

    </main>
  )
}