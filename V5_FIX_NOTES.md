# V5 Final Preview Reliability Fix

This build addresses the blank-preview failures seen during generated-app startup.

## Fixed
- Missing generated CSS imports such as `./App.css` are created automatically before Vite starts.
- Missing `storage` helper imports are repaired automatically.
- Other missing relative local modules get a compatibility stub instead of immediately crashing Vite with a white screen.
- The repair runs directly against the generated project on disk, so generation-order races are covered even when the UI state is already synchronized.
- Windows dependency installation no longer relies on spawning `npm.cmd` directly; it invokes the npm CLI through the same Node executable to avoid `spawn EINVAL` in generated project directories.
- Vite still receives a dedicated free localhost port for each generated project and the server waits for the actual application entry to transform before reporting success.
- Existing fast mode remains intact: no duplicate production build is run before preview unless `FULL_BUILD_VALIDATION=true`.

## Expected test

```powershell
npm install
npm run verify
npm run lint
npm run build
npm run dev
```

Then generate an app. The terminal should show a line similar to:

`[Dev Server] Live preview confirmed at http://127.0.0.1:5173`

or another free port such as `5174`.

The generated app is served from that separate local port, while the builder UI remains on port 3000.
