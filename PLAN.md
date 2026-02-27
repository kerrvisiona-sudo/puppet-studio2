# Revisión Arquitectónica - Puppet Studio

## Contexto Actualizado

- **Command Bus es intencional** - Patrón tipo AutoCAD donde todo es un comando (UI + shell)
- **Crecimiento alto anticipado** - Muchos features por venir
- **Pain point actual**: Re-renders excesivos

---

## Estado Actual: Mi Opinión Honesta

### Lo Que Está Bien Hecho

1. **Migración de poseStore exitosa** - El monolito de ~1040 líneas fue correctamente dividido en 6 stores focalizados (~688 líneas total). Esto es un win claro.

2. **Stores completamente aislados** - Cero importaciones directas entre stores. La comunicación pasa por el service layer. Esto es textbook correcto.

3. **Domain modules puros** - `scene-domain/` y `planogram-domain/` contienen lógica pura, sin side effects ni dependencias de React. Fácil de testear.

4. **Command bus como abstracción** - `poseStoreCommandBus` provee una API unificada que oculta la complejidad de coordinación.

5. **FSD generalmente respetado** - Estructura `hooks/model/ui` consistente, sin dependencias circulares entre features.

---

## Decisiones Que Pueden "Ahogar la Rey"

### 1. Verbosidad de Selectors (Problema Crítico)

```typescript
// useSceneEventTerminalState.ts - 53 selectores individuales
const activeToolMode = useUiStore((state) => state.activeToolMode)
const sceneEventAutoScroll = useUiStore((state) => state.sceneEventAutoScroll)
const sceneEventDroppedWhilePaused = useUiStore((state) => state.sceneEventDroppedWhilePaused)
// ... 50 más
```

**El problema**: Cada nuevo estado = más boilerplate. Escala mal. El hook `useSceneEventTerminalState` tiene 393 líneas, la mayoría son selectores.

**Riesgo futuro**: A medida que crezcan los features, los hooks de estado se volverán inmanejables.

**Solución recomendada**:
```typescript
// Con shallow de Zustand
const { sourceFilter, kindFilter, sceneFilter } = useTerminalUiStore(
  useShallow(state => pick(state, ['sourceFilter', 'kindFilter', 'sceneFilter']))
)
```

---

### 2. Command Bus como Facade Legacy

El `poseStoreCommandBus` mantiene compatibilidad con el nombre "poseStore" aunque el store ya no existe. Son 343 líneas de indirección.

**Riesgo**: Añade una capa de abstracción que puede o no ser necesaria a largo plazo. ¿Los componentes realmente necesitan una API de comandos o podrían usar los services directamente?

**Mi opinión**: El command bus tiene valor para operaciones que requieren logging/observabilidad uniforme. Pero debería renombrarse a `appCommandBus` y evaluar si todos los 25+ comandos necesitan esta indirección.

---

### 3. Service Layer Sin Inyección de Dependencias

```typescript
// sceneService.ts
export const sceneService = {
  runCommand(command) {
    const sceneStore = useSceneStore.getState() // Acceso directo
    sceneStore.dispatchCommand(...)
  }
}
```

**Riesgo**: Dificulta testing unitario. No puedes mockear stores fácilmente.

**Solución recomendada**: Considerar patrón de inyección:
```typescript
export const createSceneService = (stores: StoreRefs) => ({
  runCommand(command) {
    stores.scene.getState().dispatchCommand(...)
  }
})
```

---

### 4. ~~Fragmentación Excesiva de Stores~~ (REVISADO - No es problema)

Los 6 stores separados **son bounded contexts de DDD correctos**:
- `viewportStore` → Contexto de visualización
- `bridgeStore` → Contexto de sincronización remota
- `avatarStore` → Contexto de pose/avatar
- `sceneStore` → Contexto de geometría/planogram
- `uiStore` → Contexto de interfaz general
- `terminalUiStore` → Contexto de terminal (subdominio de UI)

**Decisión**: Mantener stores separados. La aparición de `terminalUiStore` es crecimiento natural del dominio, no fragmentación arbitraria.

---

