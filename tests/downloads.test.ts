import assert from "node:assert/strict";
import test from "node:test";
import { exportDownloadName } from "../src/lib/downloads";
test("download names include the project and preserve the actual extension", () => {
  for (const ext of ["mp4", "png", "webp", "glb"]) {
    assert.equal(
      exportDownloadName(
        "Fotos reales · Atenas",
        `d25f0d9e-4fc2-401c-82f4-67c4724cbef8.${ext}`,
      ),
      `BookStudio-Fotos-reales-Atenas-d25f0d9e.${ext}`,
    );
  }
});
test("download names remain safe for Windows and HTTP headers", () => {
  const name = exportDownloadName(
    'Edición: CON / portada\\\r\n".exe',
    "abcd1234.mp4",
  );
  assert.match(name, /^BookStudio-[a-zA-Z0-9_-]+-abcd1234\.mp4$/);
  assert.ok(exportDownloadName("x".repeat(300), "abcd1234.mp4").length < 110);
  assert.equal(
    exportDownloadName("😃", "abcd1234.mp4"),
    "BookStudio-produccion-abcd1234.mp4",
  );
  assert.throws(() => exportDownloadName("Proyecto", "../test.mp4"));
});
