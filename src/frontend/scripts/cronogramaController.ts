/**
 * Controlador de Cliente para el Cronograma Semanal y Despacho
 * - Navegación semanal reactiva (<, >, Hoy) y selector de fecha con Flatpickr
 * - Actualización fluida de la grilla vía /api/cronograma sin recargar la página completa
 * - Filtros reactivos por búsqueda (patente, modelo, chofer, departamento) y estado
 * - Modal de despacho rápido de comisiones con precarga de móvil y fecha
 * - Modal de detalle y hoja de ruta con acciones operativas (marcar salida, regreso, cancelación)
 */

import flatpickr from 'flatpickr'
import 'flatpickr/dist/flatpickr.min.css'
import type { CronogramaDiaHeader, CronogramaSemanalData, CronogramaVehiculoRow } from '../../backend/types/cronograma.types'

const SpanishLocale: any = {
  firstDayOfWeek: 1,
  weekdays: {
    shorthand: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'],
    longhand: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  },
  months: {
    shorthand: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    longhand: [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ],
  },
  ordinal: () => 'º',
  rangeSeparator: ' a ',
  weekAbbreviation: 'Sem',
  scrollTitle: 'Desplazar para aumentar',
  toggleTitle: 'Hacer clic para cambiar',
}

function toDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

let fechaSemanaActiva: string = ''
let fpInstance: any = null

document.addEventListener('DOMContentLoaded', () => {
  initCronogramaNav()
  initCronogramaFilters()
  initDispatchModal()
  initDetailModal()

  // Si hay un query param 'fecha' diferente en la URL al cargar, sincronizar
  const urlParams = new URLSearchParams(window.location.search)
  const fechaUrl = urlParams.get('fecha')
  if (fechaUrl && /^\d{4}-\d{2}-\d{2}$/.test(fechaUrl) && fechaUrl !== fechaSemanaActiva) {
    cargarSemana(fechaUrl)
  }
})

/**
 * 1. Navegación Semanal y Selector de Fecha
 */
function initCronogramaNav() {
  const navGroup = document.getElementById('cronograma-nav-group')
  const btnPrev = document.getElementById('btn-semana-prev')
  const btnHoy = document.getElementById('btn-semana-hoy')
  const btnNext = document.getElementById('btn-semana-next')
  const btnOpenPicker = document.getElementById('btn-open-datepicker')
  const inputPicker = document.getElementById('input-fecha-picker') as HTMLInputElement | null
  const btnRecargar = document.getElementById('btn-recargar-cronograma')
  const btnImprimir = document.getElementById('btn-imprimir-cronograma')

  fechaSemanaActiva = navGroup?.dataset.fechaInicio || toDateString(new Date())

  // Inicializar Flatpickr
  if (inputPicker) {
    fpInstance = flatpickr(inputPicker, {
      locale: SpanishLocale,
      dateFormat: 'Y-m-d',
      defaultDate: fechaSemanaActiva,
      disableMobile: true,
      onChange: (_selectedDates, dateStr) => {
        if (dateStr) {
          cargarSemana(dateStr)
        }
      },
    })

    btnOpenPicker?.addEventListener('click', (e) => {
      e.stopPropagation()
      fpInstance?.open()
    })
  }

  const getBaseDate = (): Date => {
    if (fechaSemanaActiva && /^\d{4}-\d{2}-\d{2}$/.test(fechaSemanaActiva)) {
      const [y, m, d] = fechaSemanaActiva.split('-').map(Number)
      return new Date(y, m - 1, d, 12, 0, 0)
    }
    return new Date()
  }

  // Navegación semana anterior
  btnPrev?.addEventListener('click', () => {
    const d = getBaseDate()
    d.setDate(d.getDate() - 7)
    cargarSemana(toDateString(d))
  })

  // Navegación semana siguiente
  btnNext?.addEventListener('click', () => {
    const d = getBaseDate()
    d.setDate(d.getDate() + 7)
    cargarSemana(toDateString(d))
  })

  // Botón Esta Semana / Hoy
  btnHoy?.addEventListener('click', () => {
    const hoyStr = toDateString(new Date())
    cargarSemana(hoyStr)
  })

  // Recargar
  btnRecargar?.addEventListener('click', () => {
    cargarSemana(fechaSemanaActiva)
  })

  // Imprimir
  btnImprimir?.addEventListener('click', () => {
    window.print()
  })
}

/**
 * Carga asíncrona de datos de la semana y re-renderizado reactivo de la grilla
 */
