/**
 * Jotai atoms for cross-store derived state
 *
 * Use these atoms when you need computed state that:
 * - Depends on multiple Zustand stores
 * - Has expensive computation
 * - Needs granular re-render optimization
 *
 * For simple single-store state, prefer useShallow with Zustand stores directly.
 */

export * from './storeAtoms'
export * from './bridgeAtoms'
export * from './sceneAtoms'
