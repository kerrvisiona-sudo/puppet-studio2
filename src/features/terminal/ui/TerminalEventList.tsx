import type { RefObject } from 'react'
import type { SceneEventEntry } from '../../../core/observability/sceneEventLog'
import { IconDebug, IconError, IconInfo, IconWarning } from '../../../shared/ui'
import { formatSceneEventTime } from '../model'

function EventLevelIcon({ level }: { level: 'debug' | 'error' | 'info' | 'warn' }) {
  if (level === 'error') return <IconError className="event-level-icon" />
  if (level === 'warn') return <IconWarning className="event-level-icon" />
  if (level === 'debug') return <IconDebug className="event-level-icon" />
  return <IconInfo className="event-level-icon" />
}

type TerminalEventListProps = {
  bodyRef: RefObject<HTMLDivElement | null>
  filteredEvents: SceneEventEntry[]
  selectedEventId: string | null
  setSelectedEventId: (id: string) => void
}

export function TerminalEventList({
  bodyRef,
  filteredEvents,
  selectedEventId,
  setSelectedEventId,
}: TerminalEventListProps) {
  return (
    <div className="event-terminal-body" ref={bodyRef}>
      {filteredEvents.length === 0 ? (
        <div className="event-empty">sin eventos con filtros actuales</div>
      ) : (
        filteredEvents.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={`event-row level-${entry.level} ${entry.id === selectedEventId ? 'selected' : ''}`}
            onClick={() => setSelectedEventId(entry.id)}
          >
            <span className={`event-level level-${entry.level}`} title={entry.level}>
              <EventLevelIcon level={entry.level} />
            </span>
            <span className="event-time">{formatSceneEventTime(entry.at)}</span>
            <span className="event-source">{entry.source}</span>
            <span className="event-kind">{entry.kind}</span>
            <span className="event-summary">{entry.summary}</span>
            <span className="event-meta">
              scene:{entry.sceneId ?? '-'} seq:{entry.sequence ?? '-'} rev:{entry.revision ?? '-'}
            </span>
          </button>
        ))
      )}
    </div>
  )
}
