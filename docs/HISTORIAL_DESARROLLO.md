# BookStudio AI — estado de implementación

Actualizado: 15 de octubre de 2026, hora de Lima.

## Versión de código

Entrega **0.1.0**, etiqueta `v0.1.0`. Código preparado para `alber-brayan/bookstudio-ai`, con README, instaladores Windows, archivo `.env.example` e historial en `CHANGELOG.md`. Se excluyen los datos locales de `data/`, las credenciales, las dependencias instaladas y los archivos de compilación.

## Resultado de esta sesión

Se creó una aplicación independiente en `bookstudio-ai/`, conservando los documentos editoriales de la carpeta superior. El flujo local **dos imágenes → corrección → libro 3D → secuencia → MP4** se validó con recursos sintéticos y con las fotografías reales A1/A2 de Atenas importadas durante la sesión. Se creó el proyecto separado «Fotos reales · Atenas»; el proyecto que el usuario editaba y la imagen V2 permanecen conservados.

La aplicación aún no cubre todos los módulos de la especificación original. Las funciones avanzadas pendientes se detallan abajo y en el README. No se realizaron operaciones de IA de pago ni se publicaron archivos o fotografías en servicios externos.

## Módulos implementados y evidencia

| Área         | Implementación                                                                                                          | Verificación realizada                                                                                                                                                                                   |
| ------------ | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Base         | Next App Router, React, TypeScript estricto, Tailwind, componente Button shadcn/ui, Zustand, RHF/Zod                    | TypeScript y ESLint sin errores; revisión de escritorio en navegador                                                                                                                                     |
| Biblioteca   | Archivos, arrastre, carpetas, agrupación por sufijos, búsqueda, filtro de revisión, asignación e intercambio manual     | Importación HTTP y UI de FRONT/BACK; detección de duplicados SHA-256; pruebas de subcarpetas y nombres dudosos                                                                                           |
| Corrección   | Trabajador Python/OpenCV, homografía, EXIF, PNG sin pérdida, avisos heurísticos, cuatro puntos con ratón y teclado      | Seis pruebas Python, incluyendo bordes claros con poco contraste, detección de cuadrilátero, preservación de región de color, rechazo de esquinas cruzadas y recorte mínimo; edición manual en navegador |
| Persistencia | SQLite y sistema de archivos, autoguardado, recuperación de proyectos                                                   | Lectura posterior por HTTP y recarga de navegador; dimensiones y escenas conservadas                                                                                                                     |
| Producto 3D  | Geometría reutilizable, frente, reverso, lomo sintético, páginas, grosor, dimensiones, encuadernación y tres acabados   | Modelo real visible, cambio de grosor en UI, fotografías y GLB descargados                                                                                                                               |
| Visor        | Órbita, zoom, paneo, vistas y pantalla completa                                                                         | Render WebGL e inspección en navegador; la pantalla completa depende de autorización del navegador                                                                                                       |
| Escenas      | Seis escenarios, diez movimientos deterministas, velocidad, FOV e iluminación                                           | Funciones numéricas y repetibilidad probadas para los diez movimientos; hero/orbit/final revisados en video                                                                                              |
| Comerciales  | Seis secuencias editables, timeline, duración, reordenamiento, duplicado, título, apoyo, precio y CTA                   | Primera plantilla de 15 s aplicada en UI y renderizada; las otras cinco requieren revisión visual exhaustiva                                                                                             |
| Video        | Composición React con ThreeCanvas, animación por fotograma, texto, fundido/corte, cola serial                           | MP4 real H.264 1920 × 1080, 30 FPS, 450 fotogramas, duración 15.000 s; decodificación completa sin errores                                                                                               |
| Imágenes     | PNG/WebP desde composición, foto desde cámara del visor, opción de transparencia                                        | PNG publicitario 1080p revisado; foto de cámara 1080p y canal alfa 0–255 comprobados; WebP vertical 1080 × 1920 y audio AAC también verificados                                                          |
| Modelos      | GLB con materiales y texturas embebidas, conversión a metros                                                            | Archivo GLB v2 de 451.976 bytes, seis mallas y cuatro imágenes; descarga correcta en navegador                                                                                                           |
| IA           | SDK OpenAI servidor, modelos solicitados, consentimiento, caché, versiones, comparación, aceptación y restauración fiel | Estado sin clave y botón de pago desactivado comprobados. Llamada pagada y edición real **no verificadas**                                                                                               |
| Lotes        | Importación secuencial, reutilización por hash y un render por producto completo                                        | Caché y agrupación de lote verificadas. Importación de decenas de libros y exportación masiva prolongada pendientes                                                                                      |

