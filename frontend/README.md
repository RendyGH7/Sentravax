# SENTRAVAX — Frontend Application

Aplikasi antarmuka web dan mobile-responsive SENTRAVAX berbasis **React 19**, **TypeScript**, **Vite**, dan **Tailwind CSS v4**.

- 🎨 **Panduan Desain & UI:** [`../docs/core/DESIGN.md`](../docs/core/DESIGN.md)
- 📖 **Master Documentation Index:** [`../docs/README.md`](../docs/README.md)
- 🔌 **API Contract Lock:** [`../docs/core/API_CONTRACT.md`](../docs/core/API_CONTRACT.md)

---

## Development Scripts

```bash
npm run dev     # Menjalankan Vite dev server (http://localhost:5173)
npm run lint    # Menjalankan Oxlint linter
npm run build   # Type-check TypeScript (tsc -b) & Vite production build
```

---

## Template Documentation

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
