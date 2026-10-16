# Comprobaciones manuales

Ejecuta los comandos desde la raíz del repositorio, con las dependencias instaladas y el servidor local activo. Estos scripts crean proyectos, archivos o trabajos de render; no son parte de `npm test`.

| Comando                                    | Requisitos y resultado                                                                                                                                                                      |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run test:integration`                 | Genera fotos sintéticas, importa y corrige, guarda un proyecto y encola PNG/MP4 de 15 s. Es el punto de entrada reproducible sin fotografías personales.                                    |
| `node scripts/qa/verify-render.mjs`        | Una vez terminados los renders anteriores, comprueba archivos y metadatos usando `data/verification/smoke.json`.                                                                            |
| `npx tsx scripts/qa/check-exports.ts`      | Requiere `smoke.json`; encola WebP vertical, PNG transparente, MP4 con tono de audio sintético y prueba cancelación en cola.                                                                |
| `node scripts/qa/verify-render.mjs --real` | Requiere el informe local `real-book.json` y sus exportaciones de 15 s. Las fotos y esos informes no se distribuyen en GitHub.                                                              |
| `npx tsx scripts/qa/check-preview.ts`      | Requiere `real-book.json`, el proyecto correspondiente y las descargas locales `proxy-original-photo.png`/`proxy-original-model.glb`. Comprueba proxies y encola PNG/MP4 verticales cortos. |
| `node scripts/qa/verify-preview.mjs`       | Cuando finalicen los trabajos anteriores, verifica los archivos identificados en `preview-report.json`.                                                                                     |

Todos los informes y archivos de prueba quedan bajo `data/`, excluido del repositorio. Los scripts específicos de fotos reales documentan las evidencias de desarrollo; no se deben ejecutar en una instalación nueva sin preparar sus datos.

Las pruebas unitarias se ejecutan con `npm test` y `npm run test:python`. No necesitan fotografías personales ni una clave de OpenAI.
