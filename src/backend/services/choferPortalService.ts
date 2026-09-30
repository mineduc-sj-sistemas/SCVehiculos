import { pool, query } from '../config/db'

export interface CheckinParadaDTO {
  comisionId: number
  choferId: number
  paradaIndex: number
  destinoNombre: string
  latitud?: number
  longitud?: number
  precisionGps?: number
  observaciones?: string
}

export interface CheckinItem {
  id: number
  comisionId: number
  choferId: number
  paradaIndex: number
  destinoNombre: string
  latitud: number | null
  longitud: number | null
  precisionGps: number | null
  observaciones: string | null
  fechaHora: string
}

export interface ParadaItinerario {
  index: number
  nombre: string
  visitada: boolean
  checkin?: CheckinItem
}

/**
 * Obtiene los datos del chofer y su comisión activa/asignada
 */
export async function getMiViajeActivo(
  usuarioId: number,
  choferIdOverride?: number
): Promise<{
  success: boolean
  chofer?: any
  viajeActivo?: any
  paradas?: ParadaItinerario[]
  checkins?: CheckinItem[]
  historial?: any[]
  error?: string
}> {
  try {
    let choferId = choferIdOverride

    // Si no se pasó override, buscar el chofer asociado al usuario
    if (!choferId) {
      const choferRows = await query<any>(
        `SELECT id, usuario_id, nombre, apellido, dni, numero_licencia, categoria_licencia, 
                fecha_vencimiento_licencia, estado, foto_licencia_frente 
         FROM choferes WHERE usuario_id = ? LIMIT 1`,
        [usuarioId]
      )

      if (!choferRows || choferRows.length === 0) {
        // Fallback: si es admin/operador y no está vinculado, tomar el primer chofer disponible
        const fallbackRows = await query<any>(
          `SELECT id, usuario_id, nombre, apellido, dni, numero_licencia, categoria_licencia, 
                  fecha_vencimiento_licencia, estado, foto_licencia_frente 
           FROM choferes LIMIT 1`
        )
        if (!fallbackRows || fallbackRows.length === 0) {
          return { success: false, error: 'No se encontraron choferes registrados en el sistema.' }
        }
        choferId = fallbackRows[0].id
      } else {
        choferId = choferRows[0].id
      }
    }

    const [choferData] = await query<any>(
      `SELECT id, usuario_id, nombre, apellido, dni, numero_licencia, categoria_licencia, 
              fecha_vencimiento_licencia, estado, foto_licencia_frente 
       FROM choferes WHERE id = ? LIMIT 1`,
      [choferId]
    )

    if (!choferData) {
      return { success: false, error: 'Chofer no encontrado.' }
    }

    // Buscar comisión activa o programada
    const viajesRows = await query<any>(
      `SELECT c.id, c.codigo_comision, c.vehiculo_id, c.chofer_id, c.dependencia_solicitante_id,
              c.solicitante_nombre, c.origen, c.destino, c.motivo, c.cantidad_pasajeros,
              c.fecha_salida_programada, c.fecha_salida_real, c.fecha_regreso_estimada, c.fecha_regreso_real,
              c.odometro_salida, c.odometro_regreso, c.estado, c.observaciones,
              v.patente AS vehiculo_patente, v.marca AS vehiculo_marca, v.modelo AS vehiculo_modelo,
              v.tipo_combustible AS vehiculo_combustible, v.capacidad_pasajeros AS vehiculo_capacidad,
              v.odometro_actual AS vehiculo_odometro, v.foto_url AS vehiculo_foto,
              d.nombre AS dependencia_nombre
       FROM comisiones c
       JOIN vehiculos v ON c.vehiculo_id = v.id
       JOIN dependencias d ON c.dependencia_solicitante_id = d.id
       WHERE c.chofer_id = ? AND c.estado IN ('en_curso', 'programada')
       ORDER BY CASE WHEN c.estado = 'en_curso' THEN 1 ELSE 2 END, c.fecha_salida_programada ASC
       LIMIT 1`,
      [choferId]
    )

    let viajeActivo = viajesRows && viajesRows.length > 0 ? viajesRows[0] : null
    let paradas: ParadaItinerario[] = []
    let checkins: CheckinItem[] = []

    if (viajeActivo) {
      viajeActivo.codigoComision = viajeActivo.codigo_comision
      viajeActivo.vehiculoPatente = viajeActivo.vehiculo_patente
      viajeActivo.vehiculoModelo = viajeActivo.vehiculo_modelo
      viajeActivo.vehiculoMarca = viajeActivo.vehiculo_marca
      viajeActivo.dependenciaNombre = viajeActivo.dependencia_nombre

      // Buscar check-ins registrados para esta comisión
      const checkinRows = await query<any>(
        `SELECT id, comision_id AS comisionId, chofer_id AS choferId, parada_index AS paradaIndex,
                destino_nombre AS destinoNombre, latitud, longitud, precision_gps AS precisionGps,
                observaciones, fecha_hora AS fechaHora
         FROM checkins_comision
         WHERE comision_id = ?
         ORDER BY parada_index ASC, fecha_hora ASC`,
        [viajeActivo.id]
      )
      checkins = checkinRows || []

      // Desglosar paradas del itinerario
      const destinosArray = viajeActivo.destino ? viajeActivo.destino.split(' // ') : []
      paradas = destinosArray.map((dest: string, idx: number) => {
        const paradaNum = idx + 1
        const chk = checkins.find((c) => c.paradaIndex === paradaNum)
        return {
          index: paradaNum,
          nombre: dest.trim(),
          visitada: !!chk,
          checkin: chk,
        }
      })
    }

    // Historial reciente de viajes finalizados
    const historialRows = await query<any>(
      `SELECT c.id, c.codigo_comision, c.destino, c.fecha_salida_programada, c.fecha_salida_real,
              c.fecha_regreso_real, c.odometro_salida, c.odometro_regreso, c.estado,
              v.patente AS vehiculo_patente, v.modelo AS vehiculo_modelo
       FROM comisiones c
       JOIN vehiculos v ON c.vehiculo_id = v.id
       WHERE c.chofer_id = ? AND c.estado IN ('finalizada', 'cancelada')
       ORDER BY c.id DESC LIMIT 5`,
      [choferId]
    )

    return {
      success: true,
      chofer: choferData,
      viajeActivo,
      paradas,
      checkins,
      historial: historialRows || [],
    }
  } catch (error: any) {
    console.error('Error en getMiViajeActivo:', error)
    return { success: false, error: error.message || 'Error al obtener viaje activo del chofer' }
  }
}

