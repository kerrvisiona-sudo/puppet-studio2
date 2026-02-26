import { OrbitControls, useGLTF } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import type { ReactNode, RefObject } from 'react'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import { DoubleSide } from 'three'
import type { Mesh, Object3D, OrthographicCamera, PerspectiveCamera } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

import {
  cameraAngles,
  cameraForward,
  cameraWorldPosition,
  computeSensorPlaneDistance,
  computeTopViewPixelsPerMeter,
  normalizeDetectionBox2D,
  placementYawDeg,
  planToWorldPosition,
  projectNormalizedDetectionToSensorPlane,
} from '../../../core/scene-domain'
import { createRagdoll } from '../../../createConfig'
import {
  ASSET_CATALOG,
  computeUniformScale,
  degToRad,
  getPlacementTargetSizeM,
  GRID_MAJOR_STEP_M,
  GRID_MINOR_STEP_M,
  measureObject,
  RAGDOLL_SCALE,
  TARGET_AVATAR_FOOTPRINT_DEPTH_M,
  TARGET_AVATAR_FOOTPRINT_WIDTH_M,
  TARGET_AVATAR_HEIGHT_M,
} from '../../../core/planogram-domain'
import type { CameraDetectionOverlay, MonitoringCameraDefinition, Placement, RoomDefinition } from '../../../core/planogram-domain'
import type { PartKey, PoseControls } from '../../../poseControls'
import { usePoseStore } from '../../../app/state'
import { useSceneViewportState } from '../hooks'

const { joints, shapes } = createRagdoll(RAGDOLL_SCALE, Math.PI / 16, Math.PI / 16, 0)

type ShapeName = keyof typeof shapes
type JointConfig = (typeof joints)[keyof typeof joints]

const shapeToPartKey: Partial<Record<ShapeName, PartKey>> = {
  head: 'head',
  lowerLeftArm: 'leftForearm',
  lowerLeftLeg: 'leftFoot',
  lowerRightArm: 'rightForearm',
  lowerRightLeg: 'rightFoot',
  upperBody: 'torsoBase',
  upperLeftArm: 'leftUpperArm',
  upperLeftLeg: 'leftThigh',
  upperRightArm: 'rightUpperArm',
  upperRightLeg: 'rightThigh',
}

const toRad = (degrees: number) => (degrees * Math.PI) / 180
const unitScale = (x: number, y: number, z: number): [number, number, number] => [x * 2, y * 2, z * 2]

function rotationFromPose(name: ShapeName, pose: PoseControls): [number, number, number] {
  const part = shapeToPartKey[name]
  if (!part) return [0, 0, 0]
  const value = pose[part]
  return [toRad(value.x), toRad(value.y), toRad(value.z)]
}

function PartMesh({ name }: { name: ShapeName }) {
  const shape = shapes[name]
  return (
    <mesh castShadow receiveShadow scale={unitScale(shape.args[0], shape.args[1], shape.args[2])}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={shape.color} />
    </mesh>
  )
}

type JointNodeProps = {
  child: ShapeName
  children?: ReactNode
  joint: JointConfig
  pose: PoseControls
}

function JointNode({ child, children, joint, pose }: JointNodeProps) {
  const childRotation = rotationFromPose(child, pose)
  const pivotA = joint.pivotA
  const pivotB = joint.pivotB

  return (
    <group position={[pivotB[0], pivotB[1], pivotB[2]]} rotation={childRotation}>
      <group position={[-pivotA[0], -pivotA[1], -pivotA[2]]}>
        <PartMesh name={child} />
        {children}
      </group>
    </group>
  )
}

