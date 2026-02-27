import { atom } from 'jotai'
import { sceneAtom, viewportAtom, avatarAtom } from './storeAtoms'
import { undoManager } from '../../core/app-commanding/undoManager'

/**
 * Derived atoms for scene geometry and state
 * Use these when you need computed state that depends on scene + other stores
 */

/** Is there a selected placement? */
export const hasSelectedPlacementAtom = atom((get) => {
  const scene = get(sceneAtom)
  return scene.selectedPlacementId !== null
})

/** Selected placement details */
export const selectedPlacementAtom = atom((get) => {
  const scene = get(sceneAtom)
  const { selectedPlacementId, scenePlacements } = scene

  if (!selectedPlacementId) return null

  return scenePlacements.find((p) => p.id === selectedPlacementId) ?? null
})

/** Scene undo/redo availability */
export const sceneHistoryAvailabilityAtom = atom((get) => {
  const scene = get(sceneAtom)
  const historyState = scene.getUndoRedoDepth()

  return {
    canUndo: scene.sceneEditEnabled && historyState.undoDepth > 0,
    canRedo: scene.sceneEditEnabled && historyState.redoDepth > 0,
    undoDepth: historyState.undoDepth,
    redoDepth: historyState.redoDepth,
  }
})

/** Scene statistics */
export const sceneStatsAtom = atom((get) => {
  const scene = get(sceneAtom)

  return {
    placementCount: scene.scenePlacements.length,
    monitoringCameraCount: scene.monitoringCameras.length,
    hasRoom: scene.sceneRoom !== null,
    revision: scene.sceneRevision,
    sequence: scene.sceneSequence,
  }
})

/** Is scene spatial data fresh? */
export const isSceneSpatialFreshAtom = atom((get) => {
  const scene = get(sceneAtom)
  return scene.sceneSpatialFresh
})

/** Scene spatial staleness info */
export const sceneSpatialStalenessAtom = atom((get) => {
  const scene = get(sceneAtom)

  return {
    isFresh: scene.sceneSpatialFresh,
    ageSeconds: scene.sceneSpatialAgeS,
    staleAfterSeconds: scene.sceneSpatialStaleAfterS,
    stalePolicy: scene.sceneSpatialStalePolicy,
    isStale: !scene.sceneSpatialFresh &&
      scene.sceneSpatialAgeS !== null &&
      scene.sceneSpatialStaleAfterS !== null &&
      scene.sceneSpatialAgeS > scene.sceneSpatialStaleAfterS,
  }
})

/** Avatar position in scene context */
export const avatarInSceneAtom = atom((get) => {
  const avatar = get(avatarAtom)
  const scene = get(sceneAtom)

  return {
    position: avatar.avatarPlanPositionM,
    rotation: avatar.avatarRotationDeg,
    trackId: avatar.avatarTrackId,
    sceneId: scene.sceneId,
    sceneRoom: scene.sceneRoom,
  }
})
