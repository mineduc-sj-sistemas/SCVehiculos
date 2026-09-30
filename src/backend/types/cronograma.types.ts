export type EstadoComision = 'programada' | 'en_curso' | 'finalizada' | 'cancelada'

export interface ComisionGridItem {
  id: number
  codigoComision: string
  vehiculoId: number
  vehiculoPatente: string
  vehiculoModelo: string
  choferId: number
  choferNombre: string
  choferApellido: string
  dependenciaId: number
  dependenciaNombre: string
  solicitanteNombre: string | null
  origen: string
  destino: string
  motivo: string
  cantidadPasajeros: number
  fechaSalidaProgramada: string
  fechaSalidaReal: string | null
  fechaRegresoEstimada: string
  fechaRegresoReal: string | null
  odometroSalida: number | null
  odometroRegreso: number | null
  kmRecorridos?: number | null
  estado: EstadoComision
  observaciones: string | null
  checkins?: CheckinDetalleItem[]
}

export interface CheckinDetalleItem {
  id: number
  comisionId: number
  choferId: number
  numeroParada: number
  destinoNombre: string
  latitud: number | null
  longitud: number | null
  fechaRegistro: string
  odometro: number | null
  observacion: string | null
}

export interface CronogramaDiaHeader {
  fecha: string // YYYY-MM-DD
  diaNombre: string // Lunes, Martes, Miércoles...
  diaNumero: number // 14, 15, 16...
  mesNombre: string // Sep, Oct...
  esHoy: boolean
  esFinDeSemana: boolean
}

export interface CronogramaVehiculoRow {
  vehiculoId: number
  patente: string
  marca: string
  modelo: string
  anio: number
  tipoVehiculo: string
  capacidadPasajeros: number
  estadoVehiculo: string
  odometroActual: number
  comisionesPorDia: Record<string, ComisionGridItem[]> // key: 'YYYY-MM-DD'
}

export interface CronogramaStats {
  totalComisionesSemana: number
  enCursoHoy: number
  programadasSemana: number
  finalizadasSemana: number
  vehiculosOperativos: number
  vehiculosAsignadosSemana: number
}

export interface CronogramaSemanalData {
  rangoSemana: {
    inicio: string // YYYY-MM-DD
    fin: string // YYYY-MM-DD
    label: string // ej: "14 al 20 de Septiembre de 2026"
    anio: number
  }
  dias: CronogramaDiaHeader[]
  filas: CronogramaVehiculoRow[]
  stats: CronogramaStats
}

export interface NuevaComisionDTO {
  vehiculoId: number
  choferId: number
  dependenciaId: number
  solicitanteNombre?: string
  origen: string
  destino: string
  motivo: string
  cantidadPasajeros: number
  fechaSalidaProgramada: string // ISO string o YYYY-MM-DDTHH:mm
  fechaRegresoEstimada: string // ISO string o YYYY-MM-DDTHH:mm
  observaciones?: string
  usuarioCreadorId?: number
}

export interface ActualizarEstadoComisionDTO {
  estado: EstadoComision
  odometroSalida?: number
  odometroRegreso?: number
  observaciones?: string
  usuarioId?: number
}

export interface EditarComisionDTO {
  vehiculoId?: number
  choferId?: number
  dependenciaId?: number
  solicitanteNombre?: string | null
  origen?: string
  destino?: string
  motivo?: string
  cantidadPasajeros?: number
  fechaSalidaProgramada?: string
  fechaRegresoEstimada?: string
  observaciones?: string | null
  usuarioId?: number
}

export interface DatosAuxiliaresDespacho {
  vehiculos: Array<{
    id: number
    patente: string
    marca: string
    modelo: string
    estado: string
    capacidadPasajeros: number
    odometroActual: number
  }>
  choferes: Array<{
    id: number
    nombre: string
    apellido: string
    dni: string
    estado: string
    categoriaLicencia: string | null
    licenciaVencimiento: string | null
    licenciaVencida: boolean
  }>
  dependencias: Array<{
    id: number
    nombre: string
    codigo: string
  }>
}