## Pruebas ejecutadas

- `npm test`: **16/16** pruebas TypeScript aprobadas.
- `npm run test:python`: **6/6** pruebas Python aprobadas.
- `npm run typecheck`: aprobado.
- `npm run lint`: aprobado sin advertencias en el código de la aplicación.
- `npx tsx scripts/qa/smoke.ts`: importación de dos fotos sintéticas, detección de duplicado, corrección manual por API, grosor de 2.3 cm, guardado/lectura de proyecto, IA deshabilitada y cola de PNG/MP4.
- `node scripts/qa/verify-render.mjs`: formato, resolución, duración, 450 fotogramas, decodificación completa y extracción de fotogramas.
- Inspección visual de PNG y fotogramas de video a 1, 7 y 13 segundos: portada, contraportada/lomo y cierre presentes.
- UI: ejemplo local, corrección de esquina por teclado, importación de par, plantilla, reproducción/pausa, grosor, descarga GLB, foto y transparencia.
- `npm audit --omit=dev --audit-level=high`: **0 vulnerabilidades** reportadas. La auditoría completa mantiene avisos en dependencias de desarrollo de ESLint/Next (`fast-glob`/`micromatch`/`braces`); no se forzó una degradación incompatible de Next para eliminarlos.
- `npm run build`: compilación de producción aprobada, incluyendo TypeScript estricto y las rutas de la aplicación.
- Exportaciones adicionales: WebP vertical 1080 × 1920, PNG transparente, MP4 con AAC y cancelación de trabajo pendiente aprobados.
- `node scripts/qa/verify-render.mjs --real`: verificación del comercial de Atenas con fotos reales.
- Se corrigió el encuadre de cámara para mantener margen durante la rotación y se añadió validación de los productos efectivamente usados por cada escena. Una portada sin reverso se puede inspeccionar con la cara faltante lisa, pero no se autoriza una exportación incompleta.

## Archivos de evidencia

- `data/verification/TEST_FRONT.png`, `TEST_BACK.png`: fotografías sintéticas con perspectiva.
- `data/verification/smoke.json`: proyecto y IDs de la última prueba integral.
- `data/verification/render-report.json`: metadatos reales obtenidos con FFprobe.
- `data/verification/video-1s.png`, `video-7s.png`, `video-13s.png`: fotogramas extraídos del MP4.
- `data/verification/model.glb`, `viewer-photo.png`, `transparent-photo.png`: descargas desde la interfaz.
- `data/exports/e806abc1-cee3-4da1-b092-a49f5f42742f.mp4`: MP4 validado de 15 s.
- `data/exports/bf984315-dcd1-4b12-b314-e582901c28de.png`: PNG validado con producto.

Los intentos anteriores permanecen en el historial de desarrollo. Un primer error de resolución de alias de Webpack se corrigió usando importaciones relativas en los componentes compartidos con Remotion. La primera imagen sin producto se descartó visualmente: el pipeline ahora carga las texturas **antes** de crear WebGL, con retención explícita de Remotion. Los intentos antiguos con fallos no son la evidencia final. Para fotos reales, los archivos vigentes se identifican en `data/verification/real-book.json`.

## Criterios de aceptación del encargo

