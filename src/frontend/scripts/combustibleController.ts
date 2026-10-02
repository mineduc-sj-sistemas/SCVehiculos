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
    const hiddenChofer = document.getElementById('fuel-chofer-hidden') as HTMLInputElement | null
    const savedChoferId = hiddenChofer?.value || ''
    form?.reset()
    if (hiddenChofer && savedChoferId) {
      hiddenChofer.value = savedChoferId
    }
    if (errorMsg) errorMsg.classList.add('hidden')
    if (statusDivScan) {
      statusDivScan.classList.add('hidden')
      statusDivScan.innerHTML = ''
    }
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

  // Escáner de Tablero y Ticket Edenred con IA (Gemini Flash)
  const fileInputScanOdo = document.getElementById('scan-modal-fuel-odometro') as HTMLInputElement | null
  const fileInputScanTicket = document.getElementById('scan-modal-fuel-ticket') as HTMLInputElement | null
  const statusDivScan = document.getElementById('status-modal-fuel-scanner') as HTMLDivElement | null

  // 1. Escanear Odómetro del Tablero
  fileInputScanOdo?.addEventListener('change', async () => {
    const file = fileInputScanOdo.files?.[0]
    if (!file || !statusDivScan) return

    statusDivScan.className = 'text-xs font-semibold text-orange-950 bg-orange-100/90 border border-orange-200 p-2.5 rounded-2xl block flex items-center gap-1.5 animate-pulse'
    statusDivScan.innerHTML = '<span class="inline-block animate-spin mr-1">⏳</span> Procesando foto y leyendo odómetro con IA...'
    statusDivScan.classList.remove('hidden')

    try {
      const base64DataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onerror = () => reject(new Error('Error al leer la foto seleccionada.'))
        reader.onload = () => {
          const img = new Image()
          img.onerror = () => reject(new Error('La imagen no es válida.'))
          img.onload = () => {
            const maxDim = 1280
            let width = img.width
            let height = img.height
            if (width > height) {
              if (width > maxDim) {
                height = Math.round((height * maxDim) / width)
                width = maxDim
              }
            } else {
              if (height > maxDim) {
                width = Math.round((width * maxDim) / height)
                height = maxDim
              }
            }
            const canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            if (!ctx) {
              resolve(reader.result as string)
              return
            }
            ctx.fillStyle = '#FFFFFF'
            ctx.fillRect(0, 0, width, height)
            ctx.drawImage(img, 0, 0, width, height)
            resolve(canvas.toDataURL('image/jpeg', 0.82))
          }
          img.src = reader.result as string
        }
        reader.readAsDataURL(file)
      })

      const res = await fetch('/api/analizar-tablero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagen: base64DataUrl }),
      })

      const json = await res.json()
      if (!res.ok || !json.success || !json.datos) {
        throw new Error(json.error || 'No se pudo leer el tablero.')
      }

      const { kilometraje, nivelCombustibleTexto, confianza, observaciones } = json.datos

      if (kilometraje && inputOdometro) {
        try {
          if (navigator.vibrate) navigator.vibrate(60)
        } catch {}

        inputOdometro.value = String(kilometraje)
        inputOdometro.dispatchEvent(new Event('input', { bubbles: true }))
        inputOdometro.classList.add('ring-4', 'ring-emerald-500/40', 'bg-emerald-50/50')
        setTimeout(() => inputOdometro.classList.remove('ring-4', 'ring-emerald-500/40', 'bg-emerald-50/50'), 4000)

        let detalle = `<div class="space-y-0.5">`
        detalle += `<div class="flex items-center justify-between">`
        detalle += `<span class="text-emerald-900 font-bold">✅ ${Number(kilometraje).toLocaleString()} km</span>`
        detalle += `<span class="text-[10px] font-bold bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full">Confianza ${confianza}%</span>`
        detalle += `</div>`
        if (nivelCombustibleTexto) detalle += `<p class="text-[11px] text-emerald-800">Combustible: <strong>${nivelCombustibleTexto}</strong></p>`
        detalle += `</div>`

        statusDivScan.className = 'text-xs font-semibold text-emerald-950 bg-emerald-100/90 border border-emerald-300 p-2.5 rounded-2xl block'
        statusDivScan.innerHTML = detalle
      } else {
        statusDivScan.className = 'text-xs font-semibold text-amber-950 bg-amber-100/90 border border-amber-300 p-2.5 rounded-2xl block'
        statusDivScan.innerHTML = `⚠️ No se distinguió el odómetro. ${observaciones || 'Ingresa el valor manualmente.'}`
      }
    } catch (err: any) {
      statusDivScan.className = 'text-xs font-semibold text-rose-950 bg-rose-100/90 border border-rose-300 p-2.5 rounded-2xl block'
      statusDivScan.innerHTML = `❌ ${err.message || 'Error al procesar foto.'}`
    } finally {
      fileInputScanOdo.value = ''
    }
  })

  // 2. Escanear Ticket Edenred / Cupón
  fileInputScanTicket?.addEventListener('change', async () => {
    const file = fileInputScanTicket.files?.[0]
    if (!file || !statusDivScan) return

    statusDivScan.className = 'text-xs font-semibold text-orange-950 bg-orange-100/90 border border-orange-200 p-2.5 rounded-2xl block flex items-center gap-1.5 animate-pulse'
    statusDivScan.innerHTML = '<span class="inline-block animate-spin mr-1">⏳</span> Leyendo ticket Edenred con IA...'
    statusDivScan.classList.remove('hidden')

    try {
      const base64DataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onerror = () => reject(new Error('Error al leer la foto del ticket.'))
        reader.onload = () => {
          const img = new Image()
          img.onerror = () => reject(new Error('La imagen no es válida.'))
          img.onload = () => {
            const maxDim = 1280
            let width = img.width
            let height = img.height
            if (width > height) {
              if (width > maxDim) {
                height = Math.round((height * maxDim) / width)
                width = maxDim
              }
            } else {
              if (height > maxDim) {
                width = Math.round((width * maxDim) / height)
                height = maxDim
              }
            }
            const canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            if (!ctx) {
              resolve(reader.result as string)
              return
            }
            ctx.fillStyle = '#FFFFFF'
            ctx.fillRect(0, 0, width, height)
            ctx.drawImage(img, 0, 0, width, height)
            resolve(canvas.toDataURL('image/jpeg', 0.82))
          }
          img.src = reader.result as string
        }
        reader.readAsDataURL(file)
      })

      const res = await fetch('/api/analizar-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagen: base64DataUrl }),
      })

      const json = await res.json()
      if (!res.ok || !json.success || !json.datos) {
        throw new Error(json.error || 'No se pudo leer el comprobante.')
      }

      const d = json.datos
      const inputEstacion = document.getElementById('fuel-estacion') as HTMLInputElement | null
      const inputTicket = document.getElementById('fuel-ticket') as HTMLInputElement | null
      const inputFecha = document.getElementById('fuel-fecha') as HTMLInputElement | null
      const selectTipoCombustible = document.getElementById('fuel-tipo') as HTMLSelectElement | null

      const camposCompletados: string[] = []

      const setVal = (input: HTMLInputElement | HTMLSelectElement | null, val: any, label: string) => {
        if (input && val != null && String(val).trim() !== '') {
          input.value = String(val)
          input.dispatchEvent(new Event('input', { bubbles: true }))
          input.dispatchEvent(new Event('change', { bubbles: true }))
          input.classList.add('ring-4', 'ring-emerald-500/40', 'bg-emerald-50/50')
          setTimeout(() => input.classList.remove('ring-4', 'ring-emerald-500/40', 'bg-emerald-50/50'), 4000)
          camposCompletados.push(label)
        }
      }

      setVal(inputEstacion, d.estacionServicio, 'Estación')
      setVal(inputLitros, d.litros, 'Litros')
      setVal(inputPrecio, d.precioPorLitro, 'Precio/L')
      setVal(inputImporte, d.importeTotal, 'Total $')
      setVal(inputTicket, d.numeroTicket, 'N° Ticket')
      setVal(inputFecha, d.fechaCarga, 'Fecha')
      setVal(selectTipoCombustible, d.tipoCombustible, 'Combustible')

      if (d.odometro && inputOdometro) {
        setVal(inputOdometro, d.odometro, 'Odómetro')
      }

      // Auto-seleccionar vehículo oficial si la patente figura en el ticket
      const selectVehiculo = document.getElementById('fuel-vehiculo') as HTMLSelectElement | null
      if (d.patente && selectVehiculo) {
        const patLimpia = d.patente.replace(/[\s-]/g, '').toUpperCase()
        for (let i = 0; i < selectVehiculo.options.length; i++) {
          const opt = selectVehiculo.options[i]
          const optLimpio = opt.text.replace(/[\s-]/g, '').toUpperCase()
          if (optLimpio.includes(patLimpia)) {
            selectVehiculo.selectedIndex = i
            selectVehiculo.classList.add('ring-4', 'ring-emerald-500/40', 'bg-emerald-50/50')
            setTimeout(() => selectVehiculo.classList.remove('ring-4', 'ring-emerald-500/40', 'bg-emerald-50/50'), 4000)
            camposCompletados.push(`Móvil (${d.patente})`)
            break
          }
        }
      }

      // Auto-seleccionar chofer si su DNI figura en el ticket Edenred
      const selectChofer = document.getElementById('fuel-chofer') as HTMLSelectElement | null
      if (d.conductorDni && selectChofer) {
        const dniLimpio = d.conductorDni.replace(/\D/g, '')
        for (let i = 0; i < selectChofer.options.length; i++) {
          const opt = selectChofer.options[i]
          if (opt.text.includes(dniLimpio)) {
            selectChofer.selectedIndex = i
            selectChofer.classList.add('ring-4', 'ring-emerald-500/40', 'bg-emerald-50/50')
            setTimeout(() => selectChofer.classList.remove('ring-4', 'ring-emerald-500/40', 'bg-emerald-50/50'), 4000)
            camposCompletados.push(`Chofer`)
            break
          }
        }
      }

      try {
        if (navigator.vibrate) navigator.vibrate(60)
      } catch {}

      if (camposCompletados.length > 0) {
        let detalle = `<div class="space-y-0.5">`
        detalle += `<div class="flex items-center justify-between">`
        detalle += `<span class="text-emerald-900 font-bold">✅ Ticket Edenred leído</span>`
        detalle += `<span class="text-[10px] font-bold bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full">Confianza ${d.confianza}%</span>`
        detalle += `</div>`
        detalle += `<p class="text-[11px] text-emerald-800">Autocompletado: <strong>${camposCompletados.join(', ')}</strong></p>`
        if (d.importeTotal) {
          detalle += `<p class="text-xs text-emerald-900 font-semibold">Total: $${Number(d.importeTotal).toLocaleString('es-AR')}${d.litros ? ` (${d.litros} L)` : ''}</p>`
        }
        detalle += `</div>`

        statusDivScan.className = 'text-xs font-semibold text-emerald-950 bg-emerald-100/90 border border-emerald-300 p-2.5 rounded-2xl block'
        statusDivScan.innerHTML = detalle
      } else {
        statusDivScan.className = 'text-xs font-semibold text-amber-950 bg-amber-100/90 border border-amber-300 p-2.5 rounded-2xl block'
        statusDivScan.innerHTML = `⚠️ No se detectaron datos legibles. ${d.observaciones || 'Ingresa los datos a mano.'}`
      }
    } catch (err: any) {
      statusDivScan.className = 'text-xs font-semibold text-rose-950 bg-rose-100/90 border border-rose-300 p-2.5 rounded-2xl block'
      statusDivScan.innerHTML = `❌ ${err.message || 'Error al procesar ticket.'}`
    } finally {
      fileInputScanTicket.value = ''
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
