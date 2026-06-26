import { NextResponse, type NextRequest } from 'next/server'
import { LOCALE_COOKIE, isLocale, negotiateLocale } from '@/lib/i18n/config'

const ONE_YEAR = 60 * 60 * 24 * 365

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const firstSegment = pathname.split('/')[1]

  // Already locale-prefixed: refresh the persisted choice and continue.
  if (isLocale(firstSegment)) {
    const res = NextResponse.next()
    res.cookies.set(LOCALE_COOKIE, firstSegment, { path: '/', maxAge: ONE_YEAR })
    return res
  }

  // No locale prefix: redirect to the negotiated locale.
  const locale = negotiateLocale(
    req.headers.get('accept-language'),
    req.cookies.get(LOCALE_COOKIE)?.value,
  )
  const url = req.nextUrl.clone()
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`
  return NextResponse.redirect(url)
}

export const config = {
  // Skip Next internals, the Payload admin + API, and any file with an extension.
  matcher: ['/((?!api|admin|_next|.*\\..*).*)'],
}
