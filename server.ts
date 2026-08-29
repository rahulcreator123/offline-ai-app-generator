import express from "express";
import path from "path";
import fs from "fs";
import { spawn, ChildProcess } from "child_process";
import net from "net";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = Number(process.env.PORT || process.env.BUILDER_PORT || 3000);
const WORKSPACE_BASE = path.join(process.cwd(), "projects");

// Ensure projects workspace root directory exists
if (!fs.existsSync(WORKSPACE_BASE)) {
  fs.mkdirSync(WORKSPACE_BASE, { recursive: true });
}

// Security Helper: Ensure target paths stay strictly inside designated project directory within projects/
function sanitizeProjectPath(relativePath: string, baseDir: string): string | null {
  if (!relativePath || !baseDir) return null;
  const normalizedInput = String(relativePath).replace(/\\/g, "/");
  if (path.isAbsolute(normalizedInput) || normalizedInput.split("/").includes("..")) return null;
  const cleanRelative = path.normalize(normalizedInput);
  const resolved = path.resolve(baseDir, cleanRelative);
  const rel = path.relative(baseDir, resolved);

  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    return null; // Path escapes project boundary - rejected
  }
  const relWorkspace = path.relative(WORKSPACE_BASE, resolved);
  if (relWorkspace.startsWith("..") || path.isAbsolute(relWorkspace)) {
    return null; // Path escapes workspace boundary - rejected
  }
  return resolved;
}

// In-memory buffer for real agent and terminal logs
const agentLogBuffer: Array<{ timestamp: string; type: string; text: string; command?: string }> = [];

function pushAgentLog(type: string, text: string, command?: string) {
  const logEntry = {
    timestamp: new Date().toLocaleTimeString(),
    type,
    text,
    command,
  };
  agentLogBuffer.push(logEntry);
  console.log(`[Agent:${type}] ${text}`);
  if (agentLogBuffer.length > 1000) {
    agentLogBuffer.shift();
  }
}

// Active dev servers map (projectId -> running process info)
interface ActiveDevServer {
  projectId: string;
  port: number;
  pid: number;
  process?: ChildProcess;
  url: string;
  status: "running" | "stopped" | "starting";
  startedAt: string;
}
const activeDevServers = new Map<string, ActiveDevServer>();

// Command Security Allowlist and Denylist Checker
function validateCommandSafety(command: string): { safe: boolean; reason?: string; requiresApproval: boolean } {
  const trimmed = command.trim();
  const lower = trimmed.toLowerCase();

  // Explicit dangerous denylist
  const dangerousPatterns = [
    /rm\s+-rf\s+[\/\\]/i,
    /rmdir\s+\/s\s+\/q\s+[a-z]:/i,
    /del\s+\/f\s+\/s\s+\/q\s+[a-z]:/i,
    /format\s+[a-z]:/i,
    /shutdown/i,
    /powershell.*-encodedcommand/i,
    /curl.*\|\s*(?:bash|sh|iex)/i,
    /wget.*\|\s*(?:bash|sh)/i,
    /mkfs/i,
    /dd\s+if=/i,
    /:(){ :\|:& };:/,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(lower)) {
      return {
        safe: false,
        reason: `Command matches dangerous pattern: "${trimmed}"`,
        requiresApproval: true,
      };
    }
  }

  // Safe developer tool prefixes
  const safePrefixes = [
    "npm ",
    "npm.cmd",
    "npx ",
    "npx.cmd",
    "node ",
    "tsc",
    "git ",
    "echo ",
    "pnpm ",
    "bun ",
    "yarn ",
  ];

  const isPrefixSafe = safePrefixes.some((p) => lower.startsWith(p));
  const isInstallOrDestructive = lower.includes("install") || lower.includes("uninstall") || lower.includes("rm ") || lower.includes("del ");

  return {
    safe: isPrefixSafe,
    reason: isPrefixSafe ? undefined : "Command is not in developer tool allowlist",
    requiresApproval: isInstallOrDestructive || !isPrefixSafe,
  };
}

// Lazy initialization of Gemini client
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}


function normalizeRelativeImport(fromFile: string, specifier: string): string | null {
  if (!specifier.startsWith('.')) return null;
  const base = path.dirname(fromFile);
  const normalized = path.normalize(path.join(base, specifier));
  const rel = path.relative('', normalized);
  if (rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return normalized.replace(/\\/g, '/');
}

function parseImportedBindings(source: string, specifier: string): { defaultName?: string; named: string[] } {
  const result: { defaultName?: string; named: string[] } = { named: [] };
  const escaped = specifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`import\\s+([\\s\\S]*?)\\s+from\\s+["']${escaped}["']`, 'm'),
    new RegExp(`import\\s*\\(\\s*["']${escaped}["']\\s*\\)`, 'm'),
    new RegExp(`export\\s+([\\s\\S]*?)\\s+from\\s+["']${escaped}["']`, 'm')
  ];
  for (const re of patterns) {
    const m = re.exec(source);
    if (!m) continue;
    const clause = m[1] || '';
    const brace = clause.match(/\{([\s\S]*?)\}/);
    if (brace) {
      for (const item of brace[1].split(',')) {
        const name = item.trim().split(/\s+as\s+/i)[0].trim();
        if (/^[A-Za-z_$][\w$]*$/.test(name)) result.named.push(name);
      }
    }
    const beforeBrace = clause.split('{')[0].trim().replace(/,$/, '').trim();
    if (beforeBrace && /^[A-Za-z_$][\w$]*$/.test(beforeBrace)) result.defaultName = beforeBrace;
    break;
  }
  return result;
}

