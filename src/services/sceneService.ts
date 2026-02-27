import { useSceneStore } from '../app/state/sceneStore'
import { useBridgeStore } from '../app/state/bridgeStore'
import { useUiStore } from '../app/state/uiStore'
import { sendBridgePayload } from '../core/bridge-runtime/bridgeOutbound'
import { buildScenePatchFromPlacements } from '../core/scene-domain/scenePatch'
import { runtimeConfig } from '../core/config/runtimeConfig'
import type { SceneCommand } from '../core/scene-domain/sceneCommands'
import type { SceneEngineCommandMeta, SceneEngineEffect, SceneEngineDomainEvent, SceneEngineResult, SceneEngineState } from '../core/scene-domain/sceneEngine'

/**
 * Scene Service
 *
 * Coordina operaciones de scene que involucran múltiples stores.
 * Maneja publicación a bridge y logging de eventos.
 */
export const sceneService = {
  /**
   * Ejecuta un comando de scene y opcionalmente lo publica al bridge
   */
  runCommand(command: SceneCommand, commandMeta?: SceneEngineCommandMeta): SceneEngineResult<SceneEngineState> | undefined {
    const sceneStore = useSceneStore.getState()

    return sceneStore.dispatchCommand(
      { kind: 'run_scene_command', meta: commandMeta, payload: command },
      (effect) => this.handleSceneEffect(effect),
      (events) => this.handleSceneEvents(events),
    )
  },

  /**
   * Limpia la scene actual
   */
  clearScene(commandMeta?: SceneEngineCommandMeta) {
    const sceneStore = useSceneStore.getState()

    sceneStore.dispatchCommand(
      { kind: 'clear_scene', meta: commandMeta },
      (effect) => this.handleSceneEffect(effect),
      (events) => this.handleSceneEvents(events),
    )
  },

  /**
   * Mueve el placement seleccionado
   */
  nudgeSelectedPlacement(deltaXM: number, deltaZM: number) {
    this.runCommand({ kind: 'move_selected_by', deltaM: [deltaXM, deltaZM] })
  },

  /**
   * Rota el placement seleccionado
   */
  rotateSelectedPlacement(deltaDeg: number) {
    this.runCommand({ kind: 'rotate_selected_by', deltaDeg })
  },

  /**
   * Snap a grid del placement seleccionado
   */
  snapSelectedPlacementToGrid(stepM: number) {
    this.runCommand({ kind: 'snap_selected_to_grid', stepM })
  },

  /**
   * Maneja efectos del scene engine (side effects)
   */
  handleSceneEffect(effect: SceneEngineEffect) {
    if (effect.kind === 'publish_scene_patch' && runtimeConfig.publishLocalSceneCommands) {
      const bridgeStore = useBridgeStore.getState()

      if (bridgeStore.bridgeStatus === 'connected') {
        const patch = buildScenePatchFromPlacements(effect.previousPlacements, effect.nextPlacements)
        sendBridgePayload({
          commandMeta: effect.commandMeta,
          kind: 'scene_patch',
          patch,
          sceneId: effect.sceneId,
        })
      }
    }
  },

  /**
   * Maneja eventos del scene engine (para logging/observability)
   */
  handleSceneEvents(events: SceneEngineDomainEvent[]) {
    const uiStore = useUiStore.getState()

    for (const event of events) {
      if (event.kind === 'scene_engine_changed') {
        uiStore.appendSceneEvent({
          kind: 'scene_command_executed',
          level: 'debug',
          source: 'frontend.scene_service',
          summary: `command: ${event.command}`,
        })
      } else if (event.kind === 'scene_engine_rejected') {
        uiStore.appendSceneEvent({
          kind: 'scene_command_rejected',
          level: 'warn',
          source: 'frontend.scene_service',
          summary: `command: ${event.command}, reason: ${event.reason}`,
        })
      }
    }
  },
}
