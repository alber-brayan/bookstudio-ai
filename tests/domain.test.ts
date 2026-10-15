import { test } from "node:test";
import assert from "node:assert/strict";
import {
  assertRenderProducts,
  makeBook,
  makeProject,
  makeScene,
  pairFiles,
  locateScene,
  projectSchema,
  totalFrames,
  dimensions,
  movements,
} from "../src/lib/schema";
import { motionAt } from "../src/lib/motion";
import { scenesFromTemplate } from "../src/lib/templates";
test("pairs common names without losing index zero or duplicate fronts", () => {
  const groups = pairFiles([
    "LIBRO01_PORTADA.jpg",
    "LIBRO01_REVERSA.jpg",
    "LIBRO01_FRONT.png",
    "LIBRO02_FRONT.png",
    "LIBRO02_BACK.png",
  ]);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].front, 0);
  assert.equal(groups[0].back, 1);
  assert.deepEqual(groups[0].unassigned, [2]);
  assert.equal(groups[0].uncertain, true);
  assert.equal(groups[1].uncertain, false);
});
test("contraportada suffix does not get mistaken for portada", () => {
  const groups = pairFiles(["FISICA_PORTADA.png", "FISICA_CONTRAPORTADA.png"]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].back, 1);
});
test("folder names keep unrelated pairs separate", () => {
  assert.equal(
    pairFiles([
      "A/book_front.jpg",
      "A/book_back.jpg",
      "B/book_front.jpg",
      "B/book_back.jpg",
    ]).length,
    2,
  );
});
test("unknown names remain unpaired for manual review", () => {
  const p = pairFiles(["IMG_123.jpg", "IMG_124.jpg"]);
  assert.equal(p.length, 2);
  assert.ok(p.every((g) => g.uncertain));
});
test("scene boundaries align exactly on frame and never use browser clock", () => {
  const scenes = scenesFromTemplate(0, []);
  assert.equal(locateScene(scenes, 119, 30).index, 0);
  assert.equal(locateScene(scenes, 120, 30).index, 1);
  assert.equal(locateScene(scenes, 449, 30).localFrame, 119);
  for (const movement of movements) {
    const scene = { ...makeScene(), movement };
    assert.deepEqual(motionAt(scene, 50, 30), motionAt(scene, 50, 30));
    assert.ok(Object.values(motionAt(scene, 50, 30)).every(Number.isFinite));
  }
});
test("15 second template is exactly 450 frames at 30 fps", () => {
  const p = makeProject();
  p.scenes = scenesFromTemplate(0, []);
  assert.equal(totalFrames(p), 450);
  assert.ok(projectSchema.safeParse(p).success);
});
test("output dimensions match declared orientations", () => {
  assert.deepEqual(dimensions("portrait"), { width: 1080, height: 1920 });
  assert.deepEqual(dimensions("landscape"), { width: 1920, height: 1080 });
  assert.deepEqual(dimensions("square"), { width: 1080, height: 1080 });
});
test("malformed or oversized projects fail validation", () => {
  const p = makeProject();
  assert.equal(projectSchema.safeParse({ ...p, scenes: [] }).success, false);
  assert.equal(projectSchema.safeParse({ ...p, fps: 120 }).success, false);
  assert.equal(
    projectSchema.safeParse({ ...p, scenes: [{ ...p.scenes[0], duration: 0 }] })
      .success,
    false,
  );
});
test("an unrelated complete product cannot authorize exporting an incomplete selected book", () => {
  const p = makeProject(),
    complete = makeBook("Completo"),
    incomplete = makeBook("Sin reverso");
  const texture = {
    id: crypto.randomUUID(),
    original: "test.png",
    texture: "test.png",
    name: "Test",
    width: 100,
    height: 200,
    corners: [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ] as [number, number][],
    warnings: [],
    hash: "test",
  };
  complete.front = texture;
  complete.back = texture;
  incomplete.front = texture;
  p.books = [complete, incomplete];
  p.scenes = [makeScene([incomplete.id])];
  assert.throws(() => assertRenderProducts(p), /Sin reverso/);
  p.scenes = [makeScene([complete.id])];
  assert.doesNotThrow(() => assertRenderProducts(p));
  p.scenes = [{ ...makeScene(), movement: "fan" }];
  assert.throws(() => assertRenderProducts(p), /Sin reverso/);
});
