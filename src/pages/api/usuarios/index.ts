import type { APIRoute } from 'astro'
import {
  getUsuariosList,
  getRolesList,
  getChoferesParaVinculacion,
  createUsuario,
  verifySessionToken,
  SESSION_COOKIE_NAME,
} from '../../../backend/index'

export const GET: APIRoute = async ({ cookies }) => {
  const sessionToken = cookies.get(SESSION_COOKIE_NAME)?.value
  const user = verifySessionToken(sessionToken)

  if (!user || user.rolId !== 1) {
    return new Response(JSON.stringify({ success: false, message: 'Acceso no autorizado. Se requiere rol de Administrador.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }

  const [usuarios, roles, choferes] = await Promise.all([
    getUsuariosList(),
    getRolesList(),
    getChoferesParaVinculacion(),
  ])

  return new Response(JSON.stringify({ success: true, usuarios, roles, choferes }), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const sessionToken = cookies.get(SESSION_COOKIE_NAME)?.value
  const user = verifySessionToken(sessionToken)

  if (!user || user.rolId !== 1) {
    return new Response(JSON.stringify({ success: false, message: 'No tienes permisos de Administrador para crear usuarios.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }

  try {
    const body = await request.json()
    const result = await createUsuario({
      rolId: body.rolId,
      dependenciaId: body.dependenciaId || null,
      nombre: body.nombre,
      apellido: body.apellido,
      email: body.email,
      password: body.password,
      dni: body.dni,
      telefono: body.telefono,
      choferId: body.choferId ? Number(body.choferId) : null,
    })

    const status = result.success ? 201 : 400
    return new Response(JSON.stringify(result), {
      status,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, message: error?.message || 'Error al procesar solicitud.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }
}

