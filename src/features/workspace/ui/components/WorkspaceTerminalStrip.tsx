import { Suspense, lazy } from 'react'

import { STUDIO_SHORTCUTS } from '../../../../shared/shortcuts'

const SceneEventTerminal = lazy(() =>
  import('../../../terminal/ui/SceneEventTerminal').then((module) => ({ default: module.SceneEventTerminal })),
)

interface WorkspaceTerminalStripProps {
  terminalOpen: boolean
  terminalHeightPx: number
  eventCount: number
  onToggle: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  beginResize: (kind: 'terminal') => (e: any) => void
}

export function WorkspaceTerminalStrip({
  terminalOpen,
  terminalHeightPx,
  eventCount,
  onToggle,
  beginResize,
}: WorkspaceTerminalStripProps) {
  return (
    <div className="workspace-terminal-strip" style={{ height: terminalOpen ? `${terminalHeightPx + 8}px` : '34px' }}>
      {terminalOpen ? <div className="workspace-resize-handle horizontal" onPointerDown={beginResize('terminal')} /> : null}
      {terminalOpen ? (
        <Suspense fallback={<div className="terminal-shell-loading">Loading terminal...</div>}>
          <SceneEventTerminal layout="docked" />
        </Suspense>
      ) : (
        <button type="button" className="workspace-terminal-collapsed-bar" onClick={onToggle}>
          <span>Event Terminal</span>
          <span>events:{eventCount}</span>
          <span>{STUDIO_SHORTCUTS.terminal.toggle}</span>
        </button>
      )}
    </div>
  )
}
