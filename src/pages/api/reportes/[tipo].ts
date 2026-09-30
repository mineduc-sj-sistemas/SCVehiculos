import type { APIRoute } from 'astro'
import {
  generateFleetCsv,
  generateMaintenanceCsv,
  generateFuelCsv,
  generateViajesCsv,
  requireAuth,
} from '../../../backend/index'

export const prerender = false

export const GET: APIRoute = async ({ params, cookies }) => {
  // Roles autorizados: Administrador (1), Operador (2), Auditor (5)
  const auth = requireAuth(cookies, [1, 2, 5])
  if (!auth.authorized) return auth.response!

  const tipo = params.tipo?.toLowerCase()
  const today = new Date().toISOString().split('T')[0]

  try {
    let csvData = ''
    let filename = ''

    switch (tipo) {
      case 'flota':
        csvData = await generateFleetCsv()
        filename = `reporte_flota_oficial_${today}.csv`
        break
      case 'mantenimientos':
      case 'mantenimiento':
        csvData = await generateMaintenanceCsv()
        filename = `reporte_mantenimientos_${today}.csv`
        break
      case 'combustible':
        csvData = await generateFuelCsv()
        filename = `reporte_combustible_${today}.csv`
        break
      case 'viajes':
      case 'comisiones':
        csvData = await generateViajesCsv()
        filename = `reporte_viajes_comisiones_${today}.csv`
        break
      default:
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Tipo de reporte inválido. Opciones disponibles: flota, mantenimientos, combustible, viajes.',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
        )
    }

    return new Response(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Error al generar reporte' }),
      { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    )
  }
}
