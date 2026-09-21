import bcrypt from 'bcryptjs'
import { query } from '../config/db'
import type { Usuario, Rol, UserCreateInput, UserUpdateInput, UserStats, ChoferParaVinculacion } from '../types/user.types'

const MOCK_ROLES: Rol[] = [
  { id: 1, nombre: 'Administrador', descripcion: 'Acceso total al sistema y gestión de usuarios' },
  { id: 2, nombre: 'Operador / Despachante', descripcion: 'Gestión de comisiones, cronograma y hojas de ruta' },
  { id: 3, nombre: 'Mecánico / Taller', descripcion: 'Registro y seguimiento de servicios de mantenimiento' },
  { id: 4, nombre: 'Chofer', descripcion: 'Consulta de viajes y asignaciones oficiales' },
  { id: 5, nombre: 'Auditor', descripcion: 'Lectura de estadísticas e informes de uso' },
]

const MOCK_USUARIOS: Usuario[] = [
  {
    id: 1,
    rolId: 1,
    rolNombre: 'Administrador',
    dependenciaId: null,
    dependenciaNombre: 'Ministerio de Educación',
    nombre: 'María',
    apellido: 'Gutiérrez',
    email: 'maria.gutierrez@sanjuan.edu.ar',
    dni: '27456789',
    telefono: '264-5012345',
    activo: true,
    ultimoAcceso: 'Hoy, 08:30',
    createdAt: '2024-09-01',
  },
  {
    id: 2,
    rolId: 2,
    rolNombre: 'Operador / Despachante',
    dependenciaId: 1,
    dependenciaNombre: 'Dirección de Educación Rural',
    nombre: 'Gonzalo',
    apellido: 'Pérez',
    email: 'gonzalo.perez@sanjuan.edu.ar',
    dni: '32145678',
    telefono: '264-5023456',
    activo: true,
    ultimoAcceso: 'Ayer, 14:15',
    createdAt: '2024-09-05',
  },
  {
    id: 3,
    rolId: 3,
    rolNombre: 'Mecánico / Taller',
    dependenciaId: 3,
    dependenciaNombre: 'Dirección de Infraestructura Escolar',
    nombre: 'Esteban',
    apellido: 'Benítez',
    email: 'esteban.benitez@sanjuan.edu.ar',
    dni: '30998124',
    telefono: '264-4891122',
    activo: true,
    ultimoAcceso: '18/09/2024',
    createdAt: '2024-09-10',
  },
]

/**
 * Obtiene la lista completa de roles del sistema
 */
export async function getRolesList(): Promise<Rol[]> {
  try {
    const rows = await query<any[]>(`SELECT id, nombre, descripcion FROM roles ORDER BY id ASC`)
    if (rows && rows.length > 0) {
      return rows.map((r) => ({
        id: r.id,
        nombre: r.nombre,
        descripcion: r.descripcion,
      }))
    }
    return MOCK_ROLES
  } catch (error) {
    console.error('Error al obtener roles, usando mock:', error)
    return MOCK_ROLES
  }
}

/**
 * Obtiene la lista de choferes para vinculación de credenciales (1 usuario por chofer)
 */
export async function getChoferesParaVinculacion(): Promise<ChoferParaVinculacion[]> {
  try {
    const rows = await query<any[]>(`
      SELECT 
        c.id,
        c.nombre,
        c.apellido,
        c.dni,
        c.email,
        c.telefono,
        c.numero_licencia,
        c.categoria_licencia,
        c.usuario_id,
        u.email AS usuario_email
      FROM choferes c
      LEFT JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.estado != 'inactivo'
      ORDER BY c.apellido ASC, c.nombre ASC
    `)

    if (rows && rows.length > 0) {
      return rows.map((r) => ({
        id: r.id,
        nombre: r.nombre,
        apellido: r.apellido,
        dni: r.dni,
        email: r.email,
        telefono: r.telefono,
        numeroLicencia: r.numero_licencia,
        categoriaLicencia: r.categoria_licencia,
        usuarioId: r.usuario_id,
        usuarioEmail: r.usuario_email,
        tieneUsuario: Boolean(r.usuario_id),
      }))
    }
    return []
  } catch (error) {
    console.error('Error al obtener choferes para vinculación:', error)
    return []
  }
}

