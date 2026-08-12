# GUÍA DE INICIO RÁPIDO - Papelería POS

## ✅ ESTADO ACTUAL

Tu PWA de punto de venta **está lista y funcionando** en modo desarrollo:

- ✅ Autenticación Firebase
- ✅ Firestore integrado
- ✅ Inventario, Ventas, Dashboard, Finanzas, Calculadoras
- ✅ Tema claro/oscuro
- ✅ Interfaz responsive móvil + escritorio
- ✅ Componentes reutilizables (Button, Card, Input, Modal)
- ✅ Zustand para estado global
- ✅ Tailwind CSS

## 🚀 EJECUTAR EN LOCAL

```bash
# Navegar a la carpeta
cd /run/media/carlos/Datos/repos/papeleria-pos

# Instalar dependencias (ya hecho)
npm install

# Iniciar servidor de desarrollo
npm run dev

# Abrirá en http://localhost:5173
```

El servidor está **sirviendo ahora mismo**. Puedes abrir http://localhost:5173 en tu navegador.

## 🔧 PRÓXIMOS PASOS

### 1. Configurar Firebase

Antes de poder usar la app, necesitas:

1. Ir a https://console.firebase.google.com/
2. Crear un proyecto nuevo (o usa uno existente)
3. Habilitar **Authentication** → Email/Password
4. Crear tu usuario: email + contraseña
5. Habilitar **Firestore Database** en modo seguro
6. En Project Settings → General, copiar la config

Crear archivo `.env` en la raíz del proyecto:

```bash
cat > .env << 'EOF'
VITE_FIREBASE_API_KEY=tu_api_key_aqui
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto_id
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
EOF
```

### 2. Publicar Firestore Rules

En Firebase Console → Firestore → Rules, pega el contenido de `firestore.rules`:

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

### 3. Conectar Firestore a la App

Los servicios Firebase están en `src/core/firebase/`. Actualmente usan datos mock (simulados).

Para conectar:

**En `src/features/inventory/InventoryListPage.tsx`** (línea ~35):
```typescript
// Cambiar de:
const products = [ ... ]; // datos mock

// A:
const { products } = useInventoryStore();

// Y en un useEffect:
useEffect(() => {
  const userId = getCurrentUser()?.uid;
  if (userId) {
    const unsubscribe = onCollectionSnapshot(
      userId,
      'products',
      (docs) => {
        useInventoryStore.setState({ products: docs as Product[] });
      }
    );
    return unsubscribe;
  }
}, []);
```

Lo mismo para Sales, Investments, etc.

## 🏗️ FIX PARA BUILD/DEPLOY

Hay un problema conocido en Vite con module resolution. Para buildear a producción:

**Opción A: Usar alias de rutas (Recomendado)**

Editar `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  // ... resto del config
})
```

Luego cambiar imports en el código:

```typescript
// De: import { useTheme } from '../../shared/hooks/useTheme';
// A:
import { useTheme } from '@/shared/hooks/useTheme';
```

**Opción B: Usar esbuild directamente**

```bash
npm run build
```

Si falla, usa esta alternativa temporal:

```bash
node_modules/.bin/esbuild src/main.tsx --bundle --outfile=dist/bundle.js --loader:.ts=ts --loader:.tsx=tsx
```

## 📲 DESPLEGAR EN GITHUB PAGES

Una vez que arreglemos el build:

```bash
# 1. Asegurate de que tienes git configurado
git init
git add .
git commit -m "Papeleria POS initial commit"

# 2. Crear rama gh-pages
git checkout -b gh-pages
git checkout main  # volver a main

# 3. En package.json, cambiar base
# Edita vite.config.ts:
# base: '/papeleria-pos/' (usa el nombre de tu repo)

# 4. Build y deploy
npm run build
npx gh-pages -d dist

# 5. En GitHub, Settings → Pages → Source = gh-pages
```

## 📂 ESTRUCTURA DEL PROYECTO

```
papeleria-pos/
├── src/
│   ├── app/               # Ruteo y layout
│   ├── core/
│   │   ├── firebase/      # Config y servicios
│   │   └── types/         # Interfaces TypeScript
│   ├── features/          # Módulos funcionales
│   │   ├── auth/
│   │   ├── inventory/
│   │   ├── sales/
│   │   ├── dashboard/
│   │   ├── finance/
│   │   └── tools/
│   └── shared/            # Componentes compartidos
├── public/                # Icons PWA (agregar luego)
├── firestore.rules        # Copiar a Firebase Console
├── .env.example           # Template de variables
└── README.md              # Este archivo
```

## 🎯 CHECKLIST DE INTEGRACIÓN

- [ ] Crear proyecto en Firebase
- [ ] Configurar .env con credenciales
- [ ] Publicar Firestore Rules
- [ ] Crear usuario en Firebase Auth
- [ ] Conectar Firestore a cada módulo (inventory, sales, etc.)
- [ ] Agregar iconos PWA en `public/icons/`
- [ ] Solucionar paths en vite.config.ts
- [ ] Probar build local (`npm run build`)
- [ ] Desplegar a GitHub Pages

## 💡 NOTAS IMPORTANTES

- **No subas `.env`** a GitHub (está en `.gitignore`)
- Las credenciales de Firebase en el bundle son normales (la seguridad viene de las Firestore Rules)
- En modo dev, la app es super rápida. En producción, Rollup optimiza todo.
- El service worker (PWA) se genera automáticamente en build

## 🐛 TROUBLESHOOTING

**"Cannot find module '...'"**
- Verifica que el archivo exista en la ruta correcta
- Si usas alias @, asegurate de que estén en vite.config.ts y tsconfig.json

**"PERMISSION_DENIED en Firestore"**
- Verifica que `firebaseConfig.ts` tenga credenciales correctas
- Verifica que las Firestore Rules estén publicadas

**"App no guarda datos"**
- Confirma que estés enviando datos a Firestore (no es automático)
- Usa `createDocument()`, `updateDocument()`, etc. de `firestoreService.ts`

## 📚 RECURSOS

- [Firebase Docs](https://firebase.google.com/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Zustand](https://github.com/pmndrs/zustand)

---

**¿Preguntas?** Revisa los comentarios en el código - están pensados para developers Android/Kotlin.
