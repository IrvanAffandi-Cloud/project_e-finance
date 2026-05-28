import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// NAMA FUNGSI INI WAJIB "proxy", BUKAN "middleware"
export function proxy(request: NextRequest) {
  // Cek apakah ada cookie sesi yang aktif (3 Jam)
  const token = request.cookies.get('sb-access-token')?.value
  const path = request.nextUrl.pathname

  // Kalau tidak ada token dan mencoba mengakses halaman selain '/', tendang ke luar!
  if (!token && path !== '/') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

// Hanya aktif pada halaman utama dan sub-folder kita
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}