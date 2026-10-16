# BookStudio AI

Versión **1.0.0**. Consulta [CHANGELOG.md](../CHANGELOG.md) para las funciones de esta entrega.

Estudio web local para convertir fotografías de libros en productos 3D y comerciales MP4. Primera versión funcional, con el flujo de producción central implementado y módulos ampliables. **No representa la totalidad del alcance de producción descrito en el encargo.** Consulta [PROGRESS.md](../PROGRESS.md) para distinguir lo probado de lo pendiente.

## Inicio en Windows

Requisitos: Windows 10/11 de 64 bits, Node.js 24 o superior, Python con OpenCV/Pillow/NumPy y un navegador con WebGL. Se trabajó con Node 24.18 y Python 3.14. El equipo debe tener espacio para dependencias, Chromium, texturas y fotogramas temporales. Evita compilar la aplicación al mismo tiempo que renderizas en equipos con poca memoria libre.

Clona el repositorio o descarga el código de la versión `v1.0.0`. El repositorio contiene el código; las fotografías, proyectos SQLite, proxies y exportaciones son datos locales y no se incluyen.

```powershell
git clone https://github.com/alber-brayan/bookstudio-ai.git
cd bookstudio-ai
```

1. Ejecuta `INSTALAR.cmd` una vez. Descarga las dependencias públicas y Chromium para Remotion. No requiere clave OpenAI.
2. Ejecuta `INICIAR BOOKSTUDIO.cmd`.
3. Abre **http://127.0.0.1:3000** y conserva la consola abierta.

También puedes usar PowerShell:

```powershell
cd 'C:\ruta\a\bookstudio-ai'
npm ci
python -m pip install -r processing/requirements.txt
npm run browser:install
npm run dev
```

No hay una instalación global de FFmpeg obligatoria: Remotion incluye sus binarios para la plataforma. La descarga inicial requiere Internet; el procesamiento de fotos y el render posterior son locales. Node SQLite puede emitir un aviso experimental en algunas versiones de Node.

## Primera producción

El flujo principal está visible sobre el visor: **1. Cargar fotos → 2. Ver y animar → 3. Exportar y descargar**.

- En el panel izquierdo, sube o arrastra la **Portada** y la **Contraportada** a sus espacios. La corrección y el libro 3D se preparan automáticamente; no hay que compilar manualmente. Si solo tienes una foto, **Usar portada también como reverso** es una elección explícita. **Ver mi libro** asigna ese producto a la escena activa.
- En **Exportar y descargar**, elige **16:9 horizontal, 9:16 vertical o 1:1 cuadrado**, y **360p, 720p o 1080p**. El panel muestra las dimensiones exactas y guarda la resolución con el proyecto. La calidad del proxy es independiente de estas opciones.
- Elige **MP4, PNG o WebP** y pulsa el botón de exportación, siempre visible al pie del panel en escritorio. El progreso y el enlace de descarga aparecen en el mismo lugar. **Ver todas mis descargas** abre el historial con tamaño y resolución de cada nuevo trabajo.
- Para ajustes de cámara, escenas y producto, usa el paso 2 y las pestañas existentes. Importación de carpetas, modelos GLB y exportación por lotes siguen disponibles en sus apartados desplegables.

1. Importa imágenes o una carpeta. Se aceptan JPEG, PNG y WebP de hasta 30 MB y 60 megapíxeles por foto. Se conserva el archivo subido y una copia con EXIF normalizado.
2. Los sufijos `PORTADA`, `FRONT`, `FRONTAL`, `REVERSA`, `BACK`, `CONTRAPORTADA` y `POSTERIOR` agrupan pares. Los nombres desconocidos quedan incompletos para revisión manual. Las subcarpetas mantienen separados los productos con el mismo nombre.
3. En **Producto**, asigna portada y contraportada. «Corregir emparejamiento» permite elegir entre los recursos de la biblioteca o intercambiar caras. También puedes importar directamente en cada cara. El programa no intenta identificar títulos mediante OCR ni inferir parejas por visión.
4. **Corregir** abre la fotografía original. Ajusta las cuatro esquinas arrastrando o con flechas del teclado y aplica la homografía. La proporción de salida sigue las dimensiones del libro. La detección automática conserva una advertencia si no encuentra un contorno fiable.
5. Ajusta dimensiones, grosor, material, encuadernación y lomo. El lomo es una aproximación explícita, con color y texto editables.
6. En **Libro 3D**, gira con el botón izquierdo, acerca con la rueda y desplaza con el botón derecho. Hay vistas frontal, posterior, lomo y superior.
7. En **Plantillas**, elige una secuencia. La primera tiene 15 segundos: apertura de 4 s, órbita de 7 s y cierre de 4 s. Edita escenas, duración, velocidad, iluminación, marca/editorial, título, apoyo, precio y CTA. Añade música MP3/WAV opcional con autorización sobre sus derechos.
8. En **Cinema Studio**, reproduce o mueve el timeline. El panel de escena permite seis escenarios y diez movimientos de producto. Las animaciones dependen del fotograma y se comparten con la exportación.
9. En **Exportar**, envía un MP4 H.264 o una imagen PNG/WebP a la cola local. Para imágenes se usa el fotograma actual; en el visor 3D se puede descargar una foto desde la cámara actual o el modelo GLB. La cola incluye progreso, cancelación e historial.

