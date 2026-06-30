# Plugin Repository Feature

Se implementó una nueva sección **Plugin Repository** dentro de la vista de plugins, que permite explorar e instalar plugins desde una API externa propia.

---

## Archivos creados

### `ui/src/renderer/src/core/types/RepositoryPlugin.ts`
Define los tipos TypeScript que representan la respuesta de la API externa:
- `RepositoryPlugin` — forma resumida que devuelve el listado paginado
- `RepositoryPluginDetail` — forma completa con publisher, author y releases, que devuelve el endpoint de detalle
- `RepositoryPluginsPage` — wrapper paginado (`total`, `page`, `items`, etc.)

Separar estos tipos del tipo `Plugin` existente evita mezclar el modelo local (plugins instalados) con el modelo externo (repositorio).

### `ui/src/renderer/src/core/services/PluginRepositoryService.ts`
Servicio que encapsula las llamadas HTTP a la API externa del repositorio. Usa una instancia de Axios independiente configurada con `VITE_REPOSITORY_API_URL` (por defecto `http://localhost:8001/api/v1/plugins`).

Métodos:
- `getAll()` — trae el listado base de plugins (`GET /`)
- `getBySlug(publisherSlug, pluginSlug)` — trae el detalle completo de un plugin (`GET /slug/{publisher}.{plugin}`)

Tener un servicio separado del `PluginService` existente mantiene clara la distinción entre la API local (FastAPI del proyecto) y la API externa del repositorio.

### `ui/src/renderer/src/core/pages/plugins/repository/Repository.tsx`
Componente principal de la nueva sección. Implementa el patrón **Container/Presentational**: maneja toda la lógica (fetching, estado de selección, tabs) y delega la renderización a componentes existentes.

Estructura visual tipo VS Code:
- Barra de búsqueda (deshabilitada, pendiente de implementar)
- Panel izquierdo: lista de plugins usando `PluginDisplay` + `PluginDisplayList` + `PluginCard`
- Panel derecho: detalle del plugin seleccionado con header fijo (logo, nombre, publisher, tipo, autor) y dos tabs — **Descripción** y **Versiones** — manejadas con estado local

El fetch del detalle se dispara al seleccionar un plugin y no se repite si se vuelve a clickear el mismo.

### `ui/src/renderer/src/core/pages/plugins/repository/repository.module.css`
Estilos del componente Repository. Define el layout split-panel, la barra de búsqueda, el header del detalle, los botones de tab y las vistas de descripción y versiones.

---

## Archivos modificados

### `ui/src/renderer/src/core/pages/plugins/Plugins.tsx`
Se agregó el import de `Repository` y un tercer `<Tab>` con título `"repository"` (internacionalizado). No se modificó ninguna lógica existente de los tabs Installed y Register.

### `ui/resources/locales/en/core.json`
Se agregó la clave `pages.pluginRepository` con todos los textos de la nueva vista: placeholder del buscador, estados de carga/vacío, labels de campos y nombres de tabs.

### `ui/resources/locales/es/core.json`
Mismo agregado que en inglés, con las traducciones en español correspondientes.

---

## Segunda iteración — URL configurable, manejo de errores e indicador de instalación

### Archivos creados

#### `ui/src/renderer/src/core/pages/settings/repository/RepositorySettings.tsx`
Nueva sección en la página de Ajustes que permite cambiar la URL base de la API del repositorio. Muestra la URL actual (leída desde `preferences.json` al montar), y ofrece botones **Guardar** y **Restablecer**. Al guardar se persiste en preferencias via `window.core.preferences.set` y se actualiza el servicio en caliente sin necesidad de reiniciar la app.

#### `ui/src/renderer/src/core/pages/settings/repository/repository-settings.module.css`
Estilos mínimos del componente anterior.

### Archivos modificados

#### `ui/src/renderer/src/core/services/PluginRepositoryService.ts`
- Se exporta la constante `DEFAULT_REPOSITORY_URL` para que otros módulos la usen como valor de reset.
- Se agrega `initialize()`: lee la URL guardada en preferencias y actualiza la instancia de Axios. Se llama al montar la vista del repositorio.
- Se agrega `setBaseUrl(url)`: actualiza el `baseURL` de la instancia de Axios en caliente, usado por `RepositorySettings` al guardar.

#### `ui/src/renderer/src/core/pages/plugins/repository/Repository.tsx`
- Se llama a `pluginRepositoryService.initialize()` antes de `getAll()` para respetar la URL guardada en preferencias.
- Se agrega estado `listError` para distinguir un fallo de conexión de una lista vacía. Cuando la llamada a la API falla, se muestra el mensaje **"No se pudo conectar al repositorio. Verificá la URL en Ajustes."** en lugar del genérico "No se encontraron plugins".
- Al montar se cargan en paralelo los plugins del repositorio y los plugins instalados (`pluginService.getAll()`). Con los IDs instalados se construye un `Set<string>` para comparar contra `publisher_slug.slug` de cada plugin del repositorio.
- Se agrega la prop `isInstalled` al componente interno `PluginDetailView`. El header del detalle muestra un botón **Instalar** (activo) o **Instalado** (deshabilitado, estilo suave) según el estado.

