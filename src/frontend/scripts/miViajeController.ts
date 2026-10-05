/**
 * Controlador de cliente para el Portal Móvil del Chofer (/mi-viaje)
 * Maneja geolocalización en tiempo real, check-ins de paradas, salida, regreso
 * y validación estricta de horario de comisión coincidente con la hora actual.
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

/**
 * Evalúa si la fecha y hora actual coinciden con el itinerario de la comisión
 */
function evaluarHorarioViaje(): { valido: boolean; motivo: 'valido' | 'previo' | 'vencido' | 'sin_datos' } {
  const container = document.getElementById('portal-mi-viaje')
  if (!container) return { valido: false, motivo: 'sin_datos' }

  // En modo supervisor administrativo, permite simular coincidencia para pruebas si el checkbox está activo
  const checkSimular = document.getElementById('check-simular-horario') as HTMLInputElement | null
  if (checkSimular && checkSimular.checked) {
    return { valido: true, motivo: 'valido' }
  }

  const salidaStr = container.getAttribute('data-fecha-salida')
  const regresoStr = container.getAttribute('data-fecha-regreso')
  if (!salidaStr || !regresoStr) return { valido: false, motivo: 'sin_datos' }

  const ahora = Date.now()
  const salida = new Date(salidaStr).getTime()
  const regreso = new Date(regresoStr).getTime()

  if (isNaN(salida) || isNaN(regreso)) return { valido: false, motivo: 'sin_datos' }

  if (ahora < salida) {
    return { valido: false, motivo: 'previo' }
  }
  if (ahora > regreso) {
    return { valido: false, motivo: 'vencido' }
  }
  return { valido: true, motivo: 'valido' }
}

/**
 * Actualiza en tiempo real los banners informativos y el estado de habilitación de todos los botones táctiles
 */
