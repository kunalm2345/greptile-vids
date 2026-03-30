import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";

export const linusQuoteSchema = z.object({
  photoFinalSize: z.number().min(40).max(400).describe("Final photo square size (px)"),
  startSize: z.number().min(1080).max(3000).describe("Initial image zoom (px) — larger = more zoomed in"),
  fontSize: z.number().min(16).max(120).describe("Text size for name label"),
  dotCycles: z.number().min(1).max(10).int().describe("Number of dot animation cycles"),
});

const MESSAGE = "This is complete and utter garbage.";

const FPS = 30;
const MSG_HOLD_FRAMES = 90; // 3s hold after message appears

export const calculateLinusQuoteDuration = (dotCycles: number) => {
  const dotsStart = Math.round(2.25 * FPS);
  const framesPerDot = Math.round(0.4 * FPS);
  const framePause = Math.round(0.3 * FPS);
  const cycleLength = framesPerDot * 3 + framePause;
  const dotsEnd = dotsStart + cycleLength * dotCycles;
  return dotsEnd + MSG_HOLD_FRAMES;
};

export const LinusQuote: React.FC<z.infer<typeof linusQuoteSchema>> = ({
  photoFinalSize,
  startSize,
  fontSize,
  dotCycles,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // === TIMELINE ===
  // 0.0 - 0.75s : Full-bleed photo holds
  // 0.75 - 2.25s : Camera zoom-out — photo shrinks to circle,
  //                text slides in from off-screen right
  // 2.25 - ~6.8s : Dots animate (3 cycles)
  // ~6.8 - end   : Message appears

  const zoomStart = 0.75 * fps;
  const zoomEnd = 2.25 * fps;
  const easing = Easing.inOut(Easing.quad);

  const chatLeft = (1920 - 800) / 2; // 560
  const photoFinalTop = 540 - photoFinalSize / 2;

  // --- Photo container: full-bleed square → small circle ---
  const containerSize = interpolate(
    frame,
    [zoomStart, zoomEnd],
    [startSize, photoFinalSize],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp", easing }
  );

  const containerLeft = interpolate(
    frame,
    [zoomStart, zoomEnd],
    [(1920 - startSize) / 2, chatLeft],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp", easing }
  );

  const containerTop = interpolate(
    frame,
    [zoomStart, zoomEnd],
    [(1080 - startSize) / 2, photoFinalTop],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp", easing }
  );

  const borderRadiusPct = interpolate(
    frame,
    [zoomStart, zoomEnd],
    [0, 12],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp", easing }
  );

  const imgScale = interpolate(
    frame,
    [0, zoomStart, zoomEnd],
    [1.0, 1.0, 1.0],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp", easing }
  );

  // --- Text position: slides in from off-screen right ---
  const photoTextGap = photoFinalSize * 0.32;
  const textFinalLeft = chatLeft + photoFinalSize + photoTextGap;
  const lineHeight = fontSize * 1.2;
  const nameTop = photoFinalTop + photoFinalSize / 2 - lineHeight / 2;

  // Text starts way off-screen right (2200) and slides to final position
  // Synchronized with the photo zoom-out
  const textLeft = interpolate(
    frame,
    [zoomStart, zoomEnd],
    [2200, textFinalLeft],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp", easing }
  );

  // Text scales down at the same ratio as the photo container:
  // Photo goes from 1920 to 100 = 19.2x reduction. Text should match.
  const textScale = interpolate(
    frame,
    [zoomStart, zoomEnd],
    [startSize / photoFinalSize, 1.0],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp", easing }
  );

  // Text opacity: starts visible (no fade), just slides in
  const textOpacity = interpolate(
    frame,
    [zoomStart, zoomStart + 8],
    [0, 1],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
  );

  // --- Dots phase: 3 full cycles ---
  const dotsStart = 2.25 * fps;
  const framesPerDot = Math.round(0.4 * fps);
  const framePause = Math.round(0.3 * fps);
  const cycleLength = framesPerDot * 3 + framePause;
  const totalCycles = dotCycles;
  const dotsEnd = dotsStart + cycleLength * totalCycles;
  const isDotsPhase = frame >= dotsStart && frame < dotsEnd;

  const dotsElapsed = Math.max(0, frame - dotsStart);
  const posInCycle = dotsElapsed % cycleLength;
  const isInPause = posInCycle >= framesPerDot * 3;
  const dotCount = isInPause
    ? 0
    : Math.min(3, Math.floor(posInCycle / framesPerDot) + 1);

  const dotsOpacity = interpolate(
    frame,
    [dotsStart, dotsStart + 5],
    [0, 1],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
  );

  // --- Message phase ---
  const msgStart = dotsEnd;
  const showMsg = frame >= msgStart;

  const msgSpring = spring({
    frame: frame - msgStart,
    fps,
    config: { damping: 200 },
  });

  const msgOpacity = showMsg
    ? interpolate(msgSpring, [0, 0.4], [0, 1], {
        extrapolateRight: "clamp",
        extrapolateLeft: "clamp",
      })
    : 0;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0D1117",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
        overflow: "hidden",
      }}
    >
      {/* Photo container — square, full-bleed → circle */}
      <div
        style={{
          position: "absolute",
          left: containerLeft,
          top: containerTop,
          width: containerSize,
          height: containerSize,
          borderRadius: `${borderRadiusPct}%`,
          overflow: "hidden",
        }}
      >
        <Img
          src={staticFile("linus2.jpg")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center top",
            transform: `scale(${imgScale})`,
            transformOrigin: "center 20%",
          }}
        />
      </div>

      {/* Name — slides in from right, scales down like camera zoom-out */}
      <div
        style={{
          position: "absolute",
          left: textLeft,
          top: nameTop,
          opacity: textOpacity,
          fontSize,
          lineHeight: `${lineHeight}px`,
          fontWeight: 700,
          color: "#ffffff",
          transform: `scale(${textScale})`,
          transformOrigin: "left center",
          whiteSpace: "nowrap",
        }}
      >
        Linus Torvalds
      </div>

      {/* Dots / message — same position logic, one line below name */}
      <div
        style={{
          position: "absolute",
          left: textLeft,
          top: nameTop + fontSize * 1.3,
          opacity: textOpacity,
          transform: `scale(${textScale})`,
          transformOrigin: "left center",
          whiteSpace: "nowrap",
        }}
      >
        {isDotsPhase && (
          <div
            style={{
              opacity: dotsOpacity,
              fontSize: fontSize * 0.9,
              color: "rgba(255,255,255,0.4)",
              letterSpacing: 4,
            }}
          >
            {isInPause ? "\u00A0" : ".".repeat(dotCount)}
          </div>
        )}

        {showMsg && (
          <div
            style={{
              opacity: msgOpacity,
              fontSize: fontSize * 0.9,
              color: "rgba(255,255,255,0.85)",
              fontWeight: 400,
              marginTop: 8,
            }}
          >
            {MESSAGE}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
