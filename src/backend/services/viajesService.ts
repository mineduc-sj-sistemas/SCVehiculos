/**
 * Servicio de Gestión de Viajes, Comisiones y Hojas de Ruta Oficiales
 * SCVehiculos · Ministerio de Educación · Gobierno de San Juan
 */

import { query } from '../config/db'

export interface ViajeItem {
  id: number
  codigo: string
  origen: string
  destino: string
  motivo: string
  cantidadPasajeros: number
  solicitanteNombre: string | null
  dependenciaId: number
  dependenciaNombre: string
  vehiculoId: number
  vehiculoPatente: string
  vehiculoMarca: string
  vehiculoModelo: string
  choferId: number
  choferNombre: string
  choferApellido: string
  choferNombreCompleto: string
  fechaSalidaProgramada: string
  fechaSalidaReal: string | null
  fechaRegresoEstimada: string
  fechaRegresoReal: string | null
  odometroSalida: number | null
  odometroRegreso: number | null
  kmRecorridos: number | null
  estado: 'programada' | 'en_curso' | 'finalizada' | 'cancelada'
  estadoLabel: string
  tone: 'green' | 'blue' | 'amber' | 'gray' | 'red'
  observaciones: string | null
}

export interface ViajesKpis {
  enCurso: number
  programados: number
  finalizadosMes: number
  totalKmMes: number
  totalViajes: number
}

function getEstadoDetails(estado: string): { label: string; tone: ViajeItem['tone'] } {
  switch (estado) {
    case 'en_curso':
      return { label: 'En Viaje', tone: 'blue' }
    case 'programada':
      return { label: 'Programado', tone: 'amber' }
    case 'finalizada':
      return { label: 'Finalizado', tone: 'green' }
    case 'cancelada':
      return { label: 'Cancelado', tone: 'red' }
    default:
      return { label: estado, tone: 'gray' }
  }
}

/**
 * 1. KPIs generales del módulo de Viajes y Hojas de Ruta
 */