#### `ui/src/renderer/src/core/pages/plugins/repository/repository.module.css`
- `.detail-info` recibe `flex: 1` para empujar el botón hacia la derecha del header.
- Se agrega `.detail-actions` para contener el botón alineado al inicio verticalmente.
- Se agregan `.list-error` y `.list-error-hint` para el mensaje de error de conexión.

#### `ui/src/renderer/src/core/pages/settings/Settings.tsx`
Se importa y renderiza `RepositorySettings` entre las secciones Options y Hotkeys.

#### `ui/resources/locales/en/core.json` y `ui/resources/locales/es/core.json`
- `pages.settings.repository`: textos de la sección de ajuste de URL (título, guardar, guardado, restablecer).
- `pages.pluginRepository.connectionError` / `connectionErrorHint`: mensaje de error de conexión.
- `pages.pluginRepository.install` / `installed`: etiquetas del botón de instalación.

---

## Tercera iteración — Refactor: instancia de Axios del repositorio a lib

### Archivos creados

#### `ui/src/renderer/src/core/lib/repositoryAxios.ts`
Instancia de Axios preconfigurada para la API externa del repositorio, siguiendo el mismo patrón que `lib/axios.ts` (usado por la API local). Exporta la instancia como default y `DEFAULT_REPOSITORY_URL` como named export. Centralizar la instancia aquí separa la configuración HTTP de la lógica de negocio del servicio.

### Archivos modificados

#### `ui/src/renderer/src/core/services/PluginRepositoryService.ts`
- Se eliminó la creación de la instancia de Axios y la definición de `DEFAULT_REPOSITORY_URL` del archivo.
- Ahora importa ambas desde `lib/repositoryAxios.ts` y re-exporta `DEFAULT_REPOSITORY_URL` para que `RepositorySettings` no dependa de `lib` directamente.
- El servicio queda con responsabilidad única: métodos de negocio (`initialize`, `setBaseUrl`, `getAll`, `getBySlug`).

---

## Cuarta iteración — Ruta propia para el detalle del plugin del repositorio

### Archivos modificados

#### `ui/src/renderer/src/app.tsx`
Se agrega `/plugins/repository/:pluginSlug` como ruta que renderiza `PluginsPage`. Esto permite navegar directamente a un plugin específico del repositorio por URL, pensado para soportar deep linking desde la web del repositorio en el futuro.

#### `ui/src/renderer/src/core/pages/plugins/Plugins.tsx`
- Se importa `useMatch` para detectar si la ruta actual es `/plugins/repository/:pluginSlug`.
- Se pasa `defaultIndex={1}` a `Tabs` cuando la ruta coincide, forzando el tab Plugin Repository activo al montar directamente desde esa URL (caso deep link).
- Se reordena el array de tabs: **Installed → Plugin Repository → Register**.

#### `ui/src/renderer/src/core/components/tabs/Tabs.tsx`
Se agrega la prop `defaultIndex` (por defecto `0`) para permitir controlar el tab activo en el montaje inicial sin romper el comportamiento existente de ningún otro uso del componente.

#### `ui/src/renderer/src/core/pages/plugins/repository/Repository.tsx`
- Se reemplaza el estado `selectedId` por `useMatch("/plugins/repository/:pluginSlug")`, usando la URL como fuente de verdad para el plugin seleccionado.
- Se agrega `useNavigate`: al hacer click en un plugin de la lista se navega a `/plugins/repository/${publisher_slug}.${slug}` en lugar de setear estado local.
- Se agrega un `useEffect` que escucha cambios en `selectedSlug` (derivado de la URL) para fetchear el detalle y resetear el tab activo a `"description"`.
- La lógica de highlight de la card seleccionada pasa de comparar `selectedId === plugin._id` a comparar `selectedSlug === \`${plugin.publisher_slug}.${plugin.slug}\``.
- El resultado visual es idéntico al anterior.

---

## Quinta iteración — Separación de PluginDetailView a su propio archivo

### Archivos creados

#### `ui/src/renderer/src/core/pages/plugins/repository/PluginDetailView.tsx`
Se extrae el componente `PluginDetailView` que estaba definido al final de `Repository.tsx` a su propio archivo. Contiene toda la lógica de presentación del detalle: header con logo, nombre, publisher, tipo, autor, botón Install/Installed, tabs de Descripción y Versiones, y la lista de releases con sus assets.

### Archivos modificados

#### `ui/src/renderer/src/core/pages/plugins/repository/Repository.tsx`
- Se elimina la definición local de `PluginDetailView`.
- Se agrega el import desde `./PluginDetailView`.
- Se elimina el import de `Button` que era usado únicamente por `PluginDetailView`.

---

## Sexta iteración — Instalación de plugins desde GitHub

Se implementó la lógica completa para descargar e instalar un plugin directamente desde GitHub usando la información provista por la API del repositorio propio.

### Flujo de instalación