async function cargarSemana(fechaRef: string) {
  const tbody = document.getElementById('tbody-cronograma')
  const thead = document.querySelector('#tabla-cronograma thead')
  const labelSemana = document.getElementById('label-semana-activa')
  const navGroup = document.getElementById('cronograma-nav-group')

  // Indicador visual de carga suave
  if (tbody) tbody.classList.add('opacity-40', 'transition-opacity')

  try {
    const res = await fetch(`/api/cronograma?fecha=${fechaRef}`)
    if (!res.ok) throw new Error('Error al consultar datos de la semana')
    const data: CronogramaSemanalData = await res.json()

    fechaSemanaActiva = data.rangoSemana.inicio
    if (navGroup) navGroup.dataset.fechaInicio = fechaSemanaActiva
    if (fpInstance) fpInstance.setDate(fechaSemanaActiva, false)

    // 1. Actualizar título del rango
    if (labelSemana) labelSemana.innerText = data.rangoSemana.label

    // 2. Actualizar KPIs superiores
    const elKpiTotal = document.getElementById('kpi-total-semana')
    const elKpiEnCurso = document.getElementById('kpi-en-curso')
    const elKpiProgramadas = document.getElementById('kpi-programadas')
    const elKpiMoviles = document.getElementById('kpi-moviles')

    if (elKpiTotal) elKpiTotal.innerText = String(data.stats.totalComisionesSemana)
    if (elKpiEnCurso) elKpiEnCurso.innerText = String(data.stats.enCursoHoy)
    if (elKpiProgramadas) elKpiProgramadas.innerText = String(data.stats.programadasSemana)
    if (elKpiMoviles) {
      elKpiMoviles.innerHTML = `${data.stats.vehiculosAsignadosSemana} <span class="text-xs font-normal text-muted">/ ${data.stats.vehiculosOperativos} disp.</span>`
    }

    // 3. Actualizar cabecera de días (thead)
    if (thead) {
      renderTheadDias(thead, data.dias, data.filas.length)
    }

    // 4. Actualizar cuerpo de la grilla (tbody)
    if (tbody) {
      renderTbodyFilas(tbody, data.dias, data.filas)
    }

    // 5. Re-asociar eventos de modales a los nuevos elementos del DOM
    bindGridEvents()

    // 6. Aplicar filtros vigentes
    aplicarFiltrosActivos()

    // 7. Sincronizar URL del navegador
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.set('fecha', data.rangoSemana.inicio)
    window.history.replaceState({}, '', currentUrl.toString())
  } catch (err: any) {
    console.error('Error al cargar semana:', err)
    alert(err.message || 'Error al cargar la semana seleccionada')
  } finally {
    if (tbody) tbody.classList.remove('opacity-40')
  }
}

/**
 * Renderiza las columnas del thead para los 7 días
 */
function renderTheadDias(thead: Element, dias: CronogramaDiaHeader[], totalMoviles: number) {
  const tr = thead.querySelector('tr')
  if (!tr) return

  let html = `
    <th class="sticky left-0 z-20 w-[240px] min-w-[240px] bg-gray-50/95 px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-navy shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] border-r border-gray-200">
      <div class="flex items-center justify-between">
        <span>Móvil / Vehículo</span>
        <span class="text-[10px] font-normal text-muted lowercase">(${totalMoviles} móviles)</span>
      </div>
    </th>
  `

  dias.forEach((d) => {
    const bgClass = d.esHoy ? 'bg-blue/10 border-blue/30' : d.esFinDeSemana ? 'bg-gray-100/50' : 'bg-gray-50/50'
    const textDayClass = d.esHoy ? 'text-blue' : 'text-gray-600'
    const numBadgeClass = d.esHoy ? 'bg-blue text-white shadow-sm' : 'text-navy'

    html += `
      <th class="w-[180px] min-w-[170px] px-3 py-3 text-center border-r border-gray-200 transition-colors ${bgClass}">
        <div class="flex flex-col items-center justify-center gap-0.5">
          <span class="text-[11px] uppercase tracking-wider font-bold ${textDayClass}">
            ${d.diaNombre}
          </span>
          <div class="flex items-center gap-1.5">
            <span class="inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold transition ${numBadgeClass}">
              ${d.diaNumero}
            </span>
            <span class="text-[10px] font-medium text-muted">${d.mesNombre}</span>
          </div>
          ${d.esHoy ? '<span class="inline-flex items-center rounded-full bg-gold/25 px-2 py-0.5 text-[9px] font-bold text-navy mt-0.5 border border-gold/40">HOY</span>' : ''}
        </div>
      </th>
    `
  })

  tr.innerHTML = html
}

