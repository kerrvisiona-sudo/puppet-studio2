import { Suspense } from 'react'
import type { WorkspaceWidgetId } from '../../../../core/workspace-shell'
import { IconCamera, IconOutliner, IconPlanogram } from '../../../../shared/ui'
import { WorkspaceSceneOutliner } from '../components/WorkspaceSceneOutliner'
import { WorkspaceWidgetCard } from '../components/WorkspaceWidgetCard'

const CameraSubspaceMap = lazy(() =>
  import('../../../camera/ui/CameraSubspaceMap').then((module) => ({ default: module.CameraSubspaceMap })),
)
const PlanogramMiniMap = lazy(() =>
  import('../../../planogram/ui/PlanogramMiniMap').then((module) => ({ default: module.PlanogramMiniMap })),
)

import { lazy } from 'react'

interface WorkspaceRightPanelProps {
  selectors: {
    showOutlinerWidget: boolean
    showCameraWidget: boolean
    showPlanWidget: boolean
    rightPanelOpen: boolean
    widgets: {
      outliner: { collapsed: boolean; pinned: boolean; visible: boolean }
      camera: { collapsed: boolean; pinned: boolean; visible: boolean }
      planogram: { collapsed: boolean; pinned: boolean; visible: boolean }
    }
  }
  beginResize: (kind: 'right' | 'right_outliner') => (e: React.PointerEvent<HTMLDivElement>) => void
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: (command: any) => void
  dockManagerOpen: boolean
  onToggleDockManager: () => void
  rightPanelWidthPx: number
  outlinerHeightPx: number
  toggleWidgetCollapsed: (widget: WorkspaceWidgetId) => void
  toggleWidgetPinned: (widget: WorkspaceWidgetId) => void
  setWidgetVisibility: (widget: WorkspaceWidgetId, visible: boolean) => void
}

export function WorkspaceRightPanel({
  selectors,
  beginResize,
  dispatch,
  dockManagerOpen,
  onToggleDockManager,
  rightPanelWidthPx,
  outlinerHeightPx,
  toggleWidgetCollapsed,
  toggleWidgetPinned,
  setWidgetVisibility,
}: WorkspaceRightPanelProps) {
  const anyRightWidgetVisible = selectors.showOutlinerWidget || selectors.showCameraWidget || selectors.showPlanWidget

  if (!selectors.rightPanelOpen || !anyRightWidgetVisible) return null

  return (
    <>
      <div className="workspace-resize-handle vertical" onPointerDown={beginResize('right')} />
      <aside className="workspace-side workspace-side-right" style={{ width: `${rightPanelWidthPx}px` }}>
        <div className="workspace-side-head workspace-side-head-wrap">
          <button
            type="button"
            className={selectors.showOutlinerWidget ? 'active' : ''}
            onClick={() => setWidgetVisibility('outliner', !selectors.widgets.outliner.visible)}
          >
            Outliner
          </button>
          <button
            type="button"
            className={selectors.showCameraWidget ? 'active' : ''}
            onClick={() => setWidgetVisibility('camera', !selectors.widgets.camera.visible)}
          >
            Camera
          </button>
          <button
            type="button"
            className={selectors.showPlanWidget ? 'active' : ''}
            onClick={() => setWidgetVisibility('planogram', !selectors.widgets.planogram.visible)}
          >
            Planogram
          </button>
          <button type="button" className={dockManagerOpen ? 'active' : ''} onClick={onToggleDockManager}>
            Dock
          </button>
        </div>
        <div className="workspace-side-content workspace-side-content-split">
          {selectors.showOutlinerWidget ? (
            <div
              className={`workspace-right-panel-top ${selectors.showCameraWidget || selectors.showPlanWidget ? '' : 'fill'}`}
              style={selectors.showCameraWidget || selectors.showPlanWidget ? { height: `${outlinerHeightPx}px` } : undefined}
            >
              <WorkspaceWidgetCard
                collapsed={selectors.widgets.outliner.collapsed}
                icon={<IconOutliner className="workspace-widget-head-icon" />}
                label="Scene Outliner"
                pinned={selectors.widgets.outliner.pinned}
                onToggleCollapsed={() => toggleWidgetCollapsed('outliner')}
                onTogglePinned={() => toggleWidgetPinned('outliner')}
                onHide={() => setWidgetVisibility('outliner', false)}
              >
                <WorkspaceSceneOutliner />
              </WorkspaceWidgetCard>
            </div>
          ) : null}
          {selectors.showOutlinerWidget && (selectors.showCameraWidget || selectors.showPlanWidget) && !selectors.widgets.outliner.collapsed ? (
            <div className="workspace-resize-handle horizontal inset" onPointerDown={beginResize('right_outliner')} />
          ) : null}
          {selectors.showCameraWidget || selectors.showPlanWidget ? (
            <div className="workspace-right-panel-bottom workspace-widget-stack">
              {selectors.showCameraWidget ? (
                <WorkspaceWidgetCard
                  collapsed={selectors.widgets.camera.collapsed}
                  icon={<IconCamera className="workspace-widget-head-icon" />}
                  label="Camera Map"
                  pinned={selectors.widgets.camera.pinned}
                  onToggleCollapsed={() => toggleWidgetCollapsed('camera')}
                  onTogglePinned={() => toggleWidgetPinned('camera')}
                  onHide={() => setWidgetVisibility('camera', false)}
                >
                  <Suspense fallback={<div className="hud-widget-loading">Loading camera map...</div>}>
                    <CameraSubspaceMap />
                  </Suspense>
                </WorkspaceWidgetCard>
              ) : null}
              {selectors.showPlanWidget ? (
                <WorkspaceWidgetCard
                  collapsed={selectors.widgets.planogram.collapsed}
                  icon={<IconPlanogram className="workspace-widget-head-icon" />}
                  label="Planogram"
                  pinned={selectors.widgets.planogram.pinned}
                  onToggleCollapsed={() => toggleWidgetCollapsed('planogram')}
                  onTogglePinned={() => toggleWidgetPinned('planogram')}
                  onHide={() => setWidgetVisibility('planogram', false)}
                >
                  <Suspense fallback={<div className="hud-widget-loading">Loading planogram...</div>}>
                    <PlanogramMiniMap />
                  </Suspense>
                </WorkspaceWidgetCard>
              ) : null}
            </div>
          ) : null}
        </div>
      </aside>
    </>
  )
}
