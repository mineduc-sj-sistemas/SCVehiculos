import type { APIRoute } from 'astro'
import { authenticateUser, SESSION_COOKIE_NAME } from '../../../backend/index'

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json()
    const { email, password } = body

    const result = await authenticateUser(email, password)

    if (!result.success || !result.token) {
      return new Response(
        JSON.stringify({ success: false, message: result.message }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        }
      )
    }

    // Almacenar cookie de sesión HTTP-Only
    cookies.set(SESSION_COOKIE_NAME, result.token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 días
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: result.message,
        user: result.session,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      }
    )
  } catch (error: any) {
    console.error('API /api/auth/login error:', error)
    return new Response(
      JSON.stringify({ success: false, message: error?.message || 'Error interno del servidor.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      }
    )
  }
}
