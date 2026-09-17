import { query } from '../config/db'
import type { FleetItem } from '../types/dashboard.types'
import type {
  VehicleFull,
  VehicleHistoryItem,
  VehicleTravelItem,
  VehicleFuelItem,
  VehicleDetailComplete,
  VehicleType,
  Dependencia,
  VehicleSaveInput,
} from '../types/vehicle.types'

/**
 * Lista resumida de unidades de la flota (para vistas generales)
 */
export async function getFleet(): Promise<FleetItem[]> {
  try {
    const rows = await query<any[]>(`
      SELECT 
        v.id,
        v.patente AS plate,
        CONCAT(v.marca, ' ', v.modelo) AS vehicle,
        t.nombre AS type,
        v.odometro_actual AS raw_km,
        v.fecha_vencimiento_vtv AS raw_vtv,
        v.estado
      FROM vehiculos v
      JOIN tipos_vehiculo t ON v.tipo_vehiculo_id = t.id
      WHERE v.activo = 1
      ORDER BY v.id ASC
    `)

    return rows.map((r) => {
      const vtvDate = r.raw_vtv ? new Date(r.raw_vtv) : null
      const formattedVtv = vtvDate
        ? `${String(vtvDate.getDate()).padStart(2, '0')}/${String(vtvDate.getMonth() + 1).padStart(2, '0')}/${vtvDate.getFullYear()}`
        : 'S/D'

      const formattedKm = `${Number(r.raw_km || 0).toLocaleString('es-AR')} km`

      let tone: FleetItem['tone'] = 'gray'
      let statusLabel = 'Desconocido'

      switch (r.estado) {
        case 'disponible':
          tone = 'green'
          statusLabel = 'Disponible'
          break
        case 'en_comision':
          tone = 'blue'
          statusLabel = 'En comisión'
          break
        case 'en_taller':
          tone = 'orange'
          statusLabel = 'En taller'
          break
        case 'baja':
          tone = 'gray'
          statusLabel = 'Baja'
          break
      }

      return {
        id: r.id,
        plate: r.plate,
        vehicle: r.vehicle,
        type: r.type,
        km: formattedKm,
        vtv: formattedVtv,
        status: statusLabel,
        tone,
      }
    })
  } catch (error) {
    console.error('Error al obtener flota:', error)
    return []
  }
}

/**
 * Lista completa de vehículos con relaciones a dependencias y documentación oficial
 */
