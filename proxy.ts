import { NextResponse, NextRequest } from 'next/server'

    export function proxy(request: NextRequest) {
      const session = request.cookies.get('finance_session')
      if (request.nextUrl.pathname.startsWith('/dashboard')) {
        if (!session || session.value !== 'true') {
          return NextResponse.redirect(new URL('/', request.nextUrl))
        }
      }
      return NextResponse.next()
    }

    export const config = { matcher: ['/dashboard', '/dashboard/:path*'] }