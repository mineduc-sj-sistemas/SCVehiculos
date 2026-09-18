import type { APIRoute } from 'astro'
import { saveChoferLicencia } from '../../../backend/index'

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json()

    if (!data.choferId || !data.tipo || !data.fechaInicio || !data.fechaFin) {
      return new Response(
        JSON.stringify({ error: 'Chofer, tipo de licencia, fecha de inicio y fin son obligatorios.' }),
        { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      )
    }

    const result = await saveChoferLicencia(data)
    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      })
    }

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Error al procesar solicitud' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }
}
