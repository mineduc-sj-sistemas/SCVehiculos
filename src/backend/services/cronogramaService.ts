import { pool, query, withTransaction } from '../config/db'
import type {
  ActualizarEstadoComisionDTO,
  ComisionGridItem,
  CronogramaDiaHeader,
  CronogramaSemanalData,
  CronogramaStats,
  CronogramaVehiculoRow,
  DatosAuxiliaresDespacho,
  EditarComisionDTO,
  EstadoComision,
  NuevaComisionDTO,
} from '../types/cronograma.types'

// Nombres en español para días y meses
const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const MESES_ABREV = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const MESES_COMPLETOS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

/**
 * Normaliza una fecha a formato YYYY-MM-DD sin desfasajes de zona horaria
 */
function toDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Calcula los 7 días (Lunes a Domingo) de la semana correspondiente a una fecha de referencia
 */
function calcularDiasSemana(fechaRefStr?: string): { dias: CronogramaDiaHeader[]; inicio: string; fin: string; label: string; anio: number } {
  // Base date
  let baseDate: Date
  if (fechaRefStr && /^\d{4}-\d{2}-\d{2}$/.test(fechaRefStr)) {
    const [y, m, d] = fechaRefStr.split('-').map(Number)
    baseDate = new Date(y, m - 1, d, 12, 0, 0)
  } else {
    // Si no hay fecha, usamos la fecha de hoy o simulación de la base de datos (Septiembre 2026)
    baseDate = new Date()
  }

  // Día de la semana JS: 0=Domingo, 1=Lunes, ..., 6=Sábado
  const dayOfWeek = baseDate.getDay()
  // Ajuste para que Lunes = 0, ..., Domingo = 6
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek

  const monday = new Date(baseDate)
  monday.setDate(baseDate.getDate() + diffToMonday)
  monday.setHours(0, 0, 0, 0)

  const hoyStr = toDateString(new Date())

  const dias: CronogramaDiaHeader[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const fechaStr = toDateString(d)

    dias.push({
      fecha: fechaStr,
      diaNombre: DIAS_SEMANA[i],
      diaNumero: d.getDate(),
      mesNombre: MESES_ABREV[d.getMonth()],
      esHoy: fechaStr === hoyStr,
      esFinDeSemana: i >= 5,
    })
  }

  const domingo = new Date(monday)
  domingo.setDate(monday.getDate() + 6)

  const inicioStr = toDateString(monday)
  const finStr = toDateString(domingo)

  const label = `${monday.getDate()} de ${MESES_COMPLETOS[monday.getMonth()]} al ${domingo.getDate()} de ${MESES_COMPLETOS[domingo.getMonth()]} de ${domingo.getFullYear()}`

  return {
    dias,
    inicio: inicioStr,
    fin: finStr,
    label,
    anio: domingo.getFullYear(),
  }
}

/**
 * Obtiene la matriz semanal de comisiones y despacho
 */
export async function getCronogramaSemanal(fechaReferencia?: string): Promise<CronogramaSemanalData> {
  const { dias, inicio, fin, label, anio } = calcularDiasSemana(fechaReferencia)

  // 1. Obtener todos los vehículos activos
  const vehiculosRows = await query<any>(
    `SELECT 
      v.id, v.patente, v.marca, v.modelo, v.anio, 
      v.estado, v.odometro_actual, v.capacidad_pasajeros,
      COALESCE(tv.nombre, 'Móvil Oficial') AS tipo_vehiculo
     FROM vehiculos v
     LEFT JOIN tipos_vehiculo tv ON v.tipo_vehiculo_id = tv.id
     WHERE v.activo = 1 AND v.estado != 'baja'
     ORDER BY v.patente ASC`
  )

  // 2. Obtener comisiones que se solapen con esta semana
  // (fecha_salida_programada <= fin de semana AND fecha_regreso_estimada >= inicio de semana)
  const comisionesRows = await query<any>(
    `SELECT 
      c.id, c.codigo_comision, c.vehiculo_id, c.chofer_id, c.dependencia_solicitante_id,
      c.solicitante_nombre, c.origen, c.destino, c.motivo, c.cantidad_pasajeros,
      c.fecha_salida_programada, c.fecha_salida_real, 
      c.fecha_regreso_estimada, c.fecha_regreso_real,
      c.odometro_salida, c.odometro_regreso,
      CASE 
        WHEN c.odometro_regreso IS NOT NULL AND c.odometro_salida IS NOT NULL 
        THEN (c.odometro_regreso - c.odometro_salida)
        ELSE NULL 
      END AS km_recorridos,
      c.estado, c.observaciones,
      v.patente AS vehiculo_patente, v.modelo AS vehiculo_modelo,
      ch.nombre AS chofer_nombre, ch.apellido AS chofer_apellido,
      d.nombre AS dependencia_nombre
     FROM comisiones c
     INNER JOIN vehiculos v ON c.vehiculo_id = v.id
     INNER JOIN choferes ch ON c.chofer_id = ch.id
     INNER JOIN dependencias d ON c.dependencia_solicitante_id = d.id
     WHERE DATE(c.fecha_salida_programada) <= ? 
       AND DATE(c.fecha_regreso_estimada) >= ?
     ORDER BY c.fecha_salida_programada ASC`,
    [`${fin} 23:59:59`, `${inicio} 00:00:00`]
  )

  // Formatear items de comisión
  const comisionesFormateadas: ComisionGridItem[] = comisionesRows.map((r: any) => ({
    id: Number(r.id),
    codigoComision: r.codigo_comision,
    vehiculoId: Number(r.vehiculo_id),
    vehiculoPatente: r.vehiculo_patente,
    vehiculoModelo: r.vehiculo_modelo,
    choferId: Number(r.chofer_id),
    choferNombre: r.chofer_nombre,
    choferApellido: r.chofer_apellido,
    dependenciaId: Number(r.dependencia_solicitante_id),
    dependenciaNombre: r.dependencia_nombre,
    solicitanteNombre: r.solicitante_nombre ?? null,
    origen: r.origen,
    destino: r.destino,
    motivo: r.motivo,
    cantidadPasajeros: Number(r.cantidad_pasajeros ?? 1),
    fechaSalidaProgramada: r.fecha_salida_programada instanceof Date ? r.fecha_salida_programada.toISOString() : String(r.fecha_salida_programada),
    fechaSalidaReal: r.fecha_salida_real ? (r.fecha_salida_real instanceof Date ? r.fecha_salida_real.toISOString() : String(r.fecha_salida_real)) : null,
    fechaRegresoEstimada: r.fecha_regreso_estimada instanceof Date ? r.fecha_regreso_estimada.toISOString() : String(r.fecha_regreso_estimada),
    fechaRegresoReal: r.fecha_regreso_real ? (r.fecha_regreso_real instanceof Date ? r.fecha_regreso_real.toISOString() : String(r.fecha_regreso_real)) : null,
    odometroSalida: r.odometro_salida ? Number(r.odometro_salida) : null,
    odometroRegreso: r.odometro_regreso ? Number(r.odometro_regreso) : null,
    kmRecorridos: r.km_recorridos ? Number(r.km_recorridos) : null,
    estado: r.estado as EstadoComision,
    observaciones: r.observaciones ?? null,
  }))

  // 3. Organizar filas por vehículo y mapear comisiones por día
  const filas: CronogramaVehiculoRow[] = vehiculosRows.map((v: any) => {
    const comisionesPorDia: Record<string, ComisionGridItem[]> = {}
    dias.forEach((d) => {
      comisionesPorDia[d.fecha] = []
    })

    // Buscar comisiones que aplican a este vehículo
    const comisionesDelVehiculo = comisionesFormateadas.filter((c) => c.vehiculoId === Number(v.id))

    comisionesDelVehiculo.forEach((c) => {
      const fechaSalida = c.fechaSalidaProgramada.split('T')[0]
      const fechaRegreso = c.fechaRegresoEstimada.split('T')[0]

      // Asignar la comisión a cada día del rango de la semana que coincida
      dias.forEach((d) => {
        if (d.fecha >= fechaSalida && d.fecha <= fechaRegreso) {
          // Evitar duplicados en el mismo día
          if (!comisionesPorDia[d.fecha].some((item) => item.id === c.id)) {
            comisionesPorDia[d.fecha].push(c)
          }
        }
      })
    })

    return {
      vehiculoId: Number(v.id),
      patente: v.patente,
      marca: v.marca,
      modelo: v.modelo,
      anio: Number(v.anio ?? 2022),
      tipoVehiculo: v.tipo_vehiculo,
      capacidadPasajeros: Number(v.capacidad_pasajeros ?? 5),
      estadoVehiculo: v.estado,
      odometroActual: Number(v.odometro_actual ?? 0),
      comisionesPorDia,
    }
  })

  // 4. Calcular KPIs de la semana
  const vehiculosConComision = new Set(comisionesFormateadas.map((c) => c.vehiculoId))
  const hoyStr = toDateString(new Date())

  const stats: CronogramaStats = {
    totalComisionesSemana: comisionesFormateadas.length,
    enCursoHoy: comisionesFormateadas.filter((c) => {
      if (c.estado !== 'en_curso') return false
      const salida = c.fechaSalidaProgramada.split('T')[0]
      const regreso = c.fechaRegresoEstimada.split('T')[0]
      return hoyStr >= salida && hoyStr <= regreso
    }).length,
    programadasSemana: comisionesFormateadas.filter((c) => c.estado === 'programada').length,
    finalizadasSemana: comisionesFormateadas.filter((c) => c.estado === 'finalizada').length,
    vehiculosOperativos: vehiculosRows.filter((v: any) => v.estado !== 'en_taller').length,
    vehiculosAsignadosSemana: vehiculosConComision.size,
  }

  return {
    rangoSemana: {
      inicio,
      fin,
      label,
      anio,
    },
    dias,
    filas,
    stats,
  }
}

