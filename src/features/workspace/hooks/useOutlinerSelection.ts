import { useMemo } from 'react'
import { selectSelectedPlacementView } from '../../../core/scene-domain'
import type { Placement } from '../../../core/planogram-domain'

type UseOutlinerSelectionParams = {
  scenePlacements: Placement[]
  selectedPlacementId: string | null
}

export function useOutlinerSelection({ scenePlacements, selectedPlacementId }: UseOutlinerSelectionParams) {
  const selectedPlacementView = useMemo(
    () => selectSelectedPlacementView(scenePlacements, selectedPlacementId),
    [scenePlacements, selectedPlacementId],
  )

  return {
    selectedPlacement: selectedPlacementView.placement,
    selectedPlacementAsset: selectedPlacementView.asset,
    selectedPlacementSize: selectedPlacementView.size,
  }
}
