# PDA Honeywell (EDA51) - Inventarios y Recepción

Aplicación móvil Android construida con Angular + Ionic + Capacitor, optimizada para uso en PDA Honeywell.

## Requisitos

- Node.js 20 LTS (recomendado)
- npm 10+
- Android Studio (SDK + Platform Tools)
- JDK 17
- Dispositivo Android (ideal: Honeywell EDA51) o emulador

## 1) Clonar e instalar dependencias

```bash
git clone <URL_DEL_REPO>
cd PDA-HONEYWELL
npm install
```

## 2) Configurar API

Revisar URL backend en:

- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`

Por defecto:

- `https://nexo.blackdata.cl/api/`

## 3) Levantar en modo desarrollo (web)

```bash
npm start
```

## 4) Build web

```bash
npm run build
```

## 5) Inicializar Android (primera vez en máquina nueva)

### Si la carpeta `android/` ya viene en el repo:

```bash
npx cap sync android
```

### Si NO existe la carpeta `android/`:

```bash
npx cap add android
npx cap sync android
```

## 6) Abrir proyecto Android en Android Studio

```bash
npx cap open android
```

Luego en Android Studio:

1. `Build > Clean Project`
2. `Build > Rebuild Project`
3. Ejecutar en dispositivo conectado (`Run`)

## 7) Comando rápido para build Android

```bash
npm run build:android
```

Este comando:

1. compila Angular (`ng build`)
2. sincroniza Capacitor con Android (`npx cap sync android`)

## Notas útiles

- Si cambias código web, vuelve a sincronizar antes de correr en Android:

```bash
npx cap sync android
```

- Si hay problemas de build en Android, limpiar y volver a construir.
- Para cerrar sesión y limpiar datos locales de auth, la app usa `localStorage`.

## Stack principal

- Angular 19
- Ionic 8
- Capacitor 7
- Plugin scanner: `cordova-honeywell-scanner-simplified`

