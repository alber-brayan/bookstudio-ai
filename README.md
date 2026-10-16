# BookStudio AI · v1

**Versión 1.0.0** · Estudio local para Windows: convierte fotografías de libros en modelos 3D, imágenes publicitarias y videos MP4.

[Descargar v1.0.0](https://github.com/alber-brayan/bookstudio-ai/releases/tag/v1.0.0) · [Guía completa](docs/GUIA.md) · [Cambios](CHANGELOG.md) · [Estado y límites](PROGRESS.md)

## Empezar en Windows

Requiere Node.js 24 o superior, Python con OpenCV/Pillow/NumPy y un navegador con WebGL. Desarrollo y pruebas realizados con Node 24.18 y Python 3.14.

```powershell
git clone https://github.com/alber-brayan/bookstudio-ai.git
cd bookstudio-ai
```

1. Ejecuta **INSTALAR.cmd** una vez para instalar dependencias y Chromium.
2. Ejecuta **INICIAR BOOKSTUDIO.cmd** y conserva la consola abierta.
3. Abre [BookStudio local](http://127.0.0.1:3000/).

No necesitas clave de OpenAI para cargar fotos, corregirlas, trabajar en 3D o exportar.

## Flujo de producción

1. **Cargar fotos:** coloca portada y contraportada en sus espacios. El libro 3D se actualiza automáticamente. Si solo tienes una foto, puedes elegir reutilizarla en el reverso.
2. **Ver y animar:** revisa el producto, elige escenas y usa proxies de 256/512/1024 px para editar con menor consumo.
3. **Exportar y descargar:** elige MP4, PNG o WebP, encuadre y resolución. El botón de exportación, el progreso y la descarga permanecen visibles en escritorio.

| Resolución | Horizontal 16:9 | Vertical 9:16 | Cuadrado 1:1 |
| --- | --- | --- | --- |
| 360p · prueba rápida | 640 × 360 | 360 × 640 | 360 × 360 |
| 720p · HD | 1280 × 720 | 720 × 1280 | 720 × 720 |
| 1080p · Full HD | 1920 × 1080 | 1080 × 1920 | 1080 × 1080 |

La resolución de exportación se guarda con el proyecto y usa las texturas completas. Los proxies solo afectan la edición. Puedes ocultar textos globalmente o por escena sin borrar los campos ni alterar la impresión de las fotografías.

Los videos se exportan como MP4 H.264. PNG/WebP admiten transparencia. La foto desde el inspector sale a 1080p y el GLB contiene texturas embebidas. Las descargas incluyen el nombre del proyecto y su extensión real.

## Archivos del proyecto

```text
src/
  app/                  interfaz Next.js y API local
  components/
    workflow/           carga sencilla y panel de exportación
    three/              libro, materiales, cámara y visor 3D
    ui/                 controles compartidos
  lib/                  esquemas, estado, dimensiones y versión
  server/               almacenamiento, proxies, procesamiento y cola
  video/                composición Remotion
processing/             trabajador Python y sus pruebas
scripts/
  render.mjs            exportación de una instantánea de trabajo
  produce-book.ts       preparar producción desde dos recursos importados
  qa/                   comprobaciones de integración y exportaciones
tests/                  pruebas unitarias TypeScript
docs/                   guía completa e historial de desarrollo
data/                   datos locales; no se suben a GitHub
```

Los proyectos, fotografías, proxies y exportaciones permanecen en `data/`. Para respaldarlos, detén el servidor y copia toda esa carpeta. El repositorio no incluye credenciales, fotos personales, bases de datos, dependencias instaladas ni archivos generados.

## Desarrollo y comprobaciones

```powershell
npm ci
python -m pip install -r processing/requirements.txt
npm run browser:install
npm run dev
```

```powershell
npm run typecheck
npm run lint
npm test
npm run test:python
npm run build
```

Para servir la compilación, detén desarrollo y ejecuta `npm start`. Para renderizar una instantánea con el servidor de recursos activo:

```powershell
npm run render -- data/jobs/ID-DEL-TRABAJO.json
```

Las pruebas que generan proyectos y exportaciones se documentan en [scripts/qa/README.md](scripts/qa/README.md). Los resultados verificados de v1 están resumidos en [PROGRESS.md](PROGRESS.md).

## IA opcional y límites

Copia `.env.example` a `.env.local` si necesitas configurar la API de imágenes. Las credenciales permanecen en el servidor. La edición mediante API puede generar cargos y no fue probada con una clave de pago. El límite actual es de solicitudes, no de gasto monetario.

La v1 implementa el flujo central; no cubre todas las funciones avanzadas del encargo original. 4K está deshabilitado. La cola no reanuda renders interrumpidos y faltan pruebas de carga con bibliotecas grandes. La aplicación es local, sin autenticación, y no debe exponerse a Internet tal como está. Consulta la [guía](docs/GUIA.md) para arquitectura, condiciones de licencia, funcionamiento y límites completos.
