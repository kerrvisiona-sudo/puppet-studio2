import { normalizeDetectionBox2D, projectNormalizedDetectionToFrame } from '../../../core/scene-domain'
import type { CameraDetectionOverlay, MonitoringCameraDefinition } from '../../../core/planogram-domain'

export const CAMERA_PANEL_WIDTH = 280
export const CAMERA_PANEL_HEIGHT = 170
export const CAMERA_PANEL_PADDING = 14
export const CAMERA_PANEL_DPR = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1

function drawGrid(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, width, height)
  ctx.clip()
  ctx.strokeStyle = '#d7e1ef'
  ctx.lineWidth = 1
  for (let index = 1; index < 10; index += 1) {
    const alpha = index === 5 ? '#a7b8d3' : '#d7e1ef'
    ctx.strokeStyle = alpha
    const vx = x + (index / 10) * width
    const hy = y + (index / 10) * height
    ctx.beginPath()
    ctx.moveTo(vx, y)
    ctx.lineTo(vx, y + height)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x, hy)
    ctx.lineTo(x + width, hy)
    ctx.stroke()
  }
  ctx.restore()
}

function drawDetections(
  ctx: CanvasRenderingContext2D,
  overlay: CameraDetectionOverlay | null,
  x: number,
  y: number,
  width: number,
  height: number,
  flipX: boolean,
  flipY: boolean,
) {
  if (!overlay) return
  for (const box of overlay.boxes) {
    const normalized = normalizeDetectionBox2D(box, { flipX, flipY })
    const projected = projectNormalizedDetectionToFrame(normalized, { height, width, x, y }, 1)
    const color = box.trackId ? '#ea580c' : '#e11d48'

    ctx.fillStyle = `${color}2a`
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.fillRect(projected.boxX, projected.boxY, projected.boxWidth, projected.boxHeight)
    ctx.strokeRect(projected.boxX, projected.boxY, projected.boxWidth, projected.boxHeight)

    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(projected.anchorX, projected.anchorY, 2.8, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(projected.anchorX, projected.anchorY, 4.3, 0, Math.PI * 2)
    ctx.stroke()

    const caption = box.trackId ?? box.objectId ?? box.label ?? box.id
    ctx.font = '10px Segoe UI, sans-serif'
    const textWidth = ctx.measureText(caption).width
    ctx.fillStyle = '#ffffffdd'
    ctx.fillRect(projected.boxX, Math.max(y + 1, projected.boxY - 12), textWidth + 8, 11)
    ctx.fillStyle = '#243247'
    ctx.fillText(caption, projected.boxX + 4, Math.max(y + 10, projected.boxY - 3))
  }
}

export function drawCameraPlane(
  canvas: HTMLCanvasElement,
  camera: MonitoringCameraDefinition | null,
  overlay: CameraDetectionOverlay | null,
  flipX: boolean,
  flipY: boolean,
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, CAMERA_PANEL_WIDTH, CAMERA_PANEL_HEIGHT)
  ctx.fillStyle = '#f7f9fc'
  ctx.fillRect(0, 0, CAMERA_PANEL_WIDTH, CAMERA_PANEL_HEIGHT)

  const frameX = CAMERA_PANEL_PADDING
  const frameY = CAMERA_PANEL_PADDING
  const frameWidth = CAMERA_PANEL_WIDTH - CAMERA_PANEL_PADDING * 2
  const frameHeight = CAMERA_PANEL_HEIGHT - CAMERA_PANEL_PADDING * 2

  ctx.fillStyle = '#edf3fb'
  ctx.fillRect(frameX, frameY, frameWidth, frameHeight)
  drawGrid(ctx, frameX, frameY, frameWidth, frameHeight)

  ctx.strokeStyle = '#8ea4c3'
  ctx.lineWidth = 1.5
  ctx.strokeRect(frameX, frameY, frameWidth, frameHeight)

  drawDetections(ctx, overlay, frameX, frameY, frameWidth, frameHeight, flipX, flipY)

  ctx.fillStyle = '#314562'
  ctx.font = '10px Segoe UI, sans-serif'
  if (!camera) {
    ctx.fillText('Sin camara de monitoreo en metadata', frameX + 6, frameY + 14)
    return
  }
  ctx.fillText('x -> image width | y -> image height', frameX + 6, frameY + 14)
}