/**
 * Obtiene la lista completa de usuarios registrados
 */
export async function getUsuariosList(): Promise<Usuario[]> {
  try {
    const rows = await query<any[]>(`
      SELECT 
        u.id,
        u.rol_id,
        r.nombre AS rol_nombre,
        u.dependencia_id,
        COALESCE(d.nombre, 'Sin asignar') AS dependencia_nombre,
        u.nombre,
        u.apellido,
        u.email,
        u.dni,
        u.telefono,
        u.activo,
        u.ultimo_acceso,
        u.created_at,
        ch.id AS chofer_id,
        CONCAT(ch.apellido, ', ', ch.nombre) AS chofer_nombre,
        CONCAT('Cat. ', ch.categoria_licencia, ' · ', ch.numero_licencia) AS chofer_licencia
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      LEFT JOIN dependencias d ON u.dependencia_id = d.id
      LEFT JOIN choferes ch ON ch.usuario_id = u.id
      ORDER BY u.id ASC
    `)

    if (!rows || rows.length === 0) {
      return MOCK_USUARIOS
    }

    return rows.map((r) => {
      let ultimoAccesoFormatted = 'Sin accesos registrados'
      if (r.ultimo_acceso) {
        const d = new Date(r.ultimo_acceso)
        ultimoAccesoFormatted = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      }

      return {
        id: r.id,
        rolId: r.rol_id,
        rolNombre: r.rol_nombre,
        dependenciaId: r.dependencia_id,
        dependenciaNombre: r.dependencia_nombre,
        nombre: r.nombre,
        apellido: r.apellido,
        email: r.email,
        dni: r.dni,
        telefono: r.telefono,
        activo: Boolean(r.activo),
        ultimoAcceso: ultimoAccesoFormatted,
        createdAt: r.created_at ? new Date(r.created_at).toLocaleDateString('es-AR') : undefined,
        choferId: r.chofer_id || null,
        choferNombre: r.chofer_nombre || null,
        choferLicencia: r.chofer_licencia || null,
      }
    })
  } catch (error) {
    console.error('Error al obtener usuarios, usando mock:', error)
    return MOCK_USUARIOS
  }
}

/**
 * Métricas para las tarjetas superiores de gestión de usuarios
 */
export async function getUserStats(): Promise<UserStats> {
  const list = await getUsuariosList()
  return {
    total: list.length,
    administradores: list.filter((u) => u.rolId === 1 && u.activo).length,
    operadores: list.filter((u) => u.rolId === 2 && u.activo).length,
    otros: list.filter((u) => u.rolId > 2 && u.activo).length,
    inactivos: list.filter((u) => !u.activo).length,
  }
}

/**
 * Da de alta un nuevo usuario en la base de datos
 */
