Plan: Refactor Arquitectónico - Puppet Studio

Sprint de Refactorización

Fase 1: Dividir Store en Slices  

- Crear viewportStore.ts (camera, projection, dimensions)
- Crear bridgeStore.ts (connection, sync state)  
- Crear avatarStore.ts (pose, position)  
- Crear uiStore.ts (terminal, tool mode) 
- Reducir poseStore.ts a scene-only + composición

Fase 2: SceneEngine como Store Principal 

- Crear createSceneStore.ts que encapsula SceneEngine
- Migrar lógica de scene desde poseStore 
- Eliminar duplicación de estado 

Fase 3: Consolidar Domain en Core

- Mover src/planogram/ a src/core/planogram-domain/  
- Actualizar imports en todo el proyecto 

Fase 4: Capa de Servicios

- Crear src/services/sceneService.ts 
- Crear src/services/bridgeService.ts
- Refactorizar features para usar servicios  

Archivos Críticos

- src/app/state/poseStore.ts - Store monolítico a dividir
- src/core/scene-domain/sceneEngine.ts - Base para nuevo scene store 
- src/planogram/ - Mover a core  
- src/features/*/hooks/*.ts - Actualizar imports 

Verificación 

- npm run build debe pasar sin errores   
- npm run dev debe funcionar igual que antes   