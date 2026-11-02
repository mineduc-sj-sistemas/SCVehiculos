# Informes de Auditoría, Despliegue y Avance de Vistas

Este directorio almacena los informes de auditoría técnica y los reportes ejecutivos de despliegue para directivos y autoridades.

---

## 📁 Estructura

```
qa/informes/
├── INFORME_DEPLOY_Y_AVANCE_AAAA-MM-DD.md  # Ficha de deploy, mapa de vistas y deuda técnica
└── generados/                             # Informes HTML ejecutivos oficiales (A4 / PDF)
    └── INFORME_DEPLOY_Y_AVANCE_AAAA-MM-DD.html
```

---

## 🚀 Flujo de Trabajo

1. **Crear o actualizar el informe de despliegue en Markdown:**
   - Puedes usar como base `qa/plantillas/plantilla-informe-deploy.md`.
2. **Generar el HTML Ejecutivo Oficial:**
   - Ejecutar desde la raíz del proyecto:
     ```bash
     node qa/scripts/generar-informe-deploy.js qa/informes/INFORME_DEPLOY_Y_AVANCE_AAAA-MM-DD.md
     ```
3. **Presentación y Exportación a PDF:**
   - Abrir el archivo generado en `qa/informes/generados/` con cualquier navegador.
   - Pulsar **"🖨️ Imprimir / Guardar en PDF"** o presionar `Ctrl + P`.
