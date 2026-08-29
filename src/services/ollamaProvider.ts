import { z } from 'zod';
import { Project, AppSettings, PlanStep, ToolActionPayload, GeneratedAppSchema } from '../types/builder';

// Zod Structured Output Contract for Local Models (Step 3)
export const ToolActionSchema = z.object({
  action: z.enum([
    'create_file',
    'update_file',
    'delete_file',
    'install_package',
    'run_command',
    'start_dev_server',
    'stop_dev_server',
    'finish'
  ]),
  path: z.string().optional(),
  content: z.string().optional(),
  command: z.string().optional(),
  package: z.string().optional(),
  summary: z.string().optional(),
});

export const AppPlanSchema = z.object({
  plan: z.array(z.string()).default([
    'Inspect requirements',
    'Design the requested application',
    'Write all required project files',
    'Verify the generated Vite project'
  ]),
  summary: z.string().default('Generated the requested application.'),
  actions: z.array(ToolActionSchema).default([]),
  diagnostics: z.object({
    detectedIssues: z.array(z.string()).optional(),
    fixedIssues: z.array(z.string()).optional(),
  }).optional(),
});

export type ValidatedAppPlan = z.infer<typeof AppPlanSchema>;

export interface OllamaModelTag {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
  details?: {
    family: string;
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaStreamingCallbacks {
  onToken?: (token: string) => void;
  onLog?: (type: 'info' | 'success' | 'warn' | 'error' | 'command', text: string) => void;
  onProgress?: (percent: number, status: string) => void;
}

export class OllamaProvider {
  /**
   * Fetches real live model tags directly from local Ollama instance (http://localhost:11434/api/tags)
   */
  static async fetchInstalledModels(endpoint: string = 'http://localhost:11434'): Promise<{
    connected: boolean;
    models: OllamaModelTag[];
    error?: string;
  }> {
    try {
      // First try direct local fetch or proxy through local agent
      let response: Response;
      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 2000);
        response = await fetch(`${endpoint}/api/tags`, {
          signal: controller.signal,
        });
        clearTimeout(id);
      } catch {
        // Fallback to local agent proxy
        response = await fetch(`/api/companion/status?ollamaUrl=${encodeURIComponent(endpoint)}`);
      }

      if (!response.ok) {
        return {
          connected: false,
          models: this.getDefaultFallbackModels(),
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      const rawModels = data.models || [];
      const parsedModels: OllamaModelTag[] = rawModels.map((m: any) => ({
        name: m.name || m,
        size: m.size || 4.2 * 1024 * 1024 * 1024,
        digest: m.digest || 'local-digest',
        modified_at: m.modified_at || new Date().toISOString(),
        details: m.details || {
          family: 'qwen2',
          parameter_size: '7B',
          quantization_level: 'Q4_K_M',
        },
      }));

      return {
        connected: data.ollamaConnected !== false,
        models: parsedModels.length > 0 ? parsedModels : this.getDefaultFallbackModels(),
      };
    } catch (err: any) {
      return {
        connected: false,
        models: this.getDefaultFallbackModels(),
        error: err?.message || 'Ollama is not running on http://localhost:11434',
      };
    }
  }

  /**
   * Generates plan and file actions using local Ollama with JSON mode and zod validation & repair loop
   */
  static async generateWithOllama(
    prompt: string,
    context: Record<string, any>,
    settings: AppSettings,
    callbacks: OllamaStreamingCallbacks
  ): Promise<GeneratedAppSchema> {
    const endpoint = settings.ai.localEndpoint || 'http://localhost:11434';
    const mode = settings.ai.ollamaMode || 'auto';
    const primaryModel = mode === 'rahul' ? 'rahul-ai:latest' : mode === 'qwen' ? 'qwen2.5-coder:7b' : (settings.ai.ollamaModel || 'qwen2.5-coder:7b');
    const modelOrder = mode === 'auto' ? ['qwen2.5-coder:7b', 'rahul-ai:latest'] : [primaryModel];
    const models = [...new Set(modelOrder)];

    // Automatically choose the generation strategy. Small requests stay on the
    // one-pass path for speed; complex requests use the staged planner so the
    // model can build dozens of files without overflowing one response.
    const complexity = this.classifyRequestComplexity(prompt, context);
    callbacks.onLog?.('info', `[Ollama] ${complexity.toUpperCase()} offline generation: ${models.join(' → ')}`);

    let lastError = '';
    for (const model of models) {
      try {
        // V5 fast path: every request uses one bounded generation call. This prevents
        // large-app requests from exploding into dozens of sequential Ollama calls.
        // The model is instructed to keep the architecture compact while still being
        // a real application. If the first local model fails, auto mode immediately
        // falls back to the second configured model.
        return await this.generateFastProject(prompt, context, settings, callbacks, model);
      } catch (err: any) {
        lastError = err?.message || String(err);
        callbacks.onLog?.('warn', `[Ollama] Fast ${model} failed: ${lastError}`);
        // In FAST mode do not burn minutes on 10-18 additional model calls.
        // Auto mode can try the second installed local model instead.
      }
    }
    throw new Error(`Local Ollama could not produce project files. ${lastError}`);
  }

  private static classifyRequestComplexity(prompt: string, context: Record<string, any>): 'small' | 'medium' | 'large' {
    const text = `${prompt} ${JSON.stringify(context || {}).slice(0, 12000)}`.toLowerCase();
    const largeSignals = [
      'full stack', 'dashboard', 'admin panel', 'e-commerce', 'ecommerce', 'marketplace',
      'authentication', 'authorization', 'database', 'api', 'backend', 'multi-page',
      'multiple pages', 'routing', 'analytics', 'calendar', 'chat', 'ai assistant',
      'real-time', 'realtime', 'cms', 'crm', 'inventory', 'payment', 'subscription',
      'role based', 'responsive web app', 'saas', 'large application', 'production app',
      'complete application', 'complete platform', 'many components', 'complex application'
    ];
    const mediumSignals = [
      'form', 'search', 'filter', 'table', 'chart', 'modal', 'settings', 'multiple components',
      'crud', 'localstorage', 'navigation', 'tabs'
    ];
    const largeHits = largeSignals.filter(x => text.includes(x)).length;
    const mediumHits = mediumSignals.filter(x => text.includes(x)).length;
    if (largeHits >= 2 || text.length > 1800) return 'large';
    if (largeHits === 1 || mediumHits >= 2 || text.length > 700) return 'medium';
    return 'small';
  }

  private static async generateFastProject(
    prompt: string,
    context: Record<string, any>,
    settings: AppSettings,
    callbacks: OllamaStreamingCallbacks,
    model: string
  ): Promise<GeneratedAppSchema> {
    const endpoint = settings.ai.localEndpoint || 'http://localhost:11434';
    // RTX 5050 8GB: keep context modest so generation stays responsive and does not
    // unnecessarily consume VRAM. A single compact response is the speed path.
    const ctx = Math.min(Math.max(settings.ai.contextSize || 8192, 4096), 8192);
    const system = `You are a FAST local React/TypeScript/Vite coding agent.
Return ONLY complete project files using this exact delimiter format:
===FILE:path===
<complete file contents>
===END_FILE===
No JSON. No markdown fences. No explanations.
Build the user's requested app, not a demo or placeholder.
Keep the project compact: normally 5-12 files; for large apps prefer a compact architecture over dozens of tiny files.
ALWAYS create: package.json, index.html, src/main.tsx, src/App.tsx, src/index.css.
Create every local file referenced by imports.
Prefer React hooks, browser APIs and localStorage. Avoid unnecessary dependencies.
package.json must contain every imported npm package and a Vite dev/build script.
Use only relative local imports that you actually provide.
Make every file self-contained and compilable.`;

    callbacks.onLog?.('info', `[Ollama] ${model}: single-pass fast generation (target <60s)...`);
    const raw = await this.callOllamaApi(
      endpoint,
      model,
      `USER REQUEST:\n${prompt}\n\nEXISTING PROJECT CONTEXT (use only when this is an edit):\n${JSON.stringify(context).slice(0, 12000)}`,
      system,
      callbacks,
      0.1,
      { numCtx: ctx, numPredict: 9000, jsonMode: false }
    );

    const actions = this.extractDelimitedFiles(raw);
    if (!actions.length) throw new Error('Fast Ollama response contained no usable files.');

    // Ensure src/App.tsx was generated at minimum
    const hasApp = actions.some(a => a.path === 'src/App.tsx' || a.path === 'src/App.jsx' || a.path === 'App.tsx');
    if (!hasApp) {
      throw new Error('Fast generation omitted required src/App.tsx');
    }

    for (const action of actions) callbacks.onLog?.('success', `✓ Generated ${action.path}`);
    return {
      plan: ['Understand requirements', 'Generate project files', 'Validate and launch live preview'],
      summary: `Generated the requested application in one fast offline Ollama pass using ${model}.`,
      actions,
    };
  }

  private static extractDelimitedFiles(raw: string): ToolActionPayload[] {
    const text = String(raw || '').replace(/\r\n/g, '\n');
    const re = /===FILE:([^=\n]+)===\s*([\s\S]*?)(?=\s*===END_FILE===)/gi;
    const actions: ToolActionPayload[] = [];
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      const filePath = match[1].trim().replace(/\\/g, '/').replace(/^\/+/, '');
      if (!filePath || filePath.includes('..') || /^[A-Za-z]:/.test(filePath)) continue;
      const content = this.cleanGeneratedContent(match[2], filePath);
      if (content) actions.push({ action: 'create_file', path: filePath, content });
    }
    // Salvage the final truncated file even if ===END_FILE=== was never emitted.
    if (!actions.length || !actions.some(a => a.path === 'src/App.tsx')) {
      const startRe = /===FILE:([^=\n]+)===\s*/gi;
      let starts: RegExpExecArray | null;
      while ((starts = startRe.exec(text)) !== null) {
        const next = text.indexOf('===FILE:', starts.index + starts[0].length);
        const segment = text.slice(starts.index + starts[0].length, next >= 0 ? next : text.length);
        const end = segment.indexOf('===END_FILE===');
        const filePath = starts[1].trim().replace(/\\/g, '/');
        const content = this.cleanGeneratedContent(end >= 0 ? segment.slice(0, end) : segment, filePath);
        if (content && !actions.some(a => a.path === filePath)) actions.push({ action: 'create_file', path: filePath, content });
        if (next < 0) break;
        startRe.lastIndex = next;
      }
    }
    return actions;
  }

  private static async generateStagedProject(
    prompt: string,
    context: Record<string, any>,
    settings: AppSettings,
    callbacks: OllamaStreamingCallbacks,
    model: string
  ): Promise<GeneratedAppSchema> {
    const endpoint = settings.ai.localEndpoint || 'http://localhost:11434';
    const ctx = Math.min(Math.max(settings.ai.contextSize || 8192, 4096), 8192);
    callbacks.onLog?.('info', `[Ollama] ${model}: planning compact file manifest...`);

    // IMPORTANT: the manifest is deliberately plain text. Small local models can truncate
    // JSON, which previously caused "Unterminated string in JSON" and stopped generation.
    const manifestSystem = `You are the architecture planner for a local React + TypeScript + Vite app builder.
Return ONLY a plain-text file list, one relative path per line. NO JSON, NO markdown, NO source code, NO explanations.
The user request is the source of truth. Do not substitute a demo.
Always include package.json, index.html, src/main.tsx, src/App.tsx and src/index.css.
Include every local file required by imports. Prefer 5-18 files for medium apps and up to 40 files for large apps. Do not omit required files.`;
    const manifestRaw = await this.callOllamaApi(endpoint, model,
      `USER REQUEST:\n${prompt}\n\nPROJECT CONTEXT:\n${JSON.stringify(context)}`,
      manifestSystem, callbacks, 0.1, { numCtx: ctx, numPredict: 500, jsonMode: false });

    const required = ['package.json', 'index.html', 'src/main.tsx', 'src/App.tsx', 'src/index.css'];
    const filesFromText = String(manifestRaw || '').split(/\r?\n/)
      .map(line => line.trim().replace(/^[-*•]\s*/, '').replace(/^['"]|['"]$/g, ''))
      .map(f => f.replace(/\\/g, '/').replace(/^\/+/, ''))
      .filter(f => f && /^(?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+\.(?:tsx?|jsx?|css|json|html|md|svg)$/.test(f));
    let files = [...new Set([...required, ...filesFromText])]
      .filter(f => !f.includes('..') && !/^[A-Za-z]:|^\\/.test(f)).slice(0, 40);
    if (!files.includes('src/App.tsx')) throw new Error('Manifest omitted required src/App.tsx.');
    callbacks.onLog?.('success', `[Ollama] Manifest: ${files.length} files. Using staged generation without giant JSON.`);

    const actions: ToolActionPayload[] = [];
    for (let i = 0; i < files.length; i++) {
      const filePath = files[i];
      let content = '';
      let lastFileError = '';
      for (let attempt = 1; attempt <= 2 && !content; attempt++) {
        callbacks.onLog?.('info', `[Ollama] ${model}: ${filePath} (${i + 1}/${files.length}), attempt ${attempt}/2`);
        try {
          const system = `You are a local coding agent. Generate ONLY the complete contents of one file.
Do NOT output JSON. Do NOT use markdown fences. Do NOT explain anything.
Start with: ===FILE:${filePath}===
End with: ===END_FILE===
The file must be complete, compilable, and faithful to the user's request.
Never use placeholders such as TODO, omitted code, or same as above.
All local imports must reference files in this manifest: ${files.join(', ')}.
For package.json, include only dependencies actually used by generated source.`;
          const existingFile = (context as any)?.files?.[filePath];
          const existingSection = existingFile
            ? `\n\nEXISTING FILE CONTENT (preserve working behavior; repair rather than redesign):\n${String(existingFile).slice(0, 9000)}`
            : '';
          const raw = await this.callOllamaApi(endpoint, model,
            `USER REQUEST:\n${prompt}\n\nFILE MANIFEST:\n${files.join('\n')}\n\nGENERATE FILE ${filePath} (${i + 1}/${files.length}).${existingSection}`,
            system, callbacks, 0.15, { numCtx: ctx, numPredict: filePath === 'src/App.tsx' ? 5000 : 2600, jsonMode: false });
          content = this.extractDelimitedFile(raw, filePath);
          if (!content) lastFileError = `Empty content for ${filePath}`;
        } catch (err: any) { lastFileError = err?.message || String(err); }
      }
      if (!content) throw new Error(lastFileError || `Could not generate ${filePath}`);
      actions.push({ action: 'create_file', path: filePath, content });
      callbacks.onLog?.('success', `✓ Generated ${filePath}`);
    }
    return {
      plan: ['Understand user requirements', 'Create file manifest', 'Generate files independently', 'Validate generated Vite project'],
      summary: `Generated the requested application using ${model} with resilient file-by-file generation.`,
      actions,
    };
  }

  private static extractDelimitedFile(raw: string, filePath: string): string {
    let text = String(raw || '').trim();
    const escaped = filePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`===FILE:${escaped}===\\s*([\\s\\S]*?)\\s*===END_FILE===`, 'i');
    const match = re.exec(text);
    if (match?.[1]) return this.cleanGeneratedContent(match[1], filePath);
    // Salvage truncated responses where the model emitted FILE but never reached END_FILE.
    const startMarker = `===FILE:${filePath}===`;
    const startIndex = text.toLowerCase().indexOf(startMarker.toLowerCase());
    if (startIndex >= 0) {
      const tail = text.slice(startIndex + startMarker.length);
      const endIndex = tail.toLowerCase().indexOf('===end_file===');
      return this.cleanGeneratedContent(endIndex >= 0 ? tail.slice(0, endIndex) : tail, filePath);
    }
    const marker = new RegExp(`(?:FILE|Path)\\s*[:=]\\s*${escaped}\\s*`, 'i').exec(text);
    if (marker) text = text.slice(marker.index + marker[0].length);
    return this.cleanGeneratedContent(text, filePath);
  }

  private static cleanGeneratedContent(content: string, filePath: string): string {
    let out = content.trim();
    out = out.replace(/^```[a-zA-Z0-9_-]*\s*/i, '').replace(/\s*```$/i, '').trim();
    if (out.startsWith('"') && out.endsWith('"') && filePath === 'package.json') {
      try { const decoded = JSON.parse(out); if (typeof decoded === 'string') out = decoded; } catch { /* not JSON-encoded */ }
    }
    return out;
  }

  private static extractJsonObject(raw: string): string {
    const text = (raw || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (first < 0 || last <= first) throw new Error('No JSON object found in Ollama response.');
    return text.slice(first, last + 1);
  }

  private static extractContentForPath(raw: string, filePath: string): string {
    const text = raw || '';
    const marker = new RegExp('(?:FILE|File|PATH|Path)\\s*[:=]\\s*' + filePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').exec(text);
    if (marker) {
      const tail = text.slice(marker.index + marker[0].length);
      const fence = /```(?:tsx|ts|jsx|js|json|css|html)?\s*([\s\S]*?)```/i.exec(tail);
      if (fence?.[1]) return fence[1].trim();
      return tail.trim();
    }
    const blocks = [...text.matchAll(/```(?:tsx|ts|jsx|js|json|css|html)?\s*([\s\S]*?)```/gi)];
    return blocks.length ? blocks[0][1].trim() : text.trim();
  }

  private static normalizeModelOutput(rawText: string): any {
    let text = (rawText || '').trim();
    const fenced = /```(?:json)?\s*([\s\S]*?)\s*```/i.exec(text);
    if (fenced?.[1]) text = fenced[1].trim();

    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (first >= 0 && last > first) text = text.slice(first, last + 1);

    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return { plan: [], summary: 'Generated application', actions: parsed };
    if (parsed.project?.actions) return parsed.project;
    if (parsed.data?.actions) return parsed.data;

    // Some coding models naturally return a file map instead of actions.
    const fileMap = parsed.files || parsed.project?.files;
    if (fileMap && typeof fileMap === 'object' && !Array.isArray(fileMap)) {
      const actions = Object.entries(fileMap).map(([path, content]) => ({
        action: 'create_file', path, content: String(content ?? '')
      }));
      return {
        plan: parsed.plan || [],
        summary: parsed.summary || 'Generated application files',
        actions,
        diagnostics: parsed.diagnostics,
      };
    }
    return parsed;
  }

  private static async callOllamaApi(
    endpoint: string,
    model: string,
    prompt: string,
    system: string,
    callbacks: OllamaStreamingCallbacks,
    temperature = 0.2,
    generationOptions: { numCtx?: number; numPredict?: number; jsonMode?: boolean } = {}
  ): Promise<string> {
    try {
      const response = await fetch('/api/ai/ollama-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint,
          model,
          prompt,
          system,
          numCtx: generationOptions.numCtx,
          numPredict: generationOptions.numPredict,
          jsonMode: generationOptions.jsonMode !== false,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        if (json.raw) return json.raw;
        if (json.data) return typeof json.data === 'string' ? json.data : JSON.stringify(json.data);
      }
    } catch {
      // Fallback direct request
    }

    // Direct browser fetch to Ollama if CORS allowed
    const directResp = await fetch(`${endpoint}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        system,
        stream: false,
        ...(generationOptions.jsonMode !== false ? { format: 'json' } : {}),
        options: {
          num_ctx: Math.min(Math.max(generationOptions.numCtx || 8192, 4096), 8192),
          temperature: Number.isFinite(temperature) ? temperature : 0.2,
          num_predict: Math.min(Math.max(generationOptions.numPredict || 8500, 512), 10000),
        },
      }),
    });

    if (!directResp.ok) {
      throw new Error(`Ollama returned HTTP ${directResp.status}`);
    }

    const data = await directResp.json();
    return data.response;
  }

  private static extractFallbackActions(rawText: string, prompt: string): GeneratedAppSchema {
    const actions: ToolActionPayload[] = [];
    const filePattern = /(?:^|\n)\s*(?:FILE|File|###)\s*[:\-]?\s*([A-Za-z0-9_./\\-]+)\s*\n```(?:tsx|ts|jsx|js|json|css|html)?\s*([\s\S]*?)```/g;
    let match: RegExpExecArray | null;
    while ((match = filePattern.exec(rawText)) !== null) {
      const filePath = match[1].replace(/\\/g, '/').replace(/^\//, '');
      const content = match[2].trim();
      if (filePath && content) actions.push({ action: 'create_file', path: filePath, content });
    }

    // Handle a single fenced source block only if it is clearly an App component.
    if (actions.length === 0) {
      const blocks = [...rawText.matchAll(/```(?:tsx|typescript|jsx|javascript)\s*([\s\S]*?)```/gi)];
      const appBlock = blocks.find(b => /(?:function\s+App|const\s+App|export\s+default)/.test(b[1]));
      if (appBlock) actions.push({ action: 'create_file', path: 'src/App.tsx', content: appBlock[1].trim() });
    }

    return {
      plan: ['Recover generated source files from local model output'],
      summary: actions.length
        ? `Recovered ${actions.length} generated source file(s) for the requested application.`
        : `Ollama did not return usable files for: ${prompt.slice(0, 80)}`,
      actions,
    };
  }

  static getDefaultFallbackModels(): OllamaModelTag[] {
    return [
      {
        name: 'qwen2.5-coder:7b',
        size: 4.7 * 1024 * 1024 * 1024,
        digest: 'local-qwen2.5-coder',
        modified_at: new Date().toISOString(),
        details: { family: 'qwen2', parameter_size: '7B', quantization_level: 'Q4_K_M' },
      },
      {
        name: 'rahul-ai:latest',
        size: 4.7 * 1024 * 1024 * 1024,
        digest: 'qwen2.5-coder-7b-q4',
        modified_at: new Date().toISOString(),
        details: { family: 'qwen2', parameter_size: '7B', quantization_level: 'Q4_K_M' },
      },
      {
        name: 'deepseek-coder-v2:16b-lite',
        size: 8.9 * 1024 * 1024 * 1024,
        digest: 'deepseek-coder-v2-16b',
        modified_at: new Date().toISOString(),
        details: { family: 'deepseek', parameter_size: '16B', quantization_level: 'Q4_K_M' },
      },
      {
        name: 'codestral:22b',
        size: 12.4 * 1024 * 1024 * 1024,
        digest: 'codestral-22b-q4',
        modified_at: new Date().toISOString(),
        details: { family: 'mistral', parameter_size: '22B', quantization_level: 'Q4_K_M' },
      },
      {
        name: 'llama3.2:3b',
        size: 2.0 * 1024 * 1024 * 1024,
        digest: 'llama3.2-3b-q8',
        modified_at: new Date().toISOString(),
        details: { family: 'llama', parameter_size: '3B', quantization_level: 'Q8_0' },
      },
    ];
  }
}
