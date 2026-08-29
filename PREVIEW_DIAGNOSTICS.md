# V5 Preview Diagnostics

V5 now validates the generated app's actual Vite entry module before declaring the dedicated preview port ready. A root HTML `200` is not enough because Vite can return `index.html` successfully while `/src/main.tsx` contains a missing import and the browser shows a blank white page.

The server now:
- Finds a free localhost preview port.
- Starts the generated project's Vite process.
- Requests the generated `index.html`.
- Extracts and requests its module entry (`src/main.tsx`/`src/main.jsx`, etc.).
- Treats Vite transform/import errors as a failed build so the AI repair loop can fix them.
- Keeps the dedicated preview URL for opening in a separate browser tab.
- The UI also has a built-in offline fallback preview if the local iframe itself cannot load.
