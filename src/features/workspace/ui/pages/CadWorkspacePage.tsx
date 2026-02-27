import { lazy, Suspense, useMemo, useState } from 'react'

import type { WorkspaceWidgetId } from '../../../../core/workspace-shell'
import {
  createAppCommandDispatcher,
  IconCamera,
  IconOutliner,
  IconPlanogram,
  IconSliders,
} from '../../../../shared/ui'
import { STUDIO_SHORTCUTS } from '../../../../shared/shortcuts'
import { useWorkspaceSelectors, useResizePanels } from '../../hooks'
import { buildWorkspaceQuickActions } from '../../model'
import {
  WORKSPACE_COMMAND_PALETTE_EVENT,
  WorkspaceCommandPalette,
} from '../components/WorkspaceCommandPalette'
import { WorkspaceDockManager } from '../components/WorkspaceDockManager'
import { WorkspaceHeaderBar } from '../components/WorkspaceHeaderBar'
import { WorkspaceSceneOutliner } from '../components/WorkspaceSceneOutliner'
import { WorkspaceStatusBar } from '../components/WorkspaceStatusBar'
import { WorkspaceToolrail } from '../components/WorkspaceToolrail'
import { WorkspaceViewportShell } from '../components/WorkspaceViewportShell'
import { WorkspaceWidgetCard } from '../components/WorkspaceWidgetCard'

const PoseControlPanel = lazy(() =>
  import('../../../pose/ui/PoseControlPanel').then((module) => ({ default: module.PoseControlPanel })),
)
const CameraSubspaceMap = lazy(() =>
  import('../../../camera/ui/CameraSubspaceMap').then((module) => ({ default: module.CameraSubspaceMap })),
)
const PlanogramMiniMap = lazy(() =>
  import('../../../planogram/ui/PlanogramMiniMap').then((module) => ({ default: module.PlanogramMiniMap })),
)
const SceneEventTerminal = lazy(() =>
  import('../../../terminal/ui/SceneEventTerminal').then((module) => ({ default: module.SceneEventTerminal })),
)

