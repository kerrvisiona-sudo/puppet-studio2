import { atom } from 'jotai'
import {
  useSceneStore,
  useViewportStore,
  useBridgeStore,
  useAvatarStore,
  useUiStore,
  useTerminalUiStore,
} from '../state'

/**
 * Base atoms that wrap Zustand stores
 * These atoms automatically subscribe to store changes
 */

/** Scene store atom */
export const sceneStoreAtom = atom((get) => {
  // Jotai will subscribe to the entire store
  // For specific slices, create derived atoms below
  return useSceneStore.getState()
})

/** Viewport store atom */
export const viewportStoreAtom = atom((get) => {
  return useViewportStore.getState()
})

/** Bridge store atom */
export const bridgeStoreAtom = atom((get) => {
  return useBridgeStore.getState()
})

/** Avatar store atom */
export const avatarStoreAtom = atom((get) => {
  return useAvatarStore.getState()
})

/** UI store atom */
export const uiStoreAtom = atom((get) => {
  return useUiStore.getState()
})

/** Terminal UI store atom */
export const terminalUiStoreAtom = atom((get) => {
  return useTerminalUiStore.getState()
})

/**
 * Helper to create a reactive atom from a Zustand store
 * This ensures the atom updates when the store changes
 */
export function atomWithStore<T>(store: { getState: () => T; subscribe: (listener: (state: T) => void) => () => void }) {
  const baseAtom = atom(store.getState())
  baseAtom.onMount = (set) => {
    const unsub = store.subscribe((state) => set(state))
    return unsub
  }
  return baseAtom
}

/** Reactive store atoms that update on store changes */
export const sceneAtom = atomWithStore(useSceneStore)
export const viewportAtom = atomWithStore(useViewportStore)
export const bridgeAtom = atomWithStore(useBridgeStore)
export const avatarAtom = atomWithStore(useAvatarStore)
export const uiAtom = atomWithStore(useUiStore)
export const terminalUiAtom = atomWithStore(useTerminalUiStore)
