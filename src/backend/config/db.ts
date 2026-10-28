import mysql from 'mysql2/promise'

/**
 * Conexión y Pool de Base de Datos MySQL (sc_vehiculos)
 * Configurado con codificación completa utf8mb4 para caracteres en español.
 */
const dbHost = process.env.DB_HOST || process.env.MYSQLHOST || '127.0.0.1'
const dbPort = Number(process.env.DB_PORT || process.env.MYSQLPORT) || 3306
const dbUser = process.env.DB_USER || process.env.MYSQLUSER || 'root'
const dbPassword = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || ''
const dbName = process.env.DB_NAME || process.env.MYSQLDATABASE || 'sc_vehiculos'

const poolConfig: mysql.PoolOptions = (process.env.MYSQL_URL || process.env.DATABASE_URL)
  ? {
      uri: process.env.MYSQL_URL || process.env.DATABASE_URL,
      charset: 'utf8mb4',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    }
  : {
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
      database: dbName,
      charset: 'utf8mb4',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    }

export const pool = mysql.createPool(poolConfig)

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