### 5. Business Logic Leak en Hooks

```typescript
// useSceneEventTerminalState.ts líneas 150-186
const executeTerminalCommand = useCallback((input: string) => {
  // Lógica de parsing, ejecución, manejo de historial...
  // Esto debería estar en un terminalService
}, [...])
```

**Riesgo**: La lógica de negocio dispersa en hooks es difícil de testear y reusar.

---

### 6. poseControls.ts en Root

`src/poseControls.ts` es importado por múltiples features pero está en el root del src/ en vez de en `core/pose-domain/` o `shared/`.

---

## Recomendaciones de Diseño (Actualizadas)

### Prioridad Alta

1. **`useShallow` + selector factories** - Reduce verbosidad 60-70% en hooks

2. **Jotai para estado derivado** - Para computed state cross-store que va a crecer

3. **Command Registry Pattern** - Evolucionar de union types a registro dinámico

4. **Renombrar `poseStoreCommandBus` → `appCommandBus`** - Eliminar naming legacy

### Prioridad Media

5. **Mover lógica de `executeTerminalCommand` a `terminalService`**

6. **Mover `poseControls.ts` a `core/pose-domain/`**

7. **Añadir factory pattern para services** - Facilitar testing

### Arquitectura a Largo Plazo (AutoCAD-style)

8. **Undo generalizado** - Extender más allá de scene geometry

9. **Macro recording** - Grabar/reproducir secuencias de comandos

10. **Plugin system** - Extensibilidad via command registry

---

## Archivos Críticos Identificados

| Archivo | Líneas | Acción |
|---------|--------|--------|
| `src/features/terminal/hooks/useSceneEventTerminalState.ts` | 393 | Aplicar useShallow + extraer lógica a service |
| `src/features/planogram/hooks/usePlanogramMiniMapState.ts` | ~80 | Aplicar useShallow |
| `src/core/app-commanding/poseStoreCommandBus.ts` | 343 | Renombrar a appCommandBus + integrar registry |
| `src/features/terminal/model/terminalCommandLine.ts` | ~200 | Derivar de command registry |
| `src/poseControls.ts` | ~150 | Mover a `core/pose-domain/` |

---

---

## Análisis del Command Bus Actual

### Fortalezas (Bien Diseñado)

1. **Dispatch path uniforme** - UI, terminal, hotkeys pasan por `dispatchPoseStoreCommand`
2. **Command envelope con metadata** - id, timestamp, source, correlationId
3. **Reflection bidireccional** - Comandos pueden echarse como strings de terminal
4. **Capability interception** - Hooks pre-dispatch para concerns transversales
5. **Logging automático** - Todos los comandos van al event log

### Limitaciones Para Escalar (AutoCAD-style)

| Limitación | Impacto |
|------------|---------|
| **No hay Command Registry** | Comandos definidos como union type estático, no registro dinámico |
| **No hay Command Metadata** | No hay schema de parámetros, help text, `undoable` flag por comando |
| **Terminal commands duplicados** | `terminalCommandLine.ts` re-implementa parsing en vez de derivar del registro |
| **Undo parcial** | Solo scene geometry es undoable; viewport/UI no |
| **No hay macros** | No se pueden grabar/reproducir secuencias de comandos |

---

## Patrones CAD Recomendados

### 1. Command Registry Pattern (Recomendado)

En vez de:
```typescript
// Actual - union type estático
export type AppCommand =
  | { kind: 'set_camera_view'; view: AppCameraView }
  | { kind: 'undo_scene_edit' }
  // ... 30+ más
```

Evolucionar a:
```typescript
// Command Registry
interface CommandDefinition<TParams = void> {
  id: string
  category: 'scene' | 'viewport' | 'bridge' | 'ui'
  params?: z.ZodSchema<TParams>  // Zod para validación
  undoable: boolean
  execute: (params: TParams, context: CommandContext) => void
  toTerminalString?: (params: TParams) => string
  help?: string
}

const commandRegistry = new Map<string, CommandDefinition>()

// Registro de comando
registerCommand({
  id: 'view.set',
  category: 'viewport',
  params: z.object({ view: z.enum(['iso', 'front', 'top', ...]) }),
  undoable: false,
  execute: ({ view }, ctx) => ctx.stores.viewport.setCameraView(view),
  toTerminalString: ({ view }) => `view ${view}`,
  help: 'Set camera view preset'
})
```

