import type { APIRoute } from 'astro'
import { analizarTicketCombustible } from '../../../backend/services/visionService'
import { requireAuth } from '../../../backend/services/authService'

export const prerender = false

/**
 * POST /api/analizar-ticket
 *
 * Recibe una imagen de ticket/cupón de combustible (Edenred, YPF, etc.) en base64,
 * la envía a Gemini Flash para análisis y devuelve los datos extraídos:
 * litros, precio por litro, importe total, estación, odómetro, N° comprobante, fecha.
 *
 * La imagen se procesa en memoria y NUNCA se almacena en disco ni en BD.
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  // Roles autorizados: Administrador (1), Operador (2), Chofer (4)
  const auth = requireAuth(cookies, [1, 2, 4])
  if (!auth.authorized) return auth.response!

  try {
    const body = await request.json()
    const { imagen } = body

    if (!imagen || typeof imagen !== 'string') {
      return new Response(
        JSON.stringify({
          success: false,
          datos: null,
          error: 'Debe enviar una imagen en formato base64 en el campo "imagen".',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      )
    }

    if (!imagen.startsWith('data:image/') && imagen.length < 100) {
      return new Response(
        JSON.stringify({
          success: false,
          datos: null,
          error: 'La imagen enviada no tiene un formato válido.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      )
    }

    const datos = await analizarTicketCombustible(imagen)

    return new Response(
      JSON.stringify({ success: true, datos }),
      { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    )
  } catch (error: any) {
    console.error('[API analizar-ticket] Error:', error.message)

    const status = error.message?.includes('API Key') ? 503
      : error.message?.includes('límite') ? 429
      : error.message?.includes('grande') ? 413
      : 500

    return new Response(
      JSON.stringify({
        success: false,
        datos: null,
        error: error.message || 'Error al analizar el ticket de combustible.',
      }),
      { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    )
  }
}
