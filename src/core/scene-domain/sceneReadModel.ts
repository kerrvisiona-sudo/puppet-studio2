import { ASSET_CATALOG, getPlacementTargetSizeM } from '../../core/planogram-domain'
import type { MonitoringCameraDefinition, Placement } from '../../core/planogram-domain'

export type SelectedPlacementView = {
  asset: (typeof ASSET_CATALOG)[keyof typeof ASSET_CATALOG] | null
  assetId: string | null
  placement: Placement | null
  size: ReturnType<typeof getPlacementTargetSizeM> | null
}

export function selectMonitoringCamera(
  cameras: MonitoringCameraDefinition[],
  selectedMonitoringCameraId: string | null,
): MonitoringCameraDefinition | null {
  if (selectedMonitoringCameraId) {
    const byId = cameras.find((camera) => camera.id === selectedMonitoringCameraId)
    if (byId) return byId
  }
  return cameras[0] ?? null
}

export function selectPlacementById(placements: Placement[], selectedPlacementId: string | null): Placement | null {
  if (!selectedPlacementId) return null
  return placements.find((placement) => placement.id === selectedPlacementId) ?? null
}

export function selectPlacementLegendItems(placements: Placement[]): Array<(typeof ASSET_CATALOG)[keyof typeof ASSET_CATALOG]> {
  const ids = Array.from(new Set(placements.map((placement) => placement.assetId)))
  return ids.map((id) => ASSET_CATALOG[id])
}

export function selectSelectedPlacementView(
  placements: Placement[],
  selectedPlacementId: string | null,
): SelectedPlacementView {
  const placement = selectPlacementById(placements, selectedPlacementId)
  if (!placement) {
    return {
      asset: null,
      assetId: null,
      placement: null,
      size: null,
    }
  }
  return {
    asset: ASSET_CATALOG[placement.assetId],
    assetId: placement.assetId,
    placement,
    size: getPlacementTargetSizeM(placement),
  }
}
