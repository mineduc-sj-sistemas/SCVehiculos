import mysql from 'mysql2/promise'
import fs from 'node:fs'
import path from 'node:path'
import { execSync, spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Si estamos en un contenedor Linux (Render / Docker) sin MySQL externo configurado,
 * levanta automáticamente el motor MariaDB embebido en 127.0.0.1:3306
 */
async function ensureLocalMariaDbIfNeeded(dbHost) {
  const isLocalHost = dbHost === '127.0.0.1' || dbHost === 'localhost'
  const hasExternalUrl = Boolean(process.env.MYSQL_URL || process.env.DATABASE_URL)
  if (!isLocalHost || hasExternalUrl) return

  // Verificar si ya responde un MySQL en 127.0.0.1:3306
  try {
    const testConn = await mysql.createConnection({
      host: '127.0.0.1',
      port: Number(process.env.DB_PORT || process.env.MYSQLPORT) || 3306,
      user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
      password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
      connectTimeout: 2000,
    })
    await testConn.end()
    return
  } catch {
    // No hay MySQL escuchando aún
  }

  // Verificar si existe mariadbd o mysqld instalado en el contenedor Linux
  const mariadbBin = fs.existsSync('/usr/bin/mariadbd')
    ? '/usr/bin/mariadbd'
    : fs.existsSync('/usr/bin/mysqld')
      ? '/usr/bin/mysqld'
      : null

  if (!mariadbBin) return

  console.log('[DB Init] Iniciando motor MariaDB embebido en el contenedor para producción autónoma...')
  try {
    execSync('mkdir -p /run/mysqld /var/lib/mysql && chown -R mysql:mysql /run/mysqld /var/lib/mysql', { stdio: 'ignore' })
    if (!fs.existsSync('/var/lib/mysql/mysql')) {
      console.log('[DB Init] Inicializando directorio de datos MariaDB...')
      execSync('mysql_install_db --user=mysql --datadir=/var/lib/mysql --skip-test-db', { stdio: 'inherit' })
    }

    const child = spawn(
      mariadbBin,
      [
        '--user=mysql',
        '--datadir=/var/lib/mysql',
        '--bind-address=127.0.0.1',
        '--port=3306',
        '--skip-grant-tables',
        '--character-set-server=utf8mb4',
        '--collation-server=utf8mb4_unicode_ci',
        '--innodb-buffer-pool-size=16M',
        '--key-buffer-size=8M',
        '--max-connections=25',
      ],
      {
        detached: true,
        stdio: 'ignore',
      }
    )
    child.unref()
    await wait(2500)
    console.log('[DB Init] Motor MariaDB embebido en ejecución en 127.0.0.1:3306.')
  } catch (err) {
    console.error('[DB Init] Error al iniciar MariaDB embebido:', err.message)
  }
}

async function connectWithRetry(config, maxRetries = 12, delayMs = 2000) {
  for (let i = 1; i <= maxRetries; i++) {
    try {
      const conn = await mysql.createConnection(config)
      return conn
    } catch (err) {
      console.log(`[DB Init] Intento ${i}/${maxRetries} conectando a MySQL: ${err.message}`)
      if (i === maxRetries) throw err
      await wait(delayMs)
    }
  }
}

async function main() {
  const dbHost = process.env.DB_HOST || process.env.MYSQLHOST || '127.0.0.1'
  const dbPort = Number(process.env.DB_PORT || process.env.MYSQLPORT) || 3306
  const dbUser = process.env.DB_USER || process.env.MYSQLUSER || 'root'
  const dbPassword = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || ''
  const dbName = process.env.DB_NAME || process.env.MYSQLDATABASE || 'sc_vehiculos'

  await ensureLocalMariaDbIfNeeded(dbHost)

  const connectionConfig = (process.env.MYSQL_URL || process.env.DATABASE_URL)
    ? {
        uri: process.env.MYSQL_URL || process.env.DATABASE_URL,
        multipleStatements: true,
        charset: 'utf8mb4',
      }
    : {
        host: dbHost,
        port: dbPort,
        user: dbUser,
        password: dbPassword,
        multipleStatements: true,
        charset: 'utf8mb4',
      }

  console.log(`[DB Init] Verificando conexión a base de datos (${connectionConfig.uri ? 'URI provista' : `${dbHost}:${dbPort}/${dbName}`})...`)

  let connection
  try {
    connection = await connectWithRetry(connectionConfig)
    console.log('[DB Init] Conexión establecida exitosamente.')

    if (!connectionConfig.uri) {
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`)
      await connection.query(`USE \`${dbName}\`;`)
    }

    // Verificar si la tabla usuarios ya existe y cuenta con los usuarios y choferes
    const [tables] = await connection.query("SHOW TABLES LIKE 'usuarios'")
    if (Array.isArray(tables) && tables.length > 0) {
      const [rows] = await connection.query('SELECT COUNT(*) as count FROM usuarios')
      if (rows[0]?.count >= 8) {
        console.log(`[DB Init] La base de datos ya se encuentra inicializada (${rows[0].count} usuarios encontrados). Omitiendo seed.`)
        await connection.end()
        process.exit(0)
      }
    }

    console.log('[DB Init] Inicializando estructura y datos maestros...')
    const sqlPath = path.resolve(__dirname, '../database/sc_vehiculos_completa.sql')
    if (!fs.existsSync(sqlPath)) {
      console.warn(`[DB Init] Advertencia: No se encontró el archivo ${sqlPath}`)
      await connection.end()
      process.exit(0)
    }

    let sqlContent = fs.readFileSync(sqlPath, 'utf8')

    if (dbName && dbName !== 'sc_vehiculos') {
      console.log(`[DB Init] Adaptando script SQL para la base de datos destino: '${dbName}'`)
      sqlContent = sqlContent.replace(/CREATE DATABASE IF NOT EXISTS\s+`?sc_vehiculos`?[^;]*;/gi, '')
      sqlContent = sqlContent.replace(/USE\s+`?sc_vehiculos`?;/gi, `USE \`${dbName}\`;`)
    }

    await connection.query(sqlContent)
    console.log('[DB Init] Base de datos y datos demo (Admin + Choferes) importados con éxito.')

    await connection.end()
    process.exit(0)
  } catch (error) {
    console.error('[DB Init] Error durante la inicialización:', error)
    if (connection) {
      await connection.end().catch(() => {})
    }
    process.exit(0)
  }
}

main()
