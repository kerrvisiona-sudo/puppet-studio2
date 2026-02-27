import type { ReactNode, SVGProps } from 'react'

import { useOutlinerSceneData, useOutlinerFiltering, useOutlinerSelection } from '../../hooks'
import {
  createAppCommandDispatcher,
  IconCamera,
  IconChevronDown,
  IconChevronRight,
  IconCommand,
  IconCube,
  IconEye,
} from '../../../../shared/ui'

type OutlinerSectionKey = 'cameras' | 'detections' | 'experts' | 'placements'

type OutlinerSection = {
  icon: (props: SVGProps<SVGSVGElement>) => ReactNode
  key: OutlinerSectionKey
  label: string
}

type DetectionRow = {
  cameraId: string
  id: string
  trackLabel: string
}

const OUTLINER_SECTIONS: OutlinerSection[] = [
  { icon: IconCommand, key: 'experts', label: 'Expert Mesh' },
  { icon: IconCube, key: 'placements', label: 'Entities' },
  { icon: IconCamera, key: 'cameras', label: 'Cameras' },
  { icon: IconEye, key: 'detections', label: 'Detections' },
]

const EXPERT_TAGS = ['bridge', 'inference', 'spatial_projector', 'scene_compositor', 'strategy_projector']
const INSPECTOR_PALETTE = ['#4ade80', '#60a5fa', '#f59e0b', '#f472b6', '#a78bfa', '#ef4444', '#06b6d4', '#ffffff', '#94a3b8']

function toLower(value: string | null | undefined): string {
  return (value ?? '').toLowerCase()
}

function matchesQuery(tokens: Array<string | null | undefined>, query: string): boolean {
  if (!query) return true
  return tokens.some((token) => toLower(token).includes(query))
}

function sectionCountLabel(total: number, filtered: number, query: string): string {
  if (!query) return `${total}`
  if (total === filtered) return `${total}`
  return `${filtered}/${total}`
}

function formatFixed(value: number): string {
  return Number(value).toFixed(1)
}