export async function getVehiclesFullList(): Promise<VehicleFull[]> {
  try {
    const rows = await query<any[]>(`
      SELECT 
        v.id,
        v.patente,
        v.tipo_vehiculo_id AS tipo_id,
        t.nombre AS tipo_nombre,
        v.dependencia_id,
        COALESCE(d.nombre, 'Sin asignar') AS dependencia_nombre,
        v.marca,
        v.modelo,
        v.version,
        v.anio,
        v.numero_chasis,
        v.numero_motor,
        v.numero_cedula,
        v.fecha_vencimiento_cedula,
        v.numero_rto,
        v.tipo_combustible,
        v.capacidad_tanque_litros,
        v.capacidad_pasajeros,
        v.odometro_actual,
        v.fecha_vencimiento_vtv,
        DATEDIFF(v.fecha_vencimiento_vtv, CURDATE()) AS dias_vtv,
        v.compania_seguro,
        v.numero_poliza,
        v.fecha_vencimiento_seguro,
        v.estado,
        v.observaciones
      FROM vehiculos v
      JOIN tipos_vehiculo t ON v.tipo_vehiculo_id = t.id
      LEFT JOIN dependencias d ON v.dependencia_id = d.id
      WHERE v.activo = 1
      ORDER BY v.id ASC
    `)

    return rows.map((r) => {
      const vtvDate = r.fecha_vencimiento_vtv ? new Date(r.fecha_vencimiento_vtv) : null
      const vtvFormatted = vtvDate
        ? `${String(vtvDate.getDate()).padStart(2, '0')}/${String(vtvDate.getMonth() + 1).padStart(2, '0')}/${vtvDate.getFullYear()}`
        : 'S/D'

      const diasVtv = Number(r.dias_vtv ?? 999)
      let vtvStatus: 'vigente' | 'proxima' | 'vencida' = 'vigente'
      if (diasVtv < 0) vtvStatus = 'vencida'
      else if (diasVtv <= 30) vtvStatus = 'proxima'

      let tone: VehicleFull['tone'] = 'gray'
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
        case 'en_taller':
          tone = 'orange'
          estadoLabel = 'En taller'
          break
        case 'baja':
          tone = 'gray'
          estadoLabel = 'Baja'
          break
      }

      let tipoCombustibleLabel = r.tipo_combustible || 'Diésel'
      switch (r.tipo_combustible) {
        case 'diesel_grado_3':
          tipoCombustibleLabel = 'Diésel Grado 3 (Premium)'
          break
        case 'diesel_500':
          tipoCombustibleLabel = 'Diésel 500'
          break
        case 'nafta_super':
          tipoCombustibleLabel = 'Nafta Súper'
          break
        case 'nafta_premium':
          tipoCombustibleLabel = 'Nafta Premium'
          break
        case 'gnc':
          tipoCombustibleLabel = 'GNC'
          break
      }

      return {
        id: r.id,
        patente: r.patente,
        tipoId: r.tipo_id,
        tipoNombre: r.tipo_nombre,
        dependenciaId: r.dependencia_id,
        dependenciaNombre: r.dependencia_nombre,
        marca: r.marca,
        modelo: r.modelo,
        version: r.version,
        anio: r.anio,
        numeroChasis: r.numero_chasis,
        numeroMotor: r.numero_motor,
        numeroCedula: r.numero_cedula || 'CV-S/D',
        fechaVencimientoCedula: r.fecha_vencimiento_cedula ? String(r.fecha_vencimiento_cedula) : null,
        numeroRto: r.numero_rto || 'RTO-S/D',
        tipoCombustible: r.tipo_combustible,
        tipoCombustibleLabel,
        capacidadTanqueLitros: r.capacidad_tanque_litros ? Number(r.capacidad_tanque_litros) : null,
        capacidadPasajeros: Number(r.capacidad_pasajeros || 5),
        odometroActual: Number(r.odometro_actual || 0),
        odometroFormatted: `${Number(r.odometro_actual || 0).toLocaleString('es-AR')} km`,
        fechaVencimientoVtv: r.fecha_vencimiento_vtv ? String(r.fecha_vencimiento_vtv) : '',
        vtvFormatted,
        vtvStatus,
        vtvDaysRemaining: diasVtv,
        companiaSeguro: r.compania_seguro || 'Nación Seguros',
        numeroPoliza: r.numero_poliza || 'S/D',
        fechaVencimientoSeguro: r.fecha_vencimiento_seguro ? String(r.fecha_vencimiento_seguro) : null,
        estado: r.estado,
        estadoLabel,
        tone,
        observaciones: r.observaciones,
      }
    })
  } catch (error) {
    console.error('Error al obtener lista completa de vehículos:', error)
    return []
  }
}

/**
 * Ficha técnica 360° de un vehículo: datos, historial mecánico, comisiones y combustible
 */