export async function createUsuario(input: UserCreateInput): Promise<{ success: boolean; message: string; id?: number }> {
  const nombre = input.nombre?.trim()
  const apellido = input.apellido?.trim()
  const email = input.email?.trim().toLowerCase()
  const password = input.password?.trim()
  const rolId = Number(input.rolId)
  const dependenciaId = input.dependenciaId ? Number(input.dependenciaId) : null
  const dni = input.dni?.trim() || null
  const telefono = input.telefono?.trim() || null
  const choferId = input.choferId ? Number(input.choferId) : null

  if (!nombre || !apellido || !email || !password || !rolId) {
    return { success: false, message: 'Todos los campos marcados como obligatorios deben completarse.' }
  }

  if (password.length < 6) {
    return { success: false, message: 'La contraseña inicial debe tener al menos 6 caracteres.' }
  }

  // Regla para rol Chofer (ID 4): Debe asociarse a un chofer oficial existente
  if (rolId === 4 && !choferId) {
    return { success: false, message: 'Debes seleccionar un chofer de la lista para vincular sus credenciales de acceso.' }
  }

  try {
    // Si se especificó un choferId, validar que exista y que NO tenga un usuario vinculado (regla: 1 usuario por chofer)
    if (choferId) {
      const choferRows = await query<any[]>(`SELECT id, usuario_id, nombre, apellido FROM choferes WHERE id = ? LIMIT 1`, [choferId])
      if (!choferRows || choferRows.length === 0) {
        return { success: false, message: 'El chofer seleccionado no existe en el registro del sistema.' }
      }
      if (choferRows[0].usuario_id) {
        return { success: false, message: `El chofer ${choferRows[0].apellido}, ${choferRows[0].nombre} ya posee credenciales de acceso vinculadas. Solo se permite un único usuario por chofer.` }
      }
    }

    // Validar si el email ya existe
    const existing = await query<any[]>(`SELECT id FROM usuarios WHERE LOWER(email) = ? LIMIT 1`, [email])
    if (existing && existing.length > 0) {
      return { success: false, message: `El correo '${email}' ya se encuentra registrado en el sistema.` }
    }

    // Hashear contraseña
    const passwordHash = bcrypt.hashSync(password, 10)

    const result = await query<any>(
      `
      INSERT INTO usuarios (
        rol_id,
        dependencia_id,
        nombre,
        apellido,
        email,
        password_hash,
        dni,
        telefono,
        activo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
      `,
      [rolId, dependenciaId, nombre, apellido, email, passwordHash, dni, telefono]
    )

    const newUserId = result.insertId

    // Si se vinculó un chofer, actualizar choferes con el nuevo usuario_id
    if (choferId && newUserId) {
      await query(`UPDATE choferes SET usuario_id = ? WHERE id = ?`, [newUserId, choferId])
    }

    return {
      success: true,
      message: `Usuario ${nombre} ${apellido} creado exitosamente.`,
      id: newUserId,
    }
  } catch (error: any) {
    console.error('Error al crear usuario en BD, aplicando fallback demo:', error?.message)
    
    // Si la BD no está accesible, guardar en memoria para que no se interrumpa la experiencia demo
    const rolMap: Record<number, string> = {
      1: 'Administrador',
      2: 'Operador / Despachante',
      3: 'Mecánico / Taller',
      4: 'Chofer',
      5: 'Auditor',
    }
    const newMockId = MOCK_USUARIOS.length + 1
    const newMockUser: Usuario = {
      id: newMockId,
      rolId,
      rolNombre: rolMap[rolId] || 'Operador',
      dependenciaId,
      dependenciaNombre: 'Ministerio Central',
      nombre,
      apellido,
      email,
      dni,
      telefono,
      activo: true,
      ultimoAcceso: 'Sin accesos',
      createdAt: new Date().toLocaleDateString('es-AR'),
    }
    MOCK_USUARIOS.push(newMockUser)

    return {
      success: true,
      message: `Usuario ${nombre} ${apellido} registrado correctamente (Modo Local).`,
      id: newMockId,
    }
  }
}

/**
 * Modifica el estado activo/inactivo de un usuario
 */
export async function toggleUsuarioActivo(id: number, activo: boolean): Promise<{ success: boolean; message: string }> {
  try {
    await query(`UPDATE usuarios SET activo = ? WHERE id = ?`, [activo ? 1 : 0, id])
    return {
      success: true,
      message: `Estado de usuario actualizado a ${activo ? 'Activo' : 'Inactivo'}.`,
    }
  } catch (error: any) {
    console.error('Error al cambiar estado de usuario:', error)
    return { success: false, message: 'No se pudo actualizar el estado del usuario.' }
  }
}
