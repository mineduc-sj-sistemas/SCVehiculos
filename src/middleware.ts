import { defineMiddleware } from 'astro:middleware'
import { verifySessionToken, SESSION_COOKIE_NAME } from './backend/index'

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url

  // 1. Archivos estáticos y recursos públicos que nunca se bloquean
  const isStaticAsset =
    pathname.startsWith('/_astro/') ||
    pathname.startsWith('/vehiculos/') ||
    pathname.startsWith('/favicon') ||
    /\.(png|jpe?g|svg|ico|css|js|woff2?|map)$/i.test(pathname)

  if (isStaticAsset) {
    return next()
  }

  // 2. Rutas públicas de autenticación
  const isPublicAuthRoute =
    pathname === '/login' ||
    pathname === '/api/auth/login' ||
    pathname === '/api/auth/logout'

  // 3. Verificación de la sesión actual
  const sessionCookie = context.cookies.get(SESSION_COOKIE_NAME)?.value
  const user = verifySessionToken(sessionCookie)
  context.locals.user = user

  // Si no está autenticado y trata de acceder a rutas privadas
  if (!user && !isPublicAuthRoute) {
    if (pathname.startsWith('/api/')) {
      return new Response(
        JSON.stringify({ success: false, message: 'Sesión expirada o no iniciada.' }),
        { status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      )
    }
    return context.redirect('/login')
  }

  // Si ya está autenticado e intenta ingresar a /login
  if (user && pathname === '/login') {
    return context.redirect('/')
  }

  // Si es un usuario sin rol de administrador intentando acceder a /usuarios
  if (user && pathname.startsWith('/usuarios') && user.rolId !== 1) {
    return context.redirect('/')
  }

  // Restricción de rutas para el rol Chofer (rolId 4):
  // Solo puede acceder a su portal, combustible propio, perfil y endpoints API
  if (user && user.rolId === 4) {
    const choferAllowedPages = ['/mi-viaje', '/mi-perfil', '/combustible']
    const isAllowedPage = choferAllowedPages.some(r => pathname.startsWith(r))
    const isApiRoute = pathname.startsWith('/api/')

    if (!isAllowedPage && !isApiRoute) {
      return context.redirect('/mi-viaje')
    }
  }

  // Procesar solicitud
  const response = await next()

  // Asegurar codificación utf-8 en respuestas HTML
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('text/html') && !contentType.includes('charset')) {
    response.headers.set('content-type', `${contentType}; charset=utf-8`)
  }

  return response
})