function actualizarEstadoHorarioEnTiempoReal() {
  const { valido, motivo } = evaluarHorarioViaje()
  const container = document.getElementById('portal-mi-viaje')
  if (!container) return

  const banner = document.getElementById('banner-horario-viaje')
  const titulo = document.getElementById('banner-horario-titulo')
  const badge = document.getElementById('banner-horario-badge')
  const mensaje = document.getElementById('banner-horario-mensaje')
  const reloj = document.getElementById('reloj-tiempo-real')

  if (reloj) {
    reloj.textContent = `Hora actual: ${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} hs`
  }

  // Actualizar banner reactivo
  if (banner && titulo && badge && mensaje) {
    banner.classList.remove(
      'bg-emerald-50', 'border-emerald-200', 'text-emerald-900',
      'bg-amber-50', 'border-amber-200', 'text-amber-900',
      'bg-rose-50', 'border-rose-200', 'text-rose-900'
    )
    badge.classList.remove(
      'bg-emerald-200', 'text-emerald-900',
      'bg-amber-200', 'text-amber-900',
      'bg-rose-200', 'text-rose-900'
    )

    if (valido) {
      banner.classList.add('bg-emerald-50', 'border-emerald-200', 'text-emerald-900')
      badge.classList.add('bg-emerald-200', 'text-emerald-900')
      titulo.textContent = 'Horario de Viaje Coincidente'
      badge.textContent = 'Interacción Habilitada'
      mensaje.textContent = 'El horario actual coincide con la franja oficial de la comisión. Puedes registrar arribos, combustible y despacho en tiempo real.'
    } else if (motivo === 'previo') {
      banner.classList.add('bg-amber-50', 'border-amber-200', 'text-amber-900')
      badge.classList.add('bg-amber-200', 'text-amber-900')
      titulo.textContent = 'Comisión Programada (Aún no iniciada)'
      badge.textContent = 'Interacción Bloqueada'
      const salidaStr = container.getAttribute('data-fecha-salida')
      const salidaDate = salidaStr ? new Date(salidaStr) : null
      mensaje.textContent = `Esta comisión está programada para iniciar el ${salidaDate?.toLocaleDateString('es-AR')} a las ${salidaDate?.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs. Las acciones operativas se habilitarán automáticamente cuando llegue el horario del viaje.`
    } else {
      banner.classList.add('bg-rose-50', 'border-rose-200', 'text-rose-900')
      badge.classList.add('bg-rose-200', 'text-rose-900')
      titulo.textContent = 'Fuera del Horario Oficial'
      badge.textContent = 'Interacción Bloqueada'
      const regresoStr = container.getAttribute('data-fecha-regreso')
      const regresoDate = regresoStr ? new Date(regresoStr) : null
      mensaje.textContent = `El horario oficial para este viaje finalizó el ${regresoDate?.toLocaleDateString('es-AR')} a las ${regresoDate?.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs. Solo se permite interactuar cuando el horario del viaje coincida con el horario actual.`
    }
  }

  // Actualizar botones de acción táctiles
  const btnSalida = document.getElementById('btn-abrir-modal-salida') as HTMLButtonElement | null
  if (btnSalida) {
    btnSalida.disabled = !valido
    btnSalida.classList.toggle('cursor-not-allowed', !valido)
    btnSalida.classList.toggle('opacity-60', !valido)
    btnSalida.classList.toggle('bg-gray-200', !valido)
    btnSalida.classList.toggle('text-gray-500', !valido)
    btnSalida.classList.toggle('bg-emerald-600', valido)
    btnSalida.classList.toggle('text-white', valido)
    btnSalida.classList.toggle('cursor-pointer', valido)
    const spanText = btnSalida.querySelector('span')
    if (spanText) {
      spanText.textContent = valido ? 'Iniciar Viaje / Registrar Salida Oficial' : 'Iniciar Viaje (Fuera de horario)'
    }
  }

  const btnFuel = document.getElementById('btn-abrir-modal-fuel') as HTMLButtonElement | null
  if (btnFuel) {
    btnFuel.disabled = !valido
    btnFuel.classList.toggle('cursor-not-allowed', !valido)
    btnFuel.classList.toggle('opacity-60', !valido)
    btnFuel.classList.toggle('border-gray-200', !valido)
    btnFuel.classList.toggle('bg-gray-100', !valido)
    btnFuel.classList.toggle('text-gray-400', !valido)
    btnFuel.classList.toggle('border-line', valido)
    btnFuel.classList.toggle('bg-white', valido)
    btnFuel.classList.toggle('text-navy', valido)
    btnFuel.classList.toggle('cursor-pointer', valido)
  }

  const btnLlegada = document.getElementById('btn-abrir-modal-llegada') as HTMLButtonElement | null
  if (btnLlegada) {
    btnLlegada.disabled = !valido
    btnLlegada.classList.toggle('cursor-not-allowed', !valido)
    btnLlegada.classList.toggle('opacity-60', !valido)
    btnLlegada.classList.toggle('bg-gray-200', !valido)
    btnLlegada.classList.toggle('text-gray-400', !valido)
    btnLlegada.classList.toggle('bg-navy', valido)
    btnLlegada.classList.toggle('text-white', valido)
    btnLlegada.classList.toggle('cursor-pointer', valido)
  }

  document.querySelectorAll<HTMLButtonElement>('.btn-marcar-checkin').forEach((btn) => {
    btn.disabled = !valido
    btn.classList.toggle('cursor-not-allowed', !valido)
    btn.classList.toggle('opacity-60', !valido)
    btn.classList.toggle('bg-gray-200', !valido)
    btn.classList.toggle('text-gray-500', !valido)
    btn.classList.toggle('bg-orangeGov', valido)
    btn.classList.toggle('hover:bg-orange-700', valido)
    btn.classList.toggle('text-white', valido)
    btn.classList.toggle('cursor-pointer', valido)
    const labelSpan = btn.querySelector('span')
    if (labelSpan) {
      labelSpan.textContent = valido ? 'Confirmar Llegada' : 'Confirmar Llegada (Bloqueado)'
    }
  })
}

