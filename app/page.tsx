'use client'
import { useState } from 'react'
import Swal from 'sweetalert2'
import { loginPemilik } from '@/app/actions'

export default function Home() {
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // VALIDASI ZERO BS: Jangan ngirim request kosong ke server
    if (!pin) {
      Swal.fire({ icon: 'error', title: 'DITOLAK', text: 'PIN WAJIB DIISI!', confirmButtonColor: '#1D1D1F' })
      return
    }

    setLoading(true)
    const res = await loginPemilik(pin)
    
    if (res.success) {
      Swal.fire({ 
        icon: 'success', 
        title: 'BRANKAS TERBUKA', 
        showConfirmButton: false, 
        timer: 1000 
      }).then(() => {
        // MUTLAK: Pakai window.location.href biar kuki satpam gak nge-bug
        window.location.href = '/dashboard'
      })
    } else {
      setLoading(false)
      Swal.fire({ icon: 'error', title: 'AKSES ILEGAL', text: res.message, confirmButtonColor: '#1D1D1F' })
    }
  }

  return (
    <main className="min-h-screen bg-[#FBFBFD] flex items-center justify-center p-5 selection:bg-gray-200">
      <div className="w-full max-w-sm bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#1D1D1F] rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[#1D1D1F] uppercase tracking-wider">E-FINANCE</h1>
          <p className="text-[9px] font-bold text-gray-400 uppercase mt-2 tracking-widest">PERSONAL VAULT AREA</p>
        </div>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase ml-2">KODE BRANKAS</label>
            <input 
              type="password" 
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••••"
              className="w-full h-14 mt-2 px-4 bg-[#F5F5F7] border border-transparent focus:border-gray-400 focus:bg-white rounded-xl text-center font-bold text-xl text-[#1D1D1F] tracking-[0.5em] transition-all outline-none placeholder:text-gray-300 placeholder:tracking-normal"
              inputMode="numeric"
              maxLength={6}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full h-14 mt-2 bg-[#1D1D1F] text-white font-bold text-[11px] uppercase tracking-widest rounded-xl hover:bg-black active:scale-95 disabled:opacity-50 transition-all shadow-md"
          >
            {loading ? 'MEMBUKA...' : 'BUKA BRANKAS'}
          </button>
        </form>

      </div>
    </main>
  )
}