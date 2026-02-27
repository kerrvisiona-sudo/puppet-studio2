import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useSceneStore } from '../../../../app/state'
import { selectPlacementLegendItems } from '../../../../core/scene-domain'

export function usePlanogramLegend() {
  const { scenePlacements } = useSceneStore(
    useShallow((s) => ({
      scenePlacements: s.scenePlacements,
    }))
  )

  const legendItems = useMemo(() => selectPlacementLegendItems(scenePlacements), [scenePlacements])

  return { legendItems }
}
