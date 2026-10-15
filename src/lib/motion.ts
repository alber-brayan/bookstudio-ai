import type { Scene } from "./schema";
export function motionAt(scene: Scene, frame: number, fps: number) {
  const t = Math.max(0, Math.min(1, frame / (scene.duration * fps - 1)));
  const e = t * t * (3 - 2 * t),
    phase = e * scene.speed;
  let rotation = -0.32,
    y = 0,
    x = 0,
    scale = 1,
    brightness = 1;
  switch (scene.movement) {
    case "hero":
      rotation = -0.75 + e * 0.5;
      y = -0.2 * (1 - e);
      brightness = 0.12 + 0.88 * Math.min(1, t * 3);
      break;
    case "orbit":
      rotation = -0.32 + phase * Math.PI * 2;
      break;
    case "turntable":
      rotation = phase * Math.PI * 2;
      break;
    case "dolly":
      scale = 0.82 + 0.25 * e;
      break;
    case "panorama":
      x = 0.6 - 1.2 * e;
      rotation = -0.2;
      break;
    case "floating":
      y = 0.12 * Math.sin(t * Math.PI * 2 * scene.speed);
      rotation = -0.35 + 0.15 * Math.sin(t * Math.PI * 2);
      break;
    case "front-back":
      rotation = -0.2 + Math.PI * e;
      break;
    case "final":
      rotation = -0.3;
      scale = 0.94 + 0.06 * e;
      break;
    case "fan":
      rotation = -0.25 + e * 0.16;
      break;
    case "exploded":
      rotation = -0.45 + e * 0.25;
      break;
  }
  return { t, e, rotation, y, x, scale, brightness };
}
