import type { APIRoute } from 'astro'
import { actualizarEstadoComision, getComisionDetalle } from '../../../backend/index'

export const prerender = false

export const GET: APIRoute = async ({ params }) => {
  const id = Number(params.id)
  if (!id || isNaN(id)) {
    return new Response(JSON.stringify({ error: 'ID de comisión inválido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }

  try {
    const detalle = await getComisionDetalle(id)
    if (!detalle) {
      return new Response(JSON.stringify({ error: 'Comisión no encontrada' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      })
    }

    return new Response(JSON.stringify(detalle), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  } catch (error: any) {
    console.error('Error en GET /api/cronograma/[id]:', error)
    return new Response(JSON.stringify({ error: error.message || 'Error al obtener detalle de la comisión' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }
}

export const PATCH: APIRoute = async ({ params, request }) => {
  const id = Number(params.id)
  if (!id || isNaN(id)) {
    return new Response(JSON.stringify({ error: 'ID de comisión inválido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }

  try {
    const body = await request.json()

    if (!body.estado) {
      return new Response(JSON.stringify({ error: 'El estado es requerido.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      })
    }

    const res = await actualizarEstadoComision(id, {
      estado: body.estado,
      odometroSalida: body.odometroSalida !== undefined ? Number(body.odometroSalida) : undefined,
      odometroRegreso: body.odometroRegreso !== undefined ? Number(body.odometroRegreso) : undefined,
      observaciones: body.observaciones,
    })

    if (!res.success) {
      return new Response(JSON.stringify({ error: res.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  } catch (error: any) {
    console.error('Error en PATCH /api/cronograma/[id]:', error)
    return new Response(JSON.stringify({ error: error.message || 'Error al actualizar comisión' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }
}
