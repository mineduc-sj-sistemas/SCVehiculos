import type { APIRoute } from 'astro'
import { getVehicleDetailWithHistory, saveVehicle, getVehiclesFullList, requireAuth } from '../../../backend/index'

export const prerender = false

export const GET: APIRoute = async ({ request, cookies }) => {
  const auth = requireAuth(cookies)
  if (!auth.authorized) return auth.response!

  const url = new URL(request.url)
  const idParam = url.searchParams.get('id')

  try {
    if (idParam) {
      const id = parseInt(idParam, 10)
      if (isNaN(id)) {
        return new Response(JSON.stringify({ success: false, error: 'ID de vehículo inválido' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        })
      }

      const detail = await getVehicleDetailWithHistory(id)
      if (!detail.vehicle) {
        return new Response(JSON.stringify({ success: false, error: 'Vehículo no encontrado' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        })
      }

      return new Response(JSON.stringify({ success: true, ...detail }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      })
    }

    const list = await getVehiclesFullList()
    return new Response(JSON.stringify({ success: true, vehiculos: list }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message || 'Error en el servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }
}

export const POST: APIRoute = async ({ request, cookies }) => {
  // Roles autorizados para gestionar vehículos: 1 (Admin), 2 (Operador), 3 (Mecánico)
  const auth = requireAuth(cookies, [1, 2, 3])
  if (!auth.authorized) return auth.response!

  try {
    const data = await request.json()

    if (!data.patente || !data.marca || !data.modelo || !data.tipoId || !data.fechaVencimientoVtv) {
      return new Response(
        JSON.stringify({ success: false, error: 'Los campos Patente, Marca, Modelo, Tipo y Vencimiento VTV son obligatorios.' }),
        { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      )
    }

    const result = await saveVehicle(data)
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
