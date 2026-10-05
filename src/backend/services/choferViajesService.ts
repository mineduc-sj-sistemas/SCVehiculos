/**
 * Servicio de Calendario y Mi Historial Exclusivo de Viajes por Chofer
 * SCVehiculos · Ministerio de Educación · Gobierno de San Juan
 */

import { query } from '../config/db'
import { cancelarViajesExpirados24Horas } from './cronogramaService'

export interface ViajeCalendarioItem {
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
  fechaSalidaDateStr: string // YYYY-MM-DD
  fechaRegresoDateStr: string // YYYY-MM-DD
  horaSalida: string // HH:mm
  horaRegreso: string // HH:mm
  odometroSalida: number | null
  odometroRegreso: number | null
  kmRecorridos: number | null
  estado: 'en_curso' | 'programada' | 'finalizada' | 'cancelada'
  estadoLabel: string
  tone: 'green' | 'blue' | 'amber' | 'gray' | 'red'
  observaciones: string | null
  esViajeNoRealizado: boolean
  motivoCancelacion: string | null
  paradas: string[]
}

export interface DiaCalendario {
  fecha: string // YYYY-MM-DD
  diaNumero: number
  diaSemanaIndex: number // 0=Lun, ..., 6=Dom
  esMesActual: boolean
  esHoy: boolean
  esFinDeSemana: boolean
  viajes: ViajeCalendarioItem[]
  tieneViajes: boolean
}

export interface CalendarioChoferData {
  chofer: {
    id: number
    usuarioId: number | null
    nombre: string
    apellido: string
    nombreCompleto: string
    iniciales: string
    dni: string
    telefono: string
    numeroLicencia: string
    categoriaLicencia: string
    fechaVencimientoLicencia: string
    estado: string
    estadoLabel: string
    estadoTone: string
  } | null
  mes: number // 1..12
  anio: number
  mesNombre: string
  dias: DiaCalendario[]
  viajesTodos: ViajeCalendarioItem[]
  viajesProgramados: ViajeCalendarioItem[]
  viajeActivo: ViajeCalendarioItem | null
  viajesHistorial: ViajeCalendarioItem[]
  stats: {
    totalViajesMes: number
    programadosMes: number
    enCursoHoy: number
    finalizadosMes: number
    kmTotalesHistorico: number
    viajesRealizadosHistorico: number
    viajesNoRealizadosHistorico: number
  }
  isStaff: boolean
  listaChoferesSelector: { id: number; nombreCompleto: string; dni: string }[]
}

const NOMBRES_MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

function toDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getEstadoDetails(estado: string): { label: string; tone: ViajeCalendarioItem['tone'] } {
  switch (estado) {
    case 'en_curso':
      return { label: 'En Viaje', tone: 'blue' }
    case 'programada':
      return { label: 'Programado', tone: 'amber' }
    case 'finalizada':
      return { label: 'Realizado', tone: 'green' }
    case 'cancelada':
      return { label: 'Viaje no realizado', tone: 'red' }
    default:
      return { label: estado, tone: 'gray' }
  }
}

