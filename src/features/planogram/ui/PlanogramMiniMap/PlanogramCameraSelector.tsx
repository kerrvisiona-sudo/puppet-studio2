import { usePlanogramCameraSelector } from '../../hooks/split/usePlanogramCameraSelector'

export function PlanogramCameraSelector() {
  const { monitoringCameras, selectedMonitoringCamera, dispatchFromPlanogram } = usePlanogramCameraSelector()

  if (monitoringCameras.length === 0) return null

  return (
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
  )
}
