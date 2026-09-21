import { query, withTransaction } from '../config/db'
import type {
  ActualizarEstadoComisionDTO,
  ComisionGridItem,
  CronogramaDiaHeader,
  CronogramaSemanalData,
  CronogramaStats,
  CronogramaVehiculoRow,
  DatosAuxiliaresDespacho,
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
 * Registra y despacha una nueva comisión en el cronograma
 */
export async function crearComision(dto: NuevaComisionDTO): Promise<{ success: boolean; id?: number; codigoComision?: string; error?: string }> {
  try {
    // Validar existencia de vehículo
    const vehiculo = await query<any>(`SELECT id, estado, odometro_actual FROM vehiculos WHERE id = ? LIMIT 1`, [dto.vehiculoId])
    if (!vehiculo || vehiculo.length === 0) {
      return { success: false, error: 'El vehículo seleccionado no existe.' }
    }
    if (vehiculo[0].estado === 'en_taller') {
      return { success: false, error: 'El vehículo se encuentra en taller o mantenimiento y no puede ser asignado.' }
    }

    // Validar existencia de chofer
    const chofer = await query<any>(`SELECT id, estado FROM choferes WHERE id = ? LIMIT 1`, [dto.choferId])
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

      // Obtener estado actual del vehículo para auditoría
      const [vehRows] = await conn.execute<any>(`SELECT estado FROM vehiculos WHERE id = ?`, [comision.vehiculo_id])
      const estadoAnteriorVehiculo = (vehRows as any[])[0]?.estado || 'disponible'

      if (dto.estado === 'en_curso') {
        // Registrar salida real
        const odoSalida = dto.odometroSalida ?? comision.odometro_salida
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