/**
 * Obtiene los datos de soporte para el modal de asignación y despacho rápido
 */
export async function getDatosAuxiliaresDespacho(): Promise<DatosAuxiliaresDespacho> {
  const [vehiculos, choferes, dependencias] = await Promise.all([
    query<any>(
      `SELECT id, patente, marca, modelo, estado, capacidad_pasajeros, odometro_actual
       FROM vehiculos
       WHERE activo = 1 AND estado != 'baja'
       ORDER BY patente ASC`
    ),
    query<any>(
      `SELECT id, nombre, apellido, dni, estado, categoria_licencia, fecha_vencimiento_licencia
       FROM choferes
       WHERE estado != 'inactivo'
       ORDER BY apellido ASC, nombre ASC`
    ),
    query<any>(
      `SELECT id, nombre, COALESCE(sigla, '') AS codigo
       FROM dependencias
       ORDER BY nombre ASC`
    ),
  ])

  const hoyStr = toDateString(new Date())

  return {
    vehiculos: vehiculos.map((v: any) => ({
      id: Number(v.id),
      patente: v.patente,
      marca: v.marca,
      modelo: v.modelo,
      estado: v.estado,
      capacidadPasajeros: Number(v.capacidad_pasajeros ?? 5),
      odometroActual: Number(v.odometro_actual ?? 0),
    })),
    choferes: choferes.map((c: any) => {
      const venc = c.fecha_vencimiento_licencia ? toDateString(new Date(c.fecha_vencimiento_licencia)) : null
      const vencida = venc ? venc < hoyStr : false
      return {
        id: Number(c.id),
        nombre: c.nombre,
        apellido: c.apellido,
        dni: c.dni,
        estado: c.estado,
        categoriaLicencia: c.categoria_licencia ?? null,
        licenciaVencimiento: venc,
        licenciaVencida: vencida,
      }
    }),
    dependencias: dependencias.map((d: any) => ({
      id: Number(d.id),
      nombre: d.nombre,
      codigo: d.codigo ?? '',
    })),
  }
}

/**
 * Obtiene el detalle completo de una comisión por su ID
 */
