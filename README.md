# Minerva — Frontend Monorepo

Monorepo con la app web (Vite + React) y la app móvil (Expo) de Minerva, compartiendo código común.

## Estructura

```
frontend-repo/
├── apps/
│   ├── web/        # React + Vite (SPA)
│   └── mobile/     # React Native + Expo
├── packages/
│   └── shared/     # Tipos, utilidades y lógica compartida entre web y mobile
├── pnpm-workspace.yaml
└── package.json     # Scripts orquestadores (raíz)
```

## Requisitos previos

- **Node.js** (versión LTS actual)
- **pnpm** — el gestor de paquetes obligatorio de este repo. **No uses `npm` ni `npx` directamente**, el `package.json` raíz tiene un `devEngines` que bloquea cualquier comando corrido con npm.
  ```bash
  corepack enable
  # o
  npm install -g pnpm
  ```
- Para desarrollo mobile: la app **Expo Go** en tu celular — importante instalar la versión correcta, ver sección de abajo.

## Setup inicial

```bash
git clone <url-del-repo>
cd frontend-repo
pnpm install
pnpm approve-builds   # aprueba scripts de instalación de algunas dependencias nativas
pnpm install           # vuelve a correr si approve-builds instaló algo pendiente
```

## Comandos disponibles (desde la raíz)

| Comando | Qué hace |
|---|---|
| `pnpm dev:web` | Levanta el servidor de desarrollo de la app web (Vite) |
| `pnpm dev:mobile` | Levanta el servidor de Expo para la app mobile |
| `pnpm lint` | Corre lint en todos los paquetes del workspace |
| `pnpm build` | Compila todos los paquetes del workspace |

> Nota: **no uses `npx`** dentro de este repo — usa `pnpm dlx <paquete>` en su lugar, para no chocar con la restricción de `devEngines`.

## ⚠️ Importante: versión de Expo (SDK 54)

Este proyecto está fijado a **Expo SDK 54**, y NO a la última versión disponible. Esto es intencional: las versiones de Expo Go publicadas en Play Store y App Store dejaron de soportar SDKs más nuevos (55+), así que si usamos la última versión de Expo, nadie del equipo puede probar la app en su celular sin hacer un development build.

- **No corras** `expo install expo@latest` ni actualices el paquete `expo` sin discutirlo con el equipo primero.
- Instala **Expo Go 54.0.8** específicamente en tu celular (no la versión que te sugiera la Play Store por default si ya cambiaron el "latest"): descárgala desde [expo.dev/go](https://expo.dev/go).

## Troubleshooting común

**`EBADDEVENGINES` al correr un comando**
Estás usando `npx` (basado en npm). Usa `pnpm dlx` en su lugar.

**`ERR_PNPM_IGNORED_BUILDS` al instalar**
Corre `pnpm approve-builds` y luego `pnpm install` de nuevo.

**`No projects matched the filters`**
El nombre en el script (`pnpm --filter <nombre>`) no coincide con el campo `"name"` del `package.json` del paquete. Revisa `apps/web/package.json` o `apps/mobile/package.json`.

**`File 'expo/tsconfig.base' not found` en el editor**
El paquete `expo` sí está instalado, pero el TS Server de tu editor tiene caché vieja. En VS Code: `Ctrl+Shift+P` → "TypeScript: Restart TS Server".

**Expo Go dice "Project is incompatible with this version"**
Tu Expo Go instalado no es la versión 54.0.8. Reinstálala desde [expo.dev/go](https://expo.dev/go), no desde la Play Store si esta ya no ofrece esa versión por default.

## Variables de entorno

<!-- TODO: completar con las variables reales que use el proyecto -->
Copia `.env.example` a `.env` en cada app (`apps/web/.env`, `apps/mobile/.env`) y pide los valores al equipo.
