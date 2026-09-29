/**
 * Controlador de Cliente para el Módulo de Viajes y Hojas de Ruta
 * SCVehiculos · Ministerio de Educación · Gobierno de San Juan
 */

document.addEventListener('DOMContentLoaded', () => {
  initFiltrosViajes()
  initDispatchModal()
  initDetailModal()
})

/**
 * 1. Filtros reactivos en cliente (Buscador y Estado)
 */
function initFiltrosViajes() {
  const inputBuscar = document.getElementById('filtro-buscar-viaje') as HTMLInputElement | null
  const selectEstado = document.getElementById('filtro-estado-viaje') as HTMLSelectElement | null
  const contador = document.getElementById('contador-viajes')
  const rows = document.querySelectorAll<HTMLTableRowElement>('.item-viaje-row')

  const aplicarFiltros = () => {
    const texto = inputBuscar?.value.trim().toLowerCase() || ''
    const estado = selectEstado?.value || ''

    let visibles = 0

    rows.forEach((row) => {
      const rowSearch = row.dataset.search || ''
      const rowEstado = row.dataset.estado || ''

      const matchesText = !texto || rowSearch.includes(texto)
      const matchesEstado = !estado || rowEstado === estado

      if (matchesText && matchesEstado) {
        row.style.display = ''
        visibles++
      } else {
        row.style.display = 'none'
      }
    })

    if (contador) {
      contador.innerText = `Mostrando: ${visibles} de ${rows.length} comisiones`
    }
  }

  inputBuscar?.addEventListener('input', aplicarFiltros)
  selectEstado?.addEventListener('change', aplicarFiltros)
}

/**
 * 2. Modal de Despacho (Nueva Comisión / Editar Comisión)
 */
function resetDispatchModalToCreate() {
  const hiddenId = document.getElementById('dispatch-comision-id') as HTMLInputElement | null
  const title = document.getElementById('modal-dispatch-title')
  const subtitle = document.getElementById('modal-dispatch-subtitle')
  const btnSubmitText = document.getElementById('btn-submit-dispatch-text')
  const iconSend = document.getElementById('dispatch-header-icon-send')
  const iconEdit = document.getElementById('dispatch-header-icon-edit')
  const btnIconSend = document.getElementById('btn-submit-icon-send')
  const btnIconSave = document.getElementById('btn-submit-icon-save')
  const selectVehiculo = document.getElementById('dispatch-vehiculo') as HTMLSelectElement | null
  const selectChofer = document.getElementById('dispatch-chofer') as HTMLSelectElement | null
  const inputSalida = document.getElementById('dispatch-salida') as HTMLInputElement | null

  if (hiddenId) hiddenId.value = ''
  if (title) title.innerText = 'Despachar Nueva Comisión Oficial'
  if (subtitle) subtitle.innerText = 'Asignación de móvil, conductor y hoja de ruta ministerial'
  if (btnSubmitText) btnSubmitText.innerText = 'Generar Despacho'
  iconSend?.classList.remove('hidden')
  iconEdit?.classList.add('hidden')
  btnIconSend?.classList.remove('hidden')
  btnIconSave?.classList.add('hidden')

  if (selectVehiculo) selectVehiculo.disabled = false
  if (selectChofer) selectChofer.disabled = false
  if (inputSalida) inputSalida.disabled = false
}