export async function getComisionDetalle(id: number): Promise<ComisionGridItem | null> {
  const rows = await query<any>(
    `SELECT 
      c.id, c.codigo_comision, c.vehiculo_id, c.chofer_id, c.dependencia_solicitante_id,
      c.solicitante_nombre, c.origen, c.destino, c.motivo, c.cantidad_pasajeros,
      c.fecha_salida_programada, c.fecha_salida_real, 
      c.fecha_regreso_estimada, c.fecha_regreso_real,
      c.odometro_salida, c.odometro_regreso,
      CASE 
        WHEN c.odometro_regreso IS NOT NULL AND c.odometro_salida IS NOT NULL 
        THEN (c.odometro_regreso - c.odometro_salida)
        ELSE NULL 
      END AS km_recorridos,
      c.estado, c.observaciones,
      v.patente AS vehiculo_patente, v.modelo AS vehiculo_modelo,
      ch.nombre AS chofer_nombre, ch.apellido AS chofer_apellido,
      d.nombre AS dependencia_nombre
     FROM comisiones c
     INNER JOIN vehiculos v ON c.vehiculo_id = v.id
     INNER JOIN choferes ch ON c.chofer_id = ch.id
     INNER JOIN dependencias d ON c.dependencia_solicitante_id = d.id
     WHERE c.id = ?
     LIMIT 1`,
    [id]
  )

  if (!rows || rows.length === 0) return null

  const r = rows[0]

  // Obtener check-ins registrados por el chofer
  const checkinsRows = await query<any>(
    `SELECT id, comision_id, chofer_id, parada_index, destino_nombre, latitud, longitud, precision_gps, observaciones, fecha_hora
     FROM checkins_comision
     WHERE comision_id = ?
     ORDER BY parada_index ASC, fecha_hora ASC`,
    [id]
  )

  const checkins = (checkinsRows || []).map((ch: any) => ({
    id: Number(ch.id),
    comisionId: Number(ch.comision_id),
    choferId: Number(ch.chofer_id),
    numeroParada: Number(ch.parada_index),
    destinoNombre: ch.destino_nombre,
    latitud: ch.latitud !== null && ch.latitud !== undefined ? Number(ch.latitud) : null,
    longitud: ch.longitud !== null && ch.longitud !== undefined ? Number(ch.longitud) : null,
    precisionGps: ch.precision_gps !== null && ch.precision_gps !== undefined ? Number(ch.precision_gps) : null,
    fechaRegistro: ch.fecha_hora instanceof Date ? ch.fecha_hora.toISOString() : String(ch.fecha_hora),
    observacion: ch.observaciones || null,
  }))

  return {
    id: Number(r.id),
    codigoComision: r.codigo_comision,
    vehiculoId: Number(r.vehiculo_id),
    vehiculoPatente: r.vehiculo_patente,
    vehiculoModelo: r.vehiculo_modelo,
    choferId: Number(r.chofer_id),
    choferNombre: r.chofer_nombre,
    choferApellido: r.chofer_apellido,
    dependenciaId: Number(r.dependencia_solicitante_id),
    dependenciaNombre: r.dependencia_nombre,
    solicitanteNombre: r.solicitante_nombre ?? null,
    origen: r.origen,
    destino: r.destino,
    motivo: r.motivo,
    cantidadPasajeros: Number(r.cantidad_pasajeros ?? 1),
    fechaSalidaProgramada: r.fecha_salida_programada instanceof Date ? r.fecha_salida_programada.toISOString() : String(r.fecha_salida_programada),
    fechaSalidaReal: r.fecha_salida_real ? (r.fecha_salida_real instanceof Date ? r.fecha_salida_real.toISOString() : String(r.fecha_salida_real)) : null,
    fechaRegresoEstimada: r.fecha_regreso_estimada instanceof Date ? r.fecha_regreso_estimada.toISOString() : String(r.fecha_regreso_estimada),
    fechaRegresoReal: r.fecha_regreso_real ? (r.fecha_regreso_real instanceof Date ? r.fecha_regreso_real.toISOString() : String(r.fecha_regreso_real)) : null,
    odometroSalida: r.odometro_salida ? Number(r.odometro_salida) : null,
    odometroRegreso: r.odometro_regreso ? Number(r.odometro_regreso) : null,
    kmRecorridos: r.km_recorridos ? Number(r.km_recorridos) : null,
    estado: r.estado as EstadoComision,
    observaciones: r.observaciones ?? null,
    checkins,
  }
}

export interface HojaDeRutaCompleta {
  id: number
  codigoComision: string
  origen: string
  destino: string
  motivo: string
  cantidadPasajeros: number
  solicitanteNombre: string | null
  fechaSalidaProgramada: string
  fechaSalidaReal: string | null
  fechaRegresoEstimada: string
  fechaRegresoReal: string | null
  odometroSalida: number | null
  odometroRegreso: number | null
  kmRecorridos: number | null
  estado: EstadoComision
  observaciones: string | null
  createdAt: string
  // Vehículo
  vehiculoId: number
  vehiculoPatente: string
  vehiculoMarca: string
  vehiculoModelo: string
  vehiculoTipo: string
  vehiculoAnio: number | null
  vehiculoColor: string | null
  companiaSeguro: string | null
  numeroPoliza: string | null
  fechaVencimientoSeguro: string | null
  fechaVencimientoVtv: string | null
  numeroRto: string | null
  // Chofer
  choferId: number
  choferNombre: string
  choferApellido: string
  choferDni: string
  choferCuil: string | null
  choferTelefono: string | null
  numeroLicencia: string
  categoriaLicencia: string
  fechaVencimientoLicencia: string | null
  // Dependencia
  dependenciaId: number
  dependenciaNombre: string
  dependenciaResponsable: string | null
  dependenciaTelefono: string | null
  // Despacho
  despachanteNombre: string | null
}

/**
 * Obtiene toda la información legal, técnica y operativa para la Hoja de Ruta e impresión oficial
 */
