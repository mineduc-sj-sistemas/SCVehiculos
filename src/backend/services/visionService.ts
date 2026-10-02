import fs from 'node:fs'
import path from 'node:path'
import type { AnalisisTablero, AnalisisTicketCombustible, VisionServiceConfig } from '../types/vision.types'

/**
 * Servicio de Visión IA — Gemini Flash (Google AI Studio)
 *
 * Analiza fotografías de tableros vehiculares y tickets de combustible (Edenred, YPF, etc.) para extraer:
 * - Kilometraje (odómetro)
 * - Nivel de combustible (agujas analógicas incluidas)
 * - Datos de tickets: litros, importe, precio/litro, estación, N° ticket, fecha y odómetro
 *
 * La imagen se procesa en memoria y NUNCA se almacena en disco ni en base de datos.
 */

/**
 * Obtiene la API key de Gemini de forma dinámica y tolerante:
 * 1. Desde process.env
 * 2. Desde import.meta.env
 * 3. Directamente desde el archivo .env en disco (sin necesidad de reiniciar el dev server)
 */
function getGeminiApiKey(): string {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
    return process.env.GEMINI_API_KEY.trim()
  }

  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env?.GEMINI_API_KEY) {
      return String((import.meta as any).env.GEMINI_API_KEY).trim()
    }
  } catch {}

  try {
    const envPath = path.resolve(process.cwd(), '.env')
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8')
      const match = content.match(/^GEMINI_API_KEY=(.+)$/m)
      if (match && match[1]) {
        const val = match[1].trim().replace(/^['"]|['"]$/g, '')
        process.env.GEMINI_API_KEY = val
        return val
      }
    }
  } catch {}

  return ''
}

const GEMINI_CONFIG: VisionServiceConfig = {
  apiKey: '',
  model: 'gemini-3.5-flash',
  maxImageSizeBytes: 10 * 1024 * 1024, // 10 MB
}

/**
 * Modelos de Gemini en orden de prioridad.
 * Si el primero sufre sobrecarga temporal (HTTP 503 / 429), se conmuta automáticamente al siguiente.
 */
const GEMINI_MODELS_POOL = [
  'gemini-flash-lite-latest',
  'gemini-3.5-flash',
  'gemini-3.8-flash',
]

/**
 * Ejecuta una petición multimodal a Gemini con tolerancia a fallos y conmutación automática entre modelos.
 */
async function executeGeminiWithFallback(apiKey: string, requestBody: any): Promise<string> {
  let lastError: Error | null = null

  for (const model of GEMINI_MODELS_POOL) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      // Si Google responde 503 (Sobrecarga de modelo), 429 (Rate limit) o 500 (Error temporal), reintentar con el siguiente
      if (response.status === 503 || response.status === 429 || response.status === 500) {
        console.warn(`[VisionService] Modelo ${model} respondió HTTP ${response.status}. Reintentando con siguiente modelo...`)
        lastError = new Error(`El servicio de IA se encuentra temporalmente ocupado (${response.status}).`)
        continue
      }

      if (!response.ok) {
        const errorBody = await response.text()
        console.error(`[VisionService] Error en modelo ${model}:`, response.status, errorBody)

        if (response.status === 403) {
          throw new Error('API Key de Gemini inválida o sin permisos. Verificá la configuración.')
        }

        throw new Error(`Error al comunicarse con la IA (HTTP ${response.status}).`)
      }

      const data = await response.json()
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text

      if (!rawText) {
        const blockReason = data?.candidates?.[0]?.finishReason
        if (blockReason === 'SAFETY') {
          throw new Error('La imagen fue bloqueada por los filtros de seguridad de la IA.')
        }
        throw new Error('La IA no generó una respuesta válida. Intentá con otra foto.')
      }

      return rawText
    } catch (err: any) {
      if (err.message?.includes('API Key de Gemini')) {
        throw err
      }
      lastError = err
    }
  }

  throw lastError || new Error('No se pudo procesar la imagen con ninguno de los modelos disponibles.')
}

