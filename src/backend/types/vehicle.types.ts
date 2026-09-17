export interface VehicleFull {
  id: number
  patente: string
  tipoId: number
  tipoNombre: string
  dependenciaId: number | null
  dependenciaNombre: string
  marca: string
  modelo: string
  version: string | null
  anio: number | null
  numeroChasis: string | null
  numeroMotor: string | null
  numeroCedula: string | null
  fechaVencimientoCedula: string | null
  numeroRto: string | null
  tipoCombustible: string
  tipoCombustibleLabel: string
  capacidadTanqueLitros: number | null
  capacidadPasajeros: number
  odometroActual: number
  odometroFormatted: string
  fechaVencimientoVtv: string
  vtvFormatted: string
  vtvStatus: 'vigente' | 'proxima' | 'vencida'
  vtvDaysRemaining: number
  companiaSeguro: string | null
  numeroPoliza: string | null
  fechaVencimientoSeguro: string | null
  estado: string
  estadoLabel: string
  tone: 'green' | 'blue' | 'orange' | 'gray'
  observaciones: string | null
}

export interface VehicleHistoryItem {
  id: number
  tipo: string
  titulo: string
  taller: string
  odometro: string
  fecha: string
  costoTotal: string
  estado: string
  detalle: string | null
}

export interface VehicleTravelItem {
  id: number
  codigo: string
  destino: string
  area: string
  chofer: string
  fechaSalida: string
  fechaRegreso: string | null
  kmRecorridos: string
  estado: string
}

export interface VehicleFuelItem {
  id: number
  fecha: string
  litros: string
  importe: string
  odometro: string
  estacion: string
  rendimiento: string
}

export interface VehicleDetailComplete {
  vehicle: VehicleFull | null
  mantenimientos: VehicleHistoryItem[]
  viajes: VehicleTravelItem[]
  cargasCombustible: VehicleFuelItem[]
}

export interface VehicleType {
  id: number
  nombre: string
}

export interface Dependencia {
  id: number
  nombre: string
  sigla: string | null
}

export interface VehicleSaveInput {
  id?: number
  patente: string
  tipoId: number
  dependenciaId?: number | null
  marca: string
  modelo: string
  version?: string
  anio?: number
  numeroChasis?: string
  numeroMotor?: string
  numeroCedula?: string
  fechaVencimientoCedula?: string
  numeroRto?: string
  tipoCombustible: string
  capacidadTanqueLitros?: number
  capacidadPasajeros?: number
  odometroActual: number
  fechaVencimientoVtv: string
  companiaSeguro?: string
  numeroPoliza?: string
  fechaVencimientoSeguro?: string
  estado?: string
  observaciones?: string
}
