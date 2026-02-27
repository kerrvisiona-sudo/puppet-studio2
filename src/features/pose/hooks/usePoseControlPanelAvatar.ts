import { useShallow } from 'zustand/react/shallow'

import { useAvatarStore } from '../../../app/state'

export function usePoseControlPanelAvatar() {
  const { pose, setAxis } = useAvatarStore(
    useShallow((s) => ({
      pose: s.pose,
      setAxis: s.setAxis,
    }))
  )

  return {
    pose,
    setAxis,
  }
}
