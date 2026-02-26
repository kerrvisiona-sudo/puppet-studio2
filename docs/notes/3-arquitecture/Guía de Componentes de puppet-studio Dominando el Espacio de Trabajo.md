# Guía de Componentes de puppet-studio: Dominando el Espacio de Trabajo

## 1. Introducción al Ecosistema puppet-studio

**puppet-studio** es una plataforma avanzada de grado industrial diseñada para la convergencia entre el diseño espacial y el análisis de datos cinemáticos en tiempo real. Su arquitectura permite a los especialistas no solo modelar entornos físicos, sino también supervisar flujos de información complejos de manera visual e intuitiva.

**Definición de alto nivel:** puppet-studio es un espacio de trabajo CAD basado en el navegador diseñado para la edición interactiva de esquemas de escenas 3D (planogramas) y el monitoreo de datos de pose en tiempo real transmitidos mediante servicios analíticos externos.

Aunque la experiencia del usuario se percibe a través de tres pilares operativos —Conectividad (Bridge), Estado Central (Zustand) e Interfaz (UI)—, el sistema se sustenta técnicamente sobre cinco capas principales que garantizan su estabilidad:

- **Bridge Communication:** Gestión del ciclo de vida de WebSockets.
- **Central State (**`**poseStore**`**):** Almacén único de la "verdad" de la aplicación.
- **Command System:** Despacho de comandos tipificados y serializados.
- **User Interface (UI):** El shell de React y los visores especializados.
- **Configuration:** Resolución de variables de entorno y perfiles de capacidad.

Esta estructura modular asegura que cada interacción esté perfectamente sincronizada con los datos del servidor. Para operar la herramienta con maestría, es imperativo comprender primero cómo el sistema organiza estas capas en una disposición visual coherente.

--------------------------------------------------------------------------------

## 2. El Centro de Operaciones: CadWorkspacePage

La raíz de la interfaz técnica es el componente `**CadWorkspacePage**`. No es simplemente una página, sino el orquestador principal que gestiona el grid de paneles, las divisiones reseteables (splits) y la carga perezosa de los widgets de funcionalidades mayores.

La visibilidad y persistencia del layout no es estática; se gestiona dinámicamente mediante el hook `**useWorkspaceHudState**`. Este controlador guarda la configuración del usuario en el `sessionStorage`, asegurando que el entorno de trabajo se mantenga intacto tras una recarga.

A continuación, se detallan los widgets que componen esta página de operaciones:

|   |   |   |
|---|---|---|
|Nombre Funcional|Componente Técnico|Widget ID|
|**Visor 3D**|`PuppetScene`|—|
|**Propiedades de Pose**|`PoseControlPanel`|`properties`|
|**Mapa de Cámaras**|`CameraSubspaceMap`|`camera`|
|**Minimapa / Planograma**|`PlanogramMiniMap`|`planogram`|
|**Organizador de Escena**|`WorkspaceSceneOutliner`|`outliner`|
|**Terminal de Eventos**|`SceneEventTerminal`|—|

`CadWorkspacePage` proporciona los contenedores lógicos y espaciales que albergan los visores, permitiendo que la información técnica se presente de forma multivariante.

--------------------------------------------------------------------------------

## 3. Visualización Espacial: El Visor 3D y el Planograma 2D

El sistema ofrece dos perspectivas complementarias para interpretar el espacio de trabajo: una inmersiva basada en profundidad y otra esquemática orientada a la planta.

### 3.1 El Visor 3D (`PuppetScene`)

Desarrollado con **react-three-fiber**, este componente es el núcleo de renderizado de la aplicación. Gestiona la escena tridimensional mediante los siguientes elementos críticos:

- **PuppetRig:** El avatar articulado cuya jerarquía de articulaciones es impulsada directamente por el campo `pose` del `poseStore`.
- **RoomEnvironment:** Encargado de la carga de activos GLTF desde el catálogo de activos para representar el entorno físico.
- **MonitoringSensorLayer:** Capa técnica que proyecta los volúmenes de detección de las cámaras en el espacio 3D.
- **CameraPresetController:** Gestor de ángulos de visión predefinidos y controles de órbita.

**Capacidades de interacción:**

