# Architecture

Relevant source files

- [](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/app/state/poseStore.ts)
- [](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/app-commanding/appCommandBus.ts)
- [](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/app-commanding/poseStoreCommandBus.ts)
- [](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/bridge-runtime/bridgeMessages.ts)
- [](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/bridge-runtime/bridgeOutbound.ts)
- [](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/bridge-runtime/bridgeSession.ts)
- [](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/bridge-runtime/bridgeStateAdapter.ts)
- [](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/config/runtimeConfig.ts)
- [](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/engine/engineCapabilityRegistry.ts)
- [](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/engine/engineRuntime.ts)
- [](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/workspace-shell/workspaceShellBridge.ts)
- [](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/features/bridge/hooks/useBridgePoseListener.ts)
- [](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/features/bridge/model/bridgeLifecycleSceneEvent.ts)
- [](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/features/bridge/ui/BridgePoseListener.tsx)
- [](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/features/terminal/model/terminalCommandLine.ts)
- [](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/features/workspace/hooks/useWorkspaceHudState.ts)
- [](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/features/workspace/model/workspaceHudModel.ts)
- [](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/features/workspace/ui/pages/CadWorkspacePage.tsx)

This page describes the layered architecture of puppet-studio: how the major subsystems are organized, how data flows between them, and which source files implement each layer. It focuses on system-level relationships rather than the internal details of any individual subsystem. For deeper coverage of individual layers, see:

