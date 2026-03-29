import "./index.css";
import { Composition } from "remotion";
import { LinusQuote } from "./LinusQuote";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="LinusQuote"
      component={LinusQuote}
      durationInFrames={300}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
