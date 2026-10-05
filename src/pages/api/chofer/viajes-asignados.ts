import type { APIRoute } from 'astro'
import { getViajesAsignadosPorChofer, requireAuth } from '../../../backend/index'

export const prerender = false

export const GET: APIRoute = async ({ cookies }) => {
  const auth = requireAuth(cookies)
  if (!auth.authorized) return auth.response!

  try {
    const data = await getViajesAsignadosPorChofer(auth.user!.id)

    return new Response(JSON.stringify({ success: true, ...data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Error al obtener viajes asignados' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      }
    )
  }
}