**Beneficios**:
- Terminal commands se derivan automáticamente del registro
- Help/autocompletado generados desde metadata
- Validación de parámetros centralizada
- Fácil añadir nuevos comandos sin tocar union types
- Plugin-friendly para extensibilidad

### 2. Solución Para Re-renders (Prioritario)

**Problema actual**:
```typescript
// 53 selectores individuales causan subscripciones innecesarias
const activeToolMode = useUiStore(s => s.activeToolMode)
const sceneEventAutoScroll = useUiStore(s => s.sceneEventAutoScroll)
// ... 51 más
```

**Solución 1: useShallow de Zustand** (bajo esfuerzo)
```typescript
import { useShallow } from 'zustand/react/shallow'

// Agrupar propiedades relacionadas
const terminalState = useTerminalUiStore(
  useShallow(s => ({
    sourceFilter: s.sourceFilter,
    kindFilter: s.kindFilter,
    sceneFilter: s.sceneFilter,
  }))
)
```

**Solución 2: Selector Factories** (medio esfuerzo)
```typescript
// En cada store, exportar selectores pre-definidos
export const terminalSelectors = {
  filters: (s: TerminalUiState) => ({
    source: s.sourceFilter,
    kind: s.kindFilter,
    scene: s.sceneFilter,
  }),
  commandHistory: (s: TerminalUiState) => s.commandHistory,
}

// En hooks
const filters = useTerminalUiStore(useShallow(terminalSelectors.filters))
```

**Solución 3: Jotai para estado derivado** (alto esfuerzo, máximo beneficio)
```typescript
// Para computed state que depende de múltiples stores
import { atom } from 'jotai'
import { selectAtom } from 'jotai/utils'

const sceneStateAtom = atomWithStore(useSceneStore)
const viewportStateAtom = atomWithStore(useViewportStore)

// Derivado atómico - solo re-render cuando el resultado cambia
const visiblePlacementsAtom = atom((get) => {
  const placements = get(sceneStateAtom).placements
  const viewport = get(viewportStateAtom).bounds
  return filterVisiblePlacements(placements, viewport)
})
```

### 3. Undo/Redo Generalizado

Actual: Solo scene geometry es undoable.

**Patrón Command + Memento**:
```typescript
interface UndoableCommand {
  execute(): void
  undo(): void
  redo(): void
  description: string
}

class UndoManager {
  private undoStack: UndoableCommand[] = []
  private redoStack: UndoableCommand[] = []

  execute(cmd: UndoableCommand) {
    cmd.execute()
    this.undoStack.push(cmd)
    this.redoStack = []
  }
}
```

Esto permitiría undo de viewport changes, UI state, etc.

### 4. Macro Recording (Futuro)

```typescript
const macroRecorder = {
  recording: false,
  commands: [] as AppCommand[],

  start() { this.recording = true; this.commands = [] },
  stop() { this.recording = false; return this.commands },

  // Hook into dispatch
  onCommand(cmd: AppCommand) {
    if (this.recording) this.commands.push(cmd)
  }
}

// Uso: grabar → ejecutar acciones → stop → guardar como script
```

---

## Plan de Implementación Final

### Fase 1: Resolver Re-renders + Jotai Foundation

**Objetivo**: Eliminar verbosidad y preparar infraestructura para derivados

1. Introducir `useShallow` en hooks críticos:
   - `useSceneEventTerminalState.ts` (53 selectors → ~8 grupos)
   - `usePlanogramMiniMapState.ts` (24 selectors → ~5 grupos)
   - `usePoseControlPanelState.ts` (30+ selectors → ~6 grupos)

2. Crear selector factories en cada store (`*Selectors.ts`)

3. Instalar Jotai y crear `src/app/atoms/` para estado derivado:
   - `bridgeAtoms.ts` - derivados de sincronización
   - `sceneAtoms.ts` - derivados de geometría (visible placements, etc.)