function initMiViaje() {
  const container = document.getElementById('portal-mi-viaje')
  if (!container) return

  const comisionId = container.getAttribute('data-comision-id')
  const choferId = container.getAttribute('data-chofer-id')

  // Evaluar estado de horario al inicio y refrescar periódicamente
  actualizarEstadoHorarioEnTiempoReal()
  setInterval(actualizarEstadoHorarioEnTiempoReal, 5000)

  // Switch de simulación para supervisores
  const checkSimular = document.getElementById('check-simular-horario') as HTMLInputElement | null
  checkSimular?.addEventListener('change', () => {
    actualizarEstadoHorarioEnTiempoReal()
  })

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
    if (!evaluarHorarioViaje().valido) {
      alert('Acción bloqueada: solo se permite iniciar el viaje cuando el horario oficial coincida con el horario actual.')
      return
    }
    modalSalida?.classList.remove('hidden')
    inputOdoSalida?.focus()
  })

  btnCerrarSalida?.addEventListener('click', () => {
    modalSalida?.classList.add('hidden')
  })

  formSalida?.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (!comisionId) return

    if (!evaluarHorarioViaje().valido) {
      alert('Acción bloqueada: solo se permite iniciar el viaje cuando el horario oficial coincida con el horario actual.')
      return
    }

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
      if (!evaluarHorarioViaje().valido) {
        alert('Acción bloqueada: solo se permite registrar paradas cuando el horario del viaje coincida con el horario actual.')
        return
      }

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
    if (!evaluarHorarioViaje().valido) {
      alert('Acción bloqueada: solo se permite registrar cargas de combustible cuando el horario del viaje coincida con el horario actual.')
      return
    }
    modalFuel?.classList.remove('hidden')
  })

  btnCerrarFuel?.addEventListener('click', () => {
    modalFuel?.classList.add('hidden')
  })

  formFuel?.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (!evaluarHorarioViaje().valido) {
      alert('Acción bloqueada: solo se permite registrar cargas de combustible cuando el horario del viaje coincida con el horario actual.')
      return
    }

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
    if (!evaluarHorarioViaje().valido) {
      alert('Acción bloqueada: solo se permite finalizar la comisión cuando el horario del viaje coincida con el horario actual.')
      return
    }
    modalLlegada?.classList.remove('hidden')
    inputOdoLlegada?.focus()
  })

  btnCerrarLlegada?.addEventListener('click', () => {
    modalLlegada?.classList.add('hidden')
  })

  formLlegada?.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (!comisionId) return

    if (!evaluarHorarioViaje().valido) {
      alert('Acción bloqueada: solo se permite finalizar la comisión cuando el horario del viaje coincida con el horario actual.')
      return
    }

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

  // 6. Scanners de Tablero con IA (Gemini Flash)
  initScannerTablero('scan-odo-salida', 'status-odo-salida', 'input-odo-salida-chofer')
  initScannerTablero('scan-odo-fuel', 'status-fuel-scanner', 'fuel-odometro')
  initScannerTablero('scan-odo-llegada', 'status-odo-llegada', 'input-odo-llegada-chofer')

  // 7. Scanner de Ticket Edenred con IA (Gemini Flash)
  initScannerTicketCombustible('scan-ticket-fuel', 'status-fuel-scanner', {
    estacion: document.getElementById('fuel-estacion') as HTMLInputElement | null,
    litros: document.getElementById('fuel-litros') as HTMLInputElement | null,
    importe: document.getElementById('fuel-importe') as HTMLInputElement | null,
    odometro: document.getElementById('fuel-odometro') as HTMLInputElement | null,
    ticket: document.getElementById('fuel-ticket') as HTMLInputElement | null,
    tipoCombustible: document.getElementById('fuel-tipo-combustible') as HTMLSelectElement | null,
  })
}

/**
 * Comprime y redimensiona fotos tomadas en smartphones antes de enviarlas al servidor.
 * En un móvil moderno, la cámara produce imágenes de 8MB a 20MB. Esta función:
 * 1. La escala a max 1280px (suficiente para leer dígitos nítidos).
 * 2. La comprime a JPEG ~82% de calidad en memoria con <canvas>.
 * 3. Reduce el peso de ~12MB a ~200KB, permitiendo subirla en 0.3s por datos 4G/3G
 *    sin congelar la pestaña ni saturar la memoria RAM del teléfono.
 */
async function optimizarFotoParaMovil(file: File, maxDim = 1280, calidad = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('No se pudo leer la foto tomada.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('La imagen no es válida o está dañada.'))
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          resolve(reader.result as string)
          return
        }

        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)

        resolve(canvas.toDataURL('image/jpeg', calidad))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Conecta un input file con el endpoint /api/analizar-tablero
 * optimizado para dispositivos móviles y pantallas táctiles.
 */
