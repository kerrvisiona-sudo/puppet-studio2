import { useCallback, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'

type ResizeKind = 'left' | 'right' | 'right_outliner' | 'terminal'

type ResizeStart = {
  kind: ResizeKind
  pointerId: number
  sizePx: number
  x: number
  y: number
}

export function useResizePanels(options: {
  leftPanelSizePx: number
  rightPanelSizePx: number
  rightPanelOutlinerHeightPx: number
  terminalHeightPx: number
  setLeftPanelSize: (px: number) => void
  setRightPanelSize: (px: number) => void
  setRightPanelOutlinerHeight: (px: number) => void
  setTerminalHeight: (px: number) => void
}) {
  const {
    leftPanelSizePx,
    rightPanelSizePx,
    rightPanelOutlinerHeightPx,
    terminalHeightPx,
    setLeftPanelSize,
    setRightPanelSize,
    setRightPanelOutlinerHeight,
    setTerminalHeight,
  } = options

  const resizeStartRef = useRef<ResizeStart | null>(null)

  const handleResizeMove = useCallback(
    (event: PointerEvent) => {
      const resizeStart = resizeStartRef.current
      if (!resizeStart) return
      if (resizeStart.pointerId !== event.pointerId) return

      if (resizeStart.kind === 'left') {
        const deltaX = event.clientX - resizeStart.x
        setLeftPanelSize(resizeStart.sizePx + deltaX)
        return
      }
      if (resizeStart.kind === 'right') {
        const deltaX = event.clientX - resizeStart.x
        setRightPanelSize(resizeStart.sizePx - deltaX)
        return
      }
      if (resizeStart.kind === 'right_outliner') {
        const deltaY = event.clientY - resizeStart.y
        setRightPanelOutlinerHeight(resizeStart.sizePx + deltaY)
        return
      }
      const deltaY = event.clientY - resizeStart.y
      setTerminalHeight(resizeStart.sizePx - deltaY)
    },
    [setLeftPanelSize, setRightPanelOutlinerHeight, setRightPanelSize, setTerminalHeight],
  )

  const handleResizeEnd = useCallback(
    (event: PointerEvent) => {
      const resizeStart = resizeStartRef.current
      if (!resizeStart || resizeStart.pointerId !== event.pointerId) return
      resizeStartRef.current = null
      window.removeEventListener('pointermove', handleResizeMove)
      window.removeEventListener('pointerup', handleResizeEnd)
    },
    [handleResizeMove],
  )

  const beginResize = useCallback(
    (kind: ResizeKind) => (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault()
      const sizePx =
        kind === 'left'
          ? leftPanelSizePx
          : kind === 'right'
            ? rightPanelSizePx
            : kind === 'right_outliner'
              ? rightPanelOutlinerHeightPx
              : terminalHeightPx
      resizeStartRef.current = {
        kind,
        pointerId: event.pointerId,
        sizePx,
        x: event.clientX,
        y: event.clientY,
      }
      window.addEventListener('pointermove', handleResizeMove)
      window.addEventListener('pointerup', handleResizeEnd)
    },
    [
      handleResizeEnd,
      handleResizeMove,
      leftPanelSizePx,
      rightPanelOutlinerHeightPx,
      rightPanelSizePx,
      terminalHeightPx,
    ],
  )

  return { beginResize }
}
