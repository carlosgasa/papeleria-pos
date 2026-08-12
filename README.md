# Papelería POS - PWA de Punto de Venta

Sistema de punto de venta (POS) totalmente funcional para papelería, desarrollado como **Progressive Web App (PWA)** que funciona offline y se sincroniza automáticamente.

## 🚀 Características principales

- **📦 Gestión de inventario** - Alta, edición, búsqueda de productos
- **📱 Escáner de código de barras** - Usa la cámara del dispositivo para capturar códigos
- **🛒 Sistema de ventas** - Carrito de compras con cálculo automático de ganancia
- **📊 Dashboard** - KPIs, productos top, alertas de stock bajo
- **💰 Módulo de finanzas** - Registro de inversiones y cálculo de ganancias netas
- **🧮 Calculadoras utilitarias** - Servicios como copias, impresiones, engargolado, etc.
- **🌙 Tema claro/oscuro** - Con persistencia de preferencia
- **📲 Instalable** - Se puede instalar como app nativa en móvil
- **⚡ Funcionamiento offline** - Sincronización automática con Firebase cuando hay conexión
- **🔐 Seguro** - Autenticación Firebase, datos únicos por usuario

## 🏗️ Arquitectura técnica

### Stack
- **Frontend:** React 18 + TypeScript + Vite
- **Estilos:** Tailwind CSS (responsive, tema claro/oscuro)
- **Estado global:** Zustand
- **Backend:** Firebase (Firestore + Auth)
- **Barcode:** html5-qrcode
- **PWA:** vite-plugin-pwa
- **Hosting:** GitHub Pages (gratuito, estático)

### Estructura de carpetas
```
src/
├── core/                  # Lógica núcleo
│   ├── firebase/         # Config y servicios de Firebase
│   └── types/            # Interfaces TypeScript
├── features/             # Módulos funcionales
│   ├── auth/            # Autenticación
│   ├── inventory/       # Gestión de inventario
│   ├── sales/           # Ventas y carrito
│   ├── dashboard/       # Dashboard/KPIs
│   ├── finance/         # Finanzas
│   └── tools/           # Calculadoras
├── shared/              # Componentes y hooks reutilizables
│   ├── components/      # Button, Card, Modal, Input
│   └── hooks/           # useAuth, useTheme, etc.
└── app/                 # Enrutamiento y layout principal
```

### Modelo de datos (Firestore)

La estructura es **por usuario** para simplificar seguridad:
```
users/{uid}/
  ├── products/{productId}
  ├── sales/{saleId}
  ├── investments/{investmentId}
  └── calculatorConfig/{configId}
```

**Colecciones:**
- `products` - Inventario con barcode, precios, stock
- `sales` - Notas de venta con items y ganancia calculada
- `investments` - Inversiones/compras de inventario
- `calculatorConfig` - Configuración de precios para servicios

## 📋 Instrucciones de configuración

### 1. Clonar y instalar

```bash
git clone <tu-repo>
cd punto-venta-papeleria
npm install
```

### 2. Crear proyecto en Firebase

1. Ir a https://console.firebase.google.com/
2. Crear nuevo proyecto
3. Habilitar **Authentication** (Email/Password)
4. Crear un usuario (tu email + contraseña)
5. Habilitar **Firestore Database** (Modo seguro)
6. Crear usuario en Firebase Auth

### 3. Obtener credenciales Firebase

1. En Firebase Console → Project Settings → General
2. Copiar la configuración web
3. Crear archivo `.env` en la raíz basándote en `.env.example`
4. Pegar tus credenciales

```bash
cp .env.example .env
# Edita .env con tus credenciales
```

### 4. Configurar Firestore Security Rules

1. En Firebase Console → Firestore → Rules
2. Reemplazar todas las reglas con el contenido de `firestore.rules`
3. Publicar

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

### 5. Ejecutar localmente

```bash
npm run dev
```

Abrirá http://localhost:5173 en tu navegador. Inicia sesión con tu usuario de Firebase.

### 6. Construir para producción

```bash
npm run build
```

Genera la carpeta `dist/` lista para desplegar.

## 🚀 Despliegue en GitHub Pages

### Opción 1: Manual

```bash
# Crea el build
npm run build

# Sube dist/ a tu rama gh-pages manualmente o usa un script
gh-pages -d dist
```

### Opción 2: Automático con GitHub Actions

Crea `.github/workflows/deploy.yml`:

```yaml
name: Deploy PWA

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

Luego en GitHub:
1. Settings → Pages → Source = Deploy from branch → gh-pages
2. Esperar a que construya y despliegue

## 💡 Notas de desarrollo (Android/Kotlin)

Si vienes de Android, aquí hay analogías útiles:

| Android | Web |
|---------|-----|
| Activity | React Component |
| ViewModel + LiveData | Zustand Store |
| Room Database | Firestore |
| Flow<List<T>> | onSnapshot listener |
| SharedPreferences | localStorage |
| WorkManager | Service Worker |
| @Database @Entity @Dao | Firebase Collections |
| Jetpack Compose | React + Tailwind |

### Conceptos clave:

- **Hooks (useEffect, useState):** Son como Lifecycle callbacks pero más simples
- **Componentes funcionales:** Más limpios que Activity/Fragment
- **Zustand store:** Más simple que ViewModel, similar a un singleton
- **React Router:** Navigation como NavController
- **Tailwind classes:** CSS con nombres cortos (flex, grid, p-4, etc)

## 🔒 Seguridad

- **Firebase Auth:** Solo tú puedes iniciar sesión
- **Firestore Rules:** Tus datos están bajo `/users/{uid}/`, inaccesibles para otros
- **Credenciales en `.env`:** No subes `.env` a GitHub (está en `.gitignore`)
- **El código es público:** Esto es normal en PWAs. La seguridad viene de las reglas, no de ocultar el API key

## 📱 Uso en móvil

1. Abre la app en Chrome/Firefox del móvil
2. Toca "Instalar" en el menú
3. Se instalará en la pantalla de inicio
4. Funciona offline y se sincroniza automáticamente

## 🐛 Troubleshooting

### "PERMISSION_DENIED" en Firestore
→ Verifica que las reglas estén publicadas y que `firebaseConfig` sea correcto

### App funciona localmente pero no en GitHub Pages
→ En `vite.config.ts`, cambia `base: '/'` a `base: '/nombre-del-repo/'`

### Servicio worker no actualiza
→ Limpia caché: Settings → Clear browsing data → Service workers

### Cámara no funciona
→ Necesita HTTPS (funciona en GitHub Pages). En localhost a veces falla, recarga la página

## 📚 Recursos

- [Firebase Docs](https://firebase.google.com/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Zustand](https://github.com/pmndrs/zustand)
- [Vite](https://vitejs.dev)
- [PWA](https://web.dev/progressive-web-apps/)

## 📄 Licencia

Proyecto personal para punto de venta.

---

¿Preguntas? Revisa los comentarios en el código - están específicamente pensados para developers con experiencia en Kotlin/Android.
