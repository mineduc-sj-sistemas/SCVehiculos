/**
 * Controlador de Cliente para la Interfaz de Viajes Asignados por Chofer
 * SCVehiculos · Ministerio de Educación · Gobierno de San Juan
 */

document.addEventListener('DOMContentLoaded', () => {
  initFiltrosYVistas()
  initDetailModal()
})

let currentComisionId: number | null = null

function initFiltrosYVistas() {
  const inputBuscar = document.getElementById('input-buscar-viaje-chofer') as HTMLInputElement | null
  const selectChofer = document.getElementById('select-filtro-chofer') as HTMLSelectElement | null
  const selectEstado = document.getElementById('select-filtro-estado') as HTMLSelectElement | null
  const contadorCards = document.getElementById('contador-choferes-visibles')
  const contadorTable = document.getElementById('contador-tabla-visibles')

  const btnViewCards = document.getElementById('btn-view-cards')
  const btnViewTable = document.getElementById('btn-view-table')
  const vistaCards = document.getElementById('vista-tarjetas-choferes')
  const vistaTable = document.getElementById('vista-tabla-viajes')

  // Alternar vista entre Tarjetas y Tabla
  btnViewCards?.addEventListener('click', () => {
    vistaCards?.classList.remove('hidden')
    vistaTable?.classList.add('hidden')
    btnViewCards.classList.add('bg-white', 'text-navy', 'shadow-xs')
    btnViewCards.classList.remove('text-muted')
    btnViewTable?.classList.remove('bg-white', 'text-navy', 'shadow-xs')
    btnViewTable?.classList.add('text-muted')
  })

  btnViewTable?.addEventListener('click', () => {
    vistaCards?.classList.add('hidden')
    vistaTable?.classList.remove('hidden')
    btnViewTable.classList.add('bg-white', 'text-navy', 'shadow-xs')
    btnViewTable.classList.remove('text-muted')
    btnViewCards?.classList.remove('bg-white', 'text-navy', 'shadow-xs')
    btnViewCards?.classList.add('text-muted')
  })

  // Aplicar filtros en tiempo real
  const choferCards = document.querySelectorAll<HTMLElement>('.card-chofer-asignado')
  const tableRows = document.querySelectorAll<HTMLTableRowElement>('.row-viaje-asignado')

  const aplicarFiltros = () => {
    const texto = inputBuscar?.value.trim().toLowerCase() || ''
    const choferVal = selectChofer?.value || 'all'
    const estadoVal = selectEstado?.value || 'all'

    // 1. Filtrar Tarjetas de Choferes
    let choferesVisibles = 0
    choferCards.forEach((card) => {
      const cardChoferId = card.dataset.choferId || ''
      const cardEsMiViaje = card.dataset.esMiViaje === 'true'
      const cardSearch = (card.dataset.search || '').toLowerCase()

      // Filtro de chofer
      let matchesChofer = true
      if (choferVal === 'mis-viajes') {
        matchesChofer = cardEsMiViaje
      } else if (choferVal !== 'all') {
        matchesChofer = cardChoferId === choferVal
      }

      // Filtro de búsqueda en tarjeta
      const matchesSearch = !texto || cardSearch.includes(texto)

      // Filtro de estado dentro de la tarjeta
      let matchesEstado = true
      if (estadoVal !== 'all') {
        const tieneEstado = card.querySelector(`[data-estado-item="${estadoVal}"]`)
        matchesEstado = !!tieneEstado
      }

      if (matchesChofer && matchesSearch && matchesEstado) {
        card.style.display = ''
        choferesVisibles++
      } else {
        card.style.display = 'none'
      }
    })

    if (contadorCards) {
      contadorCards.innerText = `Mostrando ${choferesVisibles} de ${choferCards.length} conductores`
    }

    // 2. Filtrar Filas de la Tabla Unificada
    let filasVisibles = 0
    tableRows.forEach((row) => {
      const rowChoferId = row.dataset.choferId || ''
      const rowEsMiViaje = row.dataset.esMiViaje === 'true'
      const rowEstado = row.dataset.estado || ''
      const rowSearch = (row.dataset.search || '').toLowerCase()

      let matchesChofer = true
      if (choferVal === 'mis-viajes') {
        matchesChofer = rowEsMiViaje
      } else if (choferVal !== 'all') {
        matchesChofer = rowChoferId === choferVal
      }

      const matchesEstado = estadoVal === 'all' || rowEstado === estadoVal
      const matchesSearch = !texto || rowSearch.includes(texto)

      if (matchesChofer && matchesEstado && matchesSearch) {
        row.style.display = ''
        filasVisibles++
      } else {
        row.style.display = 'none'
      }
    })

    if (contadorTable) {
      contadorTable.innerText = `Mostrando ${filasVisibles} de ${tableRows.length} comisiones`
    }
  }

  inputBuscar?.addEventListener('input', aplicarFiltros)
  selectChofer?.addEventListener('change', aplicarFiltros)
  selectEstado?.addEventListener('change', aplicarFiltros)

  // Botón directo "Mis Viajes" si existe en la interfaz
  document.querySelectorAll<HTMLElement>('.btn-filtrar-mis-viajes').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (selectChofer) {
        selectChofer.value = 'mis-viajes'
        aplicarFiltros()
      }
    })
  })
}

