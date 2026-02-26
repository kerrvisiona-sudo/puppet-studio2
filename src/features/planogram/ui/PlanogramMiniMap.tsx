import { useMemo, useRef } from 'react'

import {
  GRID_MAJOR_STEP_M,
  GRID_MINOR_STEP_M,
  TOP_VIEW_TARGET_PX_PER_M,
} from '../../../core/planogram-domain'
import {
  runtimeConfig,
  SCENE_COMMAND_MOVE_STEP_M,
  SCENE_COMMAND_ROTATE_STEP_DEG,
  SCENE_COMMAND_SNAP_STEP_M,
} from '../../../core/config'
import { usePlanogramMiniMapCanvas, usePlanogramMiniMapState } from '../hooks'
import { formatSceneSource, pointInPolygon } from '../model'

function formatNullable(value: number | string | null): string {
  if (value === null || value === '') return '-'
  return String(value)
}

export function PlanogramMiniMap() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const gridCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const {
    avatarPlanPositionM,
    avatarRotationDeg,
    avatarTrackId,
    cameraView,
    dispatchFromPlanogram,
    legendItems,
    miniMapScale,
    monitoringCameras,
    placementHitPolygons,
    projectionMode,
    sceneDeferredApplyPendingConfirm,
    sceneDeferredRemoteCount,
    sceneDeferredRemoteLastAt,
    sceneDeferredRemoteLastKind,
    sceneEditEnabled,
    sceneError,
    sceneLastEventAt,
    scenePlacements,
    sceneRedoDepth,
    sceneRemoteHoldEnabled,
    sceneRemoteOverrideAt,
    sceneRemoteOverrideKind,
    sceneRevision,
    sceneRoom,
    sceneSequence,
    sceneSource,
    sceneUndoDepth,
    selectedMonitoringCamera,
    selectedPlacement,
    selectedPlacementAssetId,
    selectedAsset,
    selectedSize,
    showDimensions,
    topQuarterTurns,
  } = usePlanogramMiniMapState()
  const hasInlineActions = sceneDeferredRemoteCount > 0 || Boolean(sceneRemoteOverrideAt)

  const avatar = useMemo(
    () => ({
      planPositionM: avatarPlanPositionM,
      rotationDeg: avatarRotationDeg,
      trackId: avatarTrackId,
    }),
    [avatarPlanPositionM, avatarRotationDeg, avatarTrackId],
  )

  usePlanogramMiniMapCanvas(canvasRef, gridCanvasRef, {
    avatar,
    constraints: runtimeConfig.sceneConstraintZones,
    scenePlacements,
    sceneRoom,
    selectedPlacementAssetId,
    selectedPlacementId: selectedPlacement?.id ?? null,
    showDimensions,
    topQuarterTurns,
  })

  return (
    <div className="mini-map">
      <div className="mini-map-head">
        <h3>Planograma</h3>
        <div className="mini-map-actions">
          <button
            type="button"
            className={cameraView === 'iso' ? 'active' : ''}
            onClick={() => dispatchFromPlanogram({ kind: 'set_camera_view', view: 'iso' })}
          >
            Iso View
          </button>
          <button
            type="button"
            className={cameraView === 'top' ? 'active' : ''}
            onClick={() => dispatchFromPlanogram({ kind: 'set_camera_view', view: 'top' })}
          >
            Top
          </button>
          <button
            type="button"
            className={cameraView === 'sensor' ? 'active' : ''}
            onClick={() => dispatchFromPlanogram({ kind: 'set_camera_view', view: 'sensor' })}
            disabled={monitoringCameras.length === 0}
          >
            Cam
          </button>
          <button type="button" onClick={() => dispatchFromPlanogram({ kind: 'rotate_top_view', direction: -1 })}>
            ↺
          </button>
          <button type="button" onClick={() => dispatchFromPlanogram({ kind: 'rotate_top_view', direction: 1 })}>
            ↻
          </button>
          <button
            type="button"
            className={projectionMode === 'orthographic' ? 'active' : ''}
            onClick={() => dispatchFromPlanogram({ kind: 'set_projection_mode', mode: 'orthographic' })}
          >
            Ortho
          </button>
          <button
            type="button"
            className={projectionMode === 'perspective' ? 'active' : ''}
            onClick={() => dispatchFromPlanogram({ kind: 'set_projection_mode', mode: 'perspective' })}
          >
            Persp
          </button>
          <button
            type="button"
            className={sceneEditEnabled ? 'active' : ''}
            onClick={() => dispatchFromPlanogram({ kind: 'toggle_scene_edit' })}
          >
            {sceneEditEnabled ? 'Edit on' : 'Edit off'}
          </button>
          <button
            type="button"
            className={sceneRemoteHoldEnabled ? 'active' : ''}
            onClick={() => dispatchFromPlanogram({ kind: 'toggle_scene_remote_hold' })}
          >
            {sceneRemoteHoldEnabled ? 'Hold remote' : 'Accept remote'}
          </button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        onPointerDown={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          const pointX = event.clientX - rect.left
          const pointY = event.clientY - rect.top
          for (let index = placementHitPolygons.length - 1; index >= 0; index -= 1) {
            if (pointInPolygon(pointX, pointY, placementHitPolygons[index].points)) {
              dispatchFromPlanogram({
                kind: 'set_selected_placement',
                placementId: placementHitPolygons[index].placementId,
              })
              return
            }
          }
          dispatchFromPlanogram({ kind: 'set_selected_placement', placementId: null })
        }}
      />

      <div className="mini-map-inline-stats">
        <span>source:{formatSceneSource(sceneSource)}</span>
        <span>rev:{formatNullable(sceneRevision)}</span>
        <span>seq:{formatNullable(sceneSequence)}</span>
        <span>last:{sceneLastEventAt ?? '-'}</span>
      </div>
      <div className="mini-map-inline-stats">
        <span>edit:{sceneEditEnabled ? 'on' : 'off'}</span>
        <span>hold:{sceneRemoteHoldEnabled ? 'on' : 'off'}</span>
        <span>deferred:{sceneDeferredRemoteCount}</span>
        <span>cams:{monitoringCameras.length}</span>
      </div>
      {hasInlineActions ? (
        <div className="mini-map-inline-actions">
          {sceneDeferredRemoteCount > 0 ? (
            <>
              <button
                type="button"
                className="mini-inline-btn"
                onClick={() => dispatchFromPlanogram({ kind: 'apply_deferred_scene_remote' })}
              >
                {sceneDeferredApplyPendingConfirm ? 'confirm + apply deferred' : 'apply deferred'}
              </button>
              <button
                type="button"
                className="mini-inline-btn"
                onClick={() => dispatchFromPlanogram({ kind: 'clear_scene_deferred_remote' })}
              >
                clear deferred
              </button>
            </>
          ) : null}
          {sceneRemoteOverrideAt ? (
            <button
              type="button"
              className="mini-inline-btn"
              onClick={() => dispatchFromPlanogram({ kind: 'clear_scene_remote_override' })}
            >
              clear overwrite flag
            </button>
          ) : null}
        </div>
      ) : null}
      <details className="mini-map-info">
        <summary>Info</summary>
        <div className="mini-map-info-body">
          <p className="mini-map-meta">
            grilla menor/mayor: {GRID_MINOR_STEP_M}m / {GRID_MAJOR_STEP_M}m, minimapa {miniMapScale.toFixed(1)} px/m
          </p>
          <p className="mini-map-meta">top-ortho target: {TOP_VIEW_TARGET_PX_PER_M} px/m</p>
          <p className="mini-map-meta">constraints: {runtimeConfig.sceneConstraintZones.length}</p>
          <p className="mini-map-meta">
            deferred mode: {runtimeConfig.sceneDeferredApplyMode}, queue limit: {runtimeConfig.sceneDeferredQueueLimit}
          </p>
          <p className="mini-map-meta">
            hold release auto/confirm: {runtimeConfig.sceneDeferredAutoApplyOnRelease ? 'on' : 'off'} /{' '}
            {runtimeConfig.sceneDeferredRequireConfirmOnRelease ? 'on' : 'off'}
          </p>
          <p className="mini-map-meta">
            deferred latest: {sceneDeferredRemoteLastKind ?? 'scene'} @ {sceneDeferredRemoteLastAt ?? '-'}
          </p>
          <p className="mini-map-meta">
            deferred confirm pending: {sceneDeferredApplyPendingConfirm ? 'yes' : 'no'}
          </p>
          <p className="mini-map-meta">
            remote overwrite: {sceneRemoteOverrideAt ? `${sceneRemoteOverrideKind ?? 'scene'} @ ${sceneRemoteOverrideAt}` : '-'}
          </p>
          <p className="mini-map-meta">
            active camera: {selectedMonitoringCamera?.label ?? selectedMonitoringCamera?.id ?? '-'}
          </p>
        </div>
      </details>
      {monitoringCameras.length > 0 ? (
        <label className="mini-map-select-row">
          <span>Cam</span>
          <select
            value={selectedMonitoringCamera?.id ?? ''}
            onChange={(event) =>
              dispatchFromPlanogram({
                kind: 'set_selected_monitoring_camera',
                cameraId: event.currentTarget.value || null,
              })
            }
          >
            {monitoringCameras.map((camera) => (
              <option key={camera.id} value={camera.id}>
                {camera.label ?? camera.id}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div className="placement-tools">
        <div className="placement-tools-head">
          <p className="placement-selection">
            {selectedPlacement && selectedAsset && selectedSize
              ? `${selectedAsset.label} • x:${selectedPlacement.planPositionM[0].toFixed(2)} z:${selectedPlacement.planPositionM[1].toFixed(2)} • rot:${(
                  selectedPlacement.rotationDeg ?? 0
                ).toFixed(0)}° • ${selectedSize.width.toFixed(2)}x${selectedSize.depth.toFixed(2)}x${selectedSize.height.toFixed(2)}m${
                  selectedPlacement.trackId ? ` • track:${selectedPlacement.trackId}` : ''
                }${selectedPlacement.objectId ? ` • object:${selectedPlacement.objectId}` : ''}`
              : 'Selecciona un mueble en el minimapa'}
          </p>
          <button
            type="button"
            className={showDimensions ? 'active' : ''}
            onClick={() => dispatchFromPlanogram({ kind: 'set_show_dimensions', show: !showDimensions })}
          >
            Cotas
          </button>
        </div>
        <div className="placement-command-grid">
          <button
            type="button"
            disabled={!sceneEditEnabled || !selectedPlacement}
            onClick={() =>
              dispatchFromPlanogram({
                kind: 'run_scene_command',
                command: { kind: 'move_selected_by', deltaM: [0, SCENE_COMMAND_MOVE_STEP_M] },
              })
            }
          >
            ↑
          </button>
          <button
            type="button"
            disabled={!sceneEditEnabled || !selectedPlacement}
            onClick={() =>
              dispatchFromPlanogram({
                kind: 'run_scene_command',
                command: { kind: 'move_selected_by', deltaM: [-SCENE_COMMAND_MOVE_STEP_M, 0] },
              })
            }
          >
            ←
          </button>
          <button
            type="button"
            disabled={!sceneEditEnabled || !selectedPlacement}
            onClick={() =>
              dispatchFromPlanogram({
                kind: 'run_scene_command',
                command: { kind: 'move_selected_by', deltaM: [SCENE_COMMAND_MOVE_STEP_M, 0] },
              })
            }
          >
            →
          </button>
          <button
            type="button"
            disabled={!sceneEditEnabled || !selectedPlacement}
            onClick={() =>
              dispatchFromPlanogram({
                kind: 'run_scene_command',
                command: { kind: 'move_selected_by', deltaM: [0, -SCENE_COMMAND_MOVE_STEP_M] },
              })
            }
          >
            ↓
          </button>
          <button
            type="button"
            disabled={!sceneEditEnabled || !selectedPlacement}
            onClick={() =>
              dispatchFromPlanogram({
                kind: 'run_scene_command',
                command: { kind: 'rotate_selected_by', deltaDeg: -SCENE_COMMAND_ROTATE_STEP_DEG },
              })
            }
          >
            ⟲ 15°
          </button>
          <button
            type="button"
            disabled={!sceneEditEnabled || !selectedPlacement}
            onClick={() =>
              dispatchFromPlanogram({
                kind: 'run_scene_command',
                command: { kind: 'rotate_selected_by', deltaDeg: SCENE_COMMAND_ROTATE_STEP_DEG },
              })
            }
          >
            ⟳ 15°
          </button>
          <button
            type="button"
            disabled={!sceneEditEnabled || !selectedPlacement}
            onClick={() =>
              dispatchFromPlanogram({
                kind: 'run_scene_command',
                command: { kind: 'snap_selected_to_grid', stepM: SCENE_COMMAND_SNAP_STEP_M },
              })
            }
          >
            Snap 5cm
          </button>
          <button
            type="button"
            disabled={!sceneEditEnabled || sceneUndoDepth <= 0}
            onClick={() => dispatchFromPlanogram({ kind: 'undo_scene_edit' })}
          >
            Undo ({sceneUndoDepth})
          </button>
          <button
            type="button"
            disabled={!sceneEditEnabled || sceneRedoDepth <= 0}
            onClick={() => dispatchFromPlanogram({ kind: 'redo_scene_edit' })}
          >
            Redo ({sceneRedoDepth})
          </button>
        </div>
        <p className="placement-grid-step">
          Comandos locales: mover ±{SCENE_COMMAND_MOVE_STEP_M.toFixed(2)}m, rotar ±{SCENE_COMMAND_ROTATE_STEP_DEG}°, snap{' '}
          {SCENE_COMMAND_SNAP_STEP_M.toFixed(2)}m.
        </p>
        <p className="placement-grid-step">
          Atajos: WASD mover, Q/E rotar, Ctrl/Cmd+Z undo, Ctrl/Cmd+Y redo. Shift acelera pasos.
        </p>
        <p className="placement-grid-step">
          Restricciones: zonas sombreadas bloquean solape del asset seleccionado.
        </p>
        <p className="placement-grid-step">
          Publicacion local→bridge: {runtimeConfig.publishLocalSceneCommands ? 'on' : 'off'}.
        </p>
        <p className="placement-grid-step">La siguiente escena WS puede sobreescribir edicion local.</p>
        {sceneError ? <p className="bridge-error">{sceneError}</p> : null}
      </div>

      <p className="mini-grid-title">Grid Ref (solo ejes + metros)</p>
      <canvas ref={gridCanvasRef} className="mini-grid-canvas" />
      <div className="mini-map-legend">
        {legendItems.map((item) => (
          <span key={item.id} className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: item.miniMapColor }} />
            {item.label}
          </span>
        ))}
        <span className="legend-item">
          <span className="legend-dot avatar-dot" />
          Avatar
        </span>
      </div>
    </div>
  )
}
