/**
 * Controlador de Cliente para el Cronograma Semanal y Despacho
 */

document.addEventListener('DOMContentLoaded', () => {
  initCronogramaNav()
  initCronogramaFilters()
  initDispatchModal()
  initDetailModal()
})

/**
 * 1. Navegación Semanal
 */
function initCronogramaNav() {
  const btnPrev = document.getElementById('btn-semana-prev')
  const btnHoy = document.getElementById('btn-semana-hoy')
  const btnNext = document.getElementById('btn-semana-next')
  const inputPicker = document.getElementById('input-fecha-picker') as HTMLInputElement | null
  const btnRecargar = document.getElementById('btn-recargar-cronograma')
  const btnImprimir = document.getElementById('btn-imprimir-cronograma')

  const urlParams = new URLSearchParams(window.location.search)
  const currentFechaParam = urlParams.get('fecha')

  // Obtener fecha base activa
  let baseDate: Date
  if (currentFechaParam && /^\d{4}-\d{2}-\d{2}$/.test(currentFechaParam)) {
    const [y, m, d] = currentFechaParam.split('-').map(Number)
    baseDate = new Date(y, m - 1, d, 12, 0, 0)
  } else {
    baseDate = new Date()
  }

  const navigateToDate = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const fechaStr = `${y}-${m}-${day}`
    window.location.href = `/cronograma?fecha=${fechaStr}`
  }

  btnPrev?.addEventListener('click', () => {
    const prev = new Date(baseDate)
    prev.setDate(prev.getDate() - 7)
    navigateToDate(prev)
  })

  btnNext?.addEventListener('click', () => {
    const next = new Date(baseDate)
    next.setDate(next.getDate() + 7)
    navigateToDate(next)
  })

  btnHoy?.addEventListener('click', () => {
    navigateToDate(new Date())
  })

  inputPicker?.addEventListener('change', () => {
    if (inputPicker.value) {
      window.location.href = `/cronograma?fecha=${inputPicker.value}`
    }
  })

  btnRecargar?.addEventListener('click', () => {
    window.location.reload()
  })

  btnImprimir?.addEventListener('click', () => {
    window.print()
  })
}

/**
 * 2. Filtros en vivo del Cronograma
 */
function initCronogramaFilters() {
  const inputFiltro = document.getElementById('input-filtro-cronograma') as HTMLInputElement | null
  const selectEstado = document.getElementById('select-estado-filtro') as HTMLSelectElement | null
  const filasVehiculo = document.querySelectorAll<HTMLTableRowElement>('.fila-vehiculo')

  const aplicarFiltros = () => {
    const query = inputFiltro?.value.toLowerCase().trim() || ''
    const estadoFiltro = selectEstado?.value || 'todos'

    filasVehiculo.forEach((fila) => {
      const patente = fila.dataset.patente || ''
      const modelo = fila.dataset.modelo || ''
      const cards = fila.querySelectorAll<HTMLElement>('.card-comision')

      let filaCoincideTexto = patente.includes(query) || modelo.includes(query)
      let tieneComisionVisible = false

      if (cards.length > 0) {
        cards.forEach((card) => {
          const chofer = card.dataset.chofer || ''
          const destino = card.dataset.destino || ''
          const estado = card.dataset.estado || ''

          const cardCoincideTexto = !query || query.length === 0 || chofer.includes(query) || destino.includes(query) || patente.includes(query)
          const cardCoincideEstado = estadoFiltro === 'todos' || estado === estadoFiltro

          if (cardCoincideTexto && cardCoincideEstado) {
            card.style.display = ''
            tieneComisionVisible = true
            filaCoincideTexto = true
          } else {
            card.style.display = 'none'
          }
        })
      }

      // Si se filtró por estado específico (no todos), solo mostrar filas con comisiones de ese estado
      if (estadoFiltro !== 'todos') {
        fila.style.display = tieneComisionVisible ? '' : 'none'
      } else {
        fila.style.display = (!query || filaCoincideTexto) ? '' : 'none'
      }
    })
  }

  inputFiltro?.addEventListener('input', aplicarFiltros)
  selectEstado?.addEventListener('change', aplicarFiltros)
}

/**
 * 3. Modal de Despacho (Nueva Comisión)
 */