function initScannerTablero(
  inputId: string,
  statusId: string,
  targetInputId: string,
  extraCallback?: (datos: any) => void
) {
  const fileInput = document.getElementById(inputId) as HTMLInputElement | null
  const statusDiv = document.getElementById(statusId) as HTMLDivElement | null
  const targetInput = document.getElementById(targetInputId) as HTMLInputElement | null

  if (!fileInput || !statusDiv || !targetInput) return

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0]
    if (!file) return

    statusDiv.className = 'text-xs font-semibold text-orange-950 bg-orange-100/90 border border-orange-200 p-3 rounded-2xl block flex items-center gap-2 animate-pulse'
    statusDiv.innerHTML = '<span class="inline-block animate-spin mr-1">⏳</span> Procesando foto y analizando con IA...'
    statusDiv.classList.remove('hidden')

    try {
      // 1. Optimizar foto para móvil (reduce de ~12MB a ~200KB en memoria)
      const base64DataUrl = await optimizarFotoParaMovil(file, 1280, 0.82)

      // 2. Enviar a /api/analizar-tablero
      const res = await fetch('/api/analizar-tablero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagen: base64DataUrl }),
      })

      const json = await res.json()

      if (!res.ok || !json.success || !json.datos) {
        throw new Error(json.error || 'No se pudo leer el tablero.')
      }

      const { kilometraje, nivelCombustibleTexto, confianza, observaciones } = json.datos

      if (kilometraje) {
        // Feedback háptico en smartphones (vibración corta de éxito)
        try {
          if (navigator.vibrate) navigator.vibrate(60)
        } catch {}

        targetInput.value = String(kilometraje)
        targetInput.dispatchEvent(new Event('input', { bubbles: true }))
        targetInput.classList.add('ring-4', 'ring-emerald-500/40', 'bg-emerald-50/50')
        setTimeout(() => targetInput.classList.remove('ring-4', 'ring-emerald-500/40', 'bg-emerald-50/50'), 4000)

        let detalle = `<div class="space-y-1">`
        detalle += `<div class="flex items-center justify-between">`
        detalle += `<span class="text-emerald-900 font-bold text-sm">✅ ${Number(kilometraje).toLocaleString()} km</span>`
        detalle += `<span class="text-[10px] font-bold uppercase bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full">Confianza ${confianza}%</span>`
        detalle += `</div>`
        if (nivelCombustibleTexto) {
          detalle += `<p class="text-[11px] text-emerald-800">Combustible detectado: <strong>${nivelCombustibleTexto}</strong></p>`
        }
        detalle += `<p class="text-[10px] text-emerald-700">Verifica que coincida con el odómetro real antes de confirmar.</p>`
        detalle += `</div>`

        statusDiv.className = 'text-xs font-semibold text-emerald-950 bg-emerald-100/90 border border-emerald-300 p-3 rounded-2xl block'
        statusDiv.innerHTML = detalle
      } else {
        statusDiv.className = 'text-xs font-semibold text-amber-950 bg-amber-100/90 border border-amber-300 p-3 rounded-2xl block'
        statusDiv.innerHTML = `⚠️ No se pudo distinguir el odómetro. ${observaciones || 'Ingresa el número a mano.'}`
      }

      if (extraCallback) {
        extraCallback(json.datos)
      }
    } catch (err: any) {
      // Feedback háptico de advertencia
      try {
        if (navigator.vibrate) navigator.vibrate([80, 50, 80])
      } catch {}

      statusDiv.className = 'text-xs font-semibold text-rose-950 bg-rose-100/90 border border-rose-300 p-3 rounded-2xl block'
      statusDiv.innerHTML = `❌ ${err.message || 'Error al procesar la foto.'}`
    } finally {
      fileInput.value = ''
    }
  })
}

/**
 * Conecta un input file con /api/analizar-ticket
 * para autocompletar estación, litros, importe, precio/litro, ticket, odómetro y combustible.
 */
