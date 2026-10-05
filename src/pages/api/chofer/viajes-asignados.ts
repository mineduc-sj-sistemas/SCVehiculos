import type { APIRoute } from 'astro'
import { getCalendarioViajesChofer, requireAuth } from '../../../backend/index'

export const prerender = false

export const GET: APIRoute = async ({ request, cookies }) => {
  const auth = requireAuth(cookies)
  if (!auth.authorized) return auth.response!

  const url = new URL(request.url)
  const mesParam = url.searchParams.get('mes') ? parseInt(url.searchParams.get('mes')!, 10) : undefined
  const anioParam = url.searchParams.get('anio') ? parseInt(url.searchParams.get('anio')!, 10) : undefined
  const choferIdParam = url.searchParams.get('choferId') ? parseInt(url.searchParams.get('choferId')!, 10) : undefined

  try {
    const data = await getCalendarioViajesChofer(auth.user!.id, mesParam, anioParam, choferIdParam)

    return new Response(JSON.stringify({ success: true, ...data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Error al obtener calendario de viajes' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      }
    )
  }
}
