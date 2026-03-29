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

const QUOTE = "This is complete and utter garbage.";

const colors = {
  bg: "#0d1117",
  cardBg: "#161b22",
  cardBorder: "#30363d",
  text: "#e6edf3",
  textMuted: "#848d97",
  openBadgeBg: "#238636",
  branchBg: "rgba(56,139,253,0.08)",
  branchText: "rgba(88,166,255,0.6)",
  branchBorder: "rgba(56,139,253,0.2)",
  tabBorder: "#30363d",
  tabActiveBorder: "#f78166",
  addGreen: "#3fb950",
  delRed: "#f85149",
};

const ChatIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M1.75 1h8.5c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0 1 10.25 10H7.061l-2.574 2.573A1.458 1.458 0 0 1 2 11.543V10h-.25A1.75 1.75 0 0 1 0 8.25v-5.5C0 1.784.784 1 1.75 1ZM1.5 2.75v5.5c0 .138.112.25.25.25h1a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h3.5a.25.25 0 0 0 .25-.25v-5.5a.25.25 0 0 0-.25-.25h-8.5a.25.25 0 0 0-.25.25Z" />
  </svg>
);

const CommitIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z" />
  </svg>
);

const CheckIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
  </svg>
);

const FileIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z" />
  </svg>
);

const PrIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="white">
    <path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z" />
  </svg>
);

