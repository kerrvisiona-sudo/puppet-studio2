# Especificación de Arquitectura: Patrones CQRS y Event Sourcing en puppet-studio

### 1. Fundamentos de la Arquitectura de Capas

`puppet-studio` se erige como un ecosistema CAD basado en navegador diseñado para la manipulación interactiva de esquemas 3D y el monitoreo de telemetría de posición en tiempo real. En el contexto del navegador, donde el hilo principal de ejecución es un recurso crítico y limitado, la arquitectura de cinco capas no es opcional; es una directriz estratégica para gestionar flujos de datos de alta frecuencia provenientes de WebSockets sin degradar la experiencia de usuario. Esta estructura impone una segregación estricta que permite al sistema escalar su lógica de negocio de manera independiente de la representación visual en Three.js.

La siguiente tabla define los mandatos operativos de cada capa:

|   |   |   |
|---|---|---|
|Capa|Rol Estratégico|Entidades Clave|
|**Bridge Communication**|Normalización de protocolos externos y gestión del ciclo de vida de la conexión.|`BridgeSession`, `ParsedBridgeInboundMessage`, `BridgeSender`.|
|**Central State**|Persistencia en memoria y "fuente única de verdad" (SSoT) para la consistencia del sistema.|`poseStore` (Zustand), `PoseState`.|
|**Command System**|Orquestación de mutaciones mediante el despacho de intenciones validadas y tipadas.|`AppCommand`, `poseStoreCommandBus.ts`, `AppCommandEnvelope`.|
|**UI (Interfaz)**|Renderización reactiva y captura de interacciones en el espacio de trabajo 3D/2D.|`CadWorkspacePage`, `PuppetScene`, `SceneEventTerminal`.|
|**Configuration**|Inyección de perfiles de capacidad y resolución de restricciones de entorno.|`runtimeConfig`, `EngineCapabilityRegistry`.|

Esta compartimentación garantiza que la lógica de sincronización remota jamás interfiera con el ciclo de renderizado, estableciendo el andamiaje necesario para la persistencia reactiva.

--------------------------------------------------------------------------------

### 2. El Estado Centralizado: Anatomía del poseStore

La integridad de un sistema CAD depende de la previsibilidad de su estado. En `puppet-studio`, el `poseStore` (implementado vía Zustand) funciona como el núcleo gravitacional de los datos. No es simplemente un contenedor de variables; es el garante de la sincronía entre el avatar 3D, el minimapa 2D y el servidor remoto.

El `PoseState` (definido en `src/app/state/poseStore.ts`) organiza la información bajo categorías tácticas:

- **Bridge:** Monitorea la salud de la conectividad (`bridgeStatus`, `bridgeError`), esencial para la retroalimentación del sistema en vivo.
- **Scene:** Define la jerarquía estructural (`scenePlacements`, `sceneRoom`), gestionando la revisión y secuencia para evitar conflictos de versiones.
- **Avatar / Pose:** Centraliza la telemetría cinemática, asegurando que el `avatarPlanPositionM` sea la referencia absoluta para todos los observadores.
- **Undo/Redo:** Los campos `sceneUndoStack` y `sceneRedoStack` actúan como salvaguardas de la integridad de la sesión, permitiendo revertir operaciones complejas de diseño sin riesgo de corrupción estatal.
- **Deferred Sync:** El uso de `sceneDeferredRemoteQueue` es una decisión arquitectónica para la resiliencia; permite la tolerancia a latencias de red mediante el encolado de actualizaciones salientes sin bloquear la interacción local.
- **UI:** Gestiona el estado visual efímero, como `cameraView` y la herramienta activa.
- **Observability:** Incluye el `sceneEventLog`, el pilar para la trazabilidad profunda del sistema.

Este estado se consume mediante hooks de selección optimizados, lo que prepara el terreno para que cualquier intento de modificación sea procesado exclusivamente a través del sistema de comandos.

--------------------------------------------------------------------------------

### 3. Implementación del Patrón CQRS (Command Query Responsibility Segregation)

La arquitectura de `puppet-studio` **mandata** el uso de CQRS para blindar el estado central contra efectos secundarios no controlados. Al separar las consultas (lectura reactiva) de los comandos (intenciones de escritura), garantizamos que ninguna interacción de la interfaz pueda puentear las reglas de validación del motor.

El flujo de escritura se articula a través de tres componentes críticos en `src/core/app-commanding/`:

1. **AppCommand:** Definiciones tipadas que representan la intención pura del usuario.
2. **poseStoreCommandBus.ts:** El orquestador central que recibe las intenciones y coordina su paso hacia el motor de ejecución.
3. **AppCommandEnvelope:** La arquitectura **exige** envolver cada comando en este "sobre". El `AppCommandEnvelope` es el habilitador del Event Sourcing, ya que adjunta metadatos vitales (IDs únicos, timestamps) que un comando plano carece, transformando una simple acción en un evento auditable y serializable.

