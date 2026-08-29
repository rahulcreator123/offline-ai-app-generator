# AI Studio Local App Builder

A full-stack React/Vite AI application builder that can generate arbitrary apps from natural-language prompts, inspect generated files, run build diagnostics, repair generated code, manage projects, and preview generated applications.

### Providers
- Google Gemini for hosted/cloud environments such as Google AI Studio.
- Ollama for local Windows development.
- Local Ollama model selection supports `qwen2.5-coder:7b`, `rahul-ai:latest`, and auto fallback where configured.

### Commands
```text
npm install
npm run lint
npm run build
npm run dev
```

See `AI_STUDIO_SETUP.md` for setup details.


## V5 FAST / Any-App behavior
- Offline-first local generation through Ollama.
- Auto mode uses `qwen2.5-coder:7b` first and `rahul-ai:latest` as fallback.
- One bounded generation pass is used for small, medium, and large requests to avoid 15+ minute staged builds.
- Generated source is written to `projects/<projectId>/` and shown in the builder's file explorer/editor as it arrives.
- Preview uses a separate free localhost port for every generated project and reports the exact URL in the UI.
- No fake demo/counter fallback is allowed when generation fails.
- The generated project must contain `package.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, and `src/index.css`.
- `npm run lint` is intentionally a TypeScript typecheck (`tsc --noEmit`).

### Final validation
```powershell
npm install
npm run lint
npm run build
npm run dev
```
Then open the printed local builder URL.

### Recommended submission/test checklist
1. `npm install`
2. `npm run verify`
3. `npm run lint`
4. `npm run build`
5. `npm run dev`
6. Confirm Ollama is running and that both `qwen2.5-coder:7b` and `rahul-ai:latest` appear in the model selector/auto mode.
7. Generate a small app first (for example: `Create a todo app with add, edit, delete and dark mode`).
8. Confirm the Source Code panel fills while generation is running and the Live Preview reports a separate localhost port.

**Important:** No local model can guarantee every arbitrary application will finish in under 60 seconds. V5 removes the main architectural cause of multi-minute generation (dozens of sequential file-generation calls), but generation time still depends on model size, output length, and hardware. It never hides a generation failure behind a fake demo.
