# Verificación de la web editorial

## Dirección y criterio visual

The specimen catalogue · semilla 1979700348. Sin redibujos. Libro real como objeto central y selector de materiales como muestra para el visitante institucional. Paleta del logo: azul, amarillo y superficies claras. Tipografía autoalojada Bricolage Grotesque.

Revisión visual de capturas a 1440, 768 y 390 px: jerarquía del titular, portadas y CTA; sin desbordes horizontales; contenido completo y contacto legible. Se corrigieron encabezados demasiado largos, cuerpo con contraste insuficiente, microtexto de los lomos, etiquetas sin información y espacio final para evitar que el botón flotante cubra los enlaces del pie.

La inspección final de la composición estática registra cero fallos. Advierte variedad de tamaños tipográficos: se conserva porque los controles, las anotaciones de los objetos y los distintos niveles de lectura requieren roles diferenciados; las diferencias intermedias también provienen de la escala fluida.

Autoevaluación visual, no medición externa: diseño 8/10, uso 8.5/10, creatividad 8/10, contenido 8.5/10. El material audiovisual conserva la grabación real del cliente; no se presenta como filmación de estudio.

## Comprobaciones realizadas en navegador

- Cambio de portada y giro mediante teclado.
- Seis selecciones de video con seis archivos distintos.
- Reproducción real del MP4 optimizado: 540 × 720, silencioso, sin bloqueo de autoplay.
- Diálogo ampliado de video, controles nativos y cierre mediante Escape.
- Selección de espiral metálico y blanco y negro conservada en el formulario.
- Generación de mensaje completo con institución, cantidad, acabado y detalle; destino correcto `wa.me/51916227046`. Se interceptó la apertura de prueba; no se envió ningún mensaje.
- Pausa general de movimiento.
- Menú móvil, selección de sección, cierre y Escape con restauración de foco.
- Movimiento reducido: sin animaciones activas ni video automático.
- Carga de fuente local y recursos sin imágenes rotas ni errores de consola.
- HTML estático prerenderizado e hidratación sin advertencias; publicación separada de las API privadas del estudio.

`npm run build` del proyecto Next terminó correctamente. El proyecto estático también compila correctamente con esbuild. El estudio se conserva en `/studio`; no se modificaron las ediciones previas del usuario en `three/book.tsx` y `three/scene.tsx`.

No se verificó físicamente el domicilio ni se obtuvieron precios/plazos del negocio. La cotización los solicita al contacto, sin inventarlos.

## Actualización: venta institucional, personalización y video silencioso

Se verificó la política de venta exclusiva para instituciones educativas y la ausencia de venta individual en la portada y en la cotización. La sección de personalización conserva expresamente la propuesta de contenidos y materiales educativos de la editorial.

Los seis archivos web se remultiplexaron conservando la pista de video y eliminando la de audio. ffprobe confirmó cero pistas de audio en cada archivo. Los originales de VIDEOS permanecen intactos. Se usan nombres nuevos terminados en `-silent.mp4` para evitar reproducir una copia anterior de la caché. Se retiraron los seis archivos web con audio de las carpetas de distribución.

La prueba en navegador abrió y decodificó los seis videos en el diálogo silencioso; confirmó el botón «Ampliar video», su cierre con Escape y la ausencia del antiguo botón «Ver con sonido». Portada revisada a 1440 y 390 px, sin desbordes. TypeScript y el build estático terminaron correctamente.

## Evolución visual: vitrina de vidrio

Skills utilizadas: design-taste-frontend, impeccable-design, emil-motion y Sites. Se mantiene la dirección The specimen catalogue (semilla 1979700348), ahora como vitrina de vidrio con azul profundo, hielo y menta, y amarillo de marca para la acción final. Las excepciones de iluminación, transparencia y planos se fundamentan en la petición explícita del usuario, documentada en brief.md.

Se revisaron las capturas de escritorio, tablet y móvil. Tres correcciones principales: titulares de tablet ajustados a dos líneas; eliminación de la animación de opacidad en el contenedor del libro para conservar las caras 3D reales; liberación inmediata del desplazamiento al terminar el cierre de una ventana. La cabecera de la ventana permanece accesible al recorrer su contenido en móvil.