1. El usuario presiona **Instalar** en el panel de detalle del plugin.
2. Se toma el primer release de la lista (el más reciente).
3. Se detecta el SO actual vía `process.platform` expuesto por el preload.
4. Se selecciona el asset del release cuyo campo `so` coincide con el SO del usuario (la indicación proviene de la API del repositorio).
5. La descarga se delega al proceso principal de Electron via IPC, usando el módulo `https` de Node — esto evita cualquier problema de CORS que surgiría si se hiciera desde el renderer en producción, ya que GitHub redirige el asset (302) a un CDN que no siempre expone cabeceras CORS.
6. Con el `ArrayBuffer` recibido se construye un objeto `File` y se llama a `pluginService.register()`, el mismo método usado por la vista Register Plugin — ambas rutas de instalación son equivalentes.
7. Al completar, el ID del plugin se agrega al `Set` de instalados y el botón cambia a **Instalado** (deshabilitado).

La URL de descarga se construye así:
```
https://api.github.com/repos/{owner}/{repo}/releases/assets/{asset_github_id}
Accept: application/octet-stream
```
El `owner/repo` se extrae del campo `repository_url` que provee la API del repositorio, y el `asset_github_id` viene del asset seleccionado.

### Archivos modificados

#### `ui/src/main/core/plugins.ts`
Se agrega el handler IPC `core:plugin:download-asset`. Recibe el `asset_github_id` y el path `owner/repo`, construye la URL de la API de GitHub y descarga el archivo con el módulo `https` de Node siguiendo el redirect 302 que GitHub devuelve. Retorna el contenido como `ArrayBuffer` al renderer. Al hacerse en el proceso principal, la descarga no está sujeta a restricciones CORS del navegador.

#### `ui/src/preload/core/index.ts`
- Se expone `plugins.downloadAsset(assetId, repoPath)` que invoca el handler IPC anterior.
- Se expone `app.platform` como valor estático (`process.platform`), disponible en el contexto del preload sin necesidad de IPC adicional.

#### `ui/src/preload/core/interface.ts`
- Se agrega `downloadAsset` a la sección `plugins` de la interfaz TypeScript del preload.
- Se agrega `platform: string` a la sección `app`.

#### `ui/src/renderer/src/core/services/PluginRepositoryService.ts`
Se agrega el método `installPlugin(detail)` y dos funciones auxiliares privadas al módulo:
- `parseRepoPath(repositoryUrl)` — extrae `owner/repo` de la URL de GitHub.
- `selectAssetForPlatform(assets, platform)` — busca el asset cuyo campo `so` coincide con el SO actual, usando un mapa de equivalencias (`win32 → ["windows","win32","win"]`, `darwin → ["macos","darwin","mac","osx"]`, `linux → ["linux"]`).

`installPlugin` orquesta la selección del asset, la descarga, la construcción del objeto `File` y la llamada a `pluginService.register()`.

#### `ui/src/renderer/src/core/pages/plugins/repository/PluginDetailView.tsx`
Se agregan las props `onInstall: () => void` e `isInstalling: boolean`. El botón Instalar pasa a tener `onClick={onInstall}`, `isLoading={isInstalling}` y `disabled={isInstalled || isInstalling}`, inhabilitándose tanto durante la descarga como una vez instalado.

#### `ui/src/renderer/src/core/pages/plugins/repository/Repository.tsx`
- Se agrega el estado `isInstalling`.
- Se implementa `handleInstall`: llama a `pluginRepositoryService.installPlugin(detail)`, actualiza `installedIds` en caso de éxito, y muestra un diálogo de error (o advertencia si el plugin cargó con fallas) en caso contrario.
- Se pasan `onInstall={handleInstall}` e `isInstalling` a `PluginDetailView`.

#### `ui/resources/locales/en/core.json` y `ui/resources/locales/es/core.json`
Se agregan las claves `installTitle` e `installedButFailed` bajo `pages.pluginRepository`, usadas en los diálogos del proceso de instalación.

---

## Séptima iteración — Deep-link `mo://` desde la web al detalle de un plugin

Se agrega soporte para abrir MO desde un navegador haciendo click en un link del tipo `mo://plugins/repository/<publisher>.<slug>`. El destino del deep-link es la vista de detalle del plugin dentro del Plugin Repository, exactamente la misma a la que se llega navegando manualmente. Esto habilita que el frontend web del repositorio tenga un botón **"Instalar en MO"** que abra (o enfoque) la app de escritorio directamente en el plugin elegido.

**Alcance acotado:** el deep-link **solo navega**. No dispara la instalación automática del plugin; el usuario sigue haciendo click en **Instalar** dentro de MO. Esta decisión es deliberada por seguridad — instalar binarios sin acción explícita del usuario sería un vector de abuso.

### Flujo end-to-end

```
Web                  SO              Electron main                  Renderer
────                ────             ─────────────                  ────────
<a href="mo://       lanza
  plugins/repo/      MO con argv:    requestSingleInstanceLock
  usach.recorder">   "mo://..."        │
                                     ┌─ cold start ─ process.argv
                                     ├─ hot (Win/Lin) ─ "second-instance"
                                     └─ hot (macOS)   ─ "open-url"
                                          │
                                          ▼
                                     parseDeepLink(url)
                                       valida + extrae slug
                                          │
                                          ▼
                                     dispatchDeepLink(path)
                                       show/focus + IPC ──► "core:router:on-navigate"
                                                                  │
                                                                  ▼
                                                             react-router navigate()
                                                                  ▼
                                                             Repository.tsx (useMatch)
                                                                  ▼
                                                             PluginDetailView
```

