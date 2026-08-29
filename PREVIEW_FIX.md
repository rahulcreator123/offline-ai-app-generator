# Local Preview Fix

The local preview runner now:

1. Verifies `index.html`, `src/App.tsx`, `src/main.tsx`, and `src/index.css` exist.
2. Ensures generated projects have React and Vite dependencies.
3. Finds a free localhost port starting at 5173.
4. Launches Vite's `bin/vite.js` directly with the same Node executable instead of relying on Windows `.cmd` wrappers.
5. Uses `--strictPort` so Vite cannot silently switch to a different port.
6. Retries on a new free port if the selected port becomes unavailable.
7. Waits for an actual HTTP response before reporting the preview as running.
8. Returns the exact URL to the frontend.
9. Logs the generated Vite stdout/stderr to the local agent log and console.

This means the preview can be `http://127.0.0.1:5173`, `:5174`, etc., depending on availability.
