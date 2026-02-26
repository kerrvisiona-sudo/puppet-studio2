export type Vec2 = [number, number]
export type Vec3 = [number, number, number]

export type Dimensions3D = {
  depth: number
  height: number
  width: number
}

export type FitAxis = 'depth' | 'footprint' | 'height' | 'width'

export type AssetId =
  | 'bedDouble'
  | 'bookcaseOpenLow'
  | 'cabinetBedDrawerTable'
  | 'lampSquareTable'
  | 'plantSmall'
  | 'rugRectangle'

export type AssetDefinition = {
  defaultRotationDeg?: number
  fitAxis: FitAxis
  id: AssetId
  label: string
  miniMapColor: string
  targetSizeM: Dimensions3D
  url: string
}

export type RoomDefinition = {
  depthM: number
  heightM: number
  wallThicknessM: number
  widthM: number
}

export type Placement = {
  assetId: AssetId
  elevationM?: number
  id: string
  objectId?: string
  planPositionM: Vec2
  rotationDeg?: number
  trackId?: string
  targetSizeM?: Dimensions3D
}

export type PlanogramDefinition = {
  placements: Placement[]
  room: RoomDefinition
}

export type MonitoringCameraDefinition = {
  aspectRatio: number
  fovDeg: number
  heightM: number
  id: string
  imageMirrorX?: boolean
  imageMirrorY?: boolean
  label?: string
  overlayDistanceM: number
  pitchDeg: number
  planPositionM: Vec2
  yawDeg: number
}

export type DetectionBox2D = {
  anchorMode?: 'bottom_center'
  anchorUV?: Vec2
  confidence?: number
  height: number
  id: string
  label?: string
  objectId?: string
  trackId?: string
  width: number
  x: number
  y: number
}

export type CameraDetectionOverlay = {
  boxes: DetectionBox2D[]
  cameraId: string
  timestamp?: string
}
