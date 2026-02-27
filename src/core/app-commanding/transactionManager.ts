import type { AppCommandEnvelope } from './appCommandBus'
import type { UndoResult } from './appCommandBus'
import type {
  Transaction,
  TransactionId,
  TransactionOptions,
  TransactionResult,
  TransactionEntry,
} from './transactionTypes'
import { useUiStore } from '../../app/state/uiStore'
import { undoManager } from './undoManager'

/**
 * Transaction Manager - Singleton
 *
 * Manages command transactions for grouping multiple commands into single undo units.
 * Supports nested transactions (inner transactions merge into outermost).
 */

let activeTransaction: Transaction | null = null
let transactionSequence = 0

function generateTransactionId(): TransactionId {
  transactionSequence += 1
  return `tx-${transactionSequence}`
}

function emitTransactionEvent(
  kind: 'transaction_begin' | 'transaction_commit' | 'transaction_rollback',
  transaction: Transaction,
) {
  const uiStore = useUiStore.getState()

  if (kind === 'transaction_begin') {
    uiStore.appendSceneEvent({
      kind: 'transaction_begin',
      level: 'debug',
      message: {
        transactionId: transaction.id,
        label: transaction.label,
        source: transaction.source,
      },
      source: 'frontend.transaction',
      summary: `[tx:${transaction.label}] begin`,
    })
  } else if (kind === 'transaction_commit') {
    const durationMs = transaction.completedAt
      ? new Date(transaction.completedAt).getTime() - new Date(transaction.startedAt).getTime()
      : 0

    uiStore.appendSceneEvent({
      kind: 'transaction_commit',
      level: 'info',
      message: {
        transactionId: transaction.id,
        label: transaction.label,
        commandCount: transaction.entries.length,
        durationMs,
      },
      source: 'frontend.transaction',
      summary: `[tx:${transaction.label}] commit (${transaction.entries.length} commands)`,
    })
  } else if (kind === 'transaction_rollback') {
    uiStore.appendSceneEvent({
      kind: 'transaction_rollback',
      level: 'warn',
      message: {
        transactionId: transaction.id,
        label: transaction.label,
        commandCount: transaction.entries.length,
      },
      source: 'frontend.transaction',
      summary: `[tx:${transaction.label}] rollback`,
    })
  }
}

export const transactionManager = {
  /**
   * Start a new transaction (or join existing if nested)
   */
  start(options: TransactionOptions): TransactionId {
    if (activeTransaction) {
      // Nested transaction: return same ID, increment depth
      activeTransaction.depth += 1
      return activeTransaction.id
    }

    const id = generateTransactionId()
    activeTransaction = {
      id,
      label: options.label,
      source: options.source ?? 'ui.transaction',
      correlationId: options.correlationId ?? null,
      status: 'active',
      entries: [],
      startedAt: new Date().toISOString(),
      completedAt: null,
      depth: 0,
    }

    // Emit transaction_begin event
    emitTransactionEvent('transaction_begin', activeTransaction)

    return id
  },

  /**
   * Commit transaction - push composite undo entry
   */
  commit(id: TransactionId): TransactionResult {
    if (!activeTransaction || activeTransaction.id !== id) {
      throw new Error(`No active transaction with id ${id}`)
    }

    // If nested, decrement depth and return
    if (activeTransaction.depth > 0) {
      activeTransaction.depth -= 1
      return {
        transactionId: id,
        status: 'committed',
        commandCount: activeTransaction.entries.length,
        label: activeTransaction.label,
      }
    }

    // Root transaction: finalize
    activeTransaction.status = 'committed'
    activeTransaction.completedAt = new Date().toISOString()

    // Push composite undo entry if there are undoable commands
    const undoableEntries = activeTransaction.entries
      .filter((e) => e.undoResult !== null)
      .map((e) => ({ envelope: e.envelope, undoResult: e.undoResult! }))

    if (undoableEntries.length > 0) {
      undoManager.pushTransaction({
        transactionId: id,
        transactionLabel: activeTransaction.label,
        envelope: activeTransaction.entries[0].envelope,
        entries: undoableEntries,
      })
    }

    // Emit transaction_commit event
    emitTransactionEvent('transaction_commit', activeTransaction)

    const result: TransactionResult = {
      transactionId: id,
      status: 'committed',
      commandCount: activeTransaction.entries.length,
      label: activeTransaction.label,
    }

    activeTransaction = null
    return result
  },

  /**
   * Rollback transaction - execute undos, discard entries
   */
  rollback(id: TransactionId): TransactionResult {
    if (!activeTransaction || activeTransaction.id !== id) {
      throw new Error(`No active transaction with id ${id}`)
    }

    // Even if nested, rollback clears everything
    activeTransaction.status = 'rolled_back'
    activeTransaction.completedAt = new Date().toISOString()

    // Execute undos in reverse order
    for (let i = activeTransaction.entries.length - 1; i >= 0; i--) {
      const entry = activeTransaction.entries[i]
      if (entry.undoResult) {
        entry.undoResult.undo()
      }
    }

    // Emit transaction_rollback event
    emitTransactionEvent('transaction_rollback', activeTransaction)

    const result: TransactionResult = {
      transactionId: id,
      status: 'rolled_back',
      commandCount: activeTransaction.entries.length,
      label: activeTransaction.label,
    }

    activeTransaction = null
    return result
  },

  /**
   * Check if currently inside a transaction
   */
  isActive(): boolean {
    return activeTransaction !== null
  },

  /**
   * Get current transaction (if any)
   */
  current(): Transaction | null {
    return activeTransaction
  },

  /**
   * Record command dispatched during transaction
   */
  recordCommand(envelope: AppCommandEnvelope, undoResult: UndoResult | null, reflectedLine: string | null): void {
    if (!activeTransaction) {
      throw new Error('No active transaction to record command')
    }

    const entry: TransactionEntry = {
      envelope,
      undoResult,
      reflectedLine,
    }

    activeTransaction.entries.push(entry)
  },

  /**
   * Get transaction by ID (for inspection)
   */
  get(id: TransactionId): Transaction | null {
    if (activeTransaction?.id === id) return activeTransaction
    return null
  },

  /**
   * Get all entries from current transaction (for undo manager integration)
   */
  getEntries(): TransactionEntry[] {
    return activeTransaction?.entries ?? []
  },
}
