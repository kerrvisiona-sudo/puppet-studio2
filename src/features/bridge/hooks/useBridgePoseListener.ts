import { useEffect, useRef } from 'react'

import { useBridgeStore, useSceneStore, useAvatarStore, useUiStore } from '../../../app/state'
import { bridgeService } from '../../../services'
import {
  applyBridgeStateActions,
  BridgeSession,
  mapParsedBridgeInboundToActions,
  parseBridgeInboundMessage,
  setBridgeOutboundObserver,
  setBridgeOutboundSender,
  type BridgeStatePort,
} from '../../../core/bridge-runtime'
import { inferSceneEventSource, summarizeSceneEvent } from '../../../core/observability'
import { toBridgeLifecycleSceneEvent } from '../model'

const RECONNECT_MS = 1200

export function useBridgePoseListener() {
  const bridgeEnabled = useBridgeStore((state) => state.bridgeEnabled)
  const bridgeUrl = useBridgeStore((state) => state.bridgeUrl)
  const sceneId = useSceneStore((state) => state.sceneId)
  const sessionRef = useRef<BridgeSession | null>(null)
  const previousEnabledRef = useRef<boolean | null>(null)

  useEffect(() => {
    const appendEvent = useUiStore.getState().appendSceneEvent

    // Create bridge state port using modular stores
    const createBridgePort = (): BridgeStatePort => ({
      applyPoseSnapshot: (payload) => useAvatarStore.getState().applyPoseSnapshot(payload),
      applyScenePatch: (payload) => bridgeService.applyScenePatch(payload),
      applySceneSnapshot: (payload) => bridgeService.applySceneSnapshot(payload),
      setBridgeError: (error) => useBridgeStore.getState().setBridgeError(error),
      setBridgeMeta: (meta) => useBridgeStore.getState().setBridgeMeta(meta),
    })

    const session = new BridgeSession({
      onError: (error) => {
        useBridgeStore.getState().setBridgeError(error)
      },
      onInboundPayload: (payload) => {
        const parsed = parseBridgeInboundMessage(payload)
        if (parsed.type === 'invalid') {
          appendEvent({
            kind: 'bridge_inbound_invalid',
            level: 'warn',
            source: 'bridge.inbound',
            summary: `invalid inbound: ${parsed.reason}`,
          })
          return
        }

        const eventKind =
          parsed.type === 'scene_patch' || parsed.type === 'scene_snapshot' ? parsed.rawKind : parsed.kind

        appendEvent({
          kind: eventKind || 'bridge_message',
          level: parsed.type === 'bridge_error' ? 'error' : 'info',
          message: parsed.message,
          source: inferSceneEventSource(eventKind, parsed.message, 'bridge.inbound'),
          summary: `in ${summarizeSceneEvent(eventKind, parsed.message)}`,
        })

        const actions = mapParsedBridgeInboundToActions(parsed)
        if (actions.length <= 0) return
        applyBridgeStateActions(createBridgePort(), actions)
      },
      onLifecycle: (event) => {
        appendEvent(toBridgeLifecycleSceneEvent(event))
      },
      onStatus: (status) => {
        useBridgeStore.getState().setBridgeStatus(status)
      },
      reconnectMs: RECONNECT_MS,
    })
    sessionRef.current = session

    setBridgeOutboundObserver((payload, sent) => {
      const kind = typeof payload.kind === 'string' ? payload.kind : 'bridge_outbound'
      appendEvent({
        kind,
        level: sent ? 'info' : 'warn',
        message: payload,
        source: inferSceneEventSource(kind, payload, 'frontend.outbound'),
        summary: `${sent ? 'out' : 'out(drop)'} ${summarizeSceneEvent(kind, payload)}`,
      })
    })
    setBridgeOutboundSender((payload) => session.sendPayload(payload))

    return () => {
      session.destroy()
      sessionRef.current = null
      previousEnabledRef.current = null
      setBridgeOutboundObserver(null)
      setBridgeOutboundSender(null)
      useBridgeStore.getState().setBridgeStatus('disconnected')
    }
  }, [])

  useEffect(() => {
    const session = sessionRef.current
    if (!session) return

    session.setSceneId(sceneId)
    session.setUrl(bridgeUrl)

    if (!bridgeEnabled) {
      session.setEnabled(false)
      if (previousEnabledRef.current !== false) {
        useUiStore.getState().appendSceneEvent({
          kind: 'bridge_disabled',
          level: 'info',
          source: 'bridge.lifecycle',
          summary: 'bridge disabled from frontend',
        })
      }
      previousEnabledRef.current = false
      return
    }

    session.setEnabled(true)
    previousEnabledRef.current = true
  }, [bridgeEnabled, bridgeUrl, sceneId])
}
