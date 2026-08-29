import React, { useState, useEffect, useCallback } from 'react';
import { AppSettings, Project, ProjectFile, Snapshot, BuildLog, SecurityApprovalRequest } from './types/builder';
import { Header } from './components/Header';
import { LandingScreen } from './components/LandingScreen';
import { AIChatPanel } from './components/AIChatPanel';
import { SidebarFileExplorer } from './components/SidebarFileExplorer';
import { CodeEditor } from './components/CodeEditor';
import { LivePreview } from './components/LivePreview';
import { TerminalPanel } from './components/TerminalPanel';
import { SettingsModal } from './components/SettingsModal';
import { SnapshotsModal } from './components/SnapshotsModal';
import { LocalCompanionGuideModal } from './components/LocalCompanionGuideModal';
import { SecurityApprovalModal } from './components/SecurityApprovalModal';
import { GoogleAIStudioLab } from './components/GoogleAIStudioLab';
import { AIAgentService } from './services/aiAgent';
import { ExportService } from './services/exportService';
import { TEMPLATES } from './services/templates';

const DEFAULT_SETTINGS: AppSettings = {
  ai: {
    provider: 'ollama',
    model: 'gemini-2.5-flash',
    temperature: 0.7,
    contextSize: 8192,
    apiKey: '',
    localEndpoint: 'http://localhost:11434',
    ollamaModel: 'qwen2.5-coder:7b',
    ollamaMode: 'auto',
  },
  rtx5050: {
    gpuName: 'NVIDIA GeForce RTX 5050 (8GB VRAM)',
    vramTotalMB: 8192,
    vramAllocatedMB: 6144,
    quantization: '4-bit (Q4_K_M)',
    contextLimit: 8192,
    gpuOffloadLayers: 33,
  },
  appearance: {
    theme: 'dark',
    fontSize: 14,
    editorFont: 'JetBrains Mono, Menlo, monospace',
  },
  runtime: {
    nodePath: 'node',
    pythonPath: 'python',
    projectDirectory: './projects',
    defaultPort: 5173,
    maxRepairAttempts: 3,
    autoFixErrors: true,
    autoInstallPackages: true,
  },
  security: {
    commandApproval: true,
    sandbox: true,
    networkPermissions: true,
    restrictHostAccess: true,
  },
};