function initDispatchModal() {
  const modal = document.getElementById('modal-dispatch')
  const form = document.getElementById('form-dispatch') as HTMLFormElement | null
  const btnOpen = document.getElementById('btn-abrir-nueva-comision')
  const btnClose = document.getElementById('btn-close-dispatch-modal')
  const btnCancel = document.getElementById('btn-cancel-dispatch')
  const errorMsg = document.getElementById('dispatch-error-msg')
  const errorText = document.getElementById('dispatch-error-text')

  const selectVehiculo = document.getElementById('dispatch-vehiculo') as HTMLSelectElement | null
  const selectDepto = document.getElementById('dispatch-depto') as HTMLSelectElement | null
  const inputDestino = document.getElementById('dispatch-destino') as HTMLInputElement | null
  const inputSalida = document.getElementById('dispatch-salida') as HTMLInputElement | null
  const inputRegreso = document.getElementById('dispatch-regreso') as HTMLInputElement | null

  const openModal = () => {
    if (!modal) return
    modal.classList.remove('opacity-0', 'pointer-events-none')
    if (errorMsg) errorMsg.classList.add('hidden')
  }

  const closeModal = () => {
    if (!modal) return
    modal.classList.add('opacity-0', 'pointer-events-none')
    form?.reset()
  }

  btnOpen?.addEventListener('click', () => {
    form?.reset()
    // Pre-cargar fecha de hoy a las 08:00
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const hoyStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    if (inputSalida) inputSalida.value = `${hoyStr}T08:00`
    if (inputRegreso) inputRegreso.value = `${hoyStr}T17:00`
    openModal()
  })

  btnClose?.addEventListener('click', closeModal)
  btnCancel?.addEventListener('click', closeModal)

  // Abrir al hacer click en cualquier celda "+ Asignar"
  document.querySelectorAll<HTMLElement>('.btn-asignar-celda').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      form?.reset()

      const vehiculoId = btn.dataset.vehiculoId
      const fecha = btn.dataset.fecha

      if (selectVehiculo && vehiculoId) {
        selectVehiculo.value = vehiculoId
      }

      if (fecha) {
        if (inputSalida) inputSalida.value = `${fecha}T08:00`
        if (inputRegreso) inputRegreso.value = `${fecha}T17:00`
      }

      openModal()
    })
  })

  // Sincronizar selector de Departamento con input de destino
  selectDepto?.addEventListener('change', () => {
    if (selectDepto.value && inputDestino) {
      if (selectDepto.value === 'Fuera de la Provincia') {
        inputDestino.value = 'Mendoza / San Luis'
      } else {
        inputDestino.value = `${selectDepto.value} - `
      }
      inputDestino.focus()
    }
  })

  // Envío del formulario
  form?.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (!form) return

    const btnSubmit = document.getElementById('btn-submit-dispatch') as HTMLButtonElement | null
    if (btnSubmit) {
      btnSubmit.disabled = true
      btnSubmit.innerText = 'Despachando...'
    }

    if (errorMsg) errorMsg.classList.add('hidden')

    const formData = new FormData(form)
    const payload = {
      vehiculoId: formData.get('vehiculoId'),
      choferId: formData.get('choferId'),
      dependenciaId: formData.get('dependenciaId'),
      solicitanteNombre: formData.get('solicitanteNombre'),
      origen: formData.get('origen'),
      destino: formData.get('destino'),
      motivo: formData.get('motivo'),
      cantidadPasajeros: formData.get('cantidadPasajeros'),
      fechaSalidaProgramada: formData.get('fechaSalidaProgramada'),
      fechaRegresoEstimada: formData.get('fechaRegresoEstimada'),
      observaciones: formData.get('observaciones'),
    }

    try {
      const res = await fetch('/api/cronograma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al despachar la comisión')
      }

      closeModal()
      window.location.reload()
    } catch (err: any) {
      if (errorMsg && errorText) {
        errorText.innerText = err.message || 'Error al procesar la solicitud'
        errorMsg.classList.remove('hidden')
      }
    } finally {
      if (btnSubmit) {
        btnSubmit.disabled = false
        btnSubmit.innerText = 'Generar Despacho'
      }
    }
  })
}

/**
 * 4. Modal de Detalle y Hoja de Ruta
 */
