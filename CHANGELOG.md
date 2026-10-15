# Historial de versiones

## 0.1.0 — 2026-10-15

Primera versión del estudio local para Windows. Flujo central: fotografías de portada y contraportada → corrección de perspectiva → producto 3D → composición → exportación.

- Biblioteca con importación de archivos y carpetas, pares por nombres, asignación manual y conservación de originales.
- Corrección de perspectiva con OpenCV y edición de cuatro esquinas.
- Libro 3D con dimensiones, grosor, lomo, materiales y visor con órbita, zoom y vistas.
- Escenas, plantillas y timeline con movimientos deterministas, textos publicitarios y audio opcional.
- Proxies WebP de 256, 512 y 1024 px, previsualización reducida y exportación con texturas completas.
- Formatos horizontal, vertical 9:16 y cuadrado; controles para ocultar textos globalmente o por escena.
- Exportación local MP4 H.264, PNG, WebP y modelo GLB; cola, progreso y cancelación.
- Autoguardado local con SQLite y archivos.
- Integración opcional de edición de imágenes con OpenAI; las llamadas pagadas no se han validado con credenciales.

Validación: 13 pruebas TypeScript, 6 pruebas Python, comprobaciones TypeScript/ESLint y compilación de producción aprobadas. Pruebas locales de MP4 horizontal de 15 s, MP4 vertical sin textos de 2 s, imágenes y texturas completas en GLB.

Los datos de prueba, fotografías, bases de datos, credenciales y archivos generados no forman parte del repositorio. Las funciones avanzadas pendientes y los límites conocidos se documentan en `README.md` y `PROGRESS.md`. 4K permanece deshabilitado.
