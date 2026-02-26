import type { DetectionBox2D } from '../../core/planogram-domain'

type DetectionBoxLike = Pick<DetectionBox2D, 'anchorMode' | 'anchorUV' | 'height' | 'width' | 'x' | 'y'>

export type NormalizedDetectionBox = {
  anchorU: number
  anchorV: number
  height: number
  width: number
  x: number
  y: number
}

export type DetectionFrameProjection = {
  anchorX: number
  anchorY: number
  boxHeight: number
  boxWidth: number
  boxX: number
  boxY: number
}

export type DetectionPlaneProjection = {
  anchorX: number
  anchorY: number
  boxHeight: number
  boxWidth: number
  centerX: number
  centerY: number
}

export function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
}

export function normalizeDetectionBox2D(
  box: DetectionBoxLike,
  options: { flipX: boolean; flipY: boolean },
): NormalizedDetectionBox {
  const width = clamp01(box.width)
  const height = clamp01(box.height)
  const x = options.flipX ? 1 - (clamp01(box.x) + width) : clamp01(box.x)
  const y = options.flipY ? 1 - (clamp01(box.y) + height) : clamp01(box.y)
  const anchorUsesBottomCenter = box.anchorMode === 'bottom_center' || !box.anchorUV
  const anchorRawU = clamp01(box.anchorUV?.[0] ?? clamp01(box.x) + width * 0.5)
  const anchorRawV = clamp01(box.anchorUV?.[1] ?? clamp01(box.y) + height)
  const anchorU = anchorUsesBottomCenter ? clamp01(x + width * 0.5) : options.flipX ? 1 - anchorRawU : anchorRawU
  const anchorV = anchorUsesBottomCenter ? clamp01(y + height) : options.flipY ? 1 - anchorRawV : anchorRawV
  return { anchorU, anchorV, height, width, x, y }
}

export function projectNormalizedDetectionToFrame(
  box: NormalizedDetectionBox,
  frame: { height: number; width: number; x: number; y: number },
  minSizePx = 0,
): DetectionFrameProjection {
  return {
    anchorX: frame.x + box.anchorU * frame.width,
    anchorY: frame.y + box.anchorV * frame.height,
    boxHeight: Math.max(minSizePx, box.height * frame.height),
    boxWidth: Math.max(minSizePx, box.width * frame.width),
    boxX: frame.x + box.x * frame.width,
    boxY: frame.y + box.y * frame.height,
  }
}

export function projectNormalizedDetectionToSensorPlane(
  box: NormalizedDetectionBox,
  plane: { height: number; width: number },
  minSizeM = 0,
): DetectionPlaneProjection {
  return {
    anchorX: (box.anchorU - 0.5) * plane.width,
    anchorY: (0.5 - box.anchorV) * plane.height,
    boxHeight: Math.max(minSizeM, box.height * plane.height),
    boxWidth: Math.max(minSizeM, box.width * plane.width),
    centerX: (box.x + box.width * 0.5 - 0.5) * plane.width,
    centerY: (0.5 - (box.y + box.height * 0.5)) * plane.height,
  }
}
