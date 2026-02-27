import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'

import { isPrimaryShortcut, STUDIO_SHORTCUTS } from '../../../../shared/shortcuts'

export const WORKSPACE_COMMAND_PALETTE_EVENT = 'simula.workspace.command_palette'

import { commandRegistry } from '../../../../core/app-commanding/commandRegistry'
import type { AppCommand } from '../../../../core/app-commanding/appCommandBus'

export type WorkspaceQuickAction = {
  execute: () => void
  group?: string
  id: string
  keywords: string
  label: string
  shortcut?: string
}

type WorkspaceCommandPaletteProps = {
  actions: WorkspaceQuickAction[]
  dispatch: (command: AppCommand) => void
}

function matchesQuery(action: WorkspaceQuickAction, query: string): boolean {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true
  return `${action.label} ${action.keywords}`.toLowerCase().includes(normalized)
}

type WorkspaceCommandPaletteEventDetail = {
  open?: boolean
}

function isTextInputTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tagName = target.tagName
  return tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || target.isContentEditable
}

export function WorkspaceCommandPalette({ actions, dispatch }: WorkspaceCommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const mergedActions = useMemo(() => {
    const list = [...actions]
    const existingIds = new Set(list.map((a) => a.id))
    const existingGroups = new Set(list.map((a) => a.group))

    // Fallback UI categories if none explicitly provided by standard quick actions
    const groupMap: Record<string, string> = {
      scene: 'Scene',
      viewport: 'View',
      ui: 'Layout',
      workspace: 'Layout',
      bridge: 'Bridge',
      engine: 'Engine',
    }

    for (const meta of commandRegistry.list()) {
      // Skip commands already represented by highly-tailored quick actions
      // (like set_camera_view which is expanded into view_iso, view_top, etc)
      if (
        meta.id === 'set_camera_view' ||
        meta.id === 'set_projection_mode' ||
        meta.id === 'set_active_tool' ||
        meta.id === 'apply_workspace_layout_preset' ||
        meta.id === 'run_scene_command' ||
        meta.id === 'set_scene_id' ||
        meta.id === 'set_selected_placement'
      ) {
        continue
      }

      // If the command is not explicitly hand-coded in QuickActions, auto-inject it
      if (!existingIds.has(meta.id)) {
        list.push({
          id: meta.id,
          group: groupMap[meta.category] ?? 'Other',
          label: meta.label,
          keywords: meta.description,
          execute: () => {
            if (meta.fromTerminalArgs) {
              const res = meta.fromTerminalArgs([], {} as any)
              if (res.commands.length > 0) {
                dispatch(res.commands[0])
              }
            } else {
              // Direct parameterless dispatch for simple commands like undo/redo/clear
              dispatch({ kind: meta.id } as any)
            }
          },
        })
      }
    }
    return list
  }, [actions])

  const filteredActions = useMemo(
    () => mergedActions.filter((action) => matchesQuery(action, query)),
    [mergedActions, query],
  )

  const groupedActions = useMemo(() => {
    const order = ['Tools', 'View', 'Scene', 'Layout', 'Widgets', 'Engine', 'Terminal']
    const rank = new Map<string, number>(order.map((label, index) => [label, index]))
    const buckets = new Map<string, WorkspaceQuickAction[]>()
    for (const action of filteredActions) {
      const group = action.group ?? 'Scene'
      const existing = buckets.get(group)
      if (existing) {
        existing.push(action)
      } else {
        buckets.set(group, [action])
      }
    }
    return Array.from(buckets.entries())
      .sort((left, right) => {
        const leftRank = rank.get(left[0]) ?? 999
        const rightRank = rank.get(right[0]) ?? 999
        if (leftRank !== rightRank) return leftRank - rightRank
        return left[0].localeCompare(right[0])
      })
      .map(([group, actionsInGroup]) => ({ actions: actionsInGroup, group }))
  }, [filteredActions])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isPrimaryShortcut(event, 'k')) {
        if (!open && isTextInputTarget(event.target)) return
        event.preventDefault()
        setOpen((current) => !current)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  useEffect(() => {
    const onPaletteEvent = (event: Event) => {
      const paletteEvent = event as CustomEvent<WorkspaceCommandPaletteEventDetail>
      if (typeof paletteEvent.detail?.open === 'boolean') {
        setOpen(paletteEvent.detail.open)
        return
      }
      setOpen((current) => !current)
    }
    window.addEventListener(WORKSPACE_COMMAND_PALETTE_EVENT, onPaletteEvent as EventListener)
    return () => {
      window.removeEventListener(WORKSPACE_COMMAND_PALETTE_EVENT, onPaletteEvent as EventListener)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    setSelectedIndex(0)
    setQuery('')
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [open])

  useEffect(() => {
    if (filteredActions.length === 0) {
      if (selectedIndex !== 0) setSelectedIndex(0)
      return
    }
    if (selectedIndex >= filteredActions.length) {
      setSelectedIndex(filteredActions.length - 1)
    }
  }, [filteredActions.length, selectedIndex])

  const executeSelected = () => {
    const selected = filteredActions[selectedIndex]
    if (!selected) return
    selected.execute()
    setOpen(false)
  }

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      if (filteredActions.length <= 0) return
      event.preventDefault()
      setSelectedIndex((index) => (index + 1) % filteredActions.length)
      return
    }
    if (event.key === 'ArrowUp') {
      if (filteredActions.length <= 0) return
      event.preventDefault()
      setSelectedIndex((index) => (index - 1 + filteredActions.length) % filteredActions.length)
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      executeSelected()
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="workspace-command-palette"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          setOpen(false)
        }
      }}
    >
      <div className="workspace-command-palette-card">
        <div className="workspace-command-palette-head">
          <span>Workspace Command</span>
          <span>{STUDIO_SHORTCUTS.workspace.palette}</span>
        </div>
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search action..."
        />
        <div className="workspace-command-palette-list">
          {filteredActions.length === 0 ? (
            <div className="workspace-command-palette-empty">No actions</div>
          ) : (
            (() => {
              let flatIndex = -1
              return groupedActions.map((group) => (
                <section key={group.group} className="workspace-command-palette-group">
                  <header>{group.group}</header>
                  {group.actions.map((action) => {
                    flatIndex += 1
                    const index = flatIndex
                    return (
                      <button
                        key={action.id}
                        type="button"
                        className={index === selectedIndex ? 'selected' : ''}
                        onMouseEnter={() => setSelectedIndex(index)}
                        onClick={() => {
                          action.execute()
                          setOpen(false)
                        }}
                      >
                        <span>{action.label}</span>
                        <span>{action.shortcut ?? ''}</span>
                      </button>
                    )
                  })}
                </section>
              ))
            })()
          )}
        </div>
      </div>
    </div>
  )
}