function initDispatchModal() {
  const modal = document.getElementById('modal-dispatch')
  const form = document.getElementById('form-dispatch') as HTMLFormElement | null
  const btnOpen = document.getElementById('btn-abrir-nueva-comision')
  const btnClose = document.getElementById('btn-close-dispatch-modal')
  const btnCancel = document.getElementById('btn-cancel-dispatch')
  const errorMsg = document.getElementById('dispatch-error-msg')
  const errorText = document.getElementById('dispatch-error-text')

  const selectVehiculo = document.getElementById('dispatch-vehiculo') as HTMLSelectElement | null
  const selectChofer = document.getElementById('dispatch-chofer') as HTMLSelectElement | null
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
    resetDispatchModalToCreate()
  }

  btnOpen?.addEventListener('click', () => {
    form?.reset()
    resetDispatchModalToCreate()
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const hoyStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    if (inputSalida) inputSalida.value = `${hoyStr}T08:00`
    if (inputRegreso) inputRegreso.value = `${hoyStr}T17:00`
    openModal()
  })

  btnClose?.addEventListener('click', closeModal)
  btnCancel?.addEventListener('click', closeModal)

  // Sincronizar Departamento con Destino
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

  // Enviar formulario (Crear o Editar)
  form?.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (!form) return

    const hiddenId = document.getElementById('dispatch-comision-id') as HTMLInputElement | null
    const comisionId = hiddenId?.value

    const btnSubmit = document.getElementById('btn-submit-dispatch') as HTMLButtonElement | null
    const btnSubmitText = document.getElementById('btn-submit-dispatch-text')
    if (btnSubmit) {
      btnSubmit.disabled = true
      if (btnSubmitText) btnSubmitText.innerText = comisionId ? 'Guardando...' : 'Despachando...'
    }

    if (errorMsg) errorMsg.classList.add('hidden')

    const formData = new FormData(form)
    const payload = {
      vehiculoId: selectVehiculo?.value || formData.get('vehiculoId'),
      choferId: selectChofer?.value || formData.get('choferId'),
      dependenciaId: formData.get('dependenciaId'),
      origen: formData.get('origen') || 'Ministerio de Educación - Centro Cívico',
      destino: formData.get('destino'),
      motivo: formData.get('motivo'),
      solicitanteNombre: formData.get('solicitanteNombre') || null,
      cantidadPasajeros: formData.get('cantidadPasajeros') ? Number(formData.get('cantidadPasajeros')) : 1,
      fechaSalidaProgramada: inputSalida?.value || formData.get('fechaSalidaProgramada') || formData.get('fechaSalida'),
      fechaRegresoEstimada: inputRegreso?.value || formData.get('fechaRegresoEstimada') || formData.get('fechaRegreso'),
      observaciones: formData.get('observaciones'),
    }

    try {
      const url = comisionId ? `/api/cronograma/${comisionId}` : '/api/cronograma'
      const method = comisionId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || (comisionId ? 'Error al actualizar la comisión' : 'Error al despachar la comisión'))
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
        if (btnSubmitText) btnSubmitText.innerText = comisionId ? 'Guardar Cambios' : 'Generar Despacho'
      }
    }
  })
}

/**
 * 3. Modal de Detalle y Hoja de Ruta
 */
let currentComisionId: number | null = null

