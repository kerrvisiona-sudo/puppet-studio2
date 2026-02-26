import type { SceneState } from './sceneStore'

/**
 * Selector factories for sceneStore
 * Use with useShallow for optimized re-renders
 */

export const sceneSelectors = {
  /** Core scene identity (6 props) */
  sceneIdentity: (s: SceneState) => ({
    sceneId: s.sceneId,
    sceneRevision: s.sceneRevision,
    sceneSequence: s.sceneSequence,
    sceneSource: s.sceneSource,
    sceneLastEventAt: s.sceneLastEventAt,
    sceneError: s.sceneError,
  }),

  /** Scene placements and room (3 props) */
  sceneGeometry: (s: SceneState) => ({
    scenePlacements: s.scenePlacements,
    sceneRoom: s.sceneRoom,
    selectedPlacementId: s.selectedPlacementId,
  }),

  /** Undo/redo state (3 props) */
  sceneHistory: (s: SceneState) => ({
    sceneEditEnabled: s.sceneEditEnabled,
    sceneUndoDepth: s.sceneUndoDepth,
    sceneRedoDepth: s.sceneRedoDepth,
  }),

  /** Monitoring cameras (1 prop) */
  monitoringCameras: (s: SceneState) => s.monitoringCameras,

  /** Scene specialist metadata (5 props) */
  sceneSpecialistMetadata: (s: SceneState) => ({
    sceneSpecialistSource: s.sceneSpecialistSource,
    sceneSpecialistGeneratedAt: s.sceneSpecialistGeneratedAt,
    sceneSpatialFresh: s.sceneSpatialFresh,
    sceneSpatialAgeS: s.sceneSpatialAgeS,
    sceneSpatialStaleAfterS: s.sceneSpatialStaleAfterS,
    sceneSpatialStalePolicy: s.sceneSpatialStalePolicy,
  }),

  /** Remote override state (2 props) */
  sceneRemoteOverride: (s: SceneState) => ({
    sceneRemoteOverrideAt: s.sceneRemoteOverrideAt,
    sceneRemoteOverrideKind: s.sceneRemoteOverrideKind,
  }),
}
