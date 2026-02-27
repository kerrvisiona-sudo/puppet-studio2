import { Suspense, lazy } from 'react'
import type { WorkspaceWidgetId } from '../../../../core/workspace-shell'
import { IconSliders } from '../../../../shared/ui'

const PoseControlPanel = lazy(() =>
  import('../../../pose/ui/PoseControlPanel').then((module) => ({ default: module.PoseControlPanel })),
)

interface WorkspaceLeftPanelProps {
  selectors: {
    showPropertiesWidget: boolean
    widgets: {
      properties: { collapsed: boolean; pinned: boolean }
    }
  }
  leftPanelWidthPx: number
  beginResize: (kind: 'left') => (e: React.PointerEvent<HTMLDivElement>) => void
  toggleWidgetCollapsed: (widget: WorkspaceWidgetId) => void
  toggleWidgetPinned: (widget: WorkspaceWidgetId) => void
  setWidgetVisibility: (widget: WorkspaceWidgetId, visible: boolean) => void
}

export function WorkspaceLeftPanel({
  selectors,
  leftPanelWidthPx,
  beginResize,
  toggleWidgetCollapsed,
  toggleWidgetPinned,
  setWidgetVisibility,
}: WorkspaceLeftPanelProps) {
  if (!selectors.showPropertiesWidget) return null

  return (
    <>
      <aside className="workspace-side workspace-side-left" style={{ width: `${leftPanelWidthPx}px` }}>
        <div className="workspace-side-content workspace-side-content-tight">
          <WorkspaceWidgetCard
            collapsed={selectors.widgets.properties.collapsed}
            icon={<IconSliders className="workspace-widget-head-icon" />}
            label="Properties"
            pinned={selectors.widgets.properties.pinned}
            onToggleCollapsed={() => toggleWidgetCollapsed('properties')}
            onTogglePinned={() => toggleWidgetPinned('properties')}
            onHide={() => setWidgetVisibility('properties', false)}
          >
            <Suspense fallback={<div className="panel-shell-loading">Loading controls...</div>}>
              <PoseControlPanel />
            </Suspense>
          </WorkspaceWidgetCard>
        </div>
      </aside>
      <div className="workspace-resize-handle vertical" onPointerDown={beginResize('left')} />
    </>
  )
}

import { WorkspaceWidgetCard } from './WorkspaceWidgetCard'