function PuppetRig({ pose }: { pose: PoseControls }) {
  const rootRotation = rotationFromPose('upperBody', pose)
  const baseHeight = useMemo(() => {
    // Anchor correction: place feet contact point on world Y=0.
    // Our procedural rig centers the root on torso, while planogram/world origin
    // should reference floor contact for spatial calibration.
    return shapes.upperBody.position[1]
  }, [])

  return (
    <group position={[0, baseHeight, 0]} rotation={rootRotation}>
      <PartMesh name="upperBody" />

      <JointNode child="head" joint={joints.neckJoint} pose={pose} />

      <JointNode child="upperLeftArm" joint={joints.leftShoulder} pose={pose}>
        <JointNode child="lowerLeftArm" joint={joints.leftElbowJoint} pose={pose} />
      </JointNode>

      <JointNode child="upperRightArm" joint={joints.rightShoulder} pose={pose}>
        <JointNode child="lowerRightArm" joint={joints.rightElbowJoint} pose={pose} />
      </JointNode>

      <JointNode child="pelvis" joint={joints.spineJoint} pose={pose}>
        <JointNode child="upperLeftLeg" joint={joints.leftHipJoint} pose={pose}>
          <JointNode child="lowerLeftLeg" joint={joints.leftKneeJoint} pose={pose} />
        </JointNode>
        <JointNode child="upperRightLeg" joint={joints.rightHipJoint} pose={pose}>
          <JointNode child="lowerRightLeg" joint={joints.rightKneeJoint} pose={pose} />
        </JointNode>
      </JointNode>
    </group>
  )
}

function WorkHelpers({ room }: { room: RoomDefinition }) {
  const baseSpan = Math.max(room.widthM, room.depthM) + 4
  const gridSize = Math.ceil(baseSpan / GRID_MINOR_STEP_M) * GRID_MINOR_STEP_M
  const minorDivisions = Math.round(gridSize / GRID_MINOR_STEP_M)
  const majorDivisions = Math.round(gridSize / GRID_MAJOR_STEP_M)
  return (
    <group>
      <gridHelper args={[gridSize, majorDivisions, '#687790', '#b8c3d3']} position={[0, 0.002, 0]} />
      <gridHelper args={[gridSize, minorDivisions, '#b9c2d1', '#d9e0eb']} position={[0, 0.001, 0]} />
      <axesHelper args={[2]} />
    </group>
  )
}

function prepareShadows(root: Object3D) {
  root.traverse((child) => {
    const mesh = child as Mesh
    if ('isMesh' in mesh && mesh.isMesh) {
      mesh.castShadow = true
      mesh.receiveShadow = true
    }
  })
  return root
}

function isOrthographicCamera(camera: unknown): camera is OrthographicCamera {
  return Boolean((camera as { isOrthographicCamera?: boolean }).isOrthographicCamera)
}

function isPerspectiveCamera(camera: unknown): camera is PerspectiveCamera {
  return Boolean((camera as { isPerspectiveCamera?: boolean }).isPerspectiveCamera)
}

function RoomItem({ placement }: { placement: Placement }) {
  const assetDefinition = ASSET_CATALOG[placement.assetId]
  const { scene } = useGLTF(assetDefinition.url)

  const targetSize = useMemo(
    () => getPlacementTargetSizeM(placement),
    [
      placement.assetId,
      placement.targetSizeM?.width,
      placement.targetSizeM?.height,
      placement.targetSizeM?.depth,
    ],
  )
  const measuredBase = useMemo(() => measureObject(scene), [scene])
  const baseScene = useMemo(() => {
    return prepareShadows(scene.clone(true))
  }, [scene])

  const calibrated = useMemo(() => {
    const uniformScale = computeUniformScale(measuredBase.size, targetSize, assetDefinition.fitAxis)
    const floorOffset = -measuredBase.minY * uniformScale + (placement.elevationM ?? 0)
    return { floorOffset, measured: measuredBase, uniformScale }
  }, [assetDefinition.fitAxis, measuredBase, placement.elevationM, targetSize])

  const basePosition = planToWorldPosition([placement.planPositionM[0], placement.planPositionM[1]])
  const rotationY = degToRad(placementYawDeg(placement))

  return (
    <group
      position={[basePosition[0], basePosition[1] + calibrated.floorOffset, basePosition[2]]}
      rotation={[0, rotationY, 0]}
      scale={calibrated.uniformScale}
    >
      <primitive object={baseScene} />
      <mesh
        position={[calibrated.measured.center.x, calibrated.measured.center.y, calibrated.measured.center.z]}
        renderOrder={2}
      >
        <boxGeometry args={[calibrated.measured.size.width, calibrated.measured.size.height, calibrated.measured.size.depth]} />
        <meshBasicMaterial color={assetDefinition.miniMapColor} transparent opacity={0.18} depthWrite={false} />
      </mesh>
      <mesh
        position={[calibrated.measured.center.x, calibrated.measured.center.y, calibrated.measured.center.z]}
        renderOrder={3}
      >
        <boxGeometry args={[calibrated.measured.size.width, calibrated.measured.size.height, calibrated.measured.size.depth]} />
        <meshBasicMaterial color={assetDefinition.miniMapColor} transparent opacity={0.55} wireframe depthWrite={false} />
      </mesh>
    </group>
  )
}

