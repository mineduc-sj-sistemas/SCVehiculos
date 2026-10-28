import type { APIRoute } from 'astro'
import {
  createFuelCharge,
  getFuelKpis,
  getFuelList,
  requireAuth,
  query,
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
  // Roles autorizados: Administrador (1), Operador (2), Chofer (4)
  const auth = requireAuth(cookies, [1, 2, 4])
  if (!auth.authorized) return auth.response!

  try {
    const body = await request.json()

    const vehiculoId = body.vehiculoId ? Number(body.vehiculoId) : 0
    const litros = body.litros ? Number(body.litros) : 0
    const importeTotal = body.importeTotal ? Number(body.importeTotal) : undefined
    const precioPorLitro = body.precioPorLitro
      ? Number(body.precioPorLitro)
      : importeTotal && litros > 0
        ? Number((importeTotal / litros).toFixed(2))
        : 0

    const rawFecha = body.fechaCarga ? String(body.fechaCarga) : new Date().toISOString()
    const fechaCarga = rawFecha.slice(0, 19).replace('T', ' ')

    let odometroCarga = body.odometroCarga !== undefined && body.odometroCarga !== null && body.odometroCarga !== ''
      ? Number(body.odometroCarga)
      : undefined

    if ((odometroCarga === undefined || isNaN(odometroCarga) || odometroCarga <= 0) && vehiculoId > 0) {
      const vehRows = await query<any>(`SELECT odometro_actual FROM vehiculos WHERE id = ? LIMIT 1`, [vehiculoId])
      if (vehRows && vehRows.length > 0) {
        odometroCarga = Number(vehRows[0].odometro_actual || 0)
      }
    }

    if (!vehiculoId || !body.tipoCombustible || !litros || !precioPorLitro || odometroCarga === undefined) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Los campos Vehículo, Tipo de Combustible, Litros e Importe/Precio por Litro son obligatorios.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      )
    }

    let choferIdToUse = body.choferId ? Number(body.choferId) : undefined

    // Regla de Negocio: Si el usuario es Chofer (rolId 4), se garantiza que solo registre cargas a su propio nombre
    if (auth.session?.rolId === 4) {
      const choferRows = await query<any>(`SELECT id FROM choferes WHERE usuario_id = ? LIMIT 1`, [auth.session.id])
      if (choferRows && choferRows.length > 0) {
        choferIdToUse = choferRows[0].id
      }
    }

    const payload = {
      vehiculoId,
      choferId: choferIdToUse,
      comisionId: body.comisionId ? Number(body.comisionId) : undefined,
      fechaCarga,
      estacionServicio: body.estacionServicio ? String(body.estacionServicio).trim() : undefined,
      tipoCombustible: body.tipoCombustible,
      litros,
      precioPorLitro,
      importeTotal,
      odometroCarga,
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
