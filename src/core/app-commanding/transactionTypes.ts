import type { AppCommandEnvelope } from './appCommandBus'
import type { UndoResult } from './appCommandBus'

/**
 * Transaction System Types
 *
 * Enables grouping multiple commands into a single undoable unit.
 * Use cases: drag operations (60 micro-moves = 1 undo), slider changes.
 */

export type TransactionId = string

export type TransactionStatus = 'active' | 'committed' | 'rolled_back'

export type TransactionOptions = {
  /** Human-readable label for terminal/undo display */
  label: string
  /** Source identifier for tracking (e.g., 'ui.drag', 'ui.slider') */
  source?: string
  /** Correlation ID for distributed tracing */
  correlationId?: string | null
}

export type TransactionEntry = {
  /** Command envelope that was dispatched */
  envelope: AppCommandEnvelope
  /** Undo result if command is undoable */
  undoResult: UndoResult | null
  /** Terminal reflection line (for collapsed display) */
  reflectedLine: string | null
}

export type Transaction = {
  id: TransactionId
  label: string
  source: string
  correlationId: string | null
  status: TransactionStatus
  /** Commands buffered during this transaction */
  entries: TransactionEntry[]
  startedAt: string
  completedAt: string | null
  /** Nested transaction depth (0 = root) */
  depth: number
}

export type TransactionResult = {
  transactionId: TransactionId
  status: 'committed' | 'rolled_back'
  commandCount: number
  label: string
}

/**
 * Composite undo entry for UndoManager
 * Represents a completed transaction as a single undo/redo unit
 */
export type TransactionUndoEntry = {
  transactionId: TransactionId
  transactionLabel: string
  /** First command's envelope (for metadata) */
  envelope: AppCommandEnvelope
  /** All undoable entries in the transaction */
  entries: Array<{
    envelope: AppCommandEnvelope
    undoResult: UndoResult
  }>
}

/**
 * Type guard for TransactionUndoEntry
 */
export function isTransactionUndoEntry(
  entry: { envelope: AppCommandEnvelope; undoResult: UndoResult } | TransactionUndoEntry,
): entry is TransactionUndoEntry {
  return 'transactionId' in entry
}
