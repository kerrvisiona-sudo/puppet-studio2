# Plan: Create CLAUDE.md for Puppet Studio

## Objective
Create a comprehensive CLAUDE.md file to guide future Claude Code instances working in this codebase.

## Current Status
✅ Explored codebase thoroughly
✅ Identified key architecture patterns
✅ Created initial CLAUDE.md file

## Analysis Summary

### Project Type
CAD-like 3D workspace application for:
- Human body pose/ragdoll physics simulation
- Room planning with planogram
- Monitoring camera overlays
- Real-time WebSocket scene synchronization
- Part of care-simulator system for healthcare monitoring

### Key Technologies
- React + TypeScript with Vite
- @react-three/fiber (Three.js bindings)
- @react-three/cannon (physics)
- Zustand (state management)
- WebSocket for bridge communication

### Architecture Highlights
1. **Central State**: 1000+ line Zustand store in `src/app/state/poseStore.ts`
2. **Scene Engine**: Command pattern with undo/redo in `src/core/scene-domain/`
3. **Bridge Runtime**: WebSocket communication layer with deferred sync
4. **Feature-Sliced Design**: Organized by features with hooks/model/ui structure
5. **Capability System**: Configurable engine features via profiles (dev/demo/ops)

### Important Files
- `src/app/state/poseStore.ts` - Central Zustand store
- `src/core/scene-domain/sceneEngine.ts` - Scene command engine
- `src/core/config/runtimeConfig.ts` - Runtime config from env vars
- `src/planogram/types.ts` - Core domain types
- `lib/analytics/hub.py` - Python SpecialistSubscriber base class

## Implementation Complete

Created `/home/visiona/Work/care-simulator/puppet-studio/CLAUDE.md` with:

1. **Development Commands**:
- Build, dev server, test commands
- Bridge server and monitor
- Python mock clients

2. **Architecture Overview**:
- Tech stack summary
- Directory structure with key files
- Design patterns (scene engine, bridge, capabilities)
- Environment variable configuration

3. **Key Patterns**:
- Command pattern for scene operations
- WebSocket bridge with deferred updates
- Feature-Sliced Design organization

The file is concise, focuses on "big picture" architecture, and excludes obvious/generic practices.

## Verification

To verify the CLAUDE.md is helpful:
1. Read `/home/visiona/Work/care-simulator/puppet-studio/CLAUDE.md`
2. Confirm it covers essential development commands
3. Confirm it explains non-obvious architecture patterns
4. Confirm it's concise and not repetitive


---

1. Project Overview - Describes Puppet Studio as a CAD-like 3D workspace for healthcare monitoring simulation   
2. Development Commands - All essential npm scripts for:
- Building and running the dev server
- Running tests
- Starting the WebSocket bridge 
- Running Python mock clients   
3. Architecture - High-level structure covering:
- Tech stack (React, Three.js, Zustand, WebSocket)
- Directory organization (Feature-Sliced Design pattern)  
- Key architectural patterns (Scene Engine with command pattern, Bridge communication, Capability system)
- Important environment variables



El usuario está pidiéndome que revise el diseño y arquitectura del proyecto desde mi experiencia en diseño de software, arquitectura y coding. Quiere una opinión honesta sobre el estado actual y qué cambios  
arquitecturales haría para no "ahogar la rey en futuros movimientos del tablero" - es decir, para mantener flexibilidad y no crear problemas a futuro. 

Está hablando en español, así que debería responder en español.  

Déjame pensar en lo que he visto: 

1. El proyecto tiene un Zustand store de 1040 líneas - eso es ENORME para un solo archivo de estado
2. Feature-Sliced Design está implementado pero mezclado con un dominio separado en planogram/
3. El scene engine usa command pattern con undo/redo
4. Hay un sistema de bridge con WebSocket 
5. El estado está muy centralizado en poseStore
6. Hay un sistema de capabilities para features del engine  

Problemas potenciales que veo:
- Store monolítico de 1000+ líneas
- Mezcla de patrones (FSD + domain folders separados)  
- No hay clara separación entre UI state y domain state
- El bridge runtime y scene domain parecen tener overlap
- No hay testing visible para el frontend (solo hay tests de Python)
- Las features pueden estar acopladas al store central 

Debería explorar más para dar una opinión informada. Voy a leer archivos clave para entender mejor la arquitectura.



Ahora tengo una visión bastante completa de la arquitectura. Déjame analizar los problemas que veo y preparar mi opinión.   

