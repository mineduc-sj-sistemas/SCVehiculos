import type { APIRoute } from 'astro'
import { registrarCheckinParada, requireAuth } from '../../../backend/index'

export const prerender = false

export const POST: APIRoute = async ({ request, cookies }) => {
  // Choferes (4), Operadores (2), Administradores (1)
  const auth = requireAuth(cookies, [1, 2, 4])
  if (!auth.authorized) return auth.response!

  try {
    const body = await request.json()

    if (!body.comisionId || !body.paradaIndex || !body.destinoNombre) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'ID de comisión, número de parada y nombre de destino son obligatorios.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      )
    }

    const choferId = Number(body.choferId || auth.user?.id)

    const result = await registrarCheckinParada({
      comisionId: Number(body.comisionId),
      choferId,
      paradaIndex: Number(body.paradaIndex),
      destinoNombre: String(body.destinoNombre),
      latitud: body.latitud !== undefined ? Number(body.latitud) : undefined,
      longitud: body.longitud !== undefined ? Number(body.longitud) : undefined,
      precisionGps: body.precisionGps !== undefined ? Number(body.precisionGps) : undefined,
      observaciones: body.observaciones ? String(body.observaciones) : undefined,
    })

    if (!result.success) {
      return new Response(JSON.stringify(result), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      })
    }

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Error al registrar check-in' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      }
    )
  }
}
