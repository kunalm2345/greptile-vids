import "./index.css";
import { Composition } from "remotion";
import { z } from "zod";
import {
  LinusQuote,
  linusQuoteSchema,
  calculateLinusQuoteDuration,
} from "./LinusQuote";

const defaultProps: z.infer<typeof linusQuoteSchema> = {
  photoFinalSize: 120,
  startSize: 1080,
  fontSize: 60,
  dotCycles: 3,
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="LinusQuote"
      component={LinusQuote}
      schema={linusQuoteSchema}
      defaultProps={defaultProps}
      calculateMetadata={({ props }) => ({
        durationInFrames: calculateLinusQuoteDuration(props.dotCycles),
      })}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
