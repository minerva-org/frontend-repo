# Laboratorio de pruebas de agente

Con sesion iniciada como `dev`, abre `/laboratorio-agente` directamente.
La ruta no tiene enlace en el menu y tambien esta protegida por DEV en la API.

- Extraccion habilitada; generacion de quiz y analisis estadistico se muestran
  deshabilitados para una etapa posterior.
- Selecciona Plan de estudio o Material fuente y un PDF con texto seleccionable
  de hasta 10 MiB (sin OCR).
- Las tres capas se cargan desde AI-Service. Puedes editarlas para una prueba o
  restaurar los valores iniciales; no se guardan al recargar.
- El panel derecho muestra modelo, duracion, arbol, JSON validado y salida
  original. HTTP 422 muestra diagnosticos, nunca un arbol presentado como valido.
- El esquema fijo es `units -> topics -> concepts`, con `name` en cada nodo.
  Editar el prompt de formato no cambia ese contrato.

Se usa la API del mismo origen bajo `/api/ai/laboratory/documents`; funcionan
el proxy Vite existente y Caddy sin rutas adicionales. El navegador no llama
directamente a AI-Service ni recibe su clave. La prueba espera hasta 260 s.
No se guardan documentos, prompts editados ni resultados academicos.

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.
You can also try [the experimental native React Compiler support in plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md#rust-react-compiler) by using `compiler: true` in the plugin options instead of using the Babel plugin.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
