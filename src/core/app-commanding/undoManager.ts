import { type AppCommandEnvelope, type UndoResult } from './appCommandBus'
import { type TransactionUndoEntry, isTransactionUndoEntry } from './transactionTypes'

export type UndoEntry = {
    envelope: AppCommandEnvelope
    undoResult: UndoResult
}

type UndoStackEntry = UndoEntry | TransactionUndoEntry

class UndoManagerClass {
    private undoStack: UndoStackEntry[] = []
    private redoStack: UndoStackEntry[] = []

    push(entry: UndoEntry) {
        this.undoStack.push(entry)
        this.redoStack = [] // Clear redo stack on new action
    }

    /** Push a completed transaction as single undo entry */
    pushTransaction(entry: TransactionUndoEntry) {
        this.undoStack.push(entry)
        this.redoStack = [] // Clear redo stack on new action
    }

    undo() {
        const entry = this.undoStack.pop()
        if (!entry) return

        if (isTransactionUndoEntry(entry)) {
            // Undo all entries in reverse order
            for (let i = entry.entries.length - 1; i >= 0; i--) {
                entry.entries[i].undoResult.undo()
            }
        } else {
            entry.undoResult.undo()
        }

        this.redoStack.push(entry)
    }

    redo() {
        const entry = this.redoStack.pop()
        if (!entry) return

        if (isTransactionUndoEntry(entry)) {
            // Redo all entries in order
            for (const subEntry of entry.entries) {
                subEntry.undoResult.redo()
            }
        } else {
            entry.undoResult.redo()
        }

        this.undoStack.push(entry)
    }

    clear() {
        this.undoStack = []
        this.redoStack = []
    }

    get state() {
        return {
            undoCount: this.undoStack.length,
            redoCount: this.redoStack.length,
        }
    }
}

export const undoManager = new UndoManagerClass()
