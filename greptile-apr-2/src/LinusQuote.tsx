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

const MESSAGE = "This is complete and utter garbage.";

export const LinusQuote: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // === TIMELINE (7s) ===
  // 0.0 - 2.0s : linus2.jpg fills entire frame
  // 2.0 - 3.5s : Shrinks as a SQUARE → circle, image zooms into face
  // 3.5 - 5.0s : "..." dots beside name
  // 5.0 - 7.0s : Message replaces dots

  const zoomStart = 0.75 * fps;
  const zoomEnd = 2.25 * fps;
  const easing = Easing.inOut(Easing.quad);

  const photoFinalSize = 100;
  const chatLeft = (1920 - 800) / 2; // 560

  // Container is ALWAYS a square.
  // Starts at 1920 — matches frame width. The square extends above/below
  // the frame but overflow:hidden clips it, so you see the full width
  // of the image with minimal crop.
  const startSize = 1920;
  const containerSize = interpolate(
    frame,
    [zoomStart, zoomEnd],
    [startSize, photoFinalSize],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp", easing }
  );

  // Position: starts centered in frame, ends at chat position
  const containerLeft = interpolate(
    frame,
    [zoomStart, zoomEnd],
    [(1920 - startSize) / 2, chatLeft],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp", easing }
  );

  const containerTop = interpolate(
    frame,
    [zoomStart, zoomEnd],
    [(1080 - startSize) / 2, 540 - photoFinalSize / 2 - 20],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp", easing }
  );

  // borderRadius: 0 → 50%
  const borderRadiusPct = interpolate(
    frame,
    [zoomStart, zoomEnd],
    [0, 50],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp", easing }
  );

  // Image zoom: NO zoom at all until the transition starts.
  // Only zooms in during the container shrink, to keep the face framed.
  const imgScale = interpolate(
    frame,
    [0, zoomStart, zoomEnd],
    [1.0, 1.0, 1.0],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp", easing }
  );

  // --- Name appears beside photo ---
  const nameOpacity = interpolate(
    frame,
    [1.75 * fps, 2.25 * fps],
    [0, 1],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
  );

  // --- Dots phase: 3 full cycles ---
  const dotsStart = 2.25 * fps;
  const framesPerDot = Math.round(0.4 * fps);
  const framePause = Math.round(0.3 * fps);
  const cycleLength = framesPerDot * 3 + framePause;
  const totalCycles = 3;
  const dotsEnd = dotsStart + cycleLength * totalCycles;
  const isDotsPhase = frame >= dotsStart && frame < dotsEnd;

  const dotsElapsed = Math.max(0, frame - dotsStart);
  const posInCycle = dotsElapsed % cycleLength;
  const isInPause = posInCycle >= framesPerDot * 3;
  const dotCount = isInPause ? 0 : Math.min(3, Math.floor(posInCycle / framesPerDot) + 1);

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

  // Text position: to the right of the settled photo
  const textLeft = chatLeft + photoFinalSize + 32;
  // Photo center Y = containerTop + photoFinalSize/2 when settled
  const photoCenterY = 540 - photoFinalSize / 2 - 20 + photoFinalSize / 2;
  // Name vertically centered with photo middle (44px font, shift up to account for line height)
  const nameTop = photoCenterY - 38;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
        overflow: "hidden",
      }}
    >
      {/* Image container — always SQUARE, goes from full-bleed to circle */}
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
            objectPosition: "center 15%",
            transform: `scale(${imgScale})`,
            transformOrigin: "center 20%",
          }}
        />
      </div>

      {/* Name — vertically centered with photo */}
      {frame >= 1.75 * fps && (
        <div
          style={{
            position: "absolute",
            left: textLeft,
            top: nameTop,
            opacity: nameOpacity,
            fontSize: 44,
            fontWeight: 700,
            color: "#ffffff",
          }}
        >
          Linus Torvalds
        </div>
      )}

      {/* Dots / message — one line below the name */}
      {frame >= 1.75 * fps && (
        <div
          style={{
            position: "absolute",
            left: textLeft,
            top: nameTop + 58,
            opacity: nameOpacity,
          }}
        >
          {isDotsPhase && (
            <div
              style={{
                opacity: dotsOpacity,
                fontSize: 40,
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
                fontSize: 40,
                color: "rgba(255,255,255,0.85)",
                fontWeight: 400,
              }}
            >
              {MESSAGE}
            </div>
          )}
        </div>
      )}
    </AbsoluteFill>
  );
};