- State management details → [State Management](https://deepwiki.com/e7canasta/puppet-studio/3-state-management)
- Command types and dispatch → [Command System](https://deepwiki.com/e7canasta/puppet-studio/4-command-system)
- Bridge protocol and session → [Bridge Communication](https://deepwiki.com/e7canasta/puppet-studio/5-bridge-communication)
- Workspace UI structure → [Workspace UI](https://deepwiki.com/e7canasta/puppet-studio/6-workspace-ui)
- Configuration and env vars → [Configuration](https://deepwiki.com/e7canasta/puppet-studio/12-configuration)

---

## Layer Overview

The application is organized into five horizontal layers. Each layer depends only on layers below it; the UI layer never imports bridge internals directly, and the bridge never imports UI components.

**Layer summary:**

|Layer|Primary Responsibility|Key Files|
|---|---|---|
|Configuration|Env-var parsing; capability profiles|`src/core/config/runtimeConfig.ts`|
|Bridge Communication|WebSocket lifecycle; inbound parsing; outbound sending|`src/core/bridge-runtime/`|
|Central State (`poseStore`)|Single source of truth for all application state|`src/app/state/poseStore.ts`|
|Command & Engine|Typed command dispatch; pluggable capability execution|`src/core/app-commanding/`, `src/core/engine/`|
|UI Feature Modules|React components reading state, dispatching commands|`src/features/`|

**Layered architecture diagram:**

```mermaid
graph TB
    %% =====================
    %% LAYER STYLING WITH EMOJIS
    %% =====================
    
    subgraph UI_Layer["🖥️ UI Layer"]
        direction TB
        CWP[🏗️ CadWorkspacePage]
        PS[🎭 PuppetScene]
        PMM[🗺️ PlanogramMiniMap]
        CSM[📷 CameraSubspaceMap]
        PCP[🎚️ PoseControlPanel]
        SET[⚡ SceneEventTerminal]
    end
    
    subgraph Config_Layer["⚙️ Configuration"]
        RC[📋 runtimeConfig]
    end
    
    subgraph Bridge_Layer["🌉 Bridge Communication Layer"]
        BS[🔗 BridgeSession]
        BMsg[📨 parseBridgeInboundMessage]
        BSA[🔄 bridgeStateAdapter]
        BOut[📤 bridgeOutbound]
    end
    
    subgraph State_Layer["💾 Central State"]
        PS_Store[💼 usePoseStore]
        PS_State[📊 PoseState]
    end
    
    subgraph Command_Layer["⌨️ Command System"]
        ACB[🚌 AppCommand Bus]
        PSCB[🐢 poseStoreCommandBus]
        ER[⚙️ engineRuntime]
        CAP[🧩 EngineCapabilityRegistry]
    end
    
    %% =====================
    %% CONNECTIONS WITH EMOJIS
    %% =====================
    
    %% Bridge Layer Connections
    BS -->|🎁 parsed frames| BMsg
    BMsg -->|🔄 apply actions| BSA
    BSA -->|📝 mutate state| PS_Store
    BOut -->|📡 send payload| BS
    BS -->|🛠️ set sender| BOut
    
    %% Command System Flow
    UI_Layer -.->|✨ dispatcher| ACB
    ACB -->|📨 dispatch| PSCB
    PSCB -->|🔧 commands| ER
    ER -->|✅ setState| CAP
    CAP -.->|📡 register| ER
    
    %% State ↔ UI Sync
    PS_Store -->|👁️ selectors| UI_Layer
    
    %% Config Integration
    RC ~~~ ACB
    RC ~~~ BOut
    
    %% =====================
    %% CLASS DEFINITIONS
    %% =====================
    
    style UI_Layer fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    style Config_Layer fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    style Bridge_Layer fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    style State_Layer fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    style Command_Layer fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    
    style BS fill:#9c27b0,color:white
    style BMsg fill:#9c27b0,color:white
    style BSA fill:#9c27b0,color:white
    style BOut fill:#9c27b0,color:white
    style PS_Store fill:#4caf50,color:white
    style ACB fill:#ff9800,color:white
    style PSCB fill:#ff9800,color:white
    style ER fill:#2196f3,color:white
```


Sources: [src/app/state/poseStore.ts1-50](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/app/state/poseStore.ts#L1-L50) [src/core/app-commanding/appCommandBus.ts1-30](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/app-commanding/appCommandBus.ts#L1-L30) [src/core/app-commanding/poseStoreCommandBus.ts1-50](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/app-commanding/poseStoreCommandBus.ts#L1-L50) [src/core/engine/engineRuntime.ts1-40](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/engine/engineRuntime.ts#L1-L40) [src/core/bridge-runtime/bridgeSession.ts1-50](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/bridge-runtime/bridgeSession.ts#L1-L50) [src/features/bridge/ui/BridgePoseListener.tsx1-7](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/features/bridge/ui/BridgePoseListener.tsx#L1-L7)

---

## Bridge Communication Layer

The bridge layer connects to an external WebSocket server and translates raw JSON frames into typed `poseStore` mutations. The three components are always used together as a pipeline.

**Bridge inbound pipeline:**

```
WebSocket Server
       ↓ raw JSON
BridgeSession.onInboundPayload
       ↓ parseBridgeInboundMessage()
ParsedBridgeInboundMessage
       ↓ mapParsedBridgeInboundToActions()
BridgeStateAction[]
       ↓ applyBridgeStateActions()
usePoseStore state mutations
```


```mermaid
graph LR
    %% =====================
    %% CORE TYPES BLOCKS
    %% =====================
    
    subgraph WS_Layer["🌐 WebSocket Layer"]
        WSS[WebSocket Server]:::ws
        RawJSON[raw JSON]:::json
    end
    
    subgraph Session_Layer["🔗 BridgeSession"]
        BS{BridgeSession<br/><small>bridgeSession.ts</small>}:::session
        BSL{BridgeSessionLifecycleEvent}:::event
    end
    
    subgraph Messages_Layer["📨 Message Parsing"]
        PIM{ParsedBridgeInboundMessage}:::msg
        ParseMsg(parseBridgeInboundMessage<br/><small>bridgeMessages.ts</small>):::parser
    end
    
    subgraph Adapter_Layer["🔄 State Adapter"]
        BSA{BridgeStateAction}:::action
        MapActions(mapParsedBridgeInboundToActions<br/><small>bridgeStateAdapter.ts</small>):::adapter
        ApplyActions(applyBridgeStateActions<br/><small>bridgeStateAdapter.ts</small>):::adapter
    end
    
    subgraph Outbound_Layer["📤 Outbound Communication"]
        SendP(sendBridgePayload<br/><small>bridgeOutbound.ts</small>):::outbound
    end
    
    subgraph Store_Layer["💾 PoseStore State"]
        PS(usePoseStore<br/><small>poseStore.ts</small>):::store
    end
    
    %% =====================
    %% CONNECTIONS
    %% =====================
    
    WSS -->|raw JSON| RawJSON
    RawJSON -->|onInboundPayload| BS
    
    BS -->|parsing| ParseMsg
    ParseMsg -->|"type: bridge_pose_scene_snapshot...<br/>type: bridge_error"| PIM
    
    PIM -->|conversion| MapActions
    MapActions -->|"BridgeStateAction[]"| ApplyActions
    ApplyActions -->|mutations| PS
    
    BS -.->|auto-reconnect & lifecycle| BSL
    SendP <-..-> BS
    
    %% =====================
    %% STYLING
    %% =====================
    
    classDef ws fill:#e0f7fa,stroke:#006064,stroke-width:2px,color:black
    classDef json fill:#fff8e1,stroke:#ff8f00,stroke-width:2px,color:black
    classDef session fill:#f3e5f5,stroke:#6a1b9a,stroke-width:2px,color:white
    classDef event fill:#fce4ec,stroke:#c2185b,stroke-width:2px,color:black
    classDef msg fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px,color:black
    classDef parser fill:#ffebee,stroke:#c62828,stroke-width:2px,color:black
    classDef action fill:#e1f5fe,stroke:#0277bd,stroke-width:2px,color:black
    classDef adapter fill:#fff3e0,stroke:#ef6c00,stroke-width:2px,color:black
    classDef outbound fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px,color:black
    classDef store fill:#e8eaf6,stroke:#3f51b5,stroke-width:2px,color:black
```

Sources: [src/core/bridge-runtime/bridgeMessages.ts58-118](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/bridge-runtime/bridgeMessages.ts#L58-L118) [src/core/bridge-runtime/bridgeStateAdapter.ts38-117](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/bridge-runtime/bridgeStateAdapter.ts#L38-L117) [src/features/bridge/hooks/useBridgePoseListener.ts24-87](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/features/bridge/hooks/useBridgePoseListener.ts#L24-L87)

### Key bridge types

|Type / Function|File|Role|
|---|---|---|
|`BridgeSession`|`bridgeSession.ts`|WebSocket lifecycle, auto-reconnect|
|`BridgeSessionLifecycleEvent`|`bridgeSession.ts`|Union of lifecycle events (connecting, connected, disconnected, …)|
|`ParsedBridgeInboundMessage`|`bridgeMessages.ts`|Discriminated union of parsed message variants|
|`parseBridgeInboundMessage`|`bridgeMessages.ts`|Converts raw payload to `ParsedBridgeInboundMessage`|
|`BridgeStateAction`|`bridgeStateAdapter.ts`|Typed actions to apply to state|
|`mapParsedBridgeInboundToActions`|`bridgeStateAdapter.ts`|Converts parsed message to `BridgeStateAction[]`|
|`applyBridgeStateActions`|`bridgeStateAdapter.ts`|Calls methods on a `BridgeStatePort`|
|`sendBridgePayload`|`bridgeOutbound.ts`|Module-level outbound sender (calls registered sender fn)|

The `BridgePoseListener` React component ([src/features/bridge/ui/BridgePoseListener.tsx1-7](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/features/bridge/ui/BridgePoseListener.tsx#L1-L7)) renders nothing but mounts `useBridgePoseListener`, which creates the `BridgeSession`, registers `setBridgeOutboundSender` and `setBridgeOutboundObserver`, and wires all callbacks to `poseStore` ([src/features/bridge/hooks/useBridgePoseListener.ts17-113](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/features/bridge/hooks/useBridgePoseListener.ts#L17-L113)).

---

## Central State Layer (`poseStore`)

All application state lives in a single Zustand store created with `create<PoseState>` in [src/app/state/poseStore.ts500](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/app/state/poseStore.ts#L500-L500)

The `PoseState` type ([src/app/state/poseStore.ts57-157](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/app/state/poseStore.ts#L57-L157)) groups state into functional clusters:

|Cluster|Example fields|
|---|---|
|Avatar / Pose|`avatarObjectId`, `avatarPlanPositionM`, `pose`|
|Bridge|`bridgeEnabled`, `bridgeStatus`, `bridgeUrl`, `bridgeError`|
|Scene|`scenePlacements`, `sceneRoom`, `sceneRevision`, `sceneSequence`, `sceneSource`|
|Scene sync / deferred|`sceneRemoteHoldEnabled`, `sceneDeferredRemoteQueue`, `sceneLastAppliedRemoteRevision`|
|Undo / redo|`sceneUndoStack`, `sceneRedoStack`, `sceneUndoDepth`, `sceneRedoDepth`|
|Event log|`sceneEventLog`, `sceneEventTerminalOpen`, `sceneEventLogPaused`|
|Camera / viewport|`cameraView`, `projectionMode`, `viewportCameraQuaternion`, `monitoringCameras`|
|Selection / tools|`selectedPlacementId`, `activeToolMode`, `showDimensions`|
|HUD flags|`sceneEditEnabled`, `sceneRemoteHoldEnabled`|

UI components subscribe to individual slices using `usePoseStore((state) => state.someField)` to minimize re-renders.

**State mutation paths:**


```mermaid
flowchart TD
    %% --- Input Nodes ---
    node1["Bridge Inbound<br/>(applyBridgeStateActions)"]
    node2["AppCommand dispatch<br/>(dispatchPoseStoreCommand)"]
    node3["Direct poseStore actions<br/>(e.g. setAxis,<br/>setCameraView)"]

    %% --- Processing Nodes ---
    node4["applySceneSnapshot<br/>applyScenePatch<br/>applyPoseSnapshot<br/>setBridgeError"]
    node5["poseStoreEngineRuntime<br/>→ AppCommandPort"]
    node6["usePoseStore<br/>poseStore.ts"]

    %% --- Output/Subscribers ---
    node7["usePoseStore hook<br/>(React subscriptions)"]
    node8["publishScenePlacementDiff<br/>→ sendBridgePayload"]
    node9["UI Components"]
    node10["bridgeOutbound.ts<br/>(outbound to server)"]

    %% --- Relationships ---
    node1 --> node4
    node4 --> node6

    node2 --> node5
    node5 --> node6

    node3 --> node6

    node6 --> node7
    node7 --> node9

    node6 --> node8
    node8 --> node10

    %% Optional styling to mimic layout slightly
    linkStyle default stroke-width:2px,fill:none,stroke:black;
```
Sources: [src/app/state/poseStore.ts500-560](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/app/state/poseStore.ts#L500-L560) [src/app/state/poseStore.ts116-157](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/app/state/poseStore.ts#L116-L157) [src/app/state/poseStore.ts412-445](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/app/state/poseStore.ts#L412-L445)

---

## Command & Engine Layer

User actions in the UI become typed `AppCommand` values that travel through a two-stage pipeline before reaching `poseStore`.

**Stage 1 – Command Bus** (`src/core/app-commanding/`)

- `AppCommand` is a discriminated union of every possible command kind ([src/core/app-commanding/appCommandBus.ts11-138](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/app-commanding/appCommandBus.ts#L11-L138)).
- `AppCommandEnvelope` wraps a command with metadata: `id`, `at`, `source`, `correlationId` ([src/core/app-commanding/appCommandBus.ts177-190](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/app-commanding/appCommandBus.ts#L177-L190)).
- `createPoseStoreCommandDispatcher` (exported from `src/shared/ui`) returns a function bound to a source tag, calling `dispatchPoseStoreCommand` ([src/core/app-commanding/poseStoreCommandBus.ts282-321](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/app-commanding/poseStoreCommandBus.ts#L282-L321)).
- `dispatchPoseStoreCommand` logs an `app_command` scene event, optionally logs a `command_line_reflection`, then calls `poseStoreEngineRuntime.dispatchEnvelope`.

**Stage 2 – Engine Runtime** (`src/core/engine/`)

- `createEngineRuntime` ([src/core/engine/engineRuntime.ts40-119](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/engine/engineRuntime.ts#L40-L119)) returns an `EngineRuntime` with `dispatchEnvelope`, `registerCapability`, and `unregisterCapability`.
- On dispatch, the runtime queries `EngineCapabilityRegistry.match(command)` and calls `execute` on each matching capability.
- If no capability sets `stopDispatch`, the envelope is forwarded to `dispatchAppCommandEnvelope`, which calls the matching method on `AppCommandPort`.
- `AppCommandPort` ([src/core/app-commanding/appCommandBus.ts139-175](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/app-commanding/appCommandBus.ts#L139-L175)) is a plain object whose methods call `poseStore` actions directly.

**Command dispatch sequence:**

```mermaid
sequenceDiagram
    actor UI as "UI Component<br/>(CadWorkspacePage.tsx)"
    participant DISP as "createPoseStoreCommandDispatcher<br/>poseStoreCommandBus.ts"
    participant ENV as "createAppCommandEnvelope<br/>appCommandBus.ts"
    participant ER as "poseStoreEngineRuntime<br/>engineRuntime.ts"
    participant CAP as "EngineCapabilityRegistry<br/>engineCapabilityRegistry.ts"
    participant PORT as "getPoseStoreCommandPort<br/>poseStoreCommandBus.ts"
    participant STORE as "usePoseStore<br/>poseStore.ts"

    UI->>DISP: "{ kind: 'set_active_tool', mode: 'move' }"
    DISP->>ENV: "createAppCommandEnvelope(cmd)"
    ENV->>ER: "appendSceneEvent('app_command')"
    ER->>STORE: "dispatchEnvelope(envelope)"
    DISP->>ER: "dispatchEnvelope(envelope)"
    ER->>CAP: "match(command)"
    CAP-->>ER: "matched capabilities" ⚙️
    ER->>CAP: "capability.execute(...)"
    CAP->>PORT: "emit engine events" 📡
    PORT->>STORE: "dispatchAppCommandEnvelope(port, envelope)"
    STORE-->>PORT: "setActiveToolMode('move')"
    STORE-->>UI: "state update → re-render" 🔄
```

Sources: [src/core/app-commanding/poseStoreCommandBus.ts154-321](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/app-commanding/poseStoreCommandBus.ts#L154-L321) [src/core/engine/engineRuntime.ts63-101](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/engine/engineRuntime.ts#L63-L101) [src/core/app-commanding/appCommandBus.ts192-354](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/app-commanding/appCommandBus.ts#L192-L354) [src/core/engine/engineCapabilityRegistry.ts1-28](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/engine/engineCapabilityRegistry.ts#L1-L28)

### Engine Capabilities

Capabilities are registered at module load time in `registerDefaultPoseStoreEngineCapabilities` ([src/core/app-commanding/poseStoreCommandBus.ts191-222](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/app-commanding/poseStoreCommandBus.ts#L191-L222)). The two built-in capabilities are:

|ID|Created by|Default enabled|
|---|---|---|
|`engine.stats`|`createEngineStatsCapability`|`true` (overridable via profile)|
|`engine.sim.preview`|`createEngineSimPreviewCapability`|`false` (enabled in `demo` and `dev` profiles)|

Capabilities can be toggled at runtime via the `set_engine_capability_enabled` `AppCommand`, which calls `setPoseStoreEngineCapabilityEnabled` ([src/core/app-commanding/poseStoreCommandBus.ts249-263](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/app-commanding/poseStoreCommandBus.ts#L249-L263)).

---

## UI Feature Layer

The `App.tsx` root mounts three top-level children:

1. `BridgePoseListener` — no rendered output; manages `BridgeSession` lifecycle as a side effect.
2. `SceneCommandHotkeys` — global `keydown` listener that dispatches `AppCommand`s.
3. `CadWorkspacePage` — the main workspace shell.

`CadWorkspacePage` ([src/features/workspace/ui/pages/CadWorkspacePage.tsx71-835](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/features/workspace/ui/pages/CadWorkspacePage.tsx#L71-L835)) reads from both `usePoseStore` (via individual slice selectors) and `useWorkspaceHudState` (local layout state). It lazy-loads the five main feature components:

|Lazy component|Feature module|
|---|---|
|`PuppetScene`|`src/features/scene/`|
|`PoseControlPanel`|`src/features/pose/`|
|`CameraSubspaceMap`|`src/features/camera/`|
|`PlanogramMiniMap`|`src/features/planogram/`|
|`SceneEventTerminal`|`src/features/terminal/`|

All UI commands are dispatched through `createPoseStoreCommandDispatcher('ui.workspace_shell')` ([src/features/workspace/ui/pages/CadWorkspacePage.tsx96](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/features/workspace/ui/pages/CadWorkspacePage.tsx#L96-L96)).

**Workspace HUD state** is kept separately from `poseStore` in a local React `useState` managed by `useWorkspaceHudState` ([src/features/workspace/hooks/useWorkspaceHudState.ts39-133](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/features/workspace/hooks/useWorkspaceHudState.ts#L39-L133)). It persists to `sessionStorage` under the key `WORKSPACE_LAYOUT_STORAGE_KEY` ([src/features/workspace/model/workspaceHudModel.ts11](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/features/workspace/model/workspaceHudModel.ts#L11-L11)). The `poseStoreCommandBus` bridges the gap by calling `dispatchWorkspaceShellCommand` ([src/core/workspace-shell/workspaceShellBridge.ts36-43](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/workspace-shell/workspaceShellBridge.ts#L36-L43)) for layout-related commands; `useWorkspaceHudState` subscribes to these via `subscribeWorkspaceShellCommands`.

**UI component hierarchy:**

```mermaid
flowchart TD
    App["App.tsx 📄"]
    BPL["BridgePoseListener<br/>BridgePoseListener.tsx"]
    SCH["SceneCommandHotkeys ⌨️"]
    CWP["CadWorkspacePage<br/>CadWorkspacePage.tsx 💻"]
    HDR["WorkspaceHeaderBar 🏷️"]
    LEFT["WorkspaceWidgetCard: Properties 🛠️<br/>→ PoseControlPanel lazy"]
    CENTER["PuppetScene lazy 👾<br/>+ WorkspaceAxisGizmo<br/>+ WorkspaceViewCube"]
    RIGHT["WorkspaceWidgetCard: Outliner 📋<br/>Camera → CameraSubspaceMap lazy<br/>Planogram → PlanogramMiniMap lazy"]
    STAT["WorkspaceStatusBar 📊"]
    TERM["SceneEventTerminal lazy 🔚"]
    PAL["WorkspaceCommandPalette 🎯"]
    
    App --> BPL
    App --> SCH
    App --> CWP
    CWP --> HDR
    CWP --> LEFT
    CWP --> CENTER
    CWP --> RIGHT
    CWP --> STAT
    CWP --> TERM
    CWP --> PAL
```

Sources: [src/features/workspace/ui/pages/CadWorkspacePage.tsx39-54](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/features/workspace/ui/pages/CadWorkspacePage.tsx#L39-L54) [src/features/workspace/ui/pages/CadWorkspacePage.tsx458-834](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/features/workspace/ui/pages/CadWorkspacePage.tsx#L458-L834) [src/features/workspace/hooks/useWorkspaceHudState.ts94-111](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/features/workspace/hooks/useWorkspaceHudState.ts#L94-L111) [src/core/workspace-shell/workspaceShellBridge.ts36-58](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/workspace-shell/workspaceShellBridge.ts#L36-L58)

---

## Configuration Layer

`runtimeConfig` ([src/core/config/runtimeConfig.ts116-134](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/config/runtimeConfig.ts#L116-L134)) is a module-level singleton parsed from `import.meta.env` at startup. It is consumed by:

- `poseStore` — for `defaultSceneEditEnabled`, `sceneEventLogLimit`, undo stack limits, deferred-apply mode.
- `poseStoreCommandBus` — for capability profile resolution via `resolveEngineCapabilityDefaultEnabled`.
- Scene sync logic — for `sceneDeferredQueueLimit`, `sceneDeferredAutoApplyOnRelease`.

The three engine capability profiles control which capabilities start enabled:

|Profile|`engine.stats`|`engine.sim.preview`|
|---|---|---|
|`dev`|enabled|enabled|
|`ops`|enabled|disabled|
|`demo`|default|enabled|

Sources: [src/core/config/runtimeConfig.ts101-147](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/config/runtimeConfig.ts#L101-L147) [src/core/app-commanding/poseStoreCommandBus.ts191-222](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/app-commanding/poseStoreCommandBus.ts#L191-L222)


### On this page

- [Architecture](https://deepwiki.com/e7canasta/puppet-studio/2-architecture#architecture)
- [Layer Overview](https://deepwiki.com/e7canasta/puppet-studio/2-architecture#layer-overview)
- [Bridge Communication Layer](https://deepwiki.com/e7canasta/puppet-studio/2-architecture#bridge-communication-layer)
- [Key bridge types](https://deepwiki.com/e7canasta/puppet-studio/2-architecture#key-bridge-types)
- [Central State Layer (`poseStore`)](https://deepwiki.com/e7canasta/puppet-studio/2-architecture#central-state-layer-posestore)
- [Command & Engine Layer](https://deepwiki.com/e7canasta/puppet-studio/2-architecture#command-engine-layer)
- [Engine Capabilities](https://deepwiki.com/e7canasta/puppet-studio/2-architecture#engine-capabilities)
- [UI Feature Layer](https://deepwiki.com/e7canasta/puppet-studio/2-architecture#ui-feature-layer)
- [Configuration Layer](https://deepwiki.com/e7canasta/puppet-studio/2-architecture#configuration-layer)