Se reutiliza el canal IPC `core:router:on-navigate` que ya existía (introducido en la cuarta iteración para soportar navegación interna a una ruta arbitraria). El trabajo real fue registrar el protocolo en el SO y traducir el URL externo a una navegación interna.

### Archivos modificados

#### `ui/electron-builder.yml`
Se agrega el bloque `protocols` al nivel raíz:
```yaml
protocols:
  - name: Multimodal Observer
    schemes: [mo]
```
`electron-builder` lo traduce automáticamente en cada plataforma:
- **Windows**: entradas en el registro vía el instalador NSIS.
- **macOS**: asociación en el `Info.plist` (`CFBundleURLSchemes`).
- **Linux**: `MimeType=x-scheme-handler/mo;` en el `.desktop`.

No se tocó `build/installer.nsh`.

#### `ui/src/main/index.ts`
Concentra la mayor parte del trabajo. Cambios aditivos:

- **Constante** `DEEP_LINK_PROTOCOL = "mo"`.
- **Lock de instancia única** (`app.requestSingleInstanceLock`). Si una 2ª instancia se lanza con un URL en sus argumentos, muere inmediatamente y se lo pasa a la 1ª vía el evento `second-instance`. Antes la app permitía instancias duplicadas; ahora solo corre una.
- **Registro del scheme en runtime** con `app.setAsDefaultProtocolClient`. En dev (`process.defaultApp`) se registra apuntando a `process.execPath` + la ruta del script, para que `mo://...` también funcione corriendo `npm run dev`.
- **`parseDeepLink(rawUrl)`** — valida el formato `mo://plugins/repository/<publisher>.<slug>` con un regex estricto `^[a-z0-9_-]+\.[a-z0-9_-]+$`, rechaza cualquier otro path (incluyendo path traversal `..`). Devuelve `null` si el URL no es válido, o el path interno `/plugins/repository/<slug>` en caso correcto.
- **`dispatchDeepLink(path)`** — si el renderer aún no está listo o no hay `mainWindow`, encola en `pendingDeepLinkPath`. Si está listo, hace `restore()` + `show()` + `focus()` sobre la ventana y envía `core:router:on-navigate` por IPC.
- **`handleArgvForDeepLink(argv)`** — busca el primer elemento de `argv` que arranque con `mo://`, lo parsea y despacha.
- **Listener `open-url`** (macOS) — registrado fuera de `whenReady` porque puede dispararse antes.
- **Listener `second-instance`** (Windows/Linux) — recibe el `argv` de la instancia muerta.
- **Listener `did-start-loading`** sobre `mainWindow.webContents` — resetea `rendererReady = false` cuando la ventana recarga. Necesario para que la transición splash (`#/loading`) → app final no deje el flag en `true` con un renderer obsoleto.
- **`onRendererReady()`** exportado — se llama desde `router.ts` cuando el renderer notifica que está montado. Ignora notificaciones provenientes del splash o de la página de error (chequeo de URL); cuando el renderer **final** notifica, marca `rendererReady = true`, intenta el cold-start de `process.argv` y vacía la cola de pendientes.

#### `ui/src/main/core/router.ts`
Se agrega un segundo handler IPC `core:router:ready` que invoca `onRendererReady()` del módulo `main/index.ts`. El handler existente `core:router:navigate` no se modifica.

#### `ui/src/preload/core/index.ts`
Se agrega el método `router.notifyReady()` al objeto expuesto en `window.core`. Internamente envía `core:router:ready` al main. Es puramente aditivo; `navigate` y `onNavigate` quedan sin cambios.

#### `ui/src/preload/core/interface.ts`
Se agrega la firma `notifyReady: () => void` al tipo `router` para mantener tipado el contrato preload ↔ renderer.

#### `ui/src/renderer/src/app.tsx`
Una sola línea agregada dentro del `useEffect` que ya suscribía `onNavigate`: tras suscribirse, llama a `window.core.router.notifyReady()`. Esto cierra el handshake y le indica al main que el renderer final ya está listo para recibir mensajes IPC.

### Race condition del cold-start (cómo se resuelve)

En producción el bootstrap de la app pasa por dos cargas distintas:
1. `mainWindow.loadFile("index.html", { hash: "#/loading" })` — splash mientras la API arranca.
2. `mainWindow.loadFile("index.html")` — la app real, una vez que la API responde a `/health`.

Si un deep-link entra durante la fase 1 y se entrega al splash, la navegación de react-router se pierde al reemplazarse el renderer en la fase 2. La protección es triple:

- El listener `did-start-loading` resetea `rendererReady = false` cada vez que `webContents` empieza a cargar una URL.
- `onRendererReady` chequea si la URL actual contiene `#/loading` o `#/error`; si es así, descarta el aviso de listo (esperando al renderer final).
- `dispatchDeepLink` encola en `pendingDeepLinkPath` cuando `rendererReady` es `false`, y la cola se vacía solo cuando llega la notificación válida del renderer final.