| Criterio                                      | Estado                                                                                 |
| --------------------------------------------- | -------------------------------------------------------------------------------------- |
| A · dos fotografías de un libro real          | Verificado con A1/A2 de Atenas; dimensiones físicas aproximadas y lomo sintético       |
| B · corrección manual                         | Verificado en API y navegador                                                          |
| C · grosor/lomo                               | Verificado en UI, PNG y fotograma de reverso                                           |
| D · escena y reproducción                     | Verificado                                                                             |
| E · MP4 Remotion de 15 segundos               | Verificado, 1080p H.264 30 FPS                                                         |
| F · imágenes desde ángulos                    | Descarga desde visor y PNG publicitario verificadas                                    |
| G · funcionamiento sin clave                  | Verificado                                                                             |
| H · edición real con API válida               | Implementada, pendiente por falta de prueba autorizada con credenciales                |
| I · múltiples libros y cola                   | Emparejamiento y cola implementados; pendiente estrés de decenas de productos          |
| J · abrir exportaciones y conservar identidad | MP4 decodificado, PNG y GLB comprobados; piezas reales de Atenas revisadas visualmente |

## Pendientes principales

1. Ampliar validación con más fotos reales; robustecer detección para fondos complejos, brillos y oclusión. La homografía de A1/A2 ya se verificó; los reflejos de esas fotos se conservan.
2. Más pruebas de videos largos verticales/cuadrados y cancelación durante un render activo; prueba de carga con una colección grande. WebP vertical, MP4 vertical de 2 s sin textos, audio AAC y cancelación en cola ya se verificaron.
3. 4K, 60 FPS y todas las combinaciones de preset/equipo: **no certificados**. 4K permanece bloqueado.
4. Límite monetario de IA y estimación fiable de costos. Actualmente hay límite conservador de solicitudes, no de dólares; no se reintentan cargos automáticamente.
5. IA para fondos/entornos y recursos decorativos independientes, presupuestos monetarios e historial de rechazo explícito.
6. Trayectorias de cámara editables, interpolaciones/springs elegibles, posición/escala individual de productos, DOF y postprocesado avanzado.
7. HDRI autorizado, geometría de lomo curvo, bordes redondeados, fotografía opcional de lomo y materiales de mayor fidelidad.
8. Siete estilos tipográficos, logotipos y capas gráficas, campos WhatsApp, efectos de sonido y mezcla de audio más completa.
9. Detección visual/OCR para identificar libros y sugerir parejas; convenciones de nombres configurables.
10. Paneles redimensionables, limpieza/caché de disco, reanudación de lotes y cola persistente tras reinicio.

## Operación

Los scripts `INSTALAR.cmd` e `INICIAR BOOKSTUDIO.cmd`, `.env.example`, comandos de desarrollo, render por consola, respaldo, arquitectura y condiciones de licencia están documentados en `README.md`. Remotion exige revisar sus términos para organizaciones de cuatro o más personas. La aplicación permanece local; no se creó un sitio alojado.

## Entrega con fotos reales de Atenas

- Proyecto: **Fotos reales · Atenas**; abrirlo desde «Proyectos».
- A1 se usó como portada y A2 como contraportada por su contenido visual de Atenas. V2 corresponde a otra marca y no se emparejó automáticamente con ellas.
- PNG final: `data/exports/433bb344-9ba7-4723-8c49-41b24df77877.png`.
- MP4 final: `data/exports/d25f0d9e-4fc2-401c-82f4-67c4724cbef8.mp4`.
- Metadatos y fotogramas: `data/verification/real-render-report.json`, `real-video-1s.png`, `real-video-7s.png`, `real-video-13s.png`.
- El proyecto conserva el tamaño aproximado de 21 × 29.7 cm; el grosor y lomo son editables, no mediciones del ejemplar real.
- Se deja el servidor local activo para no interrumpir el trabajo y los renders iniciados por el usuario. La compilación de producción está disponible mediante `npm start` después de detener el servidor de desarrollo.

## Actualización: proxies, vertical y sin textos

