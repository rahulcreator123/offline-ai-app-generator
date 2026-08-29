# Dependency Fix

This package is intentionally pinned to a compatible Vite 6 toolchain:
- Vite 6.4.3
- @vitejs/plugin-react 4.3.4
- Tailwind CSS 4.1.14
- @tailwindcss/vite 4.1.14
- TypeScript 5.8.2
- @types/node 22.14.0

Do not run `npm audit fix --force` because it can introduce major-version changes.

Windows clean install:
1. Close any running Node/Vite/Ollama processes that are using this folder.
2. Delete `node_modules` and `package-lock.json` if they exist.
3. Run `npm install`.
4. Run `npm run lint`.
5. Run `npm run build`.
6. Run `npm run dev`.