En la cola, **Descargar MP4** guarda un nombre como `BookStudio-Mi-produccion-12345678.mp4`. La respuesta de descarga incluye la extensión y el nombre tanto en el enlace como en las cabeceras HTTP. Si conservas una descarga anterior con un identificador sin extensión, vuelve a descargarla desde la cola; no necesitas renderizar de nuevo.

El visor vacío muestra instrucciones de carga. «Explorar con un libro de ejemplo» crea sus dos texturas locales para probar el flujo; no utiliza IA ni fotografías externas.

## Proxies, formato vertical y producción sin textos

Encima del visor, **Vista previa** permite elegir proxies WebP de **256, 512 o 1024 px** de lado máximo, o las texturas originales. El modo predeterminado usa 512 px; para reducir el consumo elige 256 px. Los proxies se crean una sola vez y se reutilizan desde `data/proxies`. La vista Cinema también reduce su resolución: 640 × 360, 960 × 540 o 1280 × 720 en horizontal; 360 × 640, 540 × 960 o 720 × 1280 en vertical. Solo se cargan las cubiertas de los libros usados en la producción. El visor de inspección dibuja bajo demanda cuando se mueve la cámara.

En **Formato → Vertical · 9:16** puedes trabajar y exportar en 1080 × 1920. También están disponibles horizontal y cuadrado. La calidad de previsualización no cambia el formato ni la resolución elegida para exportar.

Activa **Sin textos** para ocultar marca, títulos, apoyo, precio, CTA y frase inferior de toda la producción. Para hacerlo por escena, desactiva **Escena → Mensaje publicitario → Mostrar textos en esta escena**. Los campos guardados se conservan y puedes volver a mostrarlos. Las letras impresas en la fotografía del libro permanecen intactas.

MP4, PNG y WebP de la composición cargan siempre las texturas completas; la foto del visor y el GLB también recuperan las texturas completas antes de descargarse y restauran después los proxies de edición. «Borrador · 360p» sigue siendo una elección explícita de resolución de exportación.

## Guardado y carpetas

Los proyectos se guardan automáticamente tras una pausa de edición. **Proyectos** permite recuperarlos o empezar uno nuevo. No cierres el servidor durante un render. Tras un reinicio los trabajos interrumpidos se marcan como error y pueden volver a enviarse; no se reanudan desde el fotograma interrumpido.

```text
data/
  bookstudio.sqlite    proyectos, recursos, historial y reservas de solicitudes IA
  assets/              originales, versiones corregidas, audio y copias IA
  proxies/             derivados WebP regenerables para edición ligera
  exports/             imágenes y MP4 terminados
  jobs/                instantáneas inmutables de cada render solicitado
  verification/        evidencias y recursos sintéticos de las pruebas de esta sesión
```

Para respaldo, detén el servidor y copia **toda** la carpeta `data`, incluyendo SQLite y recursos. No basta con copiar la base de datos. Las texturas antiguas se conservan; esta versión todavía no incluye limpieza automática del disco.

`BOOKSTUDIO_DATA_DIR` y `BOOKSTUDIO_OUTPUT_DIR` aceptan rutas absolutas de almacenamiento y salida. Deben configurarse en `.env.local` y requieren reinicio. Los archivos exportados se consultan desde el historial o desde la carpeta de salida.

## IA opcional

```powershell
Copy-Item .env.example .env.local
```

Edita `.env.local` en el servidor y configura `OPENAI_API_KEY`. **No uses prefijos `NEXT_PUBLIC_` para credenciales.** Reinicia el estudio. La clave no aparece en formularios, proyectos ni código del navegador.