/**
 * Registra un check-in de parada con coordenadas GPS opcionales
 */
export async function registrarCheckinParada(dto: CheckinParadaDTO): Promise<{
  success: boolean
  id?: number
  fechaHora?: string
  error?: string
}> {
  try {
    // Validar existencia de la comisión
    const [comision] = await query<any>(
      `SELECT id, chofer_id, estado, destino FROM comisiones WHERE id = ? LIMIT 1`,
      [dto.comisionId]
    )

    if (!comision) {
      return { success: false, error: 'Comisión no encontrada.' }
    }

    if (comision.estado !== 'en_curso') {
      return {
        success: false,
        error: 'Solo se pueden registrar arribos y check-ins cuando la comisión se encuentra "En Curso".',
      }
    }

    const [res] = await pool.execute<any>(
      `INSERT INTO checkins_comision (
        comision_id, chofer_id, parada_index, destino_nombre, latitud, longitud, precision_gps, observaciones, fecha_hora
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        dto.comisionId,
        dto.choferId,
        dto.paradaIndex,
        dto.destinoNombre.slice(0, 255),
        dto.latitud ?? null,
        dto.longitud ?? null,
        dto.precisionGps ?? null,
        dto.observaciones ? dto.observaciones.slice(0, 255) : null,
      ]
    )

    const insertId = res.insertId
    const [inserted] = await query<any>(`SELECT fecha_hora FROM checkins_comision WHERE id = ?`, [insertId])

    return {
      success: true,
      id: insertId,
      fechaHora: inserted?.fecha_hora,
    }
  } catch (error: any) {
    console.error('Error al registrar checkin:', error)
    return { success: false, error: error.message || 'Error al registrar arribo' }
  }
}

/**
 * Obtiene la lista liviana de choferes para el selector administrativo
 */
export async function getChoferesParaSelector(): Promise<Array<{ id: number; nombreCompleto: string; dni: string; estado: string }>> {
  try {
    const rows = await query<any>(
      `SELECT id, CONCAT(apellido, ', ', nombre) AS nombreCompleto, dni, estado 
       FROM choferes 
       ORDER BY apellido ASC, nombre ASC`
    )
    return rows || []
  } catch (error) {
    return []
  }
}