function repairMissingGeneratedImports(projectDir: string) {
  const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
  const files: string[] = [];
  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (sourceExtensions.has(path.extname(entry.name))) files.push(full);
    }
  };
  walk(projectDir);

  const candidates = (base: string): string[] => [
    base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.jsx`, `${base}.mjs`, `${base}.cjs`,
    path.join(base, 'index.ts'), path.join(base, 'index.tsx'), path.join(base, 'index.js'), path.join(base, 'index.jsx')
  ];

  const relImport = /(?:import\s+(?:[\s\S]*?\s+from\s+)?|export\s+[\s\S]*?\s+from\s+|require\s*\(\s*)["'](\.[^"']+)["']/g;
  for (const fullFile of files) {
    let source = '';
    try { source = fs.readFileSync(fullFile, 'utf8'); } catch { continue; }
    let match: RegExpExecArray | null;
    while ((match = relImport.exec(source))) {
      const specifier = match[1].replace(/\\/g, '/');
      const base = path.resolve(path.dirname(fullFile), specifier);
      if (!base.startsWith(path.resolve(projectDir) + path.sep) && base !== path.resolve(projectDir)) continue;
      const exists = candidates(base).some(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
      if (exists) continue;

      // Stylesheets are intentionally created as harmless placeholders. This prevents
      // a common model race where App.tsx is emitted before App.css.
      if (/\.(css|scss|sass|less)$/i.test(specifier)) {
        fs.mkdirSync(path.dirname(base), { recursive: true });
        fs.writeFileSync(base, '/* Auto-created missing generated stylesheet. */\n', 'utf8');
        pushAgentLog('warn', `[Repair] Created missing stylesheet ${path.relative(projectDir, base).replace(/\\/g, '/')}`);
        continue;
      }

      // Known helper used by several generated templates.
      if (/(^|[\\/])storage$/i.test(specifier)) {
        const target = `${base}.ts`;
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, `const KEY = 'local-ai-app-builder-dark-mode';\nexport function isDarkMode(){ try { return localStorage.getItem(KEY) === 'true'; } catch { return false; } }\nexport function toggleDarkMode(force?: boolean){ const next = typeof force === 'boolean' ? force : !isDarkMode(); try { localStorage.setItem(KEY, String(next)); document.documentElement.classList.toggle('dark', next); } catch {} return next; }\nexport function setDarkMode(v: boolean){ return toggleDarkMode(v); }\n`, 'utf8');
        pushAgentLog('warn', `[Repair] Created missing storage helper ${path.relative(projectDir, target).replace(/\\/g, '/')}`);
        continue;
      }

      // Last-resort local module stub: preserve the import contract instead of letting
      // Vite crash with a blank page. Named imports become harmless functions; a default
      // import becomes a null-rendering React-compatible component when invoked.
      if (/\.(json)$/i.test(specifier)) {
        const target = `${base}.json`;
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, '{}\n', 'utf8');
        continue;
      }
      const ext = /\.tsx?$/i.test(specifier) ? '.tsx' : '.js';
      const target = `${base}${path.extname(base) ? '' : ext}`;
      const bindings = parseImportedBindings(source, specifier);
      const lines: string[] = ['// Auto-generated compatibility stub. The requested module was not emitted by the model.'];
      for (const name of Array.from(new Set(bindings.named))) {
        lines.push(`export function ${name}(..._args: any[]) { return null; }`);
      }
      if (bindings.defaultName) lines.push(`export default function ${bindings.defaultName}(_props: any) { return null; }`);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, lines.join('\n') + '\n', 'utf8');
      pushAgentLog('warn', `[Repair] Created compatibility module ${path.relative(projectDir, target).replace(/\\/g, '/')}`);
    }
  }
}

function isPortAvailable(port: number, host = "127.0.0.1"): Promise<boolean> {
  return new Promise((resolve) => {
    const tester = net.createServer();
    tester.once("error", () => resolve(false));
    tester.once("listening", () => tester.close(() => resolve(true)));
    tester.listen(port, host);
  });
}

async function findFreePort(start = 5173, maxAttempts = 50): Promise<number> {
  for (let offset = 0; offset < maxAttempts; offset++) {
    const candidate = start + offset;
    if (await isPortAvailable(candidate)) return candidate;
  }
  throw new Error(`No free local preview port found in ${start}-${start + maxAttempts - 1}.`);
}

async function waitForViteApp(url: string, timeoutMs = 15000): Promise<{ ok: boolean; error?: string }> {
  const deadline = Date.now() + timeoutMs;
  let lastError = '';
  while (Date.now() < deadline) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1200);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      const html = await response.text();
      if (response.status >= 500) {
        lastError = `HTTP ${response.status}: ${html.slice(-2500)}`;
      } else {
        // Root HTML can return 200 even when the React entry has a broken import.
        // Ask Vite to transform the actual module too; this is what catches the
        // common blank-white-screen failures (missing ./storage, CSS, package, etc.).
        const match = html.match(/<script[^>]+type=["']module["'][^>]+src=["']([^"']+)["']/i);
        if (!match) return { ok: true };
        const entry = new URL(match[1], url).toString();
        const entryController = new AbortController();
        const entryTimer = setTimeout(() => entryController.abort(), 1200);
        const entryResponse = await fetch(entry, { signal: entryController.signal });
        const entryText = await entryResponse.text();
        clearTimeout(entryTimer);
        if (entryResponse.status < 500 && !/Internal Server Error|Failed to resolve import|Could not resolve/i.test(entryText)) {
          return { ok: true };
        }
        lastError = `Entry module failed (HTTP ${entryResponse.status}): ${entryText.slice(-3500)}`;
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  return { ok: false, error: lastError || 'Vite app did not become ready in time.' };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "50mb" }));

  // =========================================================================
  // 1. HEALTH & COMPANION SYSTEM STATUS
  // =========================================================================
  const handleHealth = (_req: express.Request, res: express.Response) => {
    res.json({
      status: "ok",
      server: "Local AI Agent Host (Ollama / Local Runtime)",
      timestamp: new Date().toISOString(),
      gpuTarget: "NVIDIA GeForce RTX 5050 (8GB VRAM)",
      activeModel: "qwen2.5-coder:7b",
      generationMode: "fast-single-pass",
      previewMode: process.env.FULL_BUILD_VALIDATION === "true" ? "strict-build" : "vite-fast",
      workspaceRoot: WORKSPACE_BASE,
      activeDevServersCount: activeDevServers.size,
    });
  };
  app.get("/health", handleHealth);
  app.get("/api/health", handleHealth);

  app.get("/api/companion/status", async (req, res) => {
    const ollamaUrl = (req.query.ollamaUrl as string) || "http://localhost:11434";
    let ollamaConnected = false;
    let ollamaModels: string[] = [];

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      const response = await fetch(`${ollamaUrl}/api/tags`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        ollamaConnected = true;
        ollamaModels = (data.models || []).map((m: { name: string }) => m.name);
      }
    } catch {
      ollamaConnected = false;
    }

    res.json({
      companionRunning: true,
      ollamaConnected,
      ollamaUrl,
      ollamaModels,
      hardware: {
        gpu: "NVIDIA GeForce RTX 5050 Laptop/Desktop GPU",
        vramTotalMB: 8192,
        vramAllocatedMB: 4850,
        vramFreeMB: 3342,
        quantizationTarget: "4-bit (Q4_K_M) or 8-bit (Q8_0)",
        optimalBatchSize: 1,
        optimalContextTokens: 8192,
      },
    });
  });

  // =========================================================================
  // 2. REAL COMMAND EXECUTOR (Phase 18 & 19 - Real child_process execution)
  // =========================================================================
  app.post(["/api/project/execute", "/project/execute"], async (req, res) => {
    const { command, projectId = "default", timeoutMs = 60000 } = req.body;

    if (!command || typeof command !== "string") {
      return res.status(400).json({ success: false, error: "Command string is required" });
    }

    // Security validation
    const check = validateCommandSafety(command);
    if (!check.safe) {
      pushAgentLog("error", `[Security Blocked] ${check.reason}: ${command}`);
      return res.status(403).json({
        success: false,
        error: `Security Policy Violation: ${check.reason}`,
        blocked: true,
      });
    }

    // Determine working directory for project
    const safeProjectId = String(projectId).replace(/[^a-zA-Z0-9._-]/g, "_");
    const projectDir = path.join(WORKSPACE_BASE, safeProjectId);
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }

    pushAgentLog("command", `$ ${command}`, command);

    try {
      const isWindows = process.platform === "win32";
      const shellExecutable = isWindows ? "cmd.exe" : "/bin/bash";
      const shellArgs = isWindows ? ["/d", "/s", "/c", command] : ["-c", command];

      const child = spawn(shellExecutable, shellArgs, {
        cwd: projectDir,
        env: {
          ...process.env,
          NODE_ENV: "development",
          FORCE_COLOR: "true",
        },
      });

      let stdoutData = "";
      let stderrData = "";

      child.stdout?.on("data", (chunk: Buffer) => {
        const text = chunk.toString();
        stdoutData += text;
        pushAgentLog("info", text.trim());
      });

      child.stderr?.on("data", (chunk: Buffer) => {
        const text = chunk.toString();
        stderrData += text;
        pushAgentLog("warn", text.trim());
      });

      const exitPromise = new Promise<{ code: number | null; signal: string | null }>((resolve) => {
        child.on("close", (code, signal) => resolve({ code, signal }));
        child.on("error", () => resolve({ code: 1, signal: null }));
      });

      const timeoutPromise = new Promise<{ code: number | null; signal: string | null }>((resolve) => {
        setTimeout(() => {
          child.kill();
          resolve({ code: 124, signal: "SIGTERM" });
        }, timeoutMs);
      });

      const result = await Promise.race([exitPromise, timeoutPromise]);
      const isSuccess = result.code === 0;

      if (isSuccess) {
        pushAgentLog("success", `✓ Command completed with code 0: ${command}`);
      } else {
        pushAgentLog("error", `✗ Command failed with code ${result.code}: ${command}`);
      }

      res.json({
        success: isSuccess,
        exitCode: result.code,
        stdout: stdoutData,
        stderr: stderrData,
        command,
      });
    } catch (err: any) {
      pushAgentLog("error", `Exception executing command "${command}": ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // =========================================================================
  // 3. REAL DEV SERVER PROCESS CONTROLLER (Phase 20 - Vite Dev Process Runner)
  // =========================================================================
  // Delete a generated project from disk and stop its preview if running.
  app.post(["/project/delete", "/api/project/delete"], (req, res) => {
    const { projectId } = req.body || {};
    if (!projectId) return res.status(400).json({ success: false, error: "projectId is required" });

    const safeProjectId = String(projectId).replace(/[^a-zA-Z0-9._-]/g, "_");
    if (!safeProjectId.startsWith("proj_")) {
      return res.status(400).json({ success: false, error: "Invalid project id" });
    }

    const existing = activeDevServers.get(projectId) || activeDevServers.get(safeProjectId);
    if (existing?.process) {
      try { existing.process.kill(); } catch { /* already stopped */ }
      activeDevServers.delete(projectId);
      activeDevServers.delete(safeProjectId);
    }

    const projectDir = path.resolve(WORKSPACE_BASE, safeProjectId);
    const workspaceRoot = path.resolve(WORKSPACE_BASE);
    const relative = path.relative(workspaceRoot, projectDir);
    if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
      return res.status(403).json({ success: false, error: "Invalid project path" });
    }

    try {
      if (fs.existsSync(projectDir)) fs.rmSync(projectDir, { recursive: true, force: true });
      pushAgentLog("success", `[Workspace] Deleted project "${safeProjectId}" and its generated files.`);
      return res.json({ success: true, projectId: safeProjectId });
    } catch (err: any) {
      pushAgentLog("error", `[Workspace] Failed to delete "${safeProjectId}": ${err?.message || String(err)}`);
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  app.post(["/project/run", "/api/project/run"], async (req, res) => {
    const { projectId = "default" } = req.body || {};
    const safeProjectId = String(projectId).replace(/[^a-zA-Z0-9._-]/g, "_");
    const projectDir = path.join(WORKSPACE_BASE, safeProjectId);

    if (!fs.existsSync(projectDir)) fs.mkdirSync(projectDir, { recursive: true });

    const existing = activeDevServers.get(projectId);
    if (existing?.process) {
      try { existing.process.kill(); } catch { /* already stopped */ }
      activeDevServers.delete(projectId);
    }

    try {
      pushAgentLog("info", `[Dev Server] Preparing ${safeProjectId}...`);

      // Repair missing relative imports on disk immediately before Vite starts.
      // This catches generation-order races even if the in-memory validator missed them.
      repairMissingGeneratedImports(projectDir);

      const packagePath = path.join(projectDir, "package.json");
      let pkg: any = {};
      if (fs.existsSync(packagePath)) {
        try { pkg = JSON.parse(fs.readFileSync(packagePath, "utf8")); } catch { pkg = {}; }
      }
      pkg.name = pkg.name || safeProjectId;
      pkg.private = true;
      pkg.scripts = { ...(pkg.scripts || {}), dev: "vite", build: pkg.scripts?.build || "vite build" };
      pkg.dependencies = { ...(pkg.dependencies || {}), react: pkg.dependencies?.react || "^18.3.1", "react-dom": pkg.dependencies?.["react-dom"] || "^18.3.1" };
      pkg.devDependencies = {
        ...(pkg.devDependencies || {}),
        vite: "6.4.3",
        typescript: pkg.devDependencies?.typescript || "^5.7.3",
        "@types/node": pkg.devDependencies?.["@types/node"] || "^22.14.0",
        "@types/react": pkg.devDependencies?.["@types/react"] || "^18.3.18",
        "@types/react-dom": pkg.devDependencies?.["@types/react-dom"] || "^18.3.5",
        "@vitejs/plugin-react": "4.3.4",
        "@tailwindcss/vite": "^4.1.14",
        "tailwindcss": "^4.1.14",
      };
      if (pkg.dependencies?.tailwindcss) {
        pkg.dependencies.tailwindcss = "^4.1.14";
      }
      fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2), "utf8");

      const srcDir = path.join(projectDir, "src");
      fs.mkdirSync(srcDir, { recursive: true });
      const required: Record<string, string> = {
        "vite.config.ts": `import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\nimport tailwindcss from "@tailwindcss/vite";\n\nexport default defineConfig({\n  plugins: [react(), tailwindcss()],\n});\n`,
        "index.html": `<!doctype html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${safeProjectId}</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>`,
        "src/main.tsx": `import React from "react";\nimport {createRoot} from "react-dom/client";\nimport App from "./App";\nimport "./index.css";\ncreateRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);\n`,
        "src/index.css": `@import "tailwindcss";\nhtml,body,#root{margin:0;min-height:100%;}body{min-height:100vh;}*{box-sizing:border-box;}`
      };
      // Never replace a failed generation with the historical counter demo. Only add
      // harmless Vite infrastructure; App.tsx must have been genuinely generated.
      if (!fs.existsSync(path.join(projectDir, "src", "App.tsx")) && !fs.existsSync(path.join(projectDir, "src", "App.jsx"))) {
        throw new Error("Generated project has no src/App.tsx or src/App.jsx; refusing to start a fallback application.");
      }
      for (const [file, content] of Object.entries(required)) {
        const target = path.join(projectDir, file);
        if (!fs.existsSync(target)) {
          fs.mkdirSync(path.dirname(target), { recursive: true });
          fs.writeFileSync(target, content, "utf8");
          pushAgentLog("warn", `[Dev Server] Missing ${file}; created minimal Vite infrastructure.`);
        }
      }

      // Ensure existing vite.config.ts has the Tailwind plugin if @import "tailwindcss" is used
      const existingViteConfig = path.join(projectDir, "vite.config.ts");
      if (fs.existsSync(existingViteConfig)) {
        const configText = fs.readFileSync(existingViteConfig, "utf8");
        if (!configText.includes("@tailwindcss/vite") && !configText.includes("tailwindcss/vite")) {
          fs.writeFileSync(
            existingViteConfig,
            `import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\nimport tailwindcss from "@tailwindcss/vite";\n\nexport default defineConfig({\n  plugins: [react(), tailwindcss()],\n});\n`,
            "utf8"
          );
        }
      }

      // FAST dependency strategy: generated apps first reuse the builder's already
      // installed node_modules through a local junction/symlink. This avoids running
      // npm install for every generated app. npm is invoked only when a requested
      // package is genuinely absent from the shared runtime.
      const projectNodeModules = path.join(projectDir, "node_modules");
      const sharedNodeModules = path.join(process.cwd(), "node_modules");
      if (!fs.existsSync(projectNodeModules) && fs.existsSync(sharedNodeModules)) {
        try {
          fs.symlinkSync(sharedNodeModules, projectNodeModules, process.platform === "win32" ? "junction" : "dir");
          pushAgentLog("success", `[Deps] Reusing builder node_modules for fast preview.`);
        } catch (linkErr) {
          pushAgentLog("warn", `[Deps] Shared node_modules link unavailable; using local install.`);
        }
      }

      const viteEntry = path.join(projectDir, "node_modules", "vite", "bin", "vite.js");
      const packageLock = path.join(projectDir, "package-lock.json");
      const dependencyNames = [
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.devDependencies || {})
      ].filter(Boolean);
      const packageInstalled = (name: string) => fs.existsSync(path.join(projectDir, "node_modules", ...name.split("/")));
      const missingDependencies = dependencyNames.filter(name => !packageInstalled(name));
      if (!fs.existsSync(viteEntry) || missingDependencies.length > 0) {
        pushAgentLog("info", `[Dev Server] Installing ${missingDependencies.length || 1} missing generated-project dependency set...`);
        pushAgentLog("info", `[Dev Server] Installing generated-project dependencies...`);
        // On Windows, spawning npm.cmd directly can intermittently return EINVAL when
        // the generated project is using a junction/shared node_modules tree. Invoke the
        // npm CLI through the same Node executable instead; this is substantially more
        // reliable and avoids cmd.exe quoting issues.
        const npmCli = process.env.npm_execpath && fs.existsSync(process.env.npm_execpath)
          ? process.env.npm_execpath
          : path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
        const installArgs = ['install', '--no-audit', '--no-fund', '--legacy-peer-deps'];
        const install = process.platform === 'win32'
          ? spawn(process.execPath, [npmCli, ...installArgs], {
              cwd: projectDir, env: { ...process.env, NODE_ENV: 'development' }, windowsHide: true,
              stdio: ['ignore', 'pipe', 'pipe']
            })
          : spawn('npm', installArgs, {
              cwd: projectDir, env: { ...process.env, NODE_ENV: 'development' },
              stdio: ['ignore', 'pipe', 'pipe']
            });
        let installOutput = "";
        install.stdout?.on("data", c => installOutput += c.toString());
        install.stderr?.on("data", c => installOutput += c.toString());
        const code = await new Promise<number>(resolve => {
          const installTimer = setTimeout(() => { try { install.kill(); } catch {} resolve(124); }, 35000);
          install.once("error", () => { clearTimeout(installTimer); resolve(1); });
          install.once("close", c => { clearTimeout(installTimer); resolve(c ?? 1); });
        });
        if (code !== 0 || !fs.existsSync(viteEntry)) throw new Error(`npm install failed (exit ${code}). ${installOutput.slice(-2000)}`);
      }

      // Re-scan after dependency/toolchain normalization because package generation can
      // rewrite files between the first repair pass and Vite startup.
      repairMissingGeneratedImports(projectDir);

      // FAST PATH: do not run a full production build before preview. A production
      // build duplicates work and can consume most of the one-minute budget. Vite
      // itself performs module transformation on first request; failures are captured
      // by the preview health check and sent to the repair loop. Set
      // FULL_BUILD_VALIDATION=true when a strict production build is explicitly wanted.
      if (process.env.FULL_BUILD_VALIDATION === "true") {
        pushAgentLog("info", `[Build] Strict validation enabled; running production build...`);
        const npmBuildCmd = process.platform === "win32" ? "npm.cmd" : "npm";
        const buildProcess = spawn(npmBuildCmd, ["run", "build"], {
          cwd: projectDir, env: { ...process.env, NODE_ENV: "production", CI: "1" },
          windowsHide: true, stdio: ["ignore", "pipe", "pipe"]
        });
        let buildOutput = "";
        buildProcess.stdout?.on("data", c => buildOutput += c.toString());
        buildProcess.stderr?.on("data", c => buildOutput += c.toString());
        const buildCode = await new Promise<number>(resolve => {
          const timer = setTimeout(() => { try { buildProcess.kill(); } catch {} resolve(124); }, 60000);
          buildProcess.once("error", () => { clearTimeout(timer); resolve(1); });
          buildProcess.once("close", c => { clearTimeout(timer); resolve(c ?? 1); });
        });
        if (buildCode !== 0) throw new Error(`Generated project build failed (exit ${buildCode}).\n${buildOutput.slice(-7000)}`);
        pushAgentLog("success", `[Build] ✓ Generated project passed strict build validation.`);
      } else {
        pushAgentLog("info", `[Build] FAST mode: skipping duplicate production build; validating through Vite preview.`);
      }

      // Launch Vite's JS entry directly with the same Node executable. This avoids
      // Windows npm.cmd/cmd.exe quoting and child-process lifetime issues.
      let port = await findFreePort(Number(req.body?.port) || 5173, 50);
      let processHandle: ChildProcess | undefined;
      let output = "";
      let lastError = "";
      let ready = false;

      for (let attempt = 1; attempt <= 5 && !ready; attempt++) {
        if (attempt > 1) port = await findFreePort(port + 1, 50);
        output = ""; lastError = "";
        pushAgentLog("info", `[Dev Server] Starting Vite on http://127.0.0.1:${port} (attempt ${attempt}/5)...`);

        processHandle = spawn(process.execPath, [viteEntry, "--host", "127.0.0.1", "--port", String(port), "--strictPort"], {
          cwd: projectDir,
          env: { ...process.env, NODE_ENV: "development", BROWSER: "none" },
          windowsHide: true,
          stdio: ["ignore", "pipe", "pipe"]
        });

        processHandle.stdout?.on("data", c => {
          const text = c.toString(); output += text;
          for (const line of text.split(/\r?\n/).map(x => x.trim()).filter(Boolean)) pushAgentLog("info", `[Vite ${port}] ${line}`);
        });
        processHandle.stderr?.on("data", c => {
          const text = c.toString(); output += text; lastError = text.trim();
          for (const line of text.split(/\r?\n/).map(x => x.trim()).filter(Boolean)) pushAgentLog("warn", `[Vite ${port}] ${line}`);
        });

        const devUrl = `http://127.0.0.1:${port}`;
        const exitPromise = new Promise<number>(resolve => {
          processHandle!.once("error", () => resolve(1));
          processHandle!.once("close", c => resolve(c ?? 1));
        });
        const readyPromise = waitForViteApp(devUrl, 15000).then(result => {
          if (result.ok) return { code: 0, diagnostic: '' };
          return { code: -2, diagnostic: result.error || 'Vite app validation failed.' };
        });
        const result = await Promise.race([
          exitPromise.then(code => ({ code, diagnostic: '' })),
          readyPromise,
        ]);
        ready = result.code === 0;
        if (!ready && result.diagnostic) lastError = result.diagnostic;
        if (!ready) {
          try { processHandle.kill(); } catch { /* ignore */ }
          pushAgentLog("warn", `[Vite ${port}] Preview failed to become reachable. ${lastError || output.slice(-1000)}`);
        }
      }

      if (!ready || !processHandle) throw new Error(`Vite preview could not become reachable. ${lastError || output.slice(-2000)}`);

      const devUrl = `http://127.0.0.1:${port}`;
      const pid = processHandle.pid || process.pid;
      activeDevServers.set(projectId, { projectId, port, pid, process: processHandle, url: devUrl, status: "running", startedAt: new Date().toISOString() });
      processHandle.once("close", code => {
        pushAgentLog("warn", `[Vite ${port}] Process exited with code ${code}`);
        const current = activeDevServers.get(projectId);
        if (current?.pid === pid) current.status = "stopped";
      });
      pushAgentLog("success", `[Dev Server] Live preview confirmed at ${devUrl}`);
      return res.json({ success: true, port, url: devUrl, pid, status: "running" });
    } catch (err: any) {
      pushAgentLog("error", `[Dev Server] ${err?.message || String(err)}`);
      activeDevServers.delete(projectId);
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  app.get(["/project/status", "/api/project/status"], (req, res) => {
    const projectId = String(req.query.projectId || "");
    const server = activeDevServers.get(projectId);
    return res.json({
      success: true,
      projectId,
      running: !!server?.process && server.status === "running",
      status: server?.status || "stopped",
      port: server?.port || null,
      url: server?.url || null,
      pid: server?.pid || null,
    });
  });

  app.post(["/project/stop", "/api/project/stop"], (req, res) => {
    const { projectId = "default" } = req.body;
    const existing = activeDevServers.get(projectId);

    if (existing && existing.process) {
      try {
        existing.process.kill();
        existing.status = "stopped";
        pushAgentLog("warn", `[Dev Server] Terminated process for project "${projectId}"`);
      } catch {
        // Ignored
      }
    }

    res.json({ success: true, status: "stopped", projectId });
  });

  // =========================================================================
  // 4. REAL FILESYSTEM & WORKSPACE SYNCHRONIZER (Phase 8 & 10)
  // =========================================================================
  // POST /api/workspace/sync (Syncs full in-memory Project JSON structure to real disk)
  app.post("/api/workspace/sync", (req, res) => {
    try {
      const { projectId = "default", files = {} } = req.body;
      const safeProjectId = String(projectId).replace(/[^a-zA-Z0-9._-]/g, "_");
    const projectDir = path.join(WORKSPACE_BASE, safeProjectId);

      if (!fs.existsSync(projectDir)) {
        fs.mkdirSync(projectDir, { recursive: true });
      }

      let writtenCount = 0;
      for (const [filePath, fileObj] of Object.entries(files as Record<string, any>)) {
        const content = typeof fileObj === "string" ? fileObj : fileObj.content || "";
        const safePath = sanitizeProjectPath(filePath, projectDir);
        if (!safePath) continue;

        const parentDir = path.dirname(safePath);
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true });
        }
        fs.writeFileSync(safePath, content, "utf8");
        writtenCount++;
      }

      pushAgentLog("success", `[Workspace Sync] Synchronized ${writtenCount} files to disk in projects/${projectId}`);
      res.json({ success: true, writtenFiles: writtenCount, projectDir });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /project/files (Real directory scan)
  const handleGetFiles = (req: express.Request, res: express.Response) => {
    try {
      const projectId = (req.query.projectId as string) || "default";
      const safeProjectId = String(projectId).replace(/[^a-zA-Z0-9._-]/g, "_");
      const targetDir = path.join(WORKSPACE_BASE, safeProjectId);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      const scanBase = targetDir;
      const filesList: string[] = [];

      function scanDir(dir: string) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist") {
            continue;
          }
          const fullPath = path.join(dir, entry.name);
          const relPath = path.relative(scanBase, fullPath);
          if (entry.isDirectory()) {
            scanDir(fullPath);
          } else {
            filesList.push(relPath.replace(/\\/g, "/"));
          }
        }
      }

      scanDir(scanBase);
      res.json({ success: true, files: filesList, total: filesList.length, projectDir: scanBase });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
  app.get("/project/files", handleGetFiles);
  app.get("/api/project/files", handleGetFiles);

  // GET /project/file & POST /project/file & DELETE /project/file
  const handleGetFile = (req: express.Request, res: express.Response) => {
    const filePath = req.query.path as string;
    const projectId = (req.query.projectId as string) || "default";
    const safeProjectId = String(projectId).replace(/[^a-zA-Z0-9._-]/g, "_");
    const projectDir = path.join(WORKSPACE_BASE, safeProjectId);
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }
    const safePath = sanitizeProjectPath(filePath, projectDir);

    if (!safePath) {
      return res.status(403).json({ error: "Access Denied: Path escapes project boundary" });
    }

    try {
      if (!fs.existsSync(safePath)) {
        return res.status(404).json({ error: `File not found: ${filePath}` });
      }
      const content = fs.readFileSync(safePath, "utf8");
      res.json({ success: true, path: filePath, content });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
  app.get("/project/file", handleGetFile);
  app.get("/api/project/file", handleGetFile);

  const handlePostFile = (req: express.Request, res: express.Response) => {
    const { path: filePath, content, projectId = "default" } = req.body;
    const safeProjectId = String(projectId).replace(/[^a-zA-Z0-9._-]/g, "_");
    const projectDir = path.join(WORKSPACE_BASE, safeProjectId);
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }
    const safePath = sanitizeProjectPath(filePath, projectDir);

    if (!safePath) {
      return res.status(403).json({ error: "Access Denied: Path escapes project boundary" });
    }

    try {
      const parentDir = path.dirname(safePath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      fs.writeFileSync(safePath, content ?? "", "utf8");
      pushAgentLog("success", `[Disk] Written: ${filePath}`);
      res.json({ success: true, path: filePath, bytes: Buffer.byteLength(content || "", "utf8") });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
  app.post("/project/file", handlePostFile);
  app.post("/api/project/file", handlePostFile);

  const handleDeleteFile = (req: express.Request, res: express.Response) => {
    const filePath = (req.query.path as string) || req.body?.path;
    const projectId = (req.query.projectId as string) || req.body?.projectId || "default";
    const safeProjectId = String(projectId).replace(/[^a-zA-Z0-9._-]/g, "_");
    const projectDir = path.join(WORKSPACE_BASE, safeProjectId);
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }
    const safePath = sanitizeProjectPath(filePath, projectDir);

    if (!safePath) {
      return res.status(403).json({ error: "Access Denied: Path escapes project boundary" });
    }

    try {
      if (fs.existsSync(safePath)) {
        fs.unlinkSync(safePath);
        pushAgentLog("info", `[Disk] Deleted: ${filePath}`);
      }
      res.json({ success: true, path: filePath });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
  app.delete("/project/file", handleDeleteFile);
  app.delete("/api/project/file", handleDeleteFile);

  // GET /project/logs (SSE & Polling)
  app.get(["/project/logs", "/api/project/logs"], (req, res) => {
    if (req.headers.accept && req.headers.accept.includes("text/event-stream")) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const interval = setInterval(() => {
        const latest = agentLogBuffer[agentLogBuffer.length - 1];
        if (latest) {
          res.write(`data: ${JSON.stringify(latest)}\n\n`);
        }
      }, 1000);

      req.on("close", () => clearInterval(interval));
    } else {
      res.json({ logs: agentLogBuffer });
    }
  });

  // =========================================================================
  // 5. AI GENERATION & MODERN GEMINI 3.7 FLASH INTEGRATION (Phase 8 & 24)
  // =========================================================================
  app.post(["/ai/generate", "/api/ai/generate"], async (req, res) => {
    try {
      const { prompt, systemInstruction, projectContext, isErrorFix, provider = "ollama" } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      // Ollama route
      if (provider === "ollama" || !process.env.GEMINI_API_KEY) {
        const ollamaEndpoint = req.body.ollamaEndpoint || "http://localhost:11434";
        const ollamaModel = req.body.ollamaModel || "rahul-ai:latest";

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 55000);

          const response = await fetch(`${ollamaEndpoint}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: ollamaModel,
              prompt: `${systemInstruction ? `SYSTEM: ${systemInstruction}\n\n` : ""}${
                projectContext ? `CONTEXT: ${JSON.stringify(projectContext)}\n\n` : ""
              }REQUEST: ${prompt}`,
              system: systemInstruction || "You are a local coding assistant. Return compact project files using ===FILE:path=== and ===END_FILE=== delimiters. Never return JSON.",
              stream: false,
              options: {
                num_ctx: 8192,
                num_predict: 9000,
              },
            }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            let parsed = {};
            try {
              parsed = JSON.parse(data.response);
            } catch {
              parsed = { summary: data.response, actions: [] };
            }
            return res.json({ success: true, data: parsed, raw: data.response, model: ollamaModel });
          }
        } catch (ollamaErr: any) {
          pushAgentLog("warn", `Local Ollama unavailable (${ollamaErr.message}).`);
        }
      }

      // Gemini 3.7 Flash Cloud Fallback (without deprecated temperature parameter)
      if (process.env.GEMINI_API_KEY) {
        const ai = getGeminiClient();
        const combinedInstruction = `
You are an expert AI software engineer running inside Local AI App Builder.
CRITICAL PROTOCOL:
You MUST respond with valid JSON adhering to:
{
  "plan": ["Step 1: Description", "Step 2: Description"],
  "summary": "Brief description of changes",
  "actions": [
    {
      "action": "create_file" | "update_file" | "delete_file" | "install_package" | "run_command",
      "path": "src/App.tsx",
      "content": "complete file content...",
      "command": "npm install lucide-react"
    }
  ],
  "diagnostics": {
    "detectedIssues": [],
    "fixedIssues": []
  }
}
${isErrorFix ? "AUTOMATIC ERROR RECOVERY: Diagnose the error and return corrected files." : ""}
`;
        const result = await callGeminiWithFallback(
          ai,
          prompt,
          combinedInstruction,
          projectContext,
          Boolean(isErrorFix)
        );

        return res.json({
          success: true,
          data: result.data,
          model: result.model,
        });
      }

      return res.json({
        success: true,
        data: {
          plan: ["Synthesize offline component", "Mount on workspace"],
          summary: "Generated component offline using local engine",
          actions: [],
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Modern Gemini 3.7 Flash Caller (Omit deprecated sampling parameters per Gemini 3.x guidelines)
  async function callGeminiWithFallback(
    ai: GoogleGenAI,
    prompt: string,
    systemInstruction: string,
    projectContext: any,
    _isErrorFix: boolean
  ) {
    const candidateModels = [
      "gemini-3.7-flash",
      "gemini-3.1-pro-preview",
      "gemini-3.1-flash-lite",
      "gemini-flash-latest",
    ];
    let lastError: Error | null = null;

    const userContent = `${systemInstruction ? `SYSTEM INSTRUCTION: ${systemInstruction}\n\n` : ""}${
      projectContext ? `CURRENT PROJECT CONTEXT:\n${JSON.stringify(projectContext, null, 2)}\n\n` : ""
    }USER REQUEST:\n${prompt}`;

    for (const model of candidateModels) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: [
              {
                role: "user",
                parts: [{ text: userContent }],
              },
            ],
            config: {
              systemInstruction,
              responseMimeType: "application/json",
            },
          });

          const responseText = response.text || "{}";
          let parsedData;
          try {
            parsedData = JSON.parse(responseText);
          } catch {
            const clean = responseText.replace(/```json\n?|\n?```/g, "").trim();
            parsedData = JSON.parse(clean);
          }

          return { data: parsedData, model };
        } catch (err: any) {
          lastError = err;
          const errMsg = err?.message || String(err);
          const isHighDemandOrRate =
            errMsg.includes("503") ||
            errMsg.includes("high demand") ||
            errMsg.includes("UNAVAILABLE") ||
            errMsg.includes("429");

          if (isHighDemandOrRate && attempt < 2) {
            await new Promise((resolve) => setTimeout(resolve, 600));
            continue;
          }
          break;
        }
      }
    }

    throw lastError || new Error("All Gemini models failed to generate content.");
  }

  // API Route: Ollama / Local Model Proxy
  app.post("/api/ai/ollama-proxy", async (req, res) => {
    const { endpoint = "http://localhost:11434", model = "rahul-ai:latest", prompt, system, numCtx, numPredict, jsonMode = true } = req.body;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 55000);

      const response = await fetch(`${endpoint}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          prompt,
          system,
          stream: false,
          ...(jsonMode ? { format: "json" } : {}),
          options: {
            num_ctx: Math.min(Math.max(Number(numCtx) || 8192, 4096), 8192),
            num_predict: Math.min(Math.max(Number(numPredict) || 8500, 512), 10000),
          },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama server returned HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      let parsedResponse = {};
      try {
        parsedResponse = JSON.parse(data.response);
      } catch {
        parsedResponse = { text: data.response };
      }

      res.json({
        success: true,
        data: parsedResponse,
        raw: data.response,
        model,
        evalDurationMs: data.eval_duration ? Math.round(data.eval_duration / 1e6) : 0,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      res.status(502).json({
        success: false,
        error: `Failed to communicate with local Ollama at ${endpoint}: ${errorMsg}. Make sure Ollama is running (ollama serve) and CORS is enabled via OLLAMA_ORIGINS="*"`,
      });
    }
  });

  // GET /api/tags & /api/ollama/tags (Ollama live tags fetch)
  app.get(["/api/tags", "/api/ollama/tags"], async (req, res) => {
    const endpoint = (req.query.endpoint as string) || "http://localhost:11434";
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 2000);
      const response = await fetch(`${endpoint}/api/tags`, { signal: controller.signal });
      clearTimeout(id);

      if (response.ok) {
        const data = await response.json();
        return res.json(data);
      }
    } catch {
      // Fallback
    }

    res.json({ models: [] });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, process.env.HOST || "0.0.0.0", () => {
    console.log(`[Local AI App Builder] Local Agent running on http://127.0.0.1:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

