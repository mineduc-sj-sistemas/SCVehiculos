/**
 * Controlador de interactividad para la vista de Flota en el Frontend:
 * - Filtrado en tiempo real por texto (patente, marca, modelo, cédula)
 * - Filtro por estado, tipo de vehículo y dependencia
 * - Carga asíncrona de datos en la Ficha Técnica 360° (pestañas mecánica, viajes, nafta)
 * - Control de apertura y precarga del formulario de alta/edición
 */

export function initFlotaController() {
  // -------------------------------------------------------------
  // 1. Filtrado reactivo en el cliente
  // -------------------------------------------------------------
  const searchInput = document.querySelector('#filter-search') as HTMLInputElement | null
  const estadoSelect = document.querySelector('#filter-estado') as HTMLSelectElement | null
  const tipoSelect = document.querySelector('#filter-tipo') as HTMLSelectElement | null
  const depSelect = document.querySelector('#filter-dependencia') as HTMLSelectElement | null
  const clearBtn = document.querySelector('#btn-clear-filters')
  const rows = document.querySelectorAll('.vehicle-row') as NodeListOf<HTMLTableRowElement>
  const visibleCounter = document.querySelector('#visible-count')
  const noResultsBox = document.querySelector('#no-results')

  function applyFilters() {
    const q = searchInput?.value.toLowerCase().trim() || ''
    const estado = estadoSelect?.value || ''
    const tipo = tipoSelect?.value || ''
    const dep = depSelect?.value || ''

    let visibleCount = 0

    rows.forEach((row) => {
      const rowPatente = row.dataset.patente || ''
      const rowMarca = row.dataset.marca || ''
      const rowModelo = row.dataset.modelo || ''
      const rowCedula = row.dataset.cedula || ''
      const rowEstado = row.dataset.estado || ''
      const rowTipo = row.dataset.tipo || ''
      const rowDep = row.dataset.dependencia || ''

      const matchesSearch =
        !q ||
        rowPatente.includes(q) ||
        rowMarca.includes(q) ||
        rowModelo.includes(q) ||
        rowCedula.includes(q)

      const matchesEstado = !estado || rowEstado === estado
      const matchesTipo = !tipo || rowTipo === tipo
      const matchesDep = !dep || rowDep === dep

      if (matchesSearch && matchesEstado && matchesTipo && matchesDep) {
        row.style.display = ''
        visibleCount++
      } else {
        row.style.display = 'none'
      }
    })

    if (visibleCounter) visibleCounter.textContent = String(visibleCount)
    if (noResultsBox) {
      if (visibleCount === 0) noResultsBox.classList.remove('hidden')
      else noResultsBox.classList.add('hidden')
    }
  }

  searchInput?.addEventListener('input', applyFilters)
  estadoSelect?.addEventListener('change', applyFilters)
  tipoSelect?.addEventListener('change', applyFilters)
  depSelect?.addEventListener('change', applyFilters)

  clearBtn?.addEventListener('click', () => {
    if (searchInput) searchInput.value = ''
    if (estadoSelect) estadoSelect.value = ''
    if (tipoSelect) tipoSelect.value = ''
    if (depSelect) depSelect.value = ''
    applyFilters()
  })

  // -------------------------------------------------------------
  // 2. Modal de Detalle (Ficha 360°, Mecánico, Viajes, Combustible)
  // -------------------------------------------------------------
  const detailModal = document.querySelector('#vehicle-detail-modal')

  document.querySelectorAll('.btn-view-detail').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id')
      if (!id) return

      try {
        const res = await fetch(`/api/vehiculos?id=${id}`)
        if (!res.ok) throw new Error('No se pudo cargar el vehículo')
        const data = await res.json()
        const v = data.vehicle

        if (!v) return

        // Encabezado
        const titleEl = document.querySelector('#modal-vehicle-title')
        const plateEl = document.querySelector('#modal-vehicle-plate')
        const statusEl = document.querySelector('#modal-vehicle-status')
        if (titleEl) titleEl.textContent = `${v.marca} ${v.modelo}`
        if (plateEl) plateEl.textContent = v.patente
        if (statusEl) {
          statusEl.textContent = v.estadoLabel
          statusEl.className =
            'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ' +
            (v.tone === 'green'
              ? 'bg-[#e8f7ef] text-[#20864f]'
              : v.tone === 'blue'
                ? 'bg-sky text-blue'
                : 'bg-[#fff0e4] text-[#bf6e32]')
        }

        // Pestaña 1: Info básica y Cédula / RTO
        const cedulaEl = document.querySelector('#info-cedula')
        const rtoEl = document.querySelector('#info-rto')
        const rtoVencEl = document.querySelector('#info-rto-venc')
        const seguroCiaEl = document.querySelector('#info-seguro-cia')
        const seguroPolizaEl = document.querySelector('#info-seguro-poliza')
        const marcaModeloEl = document.querySelector('#info-marca-modelo')
        const versionAnioEl = document.querySelector('#info-version-anio')
        const tipoEl = document.querySelector('#info-tipo')
        const odometroEl = document.querySelector('#info-odometro')
        const combustibleEl = document.querySelector('#info-combustible')
        const tanqueEl = document.querySelector('#info-tanque')
        const pasajerosEl = document.querySelector('#info-pasajeros')
        const dependenciaEl = document.querySelector('#info-dependencia')
        const chasisEl = document.querySelector('#info-chasis')
        const motorEl = document.querySelector('#info-motor')
        const obsEl = document.querySelector('#info-observaciones')

        if (cedulaEl) cedulaEl.textContent = v.numeroCedula || 'CV-S/D'
        if (rtoEl) rtoEl.textContent = v.numeroRto || 'RTO-S/D'
        if (rtoVencEl) rtoVencEl.textContent = `Vence: ${v.vtvFormatted}`
        if (seguroCiaEl) seguroCiaEl.textContent = v.companiaSeguro || 'Nación Seguros'
        if (seguroPolizaEl) seguroPolizaEl.textContent = `Póliza: ${v.numeroPoliza || 'S/D'}`
        if (marcaModeloEl) marcaModeloEl.textContent = `${v.marca} ${v.modelo}`
        if (versionAnioEl) versionAnioEl.textContent = `${v.version || 'Base'} · ${v.anio || 'S/D'}`
        if (tipoEl) tipoEl.textContent = v.tipoNombre
        if (odometroEl) odometroEl.textContent = v.odometroFormatted
        if (combustibleEl) combustibleEl.textContent = v.tipoCombustibleLabel
        if (tanqueEl) tanqueEl.textContent = v.capacidadTanqueLitros ? `${v.capacidadTanqueLitros} L` : 'S/D'
        if (pasajerosEl) pasajerosEl.textContent = `${v.capacidadPasajeros} personas`
        if (dependenciaEl) dependenciaEl.textContent = v.dependenciaNombre
        if (chasisEl) chasisEl.textContent = v.numeroChasis || 'S/D'
        if (motorEl) motorEl.textContent = v.numeroMotor || 'S/D'
        if (obsEl) obsEl.textContent = v.observaciones || 'Sin novedades registradas.'

        // Pestaña 2: Historial Mecánico
        const badgeMecanico = document.querySelector('#badge-count-mecanico')
        if (badgeMecanico) badgeMecanico.textContent = String(data.mantenimientos.length)
        const mecanicoEmpty = document.querySelector('#mecanico-empty')
        const mecanicoTable = document.querySelector('#mecanico-table-container')
        const mecanicoTbody = document.querySelector('#mecanico-tbody')
        if (mecanicoTbody) {
          mecanicoTbody.innerHTML = ''
          if (data.mantenimientos.length === 0) {
            mecanicoEmpty?.classList.remove('hidden')
            mecanicoTable?.classList.add('hidden')
          } else {
            mecanicoEmpty?.classList.add('hidden')
            mecanicoTable?.classList.remove('hidden')
            data.mantenimientos.forEach((m: any) => {
              const tr = document.createElement('tr')
              tr.className = 'hover:bg-paper/40'
              tr.innerHTML = `
                <td class="px-4 py-3 font-bold text-navy">${m.titulo}</td>
                <td class="px-3 py-3 text-muted">${m.tipo}</td>
                <td class="px-3 py-3 text-muted">${m.taller}</td>
                <td class="px-3 py-3 font-mono">${m.odometro}</td>
                <td class="px-3 py-3 text-muted">${m.fecha}</td>
                <td class="px-3 py-3 font-bold text-navy text-right">${m.costoTotal}</td>
                <td class="px-4 py-3 text-right">
                  <span class="rounded px-2 py-0.5 text-[9px] font-bold ${m.estado === 'En taller' ? 'bg-sky text-blue' : 'bg-paper text-muted'}">
                    ${m.estado}
                  </span>
                </td>
              `
              mecanicoTbody.appendChild(tr)
            })
          }
        }

        // Pestaña 3: Historial de Viajes
        const badgeViajes = document.querySelector('#badge-count-viajes')
        if (badgeViajes) badgeViajes.textContent = String(data.viajes.length)
        const viajesEmpty = document.querySelector('#viajes-empty')
        const viajesTable = document.querySelector('#viajes-table-container')
        const viajesTbody = document.querySelector('#viajes-tbody')
        if (viajesTbody) {
          viajesTbody.innerHTML = ''
          if (data.viajes.length === 0) {
            viajesEmpty?.classList.remove('hidden')
            viajesTable?.classList.add('hidden')
          } else {
            viajesEmpty?.classList.add('hidden')
            viajesTable?.classList.remove('hidden')
            data.viajes.forEach((vj: any) => {
              const tr = document.createElement('tr')
              tr.className = 'hover:bg-paper/40'
              tr.innerHTML = `
                <td class="px-4 py-3 font-mono font-bold text-navy">${vj.codigo}</td>
                <td class="px-3 py-3 font-bold text-navy">${vj.destino}</td>
                <td class="px-3 py-3 text-blue truncate max-w-[150px]">${vj.area}</td>
                <td class="px-3 py-3 text-muted">${vj.chofer}</td>
                <td class="px-3 py-3 text-muted">${vj.fechaSalida}</td>
                <td class="px-3 py-3 font-mono">${vj.kmRecorridos}</td>
                <td class="px-4 py-3 text-right">
                  <span class="rounded px-2 py-0.5 text-[9px] font-bold ${vj.estado === 'En viaje' ? 'bg-[#fff6df] text-[#b17b09]' : 'bg-[#e8f7ef] text-[#20864f]'}">
                    ${vj.estado}
                  </span>
                </td>
              `
              viajesTbody.appendChild(tr)
            })
          }
        }

        // Pestaña 4: Combustible
        const badgeCombustible = document.querySelector('#badge-count-combustible')
        if (badgeCombustible) badgeCombustible.textContent = String(data.cargasCombustible.length)
        const combustibleEmpty = document.querySelector('#combustible-empty')
        const combustibleTable = document.querySelector('#combustible-table-container')
        const combustibleTbody = document.querySelector('#combustible-tbody')
        if (combustibleTbody) {
          combustibleTbody.innerHTML = ''
          if (data.cargasCombustible.length === 0) {
            combustibleEmpty?.classList.remove('hidden')
            combustibleTable?.classList.add('hidden')
          } else {
            combustibleEmpty?.classList.add('hidden')
            combustibleTable?.classList.remove('hidden')
            data.cargasCombustible.forEach((c: any) => {
              const tr = document.createElement('tr')
              tr.className = 'hover:bg-paper/40'
              tr.innerHTML = `
                <td class="px-4 py-3 text-muted">${c.fecha}</td>
                <td class="px-3 py-3 font-bold text-navy">${c.estacion}</td>
                <td class="px-3 py-3 font-mono">${c.litros}</td>
                <td class="px-3 py-3 font-bold text-navy">${c.importe}</td>
                <td class="px-3 py-3 font-mono text-muted">${c.odometro}</td>
                <td class="px-4 py-3 text-right font-bold text-[#20864f]">${c.rendimiento}</td>
              `
              combustibleTbody.appendChild(tr)
            })
          }
        }

        // Reset a primera pestaña
        const tabBtns = document.querySelectorAll('#vehicle-detail-modal .tab-btn')
        const tabPanes = document.querySelectorAll('#vehicle-detail-modal .tab-pane')
        tabBtns.forEach((b, idx) => {
          if (idx === 0) {
            b.classList.add('active', 'border-blue', 'text-blue')
            b.classList.remove('border-transparent', 'text-muted')
          } else {
            b.classList.remove('active', 'border-blue', 'text-blue')
            b.classList.add('border-transparent', 'text-muted')
          }
        })
        tabPanes.forEach((p, idx) => {
          if (idx === 0) p.classList.remove('hidden')
          else p.classList.add('hidden')
        })

        // Abrir modal
        if (detailModal) (detailModal as HTMLElement).style.display = 'flex'
      } catch (err) {
        alert('Error al obtener la ficha del vehículo')
      }
    })
  })

  // -------------------------------------------------------------
  // 3. Modal de Alta / Edición de Vehículo
  // -------------------------------------------------------------
  const formModal = document.querySelector('#vehicle-form-modal') as HTMLElement | null
  const form = document.querySelector('#vehicle-form') as HTMLFormElement | null
  const formTitle = document.querySelector('#form-modal-title')
  const submitText = document.querySelector('#btn-submit-text')

  // Abrir para crear
  document.querySelector('#btn-open-create-modal')?.addEventListener('click', () => {
    form?.reset()
    const idInput = document.querySelector('#vehicle-id') as HTMLInputElement | null
    if (idInput) idInput.value = ''
    if (formTitle) formTitle.textContent = 'Registrar Nueva Unidad'
    if (submitText) submitText.textContent = 'Guardar Vehículo'
    if (formModal) formModal.style.display = 'flex'
  })

  // Abrir para editar
  document.querySelectorAll('.btn-edit-vehicle').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id')
      if (!id) return

      try {
        const res = await fetch(`/api/vehiculos?id=${id}`)
        if (!res.ok) throw new Error('No se pudo cargar el vehículo')
        const { vehicle: v } = await res.json()
        if (!v) return

        form?.reset()
        if (formTitle) formTitle.textContent = `Editar Vehículo: ${v.marca} ${v.modelo}`
        if (submitText) submitText.textContent = 'Actualizar Cambios'

        // Precargar campos
        const setValue = (selector: string, value: any) => {
          const el = document.querySelector(selector) as
            | HTMLInputElement
            | HTMLSelectElement
            | HTMLTextAreaElement
            | null
          if (el && value != null) el.value = String(value)
        }

        setValue('#vehicle-id', v.id)
        setValue('#form-patente', v.patente)
        setValue('#form-tipo', v.tipoId)
        setValue('#form-estado', v.estado)
        setValue('#form-marca', v.marca)
        setValue('#form-modelo', v.modelo)
        setValue('#form-version', v.version || '')
        setValue('#form-anio', v.anio || '')
        setValue('#form-cedula', v.numeroCedula || '')
        setValue('#form-rto', v.numeroRto || '')
        setValue('#form-vtv', v.fechaVencimientoVtv ? v.fechaVencimientoVtv.split('T')[0] : '')
        setValue('#form-seguro-cia', v.companiaSeguro || '')
        setValue('#form-seguro-poliza', v.numeroPoliza || '')
        setValue('#form-seguro-venc', v.fechaVencimientoSeguro ? v.fechaVencimientoSeguro.split('T')[0] : '')
        setValue('#form-odometro', v.odometroActual)
        setValue('#form-combustible', v.tipoCombustible)
        setValue('#form-tanque', v.capacidadTanqueLitros || '')
        setValue('#form-pasajeros', v.capacidadPasajeros || 5)
        setValue('#form-chasis', v.numeroChasis || '')
        setValue('#form-motor', v.numeroMotor || '')
        setValue('#form-dependencia', v.dependenciaId || '')
        setValue('#form-observaciones', v.observaciones || '')

        if (formModal) formModal.style.display = 'flex'
      } catch (err) {
        alert('Error al abrir editor de vehículo')
      }
    })
  })
}

// Ejecutar inmediatamente al importar en la página
initFlotaController()