/**
 * Prompt para análisis estructurado de comprobantes y tickets Edenred / YPF / Estaciones de servicio.
 */
const PROMPT_ANALISIS_TICKET = `Eres un asistente especializado en leer tickets, cupones y comprobantes de carga de combustible en Argentina (en particular tickets de terminales Edenred, Ticket Car, YPF en Ruta, Shell, Axion, etc.).

Analiza la fotografía del ticket/comprobante de combustible y extrae la siguiente información en formato JSON estricto:

{
  "estacionServicio": <nombre de la estación, bandera o razón social, ej: "YPF ACA San Juan", "Shell Rawson", o null>,
  "litros": <número flotante de litros cargados, ej: 42.50, o null si no se ve>,
  "precioPorLitro": <número flotante de precio por litro en pesos argentinos, ej: 1250.00, o null si no se ve>,
  "importeTotal": <número flotante del importe total pagado en pesos argentinos, ej: 53125.00, o null si no se ve>,
  "odometro": <número entero del kilometraje/odómetro si fue ingresado en el ticket/posnet, o null>,
  "numeroTicket": <string con el número de ticket, cupón, comprobante o número de operación Edenred, ej: "00124589", o null>,
  "tipoCombustible": <uno de los siguientes strings exactos: "diesel_500", "diesel_grado_3", "nafta_super", "nafta_premium", "gnc", o null>,
  "fechaCarga": <string fecha en formato "YYYY-MM-DDTHH:mm" si es visible, o "YYYY-MM-DD", o null>,
  "patente": <string de la patente si figura en el comprobante, o null>,
  "conductorDni": <string con el DNI o número de conductor si figura bajo 'CONDUCTOR', o null>,
  "confianza": <0-100, tu nivel de confianza en la lectura>,
  "observaciones": <nota si algún dato quedó dudoso o la foto está borrosa, o null>
}

REGLAS:
- Devuelve SOLO el JSON, sin texto adicional, sin markdown, sin backticks.
- Normaliza los tipos de combustible a:
  * "diesel_500" para Diesel Común, Ultra Diesel, D500, Diesel 500.
  * "diesel_grado_3" para Infinia Diesel, V-Power Diesel, Quantium Diesel, Euro Diesel, Grado 3.
  * "nafta_super" para Nafta Súper, Super.
  * "nafta_premium" para Infinia Nafta, V-Power Nafta, Quantium Nafta, Premium.
  * "gnc" para GNC / Gas Natural Comprimido.
- Si ves 'Litros' o 'Volumen', asegúrate de extraer el número de litros exacto.
- Si ves 'Total', 'Importe' o '$', extrae el total monetario. Si falta el importe total pero tienes litros y precio unitario, calcúlalo.
- Si en el ticket figura 'Km' u 'Odómetro', extráelo en "odometro".`

/**
 * Prompt de sistema diseñado para extracción estructurada de tableros vehiculares.
 * Instruye al modelo a devolver JSON estricto con los campos esperados.
 */
const PROMPT_ANALISIS_TABLERO = `Eres un asistente especializado en leer tableros de vehículos (autos, camionetas, utilitarios).

Analiza la fotografía del tablero/panel de instrumentos y extrae la siguiente información en formato JSON estricto:

{
  "kilometraje": <número entero del odómetro en km, o null si no es visible>,
  "nivelCombustible": <porcentaje estimado del tanque 0-100, o null si no se ve>,
  "nivelCombustibleTexto": <descripción textual: "vacío", "reserva", "1/4", "1/2", "3/4", "lleno", o null>,
  "temperaturaMotor": <lectura si es visible, ej: "90°C", "normal", o null>,
  "alertasVisibles": [<lista de alertas/luces encendidas visibles, strings>],
  "confianza": <0-100, tu nivel de confianza en la lectura general>,
  "observaciones": <nota breve si algo no se pudo leer bien, o null>
}

REGLAS:
- Devuelve SOLO el JSON, sin texto adicional, sin markdown, sin backticks.
- Para el combustible con aguja analógica, estima la posición: E=0%, 1/4=25%, 1/2=50%, 3/4=75%, F=100%.
- Si la foto está borrosa o no es un tablero, responde con confianza 0 y observaciones explicando el problema.
- El kilometraje es siempre un número entero (sin decimales).
- Si ves el odómetro parcial (trip meter vs total), prioriza el total.`