export async function getHojaDeRutaData(id: number): Promise<HojaDeRutaCompleta | null> {
  const rows = await query<any>(
    `SELECT 
      c.id, c.codigo_comision, c.origen, c.destino, c.motivo, c.cantidad_pasajeros,
      c.solicitante_nombre, c.fecha_salida_programada, c.fecha_salida_real,
      c.fecha_regreso_estimada, c.fecha_regreso_real,
      c.odometro_salida, c.odometro_regreso,
      CASE 
        WHEN c.odometro_regreso IS NOT NULL AND c.odometro_salida IS NOT NULL 
        THEN (c.odometro_regreso - c.odometro_salida)
        ELSE NULL 
      END AS km_recorridos,
      c.estado, c.observaciones, c.created_at,
      v.id AS vehiculo_id, v.patente AS vehiculo_patente, v.marca AS vehiculo_marca,
      v.modelo AS vehiculo_modelo, COALESCE(tv.nombre, 'Automóvil') AS vehiculo_tipo,
      v.anio AS vehiculo_anio, v.color AS vehiculo_color, v.compania_seguro, v.numero_poliza,
      v.fecha_vencimiento_seguro, v.fecha_vencimiento_vtv, v.numero_rto,
      ch.id AS chofer_id, ch.nombre AS chofer_nombre, ch.apellido AS chofer_apellido,
      ch.dni AS chofer_dni, ch.cuil AS chofer_cuil, ch.telefono AS chofer_telefono,
      ch.numero_licencia, ch.categoria_licencia, ch.fecha_vencimiento_licencia,
      d.id AS dependencia_id, d.nombre AS dependencia_nombre,
      d.responsable AS dependencia_responsable, d.telefono AS dependencia_telefono,
      CONCAT(u.nombre, ' ', u.apellido) AS despachante_nombre
     FROM comisiones c
     INNER JOIN vehiculos v ON c.vehiculo_id = v.id
     LEFT JOIN tipos_vehiculo tv ON v.tipo_vehiculo_id = tv.id
     INNER JOIN choferes ch ON c.chofer_id = ch.id
     INNER JOIN dependencias d ON c.dependencia_solicitante_id = d.id
     LEFT JOIN usuarios u ON c.usuario_creador_id = u.id
     WHERE c.id = ?
     LIMIT 1`,
    [id]
  )

  if (!rows || rows.length === 0) return null
  const r = rows[0]

  return {
    id: Number(r.id),
    codigoComision: r.codigo_comision,
    origen: r.origen,
    destino: r.destino,
    motivo: r.motivo,
    cantidadPasajeros: Number(r.cantidad_pasajeros ?? 1),
    solicitanteNombre: r.solicitante_nombre ?? null,
    fechaSalidaProgramada: r.fecha_salida_programada instanceof Date ? r.fecha_salida_programada.toISOString() : String(r.fecha_salida_programada),
    fechaSalidaReal: r.fecha_salida_real ? (r.fecha_salida_real instanceof Date ? r.fecha_salida_real.toISOString() : String(r.fecha_salida_real)) : null,
    fechaRegresoEstimada: r.fecha_regreso_estimada instanceof Date ? r.fecha_regreso_estimada.toISOString() : String(r.fecha_regreso_estimada),
    fechaRegresoReal: r.fecha_regreso_real ? (r.fecha_regreso_real instanceof Date ? r.fecha_regreso_real.toISOString() : String(r.fecha_regreso_real)) : null,
    odometroSalida: r.odometro_salida ? Number(r.odometro_salida) : null,
    odometroRegreso: r.odometro_regreso ? Number(r.odometro_regreso) : null,
    kmRecorridos: r.km_recorridos ? Number(r.km_recorridos) : null,
    estado: r.estado as EstadoComision,
    observaciones: r.observaciones ?? null,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
    vehiculoId: Number(r.vehiculo_id),
    vehiculoPatente: r.vehiculo_patente,
    vehiculoMarca: r.vehiculo_marca,
    vehiculoModelo: r.vehiculo_modelo,
    vehiculoTipo: r.vehiculo_tipo,
    vehiculoAnio: r.vehiculo_anio ? Number(r.vehiculo_anio) : null,
    vehiculoColor: r.vehiculo_color ?? null,
    companiaSeguro: r.compania_seguro ?? null,
    numeroPoliza: r.numero_poliza ?? null,
    fechaVencimientoSeguro: r.fecha_vencimiento_seguro ? toDateString(new Date(r.fecha_vencimiento_seguro)) : null,
    fechaVencimientoVtv: r.fecha_vencimiento_vtv ? toDateString(new Date(r.fecha_vencimiento_vtv)) : null,
    numeroRto: r.numero_rto ?? null,
    choferId: Number(r.chofer_id),
    choferNombre: r.chofer_nombre,
    choferApellido: r.chofer_apellido,
    choferDni: r.chofer_dni,
    choferCuil: r.chofer_cuil ?? null,
    choferTelefono: r.chofer_telefono ?? null,
    numeroLicencia: r.numero_licencia,
    categoriaLicencia: r.categoria_licencia,
    fechaVencimientoLicencia: r.fecha_vencimiento_licencia ? toDateString(new Date(r.fecha_vencimiento_licencia)) : null,
    dependenciaId: Number(r.dependencia_id),
    dependenciaNombre: r.dependencia_nombre,
    dependenciaResponsable: r.dependencia_responsable ?? null,
    dependenciaTelefono: r.dependencia_telefono ?? null,
    despachanteNombre: r.despachante_nombre ?? 'Mesa de Despacho Central',
  }
}

/**
 * Genera el siguiente código correlativo de comisión (ej: COM-2026-0092)
 */
async function generarSiguienteCodigoComision(): Promise<string> {
  const anioActual = new Date().getFullYear()
  const rows = await query<any>(
    `SELECT codigo_comision FROM comisiones 
     WHERE codigo_comision LIKE ? 
     ORDER BY id DESC LIMIT 1`,
    [`COM-${anioActual}-%`]
  )

  let correlativo = 1
  if (rows && rows.length > 0 && rows[0].codigo_comision) {
    const parts = rows[0].codigo_comision.split('-')
    const lastNum = parseInt(parts[2], 10)
    if (!isNaN(lastNum)) {
      correlativo = lastNum + 1
    }
  } else {
    // Si no hay de este año, consultar el último número general para mantener orden
    const lastGeneral = await query<any>(`SELECT id FROM comisiones ORDER BY id DESC LIMIT 1`)
    if (lastGeneral && lastGeneral.length > 0) {
      correlativo = Number(lastGeneral[0].id) + 100
    }
  }

  return `COM-${anioActual}-${String(correlativo).padStart(4, '0')}`
}

/**
 * Verifica si existe superposición horaria para el vehículo o el chofer con comisiones activas (programada o en_curso).
 * Dos intervalos [S1, R1] y [S2, R2] se solapan si S1 < R2 AND R1 > S2.
 */
