'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Swal from 'sweetalert2'
import { loginPemilik, cekStatusLogin, logoutPemilik } from '@/app/actions'

export default function Home() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [tapCount, setTapCount] = useState(0)

  useEffect(() => {
    cekStatusLogin().then(res => {
      if (res.success) setIsLoggedIn(true)
    })
  }, [])

  const handleSecretTap = () => {
    const newTap = tapCount + 1
    setTapCount(newTap)
    if (newTap >= 3) {
      setTapCount(0)
      if (!isLoggedIn) handleLogin() 
    }
    setTimeout(() => setTapCount(0), 2000) 
  }

  // SIPEKAT SWEETALERT STYLE
  const baseSwalClass = {
    popup: '!max-w-[380px] !rounded-[2rem] border border-gray-200 shadow-2xl bg-white p-6',
    title: 'text-[#1D1D1F] font-black uppercase text-[12px] tracking-widest mb-4',
    actions: 'w-full flex flex-col gap-2 mt-5',
    confirmButton: 'w-full h-10 flex items-center justify-center bg-[#0B214A] text-white font-black text-[10px] tracking-[0.15em] uppercase px-5 rounded-xl shadow-sm hover:bg-blue-900 active:scale-95 transition-all duration-200',
    cancelButton: 'w-full h-10 flex items-center justify-center bg-[#F5F5F7] border border-transparent text-gray-500 font-black text-[10px] tracking-[0.15em] uppercase px-5 rounded-xl hover:bg-gray-200 active:scale-95 transition-all duration-200',
    validationMessage: 'bg-red-50 text-red-600 font-black text-[9px] tracking-widest uppercase rounded-xl border border-red-200 mt-3 py-2 px-3 shadow-sm'
  }

  const handleLogin = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'OTORISASI SISTEM',
      html: `
        <div class="flex flex-col gap-3">
          <div class="text-left">
            <label class="text-[9px] font-black text-gray-400 tracking-[0.15em] uppercase mb-1.5 block">Email Akses</label>
            <input id="swal-email" type="email" placeholder="ADMIN@DOMAIN.COM" class="w-full h-10 px-4 bg-[#F5F5F7] border border-transparent focus:border-blue-500 focus:bg-white rounded-xl text-center font-black text-[#1D1D1F] outline-none text-[10px] placeholder:text-gray-300 placeholder:font-bold tracking-widest transition-all">
          </div>
          <div class="text-left">
            <label class="text-[9px] font-black text-gray-400 tracking-[0.15em] uppercase mb-1.5 block">Security Key</label>
            <input id="swal-pass" type="password" placeholder="••••••••" class="w-full h-10 px-4 bg-[#F5F5F7] border border-transparent focus:border-blue-500 focus:bg-white rounded-xl text-center font-black text-[#1D1D1F] outline-none text-[14px] tracking-[0.5em] placeholder:text-gray-300 transition-all">
          </div>
        </div>
      `,
      showCancelButton: true, confirmButtonText: 'BUKA BRANKAS', cancelButtonText: 'BATAL', customClass: baseSwalClass, buttonsStyling: false,
      preConfirm: async () => {
        const email = (document.getElementById('swal-email') as HTMLInputElement).value
        const pass = (document.getElementById('swal-pass') as HTMLInputElement).value
        if (!email || !pass) return Swal.showValidationMessage('KREDENSIAL TIDAK LENGKAP!')
        
        Swal.showLoading()
        const res = await loginPemilik(email.trim(), pass.trim())
        if (!res.success) return Swal.showValidationMessage(res.message || 'KREDENSIAL SALAH ATAU DITOLAK!')
        return true
      }
    })

    if (formValues) {
      setIsLoggedIn(true)
      Swal.fire({ title: 'AKSES DIBERIKAN', icon: 'success', timer: 1000, showConfirmButton: false })
    }
  }

  const handleLogout = async () => {
    const res = await Swal.fire({ 
      title: 'KUNCI BRANKAS?', showCancelButton: true, confirmButtonText: 'KUNCI SEKARANG', cancelButtonText: 'BATAL', customClass: { ...baseSwalClass, confirmButton: baseSwalClass.confirmButton.replace('bg-[#0B214A]', 'bg-red-600').replace('hover:bg-blue-900', 'hover:bg-red-700') }, buttonsStyling: false 
    })
    if (res.isConfirmed) {
      Swal.showLoading()
      await logoutPemilik()
      setIsLoggedIn(false)
      Swal.fire({ title: 'TERKUNCI', icon: 'success', timer: 1000, showConfirmButton: false })
    }
  }

  // GLOWING MENU SIPEKAT STYLE
  const menus = [
    { id: 'DASHBOARD', path: '/dashboard', label: 'DASHBOARD ANALITIK', colorBg: 'bg-[#0B214A]', colorBorder: 'border-blue-400/20', colorGlow: 'bg-blue-600/30' },
    { id: 'TAGIHAN', path: '/pembayaran', label: 'PUSAT TAGIHAN', colorBg: 'bg-red-600', colorBorder: 'border-red-500', colorGlow: 'bg-red-500/30' },
    { id: 'CICILAN', path: '/cicilan', label: 'MANAJEMEN CICILAN', colorBg: 'bg-blue-600', colorBorder: 'border-blue-500', colorGlow: 'bg-blue-500/30' },
    { id: 'PEMASUKAN', path: '/pemasukan', label: 'CATAT PEMASUKAN', colorBg: 'bg-green-600', colorBorder: 'border-green-500', colorGlow: 'bg-green-500/30' },
    { id: 'PENGELUARAN', path: '/pengeluaran', label: 'CATAT PENGELUARAN', colorBg: 'bg-orange-600', colorBorder: 'border-orange-500', colorGlow: 'bg-orange-500/30' },
  ]

  return (
    <main className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] flex flex-col items-center relative overflow-x-hidden font-sans selection:bg-blue-100">
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee-single { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes shine-glossy { 0% { transform: translateX(-100%) skewX(-20deg); } 100% { transform: translateX(200%) skewX(-20deg); } }
        @keyframes neon-status-blink { 0%, 100% { opacity: 1; text-shadow: 0 0 8px currentColor, 0 0 15px currentColor; } 50% { opacity: 0.4; text-shadow: 0 0 2px currentColor; } }
      `}} />

      {/* SIPEKAT U-SHAPE HEADER */}
      <header className="w-full relative z-20 flex justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B214A] via-[#1E3A8A] to-[#0B214A] h-[120px] rounded-b-[2.5rem] shadow-[0_10px_30px_rgba(30,58,138,0.3)] border-b border-blue-300/30 overflow-hidden">
          <div className="absolute top-0 h-full w-[50%] bg-gradient-to-r from-transparent via-white/[0.15] to-transparent animate-[shine-glossy_4s_infinite]"></div>
        </div>
        
        {/* TOMBOL HEADER SIPEKAT STYLE */}
        {isLoggedIn && (
          <div className="absolute top-4 right-4 z-40 flex gap-2">
            <button onClick={() => router.push('/kategori')} className="bg-white/10 backdrop-blur-md border border-white/20 text-white font-black text-[7px] px-3 py-2 rounded-lg uppercase tracking-[0.2em] hover:bg-white/20 transition-all shadow-sm">
              KATEGORI
            </button>
            <button onClick={handleLogout} className="bg-red-500/80 backdrop-blur-md border border-red-400/50 text-white font-black text-[7px] px-3 py-2 rounded-lg uppercase tracking-[0.2em] hover:bg-red-600 transition-all shadow-sm">
              LOCK
            </button>
          </div>
        )}

        <div className="relative z-30 flex flex-col items-center justify-center h-[120px] pt-2">
          <h2 className="text-white font-black text-[15px] tracking-[0.4em] uppercase text-center drop-shadow-md leading-none mt-1">
            DIGITAL FINANCE
          </h2>
          <p onClick={handleSecretTap} className="text-blue-200 text-[8px] font-bold tracking-[0.3em] uppercase opacity-90 leading-none mt-2 cursor-pointer select-none">
            CATATAN KEUANGAN PRIBADI
          </p>
        </div>
      </header>

      <div className="flex-1 w-full max-w-[420px] flex flex-col items-center justify-start gap-10 px-8 pt-8 pb-6 relative z-10">
        
        {/* MARQUEE SIPEKAT STYLE */}
        <div className="w-full overflow-hidden relative opacity-90" style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
          <div className="inline-block whitespace-nowrap animate-[marquee-single_12s_linear_infinite]">
            <h1 className="inline-block text-[#1D1D1F] font-black text-[16px] tracking-tight uppercase">
              SYSTEM SECURITY <span className={`font-['Cinzel'] ml-3 mr-12 animate-[neon-status-blink_1.5s_infinite] ${isLoggedIn ? 'text-green-500' : 'text-red-500'}`}>{isLoggedIn ? 'LIVE' : 'LOCKED'}</span>
              SYSTEM SECURITY <span className={`font-['Cinzel'] ml-3 mr-12 animate-[neon-status-blink_1.5s_infinite] ${isLoggedIn ? 'text-green-500' : 'text-red-500'}`}>{isLoggedIn ? 'LIVE' : 'LOCKED'}</span>
            </h1>
          </div>
        </div>

        {/* GLOWING BUTTON AREA */}
        <div className="w-full flex flex-col gap-4 mt-auto">
          {menus.map((btn) => (
            <div key={btn.id} className="relative group w-full">
              {isLoggedIn && <div className={`absolute -inset-1 ${btn.colorGlow} blur-xl rounded-full opacity-60 group-hover:opacity-100 transition duration-500`}></div>}
              <button 
                onClick={() => router.push(btn.path)}
                disabled={!isLoggedIn} 
                className={`relative w-full ${isLoggedIn ? btn.colorBg : 'bg-[#F5F5F7]'} ${isLoggedIn ? 'text-white' : 'text-gray-400'} py-4 rounded-[1.2rem] font-black tracking-[0.15em] text-[11px] border ${isLoggedIn ? btn.colorBorder : 'border-gray-200'} active:scale-95 transition-all flex items-center justify-center gap-2 ${!isLoggedIn && 'cursor-not-allowed shadow-inner'}`}
              >
                {btn.label}
                {isLoggedIn ? (
                  <svg className="w-4 h-4 opacity-60 absolute right-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
                ) : (
                  <span className="absolute right-5 text-[7px] bg-gray-200 text-gray-500 px-2 py-1 rounded-md uppercase border border-gray-300 tracking-widest font-black">LOCKED</span>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      <footer className="mt-auto pb-8 pt-4 flex flex-col items-center w-full relative z-10">
        <p className="text-[6px] font-black tracking-[0.6em] text-slate-400 uppercase text-center mb-1">OWNER</p>
        <h3 className="text-[#1D1D1F]/50 font-black text-[9px] tracking-[0.3em] uppercase">IRVAN AFFANDI | 2026</h3>
      </footer>
    </main>
  )
}