/**
 * Modal de Detalle de Comisión Oficial
 */
function initDetailModal() {
  const modal = document.getElementById('modal-detail')
  const btnClose = document.getElementById('btn-close-detail-modal')
  const btnCloseFooter = document.getElementById('btn-close-detail-modal-footer')
  const btnImprimirHoja = document.getElementById('btn-imprimir-hoja-ruta')

  const closeModal = () => {
    if (!modal) return
    modal.classList.add('opacity-0', 'pointer-events-none')
    currentComisionId = null
  }

  btnClose?.addEventListener('click', closeModal)
  btnCloseFooter?.addEventListener('click', closeModal)
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal()
  })

  // Imprimir Hoja de Ruta oficial A4
  btnImprimirHoja?.addEventListener('click', () => {
    if (currentComisionId) {
      window.open(`/cronograma/imprimir/${currentComisionId}`, '_blank')
    }
  })

  // Clicks en botones "Ver Detalle"
  document.querySelectorAll<HTMLElement>('.btn-ver-detalle-comision').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const id = btn.dataset.id
      if (id) {
        openDetailModalForId(parseInt(id, 10))
      }
    })
  })
}

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
  const checkinsContainer = document.getElementById('detail-checkins-container')

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

    if (elCodigo) elCodigo.innerText = c.codigoComision || `COM-${id}`
    if (elVehiculoPatente) elVehiculoPatente.innerText = c.vehiculoPatente || '--'
    if (elVehiculoModelo) elVehiculoModelo.innerText = c.vehiculoModelo || '--'
    if (elChoferNombre) elChoferNombre.innerText = `${c.choferNombre || ''} ${c.choferApellido || ''}`.trim() || 'No asignado'
    if (elDependenciaNombre) elDependenciaNombre.innerText = c.dependenciaNombre || 'Ministerio de Educación'
    if (elOrigen) elOrigen.innerText = c.origen || 'Centro Cívico'

    if (elDestino) {
      if (c.destino && c.destino.includes(' // ')) {
        const paradas = c.destino.split(' // ')
        elDestino.innerHTML = paradas
          .map((p: string, idx: number) => `
            <div class="flex items-center gap-1.5 py-0.5">
              <span class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orangeGov text-[10px] font-bold">${idx + 1}</span>
              <span class="font-medium text-navy">${p}</span>
            </div>
          `)
          .join('')
      } else {
        elDestino.innerText = c.destino || '--'
      }
    }

    if (elMotivo) elMotivo.innerText = c.motivo || 'Comisión Oficial de Servicio'
    if (elSolicitante) elSolicitante.innerText = c.solicitanteNombre || 'Dirección de Movilidades'
    if (elPasajeros) elPasajeros.innerText = `${c.cantidadPasajeros || 1} personas`
    if (elSalidaProg) elSalidaProg.innerText = formatFechaHora(c.fechaSalidaProgramada)
    if (elSalidaReal) elSalidaReal.innerText = formatFechaHora(c.fechaSalidaReal)
    if (elOdoSalida) elOdoSalida.innerText = c.odometroSalida ? `${Number(c.odometroSalida).toLocaleString('es-AR')} km` : 'Sin registrar'
    if (elRegresoEstimado) elRegresoEstimado.innerText = formatFechaHora(c.fechaRegresoEstimada)
    if (elRegresoReal) elRegresoReal.innerText = formatFechaHora(c.fechaRegresoReal)
    if (elOdoRegreso) elOdoRegreso.innerText = c.odometroRegreso ? `${Number(c.odometroRegreso).toLocaleString('es-AR')} km` : 'Sin registrar'

    if (c.odometroSalida && c.odometroRegreso && c.odometroRegreso >= c.odometroSalida) {
      if (elKmSection) elKmSection.classList.remove('hidden')
      if (elKmTotal) elKmTotal.innerText = `${(c.odometroRegreso - c.odometroSalida).toLocaleString('es-AR')} km`
    } else {
      if (elKmSection) elKmSection.classList.add('hidden')
    }

    if (elObservaciones) {
      elObservaciones.innerText = c.observaciones || 'Sin observaciones registradas.'
    }

    // Badge de estado
    if (elBadgeEstado) {
      elBadgeEstado.className = 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold'
      if (c.estado === 'en_curso') {
        elBadgeEstado.classList.add('bg-blue-100', 'text-blue-800')
        elBadgeEstado.innerText = 'En Curso / En Viaje'
      } else if (c.estado === 'programada') {
        elBadgeEstado.classList.add('bg-amber-100', 'text-amber-800')
        elBadgeEstado.innerText = 'Programada'
      } else if (c.estado === 'finalizada') {
        elBadgeEstado.classList.add('bg-emerald-100', 'text-emerald-800')
        elBadgeEstado.innerText = 'Finalizada'
      } else {
        elBadgeEstado.classList.add('bg-gray-100', 'text-gray-800')
        elBadgeEstado.innerText = c.estado || 'Desconocido'
      }
    }

    // Renderizar Check-ins GPS si existen
    if (checkinsContainer) {
      const checkins = c.checkins || []
      if (checkins.length === 0) {
        checkinsContainer.innerHTML = '<p class="text-[11px] text-muted italic">Aún no se han registrado paradas geolocalizadas para esta comisión.</p>'
      } else {
        checkinsContainer.innerHTML = checkins
          .map((chk: any) => `
            <div class="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-2 text-[11px]">
              <div class="flex items-center gap-2">
                <span class="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">${chk.paradaIndex}</span>
                <div>
                  <p class="font-bold text-navy">${chk.destinoNombre}</p>
                  <p class="text-[10px] text-muted">${new Date(chk.fechaHora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs</p>
                </div>
              </div>
              ${chk.latitud && chk.longitud ? `
                <a href="https://maps.google.com/?q=${chk.latitud},${chk.longitud}" target="_blank" rel="noopener noreferrer" class="flex items-center gap-1 font-bold text-blue hover:underline">
                  <span>GPS</span> 📍
                </a>
              ` : ''}
            </div>
          `)
          .join('')
      }
    }

    // Abrir modal
    modal.classList.remove('opacity-0', 'pointer-events-none')
  } catch (error) {
    console.error('Error al abrir detalle:', error)
    alert('No fue posible cargar el detalle de la comisión.')
  }
}
