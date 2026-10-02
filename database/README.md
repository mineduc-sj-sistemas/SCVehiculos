# Base de Datos Oficial: SCVehiculos
### Ministerio de Educación · Gobierno de San Juan

Motor: **MySQL 8.0+ / MariaDB 10.4+**  
Codificación: **`utf8mb4` / `utf8mb4_unicode_ci`**  
Base de datos: **`sc_vehiculos`**

---

## 📁 Archivos Disponibles

1. **`database/sc_vehiculos_completa.sql`** ⭐ *(Recomendado)*:
   - Archivo unificado "Todo en Uno".
   - Crea la base de datos `sc_vehiculos` con codificación UTF-8.
   - Crea todas las tablas con sus índices y llaves foráneas.
   - Inserta los datos maestros y de flota oficial.
   - **Listo para importar en 1 solo paso.**

2. **`database/schema.sql`**:
   - Estructura DDL limpia de todas las tablas e índices.

3. **`database/seed.sql`**:
   - Datos iniciales de roles, dependencias, choferes, flota, comisiones y mantenimientos.

4. **`database/migrations/`**:
   - `001_licencias_chofer.sql`: Control de licencias y ausencias de choferes.
   - `002_choferes_documentos.sql`: Soporte para documentos escaneados y múltiples categorías.
   - `003_repair_utf8_mojibake.sql`: Repara textos importados con doble codificación UTF-8 sin alterar acentos válidos.

---

## 🚀 Cómo Importar en MySQL / Laragon

### Opción A: Desde Terminal o PowerShell
```bash
mysql -u root -p < database/sc_vehiculos_completa.sql
```
*(Si no tienes contraseña en root en Laragon, simplemente omite `-p`)*:
```powershell
mysql -u root < database/sc_vehiculos_completa.sql
```

### Opción B: Desde phpMyAdmin o HeidiSQL (Laragon)
1. Inicia **Laragon** y pulsa **"Iniciar Todo"**.
2. Abre **HeidiSQL** o ve a `http://localhost/phpmyadmin`.
3. Ve a la pestaña **Importar** o abre una pestaña de consulta SQL.
4. Carga el archivo `database/sc_vehiculos_completa.sql` y pulsa **Ejecutar**.

---

## 👤 Cuentas de Acceso Iniciales

| Rol | Nombre | Correo Electrónico | Contraseña |
| :--- | :--- | :--- | :--- |
| **Administrador** | María Gutiérrez | `maria.gutierrez@sanjuan.edu.ar` | `admin123` |
| **Operador / Despacho** | Gonzalo Pérez | `gonzalo.perez@sanjuan.edu.ar` | `admin123` |
| **Auditor** | Roberto Méndez | `auditor@sanjuan.edu.ar` | `admin123` |
| **Chofer** | Martín Rojas | `martin.rojas@sanjuan.edu.ar` | `admin123` |
| **Chofer** | Lucía Gómez | `lucia.gomez@sanjuan.edu.ar` | `admin123` |
| **Chofer** | Carlos Molina | `carlos.molina@sanjuan.edu.ar` | `admin123` |
| **Chofer** | Esteban Paredes | `esteban.paredes@sanjuan.edu.ar` | `admin123` |
| **Chofer** | Javier Salinas | `javier.salinas@sanjuan.edu.ar` | `admin123` |
| **Chofer** | Ramiro Talquenca | `ramiro.talquenca@sanjuan.edu.ar` | `admin123` |