function mapRowToViajeCalendario(r: any): ViajeCalendarioItem {
  const details = getEstadoDetails(r.estado)
  const destinosList = (r.destino || '')
    .split(' // ')
    .map((s: string) => s.trim())
    .filter(Boolean)

  let kmRecorridos: number | null = null
  if (r.odometro_regreso != null && r.odometro_salida != null && r.odometro_regreso >= r.odometro_salida) {
    kmRecorridos = r.odometro_regreso - r.odometro_salida
  }

  const dSalida = new Date(r.fecha_salida_programada)
  const dRegreso = new Date(r.fecha_regreso_estimada)

  const fechaSalidaDateStr = toDateString(dSalida)
  const fechaRegresoDateStr = toDateString(dRegreso)

  const horaSalida = dSalida.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  const horaRegreso = dRegreso.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

  const esViajeNoRealizado = r.estado === 'cancelada'
  let motivoCancelacion: string | null = null
  if (esViajeNoRealizado) {
    if (r.observaciones && r.observaciones.includes('[SISTEMA]')) {
      motivoCancelacion = 'Cancelado automáticamente por el sistema: superó las 24 horas del horario programado sin despacho.'
    } else {
      motivoCancelacion = r.observaciones || 'Comisión cancelada / Viaje no realizado.'
    }
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
    fechaSalidaDateStr,
    fechaRegresoDateStr,
    horaSalida,
    horaRegreso,
    odometroSalida: r.odometro_salida != null ? Number(r.odometro_salida) : null,
    odometroRegreso: r.odometro_regreso != null ? Number(r.odometro_regreso) : null,
    kmRecorridos,
    estado: r.estado,
    estadoLabel: details.label,
    tone: details.tone,
    observaciones: r.observaciones || null,
    esViajeNoRealizado,
    motivoCancelacion,
    paradas: destinosList.length > 0 ? destinosList : [r.destino || 'Destino oficial'],
  }
}

/**
 * Obtiene el calendario y el historial de viajes exclusivamente para el chofer conectado
 * ejecutando previamente la cancelación automática de comisiones expiradas tras 24 hs
 */