export async function getVehicleDetailWithHistory(vehicleId: number): Promise<VehicleDetailComplete> {
  try {
    const vehicles = await getVehiclesFullList()
    const vehicle = vehicles.find((v) => v.id === vehicleId) || null

    // Historial mecánico
    const rawMantenimientos = await query<any[]>(
      `
      SELECT 
        m.id,
        m.tipo,
        m.titulo,
        m.taller_proveedor,
        m.odometro_servicio,
        m.fecha_programada,
        m.fecha_ingreso,
        m.costo_total,
        m.estado,
        m.detalle_trabajos
      FROM mantenimientos m
      WHERE m.vehiculo_id = ?
      ORDER BY m.fecha_programada DESC
    `,
      [vehicleId]
    )

    const mantenimientos: VehicleHistoryItem[] = rawMantenimientos.map((m) => {
      const d = m.fecha_ingreso ? new Date(m.fecha_ingreso) : new Date(m.fecha_programada)
      const fecha = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
      return {
        id: m.id,
        tipo: m.tipo === 'preventivo' ? 'Preventivo' : 'Correctivo',
        titulo: m.titulo,
        taller: m.taller_proveedor || 'Taller Central',
        odometro: `${Number(m.odometro_servicio || 0).toLocaleString('es-AR')} km`,
        fecha,
        costoTotal: `$ ${Number(m.costo_total || 0).toLocaleString('es-AR')}`,
        estado: m.estado === 'en_curso' ? 'En taller' : m.estado === 'completado' ? 'Finalizado' : 'Programado',
        detalle: m.detalle_trabajos,
      }
    })

    // Historial de viajes / comisiones
    const rawViajes = await query<any[]>(
      `
      SELECT 
        c.id,
        c.codigo_comision,
        c.destino,
        d.nombre AS dependencia,
        CONCAT(ch.nombre, ' ', ch.apellido) AS chofer,
        c.fecha_salida_real,
        c.fecha_salida_programada,
        c.fecha_regreso_real,
        c.odometro_salida,
        c.odometro_regreso,
        c.estado
      FROM comisiones c
      JOIN dependencias d ON c.dependencia_solicitante_id = d.id
      JOIN choferes ch ON c.chofer_id = ch.id
      WHERE c.vehiculo_id = ?
      ORDER BY c.fecha_salida_programada DESC
    `,
      [vehicleId]
    )

    const viajes: VehicleTravelItem[] = rawViajes.map((v) => {
      const salida = v.fecha_salida_real ? new Date(v.fecha_salida_real) : new Date(v.fecha_salida_programada)
      const fechaSalida = `${String(salida.getDate()).padStart(2, '0')}/${String(salida.getMonth() + 1).padStart(2, '0')} ${String(salida.getHours()).padStart(2, '0')}:${String(salida.getMinutes()).padStart(2, '0')}`

      let kmRecorridos = 'En curso'
      if (v.odometro_salida && v.odometro_regreso) {
        kmRecorridos = `${Number(v.odometro_regreso - v.odometro_salida).toLocaleString('es-AR')} km`
      } else if (v.odometro_salida) {
        kmRecorridos = `Salida: ${Number(v.odometro_salida).toLocaleString('es-AR')} km`
      }

      return {
        id: v.id,
        codigo: v.codigo_comision,
        destino: v.destino,
        area: v.dependencia,
        chofer: v.chofer,
        fechaSalida,
        fechaRegreso: v.fecha_regreso_real ? String(v.fecha_regreso_real) : null,
        kmRecorridos,
        estado: v.estado === 'en_curso' ? 'En viaje' : v.estado === 'finalizada' ? 'Completado' : 'Programado',
      }
    })

    // Historial de combustible
    const rawCombustible = await query<any[]>(
      `
      SELECT 
        id,
        fecha_carga,
        litros,
        importe_total,
        odometro_carga,
        estacion_servicio,
        rendimiento_km_l
      FROM cargas_combustible
      WHERE vehiculo_id = ?
      ORDER BY fecha_carga DESC
    `,
      [vehicleId]
    )

    const combustible: VehicleFuelItem[] = rawCombustible.map((c) => {
      const d = new Date(c.fecha_carga)
      const fecha = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
      return {
        id: c.id,
        fecha,
        litros: `${Number(c.litros).toFixed(1)} L`,
        importe: `$ ${Number(c.importe_total).toLocaleString('es-AR')}`,
        odometro: `${Number(c.odometro_carga).toLocaleString('es-AR')} km`,
        estacion: c.estacion_servicio || 'Estación Oficial',
        rendimiento: c.rendimiento_km_l ? `${Number(c.rendimiento_km_l).toFixed(1)} km/L` : '—',
      }
    })

    return {
      vehicle,
      mantenimientos,
      viajes,
      cargasCombustible: combustible,
    }
  } catch (error) {
    console.error('Error al obtener detalle e historial del vehículo:', error)
    return {
      vehicle: null,
      mantenimientos: [],
      viajes: [],
      cargasCombustible: [],
    }
  }
}

