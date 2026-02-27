import { useMemo, useState } from 'react'
import type { SceneEventEntry } from '../../../core/observability/sceneEventLog'
import type { CameraDetectionOverlay, MonitoringCameraDefinition, Placement } from '../../../core/planogram-domain'

type OutlinerSectionKey = 'cameras' | 'detections' | 'experts' | 'placements'

type DetectionRow = {
  cameraId: string
  id: string
  trackLabel: string
}

const EXPERT_TAGS = ['bridge', 'inference', 'spatial_projector', 'scene_compositor', 'strategy_projector']

function toLower(value: string | null | undefined): string {
  return (value ?? '').toLowerCase()
}

function matchesQuery(tokens: Array<string | null | undefined>, query: string): boolean {
  if (!query) return true
  return tokens.some((token) => toLower(token).includes(query))
}

type UseOutlinerFilteringParams = {
  sceneEventLog: SceneEventEntry[]
  scenePlacements: Placement[]
  monitoringCameras: MonitoringCameraDefinition[]
  cameraDetectionOverlays: CameraDetectionOverlay[]
}

export function useOutlinerFiltering({
  sceneEventLog,
  scenePlacements,
  monitoringCameras,
  cameraDetectionOverlays,
}: UseOutlinerFilteringParams) {
  const [openSections, setOpenSections] = useState<Record<OutlinerSectionKey, boolean>>({
    cameras: true,
    detections: false,
    experts: true,
    placements: true,
  })
  const [filterQuery, setFilterQuery] = useState('')
  const normalizedQuery = filterQuery.trim().toLowerCase()

  const sourceHeat = useMemo(() => {
    const recent = sceneEventLog.slice(Math.max(0, sceneEventLog.length - 220))
    return EXPERT_TAGS.map((tag) => ({
      count: recent.filter((entry) => entry.source.includes(tag)).length,
      id: tag,
    }))
  }, [sceneEventLog])

  const detectionRows = useMemo<DetectionRow[]>(
    () =>
      cameraDetectionOverlays.flatMap((overlay) =>
        overlay.boxes.map((box) => ({
          cameraId: overlay.cameraId,
          id: box.id,
          trackLabel: box.trackId ?? box.label ?? box.id,
        })),
      ),
    [cameraDetectionOverlays],
  )

  const filteredSourceHeat = useMemo(
    () => sourceHeat.filter((entry) => matchesQuery([entry.id], normalizedQuery)),
    [normalizedQuery, sourceHeat],
  )

  const filteredPlacements = useMemo(
    () =>
      scenePlacements.filter((placement) =>
        matchesQuery([placement.assetId, placement.id, placement.objectId, placement.trackId], normalizedQuery),
      ),
    [normalizedQuery, scenePlacements],
  )

  const filteredCameras = useMemo(
    () =>
      monitoringCameras.filter((camera) => matchesQuery([camera.label, camera.id], normalizedQuery)),
    [monitoringCameras, normalizedQuery],
  )

  const filteredDetections = useMemo(
    () =>
      detectionRows.filter((detection) => matchesQuery([detection.trackLabel, detection.id, detection.cameraId], normalizedQuery)),
    [detectionRows, normalizedQuery],
  )

  const detectionsByCamera = useMemo(() => {
    const groups = new Map<string, DetectionRow[]>()
    for (const detection of filteredDetections) {
      const existing = groups.get(detection.cameraId)
      if (existing) {
        existing.push(detection)
        continue
      }
      groups.set(detection.cameraId, [detection])
    }
    return Array.from(groups.entries()).sort((left, right) => left[0].localeCompare(right[0]))
  }, [filteredDetections])

  return {
    openSections,
    setOpenSections,
    filterQuery,
    setFilterQuery,
    normalizedQuery,
    sourceHeat,
    detectionRows,
    filteredSourceHeat,
    filteredPlacements,
    filteredCameras,
    filteredDetections,
    detectionsByCamera,
  }
}