export const LinusQuote: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // === LAYOUT ===
  // Content width 1300, centered in 1920.
  // Comment section positioned so avatar/name row is at vertical center of 1080 frame.
  // PR header sits above it. When zoom kicks in, center stays on torvalds.
  const contentWidth = 1300;
  const contentLeft = (1920 - contentWidth) / 2; // 310
  // Comment row top positioned so its vertical midpoint ~= 540 (frame center)
  const commentTop = 500;

  // === TIMELINE ===
  // 0.0 - 1.0s : PR header fades in
  // 1.0 - 2.0s : Comment box slides in
  // 2.0 - 7.0s : 3 full dot cycles, hard zoom step per dot
  // 7.0 - 10.0s: Quote slams in (stays zoomed)

  const headerFade = interpolate(frame, [0, 0.6 * fps], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const commentAppear = spring({
    frame: frame - 1.0 * fps,
    fps,
    config: { damping: 200 },
  });

  // --- Typing: 3 cycles of 3 dots ---
  const typingStart = 2.0 * fps;
  const framesPerDot = Math.round(0.7 * fps);
  const framePause = Math.round(0.5 * fps);
  const cycleLength = framesPerDot * 3 + framePause;
  const totalCycles = 3;
  const typingEnd = typingStart + cycleLength * totalCycles;
  const isTypingPhase = frame >= typingStart && frame < typingEnd;

  const typingElapsed = Math.max(0, frame - typingStart);
  const posInCycle = typingElapsed % cycleLength;
  const isInPause = posInCycle >= framesPerDot * 3;
  const dotCount = isInPause
    ? 0
    : Math.min(3, Math.floor(posInCycle / framesPerDot) + 1);

  // --- ZOOM: pure hard steps, NEVER decreases ---
  // Track the high-watermark of total dots that have ever appeared.
  // This only ever goes up.
  const zoomStep = 0.12;
  const baseZoom = 1.0;

  let maxDotsEver = 0;
  if (frame >= typingStart) {
    const elapsed = frame - typingStart;
    const fullCycles = Math.min(
      totalCycles,
      Math.floor(elapsed / cycleLength)
    );
    const remaining = elapsed - fullCycles * cycleLength;
    maxDotsEver = fullCycles * 3;
    if (fullCycles < totalCycles) {
      if (remaining >= framesPerDot * 3) {
        maxDotsEver += 3; // in pause, but all 3 dots appeared this cycle
      } else {
        maxDotsEver += Math.min(
          3,
          Math.floor(remaining / framesPerDot) + 1
        );
      }
    }
  }

  // Direct step. No springs. No interpolation. Just the number.
  const zoom = baseZoom + maxDotsEver * zoomStep;

  // --- Quote ---
  const quoteStart = typingEnd;
  const showQuote = frame >= quoteStart;
  const quoteOpacity = showQuote
    ? interpolate(frame, [quoteStart, quoteStart + 4], [0, 1], {
        extrapolateRight: "clamp",
        extrapolateLeft: "clamp",
      })
    : 0;

  const tabs: Array<{
    icon: React.FC;
    label: string;
    count: number;
    active: boolean;
  }> = [
    { icon: ChatIcon, label: "Conversation", count: 1, active: true },
    { icon: CommitIcon, label: "Commits", count: 1, active: false },
    { icon: CheckIcon, label: "Checks", count: 0, active: false },
    { icon: FileIcon, label: "Files changed", count: 47, active: false },
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
        overflow: "hidden",
        // Zoom toward the avatar/name area, not frame center.
        // Avatar center ≈ x:338, name center ≈ x:450 → midpoint ~400
        // Avatar center y ≈ 532, name center y ≈ 524 → midpoint ~528
        transform: `scale(${zoom})`,
        transformOrigin: "400px 528px",
      }}
    >
      {/* PR Header — positioned so its bottom edge is at headerBottom */}
      <div
        style={{
          position: "absolute",
          left: contentLeft,
          width: contentWidth,
          // Header content height ~250px. Place it so bottom = commentTop - 24
          top: commentTop - 24 - 250,
          opacity: headerFade,
        }}
      >
        <div style={{ marginBottom: 14 }}>
          <span
            style={{
              fontSize: 40,
              fontWeight: 600,
              color: colors.text,
              lineHeight: 1.3,
            }}
          >
            feat: cursor coded payments{" "}
          </span>
          <span
            style={{
              fontSize: 40,
              fontWeight: 300,
              color: colors.textMuted,
            }}
          >
            #1337
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              backgroundColor: colors.openBadgeBg,
              color: "#ffffff",
              padding: "5px 14px",
              borderRadius: 20,
              fontSize: 18,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <PrIcon />
            Open
          </div>
          <span style={{ fontSize: 18, color: colors.textMuted }}>
            kunalm2345 wants to merge 1 commit into{" "}
            <span
              style={{
                backgroundColor: colors.branchBg,
                color: colors.branchText,
                padding: "1px 6px",
                borderRadius: 5,
                fontSize: 15,
                border: `1px solid ${colors.branchBorder}`,
              }}
            >
              main
            </span>
            {" "}from{" "}
            <span
              style={{
                backgroundColor: colors.branchBg,
                color: colors.branchText,
                padding: "1px 6px",
                borderRadius: 5,
                fontSize: 15,
                border: `1px solid ${colors.branchBorder}`,
              }}
            >
              feat/payments-yolo
            </span>
          </span>
        </div>

        <div
          style={{
            display: "flex",
            borderBottom: `1px solid ${colors.tabBorder}`,
            alignItems: "center",
          }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <div
                key={tab.label}
                style={{
                  padding: "10px 18px",
                  fontSize: 18,
                  color: tab.active ? colors.text : colors.textMuted,
                  borderBottom: tab.active
                    ? `2px solid ${colors.tabActiveBorder}`
                    : "2px solid transparent",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Icon />
                <span>{tab.label}</span>
                <span
                  style={{
                    backgroundColor: "rgba(110,118,129,0.4)",
                    color: colors.text,
                    padding: "1px 8px",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {tab.count}
                </span>
              </div>
            );
          })}
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              gap: 8,
              fontSize: 16,
              paddingRight: 4,
            }}
          >
            <span style={{ color: colors.addGreen, fontWeight: 600 }}>
              +12,847
            </span>
            <span style={{ color: colors.delRed, fontWeight: 600 }}>
              -2
            </span>
          </div>
        </div>
      </div>

      {/* Comment section — positioned at vertical center of the frame */}
      <div
        style={{
          position: "absolute",
          left: contentLeft,
          width: contentWidth,
          top: commentTop,
          display: "flex",
          gap: 20,
          alignItems: "flex-start",
          opacity: commentAppear,
          transform: `translateY(${interpolate(commentAppear, [0, 1], [30, 0])}px)`,
        }}
      >
        {/* Avatar with Greptile badge */}
        <div style={{ flexShrink: 0, paddingTop: 4, position: "relative" }}>
          <Img
            src={staticFile("linus.jpg")}
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              border: `2px solid ${colors.cardBorder}`,
            }}
          />
          <Img
            src={staticFile("greptile.png")}
            style={{
              position: "absolute",
              bottom: -4,
              right: -6,
              width: 26,
              height: 26,
              borderRadius: 6,
              border: `2px solid ${colors.bg}`,
            }}
          />
        </div>

        {/* Comment card with beak */}
        <div
          style={{
            flex: 1,
            position: "relative",
          }}
        >
          {/* Beak / arrow pointing at avatar */}
          <div
            style={{
              position: "absolute",
              left: -12,
              top: 14,
              width: 0,
              height: 0,
              borderTop: "12px solid transparent",
              borderBottom: "12px solid transparent",
              borderRight: `12px solid ${colors.cardBorder}`,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: -10,
              top: 15,
              width: 0,
              height: 0,
              borderTop: "11px solid transparent",
              borderBottom: "11px solid transparent",
              borderRight: `11px solid rgba(22,27,34,0.8)`,
              zIndex: 1,
            }}
          />
        <div
          style={{
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: 8,
            backgroundColor: colors.cardBg,
            overflow: "hidden",
          }}
        >
          {/* Comment header */}
          <div
            style={{
              padding: "10px 20px",
              borderBottom: `1px solid ${colors.cardBorder}`,
              backgroundColor: "rgba(22,27,34,0.8)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{ fontSize: 22, fontWeight: 600, color: colors.text }}
            >
              torvalds
            </span>
            <span style={{ fontSize: 22, color: colors.textMuted }}>
              {frame < quoteStart
                ? "is reviewing your PR"
                : "commented on Apr 1"}
            </span>
          </div>

          {/* Comment body */}
          <div style={{ padding: "16px 20px", minHeight: 60 }}>
            {isTypingPhase && (
              <span
                style={{
                  fontSize: 20,
                  color: colors.textMuted,
                  letterSpacing: 2,
                }}
              >
                {isInPause ? "\u00A0" : ".".repeat(dotCount)}
              </span>
            )}

            {showQuote && (
              <p
                style={{
                  fontSize: 20,
                  color: colors.text,
                  lineHeight: 1.6,
                  margin: 0,
                  fontWeight: 400,
                  opacity: quoteOpacity,
                }}
              >
                {QUOTE}
              </p>
            )}
          </div>
        </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
