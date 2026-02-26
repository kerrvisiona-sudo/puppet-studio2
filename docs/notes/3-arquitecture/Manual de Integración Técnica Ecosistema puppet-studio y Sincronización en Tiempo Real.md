# Manual de Integración Técnica: Ecosistema puppet-studio y Sincronización en Tiempo Real

## 1. Introducción y Arquitectura de Capas

El ecosistema `puppet-studio` se ha consolidado como un espacio de trabajo CAD avanzado basado en navegador, diseñado específicamente para la edición interactiva de planogramas 3D y el monitoreo de flujos de poses en tiempo real. En entornos de alta frecuencia donde la latencia es un factor crítico, la arquitectura impone una segregación estricta de responsabilidades. Esta estructura de capas no es meramente organizativa; es una decisión estratégica para garantizar que la ingesta masiva de datos externos no comprometa la fluidez de la interfaz de usuario ni la integridad de la escena 3D.

La arquitectura se articula en cinco capas fundamentales:

|   |   |   |
|---|---|---|
|Capa|Rol Estratégico|Archivos Clave|
|**Bridge Communication**|Punto de entrada único para WebSockets; gestiona el ciclo de vida de la conexión y la normalización de datos externos.|`src/core/bridge-runtime/`|
|**Central State**|Implementa el "Single Source of Truth" mediante Zustand, asegurando coherencia global en los datos de pose y escena.|`src/app/state/poseStore.ts`|
|**Command System**|Orquestador de mutaciones bajo patrones CQRS; garantiza que cada cambio sea intencional, tipado y trazable.|`src/core/app-commanding/`|
|**UI**|Shell reactivo que integra el motor Three.js, la gestión de widgets y la visualización de planogramas 2D/3D.|`src/features/`|
|**Configuration**|Orquestador de capacidades que resuelve variables de entorno y define el perfil funcional del sistema.|`src/core/config/`|

Estas capas colaboran para orquestar la transformación de paquetes JSON crudos provenientes de servicios de analítica en actualizaciones visuales inmediatas. Los datos fluyen desde el Bridge hacia el estado central, donde la reactividad de React gatilla el renderizado en el viewport 3D y el minimapa 2D, permitiendo una sincronización bidireccional sin cuellos de botella en el hilo principal.

Dada su naturaleza como frontera del sistema, la capa de comunicación es el primer componente crítico que garantiza la estabilidad ante flujos de datos externos.

--------------------------------------------------------------------------------

## 2. Protocolo de Comunicación: El Puente (Bridge) WebSocket

La capa de comunicación, contenida en `src/core/bridge-runtime/`, actúa como el garante de la estabilidad operativa entre el backend de analítica y el frontend. Su responsabilidad estratégica es aislar al resto de la aplicación de las fluctuaciones de red y la variabilidad de los mensajes externos, proporcionando una interfaz de datos predecible y saneada.

### Gestión del Ciclo de Vida de la Sesión

La clase `BridgeSession` encapsula la lógica de transporte, gestionando las fases críticas de la conectividad:

1. **Conexión:** Establece el enlace inicial con el socket, inyectando las credenciales y parámetros de entorno.
2. **Reconexión:** Implementa políticas de reintento ante micro-cortes, asegurando que la monitorización de poses no sufra interrupciones prolongadas.
3. **Desconexión:** Realiza una limpieza proactiva de listeners y estados internos para prevenir fugas de memoria y condiciones de carrera.

### Ciclo de Vida de Mensajes Entrantes

El sistema aplica un pipeline de transformación riguroso para convertir el tráfico de red en acciones de estado:

- **JSON Frame:** Captura del paquete de datos crudo.
- `**parseBridgeInboundMessage**`**:** Deserialización y validación estructural.
- `**ParsedBridgeInboundMessage**` **(discriminated union):** Categorización técnica del mensaje para asegurar la seguridad de tipos.
- `**mapParsedBridgeInboundToActions**`**:** Paso crítico que traduce los datos del dominio externo a instrucciones específicas para el estado de la aplicación.
- `**BridgeStateAction**`**:** Representación abstracta del cambio de estado pretendido.
- `**applyBridgeStateActions**`**:** Ejecución final de la mutación en el `poseStore`.

### Protocolo de Mensajes Salientes

