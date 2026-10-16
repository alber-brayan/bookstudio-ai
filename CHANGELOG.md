# Historial de versiones

## 1.0.0 — 2026-10-15

- Flujo simplificado en tres pasos, espacios independientes para portada y contraportada y opción explícita de reutilizar una foto en ambas caras.
- Panel de exportación con MP4/PNG/WebP, relaciones 16:9, 9:16 y 1:1 y resoluciones 360p/720p/1080p. La resolución elegida se guarda con el proyecto.
- Botón de exportación, progreso y descarga visibles en escritorio; historial con dimensiones y último trabajo por proyecto.
- Descargas explícitas con nombre legible, extensión real y cabeceras HTTP. Se conserva la reproducción en navegador.
- Caja de previsualización con la proporción real, pantalla vacía sin WebGL, indicadores de tiempo limitados y menos actualizaciones del historial.
- Reordenamiento de paneles en pantallas estrechas y conservación de las herramientas avanzadas.
- Código del flujo agrupado en `src/components/workflow/`, comprobaciones en `scripts/qa/` y documentación completa en `docs/`.
- Versión 1.0.0 visible en la aplicación y API desde una única fuente.

Validación de la entrega: 16 pruebas TypeScript y 6 Python, TypeScript, ESLint y compilación de producción. Exportaciones y pruebas de navegador descritas en `PROGRESS.md`. Se mantienen los límites avanzados documentados, incluido 4K deshabilitado y API de pago pendiente de validación.

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
