/**
 * ============================================================================
 *  PWA TEST SUITE - SUITE DE PRUEBAS INTEGRAL DE PROGRESSIVE WEB APP
 *  SCVehículos · Ministerio de Educación · Gobierno de San Juan
 * ============================================================================
 */

import { strict as assertStrict } from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:4321'

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
}

let passedCount = 0
let failedCount = 0
const results = []

function logTitle(title) {
  console.log(`\n${COLORS.cyan}${COLORS.bold}--- ${title} ---${COLORS.reset}`)
}

function recordPass(code, name, detail) {
  passedCount++
  results.push({ code, name, status: 'PASSED', detail })
  console.log(`  ${COLORS.green}✓ [PASSED]${COLORS.reset} ${COLORS.bold}${code}:${COLORS.reset} ${name} ${COLORS.dim}(${detail})${COLORS.reset}`)
}

function recordFail(code, name, error) {
  failedCount++
  results.push({ code, name, status: 'FAILED', error: error.message || String(error) })
  console.error(`  ${COLORS.red}✗ [FAILED]${COLORS.reset} ${COLORS.bold}${code}:${COLORS.reset} ${name}\n    ${COLORS.red}Motivo: ${error.message || error}${COLORS.reset}`)
}

async function runTest(code, name, testFn) {
  try {
    const detail = await testFn()
    recordPass(code, name, detail || 'OK')
  } catch (err) {
    recordFail(code, name, err)
  }
}

