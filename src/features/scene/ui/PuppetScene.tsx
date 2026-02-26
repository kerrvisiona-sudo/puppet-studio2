import { OrbitControls, useGLTF } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useRef } from 'react'
import { PCFShadowMap } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

import { ASSET_CATALOG } from '../../../core/planogram-domain'
import { useSceneViewportState } from '../hooks'
import { AvatarBounds } from './AvatarBounds'
import { CameraOrientationObserver } from './CameraOrientationObserver'
import { CameraPresetController } from './CameraPresetController'
import { MonitoringSensorLayer } from './MonitoringSensorLayer'
import { PuppetRig } from './PuppetRig'
import { RoomEnvironment } from './RoomEnvironment'
import { SceneGridHelpers } from './SceneGridHelpers'


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
      shadows={{ type: PCFShadowMap }}
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
        <SceneGridHelpers room={sceneRoom} />
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
