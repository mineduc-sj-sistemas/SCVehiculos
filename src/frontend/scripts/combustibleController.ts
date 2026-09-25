/**
 * Controlador de Cliente para el Módulo de Cargas de Combustible y Rendimiento
 */

document.addEventListener('DOMContentLoaded', () => {
  initFiltrosCombustible()
  initCrearCombustibleModal()
})

/**
 * 1. Filtrado reactivo en cliente (Búsqueda, Tipo de Combustible y Método de Pago)
 */
function initFiltrosCombustible() {
  const inputBuscar = document.getElementById('filtro-buscar-combustible') as HTMLInputElement | null
  const selectTipo = document.getElementById('filtro-tipo-combustible') as HTMLSelectElement | null
  const selectMetodo = document.getElementById('filtro-metodo-pago') as HTMLSelectElement | null
  const contador = document.getElementById('contador-cargas')
  const rows = document.querySelectorAll<HTMLTableRowElement>('.item-carga-row')

  const aplicarFiltros = () => {
    const texto = inputBuscar?.value.trim().toLowerCase() || ''
    const tipo = selectTipo?.value || ''
    const metodo = selectMetodo?.value || ''

    let visibles = 0

    rows.forEach((row) => {
      const rowSearch = row.dataset.search || ''
      const rowTipo = row.dataset.tipo || ''
      const rowMetodo = row.dataset.metodo || ''

      const matchesText = !texto || rowSearch.includes(texto)
      const matchesTipo = !tipo || rowTipo === tipo
      const matchesMetodo = !metodo || rowMetodo === metodo

      if (matchesText && matchesTipo && matchesMetodo) {
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
  selectMetodo?.addEventListener('change', aplicarFiltros)
}

/**
 * 2. Modal de Registro de Carga de Combustible con cálculo dinámico
 */
function initCrearCombustibleModal() {
  const modal = document.getElementById('modal-crear-combustible')
  const btnAbrir = document.getElementById('btn-abrir-crear-combustible')
  const btnCerrar = document.getElementById('btn-close-combustible-modal')
  const btnCancelar = document.getElementById('btn-cancel-combustible-modal')
  const form = document.getElementById('form-crear-combustible') as HTMLFormElement | null
  const selectVehiculo = document.getElementById('fuel-vehiculo') as HTMLSelectElement | null
  const inputOdometro = document.getElementById('fuel-odometro') as HTMLInputElement | null
  const inputLitros = document.getElementById('fuel-litros') as HTMLInputElement | null
  const inputPrecio = document.getElementById('fuel-precio') as HTMLInputElement | null
  const inputImporte = document.getElementById('fuel-importe') as HTMLInputElement | null
  const errorMsg = document.getElementById('combustible-error-msg')
  const errorText = document.getElementById('combustible-error-text')
  const btnSubmit = document.getElementById('btn-submit-combustible') as HTMLButtonElement | null

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
    const odo = selectedOption?.dataset?.odometro
    if (inputOdometro && odo) {
      inputOdometro.value = odo
    }
  })

  // Cálculo automático del Importe Total (Litros * Precio)
  const calcularTotal = () => {
    const litros = parseFloat(inputLitros?.value || '0')
    const precio = parseFloat(inputPrecio?.value || '0')
    if (inputImporte && litros > 0 && precio > 0) {
      inputImporte.value = (litros * precio).toFixed(2)
    }
  }

  inputLitros?.addEventListener('input', calcularTotal)
  inputPrecio?.addEventListener('input', calcularTotal)

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
    const litros = Number(formData.get('litros'))
    const precioPorLitro = Number(formData.get('precioPorLitro'))
    const importeInput = formData.get('importeTotal')
    const importeTotal = importeInput ? Number(importeInput) : litros * precioPorLitro

    const payload = {
      vehiculoId: formData.get('vehiculoId'),
      choferId: formData.get('choferId') || null,
      fechaCarga: formData.get('fechaCarga'),
      estacionServicio: formData.get('estacionServicio') || null,
      tipoCombustible: formData.get('tipoCombustible'),
      litros,
      precioPorLitro,
      importeTotal,
      odometroCarga: Number(formData.get('odometroCarga')),
      tanqueLleno: formData.get('tanqueLleno') === '1',
      numeroTicket: formData.get('numeroTicket') || null,
      metodoPago: formData.get('metodoPago') || 'tarjeta_flota',
    }

    try {
      const res = await fetch('/api/combustible', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al registrar la carga de combustible')
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
        btnSubmit.innerText = 'Registrar Carga'
      }
    }
  })
}