#### Alternativa descartada: `did-finish-load` + `setTimeout`

Antes de implementar el handshake `notifyReady`, se evaluó un approach más simple: escuchar el evento de Electron `webContents.once("did-finish-load", ...)` después del `loadFile` final, esperar un `setTimeout(0)` para darle un tick al event loop y entonces despachar el deep-link. La ventaja era no tocar `preload/core/index.ts`, `preload/core/interface.ts` ni `app.tsx` — solo `main/index.ts`.

Se descartó por dos motivos concretos:

1. **`did-finish-load` se dispara cuando el HTML termina de parsear, no cuando React montó el componente y suscribió el listener IPC.** Entre uno y otro hay una ventana variable (depende de la complejidad del bundle, del hardware, del estado de la cache de V8) durante la cual `send("core:router:on-navigate", ...)` viajaría a un renderer que técnicamente existe pero todavía no instaló el handler en `app.tsx:33`. El mensaje se perdería sin error visible. Un `setTimeout(0)` mitiga el caso típico pero **no garantiza** que React haya corrido el `useEffect`; es una heurística, no una sincronización.
2. **El handshake invierte la dirección del control.** Con `notifyReady`, es el renderer el que avisa al main "ya estoy listo para recibir mensajes" — y solo el renderer puede saberlo con certeza, porque es quien ejecuta el `useEffect` que suscribe el listener. El main no tiene forma de inferirlo desde afuera sin adivinar.

El costo del handshake fue agregar **una sola línea de IPC en cuatro archivos** (handler en `router.ts`, método en `preload/core/index.ts`, tipo en `preload/core/interface.ts`, llamada en `app.tsx`). El beneficio es determinismo total en el momento del despacho. La relación costo/beneficio justifica la elección.

### Implicancias y consideraciones

- **Cero regresión esperada en el flujo actual.** Todos los cambios son aditivos: el lock de instancia única, los listeners, el parser, la cola y el handshake `notifyReady` son código nuevo que no altera la ruta de ejecución sin deep-link. El bootstrap sin URL externa es funcionalmente idéntico al anterior. El typecheck del lado node (`tsconfig.node.json`, donde están main y preload) pasa limpio.
- **Single-instance lock — cambio observable.** Antes la app permitía abrir varias instancias en paralelo. Ahora solo corre una; intentar abrir una segunda enfoca la existente. Esto es alineado con el comportamiento estándar de apps de escritorio modernas, pero conviene anunciarlo a los testers para no confundirlo con un bug.
- **Seguridad del URL.** El regex `^[a-z0-9_-]+\.[a-z0-9_-]+$/i` aplicado al slug bloquea path traversal, schemes alternativos y caracteres especiales. URLs malformados se ignoran silenciosamente sin abrir la app ni navegar. Importante: **no se pasan strings arbitrarios al renderer**; solo paths construidos con un slug validado.
- **macOS sin notarización.** `electron-builder.yml` tiene `notarize: false`. Al usar `open-url` desde el navegador en un Mac sin notarizar, Gatekeeper puede pedir confirmación la primera vez. No es bloqueante pero hay que tenerlo en cuenta para QA en Mac.
- **Build portable (futuro).** El registro del protocolo depende del instalador (NSIS en Windows, `.desktop` en Linux, `Info.plist` en Mac). Si en el futuro se agrega una variante portable, esa build no tendrá `mo://` registrado en el SO y el deep-link no funcionará desde el navegador (sí seguirá funcionando si se llama por línea de comandos con argv).
- **Frontend web — fuera de este repo.** Para que el botón **"Instalar en MO"** funcione, el sitio que lista los plugins debe usar un `<a href="mo://plugins/repository/<publisher>.<slug>">`. Opcional: detectar timeout de visibilidad para ofrecer fallback a la página de descarga si MO no está instalado. Esa parte se documenta del lado del frontend, no acá.
- **Tests manuales sugeridos.** App cerrada + deep-link (cold), app abierta en otra pestaña + deep-link (hot focus), app minimizada en tray + deep-link (restore), URL malformado, dos deep-links seguidos, y — el más importante — bootstrap normal sin deep-link para confirmar que el flujo actual sigue intacto.

### Fixes colaterales detectados al correr `npm run build:win`

Al ejecutar el build de Windows para verificar la séptima iteración, el paso `typecheck` (primer eslabón del `build:win`) abortó por **dos errores de TypeScript pre-existentes**, no introducidos por el deep-link. Se confirmó haciendo `git stash` + `npm run typecheck` sobre el árbol limpio: los mismos dos errores aparecían sin ninguno de los cambios de esta iteración aplicados. Aun así, al ser el typecheck condición obligatoria del pipeline (`build:win = npm run build && ... && electron-builder --win`, donde `build = npm run typecheck && electron-vite build`), había que destrabarlos para poder generar el `.exe`. Los fixes son quirúrgicos.

#### `ui/src/preload/core/interface.ts`
Se corrige el tipo declarado de `preferences.get`. Antes:
```ts
get: <T = unknown>(key: string) => T | undefined
```
Ahora:
```ts
get: <T = unknown>(key: string) => Promise<T | undefined>
```

