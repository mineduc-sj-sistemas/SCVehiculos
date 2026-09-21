export interface Rol {
  id: number
  nombre: string
  descripcion?: string | null
}

export interface Usuario {
  id: number
  rolId: number
  rolNombre: string
  dependenciaId?: number | null
  dependenciaNombre?: string | null
  nombre: string
  apellido: string
  email: string
  dni?: string | null
  telefono?: string | null
  activo: boolean
  ultimoAcceso?: string | null
  createdAt?: string
  choferId?: number | null
  choferNombre?: string | null
  choferLicencia?: string | null
}

export interface UserSession {
  id: number
  email: string
  nombre: string
  apellido: string
  nombreCompleto: string
  rolId: number
  rolNombre: string
  dependenciaId?: number | null
  dependenciaNombre?: string | null
}

export interface UserCreateInput {
  rolId: number
  dependenciaId?: number | null
  nombre: string
  apellido: string
  email: string
  password: string
  dni?: string
  telefono?: string
  choferId?: number | null
}

export interface UserUpdateInput {
  rolId?: number
  dependenciaId?: number | null
  nombre?: string
  apellido?: string
  email?: string
  password?: string
  dni?: string
  telefono?: string
  activo?: boolean
  choferId?: number | null
}

export interface ChoferParaVinculacion {
  id: number
  nombre: string
  apellido: string
  dni: string
  email?: string | null
  telefono?: string | null
  numeroLicencia: string
  categoriaLicencia: string
  usuarioId?: number | null
  usuarioEmail?: string | null
  tieneUsuario: boolean
}

export interface UserStats {
  total: number
  administradores: number
  operadores: number
  otros: number
  inactivos: number
}

