// // import { NextResponse } from 'next/server'
// // import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

// // export async function middleware(req) {
// //   const res = NextResponse.next()
// //   const supabase = createMiddlewareClient({ req, res })

// //   const {
// //     data: { session },
// //   } = await supabase.auth.getSession()

// //   if (!session && req.nextUrl.pathname !== '/auth') {
// //     return NextResponse.redirect(new URL('/auth', req.url))
// //   }

// //   return res
// // }
// import { NextResponse } from 'next/server'
// import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

// export async function middleware(req) {
//   const res = NextResponse.next()
//   const supabase = createMiddlewareClient({ req, res })

//   const {
//     data: { session },
//   } = await supabase.auth.getSession()

//   if (!session && req.nextUrl.pathname !== '/auth') {
//     return NextResponse.redirect(new URL('/auth', req.url))
//   }
//   console.log('[Middleware] Session:', session)

//   return res
// }

// // Tell Next.js which paths this middleware applies to
// export const config = {
//   matcher: ['/', '/chat', '/profile'], // 👈 apply only to protected pages
// }
// import { NextResponse } from 'next/server'
// import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

// export async function middleware(req) {
//   const res = NextResponse.next()

//   // 👇 must be awaited or session will always be null
//   const supabase = createMiddlewareClient({ req, res })
//   const {
//     data: { session },
//   } = await supabase.auth.getSession()

//   console.log('[Middleware] Session:', session)

//   if (!session && req.nextUrl.pathname !== '/auth') {
//     return NextResponse.redirect(new URL('/auth', req.url))
//   }

//   return res
// }

// export const config = {
//   matcher: ['/', '/chat', '/profile'],
// }
import { NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'


export async function middleware(req) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session && req.nextUrl.pathname !== '/auth') {
    return NextResponse.redirect(new URL('/auth', req.url))
  }

  return res
}

export const config = {
  matcher: ['/', '/chat', '/profile'],
}
