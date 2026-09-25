import mysql from 'mysql2/promise'
import crypto from 'node:crypto'

const BASE_URL = 'http://127.0.0.1:4321'
const SESSION_SECRET = process.env.SESSION_SECRET || 'sc_vehiculos_secret_key_mineduc_2026_jwt'

function createTestToken(payload) {
  const data = JSON.stringify({
    ...payload,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  })
  const base64Data = Buffer.from(data, 'utf8').toString('base64url')
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(base64Data)
    .digest('base64url')

  return `${base64Data}.${signature}`
}

const TOKENS = {
  admin: createTestToken({ id: 1, email: 'maria.gutierrez@sanjuan.edu.ar', nombre: 'María', apellido: 'Gutiérrez', rolId: 1, rolNombre: 'Administrador' }),
  operador: createTestToken({ id: 2, email: 'gonzalo.perez@sanjuan.edu.ar', nombre: 'Gonzalo', apellido: 'Pérez', rolId: 2, rolNombre: 'Operador / Despachante' }),
  mecanico: createTestToken({ id: 3, email: 'esteban.benitez@sanjuan.edu.ar', nombre: 'Esteban', apellido: 'Benítez', rolId: 3, rolNombre: 'Mecánico / Taller' }),
  chofer: createTestToken({ id: 4, email: 'martin.rojas@sanjuan.edu.ar', nombre: 'Martín', apellido: 'Rojas', rolId: 4, rolNombre: 'Chofer' }),
  auditor: createTestToken({ id: 5, email: 'auditor.test@sanjuan.edu.ar', nombre: 'Auditor', apellido: 'Test', rolId: 5, rolNombre: 'Auditor' }),
}

const testResults = []

function assert(condition, testId, description, details = '') {
  if (condition) {
    testResults.push({ id: testId, description, status: 'PASSED', details })
    console.log(`  ✓ [PASSED] ${testId}: ${description} ${details ? '(' + details + ')' : ''}`)
  } else {
    testResults.push({ id: testId, description, status: 'FAILED', details })
    console.error(`  ✗ [FAILED] ${testId}: ${description} ${details ? '(' + details + ')' : ''}`)
  }
}