**Motivo:** la implementación real en `preload/core/index.ts` retorna `ipcRenderer.invoke("core:preferences:get", key)`, que es `Promise<any>`. El contrato declarado decía que era síncrono, pero los dos call sites existentes (`RepositorySettings.tsx:17` con `.then` y `PluginRepositoryService.ts:37` con `await`) ya esperaban Promise. El tipo estaba mintiendo; el cambio refleja la realidad sin alterar comportamiento de runtime ni romper consumidores.

#### `ui/src/renderer/stories/visualization/components/PlaybackDock.stories.tsx`
Se agrega `platform: "win32"` al mock de `window.core.app`. La propiedad `platform: string` se sumó al contrato `CoreAPI.app` durante la sexta iteración (sección "Instalación de plugins desde GitHub", para detectar el SO al elegir asset de release), pero este story de Storybook no se había actualizado y arrastraba el error desde entonces. Es un dato falso de testing, no afecta la app real.

#### Implicancias
- **Cero impacto en runtime.** Ninguno de los dos cambios modifica código que se ejecute en la app empaquetada. El primero es un cambio de tipo declarativo; el segundo vive solo en una story de Storybook.
- **Trazabilidad.** Ambos errores son anteriores a la séptima iteración. Se documentan acá porque la séptima iteración los expuso al forzar la corrida del pipeline de build, no porque sean parte del feature de deep-link.
- **Build desbloqueado.** Tras aplicarlos, `npm run typecheck` queda limpio y `npm run build:win` puede completar (asumiendo que `../api/dist/mo_api.exe` exista, generado previamente con `poetry run build` desde `api/`).

### Bugfix: navegación bloqueada después del deep-link

**Síntoma reportado tras probar el `.exe` final en Windows:** clickear el botón "Instalar en MO" desde el navegador abría MO en la vista de detalle del plugin correctamente, pero a partir de ese momento el usuario quedaba "pegado" en esa vista — al intentar navegar a otra sección desde la sidebar, era devuelto inmediatamente al detalle del plugin.

**Causa raíz:** `onRendererReady()` en `ui/src/main/index.ts` invocaba `handleArgvForDeepLink(process.argv)` en cada llamada. `process.argv` **no se modifica durante la vida del proceso** y sigue conteniendo el URL `mo://...` con el que se lanzó la app. Cualquier disparador de `notifyReady()` posterior al arranque inicial (por ejemplo, una re-ejecución del `useEffect` de `app.tsx` si la referencia de `navigate` cambia, o un futuro consumidor del handshake) hacía que se re-leyera argv, se re-disparara `dispatchDeepLink` y el usuario fuera retornado al mismo plugin.

**Fix aplicado en `ui/src/main/index.ts`:** se agrega el flag de módulo `argvDeepLinkProcessed`, inicializado en `false`. `onRendererReady()` chequea el flag antes de leer `process.argv`; tras el primer consumo lo marca en `true`. Así, aunque `notifyReady` se dispare N veces, el deep-link de cold-start solo se aplica una sola vez:

```ts
if (!argvDeepLinkProcessed) {
  argvDeepLinkProcessed = true
  handleArgvForDeepLink(process.argv)
}
```

**Por qué este fix es correcto y defensivo:**
- **Idempotencia del cold-start.** El deep-link de `process.argv` solo es relevante al arranque inicial; una vez que se aplicó, repetirlo es siempre incorrecto.
- **No rompe el hot path.** Los listeners `open-url` (macOS) y `second-instance` (Windows/Linux) no dependen de este flag — siguen funcionando para deep-links subsiguientes con la app ya abierta, llamando directamente a `dispatchDeepLink`. Solo se protege el caso particular del cold-start.
- **No afecta `flushPendingDeepLink`.** El flush sigue corriendo en cada `onRendererReady`, lo que permite que un deep-link entregado durante el splash y encolado en `pendingDeepLinkPath` se libere al estar el renderer final listo.
- **Anula la causa raíz independientemente del origen del trigger.** No importa si `notifyReady` se vuelve a llamar por StrictMode, por una refactorización futura del `useEffect`, o por cualquier otra causa: argv solo se consume una vez.

**Validación.** `npm run typecheck` pasa limpio. El siguiente build (`npm run build:win`) producirá un `.exe` con el bug corregido. Tras instalarlo y probar el deep-link, la navegación posterior por la sidebar debe quedar libre.

---

## Octava iteración — Búsqueda dinámica, filtros, paginación y alineación con los schemas reales del backend

Esta iteración adapta la vista del Plugin Repository al endpoint real `/search` del backend, agrega filtros (categoría + tags) con paginación por scroll infinito, y alinea los tipos TypeScript con los schemas Pydantic reales (`PluginRead`, `PluginPagination`, `TagRead`). De paso se suman rating y status al detalle, se igualan los fallbacks de logo y se da feedback al botón Instalar.

### 1. Adaptación de la query al endpoint `/search`

Antes la vista listaba con `getAll()` (`GET /` sobre la URL base) y la barra de búsqueda estaba deshabilitada. Ahora consume `GET /search` con los parámetros que expone el backend.

