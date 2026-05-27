import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // 1. Baca isi tas (cookies) dari pengunjung yang mau masuk
  const cookieStore = await cookies()
  const isAdmin = cookieStore.get('admin_session')?.value

  // 2. Kalau tiket admin_session GAK ADA, langsung tendang ke Home tanpa basa-basi
  if (!isAdmin) {
    redirect('/') 
  }

  // 3. Kalau tiketnya ADA, persilakan masuk dan tampilkan halaman Admin
  return <>{children}</>
}