function RoomEnvironment({ placements, room }: { placements: Placement[]; room: RoomDefinition }) {
  const roomWidth = room.widthM
  const roomDepth = room.depthM
  const roomHeight = room.heightM
  const wallThickness = room.wallThicknessM
  return (
    <group>
      <mesh receiveShadow position={[0, -0.05, 0]}>
        <boxGeometry args={[roomWidth, 0.1, roomDepth]} />
        <meshStandardMaterial color="#d9dee8" />
      </mesh>

      <mesh receiveShadow position={[0, roomHeight / 2, -roomDepth / 2]}>
        <boxGeometry args={[roomWidth, roomHeight, wallThickness]} />
        <meshStandardMaterial color="#f2f4f7" transparent opacity={0.28} />
      </mesh>
      <mesh receiveShadow position={[-roomWidth / 2, roomHeight / 2, 0]}>
        <boxGeometry args={[wallThickness, roomHeight, roomDepth]} />
        <meshStandardMaterial color="#edf1f6" transparent opacity={0.22} />
      </mesh>
      <mesh receiveShadow position={[roomWidth / 2, roomHeight / 2, 0]}>
        <boxGeometry args={[wallThickness, roomHeight, roomDepth]} />
        <meshStandardMaterial color="#edf1f6" transparent opacity={0.22} />
      </mesh>
      <mesh position={[0, roomHeight / 2, 0]} renderOrder={1}>
        <boxGeometry args={[roomWidth, roomHeight, roomDepth]} />
        <meshBasicMaterial color="#9ba9bf" transparent opacity={0.12} wireframe depthWrite={false} />
      </mesh>

      {placements.map((placement) => (
        <RoomItem key={placement.id} placement={placement} />
      ))}
    </group>
  )
}

