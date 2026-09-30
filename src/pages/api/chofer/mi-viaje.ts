import type { APIRoute } from 'astro'
import { getMiViajeActivo, requireAuth } from '../../../backend/index'

export const prerender = false

export const GET: APIRoute = async ({ request, cookies }) => {
  const auth = requireAuth(cookies)
  if (!auth.authorized) return auth.response!

  const url = new URL(request.url)
  const choferIdParam = url.searchParams.get('choferId')
  const choferIdOverride = choferIdParam ? parseInt(choferIdParam, 10) : undefined

  try {
    const data = await getMiViajeActivo(auth.user!.id, choferIdOverride)
    if (!data.success) {
      return new Response(JSON.stringify(data), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      })
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Error al obtener viaje activo' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      }
    )
  }
}