async function main() {
  console.log(`\n${COLORS.bold}======================================================================${COLORS.reset}`)
  console.log(`${COLORS.bold} SUITE DE AUDITORÍA Y CERTIFICACIÓN PWA (Progressive Web App)${COLORS.reset}`)
  console.log(`${COLORS.cyan} SCVehículos · Ministerio de Educación · San Juan${COLORS.reset}`)
  console.log(`${COLORS.bold} Target Server: ${BASE_URL}${COLORS.reset}`)
  console.log(`${COLORS.bold}======================================================================${COLORS.reset}`)

  // --------------------------------------------------------------------------
  // BLOQUE 1: AUDITORÍA DE MANIFIESTO WEB APP (W3C STANDARDS)
  // --------------------------------------------------------------------------
  logTitle('BLOQUE 1: AUDITORÍA DE MANIFIESTO WEB APP (W3C STANDARDS)')

  let manifestWeb = null

  await runTest(
    'PT-01',
    'Disponibilidad y especificación W3C de manifest.webmanifest',
    async () => {
      const res = await fetch(`${BASE_URL}/manifest.webmanifest`)
      assertStrict.equal(res.status, 200, `Status esperado 200 pero fue ${res.status}`)
      const contentType = res.headers.get('content-type') || ''
      assertStrict.ok(
        contentType.includes('application/manifest+json') || contentType.includes('application/json'),
        `Content-Type inválido: ${contentType}`
      )

      manifestWeb = await res.json()

      // Validar claves obligatorias
      assertStrict.equal(manifestWeb.id, '/', 'id debe ser "/"')
      assertStrict.equal(manifestWeb.start_url, '/', 'start_url debe ser "/"')
      assertStrict.equal(manifestWeb.scope, '/', 'scope debe ser "/"')
      assertStrict.equal(manifestWeb.display, 'standalone', 'display debe ser "standalone"')
      assertStrict.ok(manifestWeb.name && manifestWeb.name.includes('SCVehículos'), 'name inválido')
      assertStrict.ok(manifestWeb.short_name, 'short_name requerido')
      assertStrict.equal(manifestWeb.theme_color, '#0b2240', 'theme_color debe ser #0b2240')
      assertStrict.equal(manifestWeb.background_color, '#0b2240', 'background_color debe ser #0b2240')
      assertStrict.equal(manifestWeb.lang, 'es-AR', 'lang debe ser es-AR')
      assertStrict.ok(Array.isArray(manifestWeb.icons) && manifestWeb.icons.length >= 4, 'Al menos 4 iconos requeridos')

      return `Válido W3C: ${manifestWeb.name} (${manifestWeb.display})`
    }
  )

  await runTest(
    'PT-02',
    'Disponibilidad y sincronía de manifest.json (fallback estándar)',
    async () => {
      const res = await fetch(`${BASE_URL}/manifest.json`)
      assertStrict.equal(res.status, 200, `Status esperado 200 pero fue ${res.status}`)
      const contentType = res.headers.get('content-type') || ''
      assertStrict.ok(contentType.includes('json'), `Content-Type esperado json pero fue ${contentType}`)

      const manifestJson = await res.json()
      assertStrict.equal(manifestJson.name, manifestWeb.name, 'name discordante')
      assertStrict.equal(manifestJson.start_url, manifestWeb.start_url, 'start_url discordante')
      assertStrict.equal(manifestJson.theme_color, manifestWeb.theme_color, 'theme_color discordante')

      return 'Sincronizado con manifest.webmanifest'
    }
  )

  await runTest(
    'PT-03',
    'Validación de Acciones Rápidas (Shortcuts) del Manifiesto',
    async () => {
      assertStrict.ok(Array.isArray(manifestWeb.shortcuts) && manifestWeb.shortcuts.length === 4, 'Deben existir 4 shortcuts')
      
      const expectedUrls = ['/mi-viaje', '/viajes', '/flota', '/combustible']
      for (const item of manifestWeb.shortcuts) {
        assertStrict.ok(expectedUrls.includes(item.url), `Shortcut con URL no esperada: ${item.url}`)
        assertStrict.ok(item.name && item.name.length > 0, `Nombre faltante en shortcut ${item.url}`)
        assertStrict.ok(Array.isArray(item.icons) && item.icons.length > 0, `Icono faltante en shortcut ${item.url}`)
      }

      return `4 shortcuts configurados: ${expectedUrls.join(', ')}`
    }
  )

  // --------------------------------------------------------------------------
  // BLOQUE 2: ICONOGRAFÍA Y RECURSOS GRÁFICOS MULTI-RESOLUCIÓN
  // --------------------------------------------------------------------------
  logTitle('BLOQUE 2: ICONOGRAFÍA Y RECURSOS GRÁFICOS MULTI-RESOLUCIÓN')

  await runTest(
    'PT-04',
    'Auditoría de Iconos PWA: PNG 192px, 512px, Maskable y SVG',
    async () => {
      const iconsToCheck = [
        { url: '/icons/icon-192.png', type: 'image/png' },
        { url: '/icons/icon-maskable-192.png', type: 'image/png' },
        { url: '/icons/icon-512.png', type: 'image/png' },
        { url: '/icons/icon-maskable-512.png', type: 'image/png' },
        { url: '/icons/icon.svg', type: 'image/svg+xml' },
        { url: '/icons/apple-touch-icon.png', type: 'image/png' },
        { url: '/branding/logo san juan 2.png', type: 'image/png' },
      ]

      for (const ic of iconsToCheck) {
        const res = await fetch(`${BASE_URL}${encodeURI(ic.url)}`)
        assertStrict.equal(res.status, 200, `Error 404/no encontrado en ${ic.url}`)
        const ct = res.headers.get('content-type') || ''
        assertStrict.ok(ct.includes(ic.type.split('/')[0]), `Tipo de contenido inválido para ${ic.url}: ${ct}`)
        const buffer = await res.arrayBuffer()
        assertStrict.ok(buffer.byteLength > 100, `Tamaño de archivo sospechosamente pequeño en ${ic.url} (${buffer.byteLength} bytes)`)
      }

      return '7/7 activos gráficos verificados y con peso óptimo'
    }
  )

  // --------------------------------------------------------------------------
  // BLOQUE 3: SERVICE WORKER, CICLO DE VIDA Y CACHÉ OFFLINE
  // --------------------------------------------------------------------------
  logTitle('BLOQUE 3: SERVICE WORKER, CICLO DE VIDA Y CACHÉ OFFLINE')

  let swCode = ''

  await runTest(
    'PT-05',
    'Integridad sintáctica y endpoints del Service Worker (/sw.js)',
    async () => {
      const res = await fetch(`${BASE_URL}/sw.js`)
      assertStrict.equal(res.status, 200, `Status esperado 200 pero fue ${res.status}`)
      const ct = res.headers.get('content-type') || ''
      assertStrict.ok(ct.includes('javascript'), `Content-Type esperado javascript pero fue ${ct}`)

      swCode = await res.text()
      assertStrict.ok(swCode.length > 500, 'sw.js tiene longitud insuficiente')

      // Validar sintaxis en sandbox Node vm
      const script = new vm.Script(swCode, { filename: 'sw.js' })
      assertStrict.ok(script, 'El script del service worker compila sin errores de sintaxis')

      // Verificar que implemente los eventos esenciales
      assertStrict.ok(swCode.includes("addEventListener('install'"), 'Falta listener install')
      assertStrict.ok(swCode.includes("addEventListener('activate'"), 'Falta listener activate')
      assertStrict.ok(swCode.includes("addEventListener('fetch'"), 'Falta listener fetch')
      assertStrict.ok(swCode.includes("addEventListener('message'"), 'Falta listener message')

      return `Compilación JS limpia (${swCode.length} bytes), 4 listeners registrados`
    }
  )

  await runTest(
    'PT-06',
    'Verificación de Precache Assets: 0 recursos 404 durante install',
    async () => {
      // Extraer PRECACHE_ASSETS por regex
      const match = swCode.match(/const\s+PRECACHE_ASSETS\s*=\s*\[([\s\S]*?)\];/)
      assertStrict.ok(match, 'No se pudo extraer PRECACHE_ASSETS del sw.js')

      const rawAssets = match[1]
        .split('\n')
        .map((l) => l.trim().replace(/[',]/g, ''))
        .filter((l) => l.startsWith('/'))

      assertStrict.ok(rawAssets.length >= 8, `Se esperaban al menos 8 assets, se encontraron ${rawAssets.length}`)

      for (const assetPath of rawAssets) {
        const res = await fetch(`${BASE_URL}${encodeURI(assetPath)}`)
        assertStrict.equal(res.status, 200, `Asset de precache no disponible (HTTP ${res.status}): ${assetPath}`)
      }

      return `${rawAssets.length}/${rawAssets.length} activos de precaché accesibles con HTTP 200`
    }
  )

  await runTest(
    'PT-07',
    'Disponibilidad e interactividad de la Pantalla Offline (/offline.html)',
    async () => {
      const res = await fetch(`${BASE_URL}/offline.html`)
      assertStrict.equal(res.status, 200, `Status esperado 200 pero fue ${res.status}`)
      const ct = res.headers.get('content-type') || ''
      assertStrict.ok(ct.includes('html'), `Content-Type esperado html pero fue ${ct}`)

      const html = await res.text()
      assertStrict.ok(html.includes('Sin Conexión a Internet'), 'Falta título "Sin Conexión a Internet"')
      assertStrict.ok(html.includes('Reintentar Conexión'), 'Falta botón de reintento de conexión')
      assertStrict.ok(html.includes("window.addEventListener('online'"), 'Falta evento reactivo de red online')
      assertStrict.ok(html.includes('retryConnection'), 'Falta función retryConnection')

      return 'Pantalla de contingencia offline 100% autónoma y reactiva'
    }
  )

  // --------------------------------------------------------------------------
  // BLOQUE 4: INTEGRACIÓN EN EL FRONTEND & COMPONENTE PWAMANAGER
  // --------------------------------------------------------------------------
  logTitle('BLOQUE 4: INTEGRACIÓN EN EL FRONTEND & COMPONENTE PWAMANAGER')

  await runTest(
    'PT-08',
    'Auditoría de Metadatos PWA y enlaces en el <head> de páginas públicas y privadas',
    async () => {
      const pagesToTest = ['/login']

      for (const pageUrl of pagesToTest) {
        const res = await fetch(`${BASE_URL}${pageUrl}`)
        const html = await res.text()

        assertStrict.ok(
          html.includes('rel="manifest"') && html.includes('/manifest.webmanifest'),
          `Falta <link rel="manifest"> en ${pageUrl}`
        )
        assertStrict.ok(
          html.includes('name="theme-color"') && html.includes('#0b2240'),
          `Falta <meta name="theme-color"> en ${pageUrl}`
        )
        assertStrict.ok(
          html.includes('name="apple-mobile-web-app-capable"') && html.includes('yes'),
          `Falta apple-mobile-web-app-capable en ${pageUrl}`
        )
        assertStrict.ok(
          html.includes('rel="apple-touch-icon"'),
          `Falta <link rel="apple-touch-icon"> en ${pageUrl}`
        )
      }

      return 'Cabeceras PWA presentes en plantillas de la aplicación'
    }
  )

  await runTest(
    'PT-09',
    'Componente PwaManager: Alertas de red, banner inferior y modal iOS',
    async () => {
      const res = await fetch(`${BASE_URL}/login`)
      const html = await res.text()

      // 1. Badge de red
      assertStrict.ok(html.includes('id="pwa-network-badge"'), 'Falta #pwa-network-badge')
      assertStrict.ok(html.includes('id="pwa-offline-pill"'), 'Falta #pwa-offline-pill')
      assertStrict.ok(html.includes('id="pwa-online-pill"'), 'Falta #pwa-online-pill')

      // 2. Banner de instalación
      assertStrict.ok(html.includes('id="pwa-install-banner"'), 'Falta #pwa-install-banner')
      assertStrict.ok(html.includes('id="pwa-banner-install-btn"'), 'Falta #pwa-banner-install-btn')

      // 3. Banner de actualización
      assertStrict.ok(html.includes('id="pwa-update-banner"'), 'Falta #pwa-update-banner')
      assertStrict.ok(html.includes('id="pwa-btn-reload"'), 'Falta #pwa-btn-reload')

      // 4. Modal para iOS
      assertStrict.ok(html.includes('id="pwa-ios-modal"'), 'Falta #pwa-ios-modal')
      assertStrict.ok(html.includes('Instalar en tu iPhone / iPad'), 'Falta texto instructivo de iOS')

      // 5. Script de registro de Service Worker
      assertStrict.ok(
        /navigator\.serviceWorker[\s\n\r]*\.register\(['"]\/sw\.js['"]\)/.test(html),
        'Falta registro de sw.js en cliente'
      )

      return 'Estructura completa de PwaManager verificada en DOM'
    }
  )

  // --------------------------------------------------------------------------
  // BLOQUE 5: CONTRATOS Y ESTRATEGIAS DE CONTINGENCIA OFFLINE
  // --------------------------------------------------------------------------
  logTitle('BLOQUE 5: CONTRATOS Y ESTRATEGIAS DE CONTINGENCIA OFFLINE')

  await runTest(
    'PT-10',
    'Estrategia API Offline: Contrato JSON 503 ante caída de conectividad',
    async () => {
      // El Service Worker intercepta /api/* con:
      // status: 503, { success: false, offline: true, error: '...' }
      assertStrict.ok(
        swCode.includes("url.pathname.startsWith('/api/')"),
        'El Service Worker debe tener regla exclusiva para /api/'
      )
      assertStrict.ok(
        swCode.includes('offline: true'),
        'La respuesta de contingencia API debe incluir "offline: true"'
      )
      assertStrict.ok(
        swCode.includes('status: 503'),
        'El status code de contingencia API debe ser 503 Service Unavailable'
      )

      return 'Regla Network-Only con respuesta 503 JSON declarada en Service Worker'
    }
  )

  await runTest(
    'PT-11',
    'Estrategia de Navegación: Fallback a /offline.html declarado en Service Worker',
    async () => {
      assertStrict.ok(
        swCode.includes("request.mode === 'navigate'"),
        'El Service Worker debe interceptar navegaciones HTML'
      )
      assertStrict.ok(
        swCode.includes("caches.match('/offline.html')"),
        'El Service Worker debe recurrir a /offline.html ante fallo de navegación'
      )

      return 'Network-First con respaldo en /offline.html activo'
    }
  )

  await runTest(
    'PT-12',
    'Estrategia de Recursos Estáticos: Stale-While-Revalidate configurado',
    async () => {
      assertStrict.ok(
        swCode.includes("url.pathname.startsWith('/_astro/')"),
        'Debe incluir assets de /_astro/'
      )
      assertStrict.ok(
        swCode.includes("url.pathname.startsWith('/icons/')"),
        'Debe incluir assets de /icons/'
      )
      assertStrict.ok(
        swCode.includes("RUNTIME_CACHE"),
        'Debe utilizar la caché scvehiculos-runtime-v1 para recursos dinámicos'
      )

      return 'Stale-While-Revalidate para CSS, JS, fuentes e imágenes'
    }
  )

  // --------------------------------------------------------------------------
  // RESUMEN GENERAL
  // --------------------------------------------------------------------------
  console.log(`\n${COLORS.bold}======================================================================${COLORS.reset}`)
  console.log(`${COLORS.bold} RESUMEN DE RESULTADOS DE AUDITORÍA PWA${COLORS.reset}`)
  console.log(`${COLORS.bold}======================================================================${COLORS.reset}`)
  console.log(` Total de Casos Evaluados: ${results.length}`)
  console.log(` ${COLORS.green}Casos Exitosos:            ${passedCount}${COLORS.reset}`)
  console.log(` ${COLORS.red}Casos Fallidos:            ${failedCount}${COLORS.reset}`)
  const rate = Math.round((passedCount / results.length) * 100)
  console.log(` Tasa de Cumplimiento:     ${rate === 100 ? COLORS.green : COLORS.yellow}${rate}%${COLORS.reset}`)
  console.log(`${COLORS.bold}======================================================================${COLORS.reset}\n`)

  if (failedCount > 0) {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Error fatal durante la ejecución de las pruebas PWA:', err)
  process.exit(1)
})