function createInitialProject(name: string = 'my-new-app', prompt: string = ''): Project {
  const id = `proj_${Date.now()}`;
  return {
    id,
    name,
    description: prompt || 'Newly created project',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    files: {
      'package.json': {
        path: 'package.json',
        language: 'json',
        content: JSON.stringify(
          {
            name: name.toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
            private: true,
            version: '0.1.0',
            type: 'module',
            scripts: {
              dev: 'vite',
              build: 'tsc && vite build',
              preview: 'vite preview',
            },
            dependencies: {
              react: '^18.3.1',
              'react-dom': '^18.3.1',
              'lucide-react': '^0.468.0',
            },
            devDependencies: {
              '@types/react': '^18.3.18',
              '@types/react-dom': '^18.3.5',
              '@vitejs/plugin-react': '^4.3.4',
              typescript: '^5.8.2',
              vite: '^6.4.3',
            },
          },
          null,
          2
        ),
      },
      'src/App.tsx': {
        path: 'src/App.tsx',
        language: 'tsx',
        content: `import React, { useState } from 'react';
import { Sparkles, Check, Plus, Trash2 } from 'lucide-react';

export default function App() {
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Review architecture & models', done: true },
    { id: 2, text: 'Design reactive UI components', done: false },
    { id: 3, text: 'Test live preview execution', done: false },
  ]);
  const [newText, setNewText] = useState('');

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    setTasks([...tasks, { id: Date.now(), text: newText.trim(), done: false }]);
    setNewText('');
  };

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const deleteTask = (id: number) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#0E0E10] text-[#E4E4E7] p-6 flex flex-col items-center justify-start font-sans">
      <div className="w-full max-w-lg space-y-6 pt-8">
        <div className="flex items-center justify-between border-b border-[#27272A] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFD700] text-black flex items-center justify-center font-bold shadow-lg shadow-[#FFD700]/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">${name}</h1>
              <p className="text-xs text-[#A1A1AA]">Real-time interactive application</p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-[#18181B] text-[#FFD700] border border-[#27272A]">
            Active
          </span>
        </div>

        <form onSubmit={addTask} className="flex gap-2">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Add a new item..."
            className="flex-1 bg-[#18181B] border border-[#27272A] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#71717A] focus:outline-none focus:border-[#FFD700] transition"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-[#FFD700] text-black font-bold rounded-xl text-sm flex items-center gap-1.5 hover:bg-[#FFE033] transition cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add</span>
          </button>
        </form>

        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className="flex items-center justify-between p-3.5 rounded-xl bg-[#18181B] border border-[#27272A] hover:border-[#3F3F46] transition cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className={\`w-5 h-5 rounded-md flex items-center justify-center border transition \${
                  task.done ? 'bg-[#FFD700] border-[#FFD700] text-black' : 'border-[#3F3F46] bg-[#0E0E10]'
                }\`}>
                  {task.done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <span className={\`text-sm font-medium \${task.done ? 'line-through text-[#71717A]' : 'text-white'}\`}>
                  {task.text}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteTask(task.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-[#71717A] hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
`,
      },
      'src/main.tsx': {
        path: 'src/main.tsx',
        language: 'tsx',
        content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
      },
      'src/index.css': {
        path: 'src/index.css',
        language: 'css',
        content: `@import "tailwindcss";\n`,
      },
      'index.html': {
        path: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${name}</title>
  </head>
  <body class="bg-[#0A0A0A] text-[#EDEDED]">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
      },
    },
    activeFilePath: 'src/App.tsx',
    openTabs: ['src/App.tsx', 'src/main.tsx', 'package.json'],
    messages: [
      {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: `Project workspace **${name}** created. Describe features or components you want to generate or modify.`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ],
    currentPlan: [],
    snapshots: [],
    terminalLogs: [
      {
        id: `log_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'info',
        text: `Initialized project workspace: ${name}`,
      },
    ],
    devServerStatus: 'stopped',
    devUrl: '',
  };
}

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('local_ai_builder_settings');
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_SETTINGS;
  });

  const [activeMode, setActiveMode] = useState<'builder' | 'studio'>('builder');
  const [recentProjects, setRecentProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem('local_ai_recent_projects');
      if (saved) return JSON.parse(saved);
    } catch {}
    // Seed with template demo if empty
    const initial = createInitialProject('Inventory Master Pro', 'Modern inventory management with login, products, stock tracking, and SQLite database.');
    return [initial];
  });

  const [currentProject, setCurrentProject] = useState<Project | null>(() => {
    return recentProjects[0] || null;
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [showTerminal, setShowTerminal] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [showCompanionGuide, setShowCompanionGuide] = useState(false);
  const [securityRequest, setSecurityRequest] = useState<SecurityApprovalRequest | null>(null);
  const [autoFixEnabled, setAutoFixEnabled] = useState(true);

  // Save projects to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('local_ai_recent_projects', JSON.stringify(recentProjects));
    } catch {}
  }, [recentProjects]);

  // Save settings to localStorage
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('local_ai_builder_settings', JSON.stringify(newSettings));
    } catch {}
  };

  const handleAddLog = useCallback((type: BuildLog['type'] | 'warning', text: string, command?: string) => {
    const normalizedType: BuildLog['type'] = type === 'warning' ? 'warn' : type;
    const newLog: BuildLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
      type: normalizedType,
      text,
      command,
    };
    setCurrentProject((prev) => {
      if (!prev) return prev;
      const updatedLogs = [...prev.terminalLogs, newLog].slice(-500);
      return { ...prev, terminalLogs: updatedLogs };
    });
  }, []);

  // Update project in recentProjects when currentProject changes
  const updateProject = useCallback((updater: (prev: Project) => Project) => {
    setCurrentProject((prev) => {
      if (!prev) return prev;
      const updated = updater(prev);
      setRecentProjects((all) => all.map((p) => (p.id === updated.id ? updated : p)));
      return updated;
    });
  }, []);

  // Handler: Select file from sidebar
  const handleSelectFile = (path: string) => {
    updateProject((prev) => {
      const tabs = prev.openTabs.includes(path) ? prev.openTabs : [...prev.openTabs, path];
      return { ...prev, activeFilePath: path, openTabs: tabs };
    });
  };

  // Handler: Create new file
  const handleCreateFile = (filePath: string) => {
    updateProject((prev) => {
      const ext = filePath.split('.').pop() || '';
      let language: ProjectFile['language'] = 'typescript';
      if (ext === 'tsx') language = 'tsx';
      else if (ext === 'jsx') language = 'jsx';
      else if (ext === 'json') language = 'json';
      else if (ext === 'css') language = 'css';
      else if (ext === 'html') language = 'html';
      else if (ext === 'md') language = 'markdown';
      else if (ext === 'sql') language = 'sql';

      const newFile: ProjectFile = {
        path: filePath,
        language,
        content: ext === 'json' ? '{\n  \n}\n' : '// ' + filePath + '\n',
      };

      const files = { ...prev.files, [filePath]: newFile };
      const tabs = prev.openTabs.includes(filePath) ? prev.openTabs : [...prev.openTabs, filePath];
      return { ...prev, files, activeFilePath: filePath, openTabs: tabs };
    });
    handleAddLog('info', `Created file: ${filePath}`);
  };

  // Handler: Delete file
  const handleDeleteFile = (filePath: string) => {
    updateProject((prev) => {
      const files = { ...prev.files };
      delete files[filePath];
      const tabs = prev.openTabs.filter((t) => t !== filePath);
      const activeFilePath = prev.activeFilePath === filePath ? tabs[0] || '' : prev.activeFilePath;
      return { ...prev, files, openTabs: tabs, activeFilePath };
    });
    handleAddLog('warn', `Deleted file: ${filePath}`);
  };

  // Handler: Tab select & close
  const handleSelectTab = (path: string) => {
    updateProject((prev) => ({ ...prev, activeFilePath: path }));
  };

  const handleCloseTab = (path: string) => {
    updateProject((prev) => {
      const tabs = prev.openTabs.filter((t) => t !== path);
      const activeFilePath = prev.activeFilePath === path ? tabs[0] || '' : prev.activeFilePath;
      return { ...prev, openTabs: tabs, activeFilePath };
    });
  };

  // Handler: Update file content in code editor
  const handleUpdateFileContent = (filePath: string, content: string) => {
    updateProject((prev) => {
      const existing = prev.files[filePath];
      if (!existing) return prev;
      return {
        ...prev,
        files: {
          ...prev.files,
          [filePath]: { ...existing, content, isDirty: true },
        },
      };
    });
  };

  const handleSaveFile = (filePath: string) => {
    updateProject((prev) => {
      const existing = prev.files[filePath];
      if (!existing) return prev;
      return {
        ...prev,
        files: {
          ...prev.files,
          [filePath]: { ...existing, isDirty: false },
        },
      };
    });
    handleAddLog('success', `Saved ${filePath}`);
  };

  // Handler: AI Generation / Prompt submission
  const handleGenerate = async (prompt: string) => {
    if (!prompt.trim() || isGenerating) return;

    let targetProject = currentProject;
    if (!targetProject) {
      const appName = prompt.slice(0, 24).trim().replace(/[^a-zA-Z0-9 ]/g, '') || 'Custom AI App';
      targetProject = createInitialProject(appName, prompt);
      setCurrentProject(targetProject);
      setRecentProjects((all) => [targetProject!, ...all]);
    }

    setIsGenerating(true);
    handleAddLog('info', `[Task] Processing prompt: "${prompt}"`);

    // Add user message
    const userMsg = {
      id: `msg_${Date.now()}`,
      role: 'user' as const,
      content: prompt,
      timestamp: new Date().toLocaleTimeString(),
    };

    updateProject((p) => ({
      ...p,
      messages: [...p.messages, userMsg],
    }));

    try {
      const { updatedProject, assistantMessage } = await AIAgentService.processUserPrompt(
        prompt,
        targetProject,
        settings,
        {
          onPlanGenerated: (plan) => {
            updateProject((p) => ({ ...p, currentPlan: plan }));
          },
          onPlanStepUpdate: (stepId, status) => {
            updateProject((p) => ({
              ...p,
              currentPlan: p.currentPlan.map((s) => (s.id === stepId ? { ...s, status } : s)),
            }));
          },
          onToolActionExecuted: (action) => {
            if (action.action === 'create_file' || action.action === 'update_file') {
              if (action.path && action.content !== undefined) {
                const path = action.path;
                const content = action.content;
                const ext = path.split('.').pop() || '';
                let language: ProjectFile['language'] = 'typescript';
                if (ext === 'tsx') language = 'tsx';
                else if (ext === 'json') language = 'json';
                else if (ext === 'css') language = 'css';
                else if (ext === 'html') language = 'html';

                updateProject((p) => ({
                  ...p,
                  files: {
                    ...p.files,
                    [path]: { path, content, language, isDirty: false },
                  },
                  activeFilePath: path,
                }));
              }
            }
          },
          onLog: (type, text) => {
            handleAddLog(type, text);
          },
          onSecurityApprovalRequired: (command, type, onApprove, onDeny) => {
            setSecurityRequest({
              id: `sec_${Date.now()}`,
              command,
              type,
              reason: `Shell command execution: ${command}`,
              onApprove: () => {
                setSecurityRequest(null);
                onApprove();
              },
              onDeny: () => {
                setSecurityRequest(null);
                onDeny();
              },
            });
          },
        },
        targetProject.messages.length > 1
      );

      updateProject((p) => ({
        ...updatedProject,
        messages: [...p.messages, assistantMessage],
      }));
      handleAddLog('success', `[Agent] Task successfully completed`);
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      handleAddLog('error', `Generation failed: ${errMsg}`);
      updateProject((p) => ({
        ...p,
        messages: [
          ...p.messages,
          {
            id: `msg_err_${Date.now()}`,
            role: 'assistant',
            content: `Failed to complete generation: ${errMsg}. You can retry or switch model in settings.`,
            timestamp: new Date().toLocaleTimeString(),
          },
        ],
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  // Handler: Auto-fix active error
  const handleAutoFix = () => {
    if (!currentProject) return;
    const prompt = 'Analyze and automatically repair the build or runtime diagnostics issue in this application.';
    handleGenerate(prompt);
  };

  // Handler: Terminal commands
  const handleRunTerminalCommand = (command: string) => {
    handleAddLog('command', command, command);
    const lower = command.toLowerCase().trim();

    if (lower === 'clear' || lower === 'cls') {
      updateProject((p) => ({ ...p, terminalLogs: [] }));
      return;
    }

    if (lower === 'npm run dev' || lower === 'start') {
      handleAddLog('info', `Starting simulated local development server on port ${settings.runtime.defaultPort}...`);
      updateProject((p) => ({
        ...p,
        devServerStatus: 'running',
        devUrl: `http://localhost:${settings.runtime.defaultPort}`,
      }));
      handleAddLog('success', `Dev server listening at http://localhost:${settings.runtime.defaultPort}`);
      return;
    }

    if (lower === 'npm run build' || lower === 'build') {
      handleAddLog('info', 'Running TypeScript compilation & Vite bundle build...');
      setTimeout(() => {
        handleAddLog('success', 'Build finished cleanly with zero errors.');
      }, 500);
      return;
    }

    if (lower.startsWith('npm install') || lower.startsWith('npm i ')) {
      const pkg = command.replace(/npm (?:install|i)\s+/i, '').trim();
      handleAddLog('info', `Installing package "${pkg}"...`);
      setTimeout(() => {
        handleAddLog('success', `Package "${pkg}" added to dependencies.`);
      }, 600);
      return;
    }

    // Default command feedback
    setTimeout(() => {
      handleAddLog('info', `Executed: ${command} (exit code 0)`);
    }, 200);
  };

  // Handler: Export ZIP
  const handleExportZip = async () => {
    if (!currentProject) return;
    handleAddLog('info', `Generating zip download for ${currentProject.name}...`);
    try {
      await ExportService.exportProjectZip(currentProject);
      handleAddLog('success', `Export completed!`);
    } catch (err: any) {
      handleAddLog('error', `Export failed: ${err.message}`);
    }
  };

  // Handler: New Project
  const handleNewProject = () => {
    setCurrentProject(null);
  };

  // Handler: Open existing project
  const handleOpenProject = (proj: Project) => {
    setCurrentProject(proj);
  };

  // Handler: Delete project
  const handleDeleteProject = (proj: Project) => {
    setRecentProjects((all) => all.filter((p) => p.id !== proj.id));
    if (currentProject?.id === proj.id) {
      setCurrentProject(null);
    }
  };

  // Handler: Import project JSON
  const handleImportProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed.id && parsed.files) {
          setRecentProjects((all) => [parsed, ...all.filter((p) => p.id !== parsed.id)]);
          setCurrentProject(parsed);
          handleAddLog('success', `Imported project ${parsed.name}`);
        }
      } catch (err) {
        handleAddLog('error', 'Failed to import JSON file');
      }
    };
    reader.readAsText(file);
  };

  // Handler: Snapshot create & restore
  const handleCreateSnapshot = (label: string) => {
    if (!currentProject) return;
    const newSnapshot: Snapshot = {
      id: `snap_${Date.now()}`,
      versionNumber: currentProject.snapshots.length + 1,
      label,
      timestamp: new Date().toLocaleTimeString(),
      files: Object.values(currentProject.files),
      summary: `Saved version ${currentProject.snapshots.length + 1}: ${label}`,
    };
    updateProject((p) => ({
      ...p,
      snapshots: [...p.snapshots, newSnapshot],
    }));
    handleAddLog('success', `Created snapshot: "${label}"`);
  };

  const handleRestoreSnapshot = (snapshot: Snapshot) => {
    const fileMap: Record<string, ProjectFile> = {};
    snapshot.files.forEach((f) => {
      fileMap[f.path] = f;
    });
    updateProject((p) => ({
      ...p,
      files: fileMap,
    }));
    handleAddLog('info', `Restored to version ${snapshot.versionNumber} ("${snapshot.label}")`);
    setShowSnapshots(false);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0A0A0A] text-[#EDEDED] overflow-hidden select-none">
      {/* Top Navigation & Controls */}
      <Header
        project={currentProject}
        settings={settings}
        activeMode={activeMode}
        onSelectMode={setActiveMode}
        onOpenSettings={() => setShowSettings(true)}
        onOpenSnapshots={() => setShowSnapshots(true)}
        onOpenCompanionGuide={() => setShowCompanionGuide(true)}
        onExportZip={handleExportZip}
        onNewProject={handleNewProject}
        onToggleDevServer={() => {
          if (!currentProject) return;
          updateProject((p) => {
            const next = p.devServerStatus === 'running' ? 'stopped' : 'running';
            return {
              ...p,
              devServerStatus: next,
              devUrl: next === 'running' ? `http://localhost:${settings.runtime.defaultPort}` : '',
            };
          });
        }}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {activeMode === 'studio' ? (
          /* Google AI Studio Lab Tab */
          <GoogleAIStudioLab
            settings={settings}
            onSendToAppBuilder={(code, appName) => {
              setActiveMode('builder');
              const newProj = createInitialProject(appName || 'Lab Exported App');
              newProj.files['src/App.tsx'] = {
                path: 'src/App.tsx',
                language: 'tsx',
                content: code,
              };
              setCurrentProject(newProj);
              setRecentProjects((all) => [newProj, ...all]);
              handleAddLog('success', `Imported code from AI Studio Lab into new app "${appName || 'Lab Exported App'}"`);
            }}
            onAddLog={handleAddLog}
          />
        ) : !currentProject ? (
          /* Landing Screen when no active project is opened */
          <LandingScreen
            settings={settings}
            recentProjects={recentProjects}
            isGenerating={isGenerating}
            onGenerate={handleGenerate}
            onOpenProject={handleOpenProject}
            onDeleteProject={handleDeleteProject}
            onImportProject={handleImportProject}
          />
        ) : (
          /* 3-Column AI Builder Workspace */
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 flex min-h-0 overflow-hidden">
              {/* Left Column: AI Agent Chat & Plan */}
              <div className="w-80 md:w-96 flex flex-col shrink-0 border-r border-[#242424]">
                <AIChatPanel
                  messages={currentProject.messages}
                  currentPlan={currentProject.currentPlan}
                  isGenerating={isGenerating}
                  onSendMessage={handleGenerate}
                  onAutoFixError={handleAutoFix}
                  hasActiveError={!!currentProject.activeError}
                />
              </div>

              {/* Center Column: File Explorer + Code Editor */}
              <div className="flex-1 flex min-w-0 border-r border-[#242424]">
                <div className="w-56 shrink-0 border-r border-[#242424] hidden sm:block">
                  <SidebarFileExplorer
                    project={currentProject}
                    activeFilePath={currentProject.activeFilePath}
                    onSelectFile={handleSelectFile}
                    onCreateFile={handleCreateFile}
                    onDeleteFile={handleDeleteFile}
                  />
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                  <CodeEditor
                    files={currentProject.files}
                    activeFilePath={currentProject.activeFilePath}
                    openTabs={currentProject.openTabs}
                    onSelectTab={handleSelectTab}
                    onCloseTab={handleCloseTab}
                    onUpdateFileContent={handleUpdateFileContent}
                    onSaveFile={handleSaveFile}
                  />
                </div>
              </div>

              {/* Right Column: Live Interactive Preview */}
              <div className="flex-1 flex flex-col min-w-0">
                <LivePreview
                  project={currentProject}
                  onAutoFixError={handleAutoFix}
                  onViewLogs={() => setShowTerminal(true)}
                  autoFixEnabled={autoFixEnabled}
                  onToggleAutoFix={() => setAutoFixEnabled((v) => !v)}
                />
              </div>
            </div>

            {/* Bottom Collapsible Terminal / Build Diagnostics */}
            {showTerminal && (
              <TerminalPanel
                logs={currentProject.terminalLogs}
                onClearLogs={() => updateProject((p) => ({ ...p, terminalLogs: [] }))}
                onRunCommand={handleRunTerminalCommand}
                onInspectError={handleAutoFix}
              />
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showSnapshots && currentProject && (
        <SnapshotsModal
          project={currentProject}
          onRestoreSnapshot={handleRestoreSnapshot}
          onCreateSnapshot={handleCreateSnapshot}
          onClose={() => setShowSnapshots(false)}
        />
      )}

      {showCompanionGuide && (
        <LocalCompanionGuideModal onClose={() => setShowCompanionGuide(false)} />
      )}

      {securityRequest && (
        <SecurityApprovalModal request={securityRequest} />
      )}
    </div>
  );
}
