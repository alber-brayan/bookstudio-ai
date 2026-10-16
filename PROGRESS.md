# BookStudio AI · Estado de v1.0.0

Fecha de entrega: 15 de octubre de 2026, hora de Lima.

Repositorio: [alber-brayan/bookstudio-ai](https://github.com/alber-brayan/bookstudio-ai). Etiqueta de esta entrega: `v1.0.0`. El historial detallado de implementación y las evidencias locales anteriores se conservan en [docs/HISTORIAL_DESARROLLO.md](docs/HISTORIAL_DESARROLLO.md).

## Funciones incluidas

- Flujo visible en tres pasos: cargar fotos, ver/animar y exportar/descargar.
- Portada y contraportada independientes, arrastre de archivos, corrección automática y opción explícita de reutilizar la portada.
- Biblioteca, asignación manual de caras, corrección de cuatro esquinas, dimensiones, grosor, lomo y acabados.
- Vista 3D, escenarios, movimientos deterministas, plantillas y timeline. Textos globales o por escena y audio opcional.
- Proxies de 256/512/1024 px, lienzo reducido, visor bajo demanda, menos actualizaciones del indicador de tiempo y del historial.
- MP4/PNG/WebP en horizontal, vertical o cuadrado; 360p, 720p y 1080p. Foto del inspector a 1080p y modelo GLB.
- Progreso y descarga visibles, nombres con extensión real, historial con resolución y recuperación del último trabajo por proyecto.
- Autoguardado SQLite, recursos en archivos y compatibilidad con proyectos anteriores.
- Integración opcional de edición de imágenes por API, con comparación y aceptación explícita; no validada con credenciales de pago.

## Verificación

- 16 pruebas TypeScript y 6 pruebas Python aprobadas.
- TypeScript, ESLint sin advertencias y compilación de producción aprobados al preparar el release v1.0.0. También se comprobaron los enlaces de documentación, la sintaxis de los scripts reorganizados y la versión visible en navegador/API.
- Navegador: carga desde vacío, portada, reutilización explícita, contraportada distinta, vista 3D, reproducción/pausa, encuadres, calidad, progreso y descarga.
- MP4: horizontal 1080p de 15 s, vertical sin textos de 2 s y tres formatos a 720p de 2 s. Metadatos y decodificación completa verificados con FFprobe/FFmpeg.
- PNG transparente 360 × 360, WebP vertical 720 × 1280 y 1080 × 1920, texturas completas embebidas en GLB y descargas coincidentes con el archivo original.
- Vista estrecha de 800 px CSS comprobada sin desplazamiento horizontal. No se certifica una tasa de FPS fija por equipo.

Las pruebas de interfaz usaron copias aisladas y persistencia en memoria para no modificar el proyecto del usuario. Las evidencias de fotografías y videos se guardan localmente en `data/verification/` y `data/exports/`; no forman parte del código publicado. Los scripts QA indican cuáles requieren esas evidencias previas.

## Organización de la entrega

- README breve en la raíz; guía completa e historial dentro de `docs/`.
- Componentes del flujo principal dentro de `src/components/workflow/`.
- Scripts de comprobación dentro de `scripts/qa/`; el renderer conserva su ruta operativa.
- Versión de interfaz y API obtenida del mismo `package.json`.
- Credenciales, fotografías, bases de datos y archivos generados excluidos por `.gitignore`.
- Publicación autorizada como repositorio público, con aviso de copyright 2026 de `alber-brayan` y reserva de derechos en `LICENSE`, README y página del release. Las dependencias conservan sus licencias.

## Pendientes y límites

1. 4K, combinaciones de 60 FPS y pruebas prolongadas con muchas imágenes o productos.
2. Reanudación de cola tras reinicio, limpieza de caché y paneles redimensionables.
3. Detección robusta para fotos con reflejos, fondos complejos u oclusión; identificación de parejas por visión/OCR.
4. Trayectorias de cámara editables, geometría curva de lomo, HDRI, DOF y postprocesado avanzado.
5. Tipografías, logotipos, capas gráficas y mezcla de audio más completa.
6. Prueba autorizada de API de pago, presupuesto monetario e IA para fondos.

No se promete que v1 complete todos los módulos avanzados del encargo original. Las condiciones de licencia de Remotion y los detalles operativos figuran en [docs/GUIA.md](docs/GUIA.md).
