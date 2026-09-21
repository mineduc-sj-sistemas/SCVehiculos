import mysql from 'mysql2/promise'

/**
 * Conexión y Pool de Base de Datos MySQL (sc_vehiculos)
 * Configurado con codificación completa utf8mb4 para caracteres en español.
 */
export const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sc_vehiculos',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

/**
 * Helper genérico para ejecución de consultas SQL preparadas
 */
export async function query<T = any>(sql: string, params: any[] = []): Promise<T> {
  const [rows] = await pool.execute(sql, params)
  return rows as T
}

export type TransactionCallback<T> = (conn: mysql.PoolConnection) => Promise<T>

/**
 * Ejecuta una operación atómica dentro de una transacción SQL (ACID).
 * Si ocurre cualquier excepción, realiza ROLLBACK automático y libera la conexión al pool.
 */
export async function withTransaction<T>(callback: TransactionCallback<T>): Promise<T> {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const result = await callback(conn)
    await conn.commit()
    return result
  } catch (error) {
    await conn.rollback().catch(() => {})
    throw error
  } finally {
    conn.release()
  }
}

export default pool

