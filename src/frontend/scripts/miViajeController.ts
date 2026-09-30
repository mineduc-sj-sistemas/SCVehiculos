/**
 * Controlador de cliente para el Portal Móvil del Chofer (/mi-viaje)
 * Maneja geolocalización en tiempo real, check-ins de paradas, salida y regreso
 */

document.addEventListener('DOMContentLoaded', () => {
  initMiViaje()
})

async function obtenerCoordenadasGps(): Promise<{ latitud?: number; longitud?: number; precisionGps?: number }> {
  if (!navigator.geolocation) {
    return {}
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitud: Number(pos.coords.latitude.toFixed(6)),
          longitud: Number(pos.coords.longitude.toFixed(6)),
          precisionGps: Number(pos.coords.accuracy.toFixed(1)),
        })
      },
      () => {
        // En caso de denegación o timeout, resolver sin coordenadas sin bloquear la app
        resolve({})
      },
      { timeout: 7000, enableHighAccuracy: true }
    )
  })
}

function initMiViaje() {
  const container = document.getElementById('portal-mi-viaje')
  if (!container) return

  const comisionId = container.getAttribute('data-comision-id')
  const choferId = container.getAttribute('data-chofer-id')

  // Indicador GPS
  const elGpsBadge = document.getElementById('gps-status-badge')
  if (navigator.geolocation && elGpsBadge) {
    navigator.geolocation.getCurrentPosition(
      () => {
        elGpsBadge.classList.remove('bg-gray-100', 'text-gray-600')
        elGpsBadge.classList.add('bg-emerald-100', 'text-emerald-800')
        elGpsBadge.innerHTML = '<span class="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1"></span>GPS Activo'
      },
      () => {
        elGpsBadge.innerHTML = '<span class="inline-block w-2 h-2 rounded-full bg-gray-400 mr-1"></span>GPS Inactivo'
      },
      { timeout: 5000 }
    )
  }

  // 1. Selector administrativo de chofer (para probar o supervisar)
  const selectChoferOverride = document.getElementById('select-chofer-override') as HTMLSelectElement | null
  selectChoferOverride?.addEventListener('change', () => {
    const val = selectChoferOverride.value
    if (val) {
      window.location.href = `/mi-viaje?choferId=${val}`
    } else {
      window.location.href = `/mi-viaje`
    }
  })

  // 2. Iniciar Salida (Despacho en viaje)
  const btnAbrirSalida = document.getElementById('btn-abrir-modal-salida')
  const modalSalida = document.getElementById('modal-salida-chofer')
  const btnCerrarSalida = document.getElementById('btn-close-modal-salida')
  const formSalida = document.getElementById('form-confirmar-salida-chofer') as HTMLFormElement | null
  const inputOdoSalida = document.getElementById('input-odo-salida-chofer') as HTMLInputElement | null

  btnAbrirSalida?.addEventListener('click', () => {
    modalSalida?.classList.remove('hidden')
    inputOdoSalida?.focus()
  })

  btnCerrarSalida?.addEventListener('click', () => {
    modalSalida?.classList.add('hidden')
  })

  formSalida?.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (!comisionId) return

    const odo = inputOdoSalida?.value ? parseInt(inputOdoSalida.value, 10) : undefined
    if (!odo) {
      alert('Ingresa el kilometraje que marca el tablero.')
      inputOdoSalida?.focus()
      return
    }

    const btnSubmit = document.getElementById('btn-submit-salida-chofer') as HTMLButtonElement | null
    if (btnSubmit) {
      btnSubmit.disabled = true
      btnSubmit.innerText = 'Iniciando viaje...'
    }

    try {
      const res = await fetch(`/api/cronograma/${comisionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado: 'en_curso',
          odometroSalida: odo,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al iniciar salida')
      }

      window.location.reload()
    } catch (err: any) {
      alert(err.message || 'Error al iniciar salida')
      if (btnSubmit) {
        btnSubmit.disabled = false
        btnSubmit.innerText = 'Confirmar Salida'
      }
    }
  })

  // 3. Marcar Check-in de Parada con GPS
  document.querySelectorAll<HTMLButtonElement>('.btn-marcar-checkin').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const paradaIndex = btn.getAttribute('data-parada-index')
      const destinoNombre = btn.getAttribute('data-destino-nombre')
      if (!comisionId || !choferId || !paradaIndex || !destinoNombre) return

      const originalText = btn.innerHTML
      btn.disabled = true
      btn.innerHTML = `<span class="inline-block animate-spin mr-1.5">⏳</span> Obteniendo GPS...`

      const gps = await obtenerCoordenadasGps()

      btn.innerHTML = `<span class="inline-block animate-spin mr-1.5">💾</span> Guardando arribo...`

      try {
        const res = await fetch('/api/chofer/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            comisionId: parseInt(comisionId, 10),
            choferId: parseInt(choferId, 10),
            paradaIndex: parseInt(paradaIndex, 10),
            destinoNombre,
            latitud: gps.latitud,
            longitud: gps.longitud,
            precisionGps: gps.precisionGps,
          }),
        })

        const data = await res.json()
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Error al registrar check-in')
        }

        window.location.reload()
      } catch (err: any) {
        alert(err.message || 'Error al registrar arribo')
        btn.disabled = false
        btn.innerHTML = originalText
      }
    })
  })

  // 4. Modal de Combustible Rápido
  const btnAbrirFuel = document.getElementById('btn-abrir-modal-fuel')
  const modalFuel = document.getElementById('modal-fuel-chofer')
  const btnCerrarFuel = document.getElementById('btn-close-modal-fuel')
  const formFuel = document.getElementById('form-fuel-chofer') as HTMLFormElement | null

  btnAbrirFuel?.addEventListener('click', () => {
    modalFuel?.classList.remove('hidden')
  })

  btnCerrarFuel?.addEventListener('click', () => {
    modalFuel?.classList.add('hidden')
  })

  formFuel?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const vehiculoId = container.getAttribute('data-vehiculo-id')
    if (!vehiculoId) return

    const inputEstacion = document.getElementById('fuel-estacion') as HTMLInputElement | null
    const inputLitros = document.getElementById('fuel-litros') as HTMLInputElement | null
    const inputImporte = document.getElementById('fuel-importe') as HTMLInputElement | null
    const inputOdo = document.getElementById('fuel-odometro') as HTMLInputElement | null
    const inputTicket = document.getElementById('fuel-ticket') as HTMLInputElement | null
    const selectTipo = document.getElementById('fuel-tipo-combustible') as HTMLSelectElement | null

    const btnSubmit = document.getElementById('btn-submit-fuel-chofer') as HTMLButtonElement | null
    if (btnSubmit) {
      btnSubmit.disabled = true
      btnSubmit.innerText = 'Registrando carga...'
    }

    try {
      const res = await fetch('/api/combustible', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehiculoId: parseInt(vehiculoId, 10),
          choferId: choferId ? parseInt(choferId, 10) : undefined,
          comisionId: comisionId ? parseInt(comisionId, 10) : undefined,
          estacionServicio: inputEstacion?.value || 'YPF en Ruta',
          tipoCombustible: selectTipo?.value || 'diesel_500',
          litros: inputLitros?.value ? parseFloat(inputLitros.value) : 0,
          importeTotal: inputImporte?.value ? parseFloat(inputImporte.value) : 0,
          odometroCarga: inputOdo?.value ? parseInt(inputOdo.value, 10) : undefined,
          numeroTicket: inputTicket?.value || 'S/N',
          metodoPago: 'tarjeta_flota',
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al registrar carga de combustible')
      }

      alert('¡Carga de combustible registrada con éxito!')
      modalFuel?.classList.add('hidden')
      formFuel.reset()
    } catch (err: any) {
      alert(err.message || 'Error al registrar carga')
    } finally {
      if (btnSubmit) {
        btnSubmit.disabled = false
        btnSubmit.innerText = 'Guardar Ticket de Combustible'
      }
    }
  })

  // 5. Finalizar Viaje (Llegada al Centro Cívico)
  const btnAbrirLlegada = document.getElementById('btn-abrir-modal-llegada')
  const modalLlegada = document.getElementById('modal-llegada-chofer')
  const btnCerrarLlegada = document.getElementById('btn-close-modal-llegada')
  const formLlegada = document.getElementById('form-confirmar-llegada-chofer') as HTMLFormElement | null
  const inputOdoLlegada = document.getElementById('input-odo-llegada-chofer') as HTMLInputElement | null
  const inputObsLlegada = document.getElementById('input-obs-llegada-chofer') as HTMLTextAreaElement | null
  const odoSalidaBase = parseInt(container.getAttribute('data-odometro-salida') || '0', 10)

  btnAbrirLlegada?.addEventListener('click', () => {
    modalLlegada?.classList.remove('hidden')
    inputOdoLlegada?.focus()
  })

  btnCerrarLlegada?.addEventListener('click', () => {
    modalLlegada?.classList.add('hidden')
  })

  formLlegada?.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (!comisionId) return

    const odo = inputOdoLlegada?.value ? parseInt(inputOdoLlegada.value, 10) : undefined
    if (!odo) {
      alert('Ingresa el kilometraje final.')
      inputOdoLlegada?.focus()
      return
    }

    if (odoSalidaBase > 0 && odo <= odoSalidaBase) {
      alert(`El kilometraje de llegada (${odo} km) debe ser mayor al de salida (${odoSalidaBase} km).`)
      inputOdoLlegada?.focus()
      return
    }

    const btnSubmit = document.getElementById('btn-submit-llegada-chofer') as HTMLButtonElement | null
    if (btnSubmit) {
      btnSubmit.disabled = true
      btnSubmit.innerText = 'Cerrando comisión...'
    }

    try {
      const res = await fetch(`/api/cronograma/${comisionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado: 'finalizada',
          odometroRegreso: odo,
          observaciones: inputObsLlegada?.value?.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al finalizar comisión')
      }

      alert('¡Comisión oficial finalizada correctamente! Vehículo liberado.')
      window.location.reload()
    } catch (err: any) {
      alert(err.message || 'Error al finalizar comisión')
      if (btnSubmit) {
        btnSubmit.disabled = false
        btnSubmit.innerText = 'Confirmar Llegada y Cerrar'
      }
    }
  })
}
