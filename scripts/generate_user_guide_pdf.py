# -*- coding: utf-8 -*-
import os
import base64
import subprocess
import time

def get_base64_image(path):
    if os.path.exists(path):
        with open(path, "rb") as f:
            ext = os.path.splitext(path)[1].replace(".", "").lower()
            if ext == "svg":
                mime = "image/svg+xml"
            else:
                mime = f"image/{ext}"
            return f"data:{mime};base64,{base64.b64encode(f.read()).decode('utf-8')}"
    return ""

def main():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    docs_dir = os.path.join(root_dir, "docs")
    os.makedirs(docs_dir, exist_ok=True)

    logo_sj = get_base64_image(os.path.join(root_dir, "public", "branding", "logo san juan.png"))
    logo_sj_white = get_base64_image(os.path.join(root_dir, "public", "branding", "logo san juan blanco.png"))
    icon_app = get_base64_image(os.path.join(root_dir, "public", "icons", "icon-192.png"))

    html_content = f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Manual de Usuario y Guía Operativa Oficial - SCVehículos</title>
  <style>
    @page {{
      size: A4 portrait;
      margin: 15mm 15mm 15mm 15mm;
      @bottom-right {{
        content: "Página " counter(page);
        font-size: 8pt;
        color: #64748b;
      }}
    }}

    *, *:before, *:after {{
      box-sizing: border-box;
    }}

    body {{
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background-color: #ffffff;
      line-height: 1.45;
      font-size: 9.5pt;
      margin: 0;
      padding: 0;
    }}

    .page-break {{
      page-break-before: always;
    }}

    .no-break {{
      page-break-inside: avoid;
    }}

    /* Portada */
    .cover-page {{
      height: 100%;
      min-height: 255mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border: 2px solid #ea580c;
      padding: 35px;
      border-radius: 12px;
      position: relative;
      background: radial-gradient(circle at top right, rgba(234, 88, 12, 0.05) 0%, transparent 60%);
    }}

    .cover-header {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #ea580c;
      padding-bottom: 18px;
    }}

    .cover-header img.logo {{
      height: 55px;
      object-fit: contain;
    }}

    .cover-badge {{
      background: #0f172a;
      color: #ffffff;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 8.5pt;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }}

    .cover-body {{
      margin: auto 0;
      text-align: center;
    }}

    .cover-pretitle {{
      color: #ea580c;
      font-weight: 800;
      font-size: 11pt;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 8px;
    }}

    .cover-title {{
      font-size: 26pt;
      font-weight: 900;
      color: #0f172a;
      line-height: 1.15;
      margin: 0 0 12px 0;
    }}

    .cover-subtitle {{
      font-size: 13pt;
      color: #475569;
      font-weight: 500;
      max-width: 600px;
      margin: 0 auto 25px auto;
      line-height: 1.35;
    }}

    .cover-roles {{
      display: flex;
      justify-content: center;
      gap: 15px;
      margin-top: 25px;
    }}

    .role-card {{
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-top: 4px solid #ea580c;
      border-radius: 8px;
      padding: 12px 20px;
      width: 220px;
      text-align: left;
    }}

    .role-card h4 {{
      margin: 0 0 4px 0;
      font-size: 10pt;
      color: #0f172a;
    }}

    .role-card p {{
      margin: 0;
      font-size: 8pt;
      color: #64748b;
    }}

    .cover-footer {{
      border-top: 1px solid #e2e8f0;
      padding-top: 14px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 8pt;
      color: #64748b;
    }}

    /* Tipografía y encabezados */
    h1, h2, h3, h4 {{
      color: #0f172a;
      font-weight: 700;
      margin-top: 0;
    }}

    h1.section-title {{
      font-size: 17pt;
      color: #ffffff;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      padding: 12px 18px;
      border-radius: 8px;
      border-left: 6px solid #ea580c;
      margin-bottom: 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }}

    h2.chapter-title {{
      font-size: 13pt;
      color: #ea580c;
      border-bottom: 1.5px solid #fed7aa;
      padding-bottom: 4px;
      margin-top: 20px;
      margin-bottom: 10px;
    }}

    h3.sub-title {{
      font-size: 10.5pt;
      color: #0f172a;
      margin-top: 14px;
      margin-bottom: 6px;
    }}

    p {{
      margin: 0 0 8px 0;
      text-align: justify;
    }}

    /* Alertas y Callouts */
    .callout {{
      padding: 10px 14px;
      border-radius: 7px;
      margin: 10px 0;
      font-size: 8.8pt;
    }}

    .callout-info {{
      background-color: #eff6ff;
      border-left: 4px solid #3b82f6;
      color: #1e3a8a;
    }}

    .callout-warning {{
      background-color: #fffbeb;
      border-left: 4px solid #f59e0b;
      color: #92400e;
    }}

    .callout-success {{
      background-color: #ecfdf5;
      border-left: 4px solid #10b981;
      color: #065f46;
    }}

    .callout-danger {{
      background-color: #fef2f2;
      border-left: 4px solid #ef4444;
      color: #991b1b;
    }}

    /* Tablas */
    table {{
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 8.5pt;
    }}

    th, td {{
      padding: 7px 10px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }}

    th {{
      background-color: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
      border-top: 1px solid #cbd5e1;
      border-bottom: 2px solid #cbd5e1;
    }}

    tr:nth-child(even) td {{
      background-color: #f8fafc;
    }}

    /* Badges */
    .badge {{
      display: inline-block;
      padding: 2px 7px;
      border-radius: 12px;
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
    }}

    .badge-orange {{ background: #ffedd5; color: #9a3412; border: 1px solid #fed7aa; }}
    .badge-green {{ background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }}
    .badge-blue {{ background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }}
    .badge-gray {{ background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }}
    .badge-red {{ background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }}

    /* Stepper Wizard Visual */
    .stepper-container {{
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px;
      margin: 12px 0;
    }}

    .stepper-row {{
      display: flex;
      justify-content: space-between;
      position: relative;
    }}

    .stepper-line {{
      position: absolute;
      top: 14px;
      left: 12.5%;
      right: 12.5%;
      height: 3px;
      background: #cbd5e1;
      z-index: 1;
    }}

    .stepper-line-active {{
      position: absolute;
      top: 14px;
      left: 12.5%;
      width: 50%;
      height: 3px;
      background: #10b981;
      z-index: 2;
    }}

    .step-item {{
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      z-index: 3;
    }}

    .step-circle {{
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 9pt;
      background: #f8fafc;
      border: 2px solid #cbd5e1;
      color: #64748b;
    }}

    .step-circle.completed {{
      background: #059669;
      border-color: #059669;
      color: #ffffff;
    }}

    .step-circle.active {{
      background: #ea580c;
      border-color: #ea580c;
      color: #ffffff;
      box-shadow: 0 0 0 3px #ffedd5;
    }}

    .step-label {{
      margin-top: 5px;
      font-size: 7.8pt;
      font-weight: 700;
      color: #475569;
      text-align: center;
    }}

    .step-label.active {{
      color: #ea580c;
    }}

    /* Pasos ordenados */
    .step-list {{
      margin: 8px 0;
      padding-left: 18px;
    }}

    .step-list li {{
      margin-bottom: 6px;
    }}

    .header-running {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      margin-bottom: 14px;
      font-size: 7.5pt;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }}

    .footer-running {{
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 12mm;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7.5pt;
      color: #94a3b8;
    }}

    /* Grid cards */
    .grid-2 {{
      display: flex;
      gap: 12px;
      margin: 10px 0;
    }}

    .grid-2 > div {{
      flex: 1;
    }}

    .feature-box {{
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px;
    }}

    .feature-box h4 {{
      margin: 0 0 4px 0;
      font-size: 9pt;
      color: #0f172a;
    }}

    .feature-box p {{
      margin: 0;
      font-size: 8pt;
      color: #475569;
    }}
  </style>
</head>
<body>

  <!-- ======================================================== -->
  <!-- PORTADA OFICIAL                                          -->
  <!-- ======================================================== -->
  <div class="cover-page">
    <div class="cover-header">
      <img src="{logo_sj}" alt="Gobierno de San Juan" class="logo">
      <span class="cover-badge">Documento Técnico Oficial</span>
    </div>

    <div class="cover-body">
      <div class="cover-pretitle">Ministerio de Educación · Provincia de San Juan</div>
      <h1 class="cover-title">MANUAL DE USUARIO Y GUÍA OPERATIVA</h1>
      <div class="cover-subtitle">
        Sistema Integral de Control de Movilidades y Flota Oficial (SCVehículos)
      </div>

      <div style="display: inline-block; background: #fff7ed; border: 1px solid #ffedd5; padding: 6px 16px; border-radius: 20px; font-weight: 700; color: #ea580c; font-size: 9pt; margin-bottom: 25px;">
        Versión 2.0 · Plataforma Web & PWA Offline
      </div>

      <div class="cover-roles">
        <div class="role-card">
          <h4>Volumen 1: Gestión Central</h4>
          <p>Para Administradores, Coordinadores de Movilidades y Operadores Ministeriales.</p>
        </div>
        <div class="role-card">
          <h4>Volumen 2: Conducción Oficial</h4>
          <p>Para Choferes dependientes del Ministerio de Educación en servicio interdepartamental.</p>
        </div>
      </div>
    </div>

    <div class="cover-footer">
      <div>
        <strong>Dirección de Coordinación de Movilidades</strong><br>
        Ministerio de Educación · Centro Cívico San Juan
      </div>
      <div style="text-align: right;">
        <strong>Homologación Oficial</strong><br>
        Octubre 2026 · Edición Definitiva
      </div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ======================================================== -->
  <!-- ÍNDICE Y MARCO GENERAL                                   -->
  <!-- ======================================================== -->
  <div class="header-running">
    <span>SCVehículos · Ministerio de Educación</span>
    <span>Estructura y Marco Operativo</span>
  </div>

  <h1 class="section-title">
    <span>Índice General del Manual</span>
    <span style="font-size: 10pt; font-weight: 400; color: #cbd5e1;">SCVehículos v2.0</span>
  </h1>

  <table style="margin-top: 15px;">
    <thead>
      <tr>
        <th style="width: 15%;">Sección</th>
        <th style="width: 65%;">Módulo y Contenido Temático</th>
        <th style="width: 20%;">Perfil de Destino</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Parte I</strong></td>
        <td><strong>Guía de Administradores y Coordinadores Operativos</strong><br>
          Acceso, Sidebar reactiva, Modo oscuro, Dashboard, Flota 360°, Choferes, Cronograma y Wizard de Despacho, Hoja de Ruta A4, Mantenimiento, Combustible y Reportes.</td>
        <td><span class="badge badge-orange">Administradores</span> <span class="badge badge-blue">Operadores</span></td>
      </tr>
      <tr>
        <td><strong>Parte II</strong></td>
        <td><strong>Guía de Conductores / Choferes Oficiales</strong><br>
          Portal Móvil (/mi-viaje), Consulta de comisiones, Check-in geolocalizado GPS, Carga de combustible con IA, Calendario personal, PWA y Operación Offline en rutas.</td>
        <td><span class="badge badge-green">Choferes</span></td>
      </tr>
      <tr>
        <td><strong>Parte III</strong></td>
        <td><strong>Resolución de Conflictos, Validaciones ACID y Soporte</strong><br>
          Solapamiento horario, inhabilitación por licencias vencidas, inconsistencias de odómetro y Mesa de Ayuda.</td>
        <td><span class="badge badge-gray">Todos los Roles</span></td>
      </tr>
    </tbody>
  </table>

  <h2 class="chapter-title">Marco Normativo y Propósito Institucional</h2>
  <p>
    El <strong>Sistema de Control de Movilidades (SCVehículos)</strong> tiene como objetivo garantizar la máxima eficiencia, transparencia y trazabilidad en el uso de los vehículos oficiales asignados al Ministerio de Educación de la Provincia de San Juan. Toda comisión de servicio, salida interdepartamental, traslado escolar y aprovisionamiento debe ser debidamente planificada, autorizada e instrumentada a través de este sistema.
  </p>

  <div class="callout callout-info no-break">
    <strong>Principio de Trazabilidad Integral:</strong> Ninguna unidad puede salir de la base o cochera ministerial sin la emisión previa de la <em>Hoja de Ruta Oficial A4</em> con código autogenerado (ej. <code>COM-2026-0144</code>), chofer legalmente habilitado y vehículo con estado operativo vigente (sin solapamiento horario ni ingresos pendientes en taller).
  </div>

  <h2 class="chapter-title">Roles de Usuarios y Niveles de Acceso (RBAC)</h2>
  <table class="no-break">
    <thead>
      <tr>
        <th>Rol en Sistema</th>
        <th>Permisos Principales</th>
        <th>Vistas Habilitadas</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Administrador</strong></td>
        <td>Control absoluto: Creación de usuarios, auditoría, configuración de flota, choferes, despacho y reportes.</td>
        <td>Todas las vistas del sistema + Gestión de Usuarios (<code>/usuarios</code>).</td>
      </tr>
      <tr>
        <td><strong>Operador</strong></td>
        <td>Gestión del parque automotor, despacho de comisiones, hojas de ruta, registro de combustible y mantenimientos.</td>
        <td>Panel, Flota, Choferes, Cronograma, Viajes, Mantenimientos y Combustible.</td>
      </tr>
      <tr>
        <td><strong>Auditor</strong></td>
        <td>Inspección de datos, trazabilidad histórica y descarga de reportes oficiales. Sin permisos de modificación.</td>
        <td>Panel de Auditoría Ejecutiva y Reportes Oficiales.</td>
      </tr>
      <tr>
        <td><strong>Chofer</strong></td>
        <td>Visualización de su comisión activa, check-in GPS de arribo, calendario personal de viajes y carga de combustible.</td>
        <td>Portal Móvil (<code>/mi-viaje</code>), Calendario (<code>/viajes-choferes</code>) y Perfil.</td>
      </tr>
    </tbody>
  </table>

  <div class="page-break"></div>

  <!-- ======================================================== -->
  <!-- PARTE 1: ADMINISTRADORES Y COORDINADORES                -->
  <!-- ======================================================== -->
  <div class="header-running">
    <span>Parte I: Guía para Administradores y Coordinadores</span>
    <span>Acceso y Navegación</span>
  </div>

  <h1 class="section-title">
    <span>Parte I: Gestión Central y Coordinación</span>
    <span class="badge badge-orange" style="font-size: 8pt;">Administración</span>
  </h1>

  <h2 class="chapter-title">1. Inicio de Sesión y Navegación Interactiva</h2>
  <p>
    El acceso se realiza mediante el navegador web institucional ingresando credenciales (Usuario o Correo y Contraseña). El sistema valida la identidad mediante cookies seguras encriptadas HMAC con caducidad programada.
  </p>

  <div class="grid-2 no-break">
    <div class="feature-box">
      <h4>Sidebar Reactiva al Cursor (Hover-Expand)</h4>
      <p>
        Para maximizar el espacio en pantallas de oficina y notebooks, la barra lateral permanece por defecto en formato <strong>riel compacto (72 px)</strong>. Al posar el cursor sobre cualquier parte del menú, se despliega fluidamente a <strong>248 px</strong> con sombra flotante sin desordenar la tabla o cronograma. Se puede fijar permanentemente con el botón menú (hamburguesa).
      </p>
    </div>
    <div class="feature-box">
      <h4>Modo Oscuro de Alto Contraste</h4>
      <p>
        Permite alternar entre Modo Claro y <strong>Modo Oscuro</strong> mediante el ícono de Sol/Luna en la cabecera. La paleta cumple con los estándares WCAG AAA, garantizando lectura nítida en turnos vespertinos y guardias nocturnas.
      </p>
    </div>
  </div>

  <h2 class="chapter-title">2. Panel Principal (Dashboard) & Centro de Alertas</h2>
  <p>
    Al ingresar, el coordinador visualiza un resumen ejecutivo del estado del parque automotor:
  </p>
  <ul>
    <li><strong>Móviles Operativos:</strong> Cantidad de unidades disponibles inmediatamente en cochera.</li>
    <li><strong>Unidades en Servicio / Taller:</strong> Vehículos inhabilitados por reparación mecánica o service.</li>
    <li><strong>Comisiones Activas de la Semana:</strong> Total de salidas programadas y en viaje.</li>
    <li><strong>Consumo Acumulado de Combustible:</strong> Litros e importes facturados en el período.</li>
  </ul>

  <div class="callout callout-warning no-break">
    <strong>Centro de Alertas y Vencimientos (Ícono de Campana):</strong>
    El sistema audita automáticamente todas las noches las fechas de vencimiento y genera avisos categorizados:
    <ul>
      <li><strong>Revisión Técnica Obligatoria (RTO/VTV):</strong> Alerta preventiva a 30 días del vencimiento y crítica a 7 días.</li>
      <li><strong>Licencias de Conducir:</strong> Alerta inmediata si el chofer posee carnet próximo a vencer o caduco.</li>
      <li><strong>Mantenimiento Programado:</strong> Aviso al alcanzar los 10.000 km desde el último service.</li>
    </ul>
  </div>

  <h2 class="chapter-title">3. Gestión de la Flota (Parque Automotor 360°)</h2>
  <p>
    En la sección <code>/flota</code> se administra el inventario completo de movilidades (camionetas, utilitarios, furgones y minibuses):
  </p>
  <table class="no-break">
    <thead>
      <tr>
        <th>Acción</th>
        <th>Procedimiento Operativo</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Alta de Vehículo</strong></td>
        <td>Clic en <em>"+ Nuevo Vehículo"</em>. Ingresar Patente (formato nacional), Marca, Modelo, Año, Tipo de Movilidad, Capacidad máxima de pasajeros reglamentaria y Odómetro inicial verificado en tablero.</td>
      </tr>
      <tr>
        <td><strong>Ficha Técnica 360°</strong></td>
        <td>Clic en cualquier móvil de la lista. Abre un modal con pestañas: <em>Datos Generales, Historial de Comisiones, Mantenimientos y Cargas de Combustible</em>.</td>
      </tr>
      <tr>
        <td><strong>Estados de la Unidad</strong></td>
        <td>
          <span class="badge badge-green">Disponible</span> Lista para asignar en cronograma.<br>
          <span class="badge badge-orange">En Comisión</span> Vehículo actualmente en ruta oficial.<br>
          <span class="badge badge-red">En Taller</span> Bloqueado por mantenimiento mecánico.
        </td>
      </tr>
    </tbody>
  </table>

  <div class="page-break"></div>

  <!-- ======================================================== -->
  <!-- CRONOGRAMA Y DESPACHO                                    -->
  <!-- ======================================================== -->
  <div class="header-running">
    <span>Parte I: Guía para Administradores y Coordinadores</span>
    <span>Cronograma Semanal y Despacho</span>
  </div>

  <h1 class="section-title">
    <span>Cronograma Semanal y Despacho Oficial</span>
    <span class="badge badge-orange" style="font-size: 8pt;">Módulo Central</span>
  </h1>

  <h2 class="chapter-title">4. La Grilla Semanal Interactiva (7 Días)</h2>
  <p>
    El módulo <code>/cronograma</code> presenta una vista consolidada de lunes a domingo. Cada fila representa un móvil y cada columna un día de la semana seleccionada. La celda del día actual destaca con etiqueta dorada <strong>HOY</strong>.
  </p>
  <ul>
    <li><strong>Navegación de Semanas:</strong> Use los botones <code>&lt; Semana anterior</code>, <code>Hoy</code> y <code>Semana siguiente &gt;</code> para planificar salidas futuras.</li>
    <li><strong>Celdas Disponibles:</strong> Muestran el botón <code>+ Disponible</code> para despachar un viaje en esa fecha y vehículo.</li>
    <li><strong>Celdas en Taller:</strong> Destacan con franja rayada ámbar inhabilitando clics para evitar asignaciones erróneas.</li>
    <li><strong>Tarjetas de Comisión:</strong> Indican código de salida, chofer, destino y hora de partida. Clic para ver hoja de ruta.</li>
  </ul>

  <h2 class="chapter-title">5. Formulario de Despacho (Wizard en 4 Pasos)</h2>
  <p>
    Al iniciar una nueva comisión, se despliega el formulario interactivo tipo Wizard. La barra de pasos superior muestra una línea que se tiñe progresivamente de <strong>verde esmeralda</strong> a medida que se completan las etapas:
  </p>

  <div class="stepper-container no-break">
    <div class="stepper-row">
      <div class="stepper-line"></div>
      <div class="stepper-line-active" style="width: 33.33%;"></div>

      <div class="step-item">
        <div class="step-circle completed">✓</div>
        <div class="step-label">1. Movilidad & Chofer</div>
      </div>
      <div class="step-item">
        <div class="step-circle active">2</div>
        <div class="step-label active">2. Solicitante</div>
      </div>
      <div class="step-item">
        <div class="step-circle">3</div>
        <div class="step-label">3. Trayecto</div>
      </div>
      <div class="step-item">
        <div class="step-circle">4</div>
        <div class="step-label">4. Horarios & Misión</div>
      </div>
    </div>
  </div>

  <ol class="step-list">
    <li>
      <strong>Paso 1: Movilidad & Chofer:</strong> Seleccione la unidad vehicular y el chofer oficial. El sistema valida automáticamente que el chofer no tenga licencias laborales activas y que su licencia de conducir esté vigente.
    </li>
    <li>
      <strong>Paso 2: Área Solicitante:</strong> Indique la dependencia requirente (ej. <em>Dirección de Educación Primaria, Dirección de Gabinetes Interdisciplinarios</em>) y el nombre del funcionario responsable.
    </li>
    <li>
      <strong>Paso 3: Trayecto & Paradas Interdepartamentales:</strong> Seleccione el departamento de destino en San Juan (Capital, Rawson, Calingasta, Jáchal, Iglesia, Valle Fértil, etc.) y detalle escuelas o parajes. Si la misión incluye múltiples destinos, presione <code>+ Agregar Parada Adicional</code>.
    </li>
    <li>
      <strong>Paso 4: Horarios, Odómetro y Confirmación:</strong> La fecha queda fijada desde el cronograma. Indique hora de partida y regreso estimada. El sistema carga automáticamente el odómetro actual del móvil (bloqueado para evitar alteraciones). Especifique el motivo oficial detallado y presione <strong>"Despachar Comisión"</strong>.
    </li>
  </ol>

  <div class="callout callout-danger no-break">
    <strong>Validaciones Preventivas Automatizadas (Bloqueo en Tiempo Real):</strong>
    El sistema rechazará el despacho si se detecta alguna de las siguientes anomalías:
    <ul>
      <li><strong>Conflicto de Horario (Solapamiento):</strong> Si el vehículo o el chofer ya tienen otra comisión asignada en ese rango horario.</li>
      <li><strong>Exceso de Pasajeros:</strong> Si los pasajeros requeridos superan la capacidad física homologada del móvil.</li>
      <li><strong>Inhabilitación Legal:</strong> Si el chofer posee carnet vencido o está con licencia médica/anual registrada.</li>
    </ul>
  </div>

  <div class="page-break"></div>

  <!-- ======================================================== -->
  <!-- HOJAS DE RUTA, TALLER Y COMBUSTIBLE                      -->
  <!-- ======================================================== -->
  <div class="header-running">
    <span>Parte I: Guía para Administradores y Coordinadores</span>
    <span>Operaciones y Trazabilidad</span>
  </div>

  <h1 class="section-title">
    <span>Hojas de Ruta, Taller y Combustible</span>
    <span class="badge badge-orange" style="font-size: 8pt;">Control Operativo</span>
  </h1>

  <h2 class="chapter-title">6. Emisión de Hoja de Ruta Oficial A4 e Impresión</h2>
  <p>
    Una vez despachada la comisión, el sistema genera la <strong>Hoja de Ruta Oficial A4</strong> reglamentaria. Para imprimirla, ingrese a <code>/viajes</code> o haga clic en la tarjeta del cronograma y presione <em>"Imprimir Hoja de Ruta"</em>.
  </p>
  <ul>
    <li><strong>Membrete Ministerial:</strong> Incorpora el escudo provincial y código único con código de barras.</li>
    <li><strong>Póliza y Auxilio:</strong> Imprime número de póliza de seguro oficial y teléfono de grúa de urgencia.</li>
    <li><strong>Itinerario Obligatorio:</strong> Detalla cada una de las paradas a cumplir por el conductor.</li>
    <li><strong>Firmas Obligatorias:</strong> Casillas para firma y sello de: 1) Funcionario Solicitante, 2) Conductor Oficial, y 3) Coordinador de Movilidades al salir y retornar.</li>
  </ul>

  <h2 class="chapter-title">7. Cierre de Viaje y Retorno de Unidades</h2>
  <p>
    Al regresar la movilidad al predio ministerial, el operador debe registrar el cierre en <code>/viajes</code>:
  </p>
  <div class="callout callout-success no-break">
    <strong>Regla de Integridad de Odómetro:</strong>
    El operador ingresa el <em>Odómetro de Llegada</em>. El sistema verifica que sea <strong>estrictamente mayor</strong> al odómetro de salida. Inmediatamente:
    1) Calcula los kilómetros netos recorridos, 2) Actualiza el odómetro del vehículo en la base de datos, 3) Devuelve el vehículo y al chofer al estado <span class="badge badge-green">Disponible</span>, y 4) Genera el registro de auditoría correspondiente.
  </div>

  <h2 class="chapter-title">8. Gestión de Taller y Mantenimiento Mecánico</h2>
  <p>
    En el módulo <code>/mantenimientos</code> se gestiona la sanidad del parque automotor:
  </p>
  <ul>
    <li><strong>Ingreso a Taller:</strong> Al crear una ficha de mantenimiento (preventivo, correctivo o RTO), el vehículo pasa automáticamente al estado <code>en_taller</code>, bloqueando su disponibilidad en el cronograma.</li>
    <li><strong>Finalización de Servicio:</strong> Se ingresa el costo total de mano de obra y repuestos, observaciones del mecánico y se pulsa <em>"Finalizar Mantenimiento"</em>. El móvil queda inmediatamente liberado para nuevos viajes.</li>
  </ul>

  <h2 class="chapter-title">9. Control de Cargas de Combustible (Edenred & IA)</h2>
  <p>
    Las recargas de combustible oficial se controlan en <code>/combustible</code>:
  </p>
  <ul>
    <li><strong>Registro de Comprobante:</strong> Tipo de combustible, estación de servicio, número de ticket Edenred, litros cargados, importe total y odómetro en surtidor.</li>
    <li><strong>Asistencia con Visión Artificial (IA):</strong> Permite arrastrar la foto del ticket o del odómetro para prellenar automáticamente los datos numéricos mediante procesamiento inteligente de imagen.</li>
  </ul>

  <div class="page-break"></div>

  <!-- ======================================================== -->
  <!-- PARTE 2: GUÍA PARA CHOFERES                              -->
  <!-- ======================================================== -->
  <div class="header-running">
    <span>Parte II: Guía de Uso para Conductores y Choferes</span>
    <span>Portal Móvil y Operaciones en Ruta</span>
  </div>

  <h1 class="section-title">
    <span>Parte II: Guía para Conductores Oficiales</span>
    <span class="badge badge-green" style="font-size: 8pt;">Portal del Chofer</span>
  </h1>

  <h2 class="chapter-title">10. El Portal Móvil del Conductor (/mi-viaje)</h2>
  <p>
    El Ministerio de Educación pone a disposición de todos los choferes oficiales el <strong>Portal Móvil</strong>, una interfaz diseñada específicamente para teléfonos celulares y tablets que funciona incluso en zonas de baja conectividad.
  </p>
  <div class="callout callout-info no-break">
    <strong>Acceso al Portal:</strong>
    Ingrese desde su teléfono celular al enlace oficial y escriba su DNI/Usuario y Contraseña. Se abrirá directamente la pantalla de <strong>"Mi Viaje Oficial"</strong>.
  </div>

  <h2 class="chapter-title">11. Visualización de la Comisión Oficial Activa</h2>
  <p>En su pantalla principal el chofer visualiza en tiempo real los datos del viaje despachado por coordinación:</p>
  <ul>
    <li><strong>Código de Comisión:</strong> Identificador único ministerial (ej. <code>COM-2026-0144</code>).</li>
    <li><strong>Vehículo Asignado:</strong> Marca, modelo y chapa patente de la unidad oficial a su cargo.</li>
    <li><strong>Funcionario Responsable:</strong> Nombre y cargo del solicitante con quien debe coordinar la salida.</li>
    <li><strong>Itinerario de Paradas:</strong> Lista ordenada de destinos, escuelas y parajes a visitar.</li>
    <li><strong>Horarios Programados:</strong> Hora de partida estipulada y regreso estimado a cochera.</li>
  </ul>

  <h2 class="chapter-title">12. Registro de Check-in Geolocalizado con GPS</h2>
  <p>
    Durante el viaje, el chofer debe registrar cada arribo intermedio a las escuelas o dependencias para dar fe del cumplimiento del itinerario y garantizar la seguridad del personal docente:
  </p>

  <div class="callout callout-success no-break">
    <strong>¿Cómo realizar un Check-in GPS en 3 sencillos pasos?</strong>
    <ol style="margin: 4px 0 0 0; padding-left: 20px;">
      <li>En la sección <em>"Itinerario de Paradas"</em>, presione el botón <strong>"Registrar Arribo GPS"</strong> en la parada correspondiente.</li>
      <li>El celular solicitará permiso de ubicación. Presione <em>"Permitir"</em>. El sistema capturará automáticamente las coordenadas de latitud y longitud satelitales.</li>
      <li>(Opcional) Ingrese el odómetro actual del tablero y una breve nota (ej. <em>"Entregado material escolar"</em>) y presione <strong>"Confirmar Check-in"</strong>.</li>
    </ol>
    <p style="margin-top: 6px; font-size: 8pt; color: #065f46;">
      ✓ El check-in queda grabado con fecha y hora exacta y se refleja inmediatamente con enlace a Google Maps en la central ministerial.
    </p>
  </div>

  <h2 class="chapter-title">13. Carga de Combustible en Ruta</h2>
  <p>
    Si debe recargar combustible durante el trayecto con la tarjeta Edenred de la unidad:
  </p>
  <ul>
    <li>Haga clic en la pestaña <strong>"Combustible"</strong> en el menú inferior de su teléfono.</li>
    <li>Presione <em>"Registrar Carga"</em>, complete los litros y el importe del ticket.</li>
    <li>Tome una foto nítida del comprobante fiscal emitido por el surtidor y presione <em>"Guardar Carga"</em>.</li>
  </ul>

  <div class="page-break"></div>

  <!-- ======================================================== -->
  <!-- CALENDARIO CHOFER, PWA Y OFFLINE                         -->
  <!-- ======================================================== -->
  <div class="header-running">
    <span>Parte II: Guía de Uso para Conductores y Choferes</span>
    <span>PWA, Resiliencia Offline y Calendario</span>
  </div>

  <h1 class="section-title">
    <span>Calendario Personal y Modo Offline</span>
    <span class="badge badge-green" style="font-size: 8pt;">Tecnología PWA</span>
  </h1>

  <h2 class="chapter-title">14. Mi Calendario de Viajes Programados (/viajes-choferes)</h2>
  <p>
    En la vista de calendario exclusivo, el chofer puede consultar su agenda mensual completa:
  </p>
  <ul>
    <li><strong>Viajes Futuros:</strong> Días en los que tiene comisiones asignadas para prever horarios y viáticos.</li>
    <li><strong>Historial de Comisiones:</strong> Registro de servicios completados en el mes.</li>
    <li><strong>Política de Expiración (24 Horas):</strong> Toda comisión que no sea iniciada dentro de las 24 horas posteriores a la hora fijada por coordinación será cancelada automáticamente por el sistema y catalogada como <em>"Viaje no realizado"</em>.</li>
  </ul>

  <h2 class="chapter-title">15. Instalación de la Aplicación en Celulares (PWA)</h2>
  <p>
    El sistema cuenta con tecnología <strong>Progressive Web App (PWA)</strong>, lo que permite instalarlo directamente en su teléfono como una aplicación nativa sin pasar por Play Store o App Store:
  </p>

  <div class="grid-2 no-break">
    <div class="feature-box">
      <h4>Instalación en Celulares Android (Chrome)</h4>
      <ol style="margin: 4px 0; padding-left: 18px; font-size: 8pt;">
        <li>Abra el navegador Google Chrome e ingrese al sistema.</li>
        <li>Presione el botón <strong>"Instalar App"</strong> en el menú o toque los 3 puntos superiores de Chrome.</li>
        <li>Seleccione <strong>"Instalar aplicación"</strong> o <em>"Agregar a pantalla de inicio"</em>.</li>
        <li>Aparecerá el ícono oficial con el escudo de San Juan en su pantalla.</li>
      </ol>
    </div>
    <div class="feature-box">
      <h4>Instalación en iPhone / iPad (Safari)</h4>
      <ol style="margin: 4px 0; padding-left: 18px; font-size: 8pt;">
        <li>Abra el navegador Safari e ingrese al sistema.</li>
        <li>Toque el botón <strong>Compartir</strong> (cuadrado con flecha hacia arriba).</li>
        <li>Baje en el menú y seleccione <strong>"Agregar al inicio"</strong>.</li>
        <li>Toque <em>"Agregar"</em> arriba a la derecha. La app abrirá a pantalla completa.</li>
      </ol>
    </div>
  </div>

  <h2 class="chapter-title">16. Operación y Resiliencia Offline en Zonas Sin Señal</h2>
  <p>
    San Juan posee una amplia geografía interdepartamental con valles y caminos de montaña (Calingasta, Iglesia, Jáchal, Valle Fértil) donde con frecuencia se pierde la señal de datos 4G/5G:
  </p>

  <div class="callout callout-warning no-break">
    <strong>¿Cómo funciona el sistema cuando se corta internet?</strong>
    <ul>
      <li><strong>Modo Offline Automático:</strong> El <em>Service Worker</em> de la aplicación mantiene la pantalla cargada y muestra un indicador que avisa que se encuentra en modo sin conexión.</li>
      <li><strong>Consulta de Datos:</strong> El chofer puede seguir visualizando el itinerario, datos del vehículo y contactos de auxilio previamente cargados.</li>
      <li><strong>Sincronización al Volver a Ruta:</strong> Al recuperar señal de internet, los registros pendientes se transmiten de manera automática al servidor ministerial sin pérdida de información.</li>
    </ul>
  </div>

  <h2 class="chapter-title">17. Mi Perfil y Control de Licencia de Conducir</h2>
  <p>
    En la pestaña <code>/mi-perfil</code> el chofer puede verificar sus datos personales y la <strong>fecha de vencimiento de su carnet de conducir</strong>. Si la licencia caduca, el sistema lo inhabilitará automáticamente para ser despachado en el cronograma, por lo que se recomienda gestionar la renovación 15 días antes.
  </p>

  <div class="page-break"></div>

  <!-- ======================================================== -->
  <!-- PARTE 3: PREGUNTAS FRECUENTES Y SOPORTE                  -->
  <!-- ======================================================== -->
  <div class="header-running">
    <span>Parte III: Resolución de Conflictos y Soporte</span>
    <span>Preguntas Frecuentes y Mesa de Ayuda</span>
  </div>

  <h1 class="section-title">
    <span>Preguntas Frecuentes y Solución de Problemas</span>
    <span class="badge badge-gray" style="font-size: 8pt;">Mesa de Ayuda</span>
  </h1>

  <table class="no-break">
    <thead>
      <tr>
        <th style="width: 35%;">Mensaje de Alerta o Situación</th>
        <th style="width: 65%;">Causa y Procedimiento de Solución</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>"Conflicto de horario: El móvil / chofer ya tiene asignada una comisión..."</strong></td>
        <td>Existe superposición horaria en la misma fecha. <strong>Solución:</strong> Cambie el horario de salida/regreso en el Paso 4 del Wizard o elija otra movilidad/chofer disponible.</td>
      </tr>
      <tr>
        <td><strong>"Exceso de pasajeros: La unidad tiene capacidad para X pasajeros..."</strong></td>
        <td>Se intentó registrar más personas de las permitidas por ley para ese vehículo. <strong>Solución:</strong> Reduzca la nómina de pasajeros o asigne una combi/minibús con mayor plaza.</td>
      </tr>
      <tr>
        <td><strong>"Inhabilitación legal: El chofer posee su licencia vencida..."</strong></td>
        <td>La licencia de conducir del chofer ha caducado en el registro. <strong>Solución:</strong> El chofer debe presentar el nuevo plástico en Coordinación para que el Administrador actualice la fecha de vencimiento en <code>/choferes</code>.</td>
      </tr>
      <tr>
        <td><strong>"El chofer se encuentra en goce de licencia laboral..."</strong></td>
        <td>El conductor tiene asentada una licencia médica o anual. <strong>Solución:</strong> No puede salir a ruta hasta que finalice el período de licencia y sea dado de alta en personal.</td>
      </tr>
      <tr>
        <td><strong>"El odómetro de llegada debe ser mayor al de salida..."</strong></td>
        <td>Error de tipeo al cerrar la comisión (ej. se omitió un dígito). <strong>Solución:</strong> Verificar el tablero del vehículo e ingresar el valor real estrictamente superior.</td>
      </tr>
      <tr>
        <td><strong>"No se puede obtener ubicación GPS en el celular..."</strong></td>
        <td>El navegador del teléfono tiene desactivados los permisos de ubicación. <strong>Solución:</strong> En Configuración del Celular -> Aplicaciones -> Chrome/Safari -> Permisos -> Activar Ubicación (Precisa).</td>
      </tr>
    </tbody>
  </table>

  <h2 class="chapter-title">Mesa de Ayuda y Contactos de Emergencia Ministerial</h2>
  <div class="grid-2 no-break">
    <div class="feature-box">
      <h4>Dirección de Coordinación de Movilidades</h4>
      <p>
        <strong>Ubicación:</strong> Centro Cívico San Juan, Planta Baja.<br>
        <strong>Horario de Atención:</strong> Lunes a Viernes de 07:00 a 19:00 hs.<br>
        <strong>Teléfono Directo:</strong> (0264) 430-XXXX / Guardia 24hs.<br>
        <strong>Correo Oficial:</strong> movilidades.educacion@sanjuan.edu.ar
      </p>
    </div>
    <div class="feature-box">
      <h4>Auxilio Mecánico y Emergencias en Ruta</h4>
      <p>
        <strong>Grúa Oficial San Juan:</strong> 0800-888-XXXX (Línea Gratuita 24hs).<br>
        <strong>Póliza de Seguros:</strong> Ver número impreso al dorso de la Hoja de Ruta.<br>
        <strong>Atención Policial y Sanitarias:</strong> 911 (Emergencias) / 107 (Salud).
      </p>
    </div>
  </div>

  <div style="margin-top: 30px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 8pt; color: #94a3b8;">
    Documento oficial homologado por la Dirección de Informática y Dirección de Movilidades del Ministerio de Educación de San Juan.<br>
    Queda prohibida su reproducción no autorizada. Sistema SCVehículos · Todos los derechos reservados © 2026.
  </div>

