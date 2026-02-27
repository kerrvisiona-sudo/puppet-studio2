import type { RefObject } from 'react'
import { STUDIO_SHORTCUTS } from '../../../shared/shortcuts'

type CommandPaletteItem = {
  name: string
  usage: string
  description: string
}

type TerminalCommandPaletteProps = {
  commandPaletteInputRef: RefObject<HTMLInputElement | null>
  commandPaletteQuery: string
  commandPaletteItems: CommandPaletteItem[]
  commandPaletteSelectedIndex: number
  setCommandPaletteQuery: (value: string) => void
  setCommandPaletteSelectedIndex: (value: number) => void
  handleCommandPaletteKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void
  executePaletteCommand: (commandName: string) => void
}

export function TerminalCommandPalette({
  commandPaletteInputRef,
  commandPaletteQuery,
  commandPaletteItems,
  commandPaletteSelectedIndex,
  setCommandPaletteQuery,
  setCommandPaletteSelectedIndex,
  handleCommandPaletteKeyDown,
  executePaletteCommand,
}: TerminalCommandPaletteProps) {
  return (
    <div className="event-terminal-command-palette">
      <div className="event-terminal-command-palette-head">
        <span>Quick Command</span>
        <span>{STUDIO_SHORTCUTS.terminal.palette}</span>
      </div>
      <input
        ref={commandPaletteInputRef}
        value={commandPaletteQuery}
        onChange={(event) => setCommandPaletteQuery(event.currentTarget.value)}
        onKeyDown={handleCommandPaletteKeyDown}
        placeholder="Type command name or alias..."
      />
      <div className="event-terminal-command-palette-list">
        {commandPaletteItems.length === 0 ? (
          <div className="event-empty">no commands</div>
        ) : (
          commandPaletteItems.map((command, index) => (
            <button
              key={command.name}
              type="button"
              className={`event-terminal-command-palette-item ${index === commandPaletteSelectedIndex ? 'selected' : ''}`}
              onMouseEnter={() => setCommandPaletteSelectedIndex(index)}
              onClick={() => executePaletteCommand(command.name)}
            >
              <span>{command.name}</span>
              <span>{command.usage}</span>
              <span>{command.description}</span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
