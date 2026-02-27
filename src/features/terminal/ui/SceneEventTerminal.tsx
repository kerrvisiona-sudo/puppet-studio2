import { runtimeConfig } from '../../../core/config'
import { STUDIO_SHORTCUTS } from '../../../shared/shortcuts'
import { useSceneEventTerminalState } from '../hooks'
import { TerminalCommandInput } from './TerminalCommandInput'
import { TerminalCommandPalette } from './TerminalCommandPalette'
import { TerminalFilterToolbar } from './TerminalFilterToolbar'
import { TerminalEventList } from './TerminalEventList'
import { TerminalEventDetail } from './TerminalEventDetail'
import { TerminalCommandHistory } from './TerminalCommandHistory'

type SceneEventTerminalLayout = 'docked' | 'overlay'

type SceneEventTerminalProps = {
  layout?: SceneEventTerminalLayout
}

export function SceneEventTerminal({ layout = 'overlay' }: SceneEventTerminalProps) {
  const {
    bodyRef,
    commandHistory,
    commandHistoryExpanded,
    commandInput,
    commandInputRef,
    commandPaletteInputRef,
    commandPaletteItems,
    commandPaletteOpen,
    commandPaletteQuery,
    commandPaletteSelectedIndex,
    commandSuggestions,
    dynamicInputEnabled,
    dispatchFromTerminal,
    executePaletteCommand,
    executeTerminalCommand,
    filteredEvents,
    filterOptions,
    handleCommandPaletteKeyDown,
    handleCommandInputKeyDown,
    kindFilter,
    levelFilter,
    sceneEventAutoScroll,
    sceneEventDroppedWhilePaused,
    sceneEventLog,
    sceneEventLogPaused,
    sceneEventTerminalOpen,
    sceneFilter,
    searchFilter,
    selectedEvent,
    selectedEventPayload,
    setKindFilter,
    setLevelFilter,
    setCommandPaletteOpen,
    setCommandPaletteQuery,
    setCommandPaletteSelectedIndex,
    setSceneFilter,
    setSearchFilter,
    setSelectedEventId,
    setSourceFilter,
    setCommandHistoryExpanded,
    setCommandInput,
    sourceFilter,
  } = useSceneEventTerminalState()

  return (
    <section
      className={`event-terminal ${layout} ${sceneEventTerminalOpen ? 'open' : 'closed'} ${
        commandHistoryExpanded ? 'history-expanded' : ''
      }`}
    >
      <div className="event-terminal-head">
        <button
          type="button"
          className="event-terminal-toggle"
          onClick={() => dispatchFromTerminal({ kind: 'toggle_scene_event_terminal' })}
        >
          {sceneEventTerminalOpen ? 'Terminal ▾' : 'Terminal ▸'}
        </button>
        <span className="event-terminal-count">events: {sceneEventLog.length}</span>
        {sceneEventDroppedWhilePaused > 0 ? (
          <span className="event-terminal-count">dropped: {sceneEventDroppedWhilePaused}</span>
        ) : null}
        <button
          type="button"
          className="event-terminal-head-button"
          onClick={() => setCommandHistoryExpanded(!commandHistoryExpanded)}
          title={`Toggle command history (${STUDIO_SHORTCUTS.terminal.transcript})`}
        >
          History {commandHistoryExpanded ? '▾' : '▸'}
        </button>
        <span className="event-terminal-count">
          dynamic: {dynamicInputEnabled ? 'on' : 'off'} ({STUDIO_SHORTCUTS.terminal.dynamicInput})
        </span>
        <button
          type="button"
          className="event-terminal-head-button"
          onClick={() => setCommandPaletteOpen(!commandPaletteOpen)}
          title={`Quick command palette (${STUDIO_SHORTCUTS.terminal.palette})`}
        >
          Cmd {commandPaletteOpen ? '▾' : '▸'}
        </button>
      </div>
      {commandPaletteOpen ? (
        <TerminalCommandPalette
          commandPaletteInputRef={commandPaletteInputRef}
          commandPaletteQuery={commandPaletteQuery}
          commandPaletteItems={commandPaletteItems}
          commandPaletteSelectedIndex={commandPaletteSelectedIndex}
          setCommandPaletteQuery={setCommandPaletteQuery}
          setCommandPaletteSelectedIndex={setCommandPaletteSelectedIndex}
          handleCommandPaletteKeyDown={handleCommandPaletteKeyDown}
          executePaletteCommand={executePaletteCommand}
        />
      ) : null}
      {sceneEventTerminalOpen ? (
        <>
          <TerminalFilterToolbar
            sourceFilter={sourceFilter}
            kindFilter={kindFilter}
            sceneFilter={sceneFilter}
            levelFilter={levelFilter}
            searchFilter={searchFilter}
            sceneEventLogPaused={sceneEventLogPaused}
            sceneEventAutoScroll={sceneEventAutoScroll}
            filterOptions={filterOptions}
            setSourceFilter={setSourceFilter}
            setKindFilter={setKindFilter}
            setSceneFilter={setSceneFilter}
            setLevelFilter={setLevelFilter}
            setSearchFilter={setSearchFilter}
            dispatchFromTerminal={dispatchFromTerminal}
          />
          <TerminalCommandInput
            commandInput={commandInput}
            commandSuggestions={commandSuggestions}
            inputRef={commandInputRef}
            mode={runtimeConfig.terminalCommandInputRenderer}
            onExecute={() => executeTerminalCommand(commandInput)}
            onHelp={() => setCommandInput('help')}
            onInputChange={setCommandInput}
            onInputKeyDown={handleCommandInputKeyDown}
            onSuggestionSelect={(suggestion) => setCommandInput(`${suggestion} `)}
          />
          <div className="event-terminal-content">
            <TerminalEventList
              bodyRef={bodyRef}
              filteredEvents={filteredEvents}
              selectedEventId={selectedEvent?.id ?? null}
              setSelectedEventId={setSelectedEventId}
            />
            <TerminalEventDetail selectedEvent={selectedEvent} selectedEventPayload={selectedEventPayload} />
          </div>
          {commandHistoryExpanded ? <TerminalCommandHistory commandHistory={commandHistory} /> : null}
        </>
      ) : null}
    </section>
  )
}