Problemas arquitecturales que identifico:   

1. Store Monolítico (God Object): poseStore.ts tiene 1040+ líneas y mezcla: 
- UI state (cameraView, toolMode, projectionMode) 
- Domain state (scenePlacements, sceneRoom)   
- Network state (bridgeStatus, bridgeUrl) 
- History state (undoStack, redoStack)
- Event logging state 
- Avatar state
- Camera overlays 

Esto es un "God Object" que viola el Single Responsibility Principle.   
2. Feature Sliced Design parcialmente implementado: 
- Las features existen pero todas dependen del store global   
- No hay verdadera encapsulación de dominio   
- El folder planogram/ fuera de features rompe la estructura FSD  
3. Duplicación de tipos y lógica:   
- SceneEngineState en sceneEngine.ts vs PoseState tienen overlap  
- El scene engine tiene su propia idea de estado pero el store la duplica 
4. Acoplamiento fuerte entre capas: 
- Las features acceden directamente al store monolítico   
- No hay abstracción/interfaz entre UI y domain logic 
- El bridge runtime se conecta directamente con el store  
5. Testing difícil: 
- Solo tests Python visibles  
- El store monolítico es difícil de testear unitariamente 
- Sin tests para la lógica de dominio del frontend
6. Scene Engine subutilizado:   
- Existe un buen Scene Engine con command pattern 
- Pero el store todavía maneja mucha lógica que debería estar encapsulada en el engine
7. Responsabilidades entrelazadas: El store combina estado de rendering (quaternión de cámara, modo de proyección), estado de aplicación (editEnabled, toolMode), estado de dominio (placements, room) y estado 
de sincronización remota (deferred queue, versions) sin separación clara.   

Recomendaciones:

1. Dividir el store en slices especializados:   
- viewportStore - cámara, proyección, dimensiones 
- sceneStore - placements, room (delegando al SceneEngine)
- bridgeStore - conexión, sync, deferred  
- avat arStore - pose, position   
- uiStore - terminal open, tool mode  
2. Elevar SceneEngine a componente de primera clase: El SceneEngine debería actuar como el store de escena en lugar de ser invocado desde el store, potencialmente con su propio store interno de Zustand.  
3. Implementar una capa de servicios: Los hooks de features no deberían acceder directamente al store; en su lugar, introducir "actions" o "use cases" que coordinen la lógica de negocio.  
4. Reorganizar planogram: Mover src/planogram/ a src/core/planogram-domain/ o src/features/planogram/domain/ para mejor estructura. 
5. Aislar la lógica de sincronización: Extraer la lógica de sync a un módulo independiente. 

El sceneSyncEngine.ts está bien posicionado pero debería gestionar su propio estado, y la lógica de deferred queue es lo suficientemente compleja como para merecer su propio slice dedicado. Voy a estructurar 
esto como un documento de revisión arquitectónica para presentar al usuario.

● Ahora tengo una visión completa. Déjame ver un hook de feature para entender el acoplamiento actual. 


---

● Perfecto. Ya tengo una visión completa de la arquitectura. Voy a escribir mi análisis honesto.  

--- 
Revisión Arquitectónica Honesta - Puppet Studio 

Lo que está bien hecho ✓

