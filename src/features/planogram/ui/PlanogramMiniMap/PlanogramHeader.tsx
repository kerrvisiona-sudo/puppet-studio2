import { usePlanogramHeader } from '../../hooks/split/usePlanogramHeader'

export function PlanogramHeader() {
  const {
    cameraView,
    projectionMode,
    sceneEditEnabled,
    sceneRemoteHoldEnabled,
    monitoringCameras,
    dispatchFromPlanogram,
  } = usePlanogramHeader()

  return (
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
        <button
          type="button"
          onClick={() => dispatchFromPlanogram({ kind: 'rotate_top_view', direction: -1 })}
        >
          ↺
        </button>
        <button
          type="button"
          onClick={() => dispatchFromPlanogram({ kind: 'rotate_top_view', direction: 1 })}
        >
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
  )
}