/**
 * Valida y obtiene la API key de Gemini de forma dinámica
 */
function assertApiKey(): string {
  const key = getGeminiApiKey()
  if (!key) {
    throw new Error(
      'GEMINI_API_KEY no está configurada. Agregá la variable de entorno en el archivo .env'
    )
  }
  return key
}

/**
 * Extrae el tipo MIME y los datos base64 puros de un DataURL.
 * Ejemplo: "data:image/jpeg;base64,/9j/4AAQ..." → { mimeType: "image/jpeg", data: "/9j/4AAQ..." }
 */
function parseBase64DataUrl(dataUrl: string): { mimeType: string; data: string } {
  const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/)
  if (!match) {
    throw new Error('Formato de imagen inválido. Se espera un DataURL base64 (data:image/...;base64,...)')
  }
  return { mimeType: match[1], data: match[2] }
}

/**
 * Valida el tamaño y formato de la imagen antes de enviarla a la API.
 */
function validateImage(base64Data: string, mimeType: string): void {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  if (!validTypes.includes(mimeType)) {
    throw new Error(`Formato de imagen no soportado: ${mimeType}. Usa JPEG, PNG o WebP.`)
  }

  // Estimar tamaño en bytes desde base64 (ratio ~4:3)
  const estimatedBytes = Math.ceil(base64Data.length * 0.75)
  if (estimatedBytes > GEMINI_CONFIG.maxImageSizeBytes) {
    const maxMB = GEMINI_CONFIG.maxImageSizeBytes / (1024 * 1024)
    throw new Error(`La imagen es demasiado grande. Máximo permitido: ${maxMB} MB.`)
  }
}

/**
 * Parsea la respuesta de Gemini que debería ser JSON puro.
 * Maneja casos donde el modelo envuelve el JSON en backticks o texto extra.
 */
function parseGeminiResponse(rawText: string): AnalisisTablero {
  let cleaned = rawText.trim()

  // Remover posibles backticks de markdown (```json ... ```)
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
  }

  try {
    const parsed = JSON.parse(cleaned)

    return {
      kilometraje: parsed.kilometraje != null ? Math.round(Number(parsed.kilometraje)) : null,
      nivelCombustible: parsed.nivelCombustible != null ? Math.min(100, Math.max(0, Number(parsed.nivelCombustible))) : null,
      nivelCombustibleTexto: parsed.nivelCombustibleTexto ?? null,
      temperaturaMotor: parsed.temperaturaMotor ?? null,
      alertasVisibles: Array.isArray(parsed.alertasVisibles) ? parsed.alertasVisibles.map(String) : [],
      confianza: parsed.confianza != null ? Math.min(100, Math.max(0, Number(parsed.confianza))) : 0,
      observaciones: parsed.observaciones ?? null,
    }
  } catch {
    throw new Error(`La IA no devolvió un formato válido. Respuesta: ${cleaned.substring(0, 200)}`)
  }
}

/**
 * Analiza una fotografía de tablero vehicular usando Google Gemini Flash.
 *
 * @param imageBase64 - Imagen en formato DataURL (data:image/jpeg;base64,...) o base64 puro
 * @returns Datos estructurados extraídos del tablero
 *
 * @example
 * ```typescript
 * const resultado = await analizarTablero('data:image/jpeg;base64,/9j/4AAQ...')
 * // { kilometraje: 156432, nivelCombustible: 75, nivelCombustibleTexto: "3/4", ... }
 * ```
 */
