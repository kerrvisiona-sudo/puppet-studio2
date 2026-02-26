# Configuration

Relevant source files

- [](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/app-commanding/appCommandBus.ts)
- [](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/app-commanding/poseStoreCommandBus.ts)
- [](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/config/runtimeConfig.ts)
- [](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/engine/engineCapabilityRegistry.ts)
- [](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/engine/engineRuntime.ts)

This page documents `runtimeConfig` — the single configuration object that drives all tunable behaviour in puppet-studio. It covers how environment variables are read, parsed, and surfaced to the rest of the system, as well as the `EngineCapabilityProfile` preset system and the `resolveEngineCapabilityDefaultEnabled` resolution algorithm.

For how capabilities are registered and toggled at runtime, see the [Engine Runtime & Capabilities](https://deepwiki.com/e7canasta/puppet-studio/4.2-engine-runtime-and-capabilities) page. For how the deferred remote update queue works at the state level, see [State Management](https://deepwiki.com/e7canasta/puppet-studio/3-state-management).

---

## Source and Shape of `runtimeConfig`

All configuration is resolved once at module load time in [src/core/config/runtimeConfig.ts](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/config/runtimeConfig.ts) from Vite's `import.meta.env` object. The result is a plain frozen-style object exported as `runtimeConfig`.

```
src/core/config/runtimeConfig.ts
```

The env object is read at [src/core/config/runtimeConfig.ts99](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/config/runtimeConfig.ts#L99-L99):

```
const runtimeEnv = (import.meta as ImportMeta & { env?: Record<string, unknown> }).env ?? {}
```

All values are parsed defensively — invalid or missing env vars fall back to a hard-coded default.

---

## Environment Variables Reference

|`runtimeConfig` field|Environment Variable|Type|Default|Accepted Values|
|---|---|---|---|---|
|`defaultSceneEditEnabled`|`VITE_FRONTEND_SCENE_EDIT_ENABLED`|boolean|`true`|`1/true/yes/on` or `0/false/no/off`|
|`defaultSceneEventTerminalOpen`|`VITE_FRONTEND_SCENE_EVENT_TERMINAL_OPEN`|boolean|`false`|same as above|
|`engineCapabilityProfile`|`VITE_FRONTEND_ENGINE_CAPABILITY_PROFILE`|`EngineCapabilityProfile`|`'dev'`|`demo`, `dev`, `ops`|
|`engineCapabilitiesEnabled`|`VITE_FRONTEND_ENGINE_CAPABILITIES_ENABLED`|`string[]`|`[]`|comma-separated capability IDs|
|`engineCapabilitiesDisabled`|`VITE_FRONTEND_ENGINE_CAPABILITIES_DISABLED`|`string[]`|`[]`|comma-separated capability IDs|
|`sceneConstraintZones`|`VITE_FRONTEND_SCENE_CONSTRAINT_ZONES`|`SceneConstraintZone[]`|`[]`|JSON array (see below)|
|`sceneEventLogLimit`|`VITE_FRONTEND_SCENE_EVENT_LOG_LIMIT`|positive integer|`300`|any positive integer|
|`sceneDeferredAutoApplyOnRelease`|`VITE_FRONTEND_SCENE_DEFERRED_AUTO_APPLY_ON_RELEASE`|boolean|`true`|same as boolean|
|`publishLocalSceneCommands`|`VITE_FRONTEND_PUBLISH_LOCAL_SCENE_COMMANDS`|boolean|`false`|same as boolean|
|`sceneDeferredApplyMode`|`VITE_FRONTEND_SCENE_DEFERRED_APPLY_MODE`|`SceneDeferredApplyMode`|`'latest_only'`|`latest_only`, `latest`, `apply_all`, `all`|
|`sceneDeferredQueueLimit`|`VITE_FRONTEND_SCENE_DEFERRED_QUEUE_LIMIT`|positive integer|`120`|any positive integer|
|`sceneDeferredRequireConfirmOnRelease`|`VITE_FRONTEND_SCENE_DEFERRED_REQUIRE_CONFIRM_ON_RELEASE`|boolean|`false`|same as boolean|
|`terminalCommandInputRenderer`|`VITE_FRONTEND_TERMINAL_COMMAND_INPUT_RENDERER`|`TerminalCommandInputRenderer`|`'cmdk_ready'`|`classic`, `cmdk_ready`, `cmdk`|
|`sceneUndoLimit`|`VITE_FRONTEND_SCENE_UNDO_LIMIT`|positive integer|`80`|any positive integer|

Sources: [src/core/config/runtimeConfig.ts116-134](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/config/runtimeConfig.ts#L116-L134)

---

## Scalar Types

### `EngineCapabilityProfile`

Defined at [src/core/config/runtimeConfig.ts4](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/config/runtimeConfig.ts#L4-L4)

```
'demo' | 'dev' | 'ops'
```

Controls which engine capabilities start enabled at boot. See [Engine Capability Profiles](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/Engine%20Capability%20Profiles) below.

### `SceneDeferredApplyMode`

Imported from `src/core/scene-domain/sceneDeferred`. Controls behaviour when a deferred remote update is applied.

|Value|Accepted env strings|Meaning|
|---|---|---|
|`'latest_only'`|`latest_only`, `latest`|Only the most recent deferred update is applied; older ones are discarded|
|`'apply_all'`|`apply_all`, `all`|Every queued deferred update is applied in order|

Sources: [src/core/config/runtimeConfig.ts22-28](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/config/runtimeConfig.ts#L22-L28)

### `TerminalCommandInputRenderer`

Defined at [src/core/config/runtimeConfig.ts5](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/config/runtimeConfig.ts#L5-L5)

|Value|Accepted env strings|Meaning|
|---|---|---|
|`'classic'`|`classic`|Plain text input for the terminal command line|
|`'cmdk_ready'`|`cmdk_ready`, `cmdk`|Command-palette-compatible input (default)|

Sources: [src/core/config/runtimeConfig.ts30-39](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/config/runtimeConfig.ts#L30-L39)

---

## `SceneConstraintZone` Parsing

`VITE_FRONTEND_SCENE_CONSTRAINT_ZONES` accepts a **JSON array** string. Each element must be an object with the following fields:

|Field|Type|Required|Notes|
|---|---|---|---|
|`minX`|number|yes||
|`maxX`|number|yes||
|`minZ`|number|yes||
|`maxZ`|number|yes||
|`id`|string|no|Auto-assigned as `zone-N` if absent|
|`assetIds`|string[]|no|Restricts zone to named assets only|

Elements that fail numeric validation are silently dropped. The parser is implemented in `parseConstraintZones` at [src/core/config/runtimeConfig.ts62-97](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/config/runtimeConfig.ts#L62-L97)

**Example:**

```
VITE_FRONTEND_SCENE_CONSTRAINT_ZONES='[{"id":"zone-a","minX":-1,"maxX":1,"minZ":-1,"maxZ":1,"assetIds":["shelf"]}]'
```

---

## Engine Capability Profiles

`ENGINE_CAPABILITY_PROFILE_PRESETS` maps each profile name to explicit enable and disable lists:

**Diagram: `ENGINE_CAPABILITY_PROFILE_PRESETS` contents**

Sources: [src/core/config/runtimeConfig.ts101-114](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/config/runtimeConfig.ts#L101-L114)

|Profile|Enabled capabilities|Disabled capabilities|
|---|---|---|
|`demo`|`engine.sim.preview`|—|
|`dev` _(default)_|`engine.stats`, `engine.sim.preview`|—|
|`ops`|`engine.stats`|`engine.sim.preview`|

---

## `resolveEngineCapabilityDefaultEnabled`

This function is the central arbiter for whether a capability starts enabled. It is called once per capability during registration in `registerDefaultPoseStoreEngineCapabilities` ([src/core/app-commanding/poseStoreCommandBus.ts191-222](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/app-commanding/poseStoreCommandBus.ts#L191-L222)).

**Signature** ([src/core/config/runtimeConfig.ts136-147](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/config/runtimeConfig.ts#L136-L147)):

```
resolveEngineCapabilityDefaultEnabled(capabilityId: string, fallbackDefaultEnabled: boolean): boolean
```

**Resolution order (highest to lowest priority):**

**Diagram: `resolveEngineCapabilityDefaultEnabled` resolution logic**

Sources: [src/core/config/runtimeConfig.ts136-147](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/config/runtimeConfig.ts#L136-L147)

The explicit lists (`engineCapabilitiesEnabled` / `engineCapabilitiesDisabled`) always override the profile preset. This allows per-deployment overrides without changing the profile.

**Example:**

To force-disable `engine.sim.preview` even on the `dev` profile:

```
VITE_FRONTEND_ENGINE_CAPABILITY_PROFILE=dev
VITE_FRONTEND_ENGINE_CAPABILITIES_DISABLED=engine.sim.preview
```

---

## Boolean Parsing Rules

`parseBoolean` ([src/core/config/runtimeConfig.ts7-14](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/config/runtimeConfig.ts#L7-L14)) accepts the following case-insensitive string values:

|Truthy|Falsy|
|---|---|
|`1`, `true`, `yes`, `on`|`0`, `false`, `no`, `off`|

An empty string or unrecognized value falls back to `defaultValue`.

---

## How `runtimeConfig` Flows Into the System

**Diagram: `runtimeConfig` consumers and their fields**

Sources: [src/core/app-commanding/poseStoreCommandBus.ts191-222](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/app-commanding/poseStoreCommandBus.ts#L191-L222) [src/core/config/runtimeConfig.ts116-134](https://github.com/e7canasta/puppet-studio/blob/cdd483bd/src/core/config/runtimeConfig.ts#L116-L134)

`runtimeConfig` is imported directly — it is not injected. All consumers read from the same module-level singleton resolved at application startup.