</body>
</html>
"""

    html_file = os.path.join(docs_dir, "Guia_de_Usuario_SCVehiculos.html")
    with open(html_file, "w", encoding="utf-8") as f:
        f.write(html_content)

    print(f"[OK] Archivo HTML generado en: {html_file}")

    # Renderizar a PDF usando Microsoft Edge Headless
    edge_paths = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    ]
    edge_exe = None
    for p in edge_paths:
        if os.path.exists(p):
            edge_exe = p
            break

    if not edge_exe:
        print("[ERROR] No se encontró el ejecutable de Microsoft Edge o Google Chrome.")
        return

    output_pdf_docs = os.path.join(docs_dir, "Guia_de_Usuario_SCVehiculos_Administradores_y_Choferes.pdf")
    output_pdf_root = os.path.join(root_dir, "Guia_de_Usuario_SCVehiculos_Administradores_y_Choferes.pdf")

    temp_profile = os.path.join(os.environ.get("TEMP", "C:\\temp"), "edge-pdf-gen")
    os.makedirs(temp_profile, exist_ok=True)

    cmd = [
        edge_exe,
        "--headless",
        "--disable-gpu",
        f"--user-data-dir={temp_profile}",
        "--no-pdf-header-footer",
        f"--print-to-pdf={output_pdf_docs}",
        html_file
    ]

    print(f"Ejecutando renderizado con: {edge_exe} ...")
    result = subprocess.run(cmd, capture_output=True, text=True)
    time.sleep(2)

    if os.path.exists(output_pdf_docs):
        # Copiar también a la raíz para fácil acceso del usuario
        with open(output_pdf_docs, "rb") as src, open(output_pdf_root, "wb") as dst:
            dst.write(src.read())

        size_kb = os.path.getsize(output_pdf_docs) / 1024
        print(f"[EXITO] PDF generado con exito!")
        print(f" - Ruta Docs: {output_pdf_docs} ({size_kb:.1f} KB)")
        print(f" - Ruta Raiz: {output_pdf_root} ({size_kb:.1f} KB)")
    else:
        print("[ERROR] No se genero el archivo PDF. Salida de comando:")
        print(result.stdout)
        print(result.stderr)

if __name__ == "__main__":
    main()
