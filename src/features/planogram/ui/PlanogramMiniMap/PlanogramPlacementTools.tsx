import { usePlanogramPlacementTools, PLANOGRAM_COMMAND_CONFIG } from '../../hooks/split/usePlanogramPlacementTools'

function formatNullable(value: number | string | null): string {
  if (value === null || value === '') return '-'
  return String(value)
}

export function PlanogramPlacementTools() {
  const {
    selectedPlacement,
    selectedAsset,
    selectedSize,
    showDimensions,
    sceneEditEnabled,
    sceneUndoDepth,
    sceneRedoDepth,
    sceneError,
    dispatchFromPlanogram,
  } = usePlanogramPlacementTools()

  const { moveStepM, rotateStepDeg, snapStepM } = PLANOGRAM_COMMAND_CONFIG

  return (
    <div className="placement-tools">
      <div className="placement-tools-head">
        <p className="placement-selection">
          {selectedPlacement && selectedAsset && selectedSize
            ? `${selectedAsset.label} • x:${selectedPlacement.planPositionM[0].toFixed(2)} z:${selectedPlacement.planPositionM[1].toFixed(2)} • rot:${(
                selectedPlacement.rotationDeg ?? 0
              ).toFixed(0)}° • ${selectedSize.width.toFixed(2)}x${selectedSize.depth.toFixed(2)}x${selectedSize.height.toFixed(2)}m${
                selectedPlacement.trackId ? ` • track:${selectedPlacement.trackId}` : ''
              }${selectedPlacement.objectId ? ` • object:${selectedPlacement.objectId}` : ''}`
            : 'Selecciona un mueble en el minimapa'}
        </p>
        <button
          type="button"
          className={showDimensions ? 'active' : ''}
          onClick={() => dispatchFromPlanogram({ kind: 'set_show_dimensions', show: !showDimensions })}
        >
          Cotas
        </button>
      </div>
      <div className="placement-command-grid">
        <button
          type="button"
          disabled={!sceneEditEnabled || !selectedPlacement}
          onClick={() =>
            dispatchFromPlanogram({
              kind: 'run_scene_command',
              command: { kind: 'move_selected_by', deltaM: [0, moveStepM] },
            })
          }
        >
          ↑
        </button>
        <button
          type="button"
          disabled={!sceneEditEnabled || !selectedPlacement}
          onClick={() =>
            dispatchFromPlanogram({
              kind: 'run_scene_command',
              command: { kind: 'move_selected_by', deltaM: [-moveStepM, 0] },
            })
          }
        >
          ←
        </button>
        <button
          type="button"
          disabled={!sceneEditEnabled || !selectedPlacement}
          onClick={() =>
            dispatchFromPlanogram({
              kind: 'run_scene_command',
              command: { kind: 'move_selected_by', deltaM: [moveStepM, 0] },
            })
          }
        >
          →
        </button>
        <button
          type="button"
          disabled={!sceneEditEnabled || !selectedPlacement}
          onClick={() =>
            dispatchFromPlanogram({
              kind: 'run_scene_command',
              command: { kind: 'move_selected_by', deltaM: [0, -moveStepM] },
            })
          }
        >
          ↓
        </button>
        <button
          type="button"
          disabled={!sceneEditEnabled || !selectedPlacement}
          onClick={() =>
            dispatchFromPlanogram({
              kind: 'run_scene_command',
              command: { kind: 'rotate_selected_by', deltaDeg: -rotateStepDeg },
            })
          }
        >
          ⟲ {rotateStepDeg}°
        </button>
        <button
          type="button"
          disabled={!sceneEditEnabled || !selectedPlacement}
          onClick={() =>
            dispatchFromPlanogram({
              kind: 'run_scene_command',
              command: { kind: 'rotate_selected_by', deltaDeg: rotateStepDeg },
            })
          }
        >
          ⟳ {rotateStepDeg}°
        </button>
        <button
          type="button"
          disabled={!sceneEditEnabled || !selectedPlacement}
          onClick={() =>
            dispatchFromPlanogram({
              kind: 'run_scene_command',
              command: { kind: 'snap_selected_to_grid', stepM: snapStepM },
            })
          }
        >
          Snap {(snapStepM * 100).toFixed(0)}cm
        </button>
        <button
          type="button"
          disabled={!sceneEditEnabled || sceneUndoDepth <= 0}
          onClick={() => dispatchFromPlanogram({ kind: 'undo_scene_edit' })}
        >
          Undo ({sceneUndoDepth})
        </button>
        <button
          type="button"
          disabled={!sceneEditEnabled || sceneRedoDepth <= 0}
          onClick={() => dispatchFromPlanogram({ kind: 'redo_scene_edit' })}
        >
          Redo ({sceneRedoDepth})
        </button>
      </div>
      <p className="placement-grid-step">
        Comandos locales: mover ±{moveStepM.toFixed(2)}m, rotar ±{rotateStepDeg}°, snap {snapStepM.toFixed(2)}m.
      </p>
      <p className="placement-grid-step">
        Atajos: WASD mover, Q/E rotar, Ctrl/Cmd+Z undo, Ctrl/Cmd+Y redo. Shift acelera pasos.
      </p>
      <p className="placement-grid-step">
        Restricciones: zonas sombreadas bloquean solape del asset seleccionado.
      </p>
      {sceneError ? <p className="bridge-error">{sceneError}</p> : null}
    </div>
  )
}