El SDK oficial realiza edición mediante `images.edit`. Modelo predeterminado: `gpt-image-2.5-sunburst`. Alternativas explícitas: `gpt-image-2.5-flare` y `gpt-image-2`. La disponibilidad depende de la cuenta. La interfaz exige autorización para subir una copia y generar un cargo, muestra comparación e historial y aplica el resultado solo al aceptarlo. Se puede restaurar la textura fiel. Nunca se reemplaza el original subido.

No hay precio fijo prometido: el costo depende del uso de la API. `AI_MONTHLY_REQUEST_LIMIT` limita solicitudes reservadas, **no gasto monetario**. También cuentan los intentos con resultado incierto para evitar consumir de nuevo un presupuesto desconocido. El SDK no reintenta llamadas pagadas automáticamente; una cancelación no garantiza que OpenAI no haya comenzado a procesar la solicitud. Los resultados idénticos se reutilizan mediante caché.

**No se ejecutaron llamadas pagadas durante el desarrollo.** La edición real con una cuenta autorizada queda pendiente de validación. Están pendientes el límite monetario estricto y la estimación anticipada de costos. La IA puede cambiar texto o gráficos: revisa los resultados antes de usar una pieza comercial.

## Desarrollo, pruebas y render por consola

```powershell
npm run typecheck
npm run lint
npm test
npm run test:python
npm run build
npm start
```

Con el servidor activo, la integración de extremo a extremo genera dos fotografías sintéticas, las importa, verifica caché, corrige una perspectiva, guarda un proyecto de 15 s y encola PNG y MP4 de 1080p:

```powershell
npx tsx scripts/qa/smoke.ts
```

El archivo `data/verification/smoke.json` identifica los trabajos. Comprueba su estado en **Cola de render**. Para volver a ejecutar una instantánea de trabajo, con el servidor de recursos activo:

```powershell
npm run render -- data/jobs/ID-DEL-TRABAJO.json
```

`npm run studio` abre el entorno de Remotion para desarrollo de composiciones. El renderer de la aplicación es el comando anterior; no depende de Remotion Studio. La resolución de borrador es 640 × 360 en horizontal y 360 × 640 en vertical. El perfil 720p produce 1280 × 720, 720 × 1280 o 720 × 720. El perfil 1080p conserva 1920 × 1080, 1080 × 1920 o 1080 × 1080 según formato. **4K está bloqueado por falta de validación en este equipo.**

## Arquitectura

- `src/app`: Next App Router, página cliente y rutas HTTP locales.
- `src/components`: interfaz de estudio, formularios RHF/Zod, componentes shadcn/ui y editores de corrección/IA.
- `src/lib`: esquemas estrictos, estado Zustand, emparejamiento, plantillas y función de movimiento determinista.
- `src/components/three`: `Book3D` reutilizable, materiales PBR, iluminación, cámara y visor R3F/Drei.
- `src/video`: composición React real con `@remotion/three`; utiliza la misma geometría y movimiento. Los textos y el audio también forman parte del MP4.
- `src/server`: repositorio SQLite/archivos, cola serial de renders y puente al trabajador de imágenes.
- `processing/worker.py`: proceso Python independiente, JSON por stdin/stdout, OpenCV y Pillow; no abre puertos ni tiene acceso a servicios externos. Se serializan las correcciones para limitar memoria.
- `scripts/render.mjs`: proceso Node independiente, bundler y renderer oficial de Remotion con Chromium y H.264.

El render de cada trabajo usa una instantánea del proyecto, por lo que las ediciones posteriores no cambian una exportación en curso. Las unidades internas del visor son decímetros; al exportar GLB se aplica un factor 0.1 para obtener metros. El grupo se orienta con Y arriba y portada hacia +Z antes de las transformaciones de presentación.

Seguridad básica: servicio ligado a `127.0.0.1`, validación de esquemas y archivos, IDs generados por el servidor, acceso a recursos por nombres restringidos, sentencias SQLite parametrizadas, procesos sin shell ni nombres de usuario en comandos y rechazo de mutaciones desde orígenes externos. Es una aplicación personal local sin autenticación; no debe exponerse a Internet tal como está.

## Límites actuales

La homografía elimina el fondo exterior de un libro rectangular visible. No reconstruye partes ocultas ni segmenta objetos que lo tapen. Las alertas de desenfoque y zonas claras son heurísticas, no un detector fiable de reflejos u oclusión. Comprueba manualmente los recortes.