function MonitoringSensorLayer({
  cameraDetections,
  cameras,
  flipX,
  flipY,
  selectedCameraId,
}: {
  cameraDetections: CameraDetectionOverlay[]
  cameras: MonitoringCameraDefinition[]
  flipX: boolean
  flipY: boolean
  selectedCameraId: string | null
}) {
  const selectedCamera = useMemo(() => {
    if (selectedCameraId) {
      const byId = cameras.find((camera) => camera.id === selectedCameraId)
      if (byId) return byId
    }
    return cameras[0] ?? null
  }, [cameras, selectedCameraId])

  const selectedOverlay = useMemo(() => {
    if (!selectedCamera) return null
    return cameraDetections.find((overlay) => overlay.cameraId === selectedCamera.id) ?? null
  }, [cameraDetections, selectedCamera])
  const selectedSensorDistance = useMemo(
    () => (selectedCamera ? computeSensorPlaneDistance(selectedCamera, 0) : null),
    [selectedCamera],
  )

  return (
    <group>
      {cameras.map((camera) => {
        const isSelected = selectedCamera?.id === camera.id
        const position = cameraWorldPosition(camera)
        const { pitch, yaw } = cameraAngles(camera)
        const guideDistance = isSelected ? (selectedSensorDistance ?? camera.overlayDistanceM) : 1.2
        return (
          <group key={camera.id} position={position}>
            <group rotation={[0, yaw, 0]}>
              <group rotation={[-pitch, 0, 0]}>
                <mesh castShadow renderOrder={4}>
                  <boxGeometry args={[0.1, 0.08, 0.1]} />
                  <meshStandardMaterial color={isSelected ? '#4f46e5' : '#334155'} />
                </mesh>
                <mesh position={[0, 0, 0.22]} rotation={[Math.PI / 2, 0, 0]} renderOrder={4}>
                  <coneGeometry args={[0.065, 0.22, 16]} />
                  <meshStandardMaterial color={isSelected ? '#22c55e' : '#475569'} />
                </mesh>
                <mesh position={[0, 0, guideDistance * 0.5]} renderOrder={3}>
                  <boxGeometry args={[0.02, 0.02, Math.max(0.6, guideDistance)]} />
                  <meshStandardMaterial color={isSelected ? '#22c55e' : '#64748b'} transparent opacity={0.6} />
                </mesh>
              </group>
            </group>
          </group>
        )
      })}

      {selectedCamera && selectedSensorDistance ? (
        <group position={cameraWorldPosition(selectedCamera)}>
          <group rotation={[0, cameraAngles(selectedCamera).yaw, 0]}>
            <group rotation={[-cameraAngles(selectedCamera).pitch, 0, 0]}>
              <group position={[0, 0, selectedSensorDistance]}>
                {(() => {
                  const planeHeight = 2 * selectedSensorDistance * Math.tan((degToRad(selectedCamera.fovDeg) * 0.5))
                  const planeWidth = planeHeight * selectedCamera.aspectRatio
                  return (
                    <group>
                      <mesh renderOrder={3}>
                        <planeGeometry args={[planeWidth, planeHeight]} />
                        <meshBasicMaterial color="#06b6d4" transparent opacity={0.1} depthWrite={false} side={DoubleSide} />
                      </mesh>
                      <mesh renderOrder={4}>
                        <planeGeometry args={[planeWidth, planeHeight]} />
                        <meshBasicMaterial color="#0891b2" transparent opacity={0.4} wireframe depthWrite={false} side={DoubleSide} />
                      </mesh>
                      {selectedOverlay?.boxes.map((box) => {
                        const normalized = normalizeDetectionBox2D(box, { flipX, flipY })
                        const projected = projectNormalizedDetectionToSensorPlane(
                          normalized,
                          { height: planeHeight, width: planeWidth },
                          0.001,
                        )
                        const highlight = box.trackId ? '#f97316' : '#e11d48'
                        return (
                          <group key={`${selectedOverlay.cameraId}:${box.id}`} position={[projected.centerX, projected.centerY, 0.004]}>
                            <mesh renderOrder={5}>
                              <planeGeometry args={[projected.boxWidth, projected.boxHeight]} />
                              <meshBasicMaterial color={highlight} transparent opacity={0.16} depthWrite={false} side={DoubleSide} />
                            </mesh>
                            <mesh renderOrder={6}>
                              <planeGeometry args={[projected.boxWidth, projected.boxHeight]} />
                              <meshBasicMaterial color={highlight} transparent opacity={0.86} wireframe depthWrite={false} side={DoubleSide} />
                            </mesh>
                            <mesh
                              position={[projected.anchorX - projected.centerX, projected.anchorY - projected.centerY, 0.002]}
                              renderOrder={7}
                            >
                              <circleGeometry args={[0.02, 24]} />
                              <meshBasicMaterial color={highlight} transparent opacity={0.95} depthWrite={false} side={DoubleSide} />
                            </mesh>
                          </group>
                        )
                      })}
                    </group>
                  )
                })()}
              </group>
            </group>
          </group>
        </group>
      ) : null}
    </group>
  )
}