1. Scene Engine con Command Pattern: sceneEngine.ts es sólido - comandos inmutables, undo/redo, eventos de dominio. Esto es textbook CQRS lite. 
2. Bridge Session bien encapsulada: La clase BridgeSession maneja su propio ciclo de vida, reconexión, y no conoce detalles del store. Diseño limpio.   
3. Feature-Sliced Design iniciado: La estructura features/*/hooks/model/ui muestra intención correcta.  
4. Separación core/features: El directorio core/ tiene lógica de dominio que no depende de React.   

--- 
Problemas Críticos ⚠   

1. God Object Store (Riesgo Alto)   

poseStore.ts: ~1040 líneas, ~60 propiedades de estado   

El store mezcla 6 concerns diferentes:  
- Viewport state: cameraView, projectionMode, quaternion, topQuarterTurns   
- Scene domain: placements, room, undo/redo stacks  
- Bridge/network: status, url, enabled, error   
- Avatar/pose: position, rotation, pose joints  
- Remote sync: deferred queue, versions, hold flags 
- UI state: terminal open, tool mode, edit enabled  

Consecuencia: Cualquier cambio en un area dispara re-renders innecesarios. El hook useSceneViewportState hace 14 llamadas usePoseStore() para evitar esto, lo cual es síntoma del problema. 

2. Scene Engine Subutilizado

Tienes un Scene Engine bien diseñado, pero el store duplica su estado y lo "envuelve":  

// sceneEngine.ts define:   
type SceneEngineState = {   
scenePlacements, sceneRoom, sceneUndoStack, sceneRedoStack... 
}   

// poseStore.ts duplica todo:   
type PoseState = {  
scenePlacements, sceneRoom, sceneUndoStack, sceneRedoStack... 
// + 50 propiedades más   
}   

El engine debería SER el store de scene, no ser llamado desde otro store.   

3. Inconsistencia en Ubicación de Domain Logic  

src/planogram/   <- Domain logic suelto 
src/core/scene-domain/  <- Domain logic en core 
src/features/planogram/ <- Feature UI   

planogram/ debería estar en core/planogram-domain/ para mantener consistencia.  

4. Acoplamiento Directo Feature → Store 

Todos los features hacen:   
import { usePoseStore } from '../../../app/state'   

No hay abstracción. Si mañana quieres cambiar el store, tocas todos los features.   

--- 
Recomendaciones de Refactor 

Fase 1: Dividir el Store (Bajo riesgo, alto impacto)

src/app/state/  
├── viewportStore.ts# camera, projection, dimensions
├── sceneStore.ts   # wrapper sobre SceneEngine 
├── bridgeStore.ts  # connection, sync, deferred
├── avatarStore.ts  # pose, position
└── uiStore.ts  # terminal, tool mode   

Zustand soporta slices nativamente. Puedes hacer esto incrementalmente. 

Fase 2: Promover SceneEngine a Store Principal  

// En lugar de: 
const poseStore = create((set) => ({
scenePlacements: [...],   
runSceneCommand: (cmd) => {   
const result = dispatchSceneEngineCommand(...)  
set({ scenePlacements: result.nextState.scenePlacements })  
} 
})) 

// Hacer:   
const sceneStore = createSceneEngineStore({ undoLimit: 80 })
// El engine ES el store, no hay duplicación

Fase 3: Introducir Capa de Servicios

// src/services/sceneService.ts 
export const sceneService = {   
movePlacement(id: string, position: Position) {   
sceneStore.dispatch({ kind: 'move_placement', id, position })   
if (bridgeStore.getState().connected) { 
bridgeService.publishPatch(sceneStore.getState().lastPatch)   
}   
} 
}   

Los features llaman a servicios, no directamente a stores.  

Fase 4: Consolidar Domain en Core   

src/core/   
├── scene-domain/  # ya existe  
├── planogram-domain/  # mover de src/planogram/
├── avatar-domain/ # extraer lógica de pose 
└── bridge-runtime/# ya existe  

--- 
Priorización (No ahogar la reina)   
┌───────┬─────────────────────────┬──────────┬─────────┬────────┐   
│ Orden │ Cambio  │ Esfuerzo │ Impacto │ Riesgo │   
├───────┼─────────────────────────┼──────────┼─────────┼────────┤   
│ 1 │ Extraer viewportStore   │ Bajo │ Alto│ Bajo   │   
├───────┼─────────────────────────┼──────────┼─────────┼────────┤   
│ 2 │ Extraer bridgeStore │ Medio│ Alto│ Bajo   │   
├───────┼─────────────────────────┼──────────┼─────────┼────────┤   
│ 3 │ Mover planogram/ a core │ Bajo │ Medio   │ Bajo   │   
├───────┼─────────────────────────┼──────────┼─────────┼────────┤   
│ 4 │ Scene Engine como store │ Alto │ Alto│ Medio  │   
├───────┼─────────────────────────┼──────────┼─────────┼────────┤   
│ 5 │ Capa de servicios   │ Alto │ Alto│ Medio  │   
└───────┴─────────────────────────┴──────────┴─────────┴────────┘   
Mi recomendación: Empieza por 1-3. Son cambios mecánicos que no alteran comportamiento pero desbloquean los siguientes. 

--- 
Señales de Alerta Futura

Si ves estos síntomas, el diseño actual va a doler: 
- Más de 3 features necesitan coordinar estado  
- Tests de integración se vuelven imposibles de escribir
- Nuevos devs tardan días en entender el flujo  
- Un cambio en bridge rompe el scene editor 

--- 
¿Quieres que profundice en alguno de estos puntos o que diseñe el plan de refactor para alguna fase específica? 