# Offline Ollama Run

1. Verify Ollama: `Invoke-RestMethod http://127.0.0.1:11434/api/tags`
2. Verify model: `ollama list` and confirm `rahul-ai:latest`.
3. Do NOT run `ollama serve` if port 11434 is already in use; that means Ollama is already running.
4. Start the app: `npm install`, `npm run lint`, `npm run build`, `npm run dev`.
5. Open http://127.0.0.1:3000.

The default AI provider is Ollama and the default model is `rahul-ai:latest`. Gemini is not needed for the local path.


## Dual local model mode

The builder supports `qwen2.5-coder:7b` and `rahul-ai:latest`. In Settings → AI Provider → Ollama, use **AUTO — Qwen 2.5 Coder 7B → Rahul AI** to try Qwen first and automatically retry with Rahul AI. Both models are served by the same local Ollama endpoint at `http://localhost:11434`.