El envío de datos hacia el exterior se gestiona mediante `sendBridgePayload`, el cual delega en un `BridgeSender` registrado vía `setBridgeOutboundSender`. Este desacoplamiento permite que la lógica de negocio permanezca agnóstica a la implementación específica del transporte, facilitando pruebas unitarias y cambios de infraestructura sin impacto en el núcleo de la aplicación.

Este procesamiento garantiza que solo la información validada alcance el almacenamiento central, blindando la lógica de renderizado contra datos malformados.

--------------------------------------------------------------------------------

## 3. Gestión de Estado Centralizado: El `poseStore`

El uso de Zustand para el `poseStore` establece una infraestructura de estado altamente reactiva y centralizada. Al mantener una "Única Fuente de Verdad", el sistema elimina los estados zombis y garantiza que cualquier componente, desde el visor 3D hasta el panel de propiedades, visualice datos sincronizados.

### Análisis del `PoseState`

El estado se segmenta para balancear la granularidad de las actualizaciones y la eficiencia del acceso:

|   |   |   |
|---|---|---|
|Categoría|Ejemplos de Campos|Impacto en el Sistema|
|**Bridge**|`bridgeStatus`, `bridgeError`|Diagnóstico de salud del sistema y feedback visual de conectividad.|
|**Scene**|`scenePlacements`, `sceneId`|Definición estructural de la escena y persistencia de objetos en el espacio.|
|**Avatar / Pose**|`avatarPlanPositionM`, `pose`|Control de alta frecuencia para el renderizado del rig del avatar.|
|**Undo/Redo**|`sceneUndoStack`, `sceneRedoStack`|Gestión de la historia operativa y recuperación de desastres locales.|
|**Sincronización**|`sceneDeferredRemoteQueue`|Control de consistencia eventual entre el cliente y el servidor.|
|**UI**|`cameraView`, `activeToolMode`|Sincronización de la perspectiva del usuario y herramientas de edición.|

### Mecanismo de Consumo

La eficiencia se logra mediante hooks selectores (`usePoseStore`). Esta técnica permite que los componentes se suscriban a fragmentos atómicos de estado, evitando re-renderizados costosos en el viewport Three.js cuando solo cambian metadatos de la interfaz.

Para mantener la integridad, el estado se considera inmutable desde la perspectiva de la UI; cualquier modificación debe ser procesada a través del sistema de comandos.

--------------------------------------------------------------------------------

## 4. Sistema de Comandos y Flujo CQRS

`puppet-studio` adopta el patrón **CQRS** (Command Query Responsibility Segregation) y un rastro de **Event Sourcing** para blindar las mutaciones de estado. Esta arquitectura asegura que cada cambio no sea una simple asignación, sino un evento auditable y reproducible, esencial para la trazabilidad en sistemas de control de activos 3D.

### Desglose del Flujo de Despacho

El flujo se descompone en nueve pasos, cada uno con una justificación técnica orientada a la integridad:

1. **UI → Dispatcher:** El usuario gatilla una intención. _Justificación: Desacopla la interacción física de la lógica de negocio._
2. **Dispatcher → Bus:** El comando recibe metadatos. _Justificación: Permite identificar el origen y el timestamp de la operación._
3. **Bus → Envelope:** Se crea el `AppCommandEnvelope`. _Justificación: Normaliza el paquete para que pueda ser serializado o enviado a través de la red._
4. **Bus → Store:** El evento se añade al `sceneEventLog`. _Justificación: Crea un rastro inmutable (Event Sourcing) para auditoría y debug forense._
5. **Env → Runtime:** El motor busca capacidades. _Justificación: Valida si la instancia actual tiene permiso/lógica para ejecutar la acción._
6. **Runtime → Capability:** Se invocan los handlers registrados. _Justificación: Permite la inyección de comportamientos dinámicos sin tocar el core._
7. **Capability → Port:** El sobre se envía al puerto de salida. _Justificación: Abstrae la ejecución de la mutación de la implementación del almacenamiento._
8. **Port → Store:** Se ejecuta la mutación real. _Justificación: Punto único de entrada para cambios de estado, garantizando consistencia atómica._
9. **Store → UI:** Reactividad. _Justificación: Notifica a la vista de manera eficiente solo cuando el cambio se ha consolidado._

### Análisis de Capacidades (Engine Capability)

