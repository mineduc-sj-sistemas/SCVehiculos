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
