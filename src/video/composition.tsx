import {
  AbsoluteFill,
  Html5Audio,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  useRemotionEnvironment,
} from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { SceneContents } from "../components/three/scene";
import { locateScene, type Project } from "../lib/schema";
import { textureKey, useBookTextures } from "../components/three/textures";
import {
  previewSettings,
  productionBooks,
  sceneForDisplay,
  showsText,
} from "../lib/preview";
export type VideoProps = {
  project: Project;
  origin?: string;
  transparent?: boolean;
};
export function VideoComposition({
  project,
  origin = "",
  transparent = false,
}: VideoProps) {
  const { isRendering } = useRemotionEnvironment();
  const proxySize = isRendering ? 0 : previewSettings(project).proxySize;
  return (
    <LoadedComposition
      key={textureKey(productionBooks(project), origin, proxySize)}
      project={project}
      origin={origin}
      transparent={transparent}
    />
  );
}
function LoadedComposition({
  project,
  origin = "",
  transparent = false,
}: VideoProps) {
  const { isRendering } = useRemotionEnvironment();
  const preview = previewSettings(project);
  const textures = useBookTextures(
    productionBooks(project),
    origin,
    isRendering ? 0 : preview.proxySize,
  );
  const frame = useCurrentFrame(),
    { width, height, fps } = useVideoConfig();
  const { scene, localFrame, duration } = locateScene(
    project.scenes,
    frame,
    fps,
  );
  const portrait = height > width;
  const withText = showsText(project, scene);
  const fade =
    scene.transition === "fade"
      ? interpolate(
          localFrame,
          [0, Math.min(12, duration / 3), duration - 10, duration - 1],
          [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        )
      : 1;
  const reveal = interpolate(localFrame, [4, 24], [18, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        backgroundColor: transparent ? "transparent" : "#0c211d",
        fontFamily: "Arial, sans-serif",
        color:
          scene.studio === "white" || scene.studio === "soft"
            ? "#18342a"
            : "#eff1df",
      }}
    >
      {textures && (
        <ThreeCanvas
          width={width}
          height={height}
          shadows="percentage"
          dpr={1}
          camera={{ position: [0, 1.5, 7.3], fov: 35 }}
          gl={{
            alpha: transparent,
            antialias: isRendering || preview.antialias,
            preserveDrawingBuffer: true,
          }}
        >
          <SceneContents
            books={project.books}
            scene={sceneForDisplay(project, scene)}
            frame={localFrame}
            fps={fps}
            textures={textures}
            portrait={portrait}
            transparent={transparent}
            shadowSize={isRendering ? 1024 : preview.shadowSize}
          />
        </ThreeCanvas>
      )}
      {withText && (
        <AbsoluteFill
          data-testid="advertising-overlay"
          style={{ opacity: fade, pointerEvents: "none" }}
        >
          <div
            style={{
              position: "absolute",
              left: "7%",
              top: portrait ? "7%" : "16%",
              fontSize: width * 0.01,
              letterSpacing: width * 0.0025,
              fontWeight: 600,
            }}
          >
            {scene.brand ?? "BOOKSTUDIO"}{" "}
            <span style={{ opacity: 0.6 }}> / EDICIONES QUE INSPIRAN</span>
          </div>
          <div
            style={{
              position: "absolute",
              left: "7%",
              top: portrait ? "14%" : "32%",
              width: portrait ? "85%" : "39%",
              transform: `translateY(${reveal}px)`,
            }}
          >
            <div
              style={{
                fontSize: width * (portrait ? 0.078 : 0.047),
                fontWeight: 600,
                lineHeight: 1.08,
                letterSpacing: -width * 0.0017,
                whiteSpace: "pre-line",
              }}
            >
              {scene.title}
            </div>
            {scene.subtitle && (
              <div
                style={{
                  fontSize: width * (portrait ? 0.028 : 0.0135),
                  lineHeight: 1.5,
                  opacity: 0.7,
                  marginTop: width * 0.021,
                  maxWidth: "90%",
                }}
              >
                {scene.subtitle}
              </div>
            )}
          </div>
          <div
            style={{
              position: "absolute",
              left: "7%",
              bottom: "10%",
              display: "flex",
              gap: width * 0.025,
              alignItems: "center",
            }}
          >
            {scene.price && (
              <div
                style={{
                  fontSize: width * (portrait ? 0.06 : 0.035),
                  fontWeight: 600,
                }}
              >
                {scene.price}
              </div>
            )}
            {scene.cta && (
              <div
                style={{
                  fontSize: width * (portrait ? 0.025 : 0.012),
                  padding: `${width * 0.011}px ${width * 0.02}px`,
                  border: "1px solid currentColor",
                  borderRadius: 4,
                }}
              >
                {scene.cta}
              </div>
            )}
          </div>
          <div
            style={{
              position: "absolute",
              right: "7%",
              bottom: "6%",
              fontSize: width * 0.009,
              letterSpacing: width * 0.0018,
              opacity: 0.55,
            }}
          >
            UNA HISTORIA. INFINITAS POSIBILIDADES.
          </div>
        </AbsoluteFill>
      )}
      {project.audio && (
        <Html5Audio
          src={`${origin}/api/assets/${project.audio}`}
          volume={0.5}
        />
      )}
    </AbsoluteFill>
  );
}
