import { query, withTransaction } from '../config/db'
import type {
  ChoferFull,
  ChoferStats,
  ChoferComisionItem,
  ChoferLicenciaItem,
  ChoferDetailComplete,
  ChoferSaveInput,
  ChoferLicenciaSaveInput,
} from '../types/chofer.types'

let choferFotoColChecked = false
async function ensureChoferFotoColumn() {
  if (choferFotoColChecked) return
  choferFotoColChecked = true
  try {
    const cols = await query<any[]>("SHOW COLUMNS FROM choferes LIKE 'foto_url'")
    if (!Array.isArray(cols) || cols.length === 0) {
      await query('ALTER TABLE choferes ADD COLUMN foto_url LONGTEXT NULL AFTER foto_licencia_dorso')
    }
  } catch {}
}

/**
 * 1. KPIs del módulo de Choferes
 */
export async function getChoferesStats(): Promise<ChoferStats> {
  try {
    const [counts] = await query<any[]>(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN estado = 'disponible' THEN 1 ELSE 0 END) AS disponibles,
        SUM(CASE WHEN estado = 'en_comision' THEN 1 ELSE 0 END) AS en_comision,
        SUM(CASE WHEN estado = 'licencia' THEN 1 ELSE 0 END) AS de_licencia,
        SUM(CASE WHEN fecha_vencimiento_licencia <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS licencias_por_vencer
      FROM choferes
      WHERE estado != 'inactivo'
    `)

    const total = Number(counts?.total || 0)
    const disponibles = Number(counts?.disponibles || 0)
    const enComision = Number(counts?.en_comision || 0)
    const deLicencia = Number(counts?.de_licencia || 0)
    const porVencer = Number(counts?.licencias_por_vencer || 0)
    const availablePercent = total > 0 ? Math.round((disponibles / total) * 100) : 0

    return {
      totalDrivers: total,
      availableDrivers: disponibles,
      availablePercent,
      onTravelDrivers: enComision,
      onLeaveDrivers: deLicencia,
      expiringLicenses: porVencer,
    }
  } catch (error) {
    console.error('Error al obtener estadísticas de choferes:', error)
    return {
      totalDrivers: 0,
      availableDrivers: 0,
      availablePercent: 0,
      onTravelDrivers: 0,
      onLeaveDrivers: 0,
      expiringLicenses: 0,
    }
  }
}

/**
 * Helper para mapear una fila de la base de datos al tipo ChoferFull
 */
function mapChoferRowToFull(r: any, includePhotos = false): ChoferFull {
  const vDate = r.fecha_vencimiento_licencia ? new Date(r.fecha_vencimiento_licencia) : null
  const formattedDate = vDate
    ? `${String(vDate.getDate()).padStart(2, '0')}/${String(vDate.getMonth() + 1).padStart(2, '0')}/${vDate.getFullYear()}`
    : 'S/D'

  const dias = Number(r.dias_licencia ?? 999)
  let licenciaStatus: ChoferFull['licenciaStatus'] = 'vigente'
  if (dias < 0) licenciaStatus = 'vencida'
  else if (dias <= 30) licenciaStatus = 'proxima'

  let tone: ChoferFull['tone'] = 'gray'
  let estadoLabel = 'Disponible'
  switch (r.estado) {
    case 'disponible':
      tone = 'green'
      estadoLabel = 'Disponible'
      break
    case 'en_comision':
      tone = 'blue'
      estadoLabel = 'En comisión'
      break
    case 'licencia':
      tone = 'orange'
      estadoLabel = 'De licencia'
      break
    case 'inactivo':
      tone = 'gray'
      estadoLabel = 'Inactivo'
      break
  }

  const iniciales = `${(r.nombre || '').charAt(0)}${(r.apellido || '').charAt(0)}`.toUpperCase()
  const categoriasList = (r.categoria_licencia || '')
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean)

  const tieneFotoDni = Boolean(
    r.tiene_foto_dni_frente ||
    r.tiene_foto_dni_dorso ||
    r.foto_dni_frente ||
    r.foto_dni_dorso
  )
  const tieneFotoLicencia = Boolean(
    r.tiene_foto_licencia_frente ||
    r.tiene_foto_licencia_dorso ||
    r.foto_licencia_frente ||
    r.foto_licencia_dorso
  )

  return {
    id: r.id,
    usuarioId: r.usuario_id,
    nombre: r.nombre,
    apellido: r.apellido,
    nombreCompleto: `${r.apellido}, ${r.nombre}`,
    iniciales: iniciales || 'CH',
    dni: r.dni,
    cuil: r.cuil,
    telefono: r.telefono || 'Sin registrar',
    email: r.email || 'Sin correo',
    direccion: r.direccion || 'San Juan, Argentina',
    fotoDniFrente: includePhotos ? (r.foto_dni_frente || null) : null,
    fotoDniDorso: includePhotos ? (r.foto_dni_dorso || null) : null,
    numeroLicencia: r.numero_licencia,
    categoriaLicencia: r.categoria_licencia,
    categoriasList,
    fechaVencimientoLicencia: r.fecha_vencimiento_licencia ? String(r.fecha_vencimiento_licencia) : '',
    fotoLicenciaFrente: includePhotos ? (r.foto_licencia_frente || null) : null,
    fotoLicenciaDorso: includePhotos ? (r.foto_licencia_dorso || null) : null,
    fotoUrl: r.foto_url || null,
    tieneFotoDni,
    tieneFotoLicencia,
    licenciaFormatted: formattedDate,
    licenciaStatus,
    licenciaDaysRemaining: dias,
    estado: r.estado,
    estadoLabel,
    tone,
    observaciones: r.observaciones,
    totalViajes: Number(r.total_viajes || 0),
    totalKmRecorridos: Number(r.total_km || 0),
  }
}

/**
 * Obtiene un chofer por ID. Por defecto incluye fotos digitalizadas completas.
 */
export async function getChoferById(choferId: number, includePhotos = true): Promise<ChoferFull | null> {
  try {
    await ensureChoferFotoColumn()
    const rows = await query<any[]>(`
      SELECT 
        c.id,
        c.usuario_id,
        c.nombre,
        c.apellido,
        c.dni,
        c.cuil,
        c.telefono,
        c.email,
        c.direccion,
        c.foto_url,
        ${includePhotos ? 'c.foto_dni_frente, c.foto_dni_dorso, c.foto_licencia_frente, c.foto_licencia_dorso,' : ''}
        (c.foto_dni_frente IS NOT NULL AND c.foto_dni_frente != '') AS tiene_foto_dni_frente,
        (c.foto_dni_dorso IS NOT NULL AND c.foto_dni_dorso != '') AS tiene_foto_dni_dorso,
        (c.foto_licencia_frente IS NOT NULL AND c.foto_licencia_frente != '') AS tiene_foto_licencia_frente,
        (c.foto_licencia_dorso IS NOT NULL AND c.foto_licencia_dorso != '') AS tiene_foto_licencia_dorso,
        c.numero_licencia,
        c.categoria_licencia,
        c.fecha_vencimiento_licencia,
        DATEDIFF(c.fecha_vencimiento_licencia, CURDATE()) AS dias_licencia,
        c.estado,
        c.observaciones,
        (SELECT COUNT(*) FROM comisiones com WHERE com.chofer_id = c.id) AS total_viajes,
        (SELECT COALESCE(SUM(com.odometro_regreso - com.odometro_salida), 0) 
         FROM comisiones com 
         WHERE com.chofer_id = c.id AND com.odometro_regreso > com.odometro_salida) AS total_km
      FROM choferes c
      WHERE c.id = ?
      LIMIT 1
    `, [choferId])

    if (!rows || rows.length === 0) return null
    return mapChoferRowToFull(rows[0], includePhotos)
  } catch (error) {
    console.error('Error al obtener chofer por ID:', error)
    return null
  }
}

/**
 * 2. Lista completa de choferes optimizada: excluye cadenas pesadas en base64 de fotos de documentos pero incluye foto_url de portada/perfil
 */
export async function getChoferesFullList(): Promise<ChoferFull[]> {
  try {
    await ensureChoferFotoColumn()
    const rows = await query<any[]>(`
      SELECT 
        c.id,
        c.usuario_id,
        c.nombre,
        c.apellido,
        c.dni,
        c.cuil,
        c.telefono,
        c.email,
        c.direccion,
        c.foto_url,
        (c.foto_dni_frente IS NOT NULL AND c.foto_dni_frente != '') AS tiene_foto_dni_frente,
        (c.foto_dni_dorso IS NOT NULL AND c.foto_dni_dorso != '') AS tiene_foto_dni_dorso,
        (c.foto_licencia_frente IS NOT NULL AND c.foto_licencia_frente != '') AS tiene_foto_licencia_frente,
        (c.foto_licencia_dorso IS NOT NULL AND c.foto_licencia_dorso != '') AS tiene_foto_licencia_dorso,
        c.numero_licencia,
        c.categoria_licencia,
        c.fecha_vencimiento_licencia,
        DATEDIFF(c.fecha_vencimiento_licencia, CURDATE()) AS dias_licencia,
        c.estado,
        c.observaciones,
        (SELECT COUNT(*) FROM comisiones com WHERE com.chofer_id = c.id) AS total_viajes,
        (SELECT COALESCE(SUM(com.odometro_regreso - com.odometro_salida), 0) 
         FROM comisiones com 
         WHERE com.chofer_id = c.id AND com.odometro_regreso > com.odometro_salida) AS total_km
      FROM choferes c
      WHERE c.estado != 'inactivo'
      ORDER BY c.apellido ASC, c.nombre ASC
    `)

    return rows.map((r) => mapChoferRowToFull(r, false))
  } catch (error) {
    console.error('Error al obtener lista de choferes:', error)
    return []
  }
}

/**
 * 3. Detalle 360° de un Chofer (Ficha con fotos digitalizadas, historial de viajes y registro de licencias laborales)
 */
export async function getChoferDetailWithHistory(choferId: number): Promise<ChoferDetailComplete> {
  try {
    const chofer = await getChoferById(choferId, true)

    // Historial de viajes / comisiones
    const rawComisiones = await query<any[]>(`
      SELECT 
        c.id,
        c.codigo_comision,
        c.destino,
        d.nombre AS dependencia,
        CONCAT(v.marca, ' ', v.modelo) AS vehiculo,
        v.patente,
        c.fecha_salida_real,
        c.fecha_salida_programada,
        c.fecha_regreso_real,
        c.odometro_salida,
        c.odometro_regreso,
        c.estado
      FROM comisiones c
      JOIN dependencias d ON c.dependencia_solicitante_id = d.id
      JOIN vehiculos v ON c.vehiculo_id = v.id
      WHERE c.chofer_id = ?
      ORDER BY c.fecha_salida_programada DESC
    `, [choferId])

    const comisiones: ChoferComisionItem[] = rawComisiones.map((c) => {
      const salida = c.fecha_salida_real ? new Date(c.fecha_salida_real) : new Date(c.fecha_salida_programada)
      const fechaSalida = `${String(salida.getDate()).padStart(2, '0')}/${String(salida.getMonth() + 1).padStart(2, '0')}/${salida.getFullYear()} ${String(salida.getHours()).padStart(2, '0')}:${String(salida.getMinutes()).padStart(2, '0')}`

      let kmRecorridos = 'En curso'
      if (c.odometro_salida && c.odometro_regreso) {
        kmRecorridos = `${Number(c.odometro_regreso - c.odometro_salida).toLocaleString('es-AR')} km`
      } else if (c.odometro_salida) {
        kmRecorridos = `Salida: ${Number(c.odometro_salida).toLocaleString('es-AR')} km`
      }

      let estadoTone: ChoferComisionItem['estadoTone'] = 'blue'
      let estadoLabel = 'En curso'
      if (c.estado === 'finalizada') {
        estadoTone = 'green'
        estadoLabel = 'Finalizada'
      } else if (c.estado === 'cancelada') {
        estadoTone = 'gray'
        estadoLabel = 'Cancelada'
      } else if (c.estado === 'programada') {
        estadoTone = 'orange'
        estadoLabel = 'Programada'
      }

      return {
        id: c.id,
        codigo: c.codigo_comision,
        destino: c.destino,
        area: c.dependencia,
        vehiculo: c.vehiculo,
        patente: c.patente,
        fechaSalida,
        fechaRegreso: c.fecha_regreso_real ? String(c.fecha_regreso_real) : null,
        kmRecorridos,
        estado: estadoLabel,
        estadoTone,
      }
    })

    // Historial de licencias y ausencias laborales
    let rawLicencias: any[] = []
    try {
      rawLicencias = await query<any[]>(`
        SELECT 
          l.id,
          l.chofer_id,
          l.tipo,
          l.fecha_inicio,
          l.fecha_fin,
          l.dias_habiles,
          l.motivo,
          l.estado,
          CONCAT(u.nombre, ' ', u.apellido) AS aprobado_por,
          l.observaciones
        FROM licencias_chofer l
        LEFT JOIN usuarios u ON l.aprobado_por_id = u.id
        WHERE l.chofer_id = ?
        ORDER BY l.fecha_inicio DESC
      `, [choferId])
    } catch (e) {
      console.warn('Tabla licencias_chofer no disponible todavía:', e)
    }

    const licencias: ChoferLicenciaItem[] = rawLicencias.map((l) => {
      let tipoLabel = 'Otra'
      switch (l.tipo) {
        case 'vacaciones': tipoLabel = 'Vacaciones'; break
        case 'enfermedad': tipoLabel = 'Enfermedad'; break
        case 'particular': tipoLabel = 'Asunto Particular'; break
        case 'capacitacion': tipoLabel = 'Capacitación'; break
        case 'franco_compensatorio': tipoLabel = 'Franco Compensatorio'; break
      }

      let estadoLabel = 'Pendiente'
      switch (l.estado) {
        case 'aprobada': estadoLabel = 'Aprobada'; break
        case 'rechazada': estadoLabel = 'Rechazada'; break
        case 'cancelada': estadoLabel = 'Cancelada'; break
      }

      const dIni = new Date(l.fecha_inicio)
      const dFin = new Date(l.fecha_fin)
      const fIni = `${String(dIni.getDate()).padStart(2, '0')}/${String(dIni.getMonth() + 1).padStart(2, '0')}/${dIni.getFullYear()}`
      const fFin = `${String(dFin.getDate()).padStart(2, '0')}/${String(dFin.getMonth() + 1).padStart(2, '0')}/${dFin.getFullYear()}`

      return {
        id: l.id,
        choferId: l.chofer_id,
        tipo: l.tipo,
        tipoLabel,
        fechaInicio: fIni,
        fechaFin: fFin,
        diasHabiles: Number(l.dias_habiles || 1),
        motivo: l.motivo,
        estado: l.estado,
        estadoLabel,
        aprobadoPor: l.aprobado_por || 'Dirección de Movilidades',
        observaciones: l.observaciones,
      }
    })

    // Resumen de días acumulados por tipo
    const diasConsumidos = {
      vacaciones: 0,
      enfermedad: 0,
      compensatorio: 0,
      otros: 0,
    }

    licencias.forEach((lic) => {
      if (lic.estado === 'aprobada') {
        if (lic.tipo === 'vacaciones') diasConsumidos.vacaciones += lic.diasHabiles
        else if (lic.tipo === 'enfermedad') diasConsumidos.enfermedad += lic.diasHabiles
        else if (lic.tipo === 'franco_compensatorio') diasConsumidos.compensatorio += lic.diasHabiles
        else diasConsumidos.otros += lic.diasHabiles
      }
    })

    return {
      chofer,
      comisiones,
      licencias,
      diasLicenciaConsumidos: diasConsumidos,
    }
  } catch (error) {
    console.error('Error al obtener detalle e historial de chofer:', error)
    return {
      chofer: null,
      comisiones: [],
      licencias: [],
      diasLicenciaConsumidos: { vacaciones: 0, enfermedad: 0, compensatorio: 0, otros: 0 },
    }
  }
}

/**
 * 4. Alta y modificación de Chofer (INSERT / UPDATE)
 */
export async function saveChofer(data: ChoferSaveInput): Promise<{ success: boolean; id?: number; error?: string }> {
  try {
    try {
      const cols = await query<any[]>("SHOW COLUMNS FROM choferes LIKE 'foto_url'")
      if (!Array.isArray(cols) || cols.length === 0) {
        await query('ALTER TABLE choferes ADD COLUMN foto_url LONGTEXT NULL AFTER foto_licencia_dorso')
      }
    } catch {}

    if (data.id) {
      await query(`
        UPDATE choferes SET
          nombre = ?,
          apellido = ?,
          dni = ?,
          cuil = ?,
          telefono = ?,
          email = ?,
          direccion = ?,
          foto_dni_frente = COALESCE(?, foto_dni_frente),
          foto_dni_dorso = COALESCE(?, foto_dni_dorso),
          numero_licencia = ?,
          categoria_licencia = ?,
          fecha_vencimiento_licencia = ?,
          foto_licencia_frente = COALESCE(?, foto_licencia_frente),
          foto_licencia_dorso = COALESCE(?, foto_licencia_dorso),
          foto_url = ?,
          estado = COALESCE(?, estado),
          observaciones = ?
        WHERE id = ?
      `, [
        data.nombre.trim(),
        data.apellido.trim(),
        data.dni.trim(),
        data.cuil?.trim() || null,
        data.telefono?.trim() || null,
        data.email?.trim() || null,
        data.direccion?.trim() || null,
        data.fotoDniFrente || null,
        data.fotoDniDorso || null,
        data.numeroLicencia.trim().toUpperCase(),
        data.categoriaLicencia.trim().toUpperCase(),
        data.fechaVencimientoLicencia,
        data.fotoLicenciaFrente || null,
        data.fotoLicenciaDorso || null,
        data.fotoUrl || null,
        data.estado || 'disponible',
        data.observaciones || null,
        data.id,
      ])
      return { success: true, id: data.id }
    } else {
      const result = await query<any>(`
        INSERT INTO choferes (
          nombre, apellido, dni, cuil, telefono, email, direccion,
          foto_dni_frente, foto_dni_dorso,
          numero_licencia, categoria_licencia, fecha_vencimiento_licencia,
          foto_licencia_frente, foto_licencia_dorso, foto_url,
          estado, observaciones
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        data.nombre.trim(),
        data.apellido.trim(),
        data.dni.trim(),
        data.cuil?.trim() || null,
        data.telefono?.trim() || null,
        data.email?.trim() || null,
        data.direccion?.trim() || null,
        data.fotoDniFrente || null,
        data.fotoDniDorso || null,
        data.numeroLicencia.trim().toUpperCase(),
        data.categoriaLicencia.trim().toUpperCase(),
        data.fechaVencimientoLicencia,
        data.fotoLicenciaFrente || null,
        data.fotoLicenciaDorso || null,
        data.fotoUrl || null,
        data.estado || 'disponible',
        data.observaciones || null,
      ])
      return { success: true, id: result.insertId }
    }
  } catch (error: any) {
    console.error('Error al persistir chofer:', error)
    return { success: false, error: error.message || 'Error al guardar en base de datos' }
  }
}

