import type { CommandHistoryEntry } from '../../../app/state/terminalUiStore'
import { formatSceneEventTime } from '../model'

type TerminalCommandHistoryProps = {
  commandHistory: CommandHistoryEntry[]
}

export function TerminalCommandHistory({ commandHistory }: TerminalCommandHistoryProps) {
  return (
    <div className="event-terminal-command-history">
      {commandHistory.length === 0 ? (
        <div className="event-empty">sin comandos ejecutados</div>
      ) : (
        commandHistory
          .slice()
          .reverse()
          .map((entry) => (
            <div key={`${entry.at}-${entry.input}`} className={`command-history-row ${entry.status}`}>
              <span>{formatSceneEventTime(entry.at)}</span>
              <span>{entry.input}</span>
              <span>{entry.message}</span>
              <span>dispatch:{entry.commandsCount}</span>
            </div>
          ))
      )}
    </div>
  )
}