export async function analizarTablero(imageBase64: string): Promise<AnalisisTablero> {
  const apiKey = assertApiKey()

  // Parsear DataURL si viene con prefijo, o asumir JPEG si viene base64 puro
  let mimeType: string
  let base64Data: string

  if (imageBase64.startsWith('data:')) {
    const parsed = parseBase64DataUrl(imageBase64)
    mimeType = parsed.mimeType
    base64Data = parsed.data
  } else {
    mimeType = 'image/jpeg'
    base64Data = imageBase64
  }

  // Validar imagen
  validateImage(base64Data, mimeType)

  const requestBody = {
    contents: [
      {
        parts: [
          { text: PROMPT_ANALISIS_TABLERO },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 512,
    },
  }

  const rawText = await executeGeminiWithFallback(apiKey, requestBody)
  return parseGeminiResponse(rawText)
}

/**
 * Parsea la respuesta de Gemini para el análisis de tickets de combustible.
 */
function parseGeminiTicketResponse(rawText: string): AnalisisTicketCombustible {
  let cleaned = rawText.trim()

  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
  }

  try {
    const parsed = JSON.parse(cleaned)

    const litros = parsed.litros != null ? Number(Number(parsed.litros).toFixed(2)) : null
    const precioPorLitro = parsed.precioPorLitro != null ? Number(Number(parsed.precioPorLitro).toFixed(2)) : null
    let importeTotal = parsed.importeTotal != null ? Number(Number(parsed.importeTotal).toFixed(2)) : null

    // Si falta importe total pero hay litros y precio, calcularlo
    if (!importeTotal && litros && precioPorLitro) {
      importeTotal = Number((litros * precioPorLitro).toFixed(2))
    }

    return {
      estacionServicio: parsed.estacionServicio ? String(parsed.estacionServicio).trim() : null,
      litros,
      precioPorLitro,
      importeTotal,
      odometro: parsed.odometro != null ? Math.round(Number(parsed.odometro)) : null,
      numeroTicket: parsed.numeroTicket ? String(parsed.numeroTicket).trim() : null,
      tipoCombustible: parsed.tipoCombustible ? String(parsed.tipoCombustible).trim() : null,
      fechaCarga: parsed.fechaCarga ? String(parsed.fechaCarga).trim() : null,
      patente: parsed.patente ? String(parsed.patente).trim() : null,
      conductorDni: parsed.conductorDni ? String(parsed.conductorDni).trim() : null,
      confianza: parsed.confianza != null ? Math.min(100, Math.max(0, Number(parsed.confianza))) : 0,
      observaciones: parsed.observaciones ?? null,
    }
  } catch {
    throw new Error(`La IA no devolvió un formato válido para el ticket. Respuesta: ${cleaned.substring(0, 200)}`)
  }
}

/**
 * Analiza una fotografía de un ticket o cupón de combustible (Edenred, YPF, etc.) con Gemini Flash.
 *
 * @param imageBase64 - Imagen en formato DataURL o base64 puro
 * @returns Datos estructurados extraídos del ticket
 */
export async function analizarTicketCombustible(imageBase64: string): Promise<AnalisisTicketCombustible> {
  const apiKey = assertApiKey()

  let mimeType: string
  let base64Data: string

  if (imageBase64.startsWith('data:')) {
    const parsed = parseBase64DataUrl(imageBase64)
    mimeType = parsed.mimeType
    base64Data = parsed.data
  } else {
    mimeType = 'image/jpeg'
    base64Data = imageBase64
  }

  validateImage(base64Data, mimeType)

  const requestBody = {
    contents: [
      {
        parts: [
          { text: PROMPT_ANALISIS_TICKET },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 600,
    },
  }

  const rawText = await executeGeminiWithFallback(apiKey, requestBody)
  return parseGeminiTicketResponse(rawText)
}
