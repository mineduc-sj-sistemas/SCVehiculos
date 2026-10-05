/**
 * Servicio de Viajes Asignados por Chofer
 * SCVehiculos · Ministerio de Educación · Gobierno de San Juan
 */

import { query } from '../config/db'

export interface ViajeAsignadoItem {
  id: number
  codigo: string
  origen: string
  destino: string
  motivo: string
  cantidadPasajeros: number
  solicitanteNombre: string | null
  dependenciaNombre: string
  vehiculoId: number
  vehiculoPatente: string
  vehiculoMarca: string
  vehiculoModelo: string
  fechaSalidaProgramada: string
  fechaSalidaReal: string | null
  fechaRegresoEstimada: string
  fechaRegresoReal: string | null
  odometroSalida: number | null
  odometroRegreso: number | null
  kmRecorridos: number | null
  estado: 'en_curso' | 'programada' | 'finalizada' | 'cancelada'
  estadoLabel: string
  tone: 'green' | 'blue' | 'amber' | 'gray' | 'red'
  observaciones: string | null
  paradas: string[]
}

export interface ChoferConViajes {
  id: number
  usuarioId: number | null
  nombre: string
  apellido: string
  nombreCompleto: string
  iniciales: string
  dni: string
  telefono: string
  email: string
  numeroLicencia: string
  categoriaLicencia: string
  fechaVencimientoLicencia: string
  licenciaStatus: 'vigente' | 'proxima' | 'vencida'
  estado: 'disponible' | 'en_comision' | 'licencia' | 'inactivo'
  estadoLabel: string
  estadoTone: 'green' | 'blue' | 'orange' | 'gray'
  viajeActivo: ViajeAsignadoItem | null
  viajesProgramados: ViajeAsignadoItem[]
  viajesHistorial: ViajeAsignadoItem[]
  totalViajesAsignados: number
  esUsuarioActual: boolean
}

export interface ViajePlanoItem extends ViajeAsignadoItem {
  choferId: number
  choferNombre: string
  choferApellido: string
  choferNombreCompleto: string
  esMiViaje: boolean
}

export interface ViajesChoferesData {
  choferes: ChoferConViajes[]
  todosLosViajes: ViajePlanoItem[]
  choferLogueadoId: number | null
  stats: {
    totalChoferes: number
    choferesConViaje: number
    choferesDisponibles: number
    viajesEnCurso: number
    viajesProgramados: number
    viajesFinalizados: number
  }
}

