# PDA Honeywell (EDA51) - Inventarios y Recepción

Aplicación móvil Android construida con Angular 19 + Ionic 8 + Capacitor 7, optimizada para uso en PDA Honeywell EDA51.

---

## Requisitos previos

| Herramienta | Versión requerida |
|---|---|
| Node.js | `^20.19.0` o `^22.12.0` o `>=24.0.0` |
| npm | `>=8.0.0` |
| Android Studio | Flamingo o superior |
| JDK | 17 |
| Ionic CLI | `npm install -g @ionic/cli` |

> **Importante con Node:** Las versiones `v22.2.0` o anteriores de Node 22 generan advertencias de motor (`EBADENGINE`). Se recomienda usar **Node 22.12.0+** o **Node 20.19.0+** via `nvm`.
>
> ```bash
> nvm install 22.12.0
> nvm use 22.12.0
> ```

---

## Archivos críticos que deben existir en el repo

El proyecto **no funciona** si faltan estos archivos. Si los estás reconstruyendo desde cero en una máquina nueva, verifica que existan:

| Archivo | Descripción | Qué pasa si falta |
|---|---|---|
| `angular.json` | Workspace de Angular CLI | `ng build` falla con "not available outside a workspace" |
| `capacitor.config.ts` | Configuración de Capacitor | `npx cap add android` falla con "Missing appId" |
| `ionic.config.json` | Configuración de Ionic CLI | `ionic build` falla con "not an Ionic project" |

Si alguno falta, ver la sección **Troubleshooting** al final.

---

## Setup inicial (primera vez en máquina nueva)

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/Frankmoises7/PDA-HONEYWELL-V1.git .
npm install
```

> Si `npm install` falla con `ERESOLVE`, ver sección **Troubleshooting**.

### 2. Verificar configuración de entorno

Revisar URL del backend en:

- `src/environments/environment.ts` → desarrollo
- `src/environments/environment.prod.ts` → producción

Por defecto apunta a: `https://nexo.blackdata.cl/api/`

### 3. Inicializar la plataforma Android

Si la carpeta `android/` **ya existe** en el repo:

```bash
ng build
npx cap sync android
```

Si la carpeta `android/` **NO existe**:

```bash
ng build
npx cap add android
```

### 4. Abrir en Android Studio

```bash
npx cap open android
```

En Android Studio:
1. Esperar que Gradle sincronice
2. `Build > Clean Project`
3. `Build > Rebuild Project`
4. Conectar dispositivo Honeywell y ejecutar con `Run`

---

## Flujo de trabajo diario

### Desarrollo web (navegador)

```bash
ng serve -o
```

Abre automáticamente en `http://localhost:4200`

### Build de producción para Android

```bash
npm run build:android
```

Este comando equivale a:
```bash
ng build && npx cap sync android
```

Luego abrir Android Studio y hacer `Run` en el dispositivo.

### Solo sincronizar cambios web → Android (sin rebuild completo)

```bash
npx cap sync android
```

---

## Troubleshooting

### `npm install` falla con `ERESOLVE`

**Error:**
```
npm error Could not resolve dependency:
npm error peer @capacitor/core@"^7.6.0" from @capacitor/android@7.6.1
```

**Causa:** `@capacitor/core` y `@capacitor/cli` están fijados a una versión exacta en `package.json` sin el prefijo `^`, impidiendo que npm los suba para satisfacer los peer deps de `@capacitor/android`.

**Solución:** En `package.json`, cambiar:
```json
"@capacitor/core": "7.2.0"  →  "@capacitor/core": "^7.2.0"
"@capacitor/cli":  "7.2.0"  →  "@capacitor/cli":  "^7.2.0"
```
Luego volver a correr `npm install`.

---

### `ng build` falla con "not available when running outside a workspace"

**Error:**
```
Error: This command is not available when running the Angular CLI outside a workspace.
```

**Causa:** El archivo `angular.json` no está presente (nunca fue commiteado al repo).

**Solución:** El archivo `angular.json` debe estar en la raíz del proyecto. Si no existe, fue creado manualmente y debe ser commiteado al repositorio. Verificar que esté en git:

```bash
git status
git add angular.json
git commit -m "add angular.json workspace config"
git push
```

---

### `npx cap add android` falla con "Missing appId"

**Error:**
```
[error] Missing appId for new platform.
        Please add it in capacitor.config.json or run npx cap init.
```

**Causa:** El archivo `capacitor.config.ts` no existe.

**Solución:**
```bash
npx cap init
```
Ingresar:
- Name: `pda-honeywell`
- Package ID: `com.blackdata.pdahoneywell` (o el que corresponda)

Luego commitear el archivo generado:
```bash
git add capacitor.config.ts
git commit -m "add capacitor config"
```

---

### `ionic build` falla con "not an Ionic project directory"

**Causa:** El archivo `ionic.config.json` no existe.

**Solución:**
```bash
ionic init
```
Project name: `pda-honeywell`

---

### Advertencias `EBADENGINE` al hacer `npm install`

```
npm warn EBADENGINE Unsupported engine { package: '@angular-devkit/core@20.x', required: { node: '^22.12.0' } }
```

**Causa:** La versión de Node instalada es menor a la requerida (ej: `v22.2.0` en lugar de `v22.12.0`).

**Solución:** Cambiar versión de Node:
```bash
nvm install 22.12.0
nvm use 22.12.0
npm install
```

> Las advertencias no impiden que el proyecto compile, pero pueden causar comportamientos inesperados.

---

## Stack principal

- **Angular 19** — Framework frontend
- **Ionic 8** — Componentes UI móvil
- **Capacitor 7** — Bridge nativo Android
- **cordova-honeywell-scanner-simplified** — Plugin para el escáner de la PDA