/**
 * Renderiza las filas de la tabla para los vehículos y comisiones
 */
function renderTbodyFilas(tbody: HTMLElement, dias: CronogramaDiaHeader[], filas: CronogramaVehiculoRow[]) {
  if (filas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="py-12 text-center text-muted">
          <p class="font-bold text-navy text-sm">No se encontraron vehículos registrados</p>
          <p class="text-xs">Registre unidades en la sección de Vehículos para comenzar a despachar comisiones.</p>
        </td>
      </tr>
    `
    return
  }

  let html = ''
  filas.forEach((v) => {
    const isTaller = v.estadoVehiculo === 'en_taller'

    html += `
      <tr
        class="group hover:bg-gray-50/40 transition-colors fila-vehiculo"
        data-patente="${v.patente.toLowerCase()}"
        data-modelo="${v.marca.toLowerCase()} ${v.modelo.toLowerCase()}"
        data-estado="${v.estadoVehiculo}"
      >
        <td class="sticky left-0 z-10 bg-white group-hover:bg-gray-50/90 transition-colors px-4 py-3.5 border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] align-top">
          <div class="space-y-1.5">
            <div class="flex items-center justify-between gap-1">
              <span class="inline-flex items-center rounded border border-navy/20 bg-navy/5 px-2 py-0.5 font-mono text-xs font-bold text-navy">
                ${v.patente}
              </span>
              ${isTaller ? `
                <span class="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                  <span>En taller</span>
                </span>
              ` : `
                <span class="text-[10px] font-medium text-muted">
                  ${v.capacidadPasajeros} pas.
                </span>
              `}
            </div>
            <div>
              <p class="font-bold text-navy leading-tight">${v.marca} ${v.modelo}</p>
              <p class="text-[10px] text-muted">${v.tipoVehiculo} · ${v.odometroActual.toLocaleString('es-AR')} km</p>
            </div>
          </div>
        </td>
    `

    dias.forEach((d) => {
      const comisiones = v.comisionesPorDia[d.fecha] || []
      const hasComisiones = comisiones.length > 0
      const tdClass = `${d.esHoy ? 'bg-blue/[0.02]' : ''} ${isTaller ? 'bg-amber-50/20' : ''}`

      html += `<td class="px-2 py-2 border-r border-gray-200 align-top transition-colors ${tdClass}">`

      if (isTaller) {
        html += `
          <div class="flex flex-col items-center justify-center rounded-lg border border-dashed border-amber-300 bg-amber-50/60 p-2 text-center text-amber-800">
            <span class="text-[10px] font-bold">En Servicio Técnico</span>
            <span class="text-[9px] text-amber-700/80">No disponible</span>
          </div>
        `
      } else if (hasComisiones) {
        html += '<div class="space-y-2">'
        comisiones.forEach((c: any) => {
          const isEnCurso = c.estado === 'en_curso'
          const isProgramada = c.estado === 'programada'
          const isFinalizada = c.estado === 'finalizada'

          const cardStyle = isEnCurso
            ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50/60 text-amber-950 ring-1 ring-amber-400/30'
            : isProgramada
            ? 'border-blue/30 bg-blue/5 text-navy hover:border-blue'
            : 'border-emerald-200 bg-emerald-50/50 text-emerald-950'

          const badgeHtml = isEnCurso
            ? '<span class="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-800 border border-amber-500/30 animate-pulse">En viaje</span>'
            : isProgramada
            ? '<span class="inline-flex items-center gap-1 rounded-full bg-blue/15 px-1.5 py-0.5 text-[9px] font-bold text-blue">Programada</span>'
            : '<span class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">Finalizada</span>'

          const horaSalida = new Date(c.fechaSalidaProgramada).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

          html += `
            <div
              class="group/card relative rounded-xl border p-2.5 transition-all cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 card-comision ${cardStyle}"
              data-comision-id="${c.id}"
              data-chofer="${c.choferNombre.toLowerCase()} ${c.choferApellido.toLowerCase()}"
              data-destino="${c.destino.toLowerCase()}"
              data-estado="${c.estado}"
              title="Click para ver hoja de ruta y opciones"
            >
              <div class="flex items-center justify-between gap-1 mb-1.5">
                <span class="font-mono text-[9px] font-bold text-muted">${c.codigoComision}</span>
                ${badgeHtml}
              </div>
              <div class="flex items-start gap-1 font-bold text-navy text-[11px] leading-tight mb-1">
                <span class="line-clamp-1">${c.destino}</span>
              </div>
              <div class="flex items-center gap-1 text-[10px] text-gray-700 font-medium mb-1">
                <span class="truncate">${c.choferNombre} ${c.choferApellido}</span>
              </div>
              <div class="flex items-center justify-between text-[9px] text-muted border-t border-black/5 pt-1 mt-1">
                <span class="truncate">${c.dependenciaNombre.replace('Dirección de ', 'Dir. ')}</span>
                <span class="font-bold text-navy">${horaSalida} hs</span>
              </div>
            </div>
          `
        })

        html += `
          <button
            type="button"
            class="w-full rounded-lg border border-dashed border-gray-200 py-1 text-[10px] font-semibold text-gray-400 hover:border-blue hover:text-blue hover:bg-blue/5 transition cursor-pointer flex items-center justify-center gap-1 btn-asignar-celda"
            data-vehiculo-id="${v.vehiculoId}"
            data-vehiculo-patente="${v.patente}"
            data-fecha="${d.fecha}"
            title="Asignar otro servicio para este día"
          >
            <span>+ Otro viaje</span>
          </button>
        </div>`
      } else {
        html += `
          <button
            type="button"
            class="group/slot flex h-24 w-full flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-transparent text-gray-300 hover:border-blue/60 hover:bg-blue/[0.04] hover:text-blue transition-all cursor-pointer btn-asignar-celda"
            data-vehiculo-id="${v.vehiculoId}"
            data-vehiculo-patente="${v.patente}"
            data-fecha="${d.fecha}"
            title="Asignar comisión a ${v.patente} el ${d.diaNombre} ${d.diaNumero}"
          >
            <div class="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 group-hover/slot:bg-blue group-hover/slot:text-white transition-colors mb-1 font-bold">
              +
            </div>
            <span class="text-[10px] font-bold opacity-0 group-hover/slot:opacity-100 transition-opacity">
              Asignar
            </span>
            <span class="text-[9px] text-gray-400 group-hover/slot:opacity-0 transition-opacity">
              Disponible
            </span>
          </button>
        `
      }

      html += '</td>'
    })

    html += '</tr>'
  })

  tbody.innerHTML = html
}

/**
 * 2. Filtros en vivo del Cronograma
 */
function initCronogramaFilters() {
  const inputFiltro = document.getElementById('input-filtro-cronograma') as HTMLInputElement | null
  const selectEstado = document.getElementById('select-estado-filtro') as HTMLSelectElement | null

  inputFiltro?.addEventListener('input', aplicarFiltrosActivos)
  selectEstado?.addEventListener('change', aplicarFiltrosActivos)
}

function aplicarFiltrosActivos() {
  const inputFiltro = document.getElementById('input-filtro-cronograma') as HTMLInputElement | null
  const selectEstado = document.getElementById('select-estado-filtro') as HTMLSelectElement | null
  const filasVehiculo = document.querySelectorAll<HTMLTableRowElement>('.fila-vehiculo')

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

    if (estadoFiltro !== 'todos') {
      fila.style.display = tieneComisionVisible ? '' : 'none'
    } else {
      fila.style.display = (!query || filaCoincideTexto) ? '' : 'none'
    }
  })
}

/**
 * 3. Modal de Despacho (Nueva Comisión / Editar Comisión) - Modo Wizard por Pasos
 */
let currentDispatchStep = 1

function setWizardStep(step: number) {
  currentDispatchStep = Math.max(1, Math.min(4, step))

  // 1. Mostrar/ocultar panes
  for (let i = 1; i <= 4; i++) {
    const pane = document.getElementById(`dispatch-step-pane-${i}`)
    if (pane) {
      if (i === currentDispatchStep) {
        pane.classList.remove('hidden')
      } else {
        pane.classList.add('hidden')
      }
    }

    const indicator = document.getElementById(`step-indicator-${i}`)
    const numSpan = indicator?.querySelector('.step-number') as HTMLElement | null
    const checkIcon = indicator?.querySelector('.step-check') as HTMLElement | null
    const label = document.getElementById(`step-label-${i}`)

    if (indicator) {
      if (i < currentDispatchStep) {
        // Completado
        indicator.className = 'flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold shadow-xs ring-2 ring-emerald-100 transition-all'
        numSpan?.classList.add('hidden')
        checkIcon?.classList.remove('hidden')
        if (label) {
          label.className = 'text-[10px] font-bold text-emerald-700 whitespace-nowrap'
        }
      } else if (i === currentDispatchStep) {
        // Activo
        indicator.className = 'flex h-7 w-7 items-center justify-center rounded-full bg-orangeGov text-white text-xs font-black shadow-sm ring-4 ring-orange-100 transition-all'
        numSpan?.classList.remove('hidden')
        checkIcon?.classList.add('hidden')
        if (label) {
          label.className = 'text-[10px] font-bold text-navy whitespace-nowrap'
        }
      } else {
        // Futuro / Pendiente
        indicator.className = 'flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-gray-600 text-xs font-bold transition-all'
        numSpan?.classList.remove('hidden')
        checkIcon?.classList.add('hidden')
        if (label) {
          label.className = 'text-[10px] font-medium text-gray-500 whitespace-nowrap'
        }
      }
    }
  }

  // 2. Barra de progreso conectora
  const progressBar = document.getElementById('dispatch-wizard-progress')
  if (progressBar) {
    const percentages = ['0%', '33.3%', '66.6%', '100%']
    progressBar.style.width = percentages[currentDispatchStep - 1]
  }

  // 3. Botones de navegación
  const btnPrev = document.getElementById('btn-wizard-prev')
  const btnNext = document.getElementById('btn-wizard-next')
  const btnSubmit = document.getElementById('btn-submit-dispatch')

  if (btnPrev) {
    if (currentDispatchStep === 1) {
      btnPrev.classList.add('hidden')
      btnPrev.classList.remove('flex')
    } else {
      btnPrev.classList.remove('hidden')
      btnPrev.classList.add('flex')
    }
  }

  if (btnNext) {
    if (currentDispatchStep === 4) {
      btnNext.classList.add('hidden')
      btnNext.classList.remove('flex')
    } else {
      btnNext.classList.remove('hidden')
      btnNext.classList.add('flex')
    }
  }

  if (btnSubmit) {
    if (currentDispatchStep === 4) {
      btnSubmit.classList.remove('hidden')
      btnSubmit.classList.add('flex')
    } else {
      btnSubmit.classList.add('hidden')
      btnSubmit.classList.remove('flex')
    }
  }

  // 4. Actualizar resumen si estamos en el paso 4
  if (currentDispatchStep === 4) {
    updateDispatchSummaryBox()
  }
}

function updateDispatchSummaryBox() {
  const selectVehiculo = document.getElementById('dispatch-vehiculo') as HTMLSelectElement | null
  const selectChofer = document.getElementById('dispatch-chofer') as HTMLSelectElement | null
  const selectDependencia = document.getElementById('dispatch-dependencia') as HTMLSelectElement | null
  const inputOrigen = document.getElementById('dispatch-origen') as HTMLInputElement | null
  const inputDestino = document.getElementById('dispatch-destino') as HTMLInputElement | null
  const selectDepto = document.getElementById('dispatch-depto') as HTMLSelectElement | null

  const sumMovil = document.getElementById('summary-movil')
  const sumChofer = document.getElementById('summary-chofer')
  const sumDep = document.getElementById('summary-dep')
  const sumDestino = document.getElementById('summary-destino')

  if (sumMovil) {
    const selectedOption = selectVehiculo?.selectedOptions[0]
    sumMovil.innerText = selectedOption && selectVehiculo?.value ? selectedOption.innerText.split('(')[0].trim() : 'No asignado'
  }
  if (sumChofer) {
    const selectedOption = selectChofer?.selectedOptions[0]
    sumChofer.innerText = selectedOption && selectChofer?.value ? selectedOption.innerText.split('(')[0].trim() : 'No asignado'
  }
  if (sumDep) {
    const selectedOption = selectDependencia?.selectedOptions[0]
    sumDep.innerText = selectedOption && selectDependencia?.value ? selectedOption.innerText.trim() : 'No asignada'
  }
  if (sumDestino) {
    const origen = inputOrigen?.value.trim() || 'Centro Cívico'
    const destino = inputDestino?.value.trim() || (selectDepto?.value ? selectDepto.value : 'Sin destino')
    sumDestino.innerText = `${origen} ➔ ${destino}`
  }
}

function validateDispatchStep(step: number): boolean {
  const errorMsg = document.getElementById('dispatch-error-msg')
  const errorText = document.getElementById('dispatch-error-text')

  const showError = (msg: string, elementToFocus?: HTMLElement | null) => {
    if (errorMsg && errorText) {
      errorText.innerText = msg
      errorMsg.classList.remove('hidden')
    }
    elementToFocus?.focus()
    return false
  }

  if (errorMsg) errorMsg.classList.add('hidden')

  if (step === 1) {
    const selectVehiculo = document.getElementById('dispatch-vehiculo') as HTMLSelectElement | null
    const selectChofer = document.getElementById('dispatch-chofer') as HTMLSelectElement | null
    if (!selectVehiculo || !selectVehiculo.value) {
      return showError('Debe seleccionar un vehículo oficial disponible.', selectVehiculo)
    }
    if (!selectChofer || !selectChofer.value) {
      return showError('Debe seleccionar un chofer oficial habilitado.', selectChofer)
    }
  }

  if (step === 2) {
    const selectDependencia = document.getElementById('dispatch-dependencia') as HTMLSelectElement | null
    if (!selectDependencia || !selectDependencia.value) {
      return showError('Debe seleccionar el área o dependencia solicitante.', selectDependencia)
    }
  }

  if (step === 3) {
    const inputOrigen = document.getElementById('dispatch-origen') as HTMLInputElement | null
    const selectDepto = document.getElementById('dispatch-depto') as HTMLSelectElement | null
    const inputDestino = document.getElementById('dispatch-destino') as HTMLInputElement | null

    if (!inputOrigen || !inputOrigen.value.trim()) {
      return showError('Indique el lugar específico de salida.', inputOrigen)
    }
    if (!selectDepto || !selectDepto.value) {
      return showError('Seleccione el departamento de destino de San Juan.', selectDepto)
    }
    if (!inputDestino || !inputDestino.value.trim()) {
      return showError('Indique el destino específico, escuela o localidad a visitar.', inputDestino)
    }
  }

  if (step === 4) {
    const inputSalida = document.getElementById('dispatch-salida') as HTMLInputElement | null
    const inputRegreso = document.getElementById('dispatch-regreso') as HTMLInputElement | null
    const inputPasajeros = document.getElementById('dispatch-pasajeros') as HTMLInputElement | null
    const inputMotivo = document.getElementById('dispatch-motivo') as HTMLInputElement | null

    if (!inputSalida || !inputSalida.value) {
      return showError('Indique la fecha y hora de salida programada.', inputSalida)
    }
    if (!inputRegreso || !inputRegreso.value) {
      return showError('Indique la fecha y hora estimada de regreso.', inputRegreso)
    }
    if (new Date(inputRegreso.value) <= new Date(inputSalida.value)) {
      return showError('La fecha y hora de regreso debe ser posterior a la de salida.', inputRegreso)
    }
    if (!inputPasajeros || !inputPasajeros.value || parseInt(inputPasajeros.value, 10) < 1) {
      return showError('Debe indicar al menos 1 pasajero previsto.', inputPasajeros)
    }
    if (!inputMotivo || !inputMotivo.value.trim()) {
      return showError('Indique el motivo o misión oficial del viaje.', inputMotivo)
    }
  }

  return true
}

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
  const capBadge = document.getElementById('dispatch-vehiculo-cap-badge')

  if (hiddenId) hiddenId.value = ''
  if (title) title.innerText = 'Despachar Nueva Comisión Oficial'
  if (subtitle) subtitle.innerText = 'Asignación de móvil, conductor y emisión de hoja de ruta ministerial'
  if (btnSubmitText) btnSubmitText.innerText = 'Generar Despacho'
  iconSend?.classList.remove('hidden')
  iconEdit?.classList.add('hidden')
  btnIconSend?.classList.remove('hidden')
  btnIconSave?.classList.add('hidden')

  if (selectVehiculo) selectVehiculo.disabled = false
  if (selectChofer) selectChofer.disabled = false
  if (inputSalida) inputSalida.disabled = false
  if (capBadge) capBadge.innerText = ''

  setWizardStep(1)
}

function initDispatchModal() {
  const modal = document.getElementById('modal-dispatch')
  const form = document.getElementById('form-dispatch') as HTMLFormElement | null
  const btnOpen = document.getElementById('btn-abrir-nueva-comision')
  const btnClose = document.getElementById('btn-close-dispatch-modal')
  const btnCancel = document.getElementById('btn-cancel-dispatch')
  const btnPrev = document.getElementById('btn-wizard-prev')
  const btnNext = document.getElementById('btn-wizard-next')
  const errorMsg = document.getElementById('dispatch-error-msg')
  const errorText = document.getElementById('dispatch-error-text')

  const selectVehiculo = document.getElementById('dispatch-vehiculo') as HTMLSelectElement | null
  const selectChofer = document.getElementById('dispatch-chofer') as HTMLSelectElement | null
  const selectOrigenDepto = document.getElementById('dispatch-origen-depto') as HTMLSelectElement | null
  const inputOrigen = document.getElementById('dispatch-origen') as HTMLInputElement | null
  const selectDepto = document.getElementById('dispatch-depto') as HTMLSelectElement | null
  const inputDestino = document.getElementById('dispatch-destino') as HTMLInputElement | null
  const inputSalida = document.getElementById('dispatch-salida') as HTMLInputElement | null
  const inputRegreso = document.getElementById('dispatch-regreso') as HTMLInputElement | null
  const inputPasajeros = document.getElementById('dispatch-pasajeros') as HTMLInputElement | null
  const capBadge = document.getElementById('dispatch-vehiculo-cap-badge')

  const openModal = () => {
    if (!modal) return
    modal.classList.remove('opacity-0', 'pointer-events-none')
    if (errorMsg) errorMsg.classList.add('hidden')
    setWizardStep(1)
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

  // Navegación Wizard: Anterior
  btnPrev?.addEventListener('click', () => {
    if (currentDispatchStep > 1) {
      if (errorMsg) errorMsg.classList.add('hidden')
      setWizardStep(currentDispatchStep - 1)
    }
  })

  // Navegación Wizard: Siguiente
  btnNext?.addEventListener('click', () => {
    if (validateDispatchStep(currentDispatchStep)) {
      setWizardStep(currentDispatchStep + 1)
    }
  })

  // Clicks directos en botones del stepper
  document.querySelectorAll('.step-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetStep = parseInt(btn.getAttribute('data-step-target') || '1', 10)
      if (targetStep < currentDispatchStep) {
        if (errorMsg) errorMsg.classList.add('hidden')
        setWizardStep(targetStep)
      } else if (targetStep > currentDispatchStep) {
        // Validar paso actual antes de permitir saltar hacia adelante
        if (validateDispatchStep(currentDispatchStep)) {
          setWizardStep(targetStep)
        }
      }
    })
  })

  // Actualizar capacidad al cambiar móvil
  selectVehiculo?.addEventListener('change', () => {
    const selectedOpt = selectVehiculo.selectedOptions[0]
    const cap = selectedOpt?.getAttribute('data-capacidad')
    if (cap) {
      if (capBadge) capBadge.innerText = `Capacidad máx: ${cap} pas.`
      if (inputPasajeros) inputPasajeros.max = cap
    } else {
      if (capBadge) capBadge.innerText = ''
      if (inputPasajeros) inputPasajeros.max = '30'
    }
  })

  // Sincronizar Departamento de Salida
  selectOrigenDepto?.addEventListener('change', () => {
    if (selectOrigenDepto.value && inputOrigen) {
      if (selectOrigenDepto.value === 'Capital') {
        inputOrigen.value = 'Ministerio de Educación - Centro Cívico'
      } else {
        inputOrigen.value = `Sede Departamental ${selectOrigenDepto.value}`
      }
    }
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

  // Envío del formulario (Creación o Edición)
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
      solicitanteNombre: formData.get('solicitanteNombre'),
      origen: formData.get('origen'),
      destino: formData.get('destino'),
      motivo: formData.get('motivo'),
      cantidadPasajeros: formData.get('cantidadPasajeros'),
      fechaSalidaProgramada: inputSalida?.value || formData.get('fechaSalidaProgramada'),
      fechaRegresoEstimada: formData.get('fechaRegresoEstimada'),
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
      // Recargar la semana de inmediato sin recargar toda la página
      cargarSemana(fechaSemanaActiva)

      // Si se editó, re-abrir el detalle para reflejar de inmediato los datos modificados
      if (comisionId) {
        openDetailModalForId(parseInt(comisionId, 10))
      }
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

  bindGridEvents()
}

/**
 * Vincula los eventos de click en las celdas y cards de la grilla
 */
function bindGridEvents() {
  const modalDispatch = document.getElementById('modal-dispatch')
  const form = document.getElementById('form-dispatch') as HTMLFormElement | null
  const selectVehiculo = document.getElementById('dispatch-vehiculo') as HTMLSelectElement | null
  const inputSalida = document.getElementById('dispatch-salida') as HTMLInputElement | null
  const inputRegreso = document.getElementById('dispatch-regreso') as HTMLInputElement | null

  // 1. Click en botones "+ Asignar" o "+ Otro viaje"
  document.querySelectorAll<HTMLElement>('.btn-asignar-celda').forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation()
      form?.reset()
      resetDispatchModalToCreate()

      const vehiculoId = btn.dataset.vehiculoId
      const fecha = btn.dataset.fecha

      if (selectVehiculo && vehiculoId) {
        selectVehiculo.value = vehiculoId
      }

      if (fecha) {
        if (inputSalida) inputSalida.value = `${fecha}T08:00`
        if (inputRegreso) inputRegreso.value = `${fecha}T17:00`
      }

      if (modalDispatch) {
        modalDispatch.classList.remove('opacity-0', 'pointer-events-none')
      }
    }
  })

  // 2. Click en tarjetas de comisión
  document.querySelectorAll<HTMLElement>('.card-comision').forEach((card) => {
    card.onclick = () => {
      const id = card.dataset.comisionId
      if (id) {
        openDetailModalForId(parseInt(id, 10))
      }
    }
  })
}

/**
 * 4. Modal de Detalle y Hoja de Ruta
 */
let detailModalInitialized = false
let currentComisionId: number | null = null

function initDetailModal() {
  if (detailModalInitialized) return
  detailModalInitialized = true

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
      closeModal()
      cargarSemana(fechaSemanaActiva)
    } catch (err: any) {
      alert(err.message || 'Error al registrar salida')
    }
  })

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
      closeModal()
      cargarSemana(fechaSemanaActiva)
    } catch (err: any) {
      alert(err.message || 'Error al registrar regreso')
    }
  })

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
      closeModal()
      cargarSemana(fechaSemanaActiva)
    } catch (err: any) {
      alert(err.message || 'Error al cancelar comisión')
    }
  })

  btnImprimirHoja?.addEventListener('click', () => {
    if (currentComisionId) {
      window.open(`/cronograma/imprimir/${currentComisionId}`, '_blank')
    }
  })

  const btnEditarComision = document.getElementById('btn-editar-comision')
  btnEditarComision?.addEventListener('click', () => {
    if (currentComisionId) {
      openEditModalForId(currentComisionId)
    }
  })
}

async function openDetailModalForId(id: number) {
  const modal = document.getElementById('modal-detail')
  currentComisionId = id
  if (modal) modal.classList.remove('opacity-0', 'pointer-events-none')

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
  const btnCancelarComision = document.getElementById('btn-cancelar-comision')
  const btnEditarComision = document.getElementById('btn-editar-comision')

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

    if (elKmSection && elKmTotal) {
      if (c.kmRecorridos !== null && c.kmRecorridos !== undefined) {
        elKmTotal.innerText = `${c.kmRecorridos.toLocaleString('es-AR')} km`
        elKmSection.classList.remove('hidden')
      } else {
        elKmSection.classList.add('hidden')
      }
    }

    if (c.estado === 'programada') {
      secAcciones?.classList.remove('hidden')
      formSalida?.classList.remove('hidden')
      formRegreso?.classList.add('hidden')
      btnCancelarComision?.classList.remove('hidden')
      btnEditarComision?.classList.remove('hidden')
      if (inputOdoSalida && c.odometroSalida) inputOdoSalida.value = c.odometroSalida
    } else if (c.estado === 'en_curso') {
      secAcciones?.classList.remove('hidden')
      formSalida?.classList.add('hidden')
      formRegreso?.classList.remove('hidden')
      btnCancelarComision?.classList.remove('hidden')
      btnEditarComision?.classList.remove('hidden')
      if (inputOdoRegreso && c.odometroSalida) inputOdoRegreso.value = c.odometroSalida
    } else {
      secAcciones?.classList.add('hidden')
      btnCancelarComision?.classList.add('hidden')
      btnEditarComision?.classList.add('hidden')
    }
  } catch (err: any) {
    alert(err.message || 'Error al cargar detalles')
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

    // En viaje, congelar vehículo, chofer y salida para preservar la trazabilidad
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
      setWizardStep(1)
      modal.classList.remove('opacity-0', 'pointer-events-none')
    }
  } catch (err: any) {
    alert(err.message || 'Error al abrir edición de comisión')
  }
}

