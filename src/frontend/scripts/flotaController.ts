/**
 * Controlador de interactividad para la vista de Flota en el Frontend:
 * - Filtrado en tiempo real por texto (patente, marca, modelo, cédula)
 * - Filtro por estado, tipo de vehículo y dependencia
 * - Disparo de modales oficiales (Ficha Técnica 360°, Alta y Edición con Formulario 08)
 */

declare global {
  interface Window {
    openVehicleDetailModal?: (id: string | number) => void
    openVehicleCreateModal?: () => void
    openVehicleEditModal?: (id: string | number) => void
    closeVehicleDetailModal?: () => void
    closeVehicleFormModal?: () => void
  }
}

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
  // 2. Apertura de Ficha Técnica 360°
  // -------------------------------------------------------------
  document.querySelectorAll('.btn-view-detail').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id')
      if (id && window.openVehicleDetailModal) {
        window.openVehicleDetailModal(id)
      }
    })
  })

  // -------------------------------------------------------------
  // 3. Apertura de Formulario de Creación
  // -------------------------------------------------------------
  document.querySelector('#btn-open-create-modal')?.addEventListener('click', () => {
    if (window.openVehicleCreateModal) {
      window.openVehicleCreateModal()
    }
  })

  // -------------------------------------------------------------
  // 4. Apertura de Formulario de Edición
  // -------------------------------------------------------------
  document.querySelectorAll('.btn-edit-vehicle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id')
      if (id && window.openVehicleEditModal) {
        window.openVehicleEditModal(id)
      }
    })
  })
}

// Inicializar automáticamente
initFlotaController()
