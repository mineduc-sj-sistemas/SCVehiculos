import type { APIRoute } from 'astro'
import {
  cancelMaintenance,
  completeMaintenance,
  requireAuth,
} from '../../../backend/index'

export const prerender = false

export const PATCH: APIRoute = async ({ params, request, cookies }) => {
  // Roles autorizados: Administrador (1), Operador (2), Mecánico (3)
  const auth = requireAuth(cookies, [1, 2, 3])
  if (!auth.authorized) return auth.response!

  const id = Number(params.id)
  if (isNaN(id)) {
    return new Response(JSON.stringify({ success: false, error: 'ID de mantenimiento inválido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }

  try {
    const body = await request.json()

    if (body.action === 'cancel' || body.estado === 'cancelado') {
      await cancelMaintenance(id, auth.session?.id)
      return new Response(JSON.stringify({ success: true, message: 'Mantenimiento cancelado exitosamente' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      })
    }

    if (body.action === 'complete' || body.estado === 'completado') {
      const dto = {
        odometroServicio: body.odometroServicio !== undefined ? Number(body.odometroServicio) : undefined,
        costoManoObra: body.costoManoObra !== undefined ? Number(body.costoManoObra) : undefined,
        costoRepuestos: body.costoRepuestos !== undefined ? Number(body.costoRepuestos) : undefined,
        numeroFactura: body.numeroFactura ? String(body.numeroFactura).trim() : undefined,
        detalleTrabajos: body.detalleTrabajos ? String(body.detalleTrabajos).trim() : undefined,
        proximoMantenimientoKm: body.proximoMantenimientoKm !== undefined ? Number(body.proximoMantenimientoKm) : undefined,
        proximoMantenimientoFecha: body.proximoMantenimientoFecha ? String(body.proximoMantenimientoFecha) : undefined,
        usuarioId: auth.session?.id,
      }

      await completeMaintenance(id, dto)
      return new Response(JSON.stringify({ success: true, message: 'Mantenimiento completado y vehículo disponible' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      })
    }

    return new Response(JSON.stringify({ success: false, error: 'Acción no especificada' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message || 'Error al actualizar mantenimiento' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }
}
