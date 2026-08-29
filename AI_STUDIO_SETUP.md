# Google AI Studio upload / run guide

## Purpose
This package is cleaned for import into Google AI Studio and for local Windows development. It keeps the full-stack Node/Express agent because the builder needs filesystem and process APIs.

## AI Studio
1. Import/upload this ZIP as the application source.
2. Configure `GEMINI_API_KEY` as a secret/environment variable in the runtime if cloud Gemini generation is enabled.
3. Run the `dev` script. The server listens on `PORT` (default 3000) and binds to `0.0.0.0`.
4. Do not expect the hosted AI Studio runtime to reach a Windows-only Ollama server at `127.0.0.1:11434`. Use Gemini in the hosted environment.

## Windows local mode
1. Install Node.js and Ollama.
2. `npm install`
3. Start Ollama and verify `ollama list`.
4. `npm run lint`
5. `npm run build`
6. `npm run dev`
7. Open `http://127.0.0.1:3000`.

## Models
Local mode can use the installed Ollama models, including `qwen2.5-coder:7b` and `rahul-ai:latest`.

## Important
`.env` is intentionally excluded. Use `.env.example` and never commit API keys.