function getEstadoDetails(estado: string): { label: string; tone: ViajeAsignadoItem['tone'] } {
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

function mapRowToViaje(r: any): ViajeAsignadoItem {
  const details = getEstadoDetails(r.estado)
  const destinosList = (r.destino || '')
    .split(' // ')
    .map((s: string) => s.trim())
    .filter(Boolean)

  let kmRecorridos: number | null = null
  if (r.odometro_regreso != null && r.odometro_salida != null && r.odometro_regreso >= r.odometro_salida) {
    kmRecorridos = r.odometro_regreso - r.odometro_salida
  }

  return {
    id: Number(r.id),
    codigo: r.codigo_comision,
    origen: r.origen,
    destino: r.destino,
    motivo: r.motivo,
    cantidadPasajeros: Number(r.cantidad_pasajeros || 1),
    solicitanteNombre: r.solicitante_nombre || null,
    dependenciaNombre: r.dependencia_nombre || 'Ministerio de Educación',
    vehiculoId: Number(r.vehiculo_id),
    vehiculoPatente: r.vehiculo_patente,
    vehiculoMarca: r.vehiculo_marca,
    vehiculoModelo: r.vehiculo_modelo,
    fechaSalidaProgramada: String(r.fecha_salida_programada),
    fechaSalidaReal: r.fecha_salida_real ? String(r.fecha_salida_real) : null,
    fechaRegresoEstimada: String(r.fecha_regreso_estimada),
    fechaRegresoReal: r.fecha_regreso_real ? String(r.fecha_regreso_real) : null,
    odometroSalida: r.odometro_salida != null ? Number(r.odometro_salida) : null,
    odometroRegreso: r.odometro_regreso != null ? Number(r.odometro_regreso) : null,
    kmRecorridos,
    estado: r.estado,
    estadoLabel: details.label,
    tone: details.tone,
    observaciones: r.observaciones || null,
    paradas: destinosList.length > 0 ? destinosList : [r.destino || 'Destino oficial'],
  }
}

/**
 * Obtiene los viajes asignados a cada chofer, agrupados por chofer y en formato de lista plana
 */
export async function getViajesAsignadosPorChofer(usuarioId?: number): Promise<ViajesChoferesData> {
  try {
    // 1. Identificar el chofer asociado al usuario logueado (si aplica)
    let choferLogueadoId: number | null = null
    if (usuarioId) {
      const choferRows = await query<any[]>(
        `SELECT id FROM choferes WHERE usuario_id = ? LIMIT 1`,
        [usuarioId]
      )
      if (choferRows && choferRows.length > 0) {
        choferLogueadoId = Number(choferRows[0].id)
      }
    }

    // 2. Obtener lista de todos los choferes activos con cálculo de vigencia de licencia
    const rawChoferes = await query<any[]>(`
      SELECT 
        c.id,
        c.usuario_id,
        c.nombre,
        c.apellido,
        c.dni,
        c.cuil,
        c.telefono,
        c.email,
        c.numero_licencia,
        c.categoria_licencia,
        c.fecha_vencimiento_licencia,
        DATEDIFF(c.fecha_vencimiento_licencia, CURDATE()) AS dias_licencia,
        c.estado
      FROM choferes c
      WHERE c.estado != 'inactivo'
      ORDER BY 
        CASE WHEN c.id = ? THEN 0 ELSE 1 END,
        c.apellido ASC, 
        c.nombre ASC
    `, [choferLogueadoId || 0])

    // 3. Obtener todas las comisiones con datos de vehículo y dependencia
    const rawComisiones = await query<any[]>(`
      SELECT 
        c.id,
        c.codigo_comision,
        c.vehiculo_id,
        c.chofer_id,
        c.dependencia_solicitante_id,
        c.solicitante_nombre,
        c.origen,
        c.destino,
        c.motivo,
        c.cantidad_pasajeros,
        c.fecha_salida_programada,
        c.fecha_salida_real,
        c.fecha_regreso_estimada,
        c.fecha_regreso_real,
        c.odometro_salida,
        c.odometro_regreso,
        c.estado,
        c.observaciones,
        v.patente AS vehiculo_patente,
        v.marca AS vehiculo_marca,
        v.modelo AS vehiculo_modelo,
        d.nombre AS dependencia_nombre,
        ch.nombre AS chofer_nombre,
        ch.apellido AS chofer_apellido
      FROM comisiones c
      JOIN vehiculos v ON c.vehiculo_id = v.id
      JOIN dependencias d ON c.dependencia_solicitante_id = d.id
      JOIN choferes ch ON c.chofer_id = ch.id
      WHERE c.estado IN ('en_curso', 'programada', 'finalizada')
      ORDER BY 
        CASE 
          WHEN c.estado = 'en_curso' THEN 1 
          WHEN c.estado = 'programada' THEN 2 
          ELSE 3 
        END,
        c.fecha_salida_programada ASC
    `)

    // Mapear viajes planos
    const todosLosViajes: ViajePlanoItem[] = (rawComisiones || []).map((r) => {
      const v = mapRowToViaje(r)
      const esMiViaje = Boolean(choferLogueadoId && Number(r.chofer_id) === choferLogueadoId)
      return {
        ...v,
        choferId: Number(r.chofer_id),
        choferNombre: r.chofer_nombre,
        choferApellido: r.chofer_apellido,
        choferNombreCompleto: `${r.chofer_apellido}, ${r.chofer_nombre}`,
        esMiViaje,
      }
    })

    // Agrupar viajes por chofer
    let totalEnCurso = 0
    let totalProgramados = 0
    let totalFinalizados = 0
    let choferesConViajeCount = 0

    const choferes: ChoferConViajes[] = (rawChoferes || []).map((ch) => {
      const chId = Number(ch.id)
      const esUsuarioActual = Boolean(choferLogueadoId && chId === choferLogueadoId)

      // Filtrar comisiones asignadas a este chofer
      const comisionesChofer = todosLosViajes.filter((v) => v.choferId === chId)
      
      const viajeActivo = comisionesChofer.find((v) => v.estado === 'en_curso') || null
      const viajesProgramados = comisionesChofer.filter((v) => v.estado === 'programada')
      const viajesHistorial = comisionesChofer.filter((v) => v.estado === 'finalizada').slice(0, 5)

      if (viajeActivo || viajesProgramados.length > 0) {
        choferesConViajeCount++
      }

      // Estado de licencia
      const diasLic = Number(ch.dias_licencia ?? 999)
      let licenciaStatus: ChoferConViajes['licenciaStatus'] = 'vigente'
      if (diasLic < 0) licenciaStatus = 'vencida'
      else if (diasLic <= 30) licenciaStatus = 'proxima'

      // Estado laboral del chofer
      let estadoLabel = 'Disponible'
      let estadoTone: ChoferConViajes['estadoTone'] = 'green'
      switch (ch.estado) {
        case 'disponible':
          estadoLabel = 'Disponible'
          estadoTone = 'green'
          break
        case 'en_comision':
          estadoLabel = 'En viaje'
          estadoTone = 'blue'
          break
        case 'licencia':
          estadoLabel = 'De licencia'
          estadoTone = 'orange'
          break
        case 'inactivo':
          estadoLabel = 'Inactivo'
          estadoTone = 'gray'
          break
      }

      const iniciales = `${(ch.nombre || '').charAt(0)}${(ch.apellido || '').charAt(0)}`.toUpperCase() || 'CH'

      return {
        id: chId,
        usuarioId: ch.usuario_id ? Number(ch.usuario_id) : null,
        nombre: ch.nombre,
        apellido: ch.apellido,
        nombreCompleto: `${ch.apellido}, ${ch.nombre}`,
        iniciales,
        dni: ch.dni,
        telefono: ch.telefono || 'Sin teléfono',
        email: ch.email || 'Sin correo',
        numeroLicencia: ch.numero_licencia || 'S/D',
        categoriaLicencia: ch.categoria_licencia || 'B1',
        fechaVencimientoLicencia: ch.fecha_vencimiento_licencia ? String(ch.fecha_vencimiento_licencia) : '',
        licenciaStatus,
        estado: ch.estado,
        estadoLabel,
        estadoTone,
        viajeActivo,
        viajesProgramados,
        viajesHistorial,
        totalViajesAsignados: comisionesChofer.length,
        esUsuarioActual,
      }
    })

    // Contadores de KPIs
    todosLosViajes.forEach((v) => {
      if (v.estado === 'en_curso') totalEnCurso++
      else if (v.estado === 'programada') totalProgramados++
      else if (v.estado === 'finalizada') totalFinalizados++
    })

    const totalChoferes = choferes.length
    const choferesDisponibles = choferes.filter((c) => c.estado === 'disponible' && !c.viajeActivo).length

    return {
      choferes,
      todosLosViajes,
      choferLogueadoId,
      stats: {
        totalChoferes,
        choferesConViaje: choferesConViajeCount,
        choferesDisponibles,
        viajesEnCurso: totalEnCurso,
        viajesProgramados: totalProgramados,
        viajesFinalizados: totalFinalizados,
      },
    }
  } catch (error) {
    console.error('Error al obtener viajes asignados por chofer:', error)
    return {
      choferes: [],
      todosLosViajes: [],
      choferLogueadoId: null,
      stats: {
        totalChoferes: 0,
        choferesConViaje: 0,
        choferesDisponibles: 0,
        viajesEnCurso: 0,
        viajesProgramados: 0,
        viajesFinalizados: 0,
      },
    }
  }
}
