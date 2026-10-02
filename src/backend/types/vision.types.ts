/**
 * Tipos para el servicio de Visión IA (Gemini Flash)
 * Análisis de fotografías de tableros vehiculares
 */

/** Resultado estructurado del análisis de un tablero vehicular */
export interface AnalisisTablero {
  /** Lectura del odómetro/cuentakilómetros en km */
  kilometraje: number | null
  /** Nivel de combustible estimado (0-100). null si no se pudo determinar */
  nivelCombustible: number | null
  /** Descripción textual del nivel de combustible (ej: "3/4", "medio", "reserva") */
  nivelCombustibleTexto: string | null
  /** Temperatura del motor si es visible */
  temperaturaMotor: string | null
  /** Alertas o luces de advertencia visibles en el tablero */
  alertasVisibles: string[]
  /** Nivel de confianza general de la lectura (0-100) */
  confianza: number
  /** Notas adicionales del análisis */
  observaciones: string | null
}

/** Resultado estructurado del análisis de un ticket de combustible (Edenred, YPF, etc.) */
export interface AnalisisTicketCombustible {
  /** Estación de servicio o comercio (ej: "YPF ACA San Juan", "Shell", "Axion") */
  estacionServicio: string | null
  /** Litros despachados */
  litros: number | null
  /** Precio por litro en pesos */
  precioPorLitro: number | null
  /** Importe total de la carga en pesos */
  importeTotal: number | null
  /** Odómetro registrado en el cupón/ticket si figura */
  odometro: number | null
  /** Número de ticket, cupón o comprobante Edenred */
  numeroTicket: string | null
  /** Tipo de combustible normalizado ('diesel_500' | 'diesel_grado_3' | 'nafta_super' | 'nafta_premium' | 'gnc' | null) */
  tipoCombustible: string | null
  /** Fecha y hora de la carga en formato YYYY-MM-DDTHH:mm o YYYY-MM-DD si es visible */
  fechaCarga: string | null
  /** Patente del vehículo si figura en el comprobante Edenred */
  patente: string | null
  /** DNI o legajo del conductor si figura en el ticket Edenred */
  conductorDni: string | null
  /** Nivel de confianza general de la lectura (0-100) */
  confianza: number
  /** Observaciones si hubo problemas para leer algún campo */
  observaciones: string | null
}

/** Respuesta completa del endpoint de análisis */
export interface VisionAnalisisResponse {
  success: boolean
  datos: AnalisisTablero | AnalisisTicketCombustible | null
  error?: string
}

/** Configuración interna del servicio de visión */
export interface VisionServiceConfig {
  apiKey: string
  model: string
  maxImageSizeBytes: number
}

