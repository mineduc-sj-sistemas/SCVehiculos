import type { APIRoute } from 'astro'
import { getChoferesFullList, getChoferDetailWithHistory, saveChofer, requireAuth } from '../../../backend/index'

export const prerender = false

export const GET: APIRoute = async ({ request, cookies }) => {
  const auth = requireAuth(cookies)
  if (!auth.authorized) return auth.response!

  const url = new URL(request.url)
  const idParam = url.searchParams.get('id')

  try {
    if (idParam) {
      const id = parseInt(idParam, 10)
      if (isNaN(id)) {
        return new Response(JSON.stringify({ success: false, error: 'ID de chofer inválido' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        })
      }

      const detail = await getChoferDetailWithHistory(id)
      if (!detail.chofer) {
        return new Response(JSON.stringify({ success: false, error: 'Chofer no encontrado' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        })
      }

      return new Response(JSON.stringify({ success: true, ...detail }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      })
    }

    const list = await getChoferesFullList()
    return new Response(JSON.stringify({ success: true, choferes: list }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message || 'Error en el servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }
}

export const POST: APIRoute = async ({ request, cookies }) => {
  // Roles autorizados para gestionar choferes: 1 (Admin), 2 (Operador)
  const auth = requireAuth(cookies, [1, 2])
  if (!auth.authorized) return auth.response!

  try {
    const data = await request.json()

    if (!data.nombre || !data.apellido || !data.dni || !data.numeroLicencia || !data.categoriaLicencia || !data.fechaVencimientoLicencia) {
      return new Response(
        JSON.stringify({ success: false, error: 'Nombre, Apellido, DNI, Licencia, Categoría y Vencimiento son campos obligatorios.' }),
        { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      )
    }

    const result = await saveChofer(data)
    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      })
    }

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Error al procesar solicitud' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }
}
