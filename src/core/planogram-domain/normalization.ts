import { Box3, Vector3 } from 'three'
import type { Object3D } from 'three'

import type { Dimensions3D, FitAxis } from './types'

const EPSILON = 1e-6

export type MeasuredObject = {
  center: { x: number; y: number; z: number }
  minY: number
  size: Dimensions3D
}

export function measureObject(root: Object3D): MeasuredObject {
  const bounds = new Box3().setFromObject(root)
  const size = new Vector3()
  const center = new Vector3()
  bounds.getSize(size)
  bounds.getCenter(center)

  return {
    center: { x: center.x, y: center.y, z: center.z },
    minY: bounds.min.y,
    size: {
      depth: Math.max(size.z, EPSILON),
      height: Math.max(size.y, EPSILON),
      width: Math.max(size.x, EPSILON),
    },
  }
}

export function computeUniformScale(current: Dimensions3D, target: Dimensions3D, fitAxis: FitAxis): number {
  const widthRatio = target.width / current.width
  const heightRatio = target.height / current.height
  const depthRatio = target.depth / current.depth

  if (fitAxis === 'height') return heightRatio
  if (fitAxis === 'width') return widthRatio
  if (fitAxis === 'depth') return depthRatio
  return Math.min(widthRatio, depthRatio)
}
