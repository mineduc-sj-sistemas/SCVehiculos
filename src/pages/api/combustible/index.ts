import type { APIRoute } from 'astro'
import {
  createFuelCharge,
  getFuelKpis,
  getFuelList,
  requireAuth,
} from '../../../backend/index'

export const prerender = false

export const GET: APIRoute = async ({ request, cookies }) => {
  const auth = requireAuth(cookies)
  if (!auth.authorized) return auth.response!

  const url = new URL(request.url)
  const vehiculoId = url.searchParams.get('vehiculoId') ? Number(url.searchParams.get('vehiculoId')) : undefined
  const choferId = url.searchParams.get('choferId') ? Number(url.searchParams.get('choferId')) : undefined
  const wantStats = url.searchParams.get('stats') === '1'

  try {
    const list = await getFuelList(vehiculoId, choferId)

    if (wantStats) {
      const stats = await getFuelKpis()
      return new Response(JSON.stringify({ success: true, cargas: list, stats }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      })
    }

    return new Response(JSON.stringify({ success: true, cargas: list }), {
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
  // Roles autorizados: Administrador (1), Operador (2), Mecánico (3), Chofer (4)
  const auth = requireAuth(cookies, [1, 2, 3, 4])
  if (!auth.authorized) return auth.response!

  try {
    const body = await request.json()

    if (!body.vehiculoId || !body.fechaCarga || !body.tipoCombustible || !body.litros || !body.precioPorLitro || body.odometroCarga === undefined) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Los campos Vehículo, Fecha, Tipo de Combustible, Litros, Precio por Litro y Odómetro son obligatorios.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      )
    }

    const payload = {
      vehiculoId: Number(body.vehiculoId),
      choferId: body.choferId ? Number(body.choferId) : undefined,
      comisionId: body.comisionId ? Number(body.comisionId) : undefined,
      fechaCarga: String(body.fechaCarga),
      estacionServicio: body.estacionServicio ? String(body.estacionServicio).trim() : undefined,
      tipoCombustible: body.tipoCombustible,
      litros: Number(body.litros),
      precioPorLitro: Number(body.precioPorLitro),
      importeTotal: body.importeTotal ? Number(body.importeTotal) : undefined,
      odometroCarga: Number(body.odometroCarga),
      tanqueLleno: body.tanqueLleno !== undefined ? Boolean(body.tanqueLleno) : true,
      numeroTicket: body.numeroTicket ? String(body.numeroTicket).trim() : undefined,
      metodoPago: body.metodoPago || 'tarjeta_flota',
      observaciones: body.observaciones ? String(body.observaciones).trim() : undefined,
      usuarioId: auth.session?.id,
    }

    const result = await createFuelCharge(payload)

    return new Response(JSON.stringify({ success: true, id: result.id, rendimientoKmL: result.rendimientoKmL }), {
      status: 201,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message || 'Error al registrar carga de combustible' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }
}