- Proxies WebP locales de 256/512/1024 px, activados por defecto y reutilizados desde `data/proxies`; la corrección y las texturas completas se conservan. Los proyectos anteriores siguen siendo compatibles.
- Cinema reduce también el tamaño del lienzo: en modo bajo, 640 × 360 horizontal o 360 × 640 vertical. El inspector usa DPR 1 con proxies y renderiza bajo demanda. Solo se cargan las cubiertas de los productos usados por las escenas.
- Barra visible con formato horizontal, vertical 9:16 y cuadrado; interruptor global «Sin textos» y control por escena. Se ocultan todos los rótulos publicitarios, sin borrar sus campos ni modificar la impresión de las fotografías. El producto se centra cuando no hay textos.
- El renderer fuerza texturas completas para MP4/PNG/WebP. Las descargas desde el visor recuperan las texturas completas temporalmente y restauran después los proxies.
- Prueba HTTP: portada de 798.917 bytes frente a proxy de 256 px de 9.110 bytes; dimensiones, MIME WebP, caché y hash del original comprobados. Tamaños 512/1024 comprobados y valor no permitido rechazado.
- Navegador: lienzos reales 360 × 640, 540 × 540 y 1080 × 1920; ambos controles de texto y conservación de campos comprobados. La prueba usó una pestaña aislada y persistencia interceptada en memoria para no modificar el proyecto del usuario; no se tomó esta recarga como prueba adicional de SQLite.
- Foto del visor 1080 × 1920 y GLB descargados desde el modo proxy 256. GLB inspeccionado: portada de 720 × 1019 y reverso de 659 × 933 embebidos, correspondientes a las texturas completas.
- PNG y MP4 verticales sin rótulos comprobados con las fotos de Atenas: H.264, 1080 × 1920, 30 FPS, 60 fotogramas, 2 s; decodificación completa y revisión visual de fotogramas. El proyecto fuente no se editó para estos renders.
- Evidencia: `data/verification/preview-report.json`, `preview-vertical-no-text.png`, `proxy-original-photo.png`, `proxy-original-model.glb` y `vertical-video-*.png`. Trabajos: PNG `556c81ae-773d-44e2-93cd-5055ded3f97e`, MP4 `15667694-72db-42ee-96d2-098c10f4c51f`.
- Scripts: `npx tsx scripts/qa/check-preview.ts` valida proxies/foto/GLB de la prueba y encola dos renders cortos; `node scripts/qa/verify-preview.mjs` comprueba sus archivos una vez terminados.
- Se añadieron cuatro pruebas de compatibilidad de proyectos, resoluciones verticales, visibilidad de textos y selección de texturas. No se certifica una tasa de reproducción fija en todos los equipos ni se ha hecho una prueba de carga con una biblioteca grande.
- Comprobaciones finales de esta actualización: TypeScript, ESLint, 13/13 pruebas TypeScript, 6/6 pruebas Python y compilación de producción con Webpack aprobados. El servidor local permanece activo.

## Verificación MP4 desde el navegador: tres formatos

- Se inició el servidor y se abrió el estudio. Se enviaron tres trabajos con el botón real «Renderizar MP4», usando una copia aislada de las fotos de Atenas; la persistencia de la pestaña de prueba se mantuvo en memoria para conservar el proyecto del usuario.
- Horizontal: `6d346df7-603b-4aa5-9a9e-f19f11c9ad91.mp4`, 1920 × 1080, 930.452 bytes.
- Vertical: `ddc3663f-dae3-4633-a47b-d29a8002e9fa.mp4`, 1080 × 1920, 1.224.260 bytes.
- Cuadrado: `cdcfcb94-2872-41ba-a2b5-f22ecdf2a944.mp4`, 1080 × 1080, 923.440 bytes.
- Los tres son H.264, 30 FPS, 60 fotogramas y 2 s. FFprobe verificó los metadatos y FFmpeg decodificó todos los fotogramas sin errores. Se revisaron fotogramas de encuadre.
- Se descargaron los tres archivos mediante los enlaces de la cola y se reprodujeron en elementos de video del navegador hasta `ended=true`, con duración 2 s y sin errores de reproducción. Los tamaños de video del navegador coincidieron con los tres formatos.
- Evidencia local: `data/verification/mp4-formats-report.json`, `mp4-ui-*.png`, `mp4-*-0.4s.png`, `playback-*.png` y `download-*.mp4`. Esta comprobación usa clips cortos; no certifica todas las combinaciones de duración, audio, FPS o tamaño de colección.

## Corrección de nombres de descarga

