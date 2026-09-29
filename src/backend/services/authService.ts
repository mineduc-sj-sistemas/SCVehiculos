import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import { query } from '../config/db'
import type { UserSession } from '../types/user.types'

export const SESSION_COOKIE_NAME = 'sc_session'
const SESSION_SECRET = process.env.SESSION_SECRET || 'sc_vehiculos_secret_key_mineduc_2026_jwt'

export interface LoginResult {
  success: boolean
  message: string
  session?: UserSession
  token?: string
}

/**
 * Firma un payload de sesión creando un token seguro con expiración
 */
export function signSession(session: UserSession): string {
  const data = JSON.stringify({
    ...session,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 días
  })
  const base64Data = Buffer.from(data, 'utf8').toString('base64url')
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(base64Data)
    .digest('base64url')

  return `${base64Data}.${signature}`
}

/**
 * Verifica un token de sesión y retorna los datos del usuario autenticado
 */
export function verifySessionToken(token: string | undefined): UserSession | null {
  if (!token || typeof token !== 'string') return null

  const parts = token.split('.')
  if (parts.length !== 2) return null

  const [base64Data, signature] = parts
  const expectedSignature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(base64Data)
    .digest('base64url')

  if (signature !== expectedSignature) {
    return null
  }

  try {
    const raw = Buffer.from(base64Data, 'base64url').toString('utf8')
    const parsed = JSON.parse(raw)
    if (parsed.exp && Date.now() > parsed.exp) {
      return null // Sesión expirada
    }

    return {
      id: parsed.id,
      email: parsed.email,
      nombre: parsed.nombre,
      apellido: parsed.apellido,
      nombreCompleto: `${parsed.nombre} ${parsed.apellido}`,
      rolId: parsed.rolId,
      rolNombre: parsed.rolNombre,
      dependenciaId: parsed.dependenciaId || null,
      dependenciaNombre: parsed.dependenciaNombre || null,
    }
  } catch {
    return null
  }
}

export interface AuthCheckResult {
  authorized: boolean
  user?: UserSession
  session?: UserSession
  response?: Response
}

/**
 * Helper para endpoints API: valida sesión y roles autorizados
 */
export function requireAuth(cookies: any, allowedRoleIds?: number[]): AuthCheckResult {
  const sessionToken = cookies?.get ? cookies.get(SESSION_COOKIE_NAME)?.value : cookies
  const user = verifySessionToken(sessionToken)

  if (!user) {
    return {
      authorized: false,
      response: new Response(
        JSON.stringify({ success: false, message: 'Sesión no iniciada o expirada.' }),
        { status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      ),
    }
  }

  if (allowedRoleIds && allowedRoleIds.length > 0 && !allowedRoleIds.includes(user.rolId)) {
    return {
      authorized: false,
      user,
      session: user,
      response: new Response(
        JSON.stringify({ success: false, message: 'Acceso no autorizado: tu rol no tiene permisos para realizar esta operación.' }),
        { status: 403, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      ),
    }
  }

  return { authorized: true, user, session: user }
}

/**
 * Procesa el inicio de sesión con email y contraseña
 */
export async function authenticateUser(emailInput: string, passwordInput: string): Promise<LoginResult> {
  const email = emailInput?.trim().toLowerCase()
  const password = passwordInput?.trim()

  if (!email || !password) {
    return { success: false, message: 'Ingresa tu correo institucional y contraseña.' }
  }

  try {
    const rows = await query<any[]>(
      `
      SELECT 
        u.id,
        u.rol_id,
        r.nombre AS rol_nombre,
        u.dependencia_id,
        COALESCE(d.nombre, 'Sin asignar') AS dependencia_nombre,
        u.nombre,
        u.apellido,
        u.email,
        u.password_hash,
        u.activo
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      LEFT JOIN dependencias d ON u.dependencia_id = d.id
      WHERE LOWER(u.email) = ?
      LIMIT 1
      `,
      [email]
    )

    if (!rows || rows.length === 0) {
      return { success: false, message: 'Las credenciales ingresadas son incorrectas.' }
    }

    const user = rows[0]

    if (!user.activo) {
      return { success: false, message: 'Esta cuenta de usuario se encuentra inactiva. Contacta al Administrador.' }
    }

    // Verificar contraseña exclusivamente con hash seguro bcrypt
    let passwordMatches = false
    try {
      if (user.password_hash && user.password_hash.startsWith('$2')) {
        // En PHP/Bcrypt $2y$ se reemplaza con $2a$ para compatibilidad con bcryptjs
        const normalizedHash = user.password_hash.replace(/^\$2y\$/, '$2a$')
        passwordMatches = bcrypt.compareSync(password, normalizedHash)
      }
    } catch (e) {
      console.error('Error al comparar bcrypt hash:', e)
    }

    if (!passwordMatches) {
      return { success: false, message: 'La contraseña ingresada es incorrecta.' }
    }

    // Actualizar fecha de último acceso
    try {
      await query(`UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?`, [user.id])
    } catch {}

    const session: UserSession = {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      apellido: user.apellido,
      nombreCompleto: `${user.nombre} ${user.apellido}`,
      rolId: user.rol_id,
      rolNombre: user.rol_nombre,
      dependenciaId: user.dependencia_id,
      dependenciaNombre: user.dependencia_nombre,
    }

    const token = signSession(session)

    return {
      success: true,
      message: 'Inicio de sesión exitoso.',
      session,
      token,
    }
  } catch (error) {
    console.error('Error en autenticación:', error)

    // Fallback de emergencia exclusivamente para entorno de desarrollo local sin BD
    if (
      process.env.NODE_ENV !== 'production' &&
      email === 'maria.gutierrez@sanjuan.edu.ar' &&
      password === 'admin123'
    ) {
      console.warn('ADVERTENCIA: Iniciando en Modo Demo Administrador (solo disponible en desarrollo local).')
      const demoSession: UserSession = {
        id: 1,
        email: 'maria.gutierrez@sanjuan.edu.ar',
        nombre: 'María',
        apellido: 'Gutiérrez',
        nombreCompleto: 'María Gutiérrez',
        rolId: 1,
        rolNombre: 'Administrador',
        dependenciaId: null,
        dependenciaNombre: 'Ministerio de Educación',
      }
      return {
        success: true,
        message: 'Conexión a BD no disponible. Iniciando en Modo Demo Administrador.',
        session: demoSession,
        token: signSession(demoSession),
      }
    }

    return { success: false, message: 'Error en el servidor al intentar autenticar. Verifica la conexión con la base de datos.' }
  }
}