La `EngineCapabilityRegistry` funciona como un catálogo de comportamientos ejecutables. Esta arquitectura permite extender el sistema mediante la adición de nuevas capacidades sin alterar el flujo de despacho central, facilitando un entorno de desarrollo modular y robusto.

Este flujo de comandos alimenta directamente las necesidades de análisis espacial, donde la precisión de cada movimiento es procesada por herramientas externas.

--------------------------------------------------------------------------------

## 5. Integración de la Librería de Analítica Python (`lib/`)

La librería de analítica en Python actúa como un servicio de procesamiento de datos independiente, diseñado para manejar las cargas computacionales pesadas que el navegador no puede procesar eficientemente, específicamente en el ámbito de la geometría espacial y la visión artificial.

### Procesamiento de Poses 3D

La joya de la corona de esta librería es el algoritmo de **"cuboid lifting"**. Este algoritmo resuelve el problema fundamental de proyectar detecciones 2D (bounding boxes de cámaras) al espacio mundial 3D. Utilizando modelos matemáticos de cámara y restricciones de profundidad, la librería eleva estos datos planos a cuboides 3D precisos, que son los que finalmente el frontend renderiza como poses en el entorno CAD.

### Utilidades de Ingesta

Incluye herramientas de parseo de payloads que garantizan que el servidor de analítica hable el mismo "idioma" que el Bridge del frontend. Estas utilidades facilitan la normalización de datos antes de que entren al flujo de WebSocket, reduciendo la carga de procesamiento en el cliente.

La complejidad de este procesamiento requiere una observabilidad total para identificar desviaciones en el algoritmo o errores de sincronización.

--------------------------------------------------------------------------------

## 6. Observabilidad y Monitoreo del Sistema

En sistemas de tiempo real, la observabilidad es un pilar estratégico. La capacidad de auditar por qué un objeto se movió o por qué se perdió una conexión es vital para la operación en entornos de producción.

### Registro de Eventos de Escena

Cada actividad, desde un ciclo de vida del Bridge hasta una mutación del motor, se registra mediante `appendSceneEvent` en el `sceneEventLog`. Este registro genera objetos `SceneEventEntry` que capturan el estado del sistema en el momento del evento, permitiendo una reconstrucción temporal de la sesión de trabajo.

### Interfaz de Terminal

El componente `SceneEventTerminal` expone este registro al desarrollador y al operador avanzado, ofreciendo:

- **Filtrado y Búsqueda:** Aislamiento de errores de red o comandos específicos.
- **Inspección de Payload:** Visualización profunda de los datos contenidos en cada comando para validar la precisión del algoritmo de cuboid lifting.
- **Diagnóstico en Tiempo Real:** Herramienta esencial para depurar la latencia entre la llegada del mensaje al Bridge y su visualización en el viewport.

Esta infraestructura de monitoreo es orquestada finalmente por el perfil de ejecución seleccionado al inicio de la aplicación.

--------------------------------------------------------------------------------

## 7. Configuración y Perfiles de Capacidades

El archivo `runtimeConfig.ts` es el orquestador final del ecosistema, definiendo cómo interactúan todos los subsistemas según el contexto de ejecución. Su función principal es resolver el comportamiento del sistema al arranque mediante variables de entorno y perfiles predefinidos.

### Parámetros Configurables Clave

- **Endpoints de Comunicación:** Configuración de la URL del Bridge y lógica de sincronización (inmediata vs. diferida).
- **Restricciones de Escena:** Definición de zonas de exclusión y profundidad máxima del stack de deshacer/rehacer.
- **Perfiles de Capacidad (**`**demo**`**,** `**dev**`**,** `**ops**`**):** Estos perfiles actúan como selectores funcionales que determinan qué controladores se registran en la `EngineCapabilityRegistry`.
- **Toggles Operativos:** Habilitación de la terminal de eventos, modo de edición por defecto y visibilidad de capas de sensores.

### Impacto Operativo

La resolución de estos perfiles permite que el sistema mutile o expanda sus capacidades según la necesidad del usuario: mientras que un perfil `ops` activa todas las herramientas de diagnóstico y terminales, un perfil `demo` puede desactivar capacidades de edición para enfocarse exclusivamente en la visualización fluida de poses. Esta versatilidad garantiza que `puppet-studio` funcione con la máxima eficiencia técnica en cualquier escenario de despliegue.