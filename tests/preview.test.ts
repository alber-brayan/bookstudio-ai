import assert from "node:assert/strict";
import test from "node:test";
import {
  makeBook,
  makeProject,
  makeScene,
  projectSchema,
} from "../src/lib/schema";
import {
  previewSettings,
  productionBooks,
  sceneForDisplay,
  showsText,
} from "../src/lib/preview";

test("legacy projects use proxies and retain full export format", () => {
  const p = makeProject();
  delete p.useProxies;
  delete p.showText;
  assert.ok(projectSchema.safeParse(p).success);
  assert.deepEqual(previewSettings(p), {
    proxySize: 512,
    width: 960,
    height: 540,
    shadowSize: 512,
    antialias: false,
  });
  assert.ok(showsText(p, p.scenes[0]));
  assert.equal(p.format, "landscape");
});
test("vertical previews scale independently of source and output resolution", () => {
  const p = {
    ...makeProject(),
    format: "portrait" as const,
    performance: "low" as const,
  };
  assert.deepEqual(previewSettings(p), {
    proxySize: 256,
    width: 360,
    height: 640,
    shadowSize: 512,
    antialias: false,
  });
  assert.equal(previewSettings({ ...p, performance: "high" }).height, 1280);
  assert.deepEqual(previewSettings({ ...p, useProxies: false }), {
    proxySize: 0,
    width: 1080,
    height: 1920,
    shadowSize: 1024,
    antialias: true,
  });
});
test("global and scene text switches hide every field without deleting saved content", () => {
  const p = makeProject(),
    scene = {
      ...p.scenes[0],
      brand: "Editorial",
      price: "S/ 35",
      cta: "Comprar",
    };
  const before = structuredClone(scene);
  assert.equal(sceneForDisplay(p, scene), scene);
  for (const [project, selected] of [
    [{ ...p, showText: false }, scene],
    [p, { ...scene, showText: false }],
  ] as const) {
    assert.equal(showsText(project, selected), false);
    const display = sceneForDisplay(project, selected);
    for (const field of ["title", "subtitle", "brand", "price", "cta"] as const)
      assert.equal(display[field], "");
    assert.deepEqual(display.bookIds, scene.bookIds);
  }
  assert.deepEqual(scene, before);
  assert.equal(
    showsText({ ...p, showText: false }, { ...scene, showText: true }),
    false,
  );
});
test("preview texture selection excludes unused library books and deduplicates scenes", () => {
  const books = [makeBook("A"), makeBook("B"), makeBook("Sin usar")];
  const p = {
    ...makeProject(),
    books,
    scenes: [
      makeScene([books[0].id]),
      makeScene([books[1].id]),
      makeScene([books[0].id]),
    ],
  };
  assert.deepEqual(
    productionBooks(p).map((b) => b.name),
    ["A", "B"],
  );
});