function CameraPresetController({
  controlsRef,
  room,
  sensorCamera,
  view,
  topQuarterTurns,
}: {
  controlsRef: RefObject<OrbitControlsImpl | null>
  room: RoomDefinition
  sensorCamera: MonitoringCameraDefinition | null
  view: 'iso' | 'top' | 'front' | 'back' | 'left' | 'right' | 'sensor'
  topQuarterTurns: 0 | 1 | 2 | 3
}) {
  const { camera, size } = useThree()
  const appliedPresetRef = useRef<string | null>(null)
  const roomSignature = useMemo(
    () =>
      `${room.widthM.toFixed(3)}|${room.depthM.toFixed(3)}|${room.heightM.toFixed(3)}|${room.wallThicknessM.toFixed(3)}`,
    [room.depthM, room.heightM, room.wallThicknessM, room.widthM],
  )
  const sensorSignature = useMemo(() => {
    if (!sensorCamera) return 'none'
    return [
      sensorCamera.id,
      sensorCamera.planPositionM[0].toFixed(3),
      sensorCamera.planPositionM[1].toFixed(3),
      sensorCamera.heightM.toFixed(3),
      sensorCamera.yawDeg.toFixed(3),
      sensorCamera.pitchDeg.toFixed(3),
      sensorCamera.fovDeg.toFixed(3),
      sensorCamera.aspectRatio.toFixed(4),
    ].join('|')
  }, [
    sensorCamera?.aspectRatio,
    sensorCamera?.fovDeg,
    sensorCamera?.heightM,
    sensorCamera?.id,
    sensorCamera?.pitchDeg,
    sensorCamera?.planPositionM,
    sensorCamera?.yawDeg,
  ])

  useEffect(() => {
    const projectionKind = isOrthographicCamera(camera) ? 'ortho' : 'persp'

    if (view === 'top') {
      const presetKey = `top|${projectionKind}|${topQuarterTurns}|${roomSignature}|${size.width}x${size.height}`
      if (appliedPresetRef.current === presetKey) return
      appliedPresetRef.current = presetKey

      const topPixelsPerMeter = computeTopViewPixelsPerMeter(size.width, size.height, room)
      if (isOrthographicCamera(camera)) {
        camera.position.set(0, 10, 0)
        camera.zoom = topPixelsPerMeter
      }
      if (isPerspectiveCamera(camera)) {
        camera.fov = 24
        const fovRad = (camera.fov * Math.PI) / 180
        const visibleHeightM = size.height / topPixelsPerMeter
        const distanceY = visibleHeightM / (2 * Math.tan(fovRad / 2))
        camera.position.set(0, distanceY, 0)
      }
      if (topQuarterTurns === 0) camera.up.set(0, 0, 1)
      if (topQuarterTurns === 1) camera.up.set(1, 0, 0)
      if (topQuarterTurns === 2) camera.up.set(0, 0, -1)
      if (topQuarterTurns === 3) camera.up.set(-1, 0, 0)
      controlsRef.current?.target.set(0, 0, 0)
      controlsRef.current?.update()
      if (isOrthographicCamera(camera) || isPerspectiveCamera(camera)) {
        camera.updateProjectionMatrix()
      }
      return
    }

    if (view === 'sensor' && sensorCamera) {
      const presetKey = `sensor|${projectionKind}|${sensorSignature}`
      if (appliedPresetRef.current === presetKey) return
      appliedPresetRef.current = presetKey

      const cameraPosition = cameraWorldPosition(sensorCamera)
      const forward = cameraForward(sensorCamera)
      const sensorDistance = computeSensorPlaneDistance(sensorCamera, 0)

      camera.position.set(cameraPosition[0], cameraPosition[1], cameraPosition[2])
      if (isOrthographicCamera(camera)) {
        camera.zoom = 72
      }
      if (isPerspectiveCamera(camera)) {
        camera.fov = Math.max(15, Math.min(95, sensorCamera.fovDeg))
      }
      camera.up.set(0, 1, 0)
      controlsRef.current?.target.set(
        cameraPosition[0] + forward[0] * sensorDistance,
        cameraPosition[1] + forward[1] * sensorDistance,
        cameraPosition[2] + forward[2] * sensorDistance,
      )
      controlsRef.current?.update()
      if (isOrthographicCamera(camera) || isPerspectiveCamera(camera)) {
        camera.updateProjectionMatrix()
      }
      return
    }

    if (view === 'front' || view === 'back' || view === 'left' || view === 'right') {
      const presetKey = `${view}|${projectionKind}|${roomSignature}`
      if (appliedPresetRef.current === presetKey) return
      appliedPresetRef.current = presetKey

      const roomHalfMax = Math.max(room.widthM, room.depthM) * 0.5
      const sideDistance = roomHalfMax + 2.4
      const sideHeight = Math.max(1.8, room.heightM * 0.58)
      const targetY = Math.max(0.9, room.heightM * 0.4)

      let positionX = 0
      let positionZ = 0
      if (view === 'front') positionZ = sideDistance
      if (view === 'back') positionZ = -sideDistance
      if (view === 'right') positionX = sideDistance
      if (view === 'left') positionX = -sideDistance

      camera.position.set(positionX, sideHeight, positionZ)
      if (isOrthographicCamera(camera)) {
        camera.zoom = 62
      }
      if (isPerspectiveCamera(camera)) {
        camera.fov = 34
      }
      camera.up.set(0, 1, 0)
      controlsRef.current?.target.set(0, targetY, 0)
      controlsRef.current?.update()
      if (isOrthographicCamera(camera) || isPerspectiveCamera(camera)) {
        camera.updateProjectionMatrix()
      }
      return
    }

    const presetKey = `iso|${projectionKind}`
    if (appliedPresetRef.current === presetKey) return
    appliedPresetRef.current = presetKey

    camera.position.set(8, 7.5, 8)
    if (isOrthographicCamera(camera)) camera.zoom = 85
    if (isPerspectiveCamera(camera)) camera.fov = 42
    camera.up.set(0, 1, 0)
    controlsRef.current?.target.set(0, 1.1, -0.5)
    controlsRef.current?.update()
    if (isOrthographicCamera(camera) || isPerspectiveCamera(camera)) {
      camera.updateProjectionMatrix()
    }
  }, [
    camera,
    controlsRef,
    room,
    roomSignature,
    sensorCamera,
    sensorSignature,
    size.height,
    size.width,
    topQuarterTurns,
    view,
  ])

  return null
}