Este desacoplamiento formal es el requisito indispensable para que la lógica de negocio resida en capacidades extensibles y no en la capa de UI.

--------------------------------------------------------------------------------

### 4. El Flujo de Ejecución y el Motor de Capacidades

La transformación de una intención abstracta en una mutación de estado ocurre dentro del motor de capacidades. Este proceso utiliza el `EngineCapabilityRegistry` para localizar dinámicamente el handler adecuado, permitiendo una arquitectura de "plug-and-play" para nuevas funcionalidades.

El flujo de ejecución estándar se descompone en 9 pasos críticos:

|   |   |   |   |
|---|---|---|---|
|Paso|Actor|Acción|Significado Estratégico|
|1|UI → Dispatcher|Interacción del usuario|Captura del evento de entrada (🖱️).|
|2|Dispatcher → Bus|Envoltura con metadatos|Etiquetado para trazabilidad (🏷️).|
|3|Bus → Envelope|Empaquetado de transporte|Preparación para la serialización (📦).|
|4|Bus → Store|Apéndice al flujo de eventos|Registro en el flujo histórico inmutable (🗑️).|
|5|Env → Runtime|Búsqueda de capacidades|Búsqueda de patrones en el registro (🔍).|
|6|Runtime → Capability|Ejecución de handlers|Procesamiento de la lógica de negocio (⚙️).|
|7|Capability → Port|Despacho a través de puerto|Enrutamiento mediante Inyección de Dependencias (🛠️).|
|8|Port → Store|Mutación de estado|Aplicación del cambio en la fuente de verdad (📝).|
|9|Store → UI|Re-renderizado|Ciclo de retroalimentación visual reactiva (🖼️).|

El paso 4 es fundamental: la acción se registra en el flujo de eventos (representado por el log inmutable 🗑️) antes de afectar el estado actual, garantizando que el rastro histórico preceda a la mutación.

--------------------------------------------------------------------------------

### 5. Event Sourcing y la Capa de Observabilidad

En un entorno profesional de edición 3D, la capacidad de auditar la evolución de una escena es una necesidad estratégica. `puppet-studio` implementa un rastro de **Event Sourcing** que captura cada hito del ciclo de vida de la aplicación.

Este mecanismo se basa en dos pilares:

- **appendSceneEvent:** Función responsable de atomicizar cada suceso y enviarlo al registro.
- **sceneEventLog:** Un log inmutable dentro del `poseStore` que almacena objetos `SceneEventEntry`.

Este registro alimenta directamente al componente **SceneEventTerminal**. La importancia arquitectónica de este diseño radica en que permite la **inspección profunda y asíncrona** de los payloads de los comandos. Un ingeniero puede auditar la lógica del sistema en tiempo real a través de la terminal sin interrumpir ni penalizar el rendimiento del loop de renderizado de Three.js, facilitando una depuración forense en entornos de producción.

--------------------------------------------------------------------------------

### 6. Comunicación y Sincronización: Bridge Runtime

La capa de comunicación (Bridge) gestiona el flujo bidireccional de datos con el servidor WebSocket, actuando como un adaptador de protocolos para el estado local.

El flujo de entrada sigue una transformación rigurosa de cuatro etapas para asegurar la validez de los datos externos:

1. **JSON Frame:** Recepción de la trama de red cruda.
2. **ParsedBridgeInboundMessage:** Validación y tipado mediante una unión discriminada.
3. **BridgeStateAction:** Mapeo de los datos externos a acciones entendibles por el store local.
4. **applyBridgeStateActions:** Ejecución final de la mutación en el `poseStore`.

**Gestión de Mensajes Salientes:** La arquitectura utiliza `bridgeOutbound.ts` para centralizar los envíos. Mediante `setBridgeOutboundSender`, se registra un `BridgeSender` que desacopla la lógica de generación de mensajes (como parches de escena) del mecanismo de transporte físico.

Este flujo garantiza que el estado local y el remoto converjan de forma consistente, incluso ante interrupciones de red.

--------------------------------------------------------------------------------

### 7. Síntesis de la Integridad del Sistema CAD

La solidez de `puppet-studio` emana de la convergencia de tres pilares: **CQRS**, **Event Sourcing** e **Inyección de Dependencias (DI)**. La DI se manifiesta explícitamente a través del `AppCommandPort` y el `EngineCapabilityRegistry`. Este diseño permite que el sistema intercambie perfiles de capacidad (`demo`, `dev`, `ops`) según la configuración definida en `runtimeConfig.ts`, alterando el comportamiento del motor sin modificar el código fuente del bus de comandos.

Al desacoplar la interfaz (React/Three.js) de la lógica de negocio residente en las capacidades del motor, `puppet-studio` logra manejar flujos masivos de telemetría manteniendo una fidelidad visual absoluta. Esta arquitectura no solo resuelve los desafíos técnicos de un entorno CAD interactivo contemporáneo, sino que establece un estándar profesional para la creación de herramientas de análisis de datos geoespaciales y 3D altamente resilientes y auditables.