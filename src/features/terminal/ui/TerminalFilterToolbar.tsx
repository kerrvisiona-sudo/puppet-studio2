import type { SceneEventLevel } from '../../../core/observability/sceneEventLog'

type TerminalFilterToolbarProps = {
  sourceFilter: string
  kindFilter: string
  sceneFilter: string
  levelFilter: SceneEventLevel | 'all'
  searchFilter: string
  sceneEventLogPaused: boolean
  sceneEventAutoScroll: boolean
  filterOptions: {
    sources: string[]
    kinds: string[]
    scenes: string[]
  }
  setSourceFilter: (value: string) => void
  setKindFilter: (value: string) => void
  setSceneFilter: (value: string) => void
  setLevelFilter: (value: SceneEventLevel | 'all') => void
  setSearchFilter: (value: string) => void
  dispatchFromTerminal: (command: any) => void
}

export function TerminalFilterToolbar({
  sourceFilter,
  kindFilter,
  sceneFilter,
  levelFilter,
  searchFilter,
  sceneEventLogPaused,
  sceneEventAutoScroll,
  filterOptions,
  setSourceFilter,
  setKindFilter,
  setSceneFilter,
  setLevelFilter,
  setSearchFilter,
  dispatchFromTerminal,
}: TerminalFilterToolbarProps) {
  return (
    <div className="event-terminal-toolbar">
      <label>
        source
        <select value={sourceFilter} onChange={(event) => setSourceFilter(event.currentTarget.value)}>
          <option value="all">all</option>
          {filterOptions.sources.map((source) => (
            <option key={source} value={source}>
              {source}
            </option>
          ))}
        </select>
      </label>
      <label>
        kind
        <select value={kindFilter} onChange={(event) => setKindFilter(event.currentTarget.value)}>
          <option value="all">all</option>
          {filterOptions.kinds.map((kind) => (
            <option key={kind} value={kind}>
              {kind}
            </option>
          ))}
        </select>
      </label>
      <label>
        scene
        <select value={sceneFilter} onChange={(event) => setSceneFilter(event.currentTarget.value)}>
          <option value="all">all</option>
          {filterOptions.scenes.map((sceneId) => (
            <option key={sceneId} value={sceneId}>
              {sceneId}
            </option>
          ))}
        </select>
      </label>
      <label>
        level
        <select value={levelFilter} onChange={(event) => setLevelFilter(event.currentTarget.value as typeof levelFilter)}>
          <option value="all">all</option>
          <option value="error">error</option>
          <option value="warn">warn</option>
          <option value="info">info</option>
          <option value="debug">debug</option>
        </select>
      </label>
      <label className="event-terminal-search">
        find
        <input
          value={searchFilter}
          onChange={(event) => setSearchFilter(event.currentTarget.value)}
          placeholder="scene, source, kind..."
        />
      </label>
      <button
        type="button"
        onClick={() =>
          dispatchFromTerminal({
            kind: 'set_scene_event_log_paused',
            enabled: !sceneEventLogPaused,
          })
        }
      >
        {sceneEventLogPaused ? 'Resume' : 'Pause'}
      </button>
      <button
        type="button"
        onClick={() =>
          dispatchFromTerminal({
            kind: 'set_scene_event_auto_scroll',
            enabled: !sceneEventAutoScroll,
          })
        }
      >
        Auto {sceneEventAutoScroll ? 'On' : 'Off'}
      </button>
      <button type="button" onClick={() => dispatchFromTerminal({ kind: 'clear_scene_event_log' })}>
        Clear
      </button>
    </div>
  )
}
