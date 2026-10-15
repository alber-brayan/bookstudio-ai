import { booksForScene, type Project, type Scene } from "./schema";
export const proxySizes = [256, 512, 1024] as const;
export type ProxySize = 0 | (typeof proxySizes)[number];
export function previewSettings(project: Project) {
  const enabled = project.useProxies !== false;
  const tier = project.performance;
  const proxySize: ProxySize = enabled
    ? ({ low: 256, medium: 512, high: 1024 } as const)[tier]
    : 0;
  const edge = enabled
    ? ({ low: 360, medium: 540, high: 720 } as const)[tier]
    : 1080;
  const width =
    project.format === "portrait" || project.format === "square"
      ? edge
      : (edge * 16) / 9;
  const height = project.format === "portrait" ? (edge * 16) / 9 : edge;
  return {
    proxySize,
    width: Math.round(width / 2) * 2,
    height: Math.round(height / 2) * 2,
    shadowSize: enabled && tier !== "high" ? 512 : 1024,
    antialias: !enabled || tier === "high",
  };
}
export function showsText(project: Project, scene: Scene) {
  return project.showText !== false && scene.showText !== false;
}
export function sceneForDisplay(project: Project, scene: Scene): Scene {
  return showsText(project, scene)
    ? scene
    : { ...scene, title: "", subtitle: "", brand: "", price: "", cta: "" };
}
export function productionBooks(project: Project) {
  return [
    ...new Map(
      project.scenes
        .flatMap((scene) => booksForScene(project.books, scene))
        .map((book) => [book.id, book]),
    ).values(),
  ];
}
