import { NextResponse, NextRequest } from 'next/server'

export default function proxy(request: NextRequest) {
  const session = request.cookies.get('user_session')
  const isProtected = request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/kategori')

  if (isProtected && (!session || session.value !== 'true')) {
    return NextResponse.redirect(new URL('/', request.nextUrl))
  }
  return NextResponse.next()
}

export const config = { matcher: ['/dashboard/:path*', '/kategori/:path*'] }