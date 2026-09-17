import type { APIRoute } from 'astro'
import { getVehicleDetailWithHistory, saveVehicle, getVehiclesFullList } from '../../../backend/index'

export const prerender = false

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url)
  const idParam = url.searchParams.get('id')

  try {
    if (idParam) {
      const id = parseInt(idParam, 10)
      if (isNaN(id)) {
        return new Response(JSON.stringify({ error: 'ID de vehículo inválido' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        })
      }

      const detail = await getVehicleDetailWithHistory(id)
      if (!detail.vehicle) {
        return new Response(JSON.stringify({ error: 'Vehículo no encontrado' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        })
      }

      return new Response(JSON.stringify(detail), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      })
    }

    const list = await getVehiclesFullList()
    return new Response(JSON.stringify(list), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Error en el servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json()

    if (!data.patente || !data.marca || !data.modelo || !data.tipoId || !data.fechaVencimientoVtv) {
      return new Response(
        JSON.stringify({ error: 'Los campos Patente, Marca, Modelo, Tipo y Vencimiento VTV son obligatorios.' }),
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