export function CadWorkspacePage() {
  const selectors = useWorkspaceSelectors()
  const { beginResize } = useResizePanels({
    leftPanelSizePx: selectors.leftPanelSizePx,
    rightPanelSizePx: selectors.rightPanelSizePx,
    rightPanelOutlinerHeightPx: selectors.rightPanelOutlinerHeightPx,
    terminalHeightPx: selectors.terminalHeightPx,
    setLeftPanelSize: selectors.setLeftPanelSize,
    setRightPanelSize: selectors.setRightPanelSize,
    setRightPanelOutlinerHeight: selectors.setRightPanelOutlinerHeight,
    setTerminalHeight: selectors.setTerminalHeight,
  })

  const [dockManagerOpen, setDockManagerOpen] = useState(false)
  const dispatchFromWorkspace = createAppCommandDispatcher('ui.workspace_shell')

  const quickActions = useMemo(
    () =>
      buildWorkspaceQuickActions(
        {
          activeTool: selectors.activeTool,
          leftPanelOpen: selectors.leftPanelOpen,
          projectionMode: selectors.projectionMode,
          rightPanelOpen: selectors.rightPanelOpen,
          sceneEditEnabled: selectors.sceneEditEnabled,
          sceneEventTerminalOpen: selectors.sceneEventTerminalOpen,
          sceneRemoteHoldEnabled: selectors.sceneRemoteHoldEnabled,
          selectedPlacementId: selectors.selectedPlacementId,
          showDimensions: selectors.showDimensions,
          widgets: selectors.widgets,
        },
        dispatchFromWorkspace,
      ),
    [
      selectors.activeTool,
      selectors.leftPanelOpen,
      selectors.projectionMode,
      selectors.rightPanelOpen,
      selectors.sceneEditEnabled,
      selectors.sceneEventTerminalOpen,
      selectors.sceneRemoteHoldEnabled,
      selectors.selectedPlacementId,
      selectors.showDimensions,
      selectors.widgets,
      dispatchFromWorkspace,
    ],
  )

  const leftPanelWidthPx = selectors.widgets.properties.collapsed ? 220 : selectors.leftPanelSizePx
  const anyRightWidgetVisible = selectors.showOutlinerWidget || selectors.showCameraWidget || selectors.showPlanWidget
  const rightPanelWidthPx = selectors.widgets.outliner.collapsed ? Math.max(280, selectors.rightPanelSizePx - 40) : selectors.rightPanelSizePx
  const outlinerHeightPx = selectors.widgets.outliner.collapsed ? 36 : selectors.rightPanelOutlinerHeightPx
  const canSnapSelection = selectors.sceneEditEnabled && Boolean(selectors.selectedPlacementId)

  const setWidgetVisibilityFromWorkspace = (widget: WorkspaceWidgetId, visible: boolean) => {
    dispatchFromWorkspace({ kind: 'set_workspace_widget_visible', visible, widget })
  }

  const toggleWidgetCollapsedFromWorkspace = (widget: WorkspaceWidgetId) => {
    dispatchFromWorkspace({ kind: 'toggle_workspace_widget_collapsed', widget })
  }

  const toggleWidgetPinnedFromWorkspace = (widget: WorkspaceWidgetId) => {
    dispatchFromWorkspace({ kind: 'toggle_workspace_widget_pinned', widget })
  }

  const openWorkspaceCommandPalette = () => {
    window.dispatchEvent(
      new CustomEvent(WORKSPACE_COMMAND_PALETTE_EVENT, {
        detail: { open: true },
      }),
    )
  }

  return (
    <div className={`cad-workspace ${selectors.sceneEventTerminalOpen ? 'terminal-open' : 'terminal-closed'}`}>
      <WorkspaceHeaderBar
        activeCapabilities={selectors.activeCapabilities}
        bridgeStatus={selectors.bridgeStatus}
        cameraView={selectors.cameraView}
        dockManagerOpen={dockManagerOpen}
        leftPanelOpen={selectors.leftPanelOpen}
        onApplyLayoutPreset={(preset) => dispatchFromWorkspace({ kind: 'apply_workspace_layout_preset', preset })}
        onOpenCommandPalette={openWorkspaceCommandPalette}
        onSetCameraView={(view) => dispatchFromWorkspace({ kind: 'set_camera_view', view })}
        onSetProjectionMode={(mode) => dispatchFromWorkspace({ kind: 'set_projection_mode', mode })}
        onToggleDockManager={() => setDockManagerOpen((open) => !open)}
        onToggleLeftPanel={() => dispatchFromWorkspace({ kind: 'toggle_workspace_left_panel' })}
        onToggleRightPanel={() => dispatchFromWorkspace({ kind: 'toggle_workspace_right_panel' })}
        onToggleSceneEdit={() => dispatchFromWorkspace({ kind: 'toggle_scene_edit' })}
        onToggleSceneRemoteHold={() => dispatchFromWorkspace({ kind: 'toggle_scene_remote_hold' })}
        onToggleTerminal={() => dispatchFromWorkspace({ kind: 'toggle_scene_event_terminal' })}
        onRestoreLayoutDefaults={() => dispatchFromWorkspace({ kind: 'restore_workspace_layout_defaults' })}
        projectionMode={selectors.projectionMode}
        rightPanelOpen={selectors.rightPanelOpen}
        sceneEditEnabled={selectors.sceneEditEnabled}
        sceneEventTerminalOpen={selectors.sceneEventTerminalOpen}
        sceneId={selectors.sceneId}
        sceneRemoteHoldEnabled={selectors.sceneRemoteHoldEnabled}
      />
      {dockManagerOpen ? (
        <WorkspaceDockManager
          onClose={() => setDockManagerOpen(false)}
          onSetWidgetVisible={setWidgetVisibilityFromWorkspace}
          onToggleWidgetCollapsed={toggleWidgetCollapsedFromWorkspace}
          onToggleWidgetPinned={toggleWidgetPinnedFromWorkspace}
          widgets={selectors.widgets}
        />
      ) : null}

      <main className="cad-workspace-main">
        {selectors.showPropertiesWidget ? (
          <aside className="workspace-side workspace-side-left" style={{ width: `${leftPanelWidthPx}px` }}>
            <div className="workspace-side-content workspace-side-content-tight">
              <WorkspaceWidgetCard
                collapsed={selectors.widgets.properties.collapsed}
                icon={<IconSliders className="workspace-widget-head-icon" />}
                label="Properties"
                pinned={selectors.widgets.properties.pinned}
                onToggleCollapsed={() => toggleWidgetCollapsedFromWorkspace('properties')}
                onTogglePinned={() => toggleWidgetPinnedFromWorkspace('properties')}
                onHide={() => setWidgetVisibilityFromWorkspace('properties', false)}
              >
                <Suspense fallback={<div className="panel-shell-loading">Loading controls...</div>}>
                  <PoseControlPanel />
                </Suspense>
              </WorkspaceWidgetCard>
            </div>
          </aside>
        ) : null}
        {selectors.showPropertiesWidget ? <div className="workspace-resize-handle vertical" onPointerDown={beginResize('left')} /> : null}

        <section className="workspace-center">
          <WorkspaceToolrail
            activeTool={selectors.activeTool}
            cameraView={selectors.cameraView}
            canSnapSelection={canSnapSelection}
            dispatch={dispatchFromWorkspace}
            projectionMode={selectors.projectionMode}
            showDimensions={selectors.showDimensions}
          />
          <WorkspaceViewportShell
            activeTool={selectors.activeTool}
            cameraQuaternion={selectors.viewportCameraQuaternion}
            cameraView={selectors.cameraView}
            detectionCount={selectors.detectionCount}
            dispatch={dispatchFromWorkspace}
            monitoringCameraCount={selectors.monitoringCameraCount}
            projectionMode={selectors.projectionMode}
            sceneId={selectors.sceneId}
            scenePlacementsCount={selectors.scenePlacementsCount}
          />
        </section>

        {selectors.rightPanelOpen && anyRightWidgetVisible ? <div className="workspace-resize-handle vertical" onPointerDown={beginResize('right')} /> : null}
        {selectors.rightPanelOpen && anyRightWidgetVisible ? (
          <aside className="workspace-side workspace-side-right" style={{ width: `${rightPanelWidthPx}px` }}>
            <div className="workspace-side-head workspace-side-head-wrap">
              <button
                type="button"
                className={selectors.showOutlinerWidget ? 'active' : ''}
                onClick={() => setWidgetVisibilityFromWorkspace('outliner', !selectors.widgets.outliner.visible)}
              >
                Outliner
              </button>
              <button
                type="button"
                className={selectors.showCameraWidget ? 'active' : ''}
                onClick={() => setWidgetVisibilityFromWorkspace('camera', !selectors.widgets.camera.visible)}
              >
                Camera
              </button>
              <button
                type="button"
                className={selectors.showPlanWidget ? 'active' : ''}
                onClick={() => setWidgetVisibilityFromWorkspace('planogram', !selectors.widgets.planogram.visible)}
              >
                Planogram
              </button>
              <button type="button" className={dockManagerOpen ? 'active' : ''} onClick={() => setDockManagerOpen((open) => !open)}>
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
                    onToggleCollapsed={() => toggleWidgetCollapsedFromWorkspace('outliner')}
                    onTogglePinned={() => toggleWidgetPinnedFromWorkspace('outliner')}
                    onHide={() => setWidgetVisibilityFromWorkspace('outliner', false)}
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
                      onToggleCollapsed={() => toggleWidgetCollapsedFromWorkspace('camera')}
                      onTogglePinned={() => toggleWidgetPinnedFromWorkspace('camera')}
                      onHide={() => setWidgetVisibilityFromWorkspace('camera', false)}
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
                      onToggleCollapsed={() => toggleWidgetCollapsedFromWorkspace('planogram')}
                      onTogglePinned={() => toggleWidgetPinnedFromWorkspace('planogram')}
                      onHide={() => setWidgetVisibilityFromWorkspace('planogram', false)}
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
        ) : null}
      </main>

      <WorkspaceStatusBar
        activeToolMode={selectors.activeTool}
        bridgeUrl={selectors.bridgeUrl}
        cameraView={selectors.cameraView}
        projectionMode={selectors.projectionMode}
        detectionCount={selectors.detectionCount}
        monitoringCameraCount={selectors.monitoringCameraCount}
        placementCount={selectors.scenePlacementsCount}
        sceneEditEnabled={selectors.sceneEditEnabled}
        sceneEventTerminalOpen={selectors.sceneEventTerminalOpen}
        sceneId={selectors.sceneId}
        sceneRemoteHoldEnabled={selectors.sceneRemoteHoldEnabled}
        sceneRevision={selectors.sceneRevision}
        sceneSequence={selectors.sceneSequence}
      />

      <div className="workspace-terminal-strip" style={{ height: selectors.sceneEventTerminalOpen ? `${selectors.terminalHeightPx + 8}px` : '34px' }}>
        {selectors.sceneEventTerminalOpen ? <div className="workspace-resize-handle horizontal" onPointerDown={beginResize('terminal')} /> : null}
        {selectors.sceneEventTerminalOpen ? (
          <Suspense fallback={<div className="terminal-shell-loading">Loading terminal...</div>}>
            <SceneEventTerminal layout="docked" />
          </Suspense>
        ) : (
          <button
            type="button"
            className="workspace-terminal-collapsed-bar"
            onClick={() => dispatchFromWorkspace({ kind: 'toggle_scene_event_terminal' })}
          >
            <span>Event Terminal</span>
            <span>events:{selectors.sceneEventLogCount}</span>
            <span>{STUDIO_SHORTCUTS.terminal.toggle}</span>
          </button>
        )}
      </div>

      <WorkspaceCommandPalette actions={quickActions} dispatch={dispatchFromWorkspace} />
    </div>
  )
}