export function WorkspaceSceneOutliner() {
  // Compose focused hooks
  const sceneData = useOutlinerSceneData()
  const filtering = useOutlinerFiltering({
    sceneEventLog: sceneData.sceneEventLog,
    scenePlacements: sceneData.scenePlacements,
    monitoringCameras: sceneData.monitoringCameras,
    cameraDetectionOverlays: sceneData.cameraDetectionOverlays,
  })
  const selection = useOutlinerSelection({
    scenePlacements: sceneData.scenePlacements,
    selectedPlacementId: sceneData.selectedPlacementId,
  })

  const dispatchFromOutliner = createAppCommandDispatcher('ui.workspace_outliner')

  const activeExperts = filtering.sourceHeat.filter((entry) => entry.count > 0).length

  return (
    <section className="workspace-outliner">
      <header className="workspace-outliner-head">
        <span>Scene Outliner</span>
        <span>{sceneData.sceneId}</span>
      </header>
      <div className="workspace-outliner-toolbar">
        <input
          value={filtering.filterQuery}
          onChange={(event) => filtering.setFilterQuery(event.currentTarget.value)}
          placeholder="Filter entities, cameras, detections..."
        />
        <span>
          rev:{sceneData.sceneRevision ?? '-'} seq:{sceneData.sceneSequence ?? '-'}
        </span>
      </div>
      <div className="workspace-outliner-body">
        <div className="workspace-tree-root">
          <span className="workspace-tree-root-name">{sceneData.sceneId}</span>
          <span className="workspace-tree-root-meta">entities:{sceneData.scenePlacements.length}</span>
        </div>

        {OUTLINER_SECTIONS.map((section) => {
          const Icon = section.icon
          const isOpen = filtering.openSections[section.key]
          const count =
            section.key === 'experts'
              ? sectionCountLabel(filtering.sourceHeat.length, filtering.filteredSourceHeat.length, filtering.normalizedQuery)
              : section.key === 'placements'
                ? sectionCountLabel(sceneData.scenePlacements.length, filtering.filteredPlacements.length, filtering.normalizedQuery)
                : section.key === 'cameras'
                  ? sectionCountLabel(sceneData.monitoringCameras.length, filtering.filteredCameras.length, filtering.normalizedQuery)
                  : sectionCountLabel(filtering.detectionRows.length, filtering.filteredDetections.length, filtering.normalizedQuery)
          return (
            <div key={section.key} className="workspace-tree-section">
              <button
                type="button"
                className={`workspace-tree-toggle ${isOpen ? 'open' : 'closed'}`}
                onClick={() => filtering.setOpenSections((state) => ({ ...state, [section.key]: !state[section.key] }))}
              >
                <span className="workspace-tree-toggle-main">
                  {isOpen ? (
                    <IconChevronDown className="workspace-tree-toggle-icon workspace-tree-disclosure" />
                  ) : (
                    <IconChevronRight className="workspace-tree-toggle-icon workspace-tree-disclosure" />
                  )}
                  <Icon className="workspace-tree-toggle-icon" />
                  <span>{section.label}</span>
                </span>
                <span className="workspace-tree-count">
                  {section.key === 'experts' ? `${activeExperts} active` : count}
                </span>
              </button>

              {isOpen ? (
                <div className="workspace-tree-items">
                  {section.key === 'experts' ? (
                    filtering.filteredSourceHeat.length > 0 ? (
                      filtering.filteredSourceHeat.map((entry) => (
                        <div key={entry.id} className="workspace-tree-item">
                          <span className="workspace-tree-item-main">
                            <span className={`workspace-tree-dot ${entry.count > 0 ? 'active' : 'idle'}`} />
                            <span>{entry.id}</span>
                          </span>
                          <span className={`workspace-tree-tag ${entry.count > 0 ? 'active' : 'inactive'}`}>
                            {entry.count > 0 ? `${entry.count} ev` : 'idle'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="workspace-tree-empty">No experts match current filter.</div>
                    )
                  ) : null}

                  {section.key === 'placements' ? (
                    filtering.filteredPlacements.length > 0 ? (
                      filtering.filteredPlacements.map((placement) => (
                        <button
                          key={placement.id}
                          type="button"
                          className={`workspace-tree-item selectable ${placement.id === sceneData.selectedPlacementId ? 'selected' : ''}`}
                          onClick={() =>
                            dispatchFromOutliner({
                              kind: 'set_selected_placement',
                              placementId: placement.id,
                            })
                          }
                        >
                          <span className="workspace-tree-item-main">
                            <span className={`workspace-tree-dot ${placement.id === sceneData.selectedPlacementId ? 'selected' : 'entity'}`} />
                            <span>{placement.assetId}</span>
                          </span>
                          <span className="workspace-tree-item-meta">{placement.id}</span>
                        </button>
                      ))
                    ) : (
                      <div className="workspace-tree-empty">No entities match current filter.</div>
                    )
                  ) : null}

                  {section.key === 'cameras' ? (
                    filtering.filteredCameras.length > 0 ? (
                      filtering.filteredCameras.map((camera) => (
                        <button
                          key={camera.id}
                          type="button"
                          className={`workspace-tree-item selectable ${camera.id === sceneData.selectedMonitoringCameraId ? 'selected' : ''}`}
                          onClick={() =>
                            dispatchFromOutliner({
                              kind: 'set_selected_monitoring_camera',
                              cameraId: camera.id,
                            })
                          }
                        >
                          <span className="workspace-tree-item-main">
                            <span className={`workspace-tree-dot ${camera.id === sceneData.selectedMonitoringCameraId ? 'selected' : 'camera'}`} />
                            <span>{camera.label ?? camera.id}</span>
                          </span>
                          <span className="workspace-tree-item-meta">{camera.id}</span>
                        </button>
                      ))
                    ) : (
                      <div className="workspace-tree-empty">No cameras match current filter.</div>
                    )
                  ) : null}

                  {section.key === 'detections' ? (
                    filtering.detectionsByCamera.length > 0 ? (
                      filtering.detectionsByCamera.map(([cameraId, detections]) => (
                        <div key={cameraId} className="workspace-tree-group">
                          <div className="workspace-tree-group-head">
                            <span>{cameraId}</span>
                            <span>{detections.length}</span>
                          </div>
                          <div className="workspace-tree-group-body">
                            {detections.map((detection) => (
                              <div key={`${detection.cameraId}:${detection.id}`} className="workspace-tree-item">
                                <span className="workspace-tree-item-main">
                                  <span className="workspace-tree-dot detection" />
                                  <span>{detection.trackLabel}</span>
                                </span>
                                <span className="workspace-tree-item-meta">{detection.id}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="workspace-tree-empty">No detections match current filter.</div>
                    )
                  ) : null}
                </div>
              ) : null}
            </div>
          )
        })}

        {selection.selectedPlacement ? (
          <div className="workspace-outliner-inspector">
            <div className="workspace-inspector-head">
              <span className="workspace-inspector-title">{selection.selectedPlacement.id}</span>
              <span className="workspace-inspector-subtitle">
                {selection.selectedPlacement.assetId}
                {selection.selectedPlacement.objectId ? ` | ${selection.selectedPlacement.objectId}` : ''}
              </span>
            </div>
            <div className="workspace-inspector-body">
              <div className="workspace-inspector-row">
                <span className="workspace-inspector-row-label position">Position</span>
                <div className="workspace-inspector-axis-grid">
                  <span className="workspace-inspector-axis-value">
                    <span className="axis axis-x">x</span>
                    <span>{formatFixed(selection.selectedPlacement.planPositionM[0])}</span>
                  </span>
                  <span className="workspace-inspector-axis-value">
                    <span className="axis axis-y">y</span>
                    <span>{formatFixed(selection.selectedPlacement.elevationM ?? 0)}</span>
                  </span>
                  <span className="workspace-inspector-axis-value">
                    <span className="axis axis-z">z</span>
                    <span>{formatFixed(selection.selectedPlacement.planPositionM[1])}</span>
                  </span>
                </div>
              </div>
              <div className="workspace-inspector-row">
                <span className="workspace-inspector-row-label rotation">Rotation</span>
                <div className="workspace-inspector-axis-grid">
                  <span className="workspace-inspector-axis-value">
                    <span className="axis axis-x">x</span>
                    <span>{formatFixed(0)}</span>
                  </span>
                  <span className="workspace-inspector-axis-value">
                    <span className="axis axis-y">y</span>
                    <span>{formatFixed(selection.selectedPlacement.rotationDeg ?? 0)}</span>
                  </span>
                  <span className="workspace-inspector-axis-value">
                    <span className="axis axis-z">z</span>
                    <span>{formatFixed(0)}</span>
                  </span>
                </div>
              </div>
              <div className="workspace-inspector-row">
                <span className="workspace-inspector-row-label scale">Scale</span>
                <div className="workspace-inspector-axis-grid">
                  <span className="workspace-inspector-axis-value">
                    <span className="axis axis-x">x</span>
                    <span>{formatFixed(selection.selectedPlacementSize?.width ?? 1)}</span>
                  </span>
                  <span className="workspace-inspector-axis-value">
                    <span className="axis axis-y">y</span>
                    <span>{formatFixed(selection.selectedPlacementSize?.height ?? 1)}</span>
                  </span>
                  <span className="workspace-inspector-axis-value">
                    <span className="axis axis-z">z</span>
                    <span>{formatFixed(selection.selectedPlacementSize?.depth ?? 1)}</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="workspace-inspector-colors">
              {INSPECTOR_PALETTE.map((color) => (
                <span
                  key={color}
                  className={`workspace-inspector-color ${selection.selectedPlacementAsset?.miniMapColor === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
