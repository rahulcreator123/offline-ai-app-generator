# Run Local AI App Builder on Windows

## Requirements
- Node.js 20+
- npm 10+
- Ollama (optional for local AI)

## Install
```powershell
npm install
```

## Verify
```powershell
npm run lint
npm run build
```

## Start locally
```powershell
npm run dev
```

Open http://127.0.0.1:3000

## Local AI with Ollama
```powershell
ollama serve
ollama pull qwen2.5-coder:7b
ollama list
```
The app uses http://localhost:11434 by default. No Gemini API key is required for local-only mode.

## Production-style local run
```powershell
npm run build
$env:NODE_ENV="production"
npm start
```
Then open http://127.0.0.1:3000

## Reliable Windows run

1. Start Ollama and verify: `ollama list`
2. In this project folder run: `npm install`
3. Run checks: `npm run lint` then `npm run build`
4. Start builder: `npm run dev`
5. Open **http://127.0.0.1:3000** for the builder.
6. Generated applications use a separate free port starting at 5173. The builder shows the exact preview URL.

Do not test port 5173 to check whether the builder itself is running; 5173 is reserved for a generated app preview.