/**
 * 5. Registro de Licencia / Ausencia laboral
 */
export async function saveChoferLicencia(data: ChoferLicenciaSaveInput): Promise<{ success: boolean; id?: number; error?: string }> {
  try {
    // Cálculo automático de días hábiles estimados si no se proveen
    let diasHabiles = data.diasHabiles
    if (!diasHabiles) {
      const start = new Date(data.fechaInicio)
      const end = new Date(data.fechaFin)
      const diffTime = Math.abs(end.getTime() - start.getTime())
      diasHabiles = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1)
    }

    const newId = await withTransaction(async (conn) => {
      const [result] = await conn.execute<any>(`
        INSERT INTO licencias_chofer (
          chofer_id, tipo, fecha_inicio, fecha_fin, dias_habiles,
          motivo, estado, aprobado_por_id, observaciones
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        data.choferId,
        data.tipo,
        data.fechaInicio,
        data.fechaFin,
        diasHabiles,
        data.motivo || null,
        data.estado || 'aprobada',
        data.aprobadoPorId || 1, // Admin implícito
        data.observaciones || null,
      ])

      const insertId = result.insertId

      // Si la licencia es aprobada y está vigente hoy, actualizar el estado del chofer a 'licencia'
      if (data.estado === 'aprobada') {
        const hoy = new Date().toISOString().split('T')[0]
        if (data.fechaInicio <= hoy && data.fechaFin >= hoy) {
          await conn.execute('UPDATE choferes SET estado = "licencia" WHERE id = ?', [data.choferId])
        }
      }

      return insertId
    })

    return { success: true, id: newId }
  } catch (error: any) {
    console.error('Error al registrar licencia del chofer:', error)
    return { success: false, error: error.message || 'Error al registrar licencia' }
  }
}