export async function getViajesKpis(): Promise<ViajesKpis> {
  try {
    const [counts] = await query<any[]>(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN estado = 'en_curso' THEN 1 ELSE 0 END) AS en_curso,
        SUM(CASE WHEN estado = 'programada' THEN 1 ELSE 0 END) AS programados,
        SUM(CASE WHEN estado = 'finalizada' AND fecha_regreso_real >= DATE_FORMAT(CURDATE(), '%Y-%m-01') THEN 1 ELSE 0 END) AS finalizados_mes,
        COALESCE(SUM(
          CASE 
            WHEN estado = 'finalizada' 
                 AND fecha_regreso_real >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
                 AND odometro_regreso > odometro_salida 
            THEN (odometro_regreso - odometro_salida) 
            ELSE 0 
          END
        ), 0) AS km_mes
      FROM comisiones
    `)

    return {
      totalViajes: Number(counts?.total || 0),
      enCurso: Number(counts?.en_curso || 0),
      programados: Number(counts?.programados || 0),
      finalizadosMes: Number(counts?.finalizados_mes || 0),
      totalKmMes: Number(counts?.km_mes || 0),
    }
  } catch (error) {
    console.error('Error al obtener KPIs de viajes:', error)
    return {
      totalViajes: 0,
      enCurso: 0,
      programados: 0,
      finalizadosMes: 0,
      totalKmMes: 0,
    }
  }
}

/**
 * 2. Listado completo de Viajes y Comisiones oficiales
 */
export async function getViajesList(estadoFiltro?: string): Promise<ViajeItem[]> {
  try {
    let sql = `
      SELECT 
        c.id,
        c.codigo_comision,
        c.origen,
        c.destino,
        c.motivo,
        c.cantidad_pasajeros,
        c.solicitante_nombre,
        c.dependencia_solicitante_id,
        d.nombre AS dependencia_nombre,
        c.vehiculo_id,
        v.patente AS vehiculo_patente,
        v.marca AS vehiculo_marca,
        v.modelo AS vehiculo_modelo,
        c.chofer_id,
        ch.nombre AS chofer_nombre,
        ch.apellido AS chofer_apellido,
        c.fecha_salida_programada,
        c.fecha_salida_real,
        c.fecha_regreso_estimada,
        c.fecha_regreso_real,
        c.odometro_salida,
        c.odometro_regreso,
        CASE 
          WHEN c.odometro_regreso IS NOT NULL AND c.odometro_salida IS NOT NULL AND c.odometro_regreso >= c.odometro_salida
          THEN (c.odometro_regreso - c.odometro_salida)
          ELSE NULL 
        END AS km_recorridos,
        c.estado,
        c.observaciones
      FROM comisiones c
      JOIN vehiculos v ON c.vehiculo_id = v.id
      JOIN choferes ch ON c.chofer_id = ch.id
      JOIN dependencias d ON c.dependencia_solicitante_id = d.id
    `

    const params: any[] = []
    if (estadoFiltro) {
      sql += ' WHERE c.estado = ?'
      params.push(estadoFiltro)
    }

    sql += ' ORDER BY c.fecha_salida_programada DESC, c.id DESC'

    const rows = await query<any[]>(sql, params)

    return rows.map((r) => {
      const details = getEstadoDetails(r.estado)
      return {
        id: Number(r.id),
        codigo: r.codigo_comision,
        origen: r.origen,
        destino: r.destino,
        motivo: r.motivo,
        cantidadPasajeros: Number(r.cantidad_pasajeros || 1),
        solicitanteNombre: r.solicitante_nombre || null,
        dependenciaId: Number(r.dependencia_solicitante_id),
        dependenciaNombre: r.dependencia_nombre,
        vehiculoId: Number(r.vehiculo_id),
        vehiculoPatente: r.vehiculo_patente,
        vehiculoMarca: r.vehiculo_marca,
        vehiculoModelo: r.vehiculo_modelo,
        choferId: Number(r.chofer_id),
        choferNombre: r.chofer_nombre,
        choferApellido: r.chofer_apellido,
        choferNombreCompleto: `${r.chofer_apellido}, ${r.chofer_nombre}`,
        fechaSalidaProgramada: r.fecha_salida_programada instanceof Date ? r.fecha_salida_programada.toISOString() : String(r.fecha_salida_programada),
        fechaSalidaReal: r.fecha_salida_real ? (r.fecha_salida_real instanceof Date ? r.fecha_salida_real.toISOString() : String(r.fecha_salida_real)) : null,
        fechaRegresoEstimada: r.fecha_regreso_estimada instanceof Date ? r.fecha_regreso_estimada.toISOString() : String(r.fecha_regreso_estimada),
        fechaRegresoReal: r.fecha_regreso_real ? (r.fecha_regreso_real instanceof Date ? r.fecha_regreso_real.toISOString() : String(r.fecha_regreso_real)) : null,
        odometroSalida: r.odometro_salida !== null ? Number(r.odometro_salida) : null,
        odometroRegreso: r.odometro_regreso !== null ? Number(r.odometro_regreso) : null,
        kmRecorridos: r.km_recorridos !== null ? Number(r.km_recorridos) : null,
        estado: r.estado,
        estadoLabel: details.label,
        tone: details.tone,
        observaciones: r.observaciones || null,
      }
    })
  } catch (error) {
    console.error('Error al obtener lista de viajes:', error)
    return []
  }
}

/**
 * 3. Exportación de Viajes y Hojas de Ruta a Excel (CSV UTF-8 con BOM)
 */
export async function generateViajesCsv(): Promise<string> {
  const viajes = await getViajesList()
  const headers = [
    'Código Comisión',
    'Estado',
    'Patente',
    'Vehículo',
    'Conductor Designado',
    'Área Solicitante',
    'Solicitante',
    'Origen',
    'Destino',
    'Motivo de Comisión',
    'Pasajeros',
    'Salida Programada',
    'Salida Real',
    'Regreso Estimado',
    'Regreso Real',
    'Odómetro Salida (Km)',
    'Odómetro Regreso (Km)',
    'Km Recorridos',
    'Observaciones',
  ]

  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return ''
    const str = String(val).trim()
    if (str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const rows = viajes.map((v) => [
    escapeCsv(v.codigo),
    escapeCsv(v.estadoLabel),
    escapeCsv(v.vehiculoPatente),
    escapeCsv(`${v.vehiculoMarca} ${v.vehiculoModelo}`),
    escapeCsv(v.choferNombreCompleto),
    escapeCsv(v.dependenciaNombre),
    escapeCsv(v.solicitanteNombre || ''),
    escapeCsv(v.origen),
    escapeCsv(v.destino),
    escapeCsv(v.motivo),
    escapeCsv(v.cantidadPasajeros),
    escapeCsv(v.fechaSalidaProgramada.replace('T', ' ').slice(0, 16)),
    escapeCsv(v.fechaSalidaReal ? v.fechaSalidaReal.replace('T', ' ').slice(0, 16) : 'Pendiente'),
    escapeCsv(v.fechaRegresoEstimada.replace('T', ' ').slice(0, 16)),
    escapeCsv(v.fechaRegresoReal ? v.fechaRegresoReal.replace('T', ' ').slice(0, 16) : 'Pendiente'),
    escapeCsv(v.odometroSalida !== null ? v.odometroSalida : ''),
    escapeCsv(v.odometroRegreso !== null ? v.odometroRegreso : ''),
    escapeCsv(v.kmRecorridos !== null ? v.kmRecorridos : ''),
    escapeCsv(v.observaciones || ''),
  ])

  return '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n')
}
