export interface ChoferFull {
  id: number
  usuarioId: number | null
  nombre: string
  apellido: string
  nombreCompleto: string
  iniciales: string
  dni: string
  cuil: string | null
  telefono: string | null
  email: string | null
  direccion: string | null
  numeroLicencia: string
  categoriaLicencia: string
  fechaVencimientoLicencia: string
  licenciaFormatted: string
  licenciaStatus: 'vigente' | 'proxima' | 'vencida'
  licenciaDaysRemaining: number
  estado: 'disponible' | 'en_comision' | 'licencia' | 'inactivo'
  estadoLabel: string
  tone: 'green' | 'blue' | 'orange' | 'gray'
  observaciones: string | null
  totalViajes?: number
  totalKmRecorridos?: number
  fotoDniFrente?: string | null
  fotoDniDorso?: string | null
  fotoLicenciaFrente?: string | null
  fotoLicenciaDorso?: string | null
  categoriasList?: string[]
}

export interface ChoferStats {
  totalDrivers: number
  availableDrivers: number
  availablePercent: number
  onTravelDrivers: number
  onLeaveDrivers: number
  expiringLicenses: number
}

export interface ChoferComisionItem {
  id: number
  codigo: string
  destino: string
  area: string
  vehiculo: string
  patente: string
  fechaSalida: string
  fechaRegreso: string | null
  kmRecorridos: string
  estado: string
  estadoTone: 'green' | 'blue' | 'orange' | 'gray'
}

export interface ChoferLicenciaItem {
  id: number
  choferId: number
  tipo: 'vacaciones' | 'enfermedad' | 'particular' | 'capacitacion' | 'franco_compensatorio' | 'otra'
  tipoLabel: string
  fechaInicio: string
  fechaFin: string
  diasHabiles: number
  motivo: string | null
  estado: 'aprobada' | 'pendiente' | 'rechazada' | 'cancelada'
  estadoLabel: string
  aprobadoPor: string | null
  observaciones: string | null
}

export interface ChoferDetailComplete {
  chofer: ChoferFull | null
  comisiones: ChoferComisionItem[]
  licencias: ChoferLicenciaItem[]
  diasLicenciaConsumidos: {
    vacaciones: number
    enfermedad: number
    compensatorio: number
    otros: number
  }
}

export interface ChoferSaveInput {
  id?: number
  usuarioId?: number | null
  nombre: string
  apellido: string
  dni: string
  cuil?: string | null
  telefono?: string | null
  email?: string | null
  direccion?: string | null
  numeroLicencia: string
  categoriaLicencia: string
  fechaVencimientoLicencia: string
  estado?: 'disponible' | 'en_comision' | 'licencia' | 'inactivo'
  observaciones?: string | null
  fotoDniFrente?: string | null
  fotoDniDorso?: string | null
  fotoLicenciaFrente?: string | null
  fotoLicenciaDorso?: string | null
}

export interface ChoferLicenciaSaveInput {
  choferId: number
  tipo: 'vacaciones' | 'enfermedad' | 'particular' | 'capacitacion' | 'franco_compensatorio' | 'otra'
  fechaInicio: string
  fechaFin: string
  diasHabiles?: number
  motivo?: string | null
  estado?: 'aprobada' | 'pendiente' | 'rechazada' | 'cancelada'
  aprobadoPorId?: number | null
  observaciones?: string | null
}
