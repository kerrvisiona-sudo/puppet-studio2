import { transactionManager } from './transactionManager'
import type { Transaction, TransactionId, TransactionOptions, TransactionResult } from './transactionTypes'

/**
 * Transaction API - Public Interface
 *
 * Use transactions to group multiple commands into a single undoable unit.
 *
 * @example Explicit API (for pointer events)
 * ```ts
 * const txId = startTransaction({ label: 'drag-placement' })
 * // ... dispatch commands during drag ...
 * commitTransaction(txId)
 * ```
 *
 * @example HOF API (for synchronous operations)
 * ```ts
 * withTransaction({ label: 'batch-move' }, () => {
 *   dispatchCommand(...)
 *   dispatchCommand(...)
 * })
 * ```
 */

/**
 * Start a new transaction (or join existing if nested)
 *
 * @returns Transaction ID - pass to commitTransaction() or rollbackTransaction()
 */
export function startTransaction(options: TransactionOptions): TransactionId {
  return transactionManager.start(options)
}

/**
 * Commit transaction - finalize and push to undo stack
 *
 * @throws Error if no active transaction with given ID
 */
export function commitTransaction(id: TransactionId): TransactionResult {
  return transactionManager.commit(id)
}

/**
 * Rollback transaction - execute undos and discard
 *
 * @throws Error if no active transaction with given ID
 */
export function rollbackTransaction(id: TransactionId): TransactionResult {
  return transactionManager.rollback(id)
}

/**
 * Execute function within a transaction context
 *
 * Automatically commits on success, rolls back on error.
 *
 * @example
 * ```ts
 * withTransaction({ label: 'batch-delete' }, () => {
 *   items.forEach(item => dispatchCommand({ kind: 'delete_item', id: item.id }))
 * })
 * ```
 */
export function withTransaction<T>(options: TransactionOptions, fn: () => T): T {
  const txId = transactionManager.start(options)
  try {
    const result = fn()
    transactionManager.commit(txId)
    return result
  } catch (error) {
    transactionManager.rollback(txId)
    throw error
  }
}

/**
 * Check if currently inside a transaction
 */
export function isInTransaction(): boolean {
  return transactionManager.isActive()
}

/**
 * Get current transaction (if any)
 */
export function getCurrentTransaction(): Transaction | null {
  return transactionManager.current()
}