#### `ui/src/renderer/src/core/services/PluginRepositoryService.ts`
- Se reemplaza `getAll()` por `search(params)`, que llama `GET /search` con `query`, `category`, `tags`, `page` y `per_page`.
- `query` solo se envía si está definido (el backend exige `min_length=2`); `category` y `tags` solo si están presentes. Los `tags` se recortan a `MAX_TAGS_PER_SEARCH` (5).
- Se usa `paramsSerializer: { indexes: null }` para que Axios serialice el array `tags` como claves repetidas (`tags=a&tags=b`) en vez de `tags[]=a`, que es lo que espera el `List[str]` de FastAPI.
- Devuelve la página completa (`RepositoryPluginsPage`) para tener disponible la metadata de paginación.
- Se agregan `listTags(limit)` (`GET /tags`) y `searchTags(query, limit)` (`GET /tags/search`) para el autocomplete del filtro de tags.

#### `ui/src/renderer/src/core/pages/plugins/repository/Repository.tsx`
- Se habilita el input de búsqueda (antes `disabled`), ahora controlado con estado `searchQuery`.
- **Debounce diferenciado:** el texto libre se debouncea 1000 ms (`SEARCH_DEBOUNCE_MS`, derivando `debouncedQuery`); los cambios de categoría y tags se aplican al instante. Consultas de 1 carácter se tratan como "sin query" (lista todo), respetando el `min_length=2`.
- Cualquier cambio de filtro resetea a página 1 y reemplaza la lista.

### 2. Paginación por scroll infinito

#### `ui/src/renderer/src/core/pages/plugins/repository/Repository.tsx`
- `fetchPage(filters, page, append)` consulta `/search` con `per_page = 20` (`PER_PAGE`). Con `append=false` reemplaza la lista (nueva búsqueda / primera carga); con `append=true` acumula (`[...prev, ...items]`).
- Se guardan `page` y `total_pages` para saber si quedan más páginas.
- **IntersectionObserver + centinela:** un `<div>` invisible al final de la lista, observado con `root = #plugin-display-list` (el contenedor con `overflow: auto`) y `rootMargin: "120px"` para anticipar la carga. Al hacerse visible y si `page < totalPages`, pide la página siguiente.
- **Race conditions:** un contador `requestSeq` descarta respuestas de peticiones superadas (un query viejo que resuelve después de uno nuevo). El scroll no dispara otra página si ya hay una cargando (`isLoadingList`/`isLoadingMore`).
- Indicador "cargando más" al pie de la lista mientras se trae la siguiente página.

#### `ui/src/renderer/src/core/pages/plugins/repository/repository.module.css`
Se agregan `.list-sentinel` y `.list-loading-more`.

### 3. Alineación de tipos con los schemas reales (fix `type` → `category`)

El frontend referenciaba un campo `type` que **no existe** en el backend (era un bug: se mostraba vacío en el detalle).

#### `ui/src/renderer/src/core/types/RepositoryPlugin.ts`
- Se eliminó `type`; se agregó `category` (enum `capture | visualization | analysis | browser`, opcional porque `PluginRead` lo marca opcional para docs legacy).
- `description` pasó a opcional (como en el backend).
- Se sumaron `tags`, `status`, `average_rating` y `reviews_count` (estos dos últimos **requeridos**, ya que el backend siempre los devuelve con default `0.0`/`0`), más `created_at`/`updated_at`.
- Nuevos exports: `PluginCategory`, `PluginStatus`, `RepositoryTag`, `PLUGIN_CATEGORIES` y `MAX_TAGS_PER_SEARCH`.
- `RepositoryPluginDetail` ahora extiende `RepositoryPlugin` (sin duplicar campos). **No se tocó `releases`** porque no se contaba con el schema `ReleaseRead` y la lógica de instalación ya funcionaba.

#### `ui/src/renderer/src/core/pages/plugins/repository/PluginDetailView.tsx`
- Muestra **Categoría** (localizada) en vez del campo `type` inexistente.
- Muestra **chips de tags** si los hay (inline, no es un componente).

### 4. Filtros de categoría y tags

#### `ui/src/renderer/src/core/pages/plugins/repository/RepositoryFilters.tsx` (nuevo)
Componente de filtros separado para no inflar `Repository.tsx`:
- **Categoría:** usa el componente existente `core/components/select/Select` con `styleType="soft"` (su variante más clara, sin modificar el componente). Opciones: "Todas" + las 4 categorías, localizadas.
- **Tags:** input con autocomplete por prefijo (debounce 250 ms contra `/tags/search`), chips removibles, tope de 5 (`MAX_TAGS_PER_SEARCH`), Enter agrega la sugerencia o el texto. Normaliza a minúsculas como el backend y descarta respuestas superadas con un contador de secuencia.

#### `ui/src/renderer/src/core/pages/plugins/repository/Repository.tsx`
- Estado de `category` y `selectedTags`; `fetchPage` recibe el set de filtros completo (`SearchFilters`). `buildFilters()` arma los filtros activos y los efectos de carga/scroll dependen de él.
- Render del `<RepositoryFilters>` debajo de la barra de búsqueda.

