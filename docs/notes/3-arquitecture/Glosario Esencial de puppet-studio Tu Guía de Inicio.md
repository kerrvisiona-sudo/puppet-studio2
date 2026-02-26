# Glosario Esencial de puppet-studio: Tu Guía de Inicio

## 1. Bienvenida al Ecosistema puppet-studio

¡Bienvenido! Estás a punto de explorar una herramienta avanzada que fusiona el diseño asistido por computadora (CAD) con el análisis de datos en tiempo real. Para dominar esta plataforma, primero debemos entender la esencia de lo que estamos operando.

**Definición Central:** puppet-studio es un espacio de trabajo CAD basado en el navegador, diseñado para la edición interactiva de diseños de escenas 3D (conocidos como planogramas) y el monitoreo de datos de pose en tiempo real transmitidos desde un servicio de análisis externo.

Imagina que tienes una maqueta digital de un espacio físico. puppet-studio no solo te permite mover los objetos de esa maqueta, sino que también te muestra, mediante una conexión en vivo, cómo se mueven los elementos en el mundo real dentro de ese espacio. Para lograr esta "magia" tecnológica, es fundamental familiarizarnos con los términos técnicos que permiten que la información fluya sin interrupciones.

--------------------------------------------------------------------------------

## 2. Conceptos de Visualización: El Espacio de Trabajo

En puppet-studio, interactuamos con el entorno de dos formas principales. Comprender la diferencia entre ellas es clave para una edición precisa y una supervisión efectiva del espacio.

### 2D vs. 3D en puppet-studio

|   |   |   |
|---|---|---|
|Concepto|Dimensión|Utilidad para el usuario|
|**Planograma (MiniMap)**|2D|Representa el **plano de planta**; ideal para visualizar límites de la habitación y la huella de los objetos desde una perspectiva superior.|
|**Renderizado 3D (Viewport)**|3D|Visualización espacial completa; permite inspeccionar, colocar, mover y rotar objetos con profundidad y volumen real.|

_Para que estas visualizaciones cobren vida y reflejen fielmente la realidad, el sistema necesita recibir un flujo constante de datos externos._

--------------------------------------------------------------------------------

## 3. El Flujo de Datos: WebSockets y el Bridge

La comunicación en "tiempo real" no es automática; requiere de una infraestructura dedicada que actúe como un puente inteligente entre el servidor de datos y tu pantalla.

- **WebSocket:** Es la tecnología de comunicación bidireccional que mantiene un canal abierto permanentemente. A diferencia de una web tradicional que solo carga datos al refrescar, el WebSocket permite que los datos "entren" al sistema en el instante en que ocurren.
- **Bridge Communication (Comunicación de Puente):** Es la capa encargada de gestionar este canal. Su componente central, el _BridgeSession_, administra el ciclo de vida de la conexión.

**Funciones principales del Bridge (El "¿Por qué?" de su importancia):**

- **Conectar y Reconectar:** Garantiza que la sesión permanezca activa, gestionando automáticamente las interrupciones para que el flujo no se detenga.
- **Parsear y Mapear Mensajes:** Los datos crudos (JSON) del servidor suelen ser "ruidosos" o complejos. El Bridge los transforma en una estructura limpia denominada `ParsedBridgeInboundMessage` y luego los traduce en acciones específicas (`BridgeStateAction`) que el sistema puede procesar.
- **Enviar Datos:** Permite que tus acciones (como suscribirte a una cámara) viajen de vuelta al servidor para sincronizar el estado global.

_Una vez que los datos cruzan este puente y son procesados, se depositan en el "cerebro" de la aplicación._

--------------------------------------------------------------------------------

## 4. El Cerebro del Sistema: Estado Central (poseStore)

El sistema utiliza una biblioteca llamada **Zustand** para gestionar su **Estado Central**, técnicamente conocido como `poseStore`. Este componente es la **Única Fuente de Verdad** (Single Source of Truth); si algo no está en el store, no existe para la aplicación.

**Componentes del poseStore:**

- **Bridge:** Registra la salud de la conexión (estado, URL y errores detectados).
- **Scene (Escena):** Almacena la ubicación de los objetos, las dimensiones del cuarto y las versiones de la escena.
- **Avatar / Pose:** Recuerda la posición exacta y rotación del avatar digital en el espacio 3D.
- **Undo/Redo:** Gestiona el historial de cambios, permitiéndote retroceder o avanzar en tus ediciones.
- **UI (Interfaz):** Guarda tus preferencias visuales, como el modo de cámara o la herramienta activa.
- **Observability (Observabilidad):** El registro histórico de todos los eventos que han ocurrido en la sesión.

_El estado central no es solo un almacén estático; es un organismo reactivo que se transforma con cada una de nuestras órdenes._

--------------------------------------------------------------------------------

## 5. Acción y Reacción: El Sistema de Comandos (CQRS)

Cada interacción, como mover un mueble, activa un patrón arquitectónico llamado **CQRS** (Command Query Responsibility Segregation). Este método separa la lógica de "pedir un cambio" (Comando) de la lógica de "leer el estado" (Consulta), asegurando que el sistema sea extremadamente estable y predecible.

### El "Viaje de un clic" en 4 etapas clave

1. **🖱️ Interacción:** El usuario realiza una acción en la UI. Esto dispara un **AppCommand**.
2. **📦 Empaquetado:** El comando se envuelve en un sobre de metadatos (**Envelope**) que registra el "quién, cómo y cuándo".
3. **⚙️ Ejecución:** El sistema busca la capacidad necesaria (**Capability**) para procesar la lógica de esa orden específica.
4. **🖼️ Reactivación:** Se produce la **Mutación del Estado** en el `poseStore`. Al cambiar la "Fuente de Verdad", la interfaz de usuario detecta el cambio y se redibuja instantáneamente para mostrar el resultado.

--------------------------------------------------------------------------------

## 6. Vigilancia del Sistema: Observabilidad y Terminal

Para que un desarrollador o usuario avanzado sepa qué ocurre tras bambalinas, puppet-studio implementa un sistema de **Observabilidad**.

- **Scene Event Log:** Un registro histórico y detallado de cada mensaje del Bridge y cada comando ejecutado.
- **Terminal de Eventos:** Una consola integrada que permite inspeccionar estos registros en tiempo real.

[!IMPORTANT] **Tip Pro:** Utiliza la **Terminal de Eventos** para auditar el comportamiento de la escena. Si un objeto no se posiciona correctamente, el log te mostrará exactamente qué `BridgeStateAction` llegó o si algún comando fue bloqueado por el sistema de validación.

--------------------------------------------------------------------------------

## 7. Resumen de Tecnologías Clave

Has recorrido el mapa arquitectónico de puppet-studio. Aquí tienes los cuatro pilares tecnológicos que debes reconocer para dominar la herramienta:

- [ ] **React:** El motor principal que construye el **Workspace Shell** y gestiona todos los paneles interactivos.
- [ ] **Three.js / react-three-fiber:** La potencia gráfica dedicada exclusivamente al **3D Viewport** para renderizar objetos y poses con precisión.
- [ ] **Zustand:** La biblioteca que da vida al **poseStore**, manteniendo la integridad de la "Única Fuente de Verdad".
- [ ] **WebSockets:** El protocolo de comunicación esencial que permite la telemetría y el monitoreo en tiempo real.

**¡Felicidades!** Ahora posees el vocabulario técnico necesario para navegar por puppet-studio. Estás listo para empezar a diseñar y monitorear entornos inteligentes con total confianza.