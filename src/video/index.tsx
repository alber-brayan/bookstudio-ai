import { Composition, registerRoot } from "remotion";
import { VideoComposition } from "./composition";
import {
  makeProject,
  totalFrames,
  dimensions,
  type Project,
} from "../lib/schema";
const defaults = {
  project: makeProject(),
  origin: "http://127.0.0.1:3000",
  transparent: false,
};
function Root() {
  return (
    <Composition
      id="BookCommercial"
      component={VideoComposition}
      durationInFrames={450}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={defaults}
      calculateMetadata={({ props }) => {
        const project = props.project as Project;
        return {
          durationInFrames: totalFrames(project),
          fps: project.fps,
          ...dimensions(project.format),
        };
      }}
    />
  );
}
registerRoot(Root);
