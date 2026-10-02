import type { APIRoute } from 'astro'
import { analizarTablero } from '../../../backend/services/visionService'
import { requireAuth } from '../../../backend/services/authService'

export const prerender = false

/**
 * POST /api/analizar-tablero
 *
 * Recibe una imagen de tablero vehicular en base64, la envía a Gemini Flash
 * para análisis y devuelve los datos extraídos (kilometraje, combustible, etc.).
 *
 * La imagen se procesa en memoria y NUNCA se almacena en disco ni en BD.
 *
 * Body esperado (JSON):
 * {
 *   "imagen": "data:image/jpeg;base64,/9j/4AAQ..." // DataURL base64
 * }
 *
 * Respuesta exitosa:
 * {
 *   "success": true,
 *   "datos": {
 *     "kilometraje": 156432,
 *     "nivelCombustible": 75,
 *     "nivelCombustibleTexto": "3/4",
 *     "temperaturaMotor": "normal",
 *     "alertasVisibles": [],
 *     "confianza": 85,
 *     "observaciones": null
 *   }
 * }
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

    // Verificar que parece una imagen base64 válida
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

    // Analizar con Gemini Flash — la imagen vive solo en memoria durante este request
    const datos = await analizarTablero(imagen)

    return new Response(
      JSON.stringify({ success: true, datos }),
      { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    )
  } catch (error: any) {
    console.error('[API analizar-tablero] Error:', error.message)

    const status = error.message?.includes('API Key') ? 503
      : error.message?.includes('límite') ? 429
      : error.message?.includes('grande') ? 413
      : 500

    return new Response(
      JSON.stringify({
        success: false,
        datos: null,
        error: error.message || 'Error al analizar la imagen del tablero.',
      }),
      { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    )
  }
}
