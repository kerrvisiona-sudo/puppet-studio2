import { useEffect, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'

import { useSceneStore } from '../../../app/state'

export function usePoseControlPanelScene() {
  // Group 5: Scene core state (9 props)
  const {
    sceneError,
    sceneLastEventAt,
    scenePlacements,
    sceneRevision,
    sceneSequence,
    sceneSource,
    sceneRedoDepth,
    sceneId,
    sceneEditEnabled,
  } = useSceneStore(
    useShallow((s) => ({
      sceneError: s.sceneError,
      sceneLastEventAt: s.sceneLastEventAt,
      scenePlacements: s.scenePlacements,
      sceneRevision: s.sceneRevision,
      sceneSequence: s.sceneSequence,
      sceneSource: s.sceneSource,
      sceneRedoDepth: s.sceneRedoDepth,
      sceneId: s.sceneId,
      sceneEditEnabled: s.sceneEditEnabled,
    }))
  )

  // Group 6: Scene specialist metadata (7 props)
  const {
    sceneSpecialistSource,
    sceneSpecialistGeneratedAt,
    sceneSpatialFresh,
    sceneSpatialAgeS,
    sceneSpatialStaleAfterS,
    sceneSpatialStalePolicy,
    sceneUndoDepth,
  } = useSceneStore(
    useShallow((s) => ({
      sceneSpecialistSource: s.sceneSpecialistSource,
      sceneSpecialistGeneratedAt: s.sceneSpecialistGeneratedAt,
      sceneSpatialFresh: s.sceneSpatialFresh,
      sceneSpatialAgeS: s.sceneSpatialAgeS,
      sceneSpatialStaleAfterS: s.sceneSpatialStaleAfterS,
      sceneSpatialStalePolicy: s.sceneSpatialStalePolicy,
      sceneUndoDepth: s.sceneUndoDepth,
    }))
  )

  // Local state that derives from sceneId
  const [sceneDraft, setSceneDraft] = useState(sceneId)

  useEffect(() => {
    setSceneDraft(sceneId)
  }, [sceneId])

  return {
    sceneEditEnabled,
    sceneError,
    sceneId,
    sceneLastEventAt,
    scenePlacements,
    sceneRedoDepth,
    sceneRevision,
    sceneSequence,
    sceneSource,
    sceneSpecialistGeneratedAt,
    sceneSpecialistSource,
    sceneSpatialAgeS,
    sceneSpatialFresh,
    sceneSpatialStaleAfterS,
    sceneSpatialStalePolicy,
    sceneUndoDepth,
    sceneDraft,
    setSceneDraft,
  }
}
