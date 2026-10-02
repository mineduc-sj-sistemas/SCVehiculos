import { query } from '../config/db';

export interface ChoferPerfil {
  id: number;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  dni: string;
  telefono: string | null;
  email: string | null;
  estado: string;
  // Licencia
  numeroLicencia: string | null;
  categoriaLicencia: string | null;
  fechaVencimientoLicencia: string | null;
  diasParaVencimiento: number | null;
  licenciaVigente: boolean;
  // Fotos
  tieneFotoDniFrente: boolean;
  tieneFotoDniDorso: boolean;
  tieneFotoLicenciaFrente: boolean;
  tieneFotoLicenciaDorso: boolean;
}

export interface ChoferEstadisticas {
  totalViajes: number;
  totalKmRecorridos: number;
  totalCargasCombustible: number;
  totalLitrosCargados: number;
  ultimoViajeFecha: string | null;
}

export interface AlertaChofer {
  tipo: 'licencia_vencer' | 'mantenimiento_vehiculo' | 'comision_nueva';
  mensaje: string;
  severidad: 'info' | 'warning' | 'danger';
  icono: string;
}

export async function getChoferPerfil(usuarioId: number, choferIdOverride?: number): Promise<ChoferPerfil> {
  let choferId = choferIdOverride;

  if (!choferId) {
    const choferRows = await query<any>(
      `SELECT id FROM choferes WHERE usuario_id = ? LIMIT 1`,
      [usuarioId]
    );

    if (!choferRows || choferRows.length === 0) {
      // Fallback para administradores o supervisores sin chofer asignado
      const fallbackRows = await query<any>(`SELECT id FROM choferes LIMIT 1`);
      if (!fallbackRows || fallbackRows.length === 0) {
        throw new Error('No se encontraron choferes registrados en el sistema');
      }
      choferId = fallbackRows[0].id;
    } else {
      choferId = choferRows[0].id;
    }
  }

  const result = await query<any>(`
    SELECT 
      c.id, c.nombre, c.apellido, c.dni, c.telefono, c.estado,
      c.numero_licencia, c.categoria_licencia, c.fecha_vencimiento_licencia,
      COALESCE(c.email, u.email) AS email,
      CASE WHEN c.foto_dni_frente IS NOT NULL THEN 1 ELSE 0 END as tiene_foto_dni_frente,
      CASE WHEN c.foto_dni_dorso IS NOT NULL THEN 1 ELSE 0 END as tiene_foto_dni_dorso,
      CASE WHEN c.foto_licencia_frente IS NOT NULL THEN 1 ELSE 0 END as tiene_foto_licencia_frente,
      CASE WHEN c.foto_licencia_dorso IS NOT NULL THEN 1 ELSE 0 END as tiene_foto_licencia_dorso
    FROM choferes c
    LEFT JOIN usuarios u ON c.usuario_id = u.id
    WHERE c.id = ?
    LIMIT 1
  `, [choferId]);

  if (!result || result.length === 0) {
    throw new Error('Chofer no encontrado');
  }

  const row = result[0];
  
  let diasParaVencimiento: number | null = null;
  let licenciaVigente = false;

  if (row.fecha_vencimiento_licencia) {
    const vencimientoStr = row.fecha_vencimiento_licencia instanceof Date 
      ? row.fecha_vencimiento_licencia.toISOString().split('T')[0]
      : row.fecha_vencimiento_licencia.toString().split('T')[0];
    const vencimiento = new Date(vencimientoStr + 'T12:00:00Z');
    const hoy = new Date();
    const hoyNorm = new Date(hoy.toISOString().split('T')[0] + 'T12:00:00Z');
    
    const diffTime = vencimiento.getTime() - hoyNorm.getTime();
    diasParaVencimiento = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    licenciaVigente = diasParaVencimiento >= 0;
  }

  return {
    id: row.id,
    nombre: row.nombre,
    apellido: row.apellido,
    nombreCompleto: `${row.nombre} ${row.apellido}`,
    dni: row.dni,
    telefono: row.telefono,
    email: row.email,
    estado: row.estado,
    numeroLicencia: row.numero_licencia,
    categoriaLicencia: row.categoria_licencia,
    fechaVencimientoLicencia: row.fecha_vencimiento_licencia instanceof Date 
      ? row.fecha_vencimiento_licencia.toISOString().split('T')[0]
      : (row.fecha_vencimiento_licencia ? row.fecha_vencimiento_licencia.toString().split('T')[0] : null),
    diasParaVencimiento,
    licenciaVigente,
    tieneFotoDniFrente: Boolean(row.tiene_foto_dni_frente),
    tieneFotoDniDorso: Boolean(row.tiene_foto_dni_dorso),
    tieneFotoLicenciaFrente: Boolean(row.tiene_foto_licencia_frente),
    tieneFotoLicenciaDorso: Boolean(row.tiene_foto_licencia_dorso)
  };
}