- [ ] Colocar **Placements** (objetos de escena) en el espacio tridimensional.
- [ ] Mover **Placements** mediante ejes de coordenadas.
- [ ] Rotar objetos para ajustar su orientación exacta respecto al mundo.

### 3.2 El Minimapa de Planogramas (`PlanogramMiniMap`)

Proporciona una representación cenital simplificada (2D) del suelo de la escena. Es la herramienta principal para la gestión de la distribución espacial sin la carga cognitiva del entorno 3D.

- **Función:** Rendea un canvas 2D que muestra los límites de la sala, la ubicación de las cámaras y la "huella" o posición exacta del avatar en el plano horizontal.

**Capacidades de interacción:**

- [ ] Visualizar límites de seguridad y colisiones de paredes.
- [ ] Identificar la cobertura de las cámaras de monitoreo.
- [ ] Supervisar la trayectoria del avatar mediante coordenadas `avatarPlanPositionM`.

--------------------------------------------------------------------------------

## 4. Paneles de Gestión, Propiedades y Cámaras

Para interactuar con los datos que habitan en los visores, el usuario emplea paneles de control fino que modifican el estado central de la escena.

- **PoseControlPanel:** Este panel de **Propiedades de la Pose** permite inspeccionar y editar los atributos específicos de la postura del avatar y las coordenadas reportadas por el flujo de datos.
- **WorkspaceSceneOutliner:** Actúa como un árbol jerárquico para la **organización de la escena**. Facilita la selección rápida de objetos, la gestión de visibilidad y la estructura de capas de los elementos presentes.
- **CameraSubspaceMap:** Panel especializado en la **gestión de cámaras en el espacio**. Permite administrar la distribución de sensores de monitoreo y supervisar sus áreas de influencia dentro del entorno virtual.

Esta capacidad de manipulación directa se complementa con un sistema de registro que documenta cada cambio realizado en el motor.

--------------------------------------------------------------------------------

## 5. Observabilidad: La Terminal de Eventos de Escena

El componente `**SceneEventTerminal**` funciona como el diario de vida técnico del sistema. No es una simple consola; expone el `sceneEventLog` del `poseStore`, registrando desde ciclos de vida del Bridge hasta cambios de estado críticos.

Cada acción del usuario o actualización del sistema se empaqueta como un `**AppCommand**`, el cual es serializado dentro de un `**AppCommandEnvelope**`. Esta estructura de "sobre" permite que la terminal capture metadatos precisos, facilitando la inspección detallada de la carga útil (payload).

Sus funciones críticas son:

1. **Filtrado de eventos:** Aislamiento de mensajes por tipo (ej. errores de conexión vs. actualizaciones de pose).
2. **Búsqueda:** Localización de hitos específicos en el flujo histórico de la sesión.
3. **Inspección de carga útil (payload):** Desglose de los datos técnicos serializados que componen cada comando enviado al motor.
4. **Entrada de comandos:** Línea de comandos (CLI) para ejecutar instrucciones directas sobre el runtime de la aplicación.

--------------------------------------------------------------------------------

## 6. Configuración y Estado del Sistema (El "Motor" Invisible)

El comportamiento de la interfaz está dictado por la sincronización entre el `**poseStore**` (estado en tiempo real) y el `**runtimeConfig**` (reglas y capacidades). El monitoreo de estos campos es esencial para validar la integridad de la sesión.

|   |   |
|---|---|
|Categoría de Estado|Campos que el usuario monitorea|
|**Bridge (Conexión)**|`bridgeStatus`, `bridgeUrl`, `bridgeError`|
|**Scene (Escena)**|`scenePlacements`, `sceneId`, `sceneRevision`|
|**Avatar / Pose**|`avatarPlanPositionM`, `avatarRotationDeg`, `pose`|
|**UI (Interfaz)**|`activeToolMode`, `cameraView`, `projectionMode`|
|**Undo/Redo**|`sceneUndoStack`, `sceneUndoDepth`|

Comprender la interconexión de estos componentes técnicos le otorga el control total sobre puppet-studio, permitiéndole transformar flujos de datos abstractos en decisiones espaciales de alta precisión. ¡Explore el espacio de trabajo y domine el entorno!