import type { APIRoute } from 'astro'
import {
  createMaintenance,
  getMaintenanceKpis,
  getMaintenanceList,
  requireAuth,
} from '../../../backend/index'

export const prerender = false

export const GET: APIRoute = async ({ request, cookies }) => {
  const auth = requireAuth(cookies)
  if (!auth.authorized) return auth.response!

  const url = new URL(request.url)
  const tipo = url.searchParams.get('tipo') || undefined
  const estado = url.searchParams.get('estado') || undefined
  const wantStats = url.searchParams.get('stats') === '1'

  try {
    const list = await getMaintenanceList(tipo, estado)

    if (wantStats) {
      const stats = await getMaintenanceKpis()
      return new Response(JSON.stringify({ success: true, mantenimientos: list, stats }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      })
    }

    return new Response(JSON.stringify({ success: true, mantenimientos: list }), {
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
  // Roles autorizados: Administrador (1), Operador (2)
  const auth = requireAuth(cookies, [1, 2])
  if (!auth.authorized) return auth.response!

  try {
    const body = await request.json()

    if (!body.vehiculoId || !body.tipo || !body.titulo || body.odometroServicio === undefined || !body.fechaProgramada) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Los campos Vehículo, Tipo, Título, Odómetro y Fecha Programada son obligatorios.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      )
    }

    const payload = {
      vehiculoId: Number(body.vehiculoId),
      tipo: body.tipo,
      titulo: String(body.titulo).trim(),
      descripcion: body.descripcion ? String(body.descripcion).trim() : undefined,
      tallerProveedor: body.tallerProveedor ? String(body.tallerProveedor).trim() : undefined,
      odometroServicio: Number(body.odometroServicio),
      fechaProgramada: String(body.fechaProgramada),
      ingresarATaller: Boolean(body.ingresarATaller),
      costoManoObra: body.costoManoObra !== undefined ? Number(body.costoManoObra) : undefined,
      costoRepuestos: body.costoRepuestos !== undefined ? Number(body.costoRepuestos) : undefined,
      numeroFactura: body.numeroFactura ? String(body.numeroFactura).trim() : undefined,
      usuarioId: auth.session?.id,
    }

    const result = await createMaintenance(payload)

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      status: 201,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message || 'Error al registrar servicio de mantenimiento' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }
}
