/**
 * Controlador de interactividad para la vista de Choferes en el Frontend:
 * - Filtrado en tiempo real por texto (nombre, apellido, DNI, carnet)
 * - Filtro por estado operativo y categoría de licencia
 * - Carga asíncrona de datos en la Ficha 360° (pestañas personal, comisiones, licencias)
 * - Control de apertura y guardado del formulario de alta/edición
 * - Lector de pistola de código de barras 2D / PDF417 de DNI argentino
 * - Selector interactivo de múltiples categorías de licencia
 * - Carga y previsualización de documentos escaneados (DNI y Carnet)
 * - Visor modal de documentos digitalizados
 */

import flatpickr from 'flatpickr'
import 'flatpickr/dist/flatpickr.min.css'

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

export function initChoferesController() {
  // -------------------------------------------------------------
  // 1. Filtrado reactivo en el cliente
  // -------------------------------------------------------------
  const searchInput = document.querySelector('#filter-search') as HTMLInputElement | null
  const estadoSelect = document.querySelector('#filter-estado') as HTMLSelectElement | null
  const categoriaSelect = document.querySelector('#filter-categoria') as HTMLSelectElement | null
  const clearBtn = document.querySelector('#btn-clear-filters')
  const rows = document.querySelectorAll('.chofer-row') as NodeListOf<HTMLTableRowElement>
  const visibleCounter = document.querySelector('#visible-count')
  const noResultsBox = document.querySelector('#no-results')

  function applyFilters() {
    const q = searchInput?.value.toLowerCase().trim() || ''
    const estado = estadoSelect?.value || ''
    const cat = categoriaSelect?.value || ''

    let visibleCount = 0

    rows.forEach((row) => {
      const rowNombre = row.dataset.nombre || ''
      const rowApellido = row.dataset.apellido || ''
      const rowDni = row.dataset.dni || ''
      const rowLicencia = row.dataset.licencia || ''
      const rowCategoria = row.dataset.categoria || ''
      const rowEstado = row.dataset.estado || ''
      const rowDireccion = row.dataset.direccion || ''

      const matchesSearch =
        !q ||
        rowNombre.includes(q) ||
        rowApellido.includes(q) ||
        rowDni.includes(q) ||
        rowLicencia.includes(q) ||
        rowDireccion.includes(q)

      const matchesEstado = !estado || rowEstado === estado
      const matchesCategoria = !cat || rowCategoria.includes(cat)

      if (matchesSearch && matchesEstado && matchesCategoria) {
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
  categoriaSelect?.addEventListener('change', applyFilters)

  clearBtn?.addEventListener('click', () => {
    if (searchInput) searchInput.value = ''
    if (estadoSelect) estadoSelect.value = ''
    if (categoriaSelect) categoriaSelect.value = ''
    applyFilters()
  })

  // -------------------------------------------------------------
  // 2. Manejo de Múltiples Categorías de Licencia
  // -------------------------------------------------------------
  const selectedCategories = new Set<string>(['B1'])
  const categoriaInput = document.querySelector('#form-chofer-categoria') as HTMLInputElement | null
  const categoriasResumen = document.querySelector('#badge-categorias-resumen')
  const catButtons = document.querySelectorAll('.btn-toggle-cat')

  function renderCategoryBadges() {
    catButtons.forEach((btn) => {
      const cat = btn.getAttribute('data-cat')
      if (!cat) return

      if (selectedCategories.has(cat)) {
        btn.classList.add('bg-blue', 'text-white', 'border-blue', 'shadow-xs')
        btn.classList.remove('bg-white', 'text-navy', 'border-line')
      } else {
        btn.classList.remove('bg-blue', 'text-white', 'border-blue', 'shadow-xs')
        btn.classList.add('bg-white', 'text-navy', 'border-line')
      }
    })

    const arr = Array.from(selectedCategories)
    const val = arr.join(', ')
    if (categoriaInput) categoriaInput.value = val || 'B1'
    if (categoriasResumen) {
      categoriasResumen.textContent = val ? `Seleccionadas: ${val}` : 'Ninguna seleccionada'
    }
  }

  catButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault()
      const cat = btn.getAttribute('data-cat')
      if (!cat) return

      if (selectedCategories.has(cat)) {
        if (selectedCategories.size > 1) {
          selectedCategories.delete(cat)
        }
      } else {
        selectedCategories.add(cat)
      }
      renderCategoryBadges()
    })
  })

  function setCategoriesFromArray(arr: string[]) {
    selectedCategories.clear()
    if (arr.length === 0) arr = ['B1']
    arr.forEach((c) => selectedCategories.add(c.trim().toUpperCase()))
    renderCategoryBadges()
  }

  // Inicializar badges por defecto
  renderCategoryBadges()

  // -------------------------------------------------------------
  // Inicialización de Selectores de Fecha Modernos (Flatpickr)
  // -------------------------------------------------------------
  let vencimientoPicker: any = null
  if (document.querySelector('#form-chofer-vencimiento')) {
    vencimientoPicker = flatpickr('#form-chofer-vencimiento', {
      locale: SpanishLocale,
      dateFormat: 'Y-m-d',
      altInput: true,
      altFormat: 'd/m/Y',
      altInputClass: 'w-full h-9 rounded-lg border border-line bg-paper pl-8 pr-3 text-xs font-semibold text-navy focus:border-blue focus:bg-white outline-none transition cursor-pointer',
      monthSelectorType: 'dropdown',
      onReady: (_dates: any, _str: any, instance: any) => {
        if (instance.altInput) {
          instance.altInput.setAttribute('autocomplete', 'off')
          instance.altInput.setAttribute('data-lpignore', 'true')
          instance.altInput.setAttribute('data-form-type', 'other')
          instance.altInput.setAttribute('name', 'input_display_vencimiento')
          instance.altInput.readOnly = true
        }
      },
    })
  }

  // Botones de acceso rápido para sumar años a la fecha de vencimiento
  document.querySelectorAll('.btn-preset-venc').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault()
      const years = parseInt(btn.getAttribute('data-years') || '1', 10)
      const targetDate = new Date()
      targetDate.setFullYear(targetDate.getFullYear() + years)
      const yyyy = targetDate.getFullYear()
      const mm = String(targetDate.getMonth() + 1).padStart(2, '0')
      const dd = String(targetDate.getDate()).padStart(2, '0')
      const dateStr = `${yyyy}-${mm}-${dd}`
      
      if (vencimientoPicker) {
        if (Array.isArray(vencimientoPicker)) {
          vencimientoPicker[0]?.setDate(dateStr, true)
        } else {
          vencimientoPicker.setDate(dateStr, true)
        }
      }
    })
  })

  let licInicioPicker: any = null
  if (document.querySelector('#licencia-fecha-inicio')) {
    licInicioPicker = flatpickr('#licencia-fecha-inicio', {
      locale: SpanishLocale,
      dateFormat: 'Y-m-d',
      altInput: true,
      altFormat: 'd/m/Y',
      altInputClass: 'w-full h-9 rounded-lg border border-line bg-paper pl-8 pr-3 text-xs font-semibold text-navy focus:border-blue focus:bg-white outline-none cursor-pointer',
      monthSelectorType: 'dropdown',
      onReady: (_dates: any, _str: any, instance: any) => {
        if (instance.altInput) {
          instance.altInput.setAttribute('autocomplete', 'off')
          instance.altInput.setAttribute('data-lpignore', 'true')
          instance.altInput.setAttribute('data-form-type', 'other')
          instance.altInput.setAttribute('name', 'input_display_lic_inicio')
          instance.altInput.readOnly = true
        }
      },
    })
  }

  let licFinPicker: any = null
  if (document.querySelector('#licencia-fecha-fin')) {
    licFinPicker = flatpickr('#licencia-fecha-fin', {
      locale: SpanishLocale,
      dateFormat: 'Y-m-d',
      altInput: true,
      altFormat: 'd/m/Y',
      altInputClass: 'w-full h-9 rounded-lg border border-line bg-paper pl-8 pr-3 text-xs font-semibold text-navy focus:border-blue focus:bg-white outline-none cursor-pointer',
      monthSelectorType: 'dropdown',
      onReady: (_dates: any, _str: any, instance: any) => {
        if (instance.altInput) {
          instance.altInput.setAttribute('autocomplete', 'off')
          instance.altInput.setAttribute('data-lpignore', 'true')
          instance.altInput.setAttribute('data-form-type', 'other')
          instance.altInput.setAttribute('name', 'input_display_lic_fin')
          instance.altInput.readOnly = true
        }
      },
    })
  }

  // -------------------------------------------------------------
  // 3. Lector de Pistola de Código de Barras (PDF417 DNI y Carnet)
  // -------------------------------------------------------------
  const scannerInput = document.querySelector('#scanner-gun-input') as HTMLInputElement | null
  const scannerFeedback = document.querySelector('#scanner-feedback')
  const scannerFeedbackText = document.querySelector('#scanner-feedback-text')

  // Calculador matemático de CUIL argentino (Algoritmo oficial AFIP/ANSES)
  function calcularCuilArgentino(dniStr: string, sexo: string = 'M'): string {
    const clean = dniStr.replace(/\D/g, '').padStart(8, '0')
    let prefijo = sexo.toUpperCase() === 'F' ? 27 : 20
    const multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]

    function calcDigito(xy: number): { xy: number; z: number } {
      const cadena = `${xy}${clean}`
      let suma = 0
      for (let i = 0; i < 10; i++) {
        suma += parseInt(cadena[i], 10) * multiplicadores[i]
      }
      const resto = suma % 11
      if (resto === 0) return { xy, z: 0 }
      if (resto === 1) {
        return calcDigito(23)
      }
      return { xy, z: 11 - resto }
    }

    const res = calcDigito(prefijo)
    return `${res.xy}-${clean}-${res.z}`
  }

  interface DniParsed {
    tipo: 'dni'
    apellido: string
    nombre: string
    dni: string
    sexo: string
  }

  interface CarnetParsed {
    tipo: 'carnet'
    categorias: string[]
    vencimiento: string | null
    licenciaNum: string | null
  }

  type DocumentParsed = DniParsed | CarnetParsed

  function parseDocumentBarcode(rawText: string): DocumentParsed | null {
    if (!rawText) return null
    const text = rawText.trim()

    // 1. Formato DNI Tarjeta con delimitador de comillas (ej: 00747496048"REGO PUENTEDURA"MAXIMILIANO NICOLS"46544817"M"B"...)
    if (text.includes('"')) {
      const parts = text.split('"').map((s) => s.trim()).filter((s) => s.length > 0)
      if (parts.length >= 4) {
        let apellido = ''
        let nombre = ''
        let dni = ''
        let sexo = 'M'

        if (parts.length >= 5 && /^\d{9,13}$/.test(parts[0])) {
          // Formato Renaper con trámite al inicio (11 dígitos):
          // parts[0] = 00747496048 (trámite)
          // parts[1] = REGO PUENTEDURA
          // parts[2] = MAXIMILIANO NICOLS
          // parts[3] = 46544817 (DNI)
          // parts[4] = M (Sexo)
          apellido = parts[1] || ''
          nombre = parts[2] || ''
          dni = (parts[3] || '').replace(/\D/g, '')
          sexo = (parts[4] || 'M').toUpperCase()
        } else {
          apellido = parts[0] || ''
          nombre = parts[1] || ''
          dni = (parts[2] || '').replace(/\D/g, '')
          sexo = (parts[3] || 'M').toUpperCase()
        }

        // Búsqueda de rescate: si el DNI no tiene entre 7 y 8 dígitos, buscar en todo el arreglo
        if (!dni || dni.length < 7 || dni.length > 8) {
          const found = parts.find((p) => /^\d{7,8}$/.test(p))
          if (found) dni = found
        }

        // Sexo
        const foundSexo = parts.find((p) => /^[MFX]$/i.test(p))
        if (foundSexo) sexo = foundSexo.toUpperCase()

        if (dni.length >= 7 && apellido) {
          return { tipo: 'dni', apellido, nombre, dni, sexo }
        }
      }
    }

    // 2. Formato DNI Tarjeta con delimitador arroba (ej: 00123456789@APELLIDO@NOMBRE@M@43280763@...)
    if (text.includes('@')) {
      const parts = text.split('@').map((s) => s.trim()).filter((s) => s.length > 0)
      if (parts.length >= 4) {
        let apellido = ''
        let nombre = ''
        let dni = ''
        let sexo = 'M'

        if (parts.length >= 5 && /^\d{9,13}$/.test(parts[0])) {
          apellido = parts[1] || ''
          nombre = parts[2] || ''
          dni = (parts[3] || '').replace(/\D/g, '')
          sexo = (parts[4] || 'M').toUpperCase()
        } else {
          apellido = parts[0] || ''
          nombre = parts[1] || ''
          dni = (parts[2] || '').replace(/\D/g, '')
          sexo = (parts[3] || 'M').toUpperCase()
        }

        if (!dni || dni.length < 7 || dni.length > 8) {
          const found = parts.find((p) => /^\d{7,8}$/.test(p))
          if (found) dni = found
        }

        const foundSexo = parts.find((p) => /^[MFX]$/i.test(p))
        if (foundSexo) sexo = foundSexo.toUpperCase()

        if (dni.length >= 7 && apellido) {
          return { tipo: 'dni', apellido, nombre, dni, sexo }
        }
      }
    }

    // 3. Formato Licencia Nacional de Conducir / Carnet
    const catMatches = text.match(/\b([A-E][1-4]?(\.[1-3])?)\b/gi)
    const dateMatches = text.match(/\b(20\d{2}[-/]\d{2}[-/]\d{2}|\d{2}[-/]\d{2}[-/]20\d{2})\b/)
    const numberMatches = text.match(/\b\d{7,8}\b/)

    if (catMatches && catMatches.length > 0) {
      return {
        tipo: 'carnet',
        categorias: catMatches.map((c) => c.toUpperCase()),
        vencimiento: dateMatches ? dateMatches[0] : null,
        licenciaNum: numberMatches ? numberMatches[0] : null,
      }
    }

    return null
  }

  function handleScannerInput(text: string): boolean {
    const data = parseDocumentBarcode(text)
    if (!data) return false

    if (data.tipo === 'dni') {
      const nombreInp = document.querySelector('#form-chofer-nombre') as HTMLInputElement | null
      const apellidoInp = document.querySelector('#form-chofer-apellido') as HTMLInputElement | null
      const dniInp = document.querySelector('#form-chofer-dni') as HTMLInputElement | null
      const cuilInp = document.querySelector('#form-chofer-cuil') as HTMLInputElement | null

      // Llenar exclusivamente datos de identidad / DNI
      if (apellidoInp) apellidoInp.value = data.apellido
      if (nombreInp) nombreInp.value = data.nombre
      if (dniInp) dniInp.value = data.dni

      // Cálculo automático exacto de CUIL argentino (20-DNI-digito)
      if (cuilInp) {
        cuilInp.value = calcularCuilArgentino(data.dni, data.sexo)
      }

      // El número de carnet es el mismo que el documento
      const licInp = document.querySelector('#form-chofer-licencia') as HTMLInputElement | null
      if (licInp) {
        licInp.value = data.dni
      }

      // Feedback visual específico para DNI
      if (scannerFeedback && scannerFeedbackText) {
        scannerFeedbackText.textContent = `¡DNI Pistoleado: ${data.apellido}, ${data.nombre} (DNI ${data.dni})!`
        scannerFeedback.classList.remove('hidden')
        setTimeout(() => {
          scannerFeedback?.classList.add('hidden')
        }, 5000)
      }
    } else if (data.tipo === 'carnet') {
      const licInp = document.querySelector('#form-chofer-licencia') as HTMLInputElement | null
      const vencInp = document.querySelector('#form-chofer-vencimiento') as HTMLInputElement | null

      // Llenar exclusivamente datos de la Licencia Nacional
      if (data.licenciaNum && licInp) {
        licInp.value = data.licenciaNum
      }
      if (data.categorias.length > 0) {
        setCategoriesFromArray(data.categorias)
      }
      if (data.vencimiento) {
        const vDate = data.vencimiento.includes('/') ? data.vencimiento.split('/').reverse().join('-') : data.vencimiento
        if (vencimientoPicker) {
          if (Array.isArray(vencimientoPicker)) vencimientoPicker[0]?.setDate(vDate, true)
          else vencimientoPicker.setDate(vDate, true)
        } else if (vencInp) {
          vencInp.value = vDate
        }
      }

      // Feedback visual específico para Carnet
      if (scannerFeedback && scannerFeedbackText) {
        scannerFeedbackText.textContent = `¡Carnet Pistoleado! Categorías: ${data.categorias.join(', ')}`
        scannerFeedback.classList.remove('hidden')
        setTimeout(() => {
          scannerFeedback?.classList.add('hidden')
        }, 5000)
      }
    }

    if (scannerInput) scannerInput.value = ''
    return true
  }

  // Manejo de ráfaga de la pistola con debounce de fin de transmisión
  let scannerTimer: any = null

  function triggerScannerProcess(rawVal: string) {
    clearTimeout(scannerTimer)
    scannerTimer = setTimeout(() => {
      const success = handleScannerInput(rawVal)
      if (success && scannerInput) {
        scannerInput.value = ''
      }
    }, 90)
  }

  scannerInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      clearTimeout(scannerTimer)
      handleScannerInput(scannerInput.value)
    }
  })

  scannerInput?.addEventListener('input', () => {
    triggerScannerProcess(scannerInput.value)
  })

  scannerInput?.addEventListener('paste', () => {
    setTimeout(() => {
      if (scannerInput.value) {
        handleScannerInput(scannerInput.value)
      }
    }, 40)
  })

  // Si el usuario dispara con el cursor sobre el input de Carnet
  const formLicenciaInput = document.querySelector('#form-chofer-licencia') as HTMLInputElement | null
  formLicenciaInput?.addEventListener('input', () => {
    const val = formLicenciaInput.value
    if (val.includes('"') || val.includes('@') || val.length > 25) {
      const ok = handleScannerInput(val)
      if (ok) formLicenciaInput.value = ''
    }
  })

  // Sincronizar automáticamente número de carnet con DNI si se tipea a mano
  const formDniInput = document.querySelector('#form-chofer-dni') as HTMLInputElement | null
  formDniInput?.addEventListener('input', () => {
    const cleanDni = formDniInput.value.replace(/\D/g, '')
    if (formLicenciaInput && (!formLicenciaInput.value || /^\d*$/.test(formLicenciaInput.value))) {
      formLicenciaInput.value = cleanDni
    }
  })



  // -------------------------------------------------------------
  // 4. Carga y Digitalización de Documentos (Archivos o Cámara Base64)
  // -------------------------------------------------------------
  function setupDocUpload(
    fileInputId: string,
    previewContainerId: string,
    previewImgId: string,
    placeholderId: string,
    hiddenInputId: string
  ) {
    const fileInput = document.querySelector(fileInputId) as HTMLInputElement | null
    const previewContainer = document.querySelector(previewContainerId)
    const previewImg = document.querySelector(previewImgId) as HTMLImageElement | null
    const placeholder = document.querySelector(placeholderId)
    const hiddenInput = document.querySelector(hiddenInputId) as HTMLInputElement | null

    fileInput?.addEventListener('change', () => {
      const file = fileInput.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target?.result as string
        if (hiddenInput) hiddenInput.value = base64
        if (previewImg) previewImg.src = base64
        placeholder?.classList.add('hidden')
        previewContainer?.classList.remove('hidden')
      }
      reader.readAsDataURL(file)
    })
  }

  setupDocUpload('#file-dni-frente', '#preview-dni-frente-container', '#preview-dni-frente', '#placeholder-dni-frente', '#form-foto-dni-frente')
  setupDocUpload('#file-dni-dorso', '#preview-dni-dorso-container', '#preview-dni-dorso', '#placeholder-dni-dorso', '#form-foto-dni-dorso')
  setupDocUpload('#file-lic-frente', '#preview-lic-frente-container', '#preview-lic-frente', '#placeholder-lic-frente', '#form-foto-lic-frente')
  setupDocUpload('#file-lic-dorso', '#preview-lic-dorso-container', '#preview-lic-dorso', '#placeholder-lic-dorso', '#form-foto-lic-dorso')

  function resetDocPreviews() {
    const docs = [
      { cont: '#preview-dni-frente-container', ph: '#placeholder-dni-frente', img: '#preview-dni-frente', hid: '#form-foto-dni-frente' },
      { cont: '#preview-dni-dorso-container', ph: '#placeholder-dni-dorso', img: '#preview-dni-dorso', hid: '#form-foto-dni-dorso' },
      { cont: '#preview-lic-frente-container', ph: '#placeholder-lic-frente', img: '#preview-lic-frente', hid: '#form-foto-lic-frente' },
      { cont: '#preview-lic-dorso-container', ph: '#placeholder-lic-dorso', img: '#preview-lic-dorso', hid: '#form-foto-lic-dorso' },
    ]
    docs.forEach((d) => {
      document.querySelector(d.cont)?.classList.add('hidden')
      document.querySelector(d.ph)?.classList.remove('hidden')
      const img = document.querySelector(d.img) as HTMLImageElement | null
      const hid = document.querySelector(d.hid) as HTMLInputElement | null
      if (img) img.src = ''
      if (hid) hid.value = ''
    })
  }

  function setDocPreview(contId: string, phId: string, imgId: string, hidId: string, base64Url?: string | null) {
    if (base64Url) {
      document.querySelector(contId)?.classList.remove('hidden')
      document.querySelector(phId)?.classList.add('hidden')
      const img = document.querySelector(imgId) as HTMLImageElement | null
      const hid = document.querySelector(hidId) as HTMLInputElement | null
      if (img) img.src = base64Url
      if (hid) hid.value = base64Url
    }
  }

  // -------------------------------------------------------------
  // 5. Visor Modal de Documento Digitalizado (Zoom)
  // -------------------------------------------------------------
  const docViewerModal = document.querySelector('#doc-viewer-modal') as HTMLElement | null
  const docViewerImg = document.querySelector('#doc-viewer-img') as HTMLImageElement | null
  const docViewerTitle = document.querySelector('#doc-viewer-title')
  const closeDocViewerBtn = document.querySelector('#close-doc-viewer')

  function openDocViewer(title: string, src: string) {
    if (docViewerImg) docViewerImg.src = src
    if (docViewerTitle) docViewerTitle.textContent = title
    if (docViewerModal) docViewerModal.style.display = 'flex'
  }

  function closeDocViewer() {
    if (docViewerModal) docViewerModal.style.display = 'none'
  }

  closeDocViewerBtn?.addEventListener('click', closeDocViewer)

  // -------------------------------------------------------------
  // 6. Ficha 360° del Chofer (Modal Detalle con Tabs)
  // -------------------------------------------------------------
  const detailModal = document.querySelector('#chofer-detail-modal') as HTMLElement | null
  const closeDetailBtn = document.querySelector('#close-chofer-detail-modal')
  const btnCloseDetailFooter = document.querySelector('#btn-close-detail')

  function closeDetail() {
    if (detailModal) detailModal.style.display = 'none'
  }

  closeDetailBtn?.addEventListener('click', closeDetail)
  btnCloseDetailFooter?.addEventListener('click', closeDetail)

  // Tabs del modal detalle
  const tabBtns = document.querySelectorAll('#chofer-detail-modal .tab-btn')
  const tabPanes = document.querySelectorAll('#chofer-detail-modal .tab-pane')

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tabTarget = btn.getAttribute('data-tab')
      tabBtns.forEach((b) => {
        b.classList.remove('active', 'border-blue', 'text-blue')
        b.classList.add('border-transparent', 'text-muted')
      })
      btn.classList.add('active', 'border-blue', 'text-blue')
      btn.classList.remove('border-transparent', 'text-muted')

      tabPanes.forEach((pane) => {
        if (pane.id === `tab-content-${tabTarget}`) {
          pane.classList.remove('hidden')
        } else {
          pane.classList.add('hidden')
        }
      })
    })
  })

  // Abrir Ficha 360°
  document.querySelectorAll('.btn-view-detail').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id')
      if (!id) return

      try {
        const res = await fetch(`/api/choferes?id=${id}`)
        if (!res.ok) throw new Error('No se pudo cargar la ficha del chofer')
        const data = await res.json()
        const c = data.chofer
        if (!c) return

        // Pestaña 1: Cabecera y Datos Personales
        const avatarEl = document.querySelector('#modal-chofer-avatar')
        const nombreEl = document.querySelector('#modal-chofer-nombre')
        const catEl = document.querySelector('#modal-chofer-cat')
        const statusEl = document.querySelector('#modal-chofer-status')
        const dniEl = document.querySelector('#info-dni')
        const cuilEl = document.querySelector('#info-cuil')
        const licNumEl = document.querySelector('#info-licencia-num')
        const licVencEl = document.querySelector('#info-licencia-venc')
        const totalViajesEl = document.querySelector('#info-total-viajes')
        const totalKmEl = document.querySelector('#info-total-km')
        const nombreCompEl = document.querySelector('#info-nombre-completo')
        const telEl = document.querySelector('#info-telefono')
        const emailEl = document.querySelector('#info-email')
        const dirEl = document.querySelector('#info-direccion')
        const obsEl = document.querySelector('#info-observaciones')
        const catContainer = document.querySelector('#info-categorias-container')

        if (avatarEl) avatarEl.textContent = c.iniciales
        if (nombreEl) nombreEl.textContent = `${c.apellido}, ${c.nombre}`
        if (catEl) catEl.textContent = `Cat. ${c.categoriaLicencia}`
        if (statusEl) {
          statusEl.textContent = c.estadoLabel
          statusEl.className = `inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
            c.tone === 'green' ? 'bg-emerald-50 text-emerald-600' :
            c.tone === 'blue' ? 'bg-sky text-blue' :
            c.tone === 'orange' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-600'
          }`
        }

        if (dniEl) dniEl.textContent = c.dni
        if (cuilEl) cuilEl.textContent = `CUIL: ${c.cuil || 'S/D'}`
        if (licNumEl) licNumEl.textContent = c.numeroLicencia

        // Badges de categorías múltiples
        if (catContainer) {
          catContainer.innerHTML = ''
          const cats = c.categoriasList && c.categoriasList.length > 0 ? c.categoriasList : [c.categoriaLicencia]
          cats.forEach((catItem: string) => {
            const span = document.createElement('span')
            span.className = 'rounded bg-sky px-2 py-0.5 font-mono text-[10px] font-bold text-blue shadow-2xs'
            span.textContent = `Cat. ${catItem}`
            catContainer.appendChild(span)
          })
        }

        if (licVencEl) {
          licVencEl.textContent = `Vence: ${c.licenciaFormatted}`
          licVencEl.className = `mt-1 text-[11px] font-semibold flex items-center gap-1 ${
            c.licenciaStatus === 'vigente' ? 'text-emerald-600' :
            c.licenciaStatus === 'proxima' ? 'text-amber-600' : 'text-rose-600'
          }`
        }

        if (totalViajesEl) totalViajesEl.textContent = `${c.totalViajes || 0} comisiones`
        if (totalKmEl) totalKmEl.textContent = `${Number(c.totalKmRecorridos || 0).toLocaleString('es-AR')} km recorridos`
        if (nombreCompEl) nombreCompEl.textContent = `${c.nombre} ${c.apellido}`
        if (telEl) telEl.textContent = c.telefono || 'Sin registrar'
        if (emailEl) emailEl.textContent = c.email || 'Sin correo'
        if (dirEl) dirEl.textContent = c.direccion || 'San Juan, Argentina'
        if (obsEl) obsEl.textContent = c.observaciones || 'Sin novedades registradas.'

        // Días de licencia consumidos
        const vacEl = document.querySelector('#dias-vacaciones')
        const enfEl = document.querySelector('#dias-enfermedad')
        const compEl = document.querySelector('#dias-compensatorio')
        const otrEl = document.querySelector('#dias-otros')
        if (vacEl) vacEl.textContent = String(data.diasLicenciaConsumidos?.vacaciones || 0)
        if (enfEl) enfEl.textContent = String(data.diasLicenciaConsumidos?.enfermedad || 0)
        if (compEl) compEl.textContent = String(data.diasLicenciaConsumidos?.compensatorio || 0)
        if (otrEl) otrEl.textContent = String(data.diasLicenciaConsumidos?.otros || 0)

        // Documentos escaneados (DNI y Carnet)
        const statusDni = document.querySelector('#status-docs-dni')
        const btnContainerDni = document.querySelector('#btn-container-docs-dni')
        const statusLic = document.querySelector('#status-docs-lic')
        const btnContainerLic = document.querySelector('#btn-container-docs-lic')

        if (btnContainerDni && statusDni) {
          btnContainerDni.innerHTML = ''
          if (c.fotoDniFrente || c.fotoDniDorso) {
            statusDni.textContent = 'Documento digitalizado disponible en legajo'
            if (c.fotoDniFrente) {
              const b = document.createElement('button')
              b.className = 'px-2.5 py-1 rounded bg-white border border-line text-xs font-bold text-blue hover:bg-sky transition cursor-pointer'
              b.textContent = 'Ver Frente'
              b.onclick = () => openDocViewer(`DNI Frente - ${c.apellido}, ${c.nombre}`, c.fotoDniFrente)
              btnContainerDni.appendChild(b)
            }
            if (c.fotoDniDorso) {
              const b = document.createElement('button')
              b.className = 'px-2.5 py-1 rounded bg-white border border-line text-xs font-bold text-blue hover:bg-sky transition cursor-pointer'
              b.textContent = 'Ver Dorso'
              b.onclick = () => openDocViewer(`DNI Dorso - ${c.apellido}, ${c.nombre}`, c.fotoDniDorso)
              btnContainerDni.appendChild(b)
            }
          } else {
            statusDni.textContent = 'Sin DNI escaneado cargado aún.'
          }
        }

        if (btnContainerLic && statusLic) {
          btnContainerLic.innerHTML = ''
          if (c.fotoLicenciaFrente || c.fotoLicenciaDorso) {
            statusLic.textContent = 'Carnet digitalizado disponible en legajo'
            if (c.fotoLicenciaFrente) {
              const b = document.createElement('button')
              b.className = 'px-2.5 py-1 rounded bg-white border border-line text-xs font-bold text-blue hover:bg-sky transition cursor-pointer'
              b.textContent = 'Ver Frente'
              b.onclick = () => openDocViewer(`Carnet Frente - ${c.apellido}, ${c.nombre}`, c.fotoLicenciaFrente)
              btnContainerLic.appendChild(b)
            }
            if (c.fotoLicenciaDorso) {
              const b = document.createElement('button')
              b.className = 'px-2.5 py-1 rounded bg-white border border-line text-xs font-bold text-blue hover:bg-sky transition cursor-pointer'
              b.textContent = 'Ver Dorso'
              b.onclick = () => openDocViewer(`Carnet Dorso - ${c.apellido}, ${c.nombre}`, c.fotoLicenciaDorso)
              btnContainerLic.appendChild(b)
            }
          } else {
            statusLic.textContent = 'Sin Carnet escaneado cargado aún.'
          }
        }

        // Pestaña 2: Historial de Viajes
        const badgeViajes = document.querySelector('#badge-count-viajes')
        if (badgeViajes) badgeViajes.textContent = String(data.comisiones.length)
        const viajesEmpty = document.querySelector('#viajes-empty')
        const viajesTable = document.querySelector('#viajes-table-container')
        const viajesTbody = document.querySelector('#viajes-tbody')

        if (viajesTbody) {
          viajesTbody.innerHTML = ''
          if (data.comisiones.length === 0) {
            viajesEmpty?.classList.remove('hidden')
            viajesTable?.classList.add('hidden')
          } else {
            viajesEmpty?.classList.add('hidden')
            viajesTable?.classList.remove('hidden')
            data.comisiones.forEach((vj: any) => {
              const tr = document.createElement('tr')
              tr.className = 'hover:bg-paper/40'
              tr.innerHTML = `
                <td class="px-4 py-3 font-mono font-bold text-navy">${vj.codigo}</td>
                <td class="px-3 py-3 font-bold text-navy">${vj.destino}</td>
                <td class="px-3 py-3 text-blue truncate max-w-[150px]">${vj.area}</td>
                <td class="px-3 py-3 text-muted">${vj.vehiculo} · ${vj.patente}</td>
                <td class="px-3 py-3 text-muted">${vj.fechaSalida}</td>
                <td class="px-3 py-3 font-mono">${vj.kmRecorridos}</td>
                <td class="px-4 py-3 text-right">
                  <span class="rounded px-2 py-0.5 text-[9px] font-bold ${
                    vj.estadoTone === 'green' ? 'bg-emerald-50 text-emerald-600' :
                    vj.estadoTone === 'orange' ? 'bg-amber-50 text-amber-600' : 'bg-sky text-blue'
                  }">
                    ${vj.estado}
                  </span>
                </td>
              `
              viajesTbody.appendChild(tr)
            })
          }
        }

        // Pestaña 3: Historial de Licencias
        const badgeLicencias = document.querySelector('#badge-count-licencias')
        if (badgeLicencias) badgeLicencias.textContent = String(data.licencias.length)
        const licenciasEmpty = document.querySelector('#licencias-empty')
        const licenciasTable = document.querySelector('#licencias-table-container')
        const licenciasTbody = document.querySelector('#licencias-tbody')

        if (licenciasTbody) {
          licenciasTbody.innerHTML = ''
          if (data.licencias.length === 0) {
            licenciasEmpty?.classList.remove('hidden')
            licenciasTable?.classList.add('hidden')
          } else {
            licenciasEmpty?.classList.add('hidden')
            licenciasTable?.classList.remove('hidden')
            data.licencias.forEach((lic: any) => {
              const tr = document.createElement('tr')
              tr.className = 'hover:bg-paper/40'
              tr.innerHTML = `
                <td class="px-4 py-3 font-bold text-navy">${lic.tipoLabel}</td>
                <td class="px-3 py-3 text-muted font-mono">${lic.fechaInicio}</td>
                <td class="px-3 py-3 text-muted font-mono">${lic.fechaFin}</td>
                <td class="px-3 py-3 font-bold text-navy">${lic.diasHabiles} días</td>
                <td class="px-3 py-3 text-muted">${lic.motivo || '—'}</td>
                <td class="px-3 py-3 text-blue">${lic.aprobadoPor}</td>
                <td class="px-4 py-3 text-right">
                  <span class="rounded px-2 py-0.5 text-[9px] font-bold ${
                    lic.estado === 'aprobada' ? 'bg-emerald-50 text-emerald-600' :
                    lic.estado === 'pendiente' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                  }">
                    ${lic.estadoLabel}
                  </span>
                </td>
              `
              licenciasTbody.appendChild(tr)
            })
          }
        }

        // Configurar botón "Registrar nueva licencia" dentro del modal detalle
        const btnAddLicFromModal = document.querySelector('#btn-add-licencia-from-modal')
        if (btnAddLicFromModal) {
          btnAddLicFromModal.setAttribute('data-id', String(c.id))
          btnAddLicFromModal.setAttribute('data-nombre', `${c.apellido}, ${c.nombre}`)
        }

        // Reset tab to first tab
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
        if (detailModal) detailModal.style.display = 'flex'
      } catch (err) {
        alert('Error al obtener la ficha del chofer')
      }
    })
  })

  // -------------------------------------------------------------
  // 7. Modal de Alta / Edición de Chofer
  // -------------------------------------------------------------
  const formModal = document.querySelector('#chofer-form-modal') as HTMLElement | null
  const form = document.querySelector('#chofer-form') as HTMLFormElement | null
  const formTitle = document.querySelector('#chofer-form-title')
  const submitText = document.querySelector('#btn-submit-chofer-text')
  const closeFormBtn = document.querySelector('#close-chofer-form-modal')
  const cancelFormBtn = document.querySelector('#btn-cancel-chofer-form')
  const formAlert = document.querySelector('#chofer-form-alert') as HTMLElement | null

  function closeForm() {
    if (formModal) formModal.style.display = 'none'
    if (formAlert) formAlert.classList.add('hidden')
  }

  closeFormBtn?.addEventListener('click', closeForm)
  cancelFormBtn?.addEventListener('click', closeForm)

  // Manejo de Departamentos de San Juan y Domicilio
  const deptoSelect = document.querySelector('#form-chofer-departamento') as HTMLSelectElement | null
  const calleInput = document.querySelector('#form-chofer-calle') as HTMLInputElement | null
  const direccionInput = document.querySelector('#form-chofer-direccion') as HTMLInputElement | null

  function syncDireccion() {
    const depto = deptoSelect?.value.trim() || ''
    const calle = calleInput?.value.trim() || ''
    if (!direccionInput) return

    if (depto && calle) {
      direccionInput.value = `${calle}, ${depto}, San Juan`
    } else if (depto) {
      direccionInput.value = `${depto}, San Juan`
    } else if (calle) {
      direccionInput.value = calle
    } else {
      direccionInput.value = ''
    }
  }

  deptoSelect?.addEventListener('change', syncDireccion)
  calleInput?.addEventListener('input', syncDireccion)

  // Abrir para crear
  document.querySelector('#btn-open-create-chofer')?.addEventListener('click', () => {
    form?.reset()
    resetDocPreviews()
    setCategoriesFromArray(['B1'])

    if (deptoSelect) deptoSelect.value = ''
    if (calleInput) calleInput.value = ''
    if (direccionInput) direccionInput.value = ''

    if (vencimientoPicker) {
      if (Array.isArray(vencimientoPicker)) vencimientoPicker[0]?.clear()
      else vencimientoPicker.clear()
    }

    const idInput = document.querySelector('#chofer-id') as HTMLInputElement
    if (idInput) idInput.value = ''
    if (formTitle) formTitle.textContent = 'Registrar Nuevo Chofer'
    if (submitText) submitText.textContent = 'Guardar Chofer'
    if (formModal) formModal.style.display = 'flex'

    // Enfocar automáticamente el lector de pistola para agilizar
    setTimeout(() => {
      scannerInput?.focus()
    }, 150)
  })

  // Abrir para editar
  document.querySelectorAll('.btn-edit-chofer').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id')
      if (!id) return

      try {
        const res = await fetch(`/api/choferes?id=${id}`)
        if (!res.ok) throw new Error('No se pudo cargar el chofer')
        const { chofer: c } = await res.json()
        if (!c) return

        form?.reset()
        resetDocPreviews()

        if (formTitle) formTitle.textContent = `Editar Chofer: ${c.nombre} ${c.apellido}`
        if (submitText) submitText.textContent = 'Actualizar Cambios'

        const setValue = (selector: string, value: any) => {
          const el = document.querySelector(selector) as HTMLInputElement | HTMLSelectElement
          if (el && value != null) el.value = String(value)
        }

        setValue('#chofer-id', c.id)
        setValue('#form-chofer-nombre', c.nombre)
        setValue('#form-chofer-apellido', c.apellido)
        setValue('#form-chofer-dni', c.dni)
        setValue('#form-chofer-cuil', c.cuil || '')
        setValue('#form-chofer-telefono', c.telefono || '')
        setValue('#form-chofer-email', c.email || '')
        
        // Cargar Departamento y Domicilio
        const departamentosSanJuanList = [
          'Capital', 'Rawson', 'Rivadavia', 'Chimbas', 'Santa Lucía', 'Pocito',
          'Albardón', 'Angaco', 'Caucete', '9 de Julio', 'San Martín', '25 de Mayo',
          'Sarmiento', 'Ullum', 'Zonda', 'Calingasta', 'Iglesia', 'Jáchal', 'Valle Fértil'
        ]

        const rawDir = c.direccion || ''
        if (direccionInput) direccionInput.value = rawDir

        let matchedDepto = ''
        for (const d of departamentosSanJuanList) {
          if (rawDir.toLowerCase().includes(d.toLowerCase())) {
            matchedDepto = d
            break
          }
        }

        if (deptoSelect) deptoSelect.value = matchedDepto
        if (calleInput) {
          if (matchedDepto) {
            const cleanCalle = rawDir
              .replace(new RegExp(matchedDepto, 'gi'), '')
              .replace(/san juan/gi, '')
              .replace(/,\s*,/g, ',')
              .replace(/^[\s,]+|[\s,]+$/g, '')
            calleInput.value = cleanCalle
          } else {
            calleInput.value = rawDir
          }
        }

        setValue('#form-chofer-licencia', c.numeroLicencia)
        
        if (c.fechaVencimientoLicencia) {
          const vDate = c.fechaVencimientoLicencia.split('T')[0]
          if (vencimientoPicker) {
            if (Array.isArray(vencimientoPicker)) vencimientoPicker[0]?.setDate(vDate, true)
            else vencimientoPicker.setDate(vDate, true)
          } else {
            setValue('#form-chofer-vencimiento', vDate)
          }
        } else if (vencimientoPicker) {
          if (Array.isArray(vencimientoPicker)) vencimientoPicker[0]?.clear()
          else vencimientoPicker.clear()
        }

        setValue('#form-chofer-estado', c.estado)
        setValue('#form-chofer-observaciones', c.observaciones || '')

        // Cargar categorías múltiples
        const cats = c.categoriasList && c.categoriasList.length > 0 ? c.categoriasList : (c.categoriaLicencia || 'B1').split(',')
        setCategoriesFromArray(cats)

        // Cargar previsualizaciones de documentos existentes
        setDocPreview('#preview-dni-frente-container', '#placeholder-dni-frente', '#preview-dni-frente', '#form-foto-dni-frente', c.fotoDniFrente)
        setDocPreview('#preview-dni-dorso-container', '#placeholder-dni-dorso', '#preview-dni-dorso', '#form-foto-dni-dorso', c.fotoDniDorso)
        setDocPreview('#preview-lic-frente-container', '#placeholder-lic-frente', '#preview-lic-frente', '#form-foto-lic-frente', c.fotoLicenciaFrente)
        setDocPreview('#preview-lic-dorso-container', '#placeholder-lic-dorso', '#preview-lic-dorso', '#form-foto-lic-dorso', c.fotoLicenciaDorso)

        if (formModal) formModal.style.display = 'flex'
      } catch (err) {
        alert('Error al abrir editor de chofer')
      }
    })
  })

  // Submit de Alta / Edición
  form?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const formData = new FormData(form)
    const payload: Record<string, any> = {}

    formData.forEach((value, key) => {
      payload[key] = value
    })

    if (payload.id) payload.id = Number(payload.id)

    try {
      const res = await fetch('/api/choferes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al guardar el chofer')
      }

      if (formAlert) {
        formAlert.className = 'rounded-lg p-3 text-xs font-semibold bg-emerald-50 text-emerald-700 block'
        formAlert.textContent = '¡Chofer guardado correctamente! Actualizando...'
      }

      setTimeout(() => {
        window.location.reload()
      }, 700)
    } catch (error: any) {
      if (formAlert) {
        formAlert.className = 'rounded-lg p-3 text-xs font-semibold bg-rose-50 text-rose-700 block'
        formAlert.textContent = error.message || 'Error al procesar solicitud'
      }
    }
  })

  // -------------------------------------------------------------
  // 8. Modal de Registro de Licencias y Ausencias
  // -------------------------------------------------------------
  const licenciaModal = document.querySelector('#chofer-licencia-modal') as HTMLElement | null
  const licenciaForm = document.querySelector('#chofer-licencia-form') as HTMLFormElement | null
  const closeLicenciaBtn = document.querySelector('#close-chofer-licencia-modal')
  const cancelLicenciaBtn = document.querySelector('#btn-cancel-licencia-form')
  const licenciaAlert = document.querySelector('#chofer-licencia-alert') as HTMLElement | null
  const choferNombreLabel = document.querySelector('#licencia-modal-chofer-nombre')
  const choferIdInput = document.querySelector('#licencia-chofer-id') as HTMLInputElement | null

  function closeLicenciaModal() {
    if (licenciaModal) licenciaModal.style.display = 'none'
    if (licenciaAlert) licenciaAlert.classList.add('hidden')
  }

  closeLicenciaBtn?.addEventListener('click', closeLicenciaModal)
  cancelLicenciaBtn?.addEventListener('click', closeLicenciaModal)

  function openLicenciaModal(id: string, nombre: string) {
    licenciaForm?.reset()
    if (licInicioPicker) {
      if (Array.isArray(licInicioPicker)) licInicioPicker[0]?.clear()
      else licInicioPicker.clear()
    }
    if (licFinPicker) {
      if (Array.isArray(licFinPicker)) licFinPicker[0]?.clear()
      else licFinPicker.clear()
    }
    if (choferIdInput) choferIdInput.value = id
    if (choferNombreLabel) choferNombreLabel.textContent = `Chofer: ${nombre}`
    if (licenciaModal) licenciaModal.style.display = 'flex'
  }

  // Desde la tabla principal
  document.querySelectorAll('.btn-add-licencia').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id')
      const nombre = btn.getAttribute('data-nombre') || 'Seleccionado'
      if (id) openLicenciaModal(id, nombre)
    })
  })

  // Desde la ficha detalle 360
  document.querySelector('#btn-add-licencia-from-modal')?.addEventListener('click', (e) => {
    const target = e.currentTarget as HTMLElement
    const id = target.getAttribute('data-id')
    const nombre = target.getAttribute('data-nombre') || 'Seleccionado'
    if (id) {
      closeDetail()
      openLicenciaModal(id, nombre)
    }
  })

  // Submit de Licencia
  licenciaForm?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const formData = new FormData(licenciaForm)
    const payload: Record<string, any> = {}

    formData.forEach((value, key) => {
      payload[key] = value
    })

    payload.choferId = Number(payload.choferId)

    try {
      const res = await fetch('/api/choferes/licencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al registrar licencia')
      }

      if (licenciaAlert) {
        licenciaAlert.className = 'rounded-lg p-3 text-xs font-semibold bg-emerald-50 text-emerald-700 block'
        licenciaAlert.textContent = '¡Licencia registrada con éxito! Actualizando...'
      }

      setTimeout(() => {
        window.location.reload()
      }, 700)
    } catch (error: any) {
      if (licenciaAlert) {
        licenciaAlert.className = 'rounded-lg p-3 text-xs font-semibold bg-rose-50 text-rose-700 block'
        licenciaAlert.textContent = error.message || 'Error al registrar ausencia'
      }
    }
  })

  // Cierre con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDocViewer()
      closeDetail()
      closeForm()
      closeLicenciaModal()
    }
  })
}

// Ejecutar inmediatamente al importar en la página
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initChoferesController())
  } else {
    initChoferesController()
  }
}
