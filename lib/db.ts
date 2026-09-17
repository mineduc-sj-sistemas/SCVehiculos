/**
 * FACHADA DE RETROCOMPATIBILIDAD
 * 
 * La lógica del Backend ha sido organizada modularmente en `src/backend/`:
 * - Conexión: `src/backend/config/db.ts`
 * - Tipos: `src/backend/types/`
 * - Servicios: `src/backend/services/`
 * 
 * Este archivo re-exporta todo desde `src/backend` para compatibilidad con código existente.
 */

export * from '../src/backend/index'
export { default } from '../src/backend/config/db'
