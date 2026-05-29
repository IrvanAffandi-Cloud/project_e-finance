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

  // SIPEKAT SWEETALERT STYLE - COMPACT & RAPET
  const baseSwalClass = {
    popup: '!max-w-sm !rounded-xl border border-gray-200 shadow-sm bg-[#FBFBFD] p-4',
    title: 'text-[#1D1D1F] font-black uppercase text-xs tracking-widest mb-3',
    actions: 'w-full flex flex-row gap-2 mt-3',
    confirmButton: 'flex-1 h-10 flex items-center justify-center bg-[#1D1D1F] text-white font-bold text-[10px] tracking-wider uppercase px-4 rounded-xl shadow-sm active:scale-95 transition-all',
    cancelButton: 'flex-1 h-10 flex items-center justify-center bg-white border border-gray-200 text-[#1D1D1F] font-bold text-[10px] tracking-wider uppercase px-4 rounded-xl shadow-sm active:scale-95 transition-all',
    validationMessage: 'bg-red-50 text-red-600 font-bold text-[9px] tracking-wide uppercase rounded-xl border border-red-200 mt-2 py-2 px-3 shadow-sm'
  }

  const handleLogin = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'LOGIN',
      html: `
        <div class="flex flex-col gap-2">
          <div class="text-left">
            <label class="text-[9px] font-bold text-gray-500 tracking-wider uppercase mb-1 block">Email</label>
            <input id="swal-email" type="email" placeholder="Email" class="w-full h-10 px-3 bg-white border border-gray-200 focus:border-[#1D1D1F] rounded-xl text-center font-bold text-[#1D1D1F] outline-none text-[10px] shadow-sm transition-all">
          </div>
          <div class="text-left">
            <label class="text-[9px] font-bold text-gray-500 tracking-wider uppercase mb-1 block">Password</label>
            <input id="swal-pass" type="password" placeholder="••••••••" class="w-full h-10 px-3 bg-white border border-gray-200 focus:border-[#1D1D1F] rounded-xl text-center font-bold text-[#1D1D1F] outline-none text-[10px] tracking-widest shadow-sm transition-all">
          </div>
        </div>
      `,
      showCancelButton: true, confirmButtonText: 'MASUK', cancelButtonText: 'BATAL', customClass: baseSwalClass, buttonsStyling: false,
      preConfirm: async () => {
        const email = (document.getElementById('swal-email') as HTMLInputElement).value
        const pass = (document.getElementById('swal-pass') as HTMLInputElement).value
        if (!email || !pass) return Swal.showValidationMessage('DITOLAK!')
        
        Swal.showLoading()
        const res = await loginPemilik(email.trim(), pass.trim())
        if (!res.success) return Swal.showValidationMessage(res.message || 'KREDENSIAL SALAH!')
        return true
      }
    })

    if (formValues) {
      setIsLoggedIn(true)
      Swal.fire({icon: 'success', timer: 1000, showConfirmButton: false })
    }
  }

  const handleLogout = async () => {
    const res = await Swal.fire({ 
      title: 'KUNCI DATA?', showCancelButton: true, confirmButtonText: 'YA', cancelButtonText: 'BATAL', customClass: { ...baseSwalClass, confirmButton: baseSwalClass.confirmButton.replace('bg-[#1D1D1F]', 'bg-red-600') }, buttonsStyling: false 
    })
    if (res.isConfirmed) {
      Swal.showLoading()
      await logoutPemilik()
      setIsLoggedIn(false)
      Swal.fire({ title: 'TERKUNCI', icon: 'success', timer: 1000, showConfirmButton: false })
    }
  }

  // MENU YANG UDAH DIPANGKAS (NO PEMASUKAN/PENGELUARAN)
  const menus = [
    { id: 'DASHBOARD', path: '/dashboard', label: 'Dashboard' },
    { id: 'TAGIHAN', path: '/pembayaran', label: 'Tagihan' },
    { id: 'CICILAN', path: '/cicilan', label: 'Cicilan' },
    { id: 'UTANG', path: '/perorangan', label: 'Perorangan' },
  ]

  return (
    <main className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] flex justify-center font-sans">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      `}} />

      {/* CONTAINER UTAMA: max-w-sm, p-4, gap-3 */}
      <div className="w-full max-w-sm flex flex-col p-4 gap-3">
        
        {/* HEADER COMPACT (CUMA JUDUL YANG PAKAI FONT-BLACK) */}
        <header className="w-full bg-white border border-gray-200 rounded-xl shadow-sm p-3 flex flex-col items-center justify-center text-center">
          <h1 className="font-black text-xs tracking-widest uppercase text-[#1D1D1F]">
            Digital Finance
          </h1>
          <p onClick={handleSecretTap} className="text-[9px] font-bold tracking-wider uppercase text-gray-400 mt-1 cursor-pointer select-none">
            Catatan Keuangan Pribadi
          </p>
        </header>

        {/* STATUS RUNNING TEXT */}
        <div className="w-full bg-white border border-gray-200 rounded-xl shadow-sm px-3 py-2 overflow-hidden flex items-center">
          <div className="whitespace-nowrap animate-[marquee_10s_linear_infinite] flex gap-8 w-max">
            {[...Array(4)].map((_, i) => (
              <span key={i} className="text-[10px] font-bold uppercase tracking-wider text-[#1D1D1F]">
                Database Security: <span className={isLoggedIn ? 'text-green-600' : 'text-red-500'}>{isLoggedIn ? 'UNLOCK' : 'LOCKED'}</span>
              </span>
            ))}
          </div>
        </div>

        {/* MENU BUTTONS */}
        <div className="flex flex-col gap-2 w-full">
          {menus.map((btn) => (
            <button 
              key={btn.id}
              onClick={() => router.push(btn.path)}
              disabled={!isLoggedIn} 
              className={`w-full h-11 flex items-center justify-between px-4 rounded-xl border border-gray-200 shadow-sm text-[10px] font-bold tracking-wider transition-all
                ${isLoggedIn 
                  ? 'bg-white text-[#1D1D1F] active:scale-95 hover:bg-gray-50' 
                  : 'bg-[#F5F5F7] text-gray-400 cursor-not-allowed'}`}
            >
              <span className="uppercase">{btn.label}</span>
              {isLoggedIn ? (
                <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              ) : (
                <span className="text-[8px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded uppercase tracking-widest">Locked</span>
              )}
            </button>
          ))}
        </div>

        {/* BOTTOM ACTIONS */}
        {isLoggedIn && (
          <div className="w-full flex gap-2">
            <button onClick={() => router.push('/kategori')} className="flex-1 h-10 bg-white border border-gray-200 text-[#1D1D1F] font-bold text-[9px] rounded-xl uppercase tracking-wider shadow-sm active:scale-95 transition-all hover:bg-gray-50">
              Kategori
            </button>
            <button onClick={handleLogout} className="flex-1 h-10 bg-white border border-gray-200 text-red-600 font-bold text-[9px] rounded-xl uppercase tracking-wider shadow-sm active:scale-95 transition-all hover:bg-gray-50">
              Kunci
            </button>
          </div>
        )}

        {/* FOOTER */}
        <footer className="mt-auto pt-4 pb-2 flex justify-center">
          <p className="text-[9px] font-bold text-gray-400 tracking-widest uppercase">
            Irvan Affandi | 2026
          </p>
        </footer>
      </div>
    </main>
  )
}
