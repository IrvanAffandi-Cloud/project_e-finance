'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Swal from 'sweetalert2'
import { loginPemilik } from '@/app/actions'

export default function Home() {
  const router = useRouter()
  const [pinAttempts, setPinAttempts] = useState(0)
  const [lockoutTime, setLockoutTime] = useState(0)

  useEffect(() => {
    if (lockoutTime > 0) {
      const timer = setTimeout(() => setLockoutTime(lockoutTime - 1), 1000)
      return () => clearTimeout(timer)
    } else if (lockoutTime === 0 && pinAttempts >= 3) {
      setPinAttempts(0) 
    }
  }, [lockoutTime, pinAttempts])

  const swalUI = Swal.mixin({
    width: '90%',
    customClass: {
      popup: '!max-w-[420px] rounded-[1.5rem] border border-gray-200 shadow-2xl bg-white p-5',
      title: 'text-[#1D1D1F] font-bold uppercase text-[15px] drop-shadow-sm mb-2',
      input: 'h-12 px-3 bg-[#F5F5F7] border border-transparent focus:border-green-500 focus:bg-white rounded-xl text-[14px] font-bold text-center text-[#1D1D1F] transition-all w-full mt-3 shadow-sm placeholder:text-gray-400 tracking-widest',
      actions: 'w-full flex gap-3 mt-5',
      confirmButton: 'flex-1 h-12 flex items-center justify-center bg-gradient-to-br from-[#1D1D1F] to-[#4B5563] text-white font-bold text-[10px] uppercase px-5 rounded-xl shadow-sm hover:shadow-md active:scale-95 transition-all duration-200',
      cancelButton: 'flex-1 h-12 flex items-center justify-center bg-white border border-gray-200 text-gray-500 font-bold text-[10px] uppercase px-5 rounded-xl shadow-sm hover:bg-slate-50 active:scale-95 transition-all duration-200',
      validationMessage: 'bg-red-50 text-red-600 font-bold text-[10px] uppercase rounded-xl border border-red-200 mt-3 py-2 px-3 shadow-sm'
    },
    buttonsStyling: false
  })

  const handleLogin = async () => {
    if (lockoutTime > 0) {
      return swalUI.fire('TERKUNCI', `SISTEM DIBEKUKAN. COBA LAGI DALAM ${lockoutTime} DETIK.`, 'error')
    }

    const { value: pin } = await swalUI.fire({
      title: `LOGIN`,
      input: 'password',
      inputPlaceholder: 'Masukkan PIN',
      showCancelButton: true,
      confirmButtonText: 'MASUK',
      cancelButtonText: 'BATAL',
      inputAttributes: { inputmode: 'numeric', maxlength: '6', pattern: '[0-9]*' },
      preConfirm: async (pinValue) => {
        if (!pinValue || pinValue.length !== 6) return Swal.showValidationMessage('PIN WAJIB 6 DIGIT ANGKA!')
        
        Swal.showLoading()
        const res = await loginPemilik(pinValue.trim())
        
        if (!res.success) {
          setPinAttempts((prev) => {
            const next = prev + 1
            if (next >= 3) {
              setLockoutTime(60) 
              Swal.close()
            }
            return next
          })
          return Swal.showValidationMessage(res.message ?? "PIN SALAH!")
        }
        return true
      }
    })

    if (pin) {
      setPinAttempts(0) 
      swalUI.fire({ title: 'AKSES DIBERIKAN', icon: 'success', timer: 1000, showConfirmButton: false }).then(() => {
        router.push('/dashboard')
      })
    }
  }

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
        <div className="relative z-30 flex flex-col items-center justify-center w-full mt-1">
          <h2 className="text-white font-bold text-[15px] md:text-[18px] uppercase drop-shadow-sm whitespace-nowrap">DIGITAL FINANCE</h2>
          <p className="text-gray-400 text-[9px] font-bold uppercase opacity-90 tracking-widest mt-1">
            CATATAN KEUANGAN PRIBADI
          </p>
        </div>
      </header>

      <div className="flex-1 w-full max-w-[400px] flex flex-col items-center justify-center px-5 pt-6 pb-6 z-10">
        
        <div className="w-full overflow-hidden opacity-90 mb-8" style={{ maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' }}>
          <div className="inline-block whitespace-nowrap animate-[marquee-single_12s_linear_infinite]">
            <h1 className="inline-block text-[#1D1D1F] font-bold text-sm md:text-base uppercase drop-shadow-sm">
              Secure Digital Finance <span className="font-['Cinzel'] ml-2 mr-8 animate-[neon-gold-blink_1.5s_infinite]">LIVE</span>
              Secure Digital Finance <span className="font-['Cinzel'] ml-2 mr-8 animate-[neon-gold-blink_1.5s_infinite]">LIVE</span>
            </h1>
          </div>
        </div>

        {lockoutTime > 0 && (
          <div className="w-full bg-red-50 border border-red-200 text-red-600 text-[10px] font-bold text-center py-3 rounded-xl animate-pulse uppercase mb-4 shadow-sm px-4">
            AKSES DIBEKUKAN ({lockoutTime}s)
          </div>
        )}

        <div className="w-full flex flex-col gap-3">
          <button 
            onClick={handleLogin} 
            disabled={lockoutTime > 0} 
            className={`relative w-full h-14 rounded-xl font-bold text-[12px] uppercase transition-all duration-200 shadow-xl flex items-center justify-center px-5 tracking-wider ${lockoutTime === 0 ? 'bg-gradient-to-br from-[#1D1D1F] to-[#4B5563] text-white active:scale-[0.98] hover:shadow-2xl' : 'bg-white text-gray-400 border border-gray-200 cursor-not-allowed'}`}
          >
            LOGIN
          </button>
        </div>
      </div>

      <footer className="mt-auto pb-6 text-center z-10">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">IRVAN AFFANDI © 2026</p>
      </footer>
    </main>
  )
}