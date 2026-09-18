import type { APIRoute } from 'astro'
import { getChoferesFullList, getChoferDetailWithHistory, saveChofer } from '../../../backend/index'

export const prerender = false

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url)
  const idParam = url.searchParams.get('id')

  try {
    if (idParam) {
      const id = parseInt(idParam, 10)
      if (isNaN(id)) {
        return new Response(JSON.stringify({ error: 'ID de chofer inválido' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        })
      }

      const detail = await getChoferDetailWithHistory(id)
      if (!detail.chofer) {
        return new Response(JSON.stringify({ error: 'Chofer no encontrado' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        })
      }

      return new Response(JSON.stringify(detail), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      })
    }

    const list = await getChoferesFullList()
    return new Response(JSON.stringify(list), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Error en el servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json()

    if (!data.nombre || !data.apellido || !data.dni || !data.numeroLicencia || !data.categoriaLicencia || !data.fechaVencimientoLicencia) {
      return new Response(
        JSON.stringify({ error: 'Nombre, Apellido, DNI, Licencia, Categoría y Vencimiento son campos obligatorios.' }),
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
