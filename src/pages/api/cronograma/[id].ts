import type { APIRoute } from 'astro'
import { actualizarEstadoComision, getComisionDetalle, requireAuth } from '../../../backend/index'

export const prerender = false

export const GET: APIRoute = async ({ params, cookies }) => {
  const auth = requireAuth(cookies)
  if (!auth.authorized) return auth.response!

  const id = Number(params.id)
  if (!id || isNaN(id)) {
    return new Response(JSON.stringify({ success: false, error: 'ID de comisión inválido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }

  try {
    const detalle = await getComisionDetalle(id)
    if (!detalle) {
      return new Response(JSON.stringify({ success: false, error: 'Comisión no encontrada' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      })
    }

    return new Response(JSON.stringify({ success: true, ...detalle }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  } catch (error: any) {
    console.error('Error en GET /api/cronograma/[id]:', error)
    return new Response(JSON.stringify({ success: false, error: error.message || 'Error al obtener detalle de la comisión' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }
}

export const PATCH: APIRoute = async ({ params, request, cookies }) => {
  // Roles autorizados para actualizar estado de comisiones: 1 (Admin), 2 (Operador)
  const auth = requireAuth(cookies, [1, 2])
  if (!auth.authorized) return auth.response!

  const id = Number(params.id)
  if (!id || isNaN(id)) {
    return new Response(JSON.stringify({ success: false, error: 'ID de comisión inválido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }

  try {
    const body = await request.json()

    if (!body.estado) {
      return new Response(JSON.stringify({ success: false, error: 'El estado es requerido.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      })
    }

    const res = await actualizarEstadoComision(id, {
      estado: body.estado,
      odometroSalida: body.odometroSalida !== undefined ? Number(body.odometroSalida) : undefined,
      odometroRegreso: body.odometroRegreso !== undefined ? Number(body.odometroRegreso) : undefined,
      observaciones: body.observaciones,
      usuarioId: auth.user?.id,
    })

    if (!res.success) {
      return new Response(JSON.stringify({ success: false, error: res.error }), {
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
