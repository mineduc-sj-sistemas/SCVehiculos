const mysql = require('mysql2/promise');

async function migrate() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'sc_vehiculos'
  });

  console.log('Conectado a MySQL');

  const [existingCols] = await conn.query('DESCRIBE vehiculos');
  const existingNames = new Set(existingCols.map(c => c.Field));

  const columns = [
    { name: 'titular_nombre', sql: 'ALTER TABLE vehiculos ADD COLUMN titular_nombre VARCHAR(150) NULL AFTER dependencia_id' },
    { name: 'titular_cuit_cuil', sql: 'ALTER TABLE vehiculos ADD COLUMN titular_cuit_cuil VARCHAR(20) NULL AFTER titular_nombre' },
    { name: 'registro_seccional', sql: 'ALTER TABLE vehiculos ADD COLUMN registro_seccional VARCHAR(100) NULL AFTER titular_cuit_cuil' },
    { name: 'color', sql: 'ALTER TABLE vehiculos ADD COLUMN color VARCHAR(50) NULL AFTER anio' },
    { name: 'tiene_08', sql: 'ALTER TABLE vehiculos ADD COLUMN tiene_08 TINYINT(1) NOT NULL DEFAULT 0 AFTER numero_rto' },
    { name: 'estado_08', sql: "ALTER TABLE vehiculos ADD COLUMN estado_08 ENUM('no_aplica', 'pendiente_firma', 'firmado', 'en_tramite', 'inscripto') NOT NULL DEFAULT 'no_aplica' AFTER tiene_08" },
    { name: 'fecha_vencimiento_08', sql: 'ALTER TABLE vehiculos ADD COLUMN fecha_vencimiento_08 DATE NULL AFTER estado_08' },
    { name: 'numero_control_08', sql: 'ALTER TABLE vehiculos ADD COLUMN numero_control_08 VARCHAR(50) NULL AFTER fecha_vencimiento_08' },
    { name: 'foto_url', sql: 'ALTER TABLE vehiculos ADD COLUMN foto_url TEXT NULL AFTER observaciones' }
  ];

  for (const col of columns) {
    if (!existingNames.has(col.name)) {
      console.log('Agregando:', col.name);
      await conn.query(col.sql);
    } else {
      console.log('Ya existe:', col.name);
    }
  }

  const [result] = await conn.query(`
    UPDATE vehiculos SET
      titular_nombre = COALESCE(titular_nombre, 'Ministerio de Educación · Gob. de San Juan'),
      titular_cuit_cuil = COALESCE(titular_cuit_cuil, '30-99901234-7'),
      registro_seccional = COALESCE(registro_seccional, 'San Juan N° 1'),
      color = CASE 
        WHEN id = 1 THEN 'Blanco Perlado'
        WHEN id = 2 THEN 'Gris Plata'
        WHEN id = 3 THEN 'Azul Metalizado'
        WHEN id = 4 THEN 'Rojo Rubí'
        WHEN id = 5 THEN 'Blanco Glaciar'
        ELSE 'Blanco'
      END,
      foto_url = CASE
        WHEN tipo_vehiculo_id = 1 THEN '/vehiculos/camioneta.png'
        WHEN tipo_vehiculo_id = 2 THEN '/vehiculos/suv.png'
        WHEN tipo_vehiculo_id = 3 THEN '/vehiculos/auto.png'
        WHEN tipo_vehiculo_id = 4 THEN '/vehiculos/combi.png'
        ELSE '/vehiculos/camioneta.png'
      END,
      tiene_08 = 1,
      estado_08 = CASE
        WHEN id = 1 THEN 'inscripto'
        WHEN id = 2 THEN 'firmado'
        WHEN id = 3 THEN 'en_tramite'
        WHEN id = 4 THEN 'firmado'
        ELSE 'inscripto'
      END,
      fecha_vencimiento_08 = CASE
        WHEN id IN (2, 4) THEN DATE_ADD(CURDATE(), INTERVAL 60 DAY)
        ELSE NULL
      END,
      numero_control_08 = CASE
        WHEN id IN (2, 4) THEN CONCAT('08-SJ-', id, '982-B')
        ELSE NULL
      END
  `);

  console.log('Filas de vehículos actualizadas:', result.affectedRows);
  await conn.end();
  console.log('Migración completada con éxito.');
}

migrate().catch(console.error);