function initDetailModal() {
  const modal = document.getElementById('modal-detail')
  const btnClose = document.getElementById('btn-close-detail-modal')
  const btnCloseFooter = document.getElementById('btn-close-detail-modal-footer')
  const feedbackMsg = document.getElementById('detail-feedback-msg')

  // Elementos de contenido
  const elCodigo = document.getElementById('detail-codigo')
  const elBadgeEstado = document.getElementById('detail-badge-estado')
  const elVehiculoPatente = document.getElementById('detail-vehiculo-patente')
  const elVehiculoModelo = document.getElementById('detail-vehiculo-modelo')
  const elChoferNombre = document.getElementById('detail-chofer-nombre')
  const elDependenciaNombre = document.getElementById('detail-dependencia-nombre')
  const elOrigen = document.getElementById('detail-origen')
  const elDestino = document.getElementById('detail-destino')
  const elMotivo = document.getElementById('detail-motivo')
  const elSolicitante = document.getElementById('detail-solicitante')
  const elPasajeros = document.getElementById('detail-pasajeros')
  const elSalidaProg = document.getElementById('detail-salida-prog')
  const elSalidaReal = document.getElementById('detail-salida-real')
  const elOdoSalida = document.getElementById('detail-odo-salida')
  const elRegresoEstimado = document.getElementById('detail-regreso-estimado')
  const elRegresoReal = document.getElementById('detail-regreso-real')
  const elOdoRegreso = document.getElementById('detail-odo-regreso')
  const elKmSection = document.getElementById('detail-km-section')
  const elKmTotal = document.getElementById('detail-km-total')
  const elObservaciones = document.getElementById('detail-observaciones')

  // Secciones operativas
  const secAcciones = document.getElementById('section-acciones-operativas')
  const formSalida = document.getElementById('form-marcar-salida')
  const formRegreso = document.getElementById('form-marcar-regreso')
  const inputOdoSalida = document.getElementById('input-odo-salida') as HTMLInputElement | null
  const inputOdoRegreso = document.getElementById('input-odo-regreso') as HTMLInputElement | null
  const btnConfirmarSalida = document.getElementById('btn-confirmar-salida')
  const btnConfirmarRegreso = document.getElementById('btn-confirmar-regreso')
  const btnCancelarComision = document.getElementById('btn-cancelar-comision')
  const btnImprimirHoja = document.getElementById('btn-imprimir-hoja-ruta')

  let currentComisionId: number | null = null

  const closeModal = () => {
    if (!modal) return
    modal.classList.add('opacity-0', 'pointer-events-none')
    currentComisionId = null
    if (feedbackMsg) feedbackMsg.classList.add('hidden')
  }

  btnClose?.addEventListener('click', closeModal)
  btnCloseFooter?.addEventListener('click', closeModal)

  const formatFechaHora = (isoStr: string | null) => {
    if (!isoStr) return 'No registrado'
    const d = new Date(isoStr)
    return d.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Click en cualquier card de comisión
  document.querySelectorAll<HTMLElement>('.card-comision').forEach((card) => {
    card.addEventListener('click', async () => {
      const id = card.dataset.comisionId
      if (!id) return

      currentComisionId = parseInt(id, 10)
      if (modal) modal.classList.remove('opacity-0', 'pointer-events-none')

      try {
        const res = await fetch(`/api/cronograma/${id}`)
        if (!res.ok) throw new Error('Error al obtener datos de la comisión')
        const c = await res.json()

        if (elCodigo) elCodigo.innerText = c.codigoComision
        if (elVehiculoPatente) elVehiculoPatente.innerText = c.vehiculoPatente
        if (elVehiculoModelo) elVehiculoModelo.innerText = c.vehiculoModelo
        if (elChoferNombre) elChoferNombre.innerText = `${c.choferNombre} ${c.choferApellido}`
        if (elDependenciaNombre) elDependenciaNombre.innerText = c.dependenciaNombre
        if (elOrigen) elOrigen.innerText = c.origen
        if (elDestino) elDestino.innerText = c.destino
        if (elMotivo) elMotivo.innerText = c.motivo
        if (elSolicitante) elSolicitante.innerText = c.solicitanteNombre || 'No especificado'
        if (elPasajeros) elPasajeros.innerText = `${c.cantidadPasajeros} personas`

        if (elSalidaProg) elSalidaProg.innerText = formatFechaHora(c.fechaSalidaProgramada)
        if (elSalidaReal) elSalidaReal.innerText = formatFechaHora(c.fechaSalidaReal)
        if (elOdoSalida) elOdoSalida.innerText = c.odometroSalida ? c.odometroSalida.toLocaleString('es-AR') : '--'

        if (elRegresoEstimado) elRegresoEstimado.innerText = formatFechaHora(c.fechaRegresoEstimada)
        if (elRegresoReal) elRegresoReal.innerText = formatFechaHora(c.fechaRegresoReal)
        if (elOdoRegreso) elOdoRegreso.innerText = c.odometroRegreso ? c.odometroRegreso.toLocaleString('es-AR') : '--'

        if (elObservaciones) elObservaciones.innerText = c.observaciones || 'Sin observaciones registradas.'

        // Badge de estado
        if (elBadgeEstado) {
          if (c.estado === 'en_curso') {
            elBadgeEstado.className = 'inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/40'
            elBadgeEstado.innerText = 'En Viaje'
          } else if (c.estado === 'programada') {
            elBadgeEstado.className = 'inline-flex items-center gap-1 rounded-full bg-blue/20 px-2 py-0.5 text-[10px] font-bold text-blue-300 border border-blue/40'
            elBadgeEstado.innerText = 'Programada'
          } else if (c.estado === 'finalizada') {
            elBadgeEstado.className = 'inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/40'
            elBadgeEstado.innerText = 'Finalizada'
          } else {
            elBadgeEstado.className = 'inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-300 border border-red-500/40'
            elBadgeEstado.innerText = 'Cancelada'
          }
        }

        // Sección de KM
        if (elKmSection && elKmTotal) {
          if (c.kmRecorridos !== null && c.kmRecorridos !== undefined) {
            elKmTotal.innerText = `${c.kmRecorridos.toLocaleString('es-AR')} km`
            elKmSection.classList.remove('hidden')
          } else {
            elKmSection.classList.add('hidden')
          }
        }

        // Configuración de botones según el estado
        if (c.estado === 'programada') {
          secAcciones?.classList.remove('hidden')
          formSalida?.classList.remove('hidden')
          formRegreso?.classList.add('hidden')
          btnCancelarComision?.classList.remove('hidden')
          if (inputOdoSalida && c.odometroSalida) inputOdoSalida.value = c.odometroSalida
        } else if (c.estado === 'en_curso') {
          secAcciones?.classList.remove('hidden')
          formSalida?.classList.add('hidden')
          formRegreso?.classList.remove('hidden')
          btnCancelarComision?.classList.remove('hidden')
          if (inputOdoRegreso && c.odometroSalida) inputOdoRegreso.value = c.odometroSalida
        } else {
          secAcciones?.classList.add('hidden')
          btnCancelarComision?.classList.add('hidden')
        }
      } catch (err: any) {
        alert(err.message || 'Error al cargar detalles')
        closeModal()
      }
    })
  })

  // Confirmar salida
  btnConfirmarSalida?.addEventListener('click', async () => {
    if (!currentComisionId) return
    const odo = inputOdoSalida?.value ? parseInt(inputOdoSalida.value, 10) : undefined

    try {
      const res = await fetch(`/api/cronograma/${currentComisionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'en_curso', odometroSalida: odo }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Error al registrar salida')
      window.location.reload()
    } catch (err: any) {
      alert(err.message || 'Error al registrar salida')
    }
  })

  // Confirmar regreso
  btnConfirmarRegreso?.addEventListener('click', async () => {
    if (!currentComisionId) return
    const odo = inputOdoRegreso?.value ? parseInt(inputOdoRegreso.value, 10) : undefined
    if (!odo) {
      alert('Por favor ingrese el odómetro de llegada para cerrar la hoja de ruta.')
      return
    }

    try {
      const res = await fetch(`/api/cronograma/${currentComisionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'finalizada', odometroRegreso: odo }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Error al registrar regreso')
      window.location.reload()
    } catch (err: any) {
      alert(err.message || 'Error al registrar regreso')
    }
  })

  // Cancelar comisión
  btnCancelarComision?.addEventListener('click', async () => {
    if (!currentComisionId) return
    if (!confirm('¿Está seguro de que desea cancelar esta comisión oficial?')) return

    try {
      const res = await fetch(`/api/cronograma/${currentComisionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'cancelada' }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Error al cancelar comisión')
      window.location.reload()
    } catch (err: any) {
      alert(err.message || 'Error al cancelar comisión')
    }
  })

  // Imprimir hoja de ruta
  btnImprimirHoja?.addEventListener('click', () => {
    window.print()
  })
}