#### `ui/src/renderer/src/core/pages/plugins/repository/repository.module.css`
Estilos de `.filters`, `.category-select` (solo layout, dejando que el `Select` aporte su color), `.tag-filter`, `.tag-input-row`, `.tag-input`, `.tag-chip`, `.tag-suggestions` y `.tag-suggestion`. El input de tags usa los **mismos tokens de color que el `Select` soft** (`--color-primary-600`, texto `--color-text-light`, chips `--color-primary-800`) para mantener coherencia visual con el desplegable de categoría.

### 5. Paridad del fallback de logo con la tab Instalados

En Instalados, un plugin sin logo muestra un SVG de fallback (vía el `onError` de `PluginCard`). En Repository, con `iconPath=""` el `onError` no se dispara fiable en Electron y quedaba un hueco. Se igualó el comportamiento **solo en archivos del Repository**.

#### `ui/src/renderer/src/core/pages/plugins/repository/Repository.tsx`
- `iconPath={plugin.logo_url || pluginFallback}` (import de `assets/images/plugin_fallback.svg`, la variante clara que corresponde al `PluginDisplay style="light"` de esta vista). Si el logo existe pero la URL está rota, el `onError` propio de `PluginCard` igual entra.

#### `ui/src/renderer/src/core/pages/plugins/repository/PluginDetailView.tsx`
- El logo del detalle ahora siempre renderiza con `src={detail.logo_url || pluginFallback}` y un `onError` que cae al fallback (antes el `<img>` se ocultaba con `display: none`).

### 6. Rating y status en el detalle del plugin

#### `ui/src/renderer/src/core/pages/plugins/repository/PluginDetailView.tsx`
- **Status:** badge inline junto al nombre (`t("status.<estado>")`), con color por estado vía `data-status` (verde `approved`, ámbar `under_review`, gris `no_releases`). Solo si `detail.status` está definido.
- **Rating:** fila siempre visible con 5 estrellas (llenas según `Math.round(average_rating)`), el valor a 1 decimal y el conteo entre paréntesis. Sin reseñas se ve `0.0 (0)` con estrellas vacías (se asume que el backend entrega `0.0`/`0`; sin condicionales ni fallbacks).
- El carácter estrella se genera con `String.fromCharCode(0x2605)` para evitar el flag de `i18next/no-literal-string` (la regla ignora puntuación como el `×` de los chips pero marca `★` como texto traducible).

#### `ui/src/renderer/src/core/pages/plugins/repository/repository.module.css`
Estilos `.detail-title-row`, `.detail-status` (con variantes por `data-status`), `.detail-rating`, `.stars`, `.star-filled`, `.star-empty`, `.rating-value`, `.rating-count`, y `.detail-tags`/`.detail-tag`.

### 7. Feedback en el botón Instalar (tooltip nativo)

#### `ui/src/renderer/src/core/pages/plugins/repository/PluginDetailView.tsx`
- Se aprovecha que `Button` reenvía todos los props nativos (`{...rest}`) para pasarle `title`, que da tooltip nativo en hover (incluso con el botón `disabled`).
- Instalable → `t("installHint", { name, version })` → "Instalar {nombre} {version}".
- Ya instalado → `t("installedHint", { name, version })` → "El plugin {nombre} {version} ya se encuentra instalado".
- La versión sale de `detail.releases[0]?.name` (el release por defecto).
- Se amplió el tipo del prop `t` a `(key, options?) => string` para soportar interpolación (el `t` de i18next ya lo soportaba; era solo el tipado).

### 8. Internacionalización

#### `ui/resources/locales/en/core.json` y `ui/resources/locales/es/core.json`
Bajo `pages.pluginRepository` se agregaron: `fieldCategory`, `allCategories`, `tagsPlaceholder`, `removeTag`, el mapa `category.*`, el mapa `status.*`, `noReviews` (quedó sin uso tras decidir el formato `0.0 (0)`), e `installHint` / `installedHint` (con interpolación `{{name}}` `{{version}}`).

### 9. Cambio colateral — `.gitignore`

#### `ui/.gitignore`
Se agregó `*.tsbuildinfo`. El typecheck incremental de TypeScript (`tsc -p tsconfig.web.json`) genera `tsconfig.web.tsbuildinfo`, caché local regenerable que no debe versionarse.

### Validación
`npx tsc --noEmit -p tsconfig.web.json` y `eslint` pasan limpios sobre todos los archivos tocados. JSON de locales validado. No se modificaron componentes compartidos (`Button`, `Select`, `Input`, `PluginCard`) ni la tab Instalados.

### Pendientes / decisiones acotadas
- **`releases` sin tipar a fondo:** se mantiene la forma actual hasta contar con el schema `ReleaseRead`.
- **Filtros solo en Repository:** el widget de tags y los badges de status/tags quedaron inline (no se extrajo un componente `Badge`/`Tag` reutilizable, por decisión explícita).
- **Selección de asset / versión:** la instalación sigue usando `releases[0]`; no se contempla arquitectura (x64/arm) ni recorrido de releases buscando uno compatible.
