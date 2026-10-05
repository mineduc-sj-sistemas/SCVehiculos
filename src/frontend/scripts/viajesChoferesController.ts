/**
 * Controlador de Cliente para el Calendario y Mi Historial de Viajes del Chofer
 * SCVehiculos · Ministerio de Educación · Gobierno de San Juan
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavegacionVistas()
  initCalendarioInteractivo()
  initFiltrosHistorial()
  initDetailModal()
})

let currentComisionId: number | null = null

function initNavegacionVistas() {
  const tabCalendario = document.getElementById('btn-tab-calendario')
  const tabHistorial = document.getElementById('btn-tab-historial')
  const tabAgenda = document.getElementById('btn-tab-agenda')

  const vistaCalendario = document.getElementById('vista-calendario-container')
  const vistaHistorial = document.getElementById('vista-historial-container')
  const vistaAgenda = document.getElementById('vista-agenda-container')

  const activarTab = (
    btnActivo: HTMLElement | null,
    vistaActiva: HTMLElement | null
  ) => {
    // Resetear botones
    [tabCalendario, tabHistorial, tabAgenda].forEach((btn) => {
      btn?.classList.remove('bg-white', 'text-navy', 'shadow-xs')
      btn?.classList.add('text-muted')
    })
    // Activar botón seleccionado
    btnActivo?.classList.add('bg-white', 'text-navy', 'shadow-xs')
    btnActivo?.classList.remove('text-muted')

    // Ocultar todas las vistas
    vistaCalendario?.classList.add('hidden')
    vistaHistorial?.classList.add('hidden')
    vistaAgenda?.classList.add('hidden')

    // Mostrar vista seleccionada
    vistaActiva?.classList.remove('hidden')
  }

  tabCalendario?.addEventListener('click', () => activarTab(tabCalendario, vistaCalendario))
  tabHistorial?.addEventListener('click', () => activarTab(tabHistorial, vistaHistorial))
  tabAgenda?.addEventListener('click', () => activarTab(tabAgenda, vistaAgenda))
}

function initCalendarioInteractivo() {
  const dayCells = document.querySelectorAll<HTMLElement>('.celda-dia-calendario')
  const tituloAgenda = document.getElementById('agenda-dia-titulo')
  const listaViajesDia = document.getElementById('agenda-dia-lista-viajes')
  const emptyStateDia = document.getElementById('agenda-dia-empty-state')

  dayCells.forEach((cell) => {
    cell.addEventListener('click', () => {
      dayCells.forEach((c) => c.classList.remove('ring-2', 'ring-orangeGov', 'bg-orange-50/40'))
      cell.classList.add('ring-2', 'ring-orangeGov', 'bg-orange-50/40')

      const fecha = cell.dataset.fecha || ''
      const fechaFormateada = cell.dataset.fechaLabel || fecha
      const viajesJson = cell.dataset.viajesJson

      if (tituloAgenda) {
        tituloAgenda.innerText = `Agenda del ${fechaFormateada}`
      }

      let viajes: any[] = []
      try {
        if (viajesJson) viajes = JSON.parse(viajesJson)
      } catch (e) {
        console.error('Error parseando viajes del día:', e)
      }

      if (viajes.length === 0) {
        if (listaViajesDia) listaViajesDia.innerHTML = ''
        if (emptyStateDia) emptyStateDia.classList.remove('hidden')
      } else {
        if (emptyStateDia) emptyStateDia.classList.add('hidden')
        if (listaViajesDia) {
          listaViajesDia.innerHTML = viajes
            .map((v) => {
              const esNoRealizado = v.estado === 'cancelada' || v.esViajeNoRealizado

              return `
              <div class="rounded-2xl border ${
                v.estado === 'en_curso'
                  ? 'border-blue-200 bg-blue-50/40'
                  : esNoRealizado
                  ? 'border-rose-200 bg-rose-50/30'
                  : 'border-line bg-white'
              } p-4 shadow-xs space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-xs font-bold text-navy">${v.codigo}</span>
                    <span class="rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      v.estado === 'en_curso'
                        ? 'bg-blue-100 text-blue-800'
                        : esNoRealizado
                        ? 'bg-rose-100 text-rose-800'
                        : v.estado === 'programada'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }">
                      ${esNoRealizado ? 'Viaje no realizado' : v.estadoLabel}
                    </span>
                  </div>
                  <span class="rounded-md border border-gray-200 bg-paper px-2 py-0.5 font-mono text-[11px] font-bold text-navy">
                    ${v.vehiculoPatente}
                  </span>
                </div>

                <div class="space-y-1.5 text-xs">
                  <div class="flex items-center gap-1.5 font-semibold text-navy">
                    <span>🚗</span>
                    <span>${v.vehiculoMarca} ${v.vehiculoModelo}</span>
                  </div>
                  <div class="flex items-start gap-1.5 text-navy">
                    <span class="text-orangeGov font-bold">📍</span>
                    <span class="font-medium">${v.destino}</span>
                  </div>
                  ${esNoRealizado ? `
                    <div class="rounded-xl bg-rose-100/70 p-2.5 text-[11px] text-rose-900 border border-rose-200">
                      <strong>⚠️ Motivo:</strong> ${v.motivoCancelacion || 'Viaje no realizado.'}
                    </div>
                  ` : `
                    <div class="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div class="rounded-xl bg-paper/80 p-2 border border-line/60">
                        <span class="text-[10px] font-bold uppercase text-muted block">Salida</span>
                        <span class="font-semibold text-navy">${v.horaSalida} hs</span>
                      </div>
                      <div class="rounded-xl bg-paper/80 p-2 border border-line/60">
                        <span class="text-[10px] font-bold uppercase text-muted block">Regreso Est.</span>
                        <span class="font-semibold text-navy">${v.horaRegreso} hs</span>
                      </div>
                    </div>
                  `}
                  <p class="text-[11px] text-muted pt-1">
                    ${v.solicitanteNombre ? `Solicita: ${v.solicitanteNombre} · ` : ''}${v.cantidadPasajeros} pasajeros
                  </p>
                </div>

                <div class="flex items-center justify-between pt-2 border-t border-line/60">
                  <button
                    type="button"
                    class="btn-ver-detalle-comision text-xs font-bold text-blue hover:underline cursor-pointer"
                    data-id="${v.id}"
                  >
                    Ver Detalle Completo
                  </button>
                  <div class="flex items-center gap-2">
                    ${!esNoRealizado ? `
                      <a
                        href="/cronograma/imprimir/${v.id}"
                        target="_blank"
                        class="rounded-xl border border-line bg-white hover:bg-paper px-2.5 py-1.5 text-[11px] font-bold text-navy shadow-xs transition"
                      >
                        Hoja de Ruta
                      </a>
                    ` : ''}
                    ${v.estado === 'en_curso' ? `
                      <a
                        href="/mi-viaje"
                        class="rounded-xl bg-orangeGov hover:bg-orange-700 px-3 py-1.5 text-[11px] font-bold text-white shadow-xs transition"
                      >
                        Operar Mi Viaje
                      </a>
                    ` : ''}
                  </div>
                </div>
              </div>
            `})
            .join('')

          listaViajesDia.querySelectorAll<HTMLElement>('.btn-ver-detalle-comision').forEach((b) => {
            b.addEventListener('click', () => {
              const id = b.dataset.id
              if (id) openDetailModalForId(parseInt(id, 10))
            })
          })
        }
      }
    })
  })

  // Selector supervisor (si existe)
  const selectSupervisor = document.getElementById('select-chofer-supervisor') as HTMLSelectElement | null
  selectSupervisor?.addEventListener('change', () => {
    const url = new URL(window.location.href)
    url.searchParams.set('choferId', selectSupervisor.value)
    window.location.href = url.toString()
  })
}

function initFiltrosHistorial() {
  const inputBuscar = document.getElementById('input-buscar-historial') as HTMLInputElement | null
  const selectEstado = document.getElementById('select-filtro-estado-historial') as HTMLSelectElement | null
  const itemsHistorial = document.querySelectorAll<HTMLElement>('.card-historial-viaje')
  const contadorHistorial = document.getElementById('contador-historial-visibles')

  const aplicarFiltrosHistorial = () => {
    const texto = inputBuscar?.value.trim().toLowerCase() || ''
    const estado = selectEstado?.value || 'all'

    let visibles = 0
    itemsHistorial.forEach((item) => {
      const search = (item.dataset.search || '').toLowerCase()
      const itemEstado = item.dataset.estado || ''
      const itemEsNoRealizado = item.dataset.esNoRealizado === 'true'

      const matchTexto = !texto || search.includes(texto)

      let matchEstado = true
      if (estado === 'realizados') {
        matchEstado = itemEstado === 'finalizada'
      } else if (estado === 'no_realizados') {
        matchEstado = itemEstado === 'cancelada' || itemEsNoRealizado
      }

      if (matchTexto && matchEstado) {
        item.style.display = ''
        visibles++
      } else {
        item.style.display = 'none'
      }
    })

    if (contadorHistorial) {
      contadorHistorial.innerText = `Mostrando ${visibles} de ${itemsHistorial.length} comisiones históricas`
    }
  }

  inputBuscar?.addEventListener('input', aplicarFiltrosHistorial)
  selectEstado?.addEventListener('change', aplicarFiltrosHistorial)
}

/**
 * Modal de Detalle de Comisión
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

  btnImprimirHoja?.addEventListener('click', () => {
    if (currentComisionId) {
      window.open(`/cronograma/imprimir/${currentComisionId}`, '_blank')
    }
  })

  document.querySelectorAll<HTMLElement>('.btn-ver-detalle-comision').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const id = btn.dataset.id
      if (id) openDetailModalForId(parseInt(id, 10))
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
        elBadgeEstado.innerText = 'Realizado / Finalizado'
      } else if (c.estado === 'cancelada') {
        elBadgeEstado.classList.add('bg-rose-100', 'text-rose-800')
        elBadgeEstado.innerText = 'Viaje no realizado'
      } else {
        elBadgeEstado.classList.add('bg-gray-100', 'text-gray-800')
        elBadgeEstado.innerText = c.estado || 'Desconocido'
      }
    }

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

    modal.classList.remove('opacity-0', 'pointer-events-none')
  } catch (error) {
    console.error('Error al abrir detalle:', error)
    alert('No fue posible cargar el detalle de la comisión.')
  }
}
