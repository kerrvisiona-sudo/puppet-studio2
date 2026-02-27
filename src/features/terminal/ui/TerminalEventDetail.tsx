import type { SceneEventEntry } from '../../../core/observability/sceneEventLog'
import { IconDebug, IconError, IconInfo, IconWarning } from '../../../shared/ui'
import { formatSceneEventTime } from '../model'

function EventLevelIcon({ level }: { level: 'debug' | 'error' | 'info' | 'warn' }) {
  if (level === 'error') return <IconError className="event-level-icon" />
  if (level === 'warn') return <IconWarning className="event-level-icon" />
  if (level === 'debug') return <IconDebug className="event-level-icon" />
  return <IconInfo className="event-level-icon" />
}

type TerminalEventDetailProps = {
  selectedEvent: SceneEventEntry | null
  selectedEventPayload: string
}

export function TerminalEventDetail({ selectedEvent, selectedEventPayload }: TerminalEventDetailProps) {
  return (
    <div className="event-terminal-detail">
      {selectedEvent ? (
        <>
          <div className="event-detail-head">
            <span className={`event-level level-${selectedEvent.level}`} title={selectedEvent.level}>
              <EventLevelIcon level={selectedEvent.level} />
            </span>
            <span>{formatSceneEventTime(selectedEvent.at)}</span>
            <span>{selectedEvent.source}</span>
            <span>{selectedEvent.kind}</span>
            <span>
              scene:{selectedEvent.sceneId ?? '-'} seq:{selectedEvent.sequence ?? '-'} rev:{selectedEvent.revision ?? '-'}
            </span>
          </div>
          <p className="event-detail-summary">{selectedEvent.summary}</p>
          <pre className="event-detail-payload">{selectedEventPayload || '(sin payload)'}</pre>
        </>
      ) : (
        <div className="event-empty">selecciona un evento para ver payload</div>
      )}
    </div>
  )
}