- La cola ahora solicita una respuesta `attachment` explícita y muestra «Descargar MP4/PNG/WebP». Se envía un nombre legible con proyecto, identificador corto y extensión real tanto en `download` como en `Content-Disposition` (`filename` y `filename*`). Las URLs sin `?download=1` conservan la reproducción inline y las peticiones por rangos.
- Los nombres se normalizan para Windows y cabeceras HTTP; se preserva la extensión del archivo real. También se corrige el MIME de recursos GLB servidos por la ruta de exportaciones.
- Descargas desde el botón real de la cola verificadas en Chromium independiente para MP4 horizontal, vertical y cuadrado, además de PNG: nombre con extensión correcto y bytes idénticos al archivo original. Peticiones de reproducción parcial: HTTP 206 e inline conservados. No se cambió la configuración de Windows ni se necesitó volver a renderizar.
- La prueba independiente evita interferir con el selector de archivos abierto por el usuario en su navegador. El navegador integrado de Codex no pudo automatizarse en esta sesión por un error de inicialización de su herramienta; no se certifica el comportamiento de su gestor propio de descargas.
- Evidencia: `data/verification/download-fix-report.json` y archivos en `data/verification/fixed-downloads/`. TypeScript, ESLint, 15/15 pruebas TypeScript y compilación de producción aprobados.

## Flujo simplificado de fotos, vista previa y descarga

- Navegación visible en tres pasos: cargar fotos, ver/animar y exportar/descargar. Portada y contraportada tienen botones y áreas de arrastre independientes. Una carga crea el libro si hace falta, actualiza el visor y asigna el producto a la escena activa. Reutilizar la portada como reverso requiere pulsar una opción explícita.
- La pantalla vacía muestra instrucciones en lugar de cargar WebGL o presentar un libro de muestra como si fuera el producto del usuario. El ejemplo sigue disponible mediante su botón dedicado.
- Nuevo panel de exportación abierto por defecto, con relaciones 16:9, 9:16 y 1:1; salida MP4/PNG/WebP y resoluciones 360p/720p/1080p. Las dimensiones finales se muestran antes de exportar. La resolución se guarda como parte del proyecto y el esquema acepta proyectos anteriores.
- Botón de exportación, progreso y enlace del último archivo siempre visibles al pie del panel en escritorio. Los trabajos nuevos guardan ID del proyecto, tamaño, FPS, duración y resolución para recuperarlos y distinguirlos en el historial. La foto del inspector mantiene salida 1080p, indicada en su apartado avanzado.
- El perfil 720p está implementado en API, cola y Remotion: 1280 × 720, 720 × 1280 o 720 × 720. La selección de proxy no cambia la resolución de exportación. 4K sigue deshabilitado.
- La caja del visor respeta la proporción real de cada formato. Se limita la actualización del indicador de timeline a 10 veces por segundo durante la reproducción, conservando el reloj de animación del Player y la posición exacta al pausar. El sondeo de trabajos no actualiza React si la respuesta no cambia. No se certifica una tasa de FPS fija por equipo.
- Biblioteca y herramientas avanzadas conservadas. Paneles reordenados para pantallas estrechas; verificado sin desbordamiento horizontal a un viewport CSS de 800 px. Controles por teclado y estilos con movimiento reducido conservados.
- Prueba de navegador desde cero: portada, reutilización explícita, contraportada distinta, vista 3D, reproducción/pausa, cambios de encuadre y calidad, descarga directa y desde historial. El guardado se interceptó en memoria en la pestaña de pruebas para no modificar el proyecto del usuario. La recarga comprobó el ajuste después del tiempo de autoguardado, no antes.
- Exportaciones reales desde los controles nuevos: tres MP4 720p de 2 s a 30 FPS (60 fotogramas), PNG transparente 360 × 360 y WebP vertical 720 × 1280. FFprobe y decodificación completa con FFmpeg aprobaron los MP4; Sharp comprobó tamaños y alfa de las imágenes. PNG y MP4 descargados por navegador coinciden byte a byte con los archivos de salida.
- Evidencia local: `data/verification/simple-flow-report.json`, `simple-empty.png`, `simple-final.png`, `simple-mobile.png` y `simple-*-frame.png`. Pruebas TypeScript: 16/16; Python: 6/6.
- Validación final de esta actualización: TypeScript, ESLint sin advertencias y compilación de producción con Webpack aprobados. El estudio queda abierto y el servidor local activo. Las pruebas usaron proyectos aislados; se conservaron las fotos y producciones existentes.
