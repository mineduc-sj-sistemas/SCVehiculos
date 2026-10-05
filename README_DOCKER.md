# 🐳 Guía de Despliegue con Docker · SCVehiculos

Este entorno Docker encapsula completamente la aplicación y su base de datos MySQL, evitando cualquier inconsistencia entre entornos locales.

---

## 🚀 Inicio Rápido (1 solo comando)

Abre tu terminal en la raíz del proyecto y ejecuta:

```powershell
docker compose up --build -d
```

Esto realizará de forma 100% automatizada:
1. **Creación del contenedor MySQL (`sc_vehiculos_db`)**:
   - Inicializa automáticamente la base de datos `sc_vehiculos` con todas las tablas, relaciones, usuarios y vehículos demo usando [sc_vehiculos_completa.sql](database/sc_vehiculos_completa.sql).
   - Datos persistentes en el volumen Docker `sc_vehiculos_mysql_data`.
   - Puerto MySQL expuesto en el host: `3307` (para no entrar en conflicto con Laragon/MySQL local en el `3306`).
2. **Healthcheck**: Espera a que MySQL esté listo y respondiendo consultas antes de iniciar la app.
3. **Construcción y arranque de la App (`sc_vehiculos_app`)**:
   - Compila la aplicación con Astro y Node 22 standalone.
   - Conecta automáticamente a la base de datos MySQL del contenedor.
   - Disponible inmediatamente en: 👉 **[http://localhost:4321](http://localhost:4321)**

---

## 👤 Credenciales de Acceso

| Rol | Usuario / Correo | Contraseña |
| :--- | :--- | :--- |
| **Administrador** | `maria.gutierrez@sanjuan.edu.ar` | `admin123` |
| **Operador / Despacho** | `gonzalo.perez@sanjuan.edu.ar` | `admin123` |

---

## 🛠 Comandos Útiles

### Ver estado de los contenedores:
```powershell
docker compose ps
```

### Ver logs en tiempo real:
```powershell
docker compose logs -f
```

### Ver logs solo de la aplicación:
```powershell
docker compose logs -f app
```

### Detener los contenedores:
```powershell
docker compose down
```

### Detener y reiniciar limpiando la base de datos desde cero:
```powershell
docker compose down -v
docker compose up --build -d
```

---

## 💻 Modo Desarrollo con Hot-Reload

Si deseas modificar código en tiempo real dentro del contenedor, usa los atajos rápidos de `pnpm`:

```powershell
# Iniciar en modo desarrollo con recarga en caliente:
pnpm docker:dev

# Si se agregaron librerías nuevas o se cambió Dockerfile:
pnpm docker:build

# Iniciar solo la base de datos (para correr pnpm dev en local):
pnpm docker:db

# Detener los contenedores:
pnpm docker:down
```

*(O ejecutando directamente: `docker compose -f docker-compose.yml -f docker-compose.dev.yml up`)*