function initDetailModal() {
  const modal = document.getElementById('modal-detail')
  const btnClose = document.getElementById('btn-close-detail-modal')
  const btnCloseFooter = document.getElementById('btn-close-detail-modal-footer')
  const btnConfirmarSalida = document.getElementById('btn-confirmar-salida')
  const btnConfirmarRegreso = document.getElementById('btn-confirmar-regreso')
  const btnCancelarComision = document.getElementById('btn-cancelar-comision')
  const btnImprimirHoja = document.getElementById('btn-imprimir-hoja-ruta')
  const inputOdoSalida = document.getElementById('input-odo-salida') as HTMLInputElement | null
  const inputOdoRegreso = document.getElementById('input-odo-regreso') as HTMLInputElement | null

  const closeModal = () => {
    if (!modal) return
    modal.classList.add('opacity-0', 'pointer-events-none')
    currentComisionId = null
  }

  btnClose?.addEventListener('click', closeModal)
  btnCloseFooter?.addEventListener('click', closeModal)

  // Click en botón "Detalle" o en la fila de la tabla
  document.querySelectorAll<HTMLElement>('.btn-ver-detalle-viaje').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const id = btn.dataset.id
      if (id) openDetailModalForId(parseInt(id, 10))
    })
  })

  // Click en botón "Editar" en la tabla
  document.querySelectorAll<HTMLElement>('.btn-editar-viaje').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const id = btn.dataset.id
      if (id) openEditModalForId(parseInt(id, 10))
    })
  })

  document.querySelectorAll<HTMLElement>('.item-viaje-row').forEach((row) => {
    row.addEventListener('click', () => {
      const id = row.dataset.id
      if (id) openDetailModalForId(parseInt(id, 10))
    })
  })

  // Botón Editar Comisión desde el modal de detalle
  const btnEditarComision = document.getElementById('btn-editar-comision')
  btnEditarComision?.addEventListener('click', () => {
    if (currentComisionId) {
      openEditModalForId(currentComisionId)
    }
  })

  // Confirmar salida
  btnConfirmarSalida?.addEventListener('click', async () => {
    if (!currentComisionId) return
    const odo = inputOdoSalida?.value ? parseInt(inputOdoSalida.value, 10) : undefined

    try {
      const res = await fetch(`/api/cronograma/${currentComisionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado: 'en_curso',
          odometroSalida: odo,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al despachar la salida')
      }

      closeModal()
      window.location.reload()
    } catch (err: any) {
      alert(err.message || 'Error al despachar la salida')
    }
  })

  // Confirmar regreso
  btnConfirmarRegreso?.addEventListener('click', async () => {
    if (!currentComisionId) return
    const odo = inputOdoRegreso?.value ? parseInt(inputOdoRegreso.value, 10) : undefined

    if (!odo) {
      alert('Debes ingresar el odómetro de llegada para cerrar la comisión.')
      inputOdoRegreso?.focus()
      return
    }

    try {
      const res = await fetch(`/api/cronograma/${currentComisionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado: 'finalizada',
          odometroRegreso: odo,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al registrar el regreso')
      }

      closeModal()
      window.location.reload()
    } catch (err: any) {
      alert(err.message || 'Error al registrar el regreso')
    }
  })

  // Cancelar comisión
  btnCancelarComision?.addEventListener('click', async () => {
    if (!currentComisionId) return
    if (!confirm('¿Confirma que desea cancelar esta comisión oficial?')) return

    try {
      const res = await fetch(`/api/cronograma/${currentComisionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado: 'cancelada',
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al cancelar la comisión')
      }

      closeModal()
      window.location.reload()
    } catch (err: any) {
      alert(err.message || 'Error al cancelar la comisión')
    }
  })

  // Botón Imprimir Hoja de Ruta
  btnImprimirHoja?.addEventListener('click', () => {
    if (currentComisionId) {
      window.open(`/cronograma/imprimir/${currentComisionId}`, '_blank')
    }
  })
}

/**
 * Carga los datos de la comisión y abre el modal de detalle
 */
async function openDetailModalForId(id: number) {
  currentComisionId = id
  const modal = document.getElementById('modal-detail')
  if (!modal) return

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

  const secAcciones = document.getElementById('section-acciones-operativas')
  const formSalida = document.getElementById('form-marcar-salida')
  const formRegreso = document.getElementById('form-marcar-regreso')
  const inputOdoSalida = document.getElementById('input-odo-salida') as HTMLInputElement | null
  const inputOdoRegreso = document.getElementById('input-odo-regreso') as HTMLInputElement | null

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

    if (elBadgeEstado) {
      if (c.estado === 'en_curso') {
        elBadgeEstado.className = 'inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/40'
        elBadgeEstado.innerText = 'En Viaje'
      } else if (c.estado === 'programada') {
        elBadgeEstado.className = 'inline-flex items-center gap-1 rounded-full bg-blue/20 px-2 py-0.5 text-[10px] font-bold text-sky border border-blue/40'
        elBadgeEstado.innerText = 'Programada'
      } else if (c.estado === 'finalizada') {
        elBadgeEstado.className = 'inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/40'
        elBadgeEstado.innerText = 'Finalizada'
      } else {
        elBadgeEstado.className = 'inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300 border border-rose-500/40'
        elBadgeEstado.innerText = 'Cancelada'
      }
    }

    if (c.kmRecorridos !== null) {
      if (elKmTotal) elKmTotal.innerText = `${c.kmRecorridos.toLocaleString('es-AR')} km`
      elKmSection?.classList.remove('hidden')
    } else {
      elKmSection?.classList.add('hidden')
    }

    const btnEditarComision = document.getElementById('btn-editar-comision')

    // Configurar formularios operativos según estado
    if (c.estado === 'programada') {
      secAcciones?.classList.remove('hidden')
      formSalida?.classList.remove('hidden')
      formRegreso?.classList.add('hidden')
      btnEditarComision?.classList.remove('hidden')
    } else if (c.estado === 'en_curso') {
      secAcciones?.classList.remove('hidden')
      formSalida?.classList.add('hidden')
      formRegreso?.classList.remove('hidden')
      btnEditarComision?.classList.remove('hidden')
    } else {
      secAcciones?.classList.add('hidden')
      btnEditarComision?.classList.add('hidden')
    }

    modal.classList.remove('opacity-0', 'pointer-events-none')
  } catch (err: any) {
    alert(err.message || 'Error al cargar los detalles de la comisión')
  }
}

/**
 * Abre el modal de despacho en modo edición con los datos precargados
 */
async function openEditModalForId(id: number) {
  const modalDetail = document.getElementById('modal-detail')
  if (modalDetail) {
    modalDetail.classList.add('opacity-0', 'pointer-events-none')
  }

  try {
    const res = await fetch(`/api/cronograma/${id}`)
    if (!res.ok) throw new Error('Error al cargar datos para edición')
    const c = await res.json()

    const modal = document.getElementById('modal-dispatch')
    const form = document.getElementById('form-dispatch') as HTMLFormElement | null
    const hiddenId = document.getElementById('dispatch-comision-id') as HTMLInputElement | null
    const title = document.getElementById('modal-dispatch-title')
    const subtitle = document.getElementById('modal-dispatch-subtitle')
    const btnSubmitText = document.getElementById('btn-submit-dispatch-text')
    const iconSend = document.getElementById('dispatch-header-icon-send')
    const iconEdit = document.getElementById('dispatch-header-icon-edit')
    const btnIconSend = document.getElementById('btn-submit-icon-send')
    const btnIconSave = document.getElementById('btn-submit-icon-save')
    const errorMsg = document.getElementById('dispatch-error-msg')

    const selectVehiculo = document.getElementById('dispatch-vehiculo') as HTMLSelectElement | null
    const selectChofer = document.getElementById('dispatch-chofer') as HTMLSelectElement | null
    const selectDependencia = document.getElementById('dispatch-dependencia') as HTMLSelectElement | null
    const inputSolicitante = document.getElementById('dispatch-solicitante') as HTMLInputElement | null
    const inputOrigen = document.getElementById('dispatch-origen') as HTMLInputElement | null
    const selectDepto = document.getElementById('dispatch-depto') as HTMLSelectElement | null
    const inputDestino = document.getElementById('dispatch-destino') as HTMLInputElement | null
    const inputSalida = document.getElementById('dispatch-salida') as HTMLInputElement | null
    const inputRegreso = document.getElementById('dispatch-regreso') as HTMLInputElement | null
    const inputPasajeros = document.getElementById('dispatch-pasajeros') as HTMLInputElement | null
    const inputMotivo = document.getElementById('dispatch-motivo') as HTMLInputElement | null
    const inputObservaciones = document.getElementById('dispatch-observaciones') as HTMLTextAreaElement | null

    if (errorMsg) errorMsg.classList.add('hidden')
    form?.reset()

    if (hiddenId) hiddenId.value = String(id)
    if (title) title.innerText = `Editar Comisión Oficial (${c.codigoComision})`
    if (subtitle) subtitle.innerText = 'Modificación de itinerario, chofer, móvil y horarios'
    if (btnSubmitText) btnSubmitText.innerText = 'Guardar Cambios'

    iconSend?.classList.add('hidden')
    iconEdit?.classList.remove('hidden')
    btnIconSend?.classList.add('hidden')
    btnIconSave?.classList.remove('hidden')

    if (selectVehiculo) {
      const currentOpt = selectVehiculo.querySelector(`option[value="${c.vehiculoId}"]`) as HTMLOptionElement | null
      if (currentOpt) currentOpt.disabled = false
      selectVehiculo.value = String(c.vehiculoId)
    }

    if (selectChofer) {
      const currentOpt = selectChofer.querySelector(`option[value="${c.choferId}"]`) as HTMLOptionElement | null
      if (currentOpt) currentOpt.disabled = false
      selectChofer.value = String(c.choferId)
    }

    if (selectDependencia) selectDependencia.value = String(c.dependenciaId)
    if (inputSolicitante) inputSolicitante.value = c.solicitanteNombre || ''
    if (inputOrigen) inputOrigen.value = c.origen || 'Ministerio de Educación - Centro Cívico'
    if (inputDestino) inputDestino.value = c.destino || ''

    if (selectDepto && c.destino) {
      const match = Array.from(selectDepto.options).find((opt) => opt.value && c.destino.startsWith(opt.value))
      if (match) {
        selectDepto.value = match.value
      } else {
        selectDepto.value = ''
      }
    }

    const formatToLocalInput = (dateStr: string | null) => {
      if (!dateStr) return ''
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return ''
      const pad = (n: number) => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    }

    if (inputSalida) inputSalida.value = formatToLocalInput(c.fechaSalidaProgramada)
    if (inputRegreso) inputRegreso.value = formatToLocalInput(c.fechaRegresoEstimada)
    if (inputPasajeros) inputPasajeros.value = String(c.cantidadPasajeros || 1)
    if (inputMotivo) inputMotivo.value = c.motivo || ''
    if (inputObservaciones) inputObservaciones.value = c.observaciones || ''

    if (c.estado === 'en_curso') {
      if (selectVehiculo) selectVehiculo.disabled = true
      if (selectChofer) selectChofer.disabled = true
      if (inputSalida) inputSalida.disabled = true
    } else {
      if (selectVehiculo) selectVehiculo.disabled = false
      if (selectChofer) selectChofer.disabled = false
      if (inputSalida) inputSalida.disabled = false
    }

    if (modal) {
      modal.classList.remove('opacity-0', 'pointer-events-none')
    }
  } catch (err: any) {
    alert(err.message || 'Error al abrir edición de comisión')
  }
}
