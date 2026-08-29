export type AIProvider = 'gemini' | 'ollama' | 'local' | 'demo';

export interface ProjectFile {
  path: string;
  content: string;
  language: 'typescript' | 'tsx' | 'javascript' | 'jsx' | 'json' | 'css' | 'html' | 'markdown' | 'sql';
  isDirty?: boolean;
}

export interface PlanStep {
  id: string;
  text: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  timestamp?: string;
}

export interface ToolActionPayload {
  action: 'create_file' | 'update_file' | 'delete_file' | 'run_command' | 'install_package' | 'start_dev_server' | 'stop_dev_server' | 'inspect_build_error' | 'search_files';
  path?: string;
  content?: string;
  command?: string;
  package?: string;
  query?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  plan?: PlanStep[];
  actions?: ToolActionPayload[];
  errorAnalysis?: {
    problem: string;
    fix: string;
    rebuilding: boolean;
    attempt: number;
    maxAttempts: number;
  };
  isGenerating?: boolean;
}

export interface BuildLog {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warn' | 'error' | 'command';
  text: string;
  command?: string;
}

export interface Snapshot {
  id: string;
  versionNumber: number;
  label: string;
  timestamp: string;
  files: ProjectFile[];
  summary: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  files: Record<string, ProjectFile>;
  activeFilePath: string;
  openTabs: string[];
  messages: Message[];
  currentPlan: PlanStep[];
  snapshots: Snapshot[];
  terminalLogs: BuildLog[];
  devServerStatus: 'stopped' | 'starting' | 'running' | 'error';
  devUrl: string;
  activeError?: {
    message: string;
    file?: string;
    line?: number;
    stack?: string;
    autoFixAttempts: number;
  };
}

export interface SecurityApprovalRequest {
  id: string;
  command: string;
  type: 'install' | 'destructive' | 'exec';
  reason: string;
  onApprove: () => void;
  onDeny: () => void;
}

export interface AppSettings {
  ai: {
    provider: AIProvider;
    model: string;
    temperature: number;
    contextSize: number;
    apiKey: string;
    localEndpoint: string;
    ollamaModel: string;
    /** Which installed local coding model(s) the builder should use. */
    ollamaMode?: 'qwen' | 'rahul' | 'auto';
  };
  rtx5050: {
    gpuName: string;
    vramTotalMB: number;
    vramAllocatedMB: number;
    quantization: '4-bit (Q4_K_M)' | '8-bit (Q8_0)' | '16-bit (FP16)';
    contextLimit: number;
    gpuOffloadLayers: number;
  };
  appearance: {
    theme: 'dark' | 'light';
    fontSize: number;
    editorFont: string;
  };
  runtime: {
    nodePath: string;
    pythonPath: string;
    projectDirectory: string;
    defaultPort: number;
    maxRepairAttempts: number;
    autoFixErrors?: boolean;
    autoInstallPackages?: boolean;
  };
  security: {
    commandApproval: boolean;
    sandbox: boolean;
    networkPermissions: boolean;
    restrictHostAccess: boolean;
  };
}

export interface GeneratedAppSchema {
  plan: string[];
  summary: string;
  actions: ToolActionPayload[];
  diagnostics?: {
    detectedIssues: string[];
    fixedIssues: string[];
  };
}
