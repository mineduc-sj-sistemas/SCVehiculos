export interface DashboardStats {
  totalFleet: number
  availableFleet: number
  availablePercent: number
  activeTravels: number
  inRepairFleet: number
}

export interface FleetItem {
  id: number
  plate: string
  vehicle: string
  type: string
  km: string
  vtv: string
  status: string
  tone: 'green' | 'blue' | 'orange' | 'gray'
}

export interface TravelItem {
  id: number
  place: string
  area: string
  driver: string
  vehicle: string
  time: string
  color: string
}

export interface MaintenanceItem {
  id: number
  title: string
  vehicle: string
  date: string
  tag: string
  tagClass: string
}

export interface DriverStats {
  totalDrivers: number
  expiringLicenses: number
  validPercent: number
}

export interface FuelStats {
  avgLitersPer100Km: string
  trendPercent: string
  bars: number[]
}