### Fase 2: Command Registry Pattern

**Objetivo**: Evolucionar a arquitectura AutoCAD-style

1. Crear `src/core/app-commanding/commandRegistry.ts`:
   - `CommandDefinition<TParams>` interface
   - `registerCommand()` function
   - `getCommandHelp()`, `getCommandsByCategory()` utilities

2. Definir schemas con Zod para validación de parámetros

3. Migrar comandos más usados (10-15) al registro:
   - `view.set`, `view.toggle`
   - `scene.undo`, `scene.redo`
   - `scene.move`, `scene.rotate`, `scene.snap`
   - `tool.set`, `bridge.connect`

4. Derivar terminal parsing del registro:
   - Refactor `terminalCommandLine.ts` para usar registry
   - Generar autocompletado y help automáticamente

5. Renombrar `poseStoreCommandBus.ts` → `appCommandBus.ts`

### Fase 3: Undo Generalizado

**Objetivo**: Extender undo más allá de scene geometry

1. Crear `src/core/app-commanding/undoManager.ts`:
   - `UndoableCommand` interface
   - `UndoManager` class standalone

2. Integrar con Command Registry:
   - Comandos con `undoable: true` auto-registran en UndoManager
   - Viewport commands (camera view) pasan a ser undoable

3. Implementar command grouping para operaciones compuestas

### Fase 4: Patrones Avanzados (Futuro)

1. **Macro Recording**: Hook en dispatch para grabar secuencias
2. **Command Palette**: UI tipo VS Code derivada del registry
3. **Plugin Architecture**: Extensiones registran comandos dinámicamente

---

## Archivos a Modificar

| Fase | Archivo | Cambio |
|------|---------|--------|
| 1 | `src/features/terminal/hooks/useSceneEventTerminalState.ts` | Aplicar useShallow, reducir 53→8 grupos |
| 1 | `src/features/planogram/hooks/usePlanogramMiniMapState.ts` | Aplicar useShallow, reducir 24→5 grupos |
| 1 | `src/features/pose/hooks/usePoseControlPanelState.ts` | Aplicar useShallow |
| 1 | `src/app/state/*Selectors.ts` | **Nuevo** - Selector factories por store |
| 1 | `src/app/atoms/` | **Nuevo** - Jotai atoms para derivados |
| 2 | `src/core/app-commanding/commandRegistry.ts` | **Nuevo** - Command registry con Zod |
| 2 | `src/core/app-commanding/appCommandBus.ts` | Renombrar + integrar registry |
| 2 | `src/features/terminal/model/terminalCommandLine.ts` | Derivar de registry |
| 3 | `src/core/app-commanding/undoManager.ts` | **Nuevo** - Undo generalizado |

### Dependencias Nuevas

```bash
npm install jotai zod
```

---

## Resumen Ejecutivo

**El command bus actual es una base sólida** para un sistema CAD. La arquitectura de dispatch uniforme, reflection, y capabilities está bien pensada.

**Decisiones arquitectónicas confirmadas**:
- ✅ Stores separados se mantienen (bounded contexts DDD)
- ✅ Command bus se evoluciona (no se elimina)
- ✅ Jotai para derivados cross-store

**Cuatro pilares de mejora**:

1. **Re-renders** (urgente) - `useShallow` + Jotai para derivados
2. **Command Registry** (arquitectónico) - De union types a registro dinámico AutoCAD-style
3. **Undo generalizado** (importante) - Extender más allá de scene geometry
4. **Macro/Plugin system** (futuro) - Habilitado por command registry

**El Command Registry es el cambio más significativo** - permite crecimiento sin modificar tipos centrales, genera help/autocompletado automático, y habilita macros y plugins.

---

## Verificación

Para validar los cambios:
1. `npm run build` debe pasar sin errores de tipos
2. Los re-renders deben medirse con React DevTools Profiler antes/después
3. Los comandos existentes deben seguir funcionando (backward compatible)
4. El terminal debe seguir interpretando los mismos comandos