function initScannerTicketCombustible(
  inputId: string,
  statusId: string,
  fields: {
    estacion?: HTMLInputElement | null
    litros?: HTMLInputElement | null
    importe?: HTMLInputElement | null
    precio?: HTMLInputElement | null
    odometro?: HTMLInputElement | null
    ticket?: HTMLInputElement | null
    tipoCombustible?: HTMLSelectElement | null
    fecha?: HTMLInputElement | null
  }
) {
  const fileInput = document.getElementById(inputId) as HTMLInputElement | null
  const statusDiv = document.getElementById(statusId) as HTMLDivElement | null

  if (!fileInput || !statusDiv) return

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0]
    if (!file) return

    statusDiv.className = 'text-xs font-semibold text-orange-950 bg-orange-100/90 border border-orange-200 p-3 rounded-2xl block flex items-center gap-2 animate-pulse'
    statusDiv.innerHTML = '<span class="inline-block animate-spin mr-1">⏳</span> Leyendo comprobante Edenred con IA...'
    statusDiv.classList.remove('hidden')

    try {
      // 1. Optimizar foto para móvil en memoria
      const base64DataUrl = await optimizarFotoParaMovil(file, 1280, 0.82)

      // 2. Enviar a /api/analizar-ticket
      const res = await fetch('/api/analizar-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagen: base64DataUrl }),
      })

      const json = await res.json()

      if (!res.ok || !json.success || !json.datos) {
        throw new Error(json.error || 'No se pudo leer el comprobante.')
      }

      const d = json.datos
      const camposCompletados: string[] = []

      const setField = (input: HTMLInputElement | HTMLSelectElement | undefined | null, val: any, label: string) => {
        if (input && val != null && String(val).trim() !== '') {
          input.value = String(val)
          input.dispatchEvent(new Event('input', { bubbles: true }))
          input.dispatchEvent(new Event('change', { bubbles: true }))
          input.classList.add('ring-4', 'ring-emerald-500/40', 'bg-emerald-50/50')
          setTimeout(() => input.classList.remove('ring-4', 'ring-emerald-500/40', 'bg-emerald-50/50'), 4000)
          camposCompletados.push(label)
        }
      }

      setField(fields.estacion, d.estacionServicio, 'Estación')
      setField(fields.litros, d.litros, 'Litros')
      setField(fields.precio, d.precioPorLitro, 'Precio/L')
      setField(fields.importe, d.importeTotal, 'Total $')
      setField(fields.ticket, d.numeroTicket, 'N° Ticket')
      setField(fields.tipoCombustible, d.tipoCombustible, 'Combustible')
      setField(fields.fecha, d.fechaCarga, 'Fecha')

      if (d.odometro && fields.odometro) {
        setField(fields.odometro, d.odometro, 'Odómetro')
      }

      try {
        if (navigator.vibrate) navigator.vibrate(60)
      } catch {}

      if (camposCompletados.length > 0) {
        let detalle = `<div class="space-y-1">`
        detalle += `<div class="flex items-center justify-between">`
        detalle += `<span class="text-emerald-900 font-bold text-sm">✅ Ticket Edenred leído</span>`
        detalle += `<span class="text-[10px] font-bold uppercase bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full">Confianza ${d.confianza}%</span>`
        detalle += `</div>`
        detalle += `<p class="text-[11px] text-emerald-800">Autocompletado: <strong>${camposCompletados.join(', ')}</strong></p>`
        if (d.importeTotal) {
          detalle += `<p class="text-xs text-emerald-900 font-semibold">Total: $${Number(d.importeTotal).toLocaleString('es-AR')}${d.litros ? ` (${d.litros} L)` : ''}</p>`
        }
        detalle += `</div>`

        statusDiv.className = 'text-xs font-semibold text-emerald-950 bg-emerald-100/90 border border-emerald-300 p-3 rounded-2xl block'
        statusDiv.innerHTML = detalle
      } else {
        statusDiv.className = 'text-xs font-semibold text-amber-950 bg-amber-100/90 border border-amber-300 p-3 rounded-2xl block'
        statusDiv.innerHTML = `⚠️ No se detectaron datos legibles en el ticket. ${d.observaciones || 'Ingresa los datos a mano.'}`
      }
    } catch (err: any) {
      try {
        if (navigator.vibrate) navigator.vibrate([80, 50, 80])
      } catch {}

      statusDiv.className = 'text-xs font-semibold text-rose-950 bg-rose-100/90 border border-rose-300 p-3 rounded-2xl block'
      statusDiv.innerHTML = `❌ ${err.message || 'Error al procesar el ticket.'}`
    } finally {
      fileInput.value = ''
    }
  })
}
