import { usePlanogramCanvasData } from '../../hooks/split/usePlanogramCanvasData'
import { usePlanogramDeferredActions } from '../../hooks/split/usePlanogramStats'
import { usePlanogramCameraSelector } from '../../hooks/split/usePlanogramCameraSelector'

export function PlanogramInfo() {
  const { gridInfo, deferredConfig, miniMapScale, sceneRoom } = usePlanogramCanvasData()
  const { sceneRemoteOverrideAt, sceneRemoteOverrideKind } = usePlanogramDeferredActions()
  const { selectedMonitoringCamera } = usePlanogramCameraSelector()

  return (
    <details className="mini-map-info">
      <summary>Info</summary>
      <div className="mini-map-info-body">
        <p className="mini-map-meta">
          grilla menor/mayor: {gridInfo.gridMinorStepM}m / {gridInfo.gridMajorStepM}m, minimapa {miniMapScale.toFixed(1)} px/m
        </p>
        <p className="mini-map-meta">top-ortho target: {gridInfo.topViewTargetPxPerM} px/m</p>
        <p className="mini-map-meta">constraints: {gridInfo.constraintZonesCount}</p>
        <p className="mini-map-meta">
          deferred mode: {deferredConfig.mode}, queue limit: {deferredConfig.queueLimit}
        </p>
        <p className="mini-map-meta">
          hold release auto/confirm: {deferredConfig.autoApplyOnRelease ? 'on' : 'off'} /{' '}
          {deferredConfig.requireConfirmOnRelease ? 'on' : 'off'}
        </p>
        <p className="mini-map-meta">active camera: {selectedMonitoringCamera?.label ?? selectedMonitoringCamera?.id ?? '-'}</p>
        {sceneRemoteOverrideAt ? (
          <p className="mini-map-meta">
            remote overwrite: {sceneRemoteOverrideKind ?? 'scene'} @ {sceneRemoteOverrideAt}
          </p>
        ) : null}
      </div>
    </details>
  )
}
