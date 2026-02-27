import { usePlanogramStats, usePlanogramDeferredActions } from '../../hooks/split/usePlanogramStats'

function formatNullable(value: number | string | null): string {
  if (value === null || value === '') return '-'
  return String(value)
}

function formatSceneSource(source: string | null): string {
  if (!source) return '-'
  if (source === 'local') return 'L'
  if (source === 'remote') return 'R'
  return source.slice(0, 1).toUpperCase()
}

export function PlanogramStats() {
  const {
    sceneSource,
    sceneRevision,
    sceneSequence,
    sceneLastEventAt,
    sceneEditEnabled,
    sceneRemoteHoldEnabled,
    sceneDeferredRemoteCount,
    monitoringCamerasCount,
  } = usePlanogramStats()

  const {
    sceneDeferredRemoteCount: deferredCount,
    sceneDeferredApplyPendingConfirm,
    sceneRemoteOverrideAt,
    dispatchFromPlanogram,
  } = usePlanogramDeferredActions()

  const hasInlineActions = deferredCount > 0 || Boolean(sceneRemoteOverrideAt)

  return (
    <>
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
        <span>cams:{monitoringCamerasCount}</span>
      </div>
      {hasInlineActions ? (
        <div className="mini-map-inline-actions">
          {deferredCount > 0 ? (
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
    </>
  )
}
