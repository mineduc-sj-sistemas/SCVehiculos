import type { APIRoute } from 'astro'
import {
  crearComision,
  getCronogramaSemanal,
  getDatosAuxiliaresDespacho,
} from '../../../backend/index'

export const prerender = false

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url)
  const fecha = url.searchParams.get('fecha') || undefined
  const auxiliares = url.searchParams.get('auxiliares') === 'true'

  try {
    if (auxiliares) {
      const dataAux = await getDatosAuxiliaresDespacho()
      return new Response(JSON.stringify(dataAux), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      })
    }

    const data = await getCronogramaSemanal(fecha)
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  } catch (error: any) {
    console.error('Error en GET /api/cronograma:', error)
    return new Response(JSON.stringify({ error: error.message || 'Error al obtener cronograma' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json()

    // Validaciones de campos requeridos
    if (!body.vehiculoId || !body.choferId || !body.dependenciaId || !body.destino || !body.motivo || !body.fechaSalidaProgramada || !body.fechaRegresoEstimada) {
      return new Response(
        JSON.stringify({
          error: 'Vehículo, chofer, dependencia, destino, motivo, fecha de salida y fecha de regreso son obligatorios.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      )
    }

    const result = await crearComision({
      vehiculoId: Number(body.vehiculoId),
      choferId: Number(body.choferId),
      dependenciaId: Number(body.dependenciaId),
      solicitanteNombre: body.solicitanteNombre ? String(body.solicitanteNombre).trim() : undefined,
      origen: body.origen ? String(body.origen).trim() : 'Ministerio de Educación - Centro Cívico',
      destino: String(body.destino).trim(),
      motivo: String(body.motivo).trim(),
      cantidadPasajeros: Number(body.cantidadPasajeros || 1),
      fechaSalidaProgramada: String(body.fechaSalidaProgramada),
      fechaRegresoEstimada: String(body.fechaRegresoEstimada),
      observaciones: body.observaciones ? String(body.observaciones).trim() : undefined,
    })

    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      })
    }

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  } catch (error: any) {
    console.error('Error en POST /api/cronograma:', error)
    return new Response(JSON.stringify({ error: error.message || 'Error al crear comisión' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }
}
