import { lazy, Suspense, useCallback, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'

import { useSceneStore, useViewportStore, useBridgeStore, useUiStore } from '../../../../app/state'
import { listPoseStoreEngineCapabilities } from '../../../../core/app-commanding'
import type { WorkspaceWidgetId } from '../../../../core/workspace-shell'
import {
  createAppCommandDispatcher,
  IconCamera,
  IconOutliner,
  IconPlanogram,
  IconSliders,
} from '../../../../shared/ui'
import { STUDIO_SHORTCUTS } from '../../../../shared/shortcuts'
import { useWorkspaceHudState } from '../../hooks'
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

type ResizeKind = 'left' | 'right' | 'right_outliner' | 'terminal'

type ResizeStart = {
  kind: ResizeKind
  pointerId: number
  sizePx: number
  x: number
  y: number
}

export function CadWorkspacePage() {
  // Bridge state
  const bridgeStatus = useBridgeStore((state) => state.bridgeStatus)
  const bridgeUrl = useBridgeStore((state) => state.bridgeUrl)
  const sceneRemoteHoldEnabled = useBridgeStore((state) => state.sceneRemoteHoldEnabled)

  // Viewport state
  const cameraView = useViewportStore((state) => state.cameraView)
  const viewportCameraQuaternion = useViewportStore((state) => state.viewportCameraQuaternion)
  const projectionMode = useViewportStore((state) => state.projectionMode)
  const showDimensions = useViewportStore((state) => state.showDimensions)

  // Scene state
  const monitoringCameraCount = useSceneStore((state) => state.monitoringCameras.length)
  const sceneEditEnabled = useSceneStore((state) => state.sceneEditEnabled)
  const sceneId = useSceneStore((state) => state.sceneId)
  const scenePlacementsCount = useSceneStore((state) => state.scenePlacements.length)
  const sceneRevision = useSceneStore((state) => state.sceneRevision)
  const sceneSequence = useSceneStore((state) => state.sceneSequence)
  const selectedPlacementId = useSceneStore((state) => state.selectedPlacementId)
  const detectionCount = useSceneStore((state) =>
    state.cameraDetectionOverlays.reduce((total, overlay) => total + overlay.boxes.length, 0),
  )

  // UI state
  const sceneEventTerminalOpen = useUiStore((state) => state.sceneEventTerminalOpen)
  const sceneEventLogCount = useUiStore((state) => state.sceneEventLog.length)
  const activeTool = useUiStore((state) => state.activeToolMode)
  const activeCapabilities = useMemo(
    () => listPoseStoreEngineCapabilities().filter((capability) => capability.enabled).length,
    [sceneEventLogCount],
  )
  const dispatchFromWorkspace = createAppCommandDispatcher('ui.workspace_shell')
  const {
    leftPanelSizePx,
    leftPanelOpen,
    rightPanelSizePx,
    rightPanelOpen,
    rightPanelOutlinerHeightPx,
    showCameraWidget,
    showOutlinerWidget,
    showPropertiesWidget,
    showPlanWidget,
    terminalHeightPx,
    setLeftPanelSize,
    setRightPanelOutlinerHeight,
    setRightPanelSize,
    setTerminalHeight,
    widgets,
  } = useWorkspaceHudState()

  const resizeStartRef = useRef<ResizeStart | null>(null)
  const [dockManagerOpen, setDockManagerOpen] = useState(false)

  const openWorkspaceCommandPalette = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent(WORKSPACE_COMMAND_PALETTE_EVENT, {
        detail: { open: true },
      }),
    )
  }, [])

  const setWidgetVisibilityFromWorkspace = useCallback(
    (widget: WorkspaceWidgetId, visible: boolean) => {
      dispatchFromWorkspace({ kind: 'set_workspace_widget_visible', visible, widget })
    },
    [dispatchFromWorkspace],
  )

  const toggleWidgetCollapsedFromWorkspace = useCallback(
    (widget: WorkspaceWidgetId) => {
      dispatchFromWorkspace({ kind: 'toggle_workspace_widget_collapsed', widget })
    },
    [dispatchFromWorkspace],
  )

  const toggleWidgetPinnedFromWorkspace = useCallback(
    (widget: WorkspaceWidgetId) => {
      dispatchFromWorkspace({ kind: 'toggle_workspace_widget_pinned', widget })
    },
    [dispatchFromWorkspace],
  )

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

  const quickActions = useMemo(
    () =>
      buildWorkspaceQuickActions(
        {
          activeTool,
          leftPanelOpen,
          projectionMode,
          rightPanelOpen,
          sceneEditEnabled,
          sceneEventTerminalOpen,
          sceneRemoteHoldEnabled,
          selectedPlacementId,
          showDimensions,
          widgets,
        },
        dispatchFromWorkspace,
      ),
    [
      activeTool,
      dispatchFromWorkspace,
      leftPanelOpen,
      projectionMode,
      rightPanelOpen,
      sceneEditEnabled,
      sceneEventTerminalOpen,
      sceneRemoteHoldEnabled,
      selectedPlacementId,
      showDimensions,
      widgets,
    ],
  )

  const leftPanelWidthPx = widgets.properties.collapsed ? 220 : leftPanelSizePx
  const anyRightWidgetVisible = showOutlinerWidget || showCameraWidget || showPlanWidget
  const rightPanelWidthPx = widgets.outliner.collapsed ? Math.max(280, rightPanelSizePx - 40) : rightPanelSizePx
  const outlinerHeightPx = widgets.outliner.collapsed ? 36 : rightPanelOutlinerHeightPx
  const canSnapSelection = sceneEditEnabled && Boolean(selectedPlacementId)

  return (
    <div className={`cad-workspace ${sceneEventTerminalOpen ? 'terminal-open' : 'terminal-closed'}`}>
      <WorkspaceHeaderBar
        activeCapabilities={activeCapabilities}
        bridgeStatus={bridgeStatus}
        cameraView={cameraView}
        dockManagerOpen={dockManagerOpen}
        leftPanelOpen={leftPanelOpen}
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
        projectionMode={projectionMode}
        rightPanelOpen={rightPanelOpen}
        sceneEditEnabled={sceneEditEnabled}
        sceneEventTerminalOpen={sceneEventTerminalOpen}
        sceneId={sceneId}
        sceneRemoteHoldEnabled={sceneRemoteHoldEnabled}
      />
      {dockManagerOpen ? (
        <WorkspaceDockManager
          onClose={() => setDockManagerOpen(false)}
          onSetWidgetVisible={setWidgetVisibilityFromWorkspace}
          onToggleWidgetCollapsed={toggleWidgetCollapsedFromWorkspace}
          onToggleWidgetPinned={toggleWidgetPinnedFromWorkspace}
          widgets={widgets}
        />
      ) : null}

      <main className="cad-workspace-main">
        {showPropertiesWidget ? (
          <aside className="workspace-side workspace-side-left" style={{ width: `${leftPanelWidthPx}px` }}>
            <div className="workspace-side-content workspace-side-content-tight">
              <WorkspaceWidgetCard
                collapsed={widgets.properties.collapsed}
                icon={<IconSliders className="workspace-widget-head-icon" />}
                label="Properties"
                pinned={widgets.properties.pinned}
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
        {showPropertiesWidget ? <div className="workspace-resize-handle vertical" onPointerDown={beginResize('left')} /> : null}

        <section className="workspace-center">
          <WorkspaceToolrail
            activeTool={activeTool}
            cameraView={cameraView}
            canSnapSelection={canSnapSelection}
            dispatch={dispatchFromWorkspace}
            projectionMode={projectionMode}
            showDimensions={showDimensions}
          />
          <WorkspaceViewportShell
            activeTool={activeTool}
            cameraQuaternion={viewportCameraQuaternion}
            cameraView={cameraView}
            detectionCount={detectionCount}
            dispatch={dispatchFromWorkspace}
            monitoringCameraCount={monitoringCameraCount}
            projectionMode={projectionMode}
            sceneId={sceneId}
            scenePlacementsCount={scenePlacementsCount}
          />
        </section>

        {rightPanelOpen && anyRightWidgetVisible ? <div className="workspace-resize-handle vertical" onPointerDown={beginResize('right')} /> : null}
        {rightPanelOpen && anyRightWidgetVisible ? (
          <aside className="workspace-side workspace-side-right" style={{ width: `${rightPanelWidthPx}px` }}>
            <div className="workspace-side-head workspace-side-head-wrap">
              <button
                type="button"
                className={showOutlinerWidget ? 'active' : ''}
                onClick={() => setWidgetVisibilityFromWorkspace('outliner', !widgets.outliner.visible)}
              >
                Outliner
              </button>
              <button
                type="button"
                className={showCameraWidget ? 'active' : ''}
                onClick={() => setWidgetVisibilityFromWorkspace('camera', !widgets.camera.visible)}
              >
                Camera
              </button>
              <button
                type="button"
                className={showPlanWidget ? 'active' : ''}
                onClick={() => setWidgetVisibilityFromWorkspace('planogram', !widgets.planogram.visible)}
              >
                Planogram
              </button>
              <button type="button" className={dockManagerOpen ? 'active' : ''} onClick={() => setDockManagerOpen((open) => !open)}>
                Dock
              </button>
            </div>
            <div className="workspace-side-content workspace-side-content-split">
              {showOutlinerWidget ? (
                <div
                  className={`workspace-right-panel-top ${showCameraWidget || showPlanWidget ? '' : 'fill'}`}
                  style={showCameraWidget || showPlanWidget ? { height: `${outlinerHeightPx}px` } : undefined}
                >
                  <WorkspaceWidgetCard
                    collapsed={widgets.outliner.collapsed}
                    icon={<IconOutliner className="workspace-widget-head-icon" />}
                    label="Scene Outliner"
                    pinned={widgets.outliner.pinned}
                    onToggleCollapsed={() => toggleWidgetCollapsedFromWorkspace('outliner')}
                    onTogglePinned={() => toggleWidgetPinnedFromWorkspace('outliner')}
                    onHide={() => setWidgetVisibilityFromWorkspace('outliner', false)}
                  >
                    <WorkspaceSceneOutliner />
                  </WorkspaceWidgetCard>
                </div>
              ) : null}
              {showOutlinerWidget && (showCameraWidget || showPlanWidget) && !widgets.outliner.collapsed ? (
                <div className="workspace-resize-handle horizontal inset" onPointerDown={beginResize('right_outliner')} />
              ) : null}
              {showCameraWidget || showPlanWidget ? (
                <div className="workspace-right-panel-bottom workspace-widget-stack">
                  {showCameraWidget ? (
                    <WorkspaceWidgetCard
                      collapsed={widgets.camera.collapsed}
                      icon={<IconCamera className="workspace-widget-head-icon" />}
                      label="Camera Map"
                      pinned={widgets.camera.pinned}
                      onToggleCollapsed={() => toggleWidgetCollapsedFromWorkspace('camera')}
                      onTogglePinned={() => toggleWidgetPinnedFromWorkspace('camera')}
                      onHide={() => setWidgetVisibilityFromWorkspace('camera', false)}
                    >
                      <Suspense fallback={<div className="hud-widget-loading">Loading camera map...</div>}>
                        <CameraSubspaceMap />
                      </Suspense>
                    </WorkspaceWidgetCard>
                  ) : null}
                  {showPlanWidget ? (
                    <WorkspaceWidgetCard
                      collapsed={widgets.planogram.collapsed}
                      icon={<IconPlanogram className="workspace-widget-head-icon" />}
                      label="Planogram"
                      pinned={widgets.planogram.pinned}
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
        activeToolMode={activeTool}
        bridgeUrl={bridgeUrl}
        cameraView={cameraView}
        projectionMode={projectionMode}
        detectionCount={detectionCount}
        monitoringCameraCount={monitoringCameraCount}
        placementCount={scenePlacementsCount}
        sceneEditEnabled={sceneEditEnabled}
        sceneEventTerminalOpen={sceneEventTerminalOpen}
        sceneId={sceneId}
        sceneRemoteHoldEnabled={sceneRemoteHoldEnabled}
        sceneRevision={sceneRevision}
        sceneSequence={sceneSequence}
      />

      <div className="workspace-terminal-strip" style={{ height: sceneEventTerminalOpen ? `${terminalHeightPx + 8}px` : '34px' }}>
        {sceneEventTerminalOpen ? <div className="workspace-resize-handle horizontal" onPointerDown={beginResize('terminal')} /> : null}
        {sceneEventTerminalOpen ? (
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
            <span>events:{sceneEventLogCount}</span>
            <span>{STUDIO_SHORTCUTS.terminal.toggle}</span>
          </button>
        )}
      </div>

      <WorkspaceCommandPalette actions={quickActions} dispatch={dispatchFromWorkspace} />
    </div>
  )
}
