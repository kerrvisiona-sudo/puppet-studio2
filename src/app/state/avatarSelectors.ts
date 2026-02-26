import type { AvatarState } from './avatarStore'

/**
 * Selector factories for avatarStore
 * Use with useShallow for optimized re-renders
 */

export const avatarSelectors = {
  /** Avatar pose and position (3 props) */
  avatarPoseAndPosition: (s: AvatarState) => ({
    pose: s.pose,
    avatarPlanPositionM: s.avatarPlanPositionM,
    avatarRotationDeg: s.avatarRotationDeg,
  }),

  /** Avatar actions (4 actions) */
  avatarActions: (s: AvatarState) => ({
    setAxis: s.setAxis,
    resetPose: s.resetPose,
    setAvatarPosition: s.setAvatarPosition,
    setAvatarRotation: s.setAvatarRotation,
  }),
}