/**
 * Catálogo de tipos de vehículo
 */
export async function getVehicleTypes(): Promise<VehicleType[]> {
  try {
    return await query<VehicleType[]>('SELECT id, nombre FROM tipos_vehiculo ORDER BY nombre ASC')
  } catch (error) {
    console.error('Error al obtener tipos de vehículo:', error)
    return []
  }
}

/**
 * Catálogo de dependencias ministeriales
 */
export async function getDependenciasList(): Promise<Dependencia[]> {
  try {
    return await query<Dependencia[]>('SELECT id, nombre, sigla FROM dependencias ORDER BY nombre ASC')
  } catch (error) {
    console.error('Error al obtener dependencias:', error)
    return []
  }
}

/**
 * Guardar o actualizar un vehículo en la base de datos
 */
export async function saveVehicle(
  data: VehicleSaveInput
): Promise<{ success: boolean; id?: number; error?: string }> {
  try {
    if (data.id) {
      await query(
        `
        UPDATE vehiculos SET
          patente = ?,
          tipo_vehiculo_id = ?,
          dependencia_id = ?,
          marca = ?,
          modelo = ?,
          version = ?,
          anio = ?,
          numero_chasis = ?,
          numero_motor = ?,
          numero_cedula = ?,
          fecha_vencimiento_cedula = ?,
          numero_rto = ?,
          tipo_combustible = ?,
          capacidad_tanque_litros = ?,
          capacidad_pasajeros = ?,
          odometro_actual = ?,
          fecha_vencimiento_vtv = ?,
          compania_seguro = ?,
          numero_poliza = ?,
          fecha_vencimiento_seguro = ?,
          estado = COALESCE(?, estado),
          observaciones = ?
        WHERE id = ?
      `,
        [
          data.patente.toUpperCase().trim(),
          data.tipoId,
          data.dependenciaId || null,
          data.marca,
          data.modelo,
          data.version || null,
          data.anio || null,
          data.numeroChasis || null,
          data.numeroMotor || null,
          data.numeroCedula || null,
          data.fechaVencimientoCedula || null,
          data.numeroRto || null,
          data.tipoCombustible || 'diesel_grado_3',
          data.capacidadTanqueLitros || null,
          data.capacidadPasajeros || 5,
          data.odometroActual || 0,
          data.fechaVencimientoVtv,
          data.companiaSeguro || 'Nación Seguros',
          data.numeroPoliza || null,
          data.fechaVencimientoSeguro || null,
          data.estado || 'disponible',
          data.observaciones || null,
          data.id,
        ]
      )
      return { success: true, id: data.id }
    } else {
      const result = await query<any>(
        `
        INSERT INTO vehiculos (
          patente, tipo_vehiculo_id, dependencia_id, marca, modelo, version, anio,
          numero_chasis, numero_motor, numero_cedula, fecha_vencimiento_cedula, numero_rto,
          tipo_combustible, capacidad_tanque_litros, capacidad_pasajeros, odometro_actual,
          fecha_vencimiento_vtv, compania_seguro, numero_poliza, fecha_vencimiento_seguro,
          estado, observaciones
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          data.patente.toUpperCase().trim(),
          data.tipoId,
          data.dependenciaId || null,
          data.marca,
          data.modelo,
          data.version || null,
          data.anio || null,
          data.numeroChasis || null,
          data.numeroMotor || null,
          data.numeroCedula || null,
          data.fechaVencimientoCedula || null,
          data.numeroRto || null,
          data.tipoCombustible || 'diesel_grado_3',
          data.capacidadTanqueLitros || null,
          data.capacidadPasajeros || 5,
          data.odometroActual || 0,
          data.fechaVencimientoVtv,
          data.companiaSeguro || 'Nación Seguros',
          data.numeroPoliza || null,
          data.fechaVencimientoSeguro || null,
          data.estado || 'disponible',
          data.observaciones || null,
        ]
      )
      return { success: true, id: result.insertId }
    }
  } catch (error: any) {
    console.error('Error al guardar vehículo:', error)
    return { success: false, error: error.message || 'Error al persistir en base de datos' }
  }
}
