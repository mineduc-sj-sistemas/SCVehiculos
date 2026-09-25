/**
 * Controlador de Cliente para el Módulo de Mantenimientos y Taller Mecánico
 */

document.addEventListener('DOMContentLoaded', () => {
  initFiltrosMantenimiento()
  initCrearMantenimientoModal()
  initFinalizarMantenimientoModal()
  initCancelarMantenimiento()
})

/**
 * 1. Filtrado reactivo en cliente (Búsqueda, Tipo y Estado)
 */
function initFiltrosMantenimiento() {
  const inputBuscar = document.getElementById('filtro-buscar-mantenimiento') as HTMLInputElement | null
  const selectTipo = document.getElementById('filtro-tipo-mantenimiento') as HTMLSelectElement | null
  const selectEstado = document.getElementById('filtro-estado-mantenimiento') as HTMLSelectElement | null
  const contador = document.getElementById('contador-mantenimientos')
  const rows = document.querySelectorAll<HTMLTableRowElement>('.item-mantenimiento-row')

  const aplicarFiltros = () => {
    const texto = inputBuscar?.value.trim().toLowerCase() || ''
    const tipo = selectTipo?.value || ''
    const estado = selectEstado?.value || ''

    let visibles = 0

    rows.forEach((row) => {
      const rowSearch = row.dataset.search || ''
      const rowTipo = row.dataset.tipo || ''
      const rowEstado = row.dataset.estado || ''

      const matchesText = !texto || rowSearch.includes(texto)
      const matchesTipo = !tipo || rowTipo === tipo
      const matchesEstado = !estado || rowEstado === estado

      if (matchesText && matchesTipo && matchesEstado) {
        row.style.display = ''
        visibles++
      } else {
        row.style.display = 'none'
      }
    })

    if (contador) {
      contador.innerText = `Mostrando: ${visibles} de ${rows.length} registros`
    }
  }

  inputBuscar?.addEventListener('input', aplicarFiltros)
  selectTipo?.addEventListener('change', aplicarFiltros)
  selectEstado?.addEventListener('change', aplicarFiltros)
}

/**
 * 2. Modal de Creación / Programación de Mantenimiento
 */
function initCrearMantenimientoModal() {
  const modal = document.getElementById('modal-crear-mantenimiento')
  const btnAbrir = document.getElementById('btn-abrir-crear-mantenimiento')
  const btnCerrar = document.getElementById('btn-close-crear-modal')
  const btnCancelar = document.getElementById('btn-cancel-crear-modal')
  const form = document.getElementById('form-crear-mantenimiento') as HTMLFormElement | null
  const selectVehiculo = document.getElementById('mant-vehiculo') as HTMLSelectElement | null
  const inputOdometro = document.getElementById('mant-odometro') as HTMLInputElement | null
  const errorMsg = document.getElementById('mantenimiento-error-msg')
  const errorText = document.getElementById('mantenimiento-error-text')
  const btnSubmit = document.getElementById('btn-submit-mantenimiento') as HTMLButtonElement | null

  const openModal = () => {
    form?.reset()
    if (errorMsg) errorMsg.classList.add('hidden')
    if (modal) modal.classList.remove('opacity-0', 'pointer-events-none')
  }

  const closeModal = () => {
    if (modal) modal.classList.add('opacity-0', 'pointer-events-none')
  }

  btnAbrir?.addEventListener('click', openModal)
  btnCerrar?.addEventListener('click', closeModal)
  btnCancelar?.addEventListener('click', closeModal)

  // Autocompletar odómetro según el vehículo seleccionado
  selectVehiculo?.addEventListener('change', () => {
    const selectedOption = selectVehiculo.options[selectVehiculo.selectedIndex]
    const odo = selectedOption.dataset.odometro
    if (inputOdometro && odo) {
      inputOdometro.value = odo
    }
  })

  // Enviar formulario
  form?.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (!form) return

    if (errorMsg) errorMsg.classList.add('hidden')
    if (btnSubmit) {
      btnSubmit.disabled = true
      btnSubmit.innerText = 'Guardando...'
    }

    const formData = new FormData(form)
    const payload = {
      vehiculoId: formData.get('vehiculoId'),
      tipo: formData.get('tipo'),
      titulo: formData.get('titulo'),
      descripcion: formData.get('descripcion'),
      tallerProveedor: formData.get('tallerProveedor'),
      odometroServicio: formData.get('odometroServicio'),
      fechaProgramada: formData.get('fechaProgramada'),
      ingresarATaller: formData.get('ingresarATaller') === '1',
      costoManoObra: formData.get('costoManoObra') ? Number(formData.get('costoManoObra')) : 0,
      costoRepuestos: formData.get('costoRepuestos') ? Number(formData.get('costoRepuestos')) : 0,
      numeroFactura: formData.get('numeroFactura'),
    }

    try {
      const res = await fetch('/api/mantenimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al registrar mantenimiento')
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
        btnSubmit.innerText = 'Guardar Servicio'
      }
    }
  })
}