export async function getChoferEstadisticas(choferId: number): Promise<ChoferEstadisticas> {
  const viajesRes = await query<any>(`
    SELECT 
      COUNT(*) as total_viajes,
      SUM(odometro_regreso - odometro_salida) as total_km,
      MAX(fecha_salida_real) as ultimo_viaje
    FROM comisiones
    WHERE chofer_id = ? AND estado = 'finalizada'
  `, [choferId]);

  const combustibleRes = await query<any>(`
    SELECT 
      COUNT(*) as total_cargas,
      SUM(litros) as total_litros
    FROM cargas_combustible
    WHERE chofer_id = ?
  `, [choferId]);

  return {
    totalViajes: Number(viajesRes[0]?.total_viajes || 0),
    totalKmRecorridos: Number(viajesRes[0]?.total_km || 0),
    totalCargasCombustible: Number(combustibleRes[0]?.total_cargas || 0),
    totalLitrosCargados: Number(combustibleRes[0]?.total_litros || 0),
    ultimoViajeFecha: viajesRes[0]?.ultimo_viaje instanceof Date 
      ? viajesRes[0].ultimo_viaje.toISOString().split('T')[0]
      : (viajesRes[0]?.ultimo_viaje ? viajesRes[0].ultimo_viaje.toString().split('T')[0] : null)
  };
}

export async function getAlertasChofer(choferId: number): Promise<AlertaChofer[]> {
  const alertas: AlertaChofer[] = [];
  
  const result = await query<any>(`
    SELECT fecha_vencimiento_licencia
    FROM choferes
    WHERE id = ?
  `, [choferId]);

  if (result.length > 0 && result[0].fecha_vencimiento_licencia) {
    const vencimientoStr = result[0].fecha_vencimiento_licencia instanceof Date 
      ? result[0].fecha_vencimiento_licencia.toISOString().split('T')[0]
      : result[0].fecha_vencimiento_licencia.toString().split('T')[0];
    const vencimiento = new Date(vencimientoStr + 'T12:00:00Z');
    
    const hoy = new Date();
    const hoyNorm = new Date(hoy.toISOString().split('T')[0] + 'T12:00:00Z');
    
    const diffTime = vencimiento.getTime() - hoyNorm.getTime();
    const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (dias < 0) {
      alertas.push({
        tipo: 'licencia_vencer',
        mensaje: 'Tu licencia de conducir está vencida.',
        severidad: 'danger',
        icono: 'AlertTriangle'
      });
    } else if (dias <= 7) {
      alertas.push({
        tipo: 'licencia_vencer',
        mensaje: `Tu licencia vence en ${dias} días.`,
        severidad: 'danger',
        icono: 'AlertTriangle'
      });
    } else if (dias <= 30) {
      alertas.push({
        tipo: 'licencia_vencer',
        mensaje: `Tu licencia vence en ${dias} días.`,
        severidad: 'warning',
        icono: 'AlertCircle'
      });
    }
  }

  return alertas;
}
