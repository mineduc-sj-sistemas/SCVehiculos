# Pedidos de Cambio y Generación de Informes de Feedback

Este directorio almacena los pedidos de cambio generados durante el ciclo de QA y feedback con los usuarios o autoridades.

---

## 📁 Estructura

```
qa/pedidos/
├── PEDIDO_DE_CAMBIOS_AAAA-MM-DD.md     # Archivo Markdown fuente de tareas por Sprint
└── generados/                          # Informes HTML ejecutivos para autoridades (A4 / PDF)
    └── PEDIDO_DE_CAMBIOS_AAAA-MM-DD.html
```

---

## 🚀 Flujo de Trabajo

1. **Crear o editar el Markdown:**
   - Puedes usar como base la plantilla en `qa/plantillas/plantilla-pedido-cambios.md`.
   - Se gestiona marcando `[x]` (resuelto) o `[ ]` (pendiente) en cada punto.
2. **Generar el HTML Ejecutivo Oficial:**
   - Ejecutar desde la raíz del proyecto:
     ```bash
     node qa/scripts/generar-informe-feedback.js qa/pedidos/PEDIDO_DE_CAMBIOS_AAAA-MM-DD.md
     ```
3. **Imprimir / Exportar a PDF:**
   - Abrir el archivo generado en `qa/pedidos/generados/` con cualquier navegador web.
   - Es 100% independiente y portable (logo institucional en Base64).
   - Pulsar **"🖨️ Imprimir / Guardar en PDF"** o presionar `Ctrl + P`.
