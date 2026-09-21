import type { APIRoute } from 'astro'
import { SESSION_COOKIE_NAME } from '../../../backend/index'

export const POST: APIRoute = async ({ cookies }) => {
  cookies.delete(SESSION_COOKIE_NAME, { path: '/' })
  return new Response(JSON.stringify({ success: true, message: 'Sesión cerrada.' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

export const GET: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete(SESSION_COOKIE_NAME, { path: '/' })
  return redirect('/login')
}
