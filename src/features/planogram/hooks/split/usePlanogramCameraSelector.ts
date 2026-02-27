import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useSceneStore, useViewportStore } from '../../../../app/state'
import { createAppCommandDispatcher } from '../../../../shared/ui'
import { selectMonitoringCamera } from '../../../../core/scene-domain'

export function usePlanogramCameraSelector() {
  const { monitoringCameras } = useSceneStore(
    useShallow((s) => ({
      monitoringCameras: s.monitoringCameras,
    }))
  )

  const { selectedMonitoringCameraId } = useViewportStore(
    useShallow((s) => ({
      selectedMonitoringCameraId: s.selectedMonitoringCameraId,
    }))
  )

  const selectedMonitoringCamera = useMemo(
    () => selectMonitoringCamera(monitoringCameras, selectedMonitoringCameraId),
    [monitoringCameras, selectedMonitoringCameraId]
  )

  const dispatchFromPlanogram = createAppCommandDispatcher('ui.planogram')

  return {
    monitoringCameras,
    selectedMonitoringCamera,
    dispatchFromPlanogram,
  }
}
