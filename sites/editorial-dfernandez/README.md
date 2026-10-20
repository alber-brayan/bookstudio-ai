# Editorial D’Fernandez

Web institucional de textos escolares e impresión láser en Ayacucho, Perú.
La versión publicada es estática y no incluye las API, archivos privados ni herramientas de BookStudio.

## Desarrollo desde el repositorio principal

La portada se implementa en `src/components/editorial/` y se muestra en `/`.
El estudio existente sigue disponible en `/studio`.

1. `node scripts/package-editorial-site.mjs` sincroniza el componente, estilos y recursos públicos a este proyecto.
2. `node sites/editorial-dfernandez/build.mjs` produce `dist/` con HTML prerenderizado e hidratación de React.
3. `node scripts/preview-editorial.mjs` sirve la versión estática en `http://127.0.0.1:3001`, con soporte de video por rangos.

Este proyecto también se puede usar por separado: instalar sus dependencias y ejecutar `npm run build`.
Las fuentes de la web no dependen de las API de BookStudio.

## Recursos y comportamiento

- Cinco portadas y contraportadas reales optimizadas en WebP; representación 3D mediante seis caras CSS.
- Seis videos originales de `VIDEOS/`, comprimidos para la web sin pistas de audio, con posters.
- Logos originales de la editorial. Tipografía Bricolage Grotesque autoalojada, distribuida bajo SIL Open Font License.
- Imagen de detalle de encuadernación creada con GPT Image como ilustración; el texto alternativo la identifica como tal.
- La selección de impresión y encuadernación se mantiene en el formulario.
- Al enviar el formulario se abre WhatsApp al +51 916 227 046 con el resumen; el visitante envía el mensaje.
- No se almacenan consultas ni se inventan precios o plazos de producción.
- Video automático silencioso solo en pantalla; pausa en pestaña oculta y con movimiento reducido. Diálogo ampliado silencioso, controles y cierre con Escape.
- `prefers-reduced-motion`, foco visible, navegación con teclado y control general de movimiento.

Google Maps muestra las coordenadas proporcionadas por el titular: `-13.13684362522656, -74.23237880290648`. El botón «Cómo llegar» abre una ruta al mismo punto. El mapa se carga de forma diferida y conserva visibles los controles y atribuciones de Google.

La apariencia clara u oscura se selecciona en la cabecera o en el menú lateral. Al principio respeta la preferencia del sistema y recuerda la elección manual en `localStorage`; funciona durante la visita aunque el navegador no permita guardar preferencias.

## Publicación

La identidad de Sites está en `.openai/hosting.json`. Conservar siempre su `project_id`.
El script de preparación de publicación mantiene el checkout de Sites en `.sites-checkout/`, ignorado por el repositorio principal.
No agregar credenciales a archivos ni comandos. La versión inicial de Sites es privada.

Venta exclusiva para instituciones educativas; no se venden ejemplares individuales. Portadas e interiores se personalizan con el logo y la identidad institucional. La propuesta de contenidos y materiales educativos se adapta a la currícula de cada institución.