async function runTestSuite() {
  console.log('======================================================================')
  console.log(' PLAN DE PRUEBAS INTEGRAL DEL SISTEMA DE MOVILIDADES (SCVehiculos)')
  console.log(' Ministerio de Educación · Gobierno de San Juan')
  console.log('======================================================================\n')

  const db = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'sc_vehiculos',
    charset: 'utf8mb4',
  })

  // Fixture Setup: Garantizar estado base limpio e idempotente
  await db.execute("UPDATE choferes SET estado = 'disponible' WHERE estado != 'inactivo'")
  await db.execute("UPDATE vehiculos SET estado = 'disponible' WHERE estado != 'en_taller' AND estado != 'baja'")

  // -------------------------------------------------------------------------
  // MÓDULO 1: AUTENTICACIÓN Y CRIPTOGRAFÍA
  // -------------------------------------------------------------------------
  console.log('--- [MÓDULO 1] AUTENTICACIÓN Y CRIPTOGRAFÍA ---')

  // TC-01: Login válido con bcrypt
  const resLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'maria.gutierrez@sanjuan.edu.ar', password: 'admin123' }),
  })
  const dataLogin = await resLogin.json()
  const hasCookie = resLogin.headers.get('set-cookie')?.includes('sc_session')
  assert(resLogin.status === 200 && dataLogin.success && dataLogin.user?.rolId === 1 && hasCookie, 'TC-01', 'Login con credenciales válidas y generación de cookie segura', `HTTP ${resLogin.status}`)

  // TC-02: Login con contraseña incorrecta
  const resBadPass = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'maria.gutierrez@sanjuan.edu.ar', password: 'passwordIncorrecta123' }),
  })
  const dataBadPass = await resBadPass.json()
  assert(resBadPass.status === 401 && !dataBadPass.success, 'TC-02', 'Rechazo de login ante contraseña inválida (401)', `HTTP ${resBadPass.status}`)

  // TC-03: Login con email inexistente
  const resNoUser = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'inexistente@sanjuan.edu.ar', password: 'admin123' }),
  })
  const dataNoUser = await resNoUser.json()
  assert(resNoUser.status === 401 && !dataNoUser.success, 'TC-03', 'Rechazo de login ante usuario no registrado (401)', `HTTP ${resNoUser.status}`)

  // TC-04: Detección de adulteración de firma (Token Tampering)
  const tamperedToken = TOKENS.chofer.slice(0, -5) + 'XXXXX'
  const resTampered = await fetch(`${BASE_URL}/api/vehiculos`, {
    headers: { Cookie: `sc_session=${tamperedToken}` },
  })
  assert(resTampered.status === 401, 'TC-04', 'Detección y rechazo de token con firma HMAC adulterada (401)', `HTTP ${resTampered.status}`)

  // -------------------------------------------------------------------------
  // MÓDULO 2: CONTROL DE ACCESO BASADO EN ROLES (RBAC)
  // -------------------------------------------------------------------------
  console.log('\n--- [MÓDULO 2] CONTROL DE ACCESO BASADO EN ROLES (RBAC) ---')

  // TC-05: Petición anónima a recurso protegido
  const resAnon = await fetch(`${BASE_URL}/api/vehiculos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
  assert(resAnon.status === 401, 'TC-05', 'Bloqueo de peticiones anónimas en endpoints mutativos (401)', `HTTP ${resAnon.status}`)

  // TC-06: Rol Chofer intentando crear vehículo
  const resChoferVeh = await fetch(`${BASE_URL}/api/vehiculos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `sc_session=${TOKENS.chofer}` },
    body: JSON.stringify({}),
  })
  assert(resChoferVeh.status === 403, 'TC-06', 'Bloqueo de rol no autorizado Chofer en creación de vehículos (403)', `HTTP ${resChoferVeh.status}`)

  // TC-07: Rol Chofer intentando gestionar usuarios
  const resChoferUsers = await fetch(`${BASE_URL}/api/usuarios`, {
    method: 'GET',
    headers: { Cookie: `sc_session=${TOKENS.chofer}` },
  })
  assert(resChoferUsers.status === 403, 'TC-07', 'Bloqueo de rol no autorizado Chofer en gestión de usuarios (403)', `HTTP ${resChoferUsers.status}`)

  // TC-08: Rol Operador intentando gestionar usuarios (Solo Admin puede)
  const resOperUsers = await fetch(`${BASE_URL}/api/usuarios`, {
    method: 'GET',
    headers: { Cookie: `sc_session=${TOKENS.operador}` },
  })
  assert(resOperUsers.status === 403, 'TC-08', 'Bloqueo de rol Operador en módulo exclusivo de usuarios (403)', `HTTP ${resOperUsers.status}`)

  // TC-09: Rol Administrador accediendo a usuarios
  const resAdminUsers = await fetch(`${BASE_URL}/api/usuarios`, {
    method: 'GET',
    headers: { Cookie: `sc_session=${TOKENS.admin}` },
  })
  const dataAdminUsers = await resAdminUsers.json()
  assert(resAdminUsers.status === 200 && dataAdminUsers.success && Array.isArray(dataAdminUsers.usuarios), 'TC-09', 'Acceso autorizado de Administrador a lista de usuarios (200)', `HTTP ${resAdminUsers.status}`)

  // -------------------------------------------------------------------------
  // MÓDULO 3: GESTIÓN DE FLOTA Y VEHÍCULOS
  // -------------------------------------------------------------------------
  console.log('\n--- [MÓDULO 3] GESTIÓN DE FLOTA Y VEHÍCULOS ---')
  let createdVehId = null
  let testPatente = `TST-${Math.floor(1000 + Math.random() * 9000)}`

  // TC-10: Listado de flota
  const resVehList = await fetch(`${BASE_URL}/api/vehiculos`, {
    headers: { Cookie: `sc_session=${TOKENS.operador}` },
  })
  const dataVehList = await resVehList.json()
  assert(resVehList.status === 200 && dataVehList.success && dataVehList.vehiculos?.length > 0, 'TC-10', 'Obtención de lista completa de flota para Operador', `${dataVehList.vehiculos?.length} vehículos`)

  // TC-11: Validación de campos obligatorios al registrar vehículo
  const resVehInvalid = await fetch(`${BASE_URL}/api/vehiculos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `sc_session=${TOKENS.operador}` },
    body: JSON.stringify({ patente: '' }),
  })
  const dataVehInvalid = await resVehInvalid.json()
  assert(resVehInvalid.status === 400 && !dataVehInvalid.success, 'TC-11', 'Rechazo de alta de vehículo con datos faltantes', `HTTP ${resVehInvalid.status}`)

  // TC-12: Alta de vehículo válida y verificación en BD
  const testChasis = `8AF${Math.floor(100000000000 + Math.random() * 900000000000)}`
  const testMotor = `MOT${Math.floor(10000000 + Math.random() * 90000000)}`

  const resVehCreate = await fetch(`${BASE_URL}/api/vehiculos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `sc_session=${TOKENS.admin}` },
    body: JSON.stringify({
      patente: testPatente,
      marca: 'Renault',
      modelo: 'Kangoo Furgón',
      anio: 2023,
      tipoId: 2,
      dependenciaId: 1,
      numeroChasis: testChasis,
      numeroMotor: testMotor,
      odometroActual: 15400,
      capacidadTanque: 50,
      fechaVencimientoVtv: '2027-12-31',
      fechaVencimientoSeguro: '2027-12-31',
      estado: 'disponible',
    }),
  })
  const dataVehCreate = await resVehCreate.json()
  createdVehId = dataVehCreate.id

  const [dbVeh] = await db.execute('SELECT id, patente FROM vehiculos WHERE patente = ?', [testPatente])
  assert(resVehCreate.status === 200 && dataVehCreate.success && dbVeh.length > 0, 'TC-12', 'Alta de nuevo vehículo oficial y persistencia en BD', `ID ${createdVehId} - Patente: ${testPatente}`)

  // -------------------------------------------------------------------------
  // MÓDULO 4: CONDUCTORES / CHOFERES Y RENDIMIENTO
  // -------------------------------------------------------------------------
  console.log('\n--- [MÓDULO 4] CONDUCTORES / CHOFERES Y RENDIMIENTO ---')

  // TC-13: Listado de choferes optimizado (sin Base64, con flags)
  const resChoferList = await fetch(`${BASE_URL}/api/choferes`, {
    headers: { Cookie: `sc_session=${TOKENS.operador}` },
  })
  const dataChoferList = await resChoferList.json()
  const firstChofer = dataChoferList.choferes?.[0]
  const isLightweight = firstChofer && firstChofer.fotoDniFrente === null && typeof firstChofer.tieneFotoDni === 'boolean'
  assert(resChoferList.status === 200 && dataChoferList.success && isLightweight, 'TC-13', 'Consulta liviana de choferes: sin Base64 y con flags de documentación', `Total: ${dataChoferList.choferes?.length}`)

  // TC-14: Ficha 360° individual por ID
  const resChoferDetail = await fetch(`${BASE_URL}/api/choferes?id=${firstChofer.id}`, {
    headers: { Cookie: `sc_session=${TOKENS.operador}` },
  })
  const dataChoferDetail = await resChoferDetail.json()
  assert(resChoferDetail.status === 200 && dataChoferDetail.success && dataChoferDetail.chofer?.id === firstChofer.id && Array.isArray(dataChoferDetail.comisiones), 'TC-14', 'Carga integral de Ficha 360° individual (historial y ausencias)', `Chofer: ${dataChoferDetail.chofer?.nombreCompleto}`)

  // TC-15: Registro de licencia laboral y cambio atómico de estado operativo
  const [dispChofer] = await db.execute("SELECT id, nombre, apellido FROM choferes WHERE estado = 'disponible' LIMIT 1")
  let licChoferId = dispChofer[0]?.id
  let createdLicenciaId = null
  if (licChoferId) {
    const hoy = new Date().toISOString().split('T')[0]
    const resLic = await fetch(`${BASE_URL}/api/choferes/licencias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `sc_session=${TOKENS.operador}` },
      body: JSON.stringify({
        choferId: licChoferId,
        tipo: 'vacaciones',
        fechaInicio: hoy,
        fechaFin: '2026-10-15',
        motivo: 'Receso ordinario anual de prueba',
        estado: 'aprobada',
      }),
    })
    const dataLic = await resLic.json()
    createdLicenciaId = dataLic.id
    const [choferUpdated] = await db.execute('SELECT estado FROM choferes WHERE id = ?', [licChoferId])
    assert(resLic.status === 200 && dataLic.success && choferUpdated[0]?.estado === 'licencia', 'TC-15', 'Registro de licencia laboral con actualización atómica de estado a "licencia"', `Chofer #${licChoferId}`)

    // Restaurar chofer para mantener disponibilidad en siguientes pruebas
    await db.execute("UPDATE choferes SET estado = 'disponible' WHERE id = ?", [licChoferId])
  }

  // -------------------------------------------------------------------------
  // MÓDULO 5: CRONOGRAMA, DESPACHO Y AUDITORÍA DE ESTADOS
  // -------------------------------------------------------------------------
  console.log('\n--- [MÓDULO 5] CRONOGRAMA DE COMISIONES & AUDITORÍA DE ESTADOS ---')

  // Elegir un vehículo y chofer disponibles
  const [vehDisp] = await db.execute("SELECT id, odometro_actual FROM vehiculos WHERE estado = 'disponible' LIMIT 1")
  const [chDisp] = await db.execute("SELECT id FROM choferes WHERE estado = 'disponible' LIMIT 1")
  const vId = vehDisp[0]?.id || 1
  const odomSalida = Number(vehDisp[0]?.odometro_actual || 50000)
  const cId = chDisp[0]?.id || 1

  // TC-16: Alta de nueva comisión oficial
  const resComCreate = await fetch(`${BASE_URL}/api/cronograma`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `sc_session=${TOKENS.operador}` },
    body: JSON.stringify({
      vehiculoId: vId,
      choferId: cId,
      dependenciaId: 1,
      destino: 'Jáchal - Escuela Albergue',
      motivo: 'Entrega de módulos alimentarios y relevamiento pedagógico',
      fechaSalidaProgramada: '2026-09-22T08:00',
      fechaRegresoEstimada: '2026-09-22T18:00',
      pasajerosAcompaniantes: 'Lic. Morales, Prof. Castro',
      observaciones: 'Viaje oficial de prueba automatizada',
    }),
  })
  const dataComCreate = await resComCreate.json()
  const createdComId = dataComCreate.id || dataComCreate.comisionId
  assert((resComCreate.status === 201 || resComCreate.status === 200) && dataComCreate.success && createdComId, 'TC-16', 'Creación de nueva comisión con código autogenerado', `ID ${createdComId} - Código: ${dataComCreate.codigoComision}`)

  // TC-17: Despacho de comisión (Salida real -> en_curso)
  const resDespacho = await fetch(`${BASE_URL}/api/cronograma/${createdComId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: `sc_session=${TOKENS.operador}` },
    body: JSON.stringify({
      estado: 'en_curso',
      odometroSalida: odomSalida,
      fechaSalidaReal: new Date().toISOString(),
    }),
  })
  const dataDespacho = await resDespacho.json()

  const [vehEnViaje] = await db.execute('SELECT estado FROM vehiculos WHERE id = ?', [vId])
  const [chEnViaje] = await db.execute('SELECT estado FROM choferes WHERE id = ?', [cId])
  assert(resDespacho.status === 200 && dataDespacho.success && vehEnViaje[0]?.estado === 'en_comision' && chEnViaje[0]?.estado === 'en_comision', 'TC-17', 'Despacho de salida: actualiza vehículo a "en_comision" y chofer a "en_comision"', `Comisión #${createdComId}`)

  // TC-18: Verificación de trazabilidad en auditoria_estados_vehiculo
  const [auditLogSalida] = await db.execute(
    "SELECT * FROM auditoria_estados_vehiculo WHERE comision_id = ? AND estado_nuevo = 'en_comision' ORDER BY id DESC LIMIT 1",
    [createdComId]
  )
  assert(auditLogSalida.length > 0 && auditLogSalida[0].usuario_id === 2, 'TC-18', 'Registro auditado de salida en auditoria_estados_vehiculo con ID de usuario y comisión', `Audit ID: ${auditLogSalida[0]?.id}`)

  // TC-19: Cierre / finalización de comisión (Regreso)
  const odomLlegada = odomSalida + 320
  const resRegreso = await fetch(`${BASE_URL}/api/cronograma/${createdComId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: `sc_session=${TOKENS.operador}` },
    body: JSON.stringify({
      estado: 'finalizada',
      odometroRegreso: odomLlegada,
      fechaRegresoReal: new Date().toISOString(),
    }),
  })
  const dataRegreso = await resRegreso.json()

  const [vehFinalizado] = await db.execute('SELECT estado, odometro_actual FROM vehiculos WHERE id = ?', [vId])
  const [chFinalizado] = await db.execute('SELECT estado FROM choferes WHERE id = ?', [cId])
  const [auditLogRegreso] = await db.execute(
    "SELECT * FROM auditoria_estados_vehiculo WHERE comision_id = ? AND estado_nuevo = 'disponible' ORDER BY id DESC LIMIT 1",
    [createdComId]
  )

  assert(
    resRegreso.status === 200 &&
    dataRegreso.success &&
    vehFinalizado[0]?.estado === 'disponible' &&
    Number(vehFinalizado[0]?.odometro_actual) === odomLlegada &&
    chFinalizado[0]?.estado === 'disponible' &&
    auditLogRegreso.length > 0,
    'TC-19',
    'Cierre de comisión: odómetro actualizado, estados restituidos a "disponible" y auditoría grabada',
    `Km recorridos: 320`
  )

  // -------------------------------------------------------------------------
  // MÓDULO 6: GESTIÓN DE USUARIOS Y VINCULACIÓN CON CHOFERES
  // -------------------------------------------------------------------------
  console.log('\n--- [MÓDULO 6] GESTIÓN DE USUARIOS & VINCULACIÓN CON CHOFERES ---')

  // Crear un chofer de prueba dedicado para validar la vinculación de credenciales
  const testChoferDni = String(Math.floor(20000000 + Math.random() * 20000000))
  const [insertedTempChofer] = await db.execute(
    `INSERT INTO choferes (nombre, apellido, dni, numero_licencia, categoria_licencia, fecha_vencimiento_licencia, estado)
     VALUES ('ChoferTest', 'Automatizado', ?, 'LIC-TEST-99', 'B2', '2028-12-31', 'disponible')`,
    [testChoferDni]
  )
  const tempChoferId = insertedTempChofer.insertId
  const testUserEmail = `temp.chofer.${tempChoferId}@sanjuan.edu.ar`

  // TC-20: Alta de usuario con rol Chofer vinculado
  const resCreateUser = await fetch(`${BASE_URL}/api/usuarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `sc_session=${TOKENS.admin}` },
    body: JSON.stringify({
      rolId: 4,
      nombre: 'ChoferTest',
      apellido: 'Automatizado',
      email: testUserEmail,
      password: 'ChoferSeguro2026!',
      dni: testChoferDni,
      choferId: tempChoferId,
    }),
  })
  const dataCreateUser = await resCreateUser.json()
  const createdUserId = dataCreateUser.id
  const [choferLinked] = await db.execute('SELECT usuario_id FROM choferes WHERE id = ?', [tempChoferId])

  assert(
    resCreateUser.status === 201 &&
    dataCreateUser.success &&
    choferLinked[0]?.usuario_id === createdUserId,
    'TC-20',
    'Alta de credenciales para chofer y vinculación atómica en BD',
    `Chofer #${tempChoferId} -> User #${createdUserId}`
  )

  // TC-21: Intento de vincular un segundo usuario al mismo chofer (Debe rechazar)
  const resDuplicateLink = await fetch(`${BASE_URL}/api/usuarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `sc_session=${TOKENS.admin}` },
    body: JSON.stringify({
      rolId: 4,
      nombre: 'ChoferTest',
      apellido: 'Automatizado',
      email: `otro.${testUserEmail}`,
      password: 'ChoferSeguro2026!',
      choferId: tempChoferId,
    }),
  })
  const dataDuplicateLink = await resDuplicateLink.json()
  assert(
    resDuplicateLink.status === 400 &&
    !dataDuplicateLink.success &&
    dataDuplicateLink.message?.includes('ya posee credenciales'),
    'TC-21',
    'Cumplimiento de regla de negocio: rechazo de segundo usuario para el mismo chofer',
    'Excepción 400 controlada'
  )

  // -------------------------------------------------------------------------
  // MÓDULO 7: TRANSACCIONALIDAD ACID Y ROLLBACK ANTE ERRORES
  // -------------------------------------------------------------------------
  console.log('\n--- [MÓDULO 7] TRANSACCIONALIDAD ACID Y ROLLBACK ---')

  // TC-22: Verificación de Rollback ante fallo en transacción withTransaction
  const [initialUsersCount] = await db.execute('SELECT COUNT(*) as c FROM usuarios')
  const countBefore = initialUsersCount[0].c

  try {
    await fetch(`${BASE_URL}/api/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `sc_session=${TOKENS.admin}` },
      body: JSON.stringify({
        rolId: 2,
        nombre: 'Fallo',
        apellido: 'Transaccion',
        email: 'maria.gutierrez@sanjuan.edu.ar', // Email duplicado para forzar aborto
        password: 'password123',
      }),
    })
  } catch (e) {}

  const [afterUsersCount] = await db.execute('SELECT COUNT(*) as c FROM usuarios')
  const countAfter = afterUsersCount[0].c

  assert(countBefore === countAfter, 'TC-22', 'Rollback transaccional: no se crean registros huérfanos ante fallo en operación atómica', `Usuarios antes: ${countBefore}, después: ${countAfter}`)

  // -------------------------------------------------------------------------
  // MÓDULO 8: HOJAS DE RUTA & MANTENIMIENTO MECÁNICO (FASE 1)
  // -------------------------------------------------------------------------
  console.log('\n--- [MÓDULO 8] HOJAS DE RUTA & MANTENIMIENTO MECÁNICO ---')

  // TC-23: Acceso a Hoja de Ruta imprimible ministerial
  const resImprimir = await fetch(`${BASE_URL}/cronograma/imprimir/1`, {
    headers: { Cookie: `sc_session=${TOKENS.admin}` },
  })
  const textImprimir = await resImprimir.text()
  assert(
    resImprimir.status === 200 && textImprimir.includes('Hoja de Ruta') && textImprimir.includes('COM-'),
    'TC-23',
    'Generación y renderizado de Hoja de Ruta oficial para impresión A4',
    'HTTP 200 con membrete ministerial'
  )

  // TC-24: Registro de nuevo mantenimiento e ingreso a taller
  let tempMantenimientoId = null
  const [vehParaService] = await db.execute('SELECT id, patente FROM vehiculos WHERE estado = "disponible" LIMIT 1')
  const testVehId = vehParaService[0]?.id

  const resCrearMant = await fetch(`${BASE_URL}/api/mantenimientos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `sc_session=${TOKENS.admin}` },
    body: JSON.stringify({
      vehiculoId: testVehId,
      tipo: 'preventivo',
      titulo: 'Service Oficial de Prueba 10.000 Km',
      tallerProveedor: 'Taller Central Mineduc',
      odometroServicio: 45000,
      fechaProgramada: '2026-09-25',
      ingresarATaller: true,
      costoManoObra: 15000,
      costoRepuestos: 25000,
      numeroFactura: 'FAC-TEST-001',
    }),
  })
  const dataCrearMant = await resCrearMant.json()
  tempMantenimientoId = dataCrearMant.id
  const [vehEnTallerCheck] = await db.execute('SELECT estado FROM vehiculos WHERE id = ?', [testVehId])

  assert(
    resCrearMant.status === 201 &&
    dataCrearMant.success &&
    vehEnTallerCheck[0]?.estado === 'en_taller',
    'TC-24',
    'Registro de mantenimiento con transición atómica a "en_taller" y auditoría',
    `Mantenimiento #${tempMantenimientoId} (Vehículo #${testVehId} en taller)`
  )

  // TC-25: Finalización del servicio de mantenimiento y restitución a disponible
  const resFinMant = await fetch(`${BASE_URL}/api/mantenimientos/${tempMantenimientoId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: `sc_session=${TOKENS.admin}` },
    body: JSON.stringify({
      action: 'complete',
      odometroServicio: 45050,
      costoManoObra: 16000,
      costoRepuestos: 27000,
      numeroFactura: 'FAC-TEST-FINAL',
      detalleTrabajos: 'Cambio de fluidos y filtros completado sin novedades.',
      proximoMantenimientoKm: 55000,
    }),
  })
  const dataFinMant = await resFinMant.json()
  const [vehDisponibleCheck] = await db.execute('SELECT estado, odometro_actual FROM vehiculos WHERE id = ?', [testVehId])
  const [mantFinalCheck] = await db.execute('SELECT estado, costo_total FROM mantenimientos WHERE id = ?', [tempMantenimientoId])

  assert(
    resFinMant.status === 200 &&
    dataFinMant.success &&
    vehDisponibleCheck[0]?.estado === 'disponible' &&
    mantFinalCheck[0]?.estado === 'completado' &&
    Number(mantFinalCheck[0]?.costo_total) === 43000,
    'TC-25',
    'Finalización de mantenimiento: costo total liquidado ($43.000) y restitución a "disponible"',
    `Mantenimiento #${tempMantenimientoId} completado y vehículo liberado`
  )

  // -------------------------------------------------------------------------
  // LIMPIEZA DE DATOS TEMPORALES (TEARDOWN)
  // -------------------------------------------------------------------------
  console.log('\n--- LIMPIEZA DE DATOS TEMPORALES (TEARDOWN) ---')
  if (tempMantenimientoId) {
    await db.execute('DELETE FROM auditoria_estados_vehiculo WHERE mantenimiento_id = ?', [tempMantenimientoId])
    await db.execute('DELETE FROM mantenimientos WHERE id = ?', [tempMantenimientoId])
    console.log(`  ✓ Mantenimiento temporal #${tempMantenimientoId} eliminado.`)
  }
  if (createdVehId) {
    await db.execute('DELETE FROM vehiculos WHERE id = ?', [createdVehId])
    console.log(`  ✓ Vehículo temporal #${createdVehId} eliminado.`)
  }
  if (createdLicenciaId) {
    await db.execute('DELETE FROM licencias_chofer WHERE id = ?', [createdLicenciaId])
    console.log(`  ✓ Licencia temporal #${createdLicenciaId} eliminada.`)
  }
  if (createdUserId) {
    await db.execute('DELETE FROM usuarios WHERE id = ?', [createdUserId])
    console.log(`  ✓ Usuario temporal #${createdUserId} eliminado.`)
  }
  if (tempChoferId) {
    await db.execute('DELETE FROM choferes WHERE id = ?', [tempChoferId])
    console.log(`  ✓ Chofer temporal #${tempChoferId} eliminado.`)
  }

  await db.end()

  // -------------------------------------------------------------------------
  // RESUMEN GENERAL DE RESULTADOS
  // -------------------------------------------------------------------------
  console.log('\n======================================================================')
  console.log(' RESUMEN GENERAL DE RESULTADOS DEL PLAN DE PRUEBAS')
  console.log('======================================================================')
  const passed = testResults.filter((r) => r.status === 'PASSED').length
  const failed = testResults.filter((r) => r.status === 'FAILED').length
  const total = testResults.length
  const rate = Math.round((passed / total) * 100)

  console.log(` Total de Casos de Prueba: ${total}`)
  console.log(` Pruebas Exitosas:         ${passed}`)
  console.log(` Pruebas Fallidas:         ${failed}`)
  console.log(` Tasa de Éxito:            ${rate}%`)
  console.log('======================================================================\n')

  return { total, passed, failed, rate }
}

runTestSuite().catch((err) => {
  console.error('Error fatal al ejecutar suite de pruebas:', err)
  process.exit(1)
})