El modelo utiliza cubiertas planas, bloque de páginas procedural y lomo plano. No reconstruye curvatura real, relieve, páginas individuales ni textura de una tercera foto de lomo. No incorpora HDRI, reflejos trazados, profundidad de campo ni postprocesado artístico. La iluminación es PBR local, sin recursos remotos.

«Product orbit» y los demás presets de revelado rotan o trasladan el producto en una cámara fija parametrizada; no incluyen todavía un editor de trayectorias de cámara ni spring editable. El timeline usa cortes y fundidos a negro, con un revelado tipográfico simple; no incluye aún las siete familias tipográficas, logotipos, capas gráficas libres, WhatsApp como campo específico ni efectos de sonido por escena. El CTA puede contener texto de contacto.

El modo lote reconoce convenciones comunes y permite corrección manual, pero no usa similitud visual, OCR ni convenciones personalizadas. La importación se muestra como cola secuencial durante la operación; se puede reintentar desde caché, pero no se reanuda sola tras cerrar el navegador. La cola de render es local a un único proceso Next y no está diseñada para varios servidores.

La aplicación prioriza escritorio y reordena los paneles verticalmente en pantallas estrechas. Los paneles no son redimensionables todavía. Los perfiles bajo/medio/alto regulan proxies, resolución de Cinema, sombras y antialias; la exportación conserva una configuración estable y texturas completas. La GPU, RAM disponible y complejidad de la escena afectan la fluidez y el tiempo de render.

## Dependencias y licencias

Versiones exactas resueltas en `package-lock.json`. Remotion y sus paquetes están fijados a la misma versión; Zod se fija a la versión compatible indicada por Remotion. Three/R3F/Drei, React, Next, Tailwind, shadcn y las herramientas se usan conforme a sus licencias incluidas en `node_modules`. Los diseños de muestra se crearon para este proyecto, sin fotografías de terceros.

Remotion tiene condiciones específicas: la documentación consultada permite uso gratuito para individuos y empresas de hasta tres personas, con condiciones y obligación de cambiar de licencia al crecer; organizaciones de cuatro o más requieren revisar la licencia comercial. **No se promete que todo uso organizacional sea gratuito.** Consulta los términos oficiales antes de desplegar o distribuir un producto a un equipo mayor.

Fuentes oficiales consultadas:

- [Next.js, instalación y App Router](https://nextjs.org/docs/app/getting-started/installation)
- [React Three Fiber, compatibilidad de React](https://r3f.docs.pmnd.rs/getting-started/installation)
- [Remotion ThreeCanvas y animación por fotograma](https://www.remotion.dev/docs/three-canvas)
- [Remotion renderMedia](https://www.remotion.dev/docs/renderer/render-media)
- [Remotion, licencia y precios](https://www.remotion.dev/docs/license/pricing)
- [OpenAI, GPT Image 2.5 Sunburst](https://developers.openai.com/api/docs/models/gpt-image-2.5-sunburst)
- [OpenAI, generación y edición de imágenes](https://developers.openai.com/api/docs/guides/image-generation)

## Producción preparada con tus fotografías

En **Proyectos → Fotos reales · Atenas** encontrarás una producción de 15 segundos con A1 como portada y A2 como reverso, recortadas mediante OpenCV y homografía. Se conserva el proyecto que estabas editando y V2 queda disponible para su propio emparejamiento. No se utilizó IA generativa.

El PNG y MP4 finales se identifican en `data/verification/real-book.json`; su comprobación está en `real-render-report.json`. Son archivos H.264 de 1920 × 1080 a 30 FPS, con 450 fotogramas y duración de 15 segundos. Los reflejos y el detalle de impresión provienen de las fotos originales; no se reconstruyeron textos ni gráficos. Ajusta dimensiones y grosor si dispones de las medidas exactas.

Para repetir la verificación técnica local del comercial con fotos reales:

```powershell
node scripts/qa/verify-render.mjs --real
```

Las pruebas de esta sesión suman 16 casos TypeScript y 6 Python, además de pruebas HTTP, de navegador y de archivos exportados. WebP vertical de 1080 × 1920, PNG con alfa, audio AAC y cancelación de un trabajo pendiente también se probaron. La actualización de proxies incluye foto vertical, comprobación de texturas completas embebidas en GLB y un MP4 vertical de 2 s sin rótulos publicitarios; evidencia en `data/verification/preview-report.json`. La versión sigue teniendo las limitaciones avanzadas documentadas arriba y en `PROGRESS.md`.
