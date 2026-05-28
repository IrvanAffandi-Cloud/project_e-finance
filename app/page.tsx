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

  const baseSwalClass = {
    popup: '!max-w-[420px] rounded-[1.5rem] border border-gray-200 shadow-2xl bg-white p-5',
    title: 'text-[#1D1D1F] font-bold uppercase text-[15px] drop-shadow-sm mb-2',
    actions: 'w-full flex gap-3 mt-5',
    confirmButton: 'flex-1 h-12 flex items-center justify-center bg-gradient-to-br from-[#1D1D1F] to-[#4B5563] text-white font-bold text-[10px] uppercase px-5 rounded-xl shadow-sm hover:shadow-md active:scale-95 transition-all duration-200',
    cancelButton: 'flex-1 h-12 flex items-center justify-center bg-white border border-gray-200 text-gray-500 font-bold text-[10px] uppercase px-5 rounded-xl shadow-sm hover:bg-slate-50 active:scale-95 transition-all duration-200',
    validationMessage: 'bg-red-50 text-red-600 font-bold text-[10px] uppercase rounded-xl border border-red-200 mt-3 py-2 px-3 shadow-sm'
  }

  const handleLogin = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'OTORISASI SISTEM',
      html: `
        <input id="swal-email" type="email" placeholder="EMAIL SUPABASE" class="w-full h-12 px-4 mb-3 bg-[#F5F5F7] border border-gray-200 rounded-xl text-center font-bold text-[#1D1D1F] outline-none focus:border-blue-500 text-[12px] placeholder:text-gray-400 tracking-wider">
        <input id="swal-pass" type="password" placeholder="PASSWORD" class="w-full h-12 px-4 bg-[#F5F5F7] border border-gray-200 rounded-xl text-center font-bold text-[#1D1D1F] outline-none focus:border-blue-500 text-[12px] placeholder:text-gray-400 tracking-wider">
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
      title: 'KUNCI BRANKAS?', showCancelButton: true, confirmButtonText: 'KUNCI', cancelButtonText: 'BATAL', customClass: baseSwalClass, buttonsStyling: false 
    })
    if (res.isConfirmed) {
      Swal.showLoading()
      await logoutPemilik()
      setIsLoggedIn(false)
      Swal.fire({ title: 'TERKUNCI', icon: 'success', timer: 1000, showConfirmButton: false })
    }
  }

  const menus = [
    { id: 'DASHBOARD', path: '/dashboard', label: 'DASHBOARD ANALITIK', color: 'from-[#1D1D1F] to-[#4B5563]' },
    { id: 'TAGIHAN', path: '/pembayaran', label: 'PUSAT TAGIHAN', color: 'from-red-600 to-red-500' },
    { id: 'CICILAN', path: '/cicilan', label: 'MANAJEMEN CICILAN', color: 'from-blue-600 to-blue-500' },
    { id: 'PEMASUKAN', path: '/pemasukan', label: 'CATAT PEMASUKAN', color: 'from-green-600 to-green-500' },
    { id: 'PENGELUARAN', path: '/pengeluaran', label: 'CATAT PENGELUARAN', color: 'from-orange-500 to-orange-400' },
  ]

  return (
    <main className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] flex flex-col items-center relative overflow-x-hidden font-sans selection:bg-gray-200">
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee-single { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes shine-glossy { 0% { transform: translateX(-100%) skewX(-20deg); } 100% { transform: translateX(200%) skewX(-20deg); } }
        @keyframes neon-gold-blink { 0%, 100% { opacity: 1; text-shadow: 0 0 10px rgba(234,179,8,0.8); color: #eab308; } 50% { opacity: 0.7; text-shadow: 0 0 3px rgba(161,98,7,0.5); color: #a16207; } }
      `}} />

      <header className="sticky top-0 z-50 w-full h-[85px] md:h-[100px] flex flex-col items-center justify-center text-center px-4 flex-shrink-0 transition-all duration-300">
        <div className="absolute inset-0 bg-[#1D1D1F] rounded-b-[2rem] shadow-md overflow-hidden">
          <div className="absolute top-0 h-full w-[50%] bg-white/5 animate-[shine-glossy_4s_infinite]"></div>
        </div>
        
        {/* TOMBOL HEADER DARURAT (HANYA MUNCUL KALAU LOGIN) */}
        {isLoggedIn && (
          <div className="absolute top-4 right-5 z-40 flex gap-2">
            <button onClick={() => router.push('/kategori')} className="bg-blue-600/20 border border-blue-500/50 text-white font-bold text-[8px] px-3 py-1.5 rounded-full uppercase tracking-widest hover:bg-blue-600 transition-all shadow-sm">
              KATEGORI
            </button>
            <button onClick={handleLogout} className="bg-red-600/20 border border-red-500/50 text-white font-bold text-[8px] px-3 py-1.5 rounded-full uppercase tracking-widest hover:bg-red-600 transition-all shadow-sm">
              LOCK
            </button>
          </div>
        )}

        <div className="relative z-30 flex flex-col items-center justify-center w-full mt-1">
          <h2 className="text-white font-bold text-[15px] md:text-[18px] uppercase drop-shadow-sm whitespace-nowrap">DIGITAL FINANCE</h2>
          <p onClick={handleSecretTap} className="text-gray-400 text-[9px] font-bold uppercase opacity-90 tracking-widest mt-1 p-2 -my-2 cursor-pointer active:scale-95 transition-all duration-200 select-none">
            CATATAN KEUANGAN PRIBADI
          </p>
        </div>
      </header>

      <div className="flex-1 w-full max-w-[400px] flex flex-col items-center justify-start px-5 pt-6 pb-6 z-10">
        <div className="w-full overflow-hidden opacity-90 mb-8" style={{ maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' }}>
          <div className="inline-block whitespace-nowrap animate-[marquee-single_12s_linear_infinite]">
            <h1 className="inline-block text-[#1D1D1F] font-bold text-sm md:text-base uppercase drop-shadow-sm">
              Secure Digital Finance <span className="font-['Cinzel'] ml-2 mr-8 animate-[neon-gold-blink_1.5s_infinite]">{isLoggedIn ? 'LIVE' : 'LOCKED'}</span>
              Secure Digital Finance <span className="font-['Cinzel'] ml-2 mr-8 animate-[neon-gold-blink_1.5s_infinite]">{isLoggedIn ? 'LIVE' : 'LOCKED'}</span>
            </h1>
          </div>
        </div>

        <div className="w-full flex flex-col gap-3 mt-auto">
          {menus.map((btn) => (
            <button 
              key={btn.id}
              onClick={() => router.push(btn.path)}
              disabled={!isLoggedIn} 
              className={`relative w-full h-14 rounded-xl font-bold text-[11px] uppercase transition-all duration-200 shadow-sm flex items-center justify-between px-5 tracking-widest
                ${isLoggedIn ? `bg-gradient-to-br ${btn.color} text-white active:scale-[0.98] hover:shadow-lg border-transparent` : 'bg-white text-gray-400 border border-gray-200 cursor-not-allowed'}`}
            >
              {btn.label}
              {!isLoggedIn && <span className="text-[8px] bg-[#F5F5F7] text-gray-400 px-2 py-1 rounded-md uppercase border border-gray-200">LOCKED</span>}
            </button>
          ))}
        </div>
      </div>

      <footer className="mt-auto pb-6 text-center z-10">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">IRVAN AFFANDI © 2026</p>
      </footer>
    </main>
  )
}