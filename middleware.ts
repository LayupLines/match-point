import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple middleware without auth wrapper - auth checks done in pages/API routes
export function middleware(request: NextRequest) {
  // Let Next.js handle routing
  // Auth protection is done at the page/API level using auth() calls
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
