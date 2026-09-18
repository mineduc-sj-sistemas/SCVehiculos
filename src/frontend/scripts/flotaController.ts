/**
 * Controlador de interactividad para la vista de Flota en el Frontend:
 * - Conmutador reactivo de vistas (Tarjetas / Cards vs. Tabla)
 * - Filtrado en tiempo real por texto (patente, marca, modelo, cédula, titular, color)
 * - Filtro por estado operativo, Formulario 08, tipo de vehículo y dependencia
 * - Disparo de modales oficiales (Ficha Técnica 360°, Alta y Edición)
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
  // 1. Conmutador de Vistas: Tarjetas (Default) / Tabla
  // -------------------------------------------------------------
  const btnCards = document.querySelector('#view-toggle-cards') as HTMLButtonElement | null
  const btnTable = document.querySelector('#view-toggle-table') as HTMLButtonElement | null
  const containerCards = document.querySelector('#fleet-card-container') as HTMLElement | null
  const containerTable = document.querySelector('#fleet-table-container') as HTMLElement | null

  function setView(mode: 'cards' | 'table') {
    if (mode === 'cards') {
      btnCards?.classList.add('bg-white', 'text-navy', 'shadow-xs')
      btnCards?.classList.remove('text-muted')
      btnTable?.classList.remove('bg-white', 'text-navy', 'shadow-xs')
      btnTable?.classList.add('text-muted')

      if (containerCards) containerCards.classList.remove('hidden')
      if (containerTable) containerTable.classList.add('hidden')
    } else {
      btnTable?.classList.add('bg-white', 'text-navy', 'shadow-xs')
      btnTable?.classList.remove('text-muted')
      btnCards?.classList.remove('bg-white', 'text-navy', 'shadow-xs')
      btnCards?.classList.add('text-muted')

      if (containerTable) containerTable.classList.remove('hidden')
      if (containerCards) containerCards.classList.add('hidden')
    }
    try {
      localStorage.setItem('flota_view_mode', mode)
    } catch (_) {}
  }

  btnCards?.addEventListener('click', () => setView('cards'))
  btnTable?.addEventListener('click', () => setView('table'))

  // Cargar preferencia previa si existe
  try {
    const savedMode = localStorage.getItem('flota_view_mode') as 'cards' | 'table' | null
    if (savedMode === 'table') {
      setView('table')
    } else {
      setView('cards')
    }
  } catch (_) {}

  // -------------------------------------------------------------
  // 2. Filtrado reactivo en el cliente (Tarjetas y Tabla)
  // -------------------------------------------------------------
  const searchInput = document.querySelector('#filter-search') as HTMLInputElement | null
  const estadoSelect = document.querySelector('#filter-estado') as HTMLSelectElement | null
  const filter08Select = document.querySelector('#filter-08') as HTMLSelectElement | null
  const tipoSelect = document.querySelector('#filter-tipo') as HTMLSelectElement | null
  const depSelect = document.querySelector('#filter-dependencia') as HTMLSelectElement | null
  const clearBtn = document.querySelector('#btn-clear-filters')
  const cards = document.querySelectorAll('.vehicle-card') as NodeListOf<HTMLElement>
  const rows = document.querySelectorAll('.vehicle-row') as NodeListOf<HTMLElement>
  const visibleCounter = document.querySelector('#visible-count')
  const noResultsBox = document.querySelector('#no-results')

  function checkMatch(elem: HTMLElement, q: string, estado: string, fil08: string, tipo: string, dep: string) {
    const rowPatente = elem.dataset.patente || ''
    const rowMarca = elem.dataset.marca || ''
    const rowModelo = elem.dataset.modelo || ''
    const rowCedula = elem.dataset.cedula || ''
    const rowTitular = elem.dataset.titular || ''
    const rowRegistro = elem.dataset.registro || ''
    const rowColor = elem.dataset.color || ''
    const rowTiene08 = elem.dataset.tiene08 || '0'
    const rowEstado08 = elem.dataset.estado08 || ''
    const rowSemaforo08 = elem.dataset.semaforo08 || ''
    const rowEstado = elem.dataset.estado || ''
    const rowTipo = elem.dataset.tipo || ''
    const rowDep = elem.dataset.dependencia || ''

    const matchesSearch =
      !q ||
      rowPatente.includes(q) ||
      rowMarca.includes(q) ||
      rowModelo.includes(q) ||
      rowCedula.includes(q) ||
      rowTitular.includes(q) ||
      rowRegistro.includes(q) ||
      rowColor.includes(q)

    const matchesEstado = !estado || rowEstado === estado
    const matchesTipo = !tipo || rowTipo === tipo
    const matchesDep = !dep || rowDep === dep

    let matches08 = true
    if (fil08 === 'con_08') matches08 = rowTiene08 === '1'
    else if (fil08 === 'alerta') matches08 = rowSemaforo08 === 'proxima' || rowSemaforo08 === 'vencido' || rowSemaforo08 === 'vencida'
    else if (fil08 === 'inscripto') matches08 = rowEstado08 === 'inscripto'

    return matchesSearch && matchesEstado && matchesTipo && matchesDep && matches08
  }

  function applyFilters() {
    const q = searchInput?.value.toLowerCase().trim() || ''
    const estado = estadoSelect?.value || ''
    const fil08 = filter08Select?.value || ''
    const tipo = tipoSelect?.value || ''
    const dep = depSelect?.value || ''

    let visibleCount = 0

    cards.forEach((card) => {
      if (checkMatch(card, q, estado, fil08, tipo, dep)) {
        card.style.display = ''
        visibleCount++
      } else {
        card.style.display = 'none'
      }
    })

    rows.forEach((row) => {
      if (checkMatch(row, q, estado, fil08, tipo, dep)) {
        row.style.display = ''
      } else {
        row.style.display = 'none'
      }
    })

    if (visibleCounter) visibleCounter.textContent = String(visibleCount)
    if (noResultsBox) {
      if (cards.length > 0 && visibleCount === 0) noResultsBox.classList.remove('hidden')
      else noResultsBox.classList.add('hidden')
    }
  }

  searchInput?.addEventListener('input', applyFilters)
  estadoSelect?.addEventListener('change', applyFilters)
  filter08Select?.addEventListener('change', applyFilters)
  tipoSelect?.addEventListener('change', applyFilters)
  depSelect?.addEventListener('change', applyFilters)

  clearBtn?.addEventListener('click', () => {
    if (searchInput) searchInput.value = ''
    if (estadoSelect) estadoSelect.value = ''
    if (filter08Select) filter08Select.value = ''
    if (tipoSelect) tipoSelect.value = ''
    if (depSelect) depSelect.value = ''
    applyFilters()
  })

  // -------------------------------------------------------------
  // 3. Delegación de eventos para modales
  // -------------------------------------------------------------
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement | null
    if (!target) return

    // Abrir modal de creación
    if (target.closest && target.closest('#btn-open-create-modal')) {
      if (typeof window.openVehicleCreateModal === 'function') {
        window.openVehicleCreateModal()
      }
      return
    }

    // Abrir modal de edición
    const editBtn = target.closest ? (target.closest('.btn-edit-vehicle') as HTMLElement | null) : null
    if (editBtn) {
      const editId = editBtn.getAttribute('data-id')
      if (editId && typeof window.openVehicleEditModal === 'function') {
        window.openVehicleEditModal(editId)
      }
      return
    }

    // Abrir modal de detalle
    const viewBtn = target.closest ? (target.closest('.btn-view-detail') as HTMLElement | null) : null
    if (viewBtn) {
      const viewId = viewBtn.getAttribute('data-id')
      if (viewId && typeof window.openVehicleDetailModal === 'function') {
        window.openVehicleDetailModal(viewId)
      }
      return
    }
  })
}

// Inicializar automáticamente
initFlotaController()