La inspección con las excepciones autorizadas registra cero fallos; conserva la advertencia conocida de tamaños fluidos y controles tipográficos diferenciados. El lint de origen también señala los mismos recursos visuales solicitados; no se ocultan ni se sustituyen para eludir el análisis.

Comprobaciones adicionales en navegador: ventana de muestras, portada y contraportada reales; giro continuo y arrastre (desplazamiento de 70 px produjo un cambio observable del ángulo); cambio entre muestras; tres ciclos consecutivos de apertura y cierre; Escape, devolución del foco y restauración del desplazamiento; navegación entre videos desde la ventana; seis archivos silenciosos; menú móvil; formulario y cotización sin envío real; movimiento reducido sin animaciones activas ni video automático. Build de Next.js y build estático correctos, sin dependencias nuevas.

Valoración visual propia, no externa: diseño 8.5/10, uso 8.5/10, creatividad 8.5/10, contenido 8.5/10. Las fotografías y grabaciones conservan la calidad del material original proporcionado.

## Ajuste: navegación lateral y acceso directo a cada muestra

El logo permanece en el flujo inicial del documento. La barra superior ya no es fija ni sticky. Un botón lateral abre un panel nativo Popover, con cierre al pulsar fuera, Escape, botón de cierre o selección de destino. En móvil el control queda en la esquina y el panel respeta ambos márgenes, incluso cuando el navegador muestra barra de desplazamiento.

Los tres libros visibles y la muestra de acabados abren el inspector de la producción seleccionada. Se distinguen el clic y el arrastre mediante un umbral de desplazamiento. Los controles táctiles usan superficies planas estables sobre las caras visuales 3D para evitar que el navegador retargetee el toque a otro libro solapado. El movimiento sutil queda en los libros visuales, separado de las zonas de selección.

Pruebas: cinco producciones correctas por clic y teclado; cinco producciones correctas por toque en un contexto móvil real de Playwright; arrastre conservado sin abrir la ventana; acceso desde acabados; menú, Escape, selección de enlace y cierre exterior; logo fuera de pantalla tras desplazar 1500 px; panel móvil dentro del viewport; restauración del desplazamiento después de cerrar el inspector. TypeScript y build estático correctos. Inspección a 1440, 768 y 390 px sin fallos, con la advertencia tipográfica documentada anteriormente.

## Ajuste final: personalización, ubicación visual y modo oscuro

La portada destaca textos personalizados con el logo de la institución y contenidos adaptados a su currícula. La misma propuesta aparece en el proceso y el inspector de muestras. Se conserva la venta institucional exclusiva.

Google Maps carga el pin de las coordenadas exactas del usuario y muestra calles reales de la zona. Se comprobó la carga del iframe y sus atribuciones en escritorio y móvil; «Cómo llegar» apunta a las mismas coordenadas. Los controles y créditos del proveedor quedan visibles. El mapa se carga de manera diferida.

El tema claro/oscuro se cambia desde la cabecera o el menú lateral, respeta la preferencia inicial del sistema y persiste en localStorage. Se verificaron el cambio desde ambos controles, la persistencia al recargar, el panel móvil dentro del viewport y la lectura del formulario oscuro. La inspección detectó y permitió corregir el contraste del enlace de salto al contenido; también se eliminó el margen blanco superior que resultaba del colapso del margen de la cabecera.

Revisión visual a 1440, 768 y 390 px: sin desbordes y titulares de dos líneas. Inspección final: cero fallos y la advertencia tipográfica ya justificada. Pruebas adicionales: mapa cargado en móvil, apertura y reverso de una muestra con el tema oscuro, Escape, selección del tema desde el menú y preferencias de movimiento reducido con cero animaciones y cero videos en reproducción. Sin errores de ejecución de React. TypeScript, build estático y build de Next.js correctos.

Valoración visual propia: diseño 8.5/10, uso 9/10, creatividad 8.5/10, contenido 9/10. Se conserva el material original de las muestras; el mapa depende de Google Maps y de la conexión del visitante.