export async function verificarConflictoHorario(
  connOrPool: any,
  vehiculoId: number,
  choferId: number,
  salida: Date,
  regreso: Date,
  excludeComisionId?: number
): Promise<{ tieneConflicto: boolean; error?: string }> {
  const pad = (n: number) => String(n).padStart(2, '0')
  const formatSqlDatetime = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`

  const salidaSql = formatSqlDatetime(salida)
  const regresoSql = formatSqlDatetime(regreso)

  const formatHora = (dStr: any) => {
    const d = new Date(dStr)
    return isNaN(d.getTime()) ? '' : d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  }
  const formatFecha = (dStr: any) => {
    const d = new Date(dStr)
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  // 1. Validar solapamiento del vehículo
  const vehParams: any[] = [vehiculoId, regresoSql, salidaSql]
  let vehSql = `
    SELECT c.id, c.codigo_comision, c.fecha_salida_programada, c.fecha_regreso_estimada,
           v.patente, v.marca, v.modelo
    FROM comisiones c
    JOIN vehiculos v ON v.id = c.vehiculo_id
    WHERE c.vehiculo_id = ?
      AND c.estado IN ('programada', 'en_curso')
      AND c.fecha_salida_programada < ?
      AND c.fecha_regreso_estimada > ?
  `
  if (excludeComisionId) {
    vehSql += ' AND c.id != ?'
    vehParams.push(excludeComisionId)
  }
  vehSql += ' LIMIT 1'

  const [vehConflictos] = await connOrPool.execute(vehSql, vehParams)
  if (vehConflictos && (vehConflictos as any[]).length > 0) {
    const conf = (vehConflictos as any[])[0]
    const hsSalida = formatHora(conf.fecha_salida_programada)
    const hsRegreso = formatHora(conf.fecha_regreso_estimada)
    const dia = formatFecha(conf.fecha_salida_programada)
    return {
      tieneConflicto: true,
      error: `Conflicto de horario: El móvil ${conf.patente} (${conf.marca} ${conf.modelo}) ya tiene asignada la comisión ${conf.codigo_comision} el día ${dia} de ${hsSalida} a ${hsRegreso} hs. Cada vehículo solo puede realizar un viaje a la vez.`,
    }
  }

  // 2. Validar solapamiento del chofer
  const choferParams: any[] = [choferId, regresoSql, salidaSql]
  let choferSql = `
    SELECT c.id, c.codigo_comision, c.fecha_salida_programada, c.fecha_regreso_estimada,
           ch.nombre, ch.apellido
    FROM comisiones c
    JOIN choferes ch ON ch.id = c.chofer_id
    WHERE c.chofer_id = ?
      AND c.estado IN ('programada', 'en_curso')
      AND c.fecha_salida_programada < ?
      AND c.fecha_regreso_estimada > ?
  `
  if (excludeComisionId) {
    choferSql += ' AND c.id != ?'
    choferParams.push(excludeComisionId)
  }
  choferSql += ' LIMIT 1'

  const [choferConflictos] = await connOrPool.execute(choferSql, choferParams)
  if (choferConflictos && (choferConflictos as any[]).length > 0) {
    const conf = (choferConflictos as any[])[0]
    const hsSalida = formatHora(conf.fecha_salida_programada)
    const hsRegreso = formatHora(conf.fecha_regreso_estimada)
    const dia = formatFecha(conf.fecha_salida_programada)
    return {
      tieneConflicto: true,
      error: `Conflicto de horario: El chofer ${conf.apellido}, ${conf.nombre} ya tiene asignada la comisión ${conf.codigo_comision} el día ${dia} de ${hsSalida} a ${hsRegreso} hs. Un conductor no puede realizar dos viajes simultáneos.`,
    }
  }

  return { tieneConflicto: false }
}

/**
 * Registra y despacha una nueva comisión en el cronograma
 */
export async function crearComision(dto: NuevaComisionDTO): Promise<{ success: boolean; id?: number; codigoComision?: string; error?: string }> {
  try {
    // Validar existencia de vehículo, capacidad y vigencia de RTO
    const vehiculo = await query<any>(
      `SELECT id, patente, modelo, estado, odometro_actual, capacidad_pasajeros, fecha_vencimiento_vtv 
       FROM vehiculos WHERE id = ? LIMIT 1`,
      [dto.vehiculoId]
    )
    if (!vehiculo || vehiculo.length === 0) {
      return { success: false, error: 'El vehículo seleccionado no existe.' }
    }
    if (vehiculo[0].estado === 'en_taller') {
      return { success: false, error: 'El vehículo se encuentra en taller o mantenimiento y no puede ser asignado.' }
    }
    if (vehiculo[0].estado === 'baja') {
      return { success: false, error: 'El vehículo se encuentra dado de baja del parque automotor.' }
    }

    // Validar capacidad física de pasajeros
    const capMax = Number(vehiculo[0].capacidad_pasajeros) || 5
    const cantPasajeros = Number(dto.cantidadPasajeros) || 1
    if (cantPasajeros > capMax) {
      return {
        success: false,
        error: `Exceso de pasajeros: La unidad ${vehiculo[0].patente} (${vehiculo[0].modelo}) tiene capacidad máxima para ${capMax} pasajeros (se solicitaron ${cantPasajeros}).`,
      }
    }

    // Validar existencia de chofer y vigencia de su licencia
    const chofer = await query<any>(
      `SELECT id, nombre, apellido, estado, fecha_vencimiento_licencia 
       FROM choferes WHERE id = ? LIMIT 1`,
      [dto.choferId]
    )
    if (!chofer || chofer.length === 0) {
      return { success: false, error: 'El chofer seleccionado no existe.' }
    }
    if (chofer[0].estado === 'licencia' || chofer[0].estado === 'inactivo') {
      return { success: false, error: 'El chofer seleccionado se encuentra de licencia médica o inactivo.' }
    }

    // Validar fechas
    const salida = new Date(dto.fechaSalidaProgramada)
    const regreso = new Date(dto.fechaRegresoEstimada)
    if (isNaN(salida.getTime()) || isNaN(regreso.getTime())) {
      return { success: false, error: 'Las fechas de salida y regreso son inválidas.' }
    }
    if (regreso < salida) {
      return { success: false, error: 'La fecha y hora de regreso estimada no puede ser anterior a la salida.' }
    }

    // Validar que la RTO/VTV del vehículo no venza antes de la fecha de regreso estimada
    if (vehiculo[0].fecha_vencimiento_vtv) {
      const vtvDate = new Date(vehiculo[0].fecha_vencimiento_vtv)
      vtvDate.setHours(23, 59, 59, 999)
      if (vtvDate < regreso) {
        const vtvStr = new Date(vehiculo[0].fecha_vencimiento_vtv).toLocaleDateString('es-AR')
        return {
          success: false,
          error: `Inhabilitación técnica: El vehículo ${vehiculo[0].patente} posee su RTO/VTV vencida o vence antes del regreso del viaje (${vtvStr}). No puede ser despachado.`,
        }
      }
    }

    // Validar que la licencia del chofer no venza antes de la fecha de regreso estimada
    if (chofer[0].fecha_vencimiento_licencia) {
      const licDate = new Date(chofer[0].fecha_vencimiento_licencia)
      licDate.setHours(23, 59, 59, 999)
      if (licDate < regreso) {
        const licStr = new Date(chofer[0].fecha_vencimiento_licencia).toLocaleDateString('es-AR')
        return {
          success: false,
          error: `Inhabilitación legal: El chofer ${chofer[0].apellido}, ${chofer[0].nombre} posee su licencia de conducir vencida o vence antes del regreso del viaje (${licStr}). No puede ser asignado.`,
        }
      }
    }

    // Validar conflicto de horario (un vehículo y un chofer sólo pueden hacer un viaje al mismo tiempo)
    const conflicto = await verificarConflictoHorario(pool, dto.vehiculoId, dto.choferId, salida, regreso)
    if (conflicto.tieneConflicto) {
      return { success: false, error: conflicto.error }
    }

    const codigoComision = await generarSiguienteCodigoComision()

    // Formatear fechas para MySQL DATETIME (YYYY-MM-DD HH:MM:SS)
    const formatSqlDatetime = (d: Date) => {
      const pad = (n: number) => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    }

    return await withTransaction(async (conn) => {
      const [res] = await conn.execute<any>(
        `INSERT INTO comisiones (
          codigo_comision, vehiculo_id, chofer_id, dependencia_solicitante_id,
          solicitante_nombre, origen, destino, motivo, cantidad_pasajeros,
          fecha_salida_programada, fecha_regreso_estimada, odometro_salida,
          estado, observaciones, usuario_creador_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'programada', ?, ?)`,
        [
          codigoComision,
          dto.vehiculoId,
          dto.choferId,
          dto.dependenciaId,
          dto.solicitanteNombre || null,
          dto.origen || 'Ministerio de Educación - Centro Cívico',
          dto.destino,
          dto.motivo,
          dto.cantidadPasajeros || 1,
          formatSqlDatetime(salida),
          formatSqlDatetime(regreso),
          vehiculo[0].odometro_actual,
          dto.observaciones || null,
          dto.usuarioCreadorId || null,
        ]
      )

      return {
        success: true,
        id: res.insertId,
        codigoComision,
      }
    })
  } catch (error: any) {
    console.error('Error al crear comisión en cronogramaService (transacción):', error)
    return { success: false, error: error.message || 'Error al persistir la comisión' }
  }
}

/**
 * Actualiza el estado operativo de una comisión (despachar salida, registrar regreso, cancelar)
 */
export async function actualizarEstadoComision(id: number, dto: ActualizarEstadoComisionDTO): Promise<{ success: boolean; error?: string }> {
  try {
    return await withTransaction(async (conn) => {
      const [comisionRows] = await conn.execute<any>(`SELECT id, vehiculo_id, chofer_id, estado, odometro_salida FROM comisiones WHERE id = ? LIMIT 1`, [id])
      if (!comisionRows || (comisionRows as any[]).length === 0) {
        return { success: false, error: 'Comisión no encontrada.' }
      }

      const comision = (comisionRows as any[])[0]
      const ahora = new Date()
      const pad = (n: number) => String(n).padStart(2, '0')
      const sqlAhora = `${ahora.getFullYear()}-${pad(ahora.getMonth() + 1)}-${pad(ahora.getDate())} ${pad(ahora.getHours())}:${pad(ahora.getMinutes())}:${pad(ahora.getSeconds())}`

      // Obtener estado y odómetro actual del vehículo para auditoría y validación
      const [vehRows] = await conn.execute<any>(`SELECT estado, odometro_actual FROM vehiculos WHERE id = ?`, [comision.vehiculo_id])
      const vehData = (vehRows as any[])[0]
      const estadoAnteriorVehiculo = vehData?.estado || 'disponible'
      const odoActualVehiculo = Number(vehData?.odometro_actual || 0)

      if (dto.estado === 'en_curso') {
        // Registrar salida real
        const odoSalida = dto.odometroSalida !== undefined ? dto.odometroSalida : comision.odometro_salida
        if (odoSalida !== null && odoSalida !== undefined && Number(odoSalida) < odoActualVehiculo) {
          return {
            success: false,
            error: `Inconsistencia de odómetro: El kilometraje de salida (${odoSalida} km) no puede ser inferior al odómetro actual registrado del vehículo (${odoActualVehiculo} km).`,
          }
        }

        await conn.execute(
          `UPDATE comisiones SET 
            estado = 'en_curso',
            fecha_salida_real = ?,
            odometro_salida = ?,
            observaciones = COALESCE(?, observaciones)
           WHERE id = ?`,
          [sqlAhora, odoSalida, dto.observaciones ?? null, id]
        )

        // Actualizar estado del vehículo y chofer
        await conn.execute(`UPDATE vehiculos SET estado = 'en_comision' WHERE id = ?`, [comision.vehiculo_id])
        await conn.execute(`UPDATE choferes SET estado = 'en_comision' WHERE id = ?`, [comision.chofer_id])

        // Registrar auditoría de estado del vehículo
        await conn.execute(
          `INSERT INTO auditoria_estados_vehiculo (
            vehiculo_id, estado_anterior, estado_nuevo, motivo, comision_id, usuario_id, created_at
          ) VALUES (?, ?, 'en_comision', 'Despacho de comisión oficial', ?, ?, NOW())`,
          [comision.vehiculo_id, estadoAnteriorVehiculo, id, dto.usuarioId || null]
        )
      } else if (dto.estado === 'finalizada') {
        // Registrar regreso real
        const odoRegreso = dto.odometroRegreso ?? null
        const odoSalida = Number(comision.odometro_salida || 0)
        if (odoRegreso !== null && odoRegreso !== undefined && odoSalida > 0) {
          if (Number(odoRegreso) <= odoSalida) {
            return {
              success: false,
              error: `Inconsistencia de odómetro: El odómetro de llegada (${odoRegreso} km) debe ser estrictamente mayor al odómetro de salida (${odoSalida} km).`,
            }
          }
        }

        await conn.execute(
          `UPDATE comisiones SET 
            estado = 'finalizada',
            fecha_regreso_real = ?,
            odometro_regreso = ?,
            observaciones = COALESCE(?, observaciones)
           WHERE id = ?`,
          [sqlAhora, odoRegreso, dto.observaciones ?? null, id]
        )

        // Si se reportó odómetro de regreso, actualizar odómetro actual del vehículo
        if (odoRegreso && odoRegreso > 0) {
          await conn.execute(`UPDATE vehiculos SET odometro_actual = ? WHERE id = ? AND odometro_actual < ?`, [odoRegreso, comision.vehiculo_id, odoRegreso])
        }

        // Liberar vehículo y chofer a disponible
        await conn.execute(`UPDATE vehiculos SET estado = 'disponible' WHERE id = ? AND estado = 'en_comision'`, [comision.vehiculo_id])
        await conn.execute(`UPDATE choferes SET estado = 'disponible' WHERE id = ? AND estado = 'en_comision'`, [comision.chofer_id])

        // Registrar auditoría de liberación del vehículo
        await conn.execute(
          `INSERT INTO auditoria_estados_vehiculo (
            vehiculo_id, estado_anterior, estado_nuevo, motivo, comision_id, usuario_id, created_at
          ) VALUES (?, ?, 'disponible', 'Retorno y finalización de comisión', ?, ?, NOW())`,
          [comision.vehiculo_id, estadoAnteriorVehiculo, id, dto.usuarioId || null]
        )
      } else if (dto.estado === 'cancelada') {
        await conn.execute(
          `UPDATE comisiones SET 
            estado = 'cancelada',
            observaciones = COALESCE(?, observaciones)
           WHERE id = ?`,
          [dto.observaciones ?? null, id]
        )

        // Si estaba en curso, liberar vehículo y chofer
        if (comision.estado === 'en_curso') {
          await conn.execute(`UPDATE vehiculos SET estado = 'disponible' WHERE id = ? AND estado = 'en_comision'`, [comision.vehiculo_id])
          await conn.execute(`UPDATE choferes SET estado = 'disponible' WHERE id = ? AND estado = 'en_comision'`, [comision.chofer_id])

          // Auditoría de cancelación
          await conn.execute(
            `INSERT INTO auditoria_estados_vehiculo (
              vehiculo_id, estado_anterior, estado_nuevo, motivo, comision_id, usuario_id, created_at
            ) VALUES (?, ?, 'disponible', 'Comisión cancelada en curso', ?, ?, NOW())`,
            [comision.vehiculo_id, estadoAnteriorVehiculo, id, dto.usuarioId || null]
          )
        }
      } else {
        // Actualizar otros estados o campos
        await conn.execute(
          `UPDATE comisiones SET 
            estado = ?,
            observaciones = COALESCE(?, observaciones)
           WHERE id = ?`,
          [dto.estado, dto.observaciones ?? null, id]
        )
      }

      return { success: true }
    })
  } catch (error: any) {
    console.error('Error al actualizar estado de comisión en transacción:', error)
    return { success: false, error: error.message || 'Error al actualizar comisión' }
  }
}

/**
 * Edita los datos de una comisión oficial existente
 */
export async function editarComision(
  id: number,
  dto: EditarComisionDTO
): Promise<{ success: boolean; error?: string }> {
  try {
    return await withTransaction(async (conn) => {
      const [comisionRows] = await conn.execute<any>(
        `SELECT id, codigo_comision, vehiculo_id, chofer_id, dependencia_solicitante_id,
                solicitante_nombre, origen, destino, motivo, cantidad_pasajeros,
                fecha_salida_programada, fecha_regreso_estimada, estado, observaciones, odometro_salida
         FROM comisiones WHERE id = ? LIMIT 1`,
        [id]
      )

      if (!comisionRows || (comisionRows as any[]).length === 0) {
        return { success: false, error: 'Comisión no encontrada.' }
      }

      const comision = (comisionRows as any[])[0]

      if (comision.estado === 'cancelada') {
        return { success: false, error: 'No se puede editar una comisión cancelada.' }
      }
      if (comision.estado === 'finalizada') {
        return { success: false, error: 'No se puede editar una comisión que ya ha finalizado.' }
      }

      // Validar vehículo si se cambia
      let nuevoVehiculoId = comision.vehiculo_id
      let nuevoOdometroSalida = comision.odometro_salida

      if (dto.vehiculoId && dto.vehiculoId !== comision.vehiculo_id) {
        if (comision.estado === 'en_curso') {
          return { success: false, error: 'No se puede cambiar el vehículo de una comisión que ya se encuentra en viaje.' }
        }

        const [vehiculoRows] = await conn.execute<any>(
          `SELECT id, estado, odometro_actual FROM vehiculos WHERE id = ? AND activo = 1 LIMIT 1`,
          [dto.vehiculoId]
        )
        if (!vehiculoRows || (vehiculoRows as any[]).length === 0) {
          return { success: false, error: 'El vehículo seleccionado no existe o no está activo.' }
        }
        if ((vehiculoRows as any[])[0].estado === 'en_taller') {
          return { success: false, error: 'El vehículo seleccionado se encuentra en taller o mantenimiento.' }
        }

        nuevoVehiculoId = dto.vehiculoId
        nuevoOdometroSalida = (vehiculoRows as any[])[0].odometro_actual
      }

      // Validar chofer si se cambia
      let nuevoChoferId = comision.chofer_id
      if (dto.choferId && dto.choferId !== comision.chofer_id) {
        if (comision.estado === 'en_curso') {
          return { success: false, error: 'No se puede cambiar el chofer de una comisión que ya se encuentra en viaje.' }
        }

        const [choferRows] = await conn.execute<any>(
          `SELECT id, estado FROM choferes WHERE id = ? AND estado != 'inactivo' LIMIT 1`,
          [dto.choferId]
        )
        if (!choferRows || (choferRows as any[]).length === 0) {
          return { success: false, error: 'El chofer seleccionado no existe o está inactivo.' }
        }
        if ((choferRows as any[])[0].estado === 'licencia') {
          return { success: false, error: 'El chofer seleccionado se encuentra de licencia médica.' }
        }

        nuevoChoferId = dto.choferId
      }

      // Validar fechas
      const salidaStr = dto.fechaSalidaProgramada || comision.fecha_salida_programada
      const regresoStr = dto.fechaRegresoEstimada || comision.fecha_regreso_estimada
      const salida = new Date(salidaStr)
      const regreso = new Date(regresoStr)

      if (isNaN(salida.getTime()) || isNaN(regreso.getTime())) {
        return { success: false, error: 'Las fechas de salida y regreso son inválidas.' }
      }
      if (regreso < salida) {
        return { success: false, error: 'La fecha y hora de regreso estimada no puede ser anterior a la salida.' }
      }

      // Obtener datos del vehículo final (sea el actual o el nuevo)
      const [finalVehRows] = await conn.execute<any>(
        `SELECT id, patente, modelo, estado, odometro_actual, capacidad_pasajeros, fecha_vencimiento_vtv 
         FROM vehiculos WHERE id = ? LIMIT 1`,
        [nuevoVehiculoId]
      )
      const vehFinal = (finalVehRows as any[])[0]
      if (!vehFinal) {
        return { success: false, error: 'Vehículo no encontrado.' }
      }

      // Obtener datos del chofer final (sea el actual o el nuevo)
      const [finalChoferRows] = await conn.execute<any>(
        `SELECT id, nombre, apellido, estado, fecha_vencimiento_licencia 
         FROM choferes WHERE id = ? LIMIT 1`,
        [nuevoChoferId]
      )
      const choferFinal = (finalChoferRows as any[])[0]
      if (!choferFinal) {
        return { success: false, error: 'Chofer no encontrado.' }
      }

      // Validar capacidad de pasajeros
      const nuevaCantidadPasajeros = dto.cantidadPasajeros !== undefined ? Number(dto.cantidadPasajeros) : Number(comision.cantidad_pasajeros)
      const capMax = Number(vehFinal.capacidad_pasajeros) || 5
      if (nuevaCantidadPasajeros > capMax) {
        return {
          success: false,
          error: `Exceso de pasajeros: La unidad ${vehFinal.patente} (${vehFinal.modelo}) tiene capacidad para ${capMax} pasajeros (se indicaron ${nuevaCantidadPasajeros}).`,
        }
      }

      // Validar RTO para la fecha de regreso estimada
      if (vehFinal.fecha_vencimiento_vtv) {
        const vtvDate = new Date(vehFinal.fecha_vencimiento_vtv)
        vtvDate.setHours(23, 59, 59, 999)
        if (vtvDate < regreso) {
          const vtvStr = new Date(vehFinal.fecha_vencimiento_vtv).toLocaleDateString('es-AR')
          return {
            success: false,
            error: `Inhabilitación técnica: El vehículo ${vehFinal.patente} posee su RTO/VTV vencida o vence antes del regreso del viaje (${vtvStr}).`,
          }
        }
      }

      // Validar licencia para la fecha de regreso estimada
      if (choferFinal.fecha_vencimiento_licencia) {
        const licDate = new Date(choferFinal.fecha_vencimiento_licencia)
        licDate.setHours(23, 59, 59, 999)
        if (licDate < regreso) {
          const licStr = new Date(choferFinal.fecha_vencimiento_licencia).toLocaleDateString('es-AR')
          return {
            success: false,
            error: `Inhabilitación legal: El chofer ${choferFinal.apellido}, ${choferFinal.nombre} posee su licencia de conducir vencida o vence antes del regreso (${licStr}).`,
          }
        }
      }

      // Validar conflicto de horario al reprogramar o reasignar
      const conflicto = await verificarConflictoHorario(conn, nuevoVehiculoId, nuevoChoferId, salida, regreso, id)
      if (conflicto.tieneConflicto) {
        return { success: false, error: conflicto.error }
      }

      const formatSqlDatetime = (d: Date) => {
        const pad = (n: number) => String(n).padStart(2, '0')
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
      }

      const nuevoOrigen = dto.origen !== undefined ? dto.origen : comision.origen
      const nuevoDestino = dto.destino !== undefined ? dto.destino : comision.destino
      const nuevoMotivo = dto.motivo !== undefined ? dto.motivo : comision.motivo
      const nuevaDependenciaId = dto.dependenciaId !== undefined ? dto.dependenciaId : comision.dependencia_solicitante_id
      const nuevoSolicitante = dto.solicitanteNombre !== undefined ? dto.solicitanteNombre : comision.solicitante_nombre
      const nuevasObservaciones = dto.observaciones !== undefined ? dto.observaciones : comision.observaciones

      await conn.execute(
        `UPDATE comisiones SET
          vehiculo_id = ?,
          chofer_id = ?,
          dependencia_solicitante_id = ?,
          solicitante_nombre = ?,
          origen = ?,
          destino = ?,
          motivo = ?,
          cantidad_pasajeros = ?,
          fecha_salida_programada = ?,
          fecha_regreso_estimada = ?,
          odometro_salida = ?,
          observaciones = ?
         WHERE id = ?`,
        [
          nuevoVehiculoId,
          nuevoChoferId,
          nuevaDependenciaId,
          nuevoSolicitante,
          nuevoOrigen,
          nuevoDestino,
          nuevoMotivo,
          nuevaCantidadPasajeros,
          formatSqlDatetime(salida),
          formatSqlDatetime(regreso),
          nuevoOdometroSalida,
          nuevasObservaciones,
          id,
        ]
      )

      return { success: true }
    })
  } catch (error: any) {
    console.error('Error al editar comisión en cronogramaService:', error)
    return { success: false, error: error.message || 'Error al persistir cambios de la comisión' }
  }
}

/**
 * Cancela automáticamente los viajes no realizados o abandonados tras haber
 * transcurrido más de 24 horas de la fecha y hora programada sin inicio/cierre.
 * Libera las unidades vehiculares y legajos de chofer a 'disponible' y registra auditoría.
 */
export async function cancelarViajesExpirados24Horas(): Promise<{
  success: boolean
  cancelados: number
  comisionesCanceladas: number[]
}> {
  try {
    return await withTransaction(async (conn) => {
      // 1. Buscar comisiones 'programada' que tengan más de 24 horas pasadas de la fecha_salida_programada
      // Y comisiones 'en_curso' que tengan más de 24 horas pasadas de la fecha_regreso_estimada sin fecha_regreso_real
      const [expiradas] = await conn.execute<any[]>(`
        SELECT c.id, c.codigo_comision, c.vehiculo_id, c.chofer_id, c.estado,
               c.fecha_salida_programada, c.fecha_regreso_estimada, c.observaciones,
               v.estado AS vehiculo_estado, ch.estado AS chofer_estado
        FROM comisiones c
        LEFT JOIN vehiculos v ON c.vehiculo_id = v.id
        LEFT JOIN choferes ch ON c.chofer_id = ch.id
        WHERE 
          (c.estado = 'programada' AND NOW() > DATE_ADD(c.fecha_salida_programada, INTERVAL 24 HOUR))
          OR
          (c.estado = 'en_curso' AND NOW() > DATE_ADD(c.fecha_regreso_estimada, INTERVAL 24 HOUR))
      `)

      if (!expiradas || expiradas.length === 0) {
        return { success: true, cancelados: 0, comisionesCanceladas: [] }
      }

      const idsCancelados: number[] = []

      for (const com of expiradas) {
        const id = Number(com.id)
        idsCancelados.push(id)

        const motivoCancelacion = '[SISTEMA] Viaje no realizado: cancelado automáticamente tras superar las 24 horas del horario programado sin registro de salida/retorno.'
        const obsActualizadas = com.observaciones 
          ? `${com.observaciones}\n${motivoCancelacion}`
          : motivoCancelacion

        // Marcar la comisión como cancelada
        await conn.execute(
          `UPDATE comisiones SET 
            estado = 'cancelada',
            observaciones = ?
           WHERE id = ?`,
          [obsActualizadas, id]
        )

        // Liberar vehículo si estaba afectado a esta comisión
        if (com.vehiculo_id) {
          await conn.execute(
            `UPDATE vehiculos SET estado = 'disponible' WHERE id = ? AND estado = 'en_comision'`,
            [com.vehiculo_id]
          )

          // Registrar auditoría si el vehículo cambió de estado
          await conn.execute(
            `INSERT INTO auditoria_estados_vehiculo (
              vehiculo_id, estado_anterior, estado_nuevo, motivo, comision_id, usuario_id, created_at
            ) VALUES (?, 'en_comision', 'disponible', 'Cancelación automática: viaje no realizado tras 24 hs', ?, NULL, NOW())`,
            [com.vehiculo_id, id]
          )
        }

        // Liberar chofer si estaba en comisión
        if (com.chofer_id) {
          await conn.execute(
            `UPDATE choferes SET estado = 'disponible' WHERE id = ? AND estado = 'en_comision'`,
            [com.chofer_id]
          )
        }
      }

      return {
        success: true,
        cancelados: idsCancelados.length,
        comisionesCanceladas: idsCancelados,
      }
    })
  } catch (error: any) {
    console.error('Error al cancelar comisiones expiradas tras 24 hs:', error)
    return { success: false, cancelados: 0, comisionesCanceladas: [] }
  }
}