function CameraOrientationObserver({ controlsRef }: { controlsRef: RefObject<OrbitControlsImpl | null> }) {
  const { camera } = useThree()
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const emit = () => {
      usePoseStore.getState().setViewportCameraQuaternion([
        camera.quaternion.x,
        camera.quaternion.y,
        camera.quaternion.z,
        camera.quaternion.w,
      ])
    }

    const scheduleEmit = () => {
      if (rafRef.current !== null) return
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null
        emit()
      })
    }

    emit()
    const controls = controlsRef.current
    controls?.addEventListener('change', scheduleEmit)

    return () => {
      controls?.removeEventListener('change', scheduleEmit)
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
      }
    }
  }, [camera, controlsRef])

  return null
}

function AvatarBounds() {
  return (
    <group>
      <mesh position={[0, TARGET_AVATAR_HEIGHT_M / 2, 0]} renderOrder={2}>
        <boxGeometry args={[TARGET_AVATAR_FOOTPRINT_WIDTH_M, TARGET_AVATAR_HEIGHT_M, TARGET_AVATAR_FOOTPRINT_DEPTH_M]} />
        <meshBasicMaterial color="#2d2d2d" transparent opacity={0.1} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} renderOrder={2}>
        <ringGeometry args={[0.11, 0.13, 32]} />
        <meshBasicMaterial color="#111827" transparent opacity={0.75} />
      </mesh>
    </group>
  )
}

export function PuppetScene() {
  const {
    avatarWorldPosition,
    avatarYaw,
    cameraDetectionOverlays,
    cameraOverlayFlipX,
    cameraOverlayFlipY,
    cameraView,
    monitoringCameras,
    pose,
    projectionMode,
    scenePlacements,
    sceneRoom,
    selectedMonitoringCamera,
    topQuarterTurns,
  } = useSceneViewportState()
  const controlsRef = useRef<OrbitControlsImpl | null>(null)

  return (
    <Canvas
      key={projectionMode}
      camera={
        projectionMode === 'orthographic'
          ? { far: 120, near: 0.1, position: [8, 7.5, 8], zoom: 85 }
          : { far: 120, fov: 42, near: 0.1, position: [8, 7.5, 8] }
      }
      orthographic={projectionMode === 'orthographic'}
      shadows
    >
      <color attach="background" args={['#f7f7f7']} />

      <ambientLight intensity={0.7} />
      <hemisphereLight args={['#ffffff', '#d8d8d8', 0.4]} />
      <directionalLight
        castShadow
        intensity={1.1}
        position={[13, 24, 7]}
        shadow-camera-bottom={-28}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
      />

      <Suspense fallback={null}>
        <RoomEnvironment placements={scenePlacements} room={sceneRoom} />
      </Suspense>
      <group position={[0, 0.005, 0]}>
        <WorkHelpers room={sceneRoom} />
      </group>
      <MonitoringSensorLayer
        cameraDetections={cameraDetectionOverlays}
        cameras={monitoringCameras}
        flipX={cameraOverlayFlipX}
        flipY={cameraOverlayFlipY}
        selectedCameraId={selectedMonitoringCamera?.id ?? null}
      />
      <group position={[avatarWorldPosition[0], avatarWorldPosition[1], avatarWorldPosition[2]]} rotation={[0, avatarYaw, 0]}>
        <AvatarBounds />
        <PuppetRig pose={pose} />
      </group>
      <CameraPresetController
        controlsRef={controlsRef}
        room={sceneRoom}
        sensorCamera={selectedMonitoringCamera}
        topQuarterTurns={topQuarterTurns}
        view={cameraView}
      />
      <CameraOrientationObserver controlsRef={controlsRef} />
      <OrbitControls ref={controlsRef} makeDefault enableDamping enablePan enableRotate={cameraView === 'iso'} enableZoom />
    </Canvas>
  )
}

for (const asset of Object.values(ASSET_CATALOG)) {
  useGLTF.preload(asset.url)
}
