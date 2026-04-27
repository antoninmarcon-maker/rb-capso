import { interpolate, spring, type SpringConfig } from "remotion";

const DEFAULT_SPRING: SpringConfig = {
  damping: 200,
  stiffness: 100,
  mass: 0.5,
  overshootClamping: false,
};

export function fadeInSpring(
  frame: number,
  startFrame: number,
  fps: number,
  durationInFrames = 24,
): number {
  return spring({
    frame: frame - startFrame,
    fps,
    from: 0,
    to: 1,
    durationInFrames,
    config: DEFAULT_SPRING,
  });
}

export function fadeOut(
  frame: number,
  startFrame: number,
  durationInFrames = 18,
): number {
  return interpolate(
    frame,
    [startFrame, startFrame + durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
}

export function kenBurnsScale(
  frame: number,
  totalFrames: number,
  from = 1.0,
  to = 1.04,
): number {
  return interpolate(frame, [0, totalFrames], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

export function slideUp(
  frame: number,
  startFrame: number,
  fps: number,
  distancePx = 18,
): number {
  const progress = spring({
    frame: frame - startFrame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 24,
    config: DEFAULT_SPRING,
  });
  return distancePx * (1 - progress);
}
