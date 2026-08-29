# AI Studio Local App Builder V5 — ANY APP / LARGE APP

Offline-first React/Vite app builder using Ollama.

## Generation modes
- SMALL: one compact model pass for very fast apps.
- MEDIUM: compact generation plus automatic dependency/import repair.
- LARGE: plain-text manifest followed by per-file staged generation, supporting up to 40 files without giant JSON.

The strategy is selected automatically from the prompt. You can use Qwen 2.5 Coder 7B, Rahul AI, or Auto fallback.

## Preview
Generated projects are synchronized into `projects/<projectId>` and launched on an automatically selected free localhost port. The builder can show the generated source in its code editor and the live app in the preview pane.

## Important performance behavior
Do not run `npm audit fix --force` as part of generation. It can introduce major dependency upgrades. Dependencies are synchronized only when required. Large-app generation is staged because a single huge JSON response is unreliable on local 7B models.

## Run
```powershell
npm install
npm run lint
npm run build
npm run dev
```

Builder: http://127.0.0.1:3000
Generated apps: automatically selected free ports starting at 5173.