export async function getCalendarioViajesChofer(
  usuarioId: number,
  mesParam?: number,
  anioParam?: number,
  choferIdOverride?: number
): Promise<CalendarioChoferData> {
  try {
    // 0. Purgar y cancelar automáticamente los viajes que hayan superado las 24 hs
    await cancelarViajesExpirados24Horas()

    // 1. Identificar si el usuario es Chofer o Staff
    const [userRow] = await query<any[]>(
      `SELECT id, rol_id, nombre, apellido FROM usuarios WHERE id = ? LIMIT 1`,
      [usuarioId]
    )

    const rolId = userRow?.rol_id || 4
    const isStaff = rolId === 1 || rolId === 2

    let targetChoferId: number | null = null

    if (isStaff && choferIdOverride) {
      targetChoferId = choferIdOverride
    } else {
      // Buscar el chofer vinculado a este usuario
      const choferRows = await query<any[]>(
        `SELECT id FROM choferes WHERE usuario_id = ? LIMIT 1`,
        [usuarioId]
      )
      if (choferRows && choferRows.length > 0) {
        targetChoferId = Number(choferRows[0].id)
      } else if (isStaff) {
        // Si es staff y no tiene chofer vinculado, tomar el primero
        const [primero] = await query<any[]>(`SELECT id FROM choferes ORDER BY id ASC LIMIT 1`)
        targetChoferId = primero ? Number(primero.id) : null
      }
    }

    // Lista de choferes para el selector en modo supervisor (solo si es staff)
    let listaChoferesSelector: { id: number; nombreCompleto: string; dni: string }[] = []
    if (isStaff) {
      const allChoferes = await query<any[]>(
        `SELECT id, nombre, apellido, dni FROM choferes WHERE estado != 'inactivo' ORDER BY apellido, nombre`
      )
      listaChoferesSelector = (allChoferes || []).map((c) => ({
        id: Number(c.id),
        nombreCompleto: `${c.apellido}, ${c.nombre}`,
        dni: c.dni,
      }))
    }

    if (!targetChoferId) {
      return {
        chofer: null,
        mes: mesParam || new Date().getMonth() + 1,
        anio: anioParam || new Date().getFullYear(),
        mesNombre: NOMBRES_MESES[(mesParam || new Date().getMonth() + 1) - 1],
        dias: [],
        viajesTodos: [],
        viajesProgramados: [],
        viajeActivo: null,
        viajesHistorial: [],
        stats: {
          totalViajesMes: 0,
          programadosMes: 0,
          enCursoHoy: 0,
          finalizadosMes: 0,
          kmTotalesHistorico: 0,
          viajesRealizadosHistorico: 0,
          viajesNoRealizadosHistorico: 0,
        },
        isStaff,
        listaChoferesSelector,
      }
    }

    // 2. Obtener datos del chofer objetivo
    const [choferData] = await query<any[]>(`
      SELECT id, usuario_id, nombre, apellido, dni, telefono, numero_licencia, categoria_licencia,
             fecha_vencimiento_licencia, estado
      FROM choferes
      WHERE id = ?
      LIMIT 1
    `, [targetChoferId])

    const iniciales = `${(choferData?.nombre || '').charAt(0)}${(choferData?.apellido || '').charAt(0)}`.toUpperCase() || 'CH'
    let estadoLabel = 'Disponible'
    let estadoTone = 'green'
    if (choferData?.estado === 'en_comision') {
      estadoLabel = 'En viaje'
      estadoTone = 'blue'
    } else if (choferData?.estado === 'licencia') {
      estadoLabel = 'De licencia'
      estadoTone = 'orange'
    }

    const choferObj = choferData ? {
      id: Number(choferData.id),
      usuarioId: choferData.usuario_id ? Number(choferData.usuario_id) : null,
      nombre: choferData.nombre,
      apellido: choferData.apellido,
      nombreCompleto: `${choferData.apellido}, ${choferData.nombre}`,
      iniciales,
      dni: choferData.dni,
      telefono: choferData.telefono || 'Sin teléfono',
      numeroLicencia: choferData.numero_licencia || 'S/D',
      categoriaLicencia: choferData.categoria_licencia || 'B1',
      fechaVencimientoLicencia: choferData.fecha_vencimiento_licencia ? String(choferData.fecha_vencimiento_licencia) : '',
      estado: choferData.estado,
      estadoLabel,
      estadoTone,
    } : null

    // 3. Mes y Año del Calendario
    const ahora = new Date()
    const mes = mesParam && mesParam >= 1 && mesParam <= 12 ? mesParam : ahora.getMonth() + 1
    const anio = anioParam && anioParam >= 2020 && anioParam <= 2035 ? anioParam : ahora.getFullYear()
    const mesNombre = NOMBRES_MESES[mes - 1]

    // 4. Obtener TODAS las comisiones EXCLUSIVAS de este chofer
    const rawComisiones = await query<any[]>(`
      SELECT 
        c.id, c.codigo_comision, c.vehiculo_id, c.chofer_id, c.dependencia_solicitante_id,
        c.solicitante_nombre, c.origen, c.destino, c.motivo, c.cantidad_pasajeros,
        c.fecha_salida_programada, c.fecha_salida_real, c.fecha_regreso_estimada, c.fecha_regreso_real,
        c.odometro_salida, c.odometro_regreso, c.estado, c.observaciones,
        v.patente AS vehiculo_patente, v.marca AS vehiculo_marca, v.modelo AS vehiculo_modelo,
        d.nombre AS dependencia_nombre
      FROM comisiones c
      JOIN vehiculos v ON c.vehiculo_id = v.id
      JOIN dependencias d ON c.dependencia_solicitante_id = d.id
      WHERE c.chofer_id = ?
      ORDER BY c.fecha_salida_programada DESC
    `, [targetChoferId])

    const viajesTodos = (rawComisiones || []).map(mapRowToViajeCalendario)
    const viajeActivo = viajesTodos.find((v) => v.estado === 'en_curso') || null
    const viajesProgramados = viajesTodos.filter((v) => v.estado === 'programada').sort((a, b) => new Date(a.fechaSalidaProgramada).getTime() - new Date(b.fechaSalidaProgramada).getTime())
    
    // Historial: todos los viajes finalizados o cancelados (no realizados)
    const viajesHistorial = viajesTodos.filter((v) => v.estado === 'finalizada' || v.estado === 'cancelada')

    // Mapa de viajes por fecha (YYYY-MM-DD) para el calendario
    const mapaViajesPorFecha: Record<string, ViajeCalendarioItem[]> = {}
    viajesTodos.forEach((v) => {
      if (!mapaViajesPorFecha[v.fechaSalidaDateStr]) {
        mapaViajesPorFecha[v.fechaSalidaDateStr] = []
      }
      mapaViajesPorFecha[v.fechaSalidaDateStr].push(v)

      if (v.fechaRegresoDateStr && v.fechaRegresoDateStr !== v.fechaSalidaDateStr) {
        if (!mapaViajesPorFecha[v.fechaRegresoDateStr]) {
          mapaViajesPorFecha[v.fechaRegresoDateStr] = []
        }
        if (!mapaViajesPorFecha[v.fechaRegresoDateStr].some((item) => item.id === v.id)) {
          mapaViajesPorFecha[v.fechaRegresoDateStr].push(v)
        }
      }
    })

    // 5. Construcción de la Grilla de 7 Columnas
    const primerDiaMes = new Date(anio, mes - 1, 1)
    const dayOfWeek = primerDiaMes.getDay()
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1

    const fechaInicioGrid = new Date(primerDiaMes)
    fechaInicioGrid.setDate(primerDiaMes.getDate() - diffToMonday)

    const hoyStr = toDateString(ahora)
    const dias: DiaCalendario[] = []

    for (let i = 0; i < 42; i++) {
      const d = new Date(fechaInicioGrid)
      d.setDate(fechaInicioGrid.getDate() + i)
      const dStr = toDateString(d)
      const esMesActual = d.getMonth() + 1 === mes
      const esFinDeSemana = d.getDay() === 0 || d.getDay() === 6
      const viajesDelDia = mapaViajesPorFecha[dStr] || []

      dias.push({
        fecha: dStr,
        diaNumero: d.getDate(),
        diaSemanaIndex: (d.getDay() + 6) % 7,
        esMesActual,
        esHoy: dStr === hoyStr,
        esFinDeSemana,
        viajes: viajesDelDia,
        tieneViajes: viajesDelDia.length > 0,
      })
    }

    // 6. Estadísticas mensuales e históricas acumuladas
    let totalViajesMes = 0
    let programadosMes = 0
    let enCursoHoy = 0
    let finalizadosMes = 0
    let kmTotalesHistorico = 0
    let viajesRealizadosHistorico = 0
    let viajesNoRealizadosHistorico = 0

    viajesTodos.forEach((v) => {
      const dSal = new Date(v.fechaSalidaProgramada)
      if (dSal.getMonth() + 1 === mes && dSal.getFullYear() === anio) {
        totalViajesMes++
        if (v.estado === 'programada') programadosMes++
        if (v.estado === 'finalizada') finalizadosMes++
      }
      if (v.estado === 'en_curso') enCursoHoy++

      if (v.estado === 'finalizada') {
        viaesRealizadosHistorico: viajesRealizadosHistorico++
        if (v.kmRecorridos && v.kmRecorridos > 0) {
          kmTotalesHistorico += v.kmRecorridos
        }
      } else if (v.estado === 'cancelada') {
        viajesNoRealizadosHistorico++
      }
    })

    return {
      chofer: choferObj,
      mes,
      anio,
      mesNombre,
      dias,
      viajesTodos,
      viajesProgramados,
      viajeActivo,
      viajesHistorial,
      stats: {
        totalViajesMes,
        programadosMes,
        enCursoHoy,
        finalizadosMes,
        kmTotalesHistorico,
        viajesRealizadosHistorico,
        viajesNoRealizadosHistorico,
      },
      isStaff,
      listaChoferesSelector,
    }
  } catch (error) {
    console.error('Error al generar calendario e historial de viajes del chofer:', error)
    return {
      chofer: null,
      mes: mesParam || 10,
      anio: anioParam || 2026,
      mesNombre: 'Octubre',
      dias: [],
      viajesTodos: [],
      viajesProgramados: [],
      viajeActivo: null,
      viajesHistorial: [],
      stats: {
        totalViajesMes: 0,
        programadosMes: 0,
        enCursoHoy: 0,
        finalizadosMes: 0,
        kmTotalesHistorico: 0,
        viajesRealizadosHistorico: 0,
        viajesNoRealizadosHistorico: 0,
      },
      isStaff: false,
      listaChoferesSelector: [],
    }
  }
}