/**
 * 3. Modal de Finalización y Cierre de Servicio
 */
function initFinalizarMantenimientoModal() {
  const modal = document.getElementById('modal-finalizar-mantenimiento')
  const btnCerrar = document.getElementById('btn-close-finalizar-modal')
  const btnCancelar = document.getElementById('btn-cancel-finalizar-modal')
  const form = document.getElementById('form-finalizar-mantenimiento') as HTMLFormElement | null
  const inputId = document.getElementById('finish-mant-id') as HTMLInputElement | null
  const elTitulo = document.getElementById('finish-mant-titulo')
  const elPatente = document.getElementById('finish-mant-patente')
  const inputOdo = document.getElementById('finish-odometro') as HTMLInputElement | null
  const inputProxKm = document.getElementById('finish-prox-km') as HTMLInputElement | null
  const errorMsg = document.getElementById('finish-error-msg')
  const errorText = document.getElementById('finish-error-text')
  const btnSubmit = document.getElementById('btn-submit-finalizar') as HTMLButtonElement | null

  const closeModal = () => {
    if (modal) modal.classList.add('opacity-0', 'pointer-events-none')
  }

  btnCerrar?.addEventListener('click', closeModal)
  btnCancelar?.addEventListener('click', closeModal)

  // Abrir modal al hacer clic en botón de la fila
  document.querySelectorAll<HTMLButtonElement>('.btn-abrir-finalizar').forEach((btn) => {
    btn.addEventListener('click', () => {
      form?.reset()
      if (errorMsg) errorMsg.classList.add('hidden')

      const id = btn.dataset.id
      const patente = btn.dataset.patente || ''
      const titulo = btn.dataset.titulo || ''
      const odo = btn.dataset.odometro || ''

      if (inputId) inputId.value = id || ''
      if (elTitulo) elTitulo.innerText = titulo
      if (elPatente) elPatente.innerText = `Dominio: ${patente}`
      if (inputOdo && odo) inputOdo.value = odo

      // Sugerir próximo service a los +10.000 km
      if (inputProxKm && odo) {
        inputProxKm.value = String(parseInt(odo, 10) + 10000)
      }

      if (modal) modal.classList.remove('opacity-0', 'pointer-events-none')
    })
  })

  // Enviar finalización
  form?.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (!form || !inputId?.value) return

    if (errorMsg) errorMsg.classList.add('hidden')
    if (btnSubmit) {
      btnSubmit.disabled = true
      btnSubmit.innerText = 'Finalizando...'
    }

    const id = inputId.value
    const formData = new FormData(form)
    const payload = {
      action: 'complete',
      odometroServicio: formData.get('odometroServicio') ? Number(formData.get('odometroServicio')) : undefined,
      costoManoObra: formData.get('costoManoObra') ? Number(formData.get('costoManoObra')) : undefined,
      costoRepuestos: formData.get('costoRepuestos') ? Number(formData.get('costoRepuestos')) : undefined,
      numeroFactura: formData.get('numeroFactura'),
      detalleTrabajos: formData.get('detalleTrabajos'),
      proximoMantenimientoKm: formData.get('proximoMantenimientoKm') ? Number(formData.get('proximoMantenimientoKm')) : undefined,
    }

    try {
      const res = await fetch(`/api/mantenimientos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al finalizar servicio')
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
        btnSubmit.innerText = 'Confirmar y Liberar Vehículo'
      }
    }
  })
}

/**
 * 4. Cancelación de Mantenimiento
 */
function initCancelarMantenimiento() {
  document.querySelectorAll<HTMLButtonElement>('.btn-cancelar-mantenimiento').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id
      if (!id) return

      if (!confirm('¿Confirma que desea cancelar este turno de mantenimiento?')) {
        return
      }

      try {
        const res = await fetch(`/api/mantenimientos/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'cancel' }),
        })

        const data = await res.json()
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Error al cancelar mantenimiento')
        }

        window.location.reload()
      } catch (err: any) {
        alert(err.message || 'Error al cancelar mantenimiento')
      }
    })
  })
}
