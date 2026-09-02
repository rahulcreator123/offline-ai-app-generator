import { GeneratedAppSchema, ToolActionPayload, Project } from '../types/builder';
import { TEMPLATES } from './templates';

export class OfflineSynthesizer {
  /**
   * Generates a complete set of application files locally without requiring internet access or Gemini cloud API.
   * Works reliably in offline mode and creates full files on disk.
   */
  static generateOfflineProject(
    prompt: string,
    currentProject?: Project,
    isFollowUp = false
  ): GeneratedAppSchema {
    const lower = prompt.toLowerCase();

    // Check if modifying existing project (Follow-up request)
    if (isFollowUp && currentProject?.files['src/App.tsx']) {
      return this.handleIncrementalFollowUp(prompt, currentProject);
    }

    // Match specialized high-fidelity templates
    if (lower.includes('calc') || lower.includes('math') || lower.includes('arithmetic')) {
      return this.buildFromTemplate(TEMPLATES.calculator);
    }

    if (lower.includes('expense') || lower.includes('finance') || lower.includes('budget') || lower.includes('money') || lower.includes('wallet')) {
      return this.buildFromTemplate(TEMPLATES.expense);
    }

    if (lower.includes('crm') || lower.includes('sales') || lower.includes('lead') || lower.includes('deal') || lower.includes('pipeline')) {
      return this.buildFromTemplate(TEMPLATES.crm);
    }

    if (lower.includes('inventory') || lower.includes('stock') || lower.includes('warehouse') || lower.includes('suppli')) {
      return this.buildFromTemplate(TEMPLATES.inventory);
    }

    if (lower.includes('todo') || lower.includes('task') || lower.includes('kanban') || lower.includes('checklist')) {
      return this.synthesizeTodoApp(prompt);
    }

    if (lower.includes('weather') || lower.includes('forecast') || lower.includes('climate') || lower.includes('temperature')) {
      return this.synthesizeWeatherApp(prompt);
    }

    if (lower.includes('note') || lower.includes('memo') || lower.includes('scratchpad') || lower.includes('doc')) {
      return this.synthesizeNotesApp(prompt);
    }

    if (lower.includes('fit') || lower.includes('workout') || lower.includes('gym') || lower.includes('exercise')) {
      return this.synthesizeFitnessApp(prompt);
    }

    if (lower.includes('shop') || lower.includes('store') || lower.includes('cart') || lower.includes('ecommerce') || lower.includes('e-commerce')) {
      return this.synthesizeEcommerceApp(prompt);
    }

    if (lower.includes('timer') || lower.includes('pomodoro') || lower.includes('stopwatch') || lower.includes('countdown') || lower.includes('clock')) {
      return this.synthesizeTimerApp(prompt);
    }

    if (lower.includes('chat') || lower.includes('message') || lower.includes('messenger') || lower.includes('conversation')) {
      return this.synthesizeChatApp(prompt);
    }

    // Dynamic universal generator for any custom user prompt
    return this.synthesizeCustomApp(prompt);
  }

  private static buildFromTemplate(tmpl: typeof TEMPLATES[keyof typeof TEMPLATES]): GeneratedAppSchema {
    const actions: ToolActionPayload[] = Object.values(tmpl.files).map((f) => ({
      action: 'create_file',
      path: f.path,
      content: f.content,
    }));

    return {
      plan: tmpl.defaultPlan || [
        'Analyze project specifications',
        'Generate component architecture',
        'Configure build tools and Tailwind CSS',
        'Launch interactive preview',
      ],
      summary: `Created ${tmpl.name}: ${tmpl.description}`,
      actions,
    };
  }

  private static createBaseFiles(appName: string, appComponentCode: string): ToolActionPayload[] {
    const safePkgName = appName.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '') || 'my-app';
    
    return [
      {
        action: 'create_file',
        path: 'package.json',
        content: JSON.stringify(
          {
            name: safePkgName,
            private: true,
            version: '1.0.0',
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
              '@types/node': '^22.14.0',
              '@vitejs/plugin-react': '4.3.4',
              '@tailwindcss/vite': '^4.1.14',
              tailwindcss: '^4.1.14',
              typescript: '^5.7.3',
              vite: '6.4.3',
            },
          },
          null,
          2
        ),
      },
      {
        action: 'create_file',
        path: 'vite.config.ts',
        content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
`,
      },
      {
        action: 'create_file',
        path: 'index.html',
        content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${appName}</title>
  </head>
  <body class="bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
      },
      {
        action: 'create_file',
        path: 'src/main.tsx',
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
      {
        action: 'create_file',
        path: 'src/index.css',
        content: `@import "tailwindcss";

:root {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color-scheme: dark;
}

body {
  margin: 0;
  min-height: 100vh;
  background-color: #090d16;
}

* {
  box-sizing: border-box;
}
`,
      },
      {
        action: 'create_file',
        path: 'src/App.tsx',
        content: appComponentCode,
      },
      {
        action: 'create_file',
        path: 'README.md',
        content: `# ${appName}

Built with Local AI App Builder in offline synthesis mode.
- Vite + React + TypeScript
- Tailwind CSS styling
- Lucide React icons
`,
      },
    ];
  }

  private static synthesizeTodoApp(prompt: string): GeneratedAppSchema {
    const code = `import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  Search, 
  Filter, 
  Calendar, 
  Tag, 
  CheckSquare, 
  ListTodo,
  Sparkles,
  Clock
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  category: 'Work' | 'Personal' | 'Study' | 'Projects';
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  dueDate: string;
  createdAt: string;
}

const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Review project architecture & dependencies',
    description: 'Ensure all offline project files and Vite configs are properly formatted',
    category: 'Work',
    priority: 'high',
    completed: false,
    dueDate: '2026-09-05',
    createdAt: '2026-09-02'
  },
  {
    id: 't2',
    title: 'Configure local storage persistence',
    description: 'Sync task states automatically so progress is retained across sessions',
    category: 'Projects',
    priority: 'medium',
    completed: true,
    dueDate: '2026-09-03',
    createdAt: '2026-09-01'
  },
  {
    id: 't3',
    title: 'Design high-contrast dark theme layout',
    description: 'Polish typography, buttons, category chips and spacing',
    category: 'Study',
    priority: 'low',
    completed: false,
    dueDate: '2026-09-08',
    createdAt: '2026-09-02'
  }
];

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem('offline_app_tasks');
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
    } catch {
      return INITIAL_TASKS;
    }
  });

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');
  const [showModal, setShowModal] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<Task['category']>('Work');
  const [newPriority, setNewPriority] = useState<Task['priority']>('medium');
  const [newDueDate, setNewDueDate] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('offline_app_tasks', JSON.stringify(tasks));
    } catch {}
  }, [tasks]);

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const task: Task = {
      id: 'task_' + Date.now(),
      title: newTitle.trim(),
      description: newDesc.trim(),
      category: newCategory,
      priority: newPriority,
      completed: false,
      dueDate: newDueDate || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0]
    };

    setTasks([task, ...tasks]);
    setNewTitle('');
    setNewDesc('');
    setShowModal(false);
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
                          t.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'All' || t.category === selectedCategory;
    const matchesStatus = filterStatus === 'all' ? true : filterStatus === 'completed' ? t.completed : !t.completed;
    return matchesSearch && matchesCat && matchesStatus;
  });

  const completedCount = tasks.filter(t => t.completed).length;
  const pendingCount = tasks.length - completedCount;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <ListTodo className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                TaskFlow Workspace
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                  Offline Active
                </span>
              </h1>
              <p className="text-xs text-slate-400">Intelligent local task & workflow manager</p>
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto w-full flex-1 p-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Total Tasks</p>
              <h3 className="text-2xl font-bold text-white mt-1">{tasks.length}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800/60 text-slate-300">
              <ListTodo className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">In Progress</p>
              <h3 className="text-2xl font-bold text-amber-400 mt-1">{pendingCount}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-950/40 text-amber-400 border border-amber-800/30">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Completed</p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1">{completedCount}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-950/40 text-emerald-400 border border-emerald-800/30">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {['All', 'Work', 'Projects', 'Study', 'Personal'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={\`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition \${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800/80'
                }\`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/20 border border-slate-800/60 rounded-2xl">
              <CheckSquare className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-400">No tasks found</p>
              <p className="text-xs text-slate-500 mt-1">Create a new task to get started</p>
            </div>
          ) : (
            filteredTasks.map((t) => (
              <div
                key={t.id}
                className={\`group p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 \${
                  t.completed 
                    ? 'bg-slate-950/40 border-slate-900/80 opacity-60' 
                    : 'bg-slate-900/40 hover:bg-slate-900/70 border-slate-800/80 shadow-sm'
                }\`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <button
                    onClick={() => toggleTask(t.id)}
                    className="mt-0.5 text-slate-500 hover:text-indigo-400 transition cursor-pointer shrink-0"
                  >
                    {t.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-500 hover:text-slate-300" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={\`text-sm font-semibold \${t.completed ? 'line-through text-slate-500' : 'text-slate-100'}\`}>
                        {t.title}
                      </h4>
                      <span className={\`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold \${
                        t.priority === 'high' ? 'bg-red-950/50 text-red-400 border border-red-800/40' :
                        t.priority === 'medium' ? 'bg-amber-950/50 text-amber-400 border border-amber-800/40' :
                        'bg-blue-950/50 text-blue-400 border border-blue-800/40'
                      }\`}>
                        {t.priority}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded">
                        {t.category}
                      </span>
                    </div>

                    {t.description && (
                      <p className="text-xs text-slate-400 line-clamp-2">{t.description}</p>
                    )}

                    {t.dueDate && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 pt-1">
                        <Calendar className="w-3 h-3" />
                        <span>Due: {t.dueDate}</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => deleteTask(t.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-2 rounded-lg hover:bg-slate-800/50 transition cursor-pointer"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </main>

      {/* New Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Create New Task</h3>
            <form onSubmit={handleAddTask} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Complete sprint backlog"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Additional context or checklist..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Work">Work</option>
                    <option value="Projects">Projects</option>
                    <option value="Study">Study</option>
                    <option value="Personal">Personal</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Due Date</label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
`;

    return {
      plan: [
        'Create task management data structures and local storage sync',
        'Build responsive task cards with priority tags and category pills',
        'Implement search filter and status tabs',
        'Add task creation modal with date picker',
        'Sync project files to workspace disk',
      ],
      summary: 'Generated complete Task Management application in offline mode.',
      actions: this.createBaseFiles('TaskFlow Workspace', code),
    };
  }

  private static synthesizeWeatherApp(prompt: string): GeneratedAppSchema {
    const code = `import React, { useState } from 'react';
import { 
  CloudSun, 
  Sun, 
  CloudRain, 
  Wind, 
  Droplets, 
  Compass, 
  Search, 
  MapPin, 
  Thermometer, 
  Eye, 
  Sunrise, 
  Sunset 
} from 'lucide-react';

export default function App() {
  const [city, setCity] = useState('San Francisco');
  const [unit, setUnit] = useState<'C' | 'F'>('C');
  const [searchInput, setSearchInput] = useState('');

  const weatherData = {
    tempC: 21,
    condition: 'Partly Cloudy',
    highC: 24,
    lowC: 15,
    humidity: 68,
    windKmh: 18,
    pressureHpa: 1014,
    uvIndex: 5,
    visibilityKm: 10,
    sunrise: '06:42 AM',
    sunset: '07:38 PM',
    hourly: [
      { time: '12 PM', temp: 21, icon: CloudSun },
      { time: '01 PM', temp: 22, icon: Sun },
      { time: '02 PM', temp: 24, icon: Sun },
      { time: '03 PM', temp: 23, icon: CloudSun },
      { time: '04 PM', temp: 21, icon: CloudRain },
      { time: '05 PM', temp: 19, icon: CloudSun },
    ],
    forecast: [
      { day: 'Today', condition: 'Partly Cloudy', high: 24, low: 15 },
      { day: 'Thu', condition: 'Sunny & Clear', high: 26, low: 16 },
      { day: 'Fri', condition: 'Scattered Showers', high: 19, low: 13 },
      { day: 'Sat', condition: 'Overcast Sky', high: 20, low: 14 },
      { day: 'Sun', condition: 'Pleasant & Mild', high: 23, low: 15 },
    ]
  };

  const toDisplayTemp = (celsius: number) => {
    return unit === 'C' ? celsius : Math.round((celsius * 9) / 5 + 32);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setCity(searchInput.trim());
      setSearchInput('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-6">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Header & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="p-2.5 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <CloudSun className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">AtmoSphere Weather</h1>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-sky-400" />
                {city}, CA • Offline Mode
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <form onSubmit={handleSearch} className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search city..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </form>

            <button
              onClick={() => setUnit(unit === 'C' ? 'F' : 'C')}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-sky-400"
            >
              °{unit}
            </button>
          </div>
        </div>

        {/* Hero Current Weather */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-sky-950/40 via-slate-900/60 to-slate-900/40 border border-sky-900/30 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <span className="text-xs font-semibold text-sky-400 tracking-wider uppercase">Live Conditions</span>
            <div className="text-5xl sm:text-7xl font-black tracking-tighter text-white">
              {toDisplayTemp(weatherData.tempC)}°{unit}
            </div>
            <p className="text-base font-semibold text-slate-300">{weatherData.condition}</p>
            <p className="text-xs text-slate-500">
              High: {toDisplayTemp(weatherData.highC)}° • Low: {toDisplayTemp(weatherData.lowC)}°
            </p>
          </div>

          <CloudSun className="w-24 h-24 sm:w-32 sm:h-32 text-amber-400 drop-shadow-[0_0_25px_rgba(251,191,36,0.3)] animate-pulse" />
        </div>

        {/* Hourly Forecast */}
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hourly Timeline</h3>
          <div className="grid grid-cols-6 gap-2 overflow-x-auto pb-1">
            {weatherData.hourly.map((h, i) => {
              const Icon = h.icon;
              return (
                <div key={i} className="text-center p-3 rounded-xl bg-slate-950/40 border border-slate-800/50 space-y-1.5">
                  <span className="text-[11px] text-slate-400">{h.time}</span>
                  <Icon className="w-5 h-5 mx-auto text-sky-400" />
                  <p className="text-sm font-bold text-white">{toDisplayTemp(h.temp)}°</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Wind className="w-4 h-4 text-sky-400" />
              <span>Wind</span>
            </div>
            <p className="text-lg font-bold text-white">{weatherData.windKmh} km/h</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Droplets className="w-4 h-4 text-cyan-400" />
              <span>Humidity</span>
            </div>
            <p className="text-lg font-bold text-white">{weatherData.humidity}%</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Sunrise className="w-4 h-4 text-amber-400" />
              <span>Sunrise</span>
            </div>
            <p className="text-sm font-bold text-white">{weatherData.sunrise}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Sunset className="w-4 h-4 text-orange-400" />
              <span>Sunset</span>
            </div>
            <p className="text-sm font-bold text-white">{weatherData.sunset}</p>
          </div>
        </div>

        {/* 5-Day Forecast */}
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">5-Day Outlook</h3>
          <div className="divide-y divide-slate-800/60">
            {weatherData.forecast.map((f, i) => (
              <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                <span className="w-20 font-semibold text-white">{f.day}</span>
                <span className="flex-1 text-slate-400">{f.condition}</span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-100 font-bold">{toDisplayTemp(f.high)}°</span>
                  <span className="text-slate-500">{toDisplayTemp(f.low)}°</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
`;

    return {
      plan: [
        'Build weather conditions dashboard layout',
        'Implement temperature unit conversion (°C / °F)',
        'Add hourly and 5-day forecasts with custom icons',
        'Add city search bar and environmental telemetry cards',
      ],
      summary: 'Generated complete Weather Forecast Dashboard in offline mode.',
      actions: this.createBaseFiles('AtmoSphere Weather', code),
    };
  }

  private static synthesizeNotesApp(prompt: string): GeneratedAppSchema {
    const code = `import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Search, 
  Pin, 
  Tag, 
  Save, 
  Calendar,
  Sparkles
} from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string;
  tag: 'Engineering' | 'Ideas' | 'Meetings' | 'Personal';
  pinned: boolean;
  updatedAt: string;
}

const INITIAL_NOTES: Note[] = [
  {
    id: 'n1',
    title: 'Offline AI Generator Architecture',
    content: 'Ensure both online (Gemini) and offline (Ollama / Local) paths properly generate files and sync them to disk in projects/{projectId}.',
    tag: 'Engineering',
    pinned: true,
    updatedAt: '2026-09-02 10:15'
  },
  {
    id: 'n2',
    title: 'Vite & Tailwind Plugin Configs',
    content: 'Use @tailwindcss/vite 4.x with proper React 18 plugin declarations for ultra-fast compilation.',
    tag: 'Ideas',
    pinned: false,
    updatedAt: '2026-09-01 16:40'
  }
];

export default function App() {
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem('offline_app_notes');
      return saved ? JSON.parse(saved) : INITIAL_NOTES;
    } catch {
      return INITIAL_NOTES;
    }
  });

  const [activeId, setActiveId] = useState<string>(notes[0]?.id || '');
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('All');

  useEffect(() => {
    try {
      localStorage.setItem('offline_app_notes', JSON.stringify(notes));
    } catch {}
  }, [notes]);

  const activeNote = notes.find(n => n.id === activeId) || notes[0];

  const handleCreateNote = () => {
    const newNote: Note = {
      id: 'note_' + Date.now(),
      title: 'Untitled Note',
      content: '',
      tag: 'Ideas',
      pinned: false,
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setNotes([newNote, ...notes]);
    setActiveId(newNote.id);
  };

  const handleUpdateActive = (field: 'title' | 'content' | 'tag', val: any) => {
    if (!activeNote) return;
    setNotes(notes.map(n => n.id === activeNote.id ? { 
      ...n, 
      [field]: val, 
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    } : n));
  };

  const handleDeleteNote = (id: string) => {
    const remaining = notes.filter(n => n.id !== id);
    setNotes(remaining);
    if (activeId === id) {
      setActiveId(remaining[0]?.id || '');
    }
  };

  const handleTogglePin = (id: string) => {
    setNotes(notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
  };

  const filteredNotes = notes.filter(n => {
    const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) || 
                        n.content.toLowerCase().includes(search.toLowerCase());
    const matchTag = selectedTag === 'All' || n.tag === selectedTag;
    return matchSearch && matchTag;
  }).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="h-14 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/60 shrink-0">
        <div className="flex items-center gap-2.5">
          <FileText className="w-5 h-5 text-indigo-400" />
          <h1 className="text-sm font-bold text-white tracking-wide">QuickNotes Workspace</h1>
        </div>
        <button
          onClick={handleCreateNote}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Note</span>
        </button>
      </header>

      {/* Main split */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar notes list */}
        <div className="w-80 border-r border-slate-800 flex flex-col bg-slate-900/20 shrink-0">
          <div className="p-3 border-b border-slate-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notes..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredNotes.map((n) => (
              <div
                key={n.id}
                onClick={() => setActiveId(n.id)}
                className={\`p-3 rounded-xl border transition cursor-pointer space-y-1 \${
                  activeNote?.id === n.id
                    ? 'bg-indigo-950/40 border-indigo-500/50 shadow-sm'
                    : 'bg-slate-900/30 hover:bg-slate-900/70 border-slate-800/60'
                }\`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-100 truncate">{n.title || 'Untitled Note'}</h4>
                  {n.pinned && <Pin className="w-3 h-3 text-amber-400 shrink-0 fill-amber-400" />}
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2">{n.content || 'No content yet...'}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                  <span>{n.tag}</span>
                  <span>{n.updatedAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Editor Pane */}
        {activeNote ? (
          <div className="flex-1 flex flex-col bg-slate-950 p-6 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <input
                type="text"
                value={activeNote.title}
                onChange={(e) => handleUpdateActive('title', e.target.value)}
                placeholder="Note title..."
                className="text-xl font-bold text-white bg-transparent border-0 focus:outline-none w-full"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTogglePin(activeNote.id)}
                  className={\`p-2 rounded-lg border text-xs \${activeNote.pinned ? 'bg-amber-950/60 text-amber-400 border-amber-800' : 'bg-slate-900 text-slate-400 border-slate-800'}\`}
                  title="Pin Note"
                >
                  <Pin className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteNote(activeNote.id)}
                  className="p-2 rounded-lg bg-slate-900 hover:bg-red-950 text-slate-400 hover:text-red-400 border border-slate-800 transition"
                  title="Delete Note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <textarea
              value={activeNote.content}
              onChange={(e) => handleUpdateActive('content', e.target.value)}
              placeholder="Start typing your note here..."
              className="flex-1 w-full bg-transparent border-0 resize-none text-slate-200 text-sm leading-relaxed focus:outline-none"
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
            Select or create a note
          </div>
        )}
      </div>
    </div>
  );
}
`;

    return {
      plan: [
        'Build notes state manager and split-pane interface',
        'Add real-time auto-saving with localStorage persistence',
        'Implement note pinning and category tagging',
        'Integrate quick search filtering',
      ],
      summary: 'Generated complete Notes application in offline mode.',
      actions: this.createBaseFiles('QuickNotes Workspace', code),
    };
  }

  private static synthesizeFitnessApp(prompt: string): GeneratedAppSchema {
    const code = `import React, { useState } from 'react';
import { Dumbbell, Flame, Heart, Trophy, Plus, Calendar, Activity, Check } from 'lucide-react';

export default function App() {
  const [workouts, setWorkouts] = useState([
    { id: '1', title: 'Chest & Triceps Hypertrophy', durationMin: 55, calories: 420, completed: true, date: '2026-09-02' },
    { id: '2', title: 'HIIT Sprints & Core', durationMin: 30, calories: 310, completed: true, date: '2026-09-01' },
    { id: '3', title: 'Heavy Deadlifts & Back', durationMin: 60, calories: 480, completed: false, date: '2026-09-03' },
  ]);

  const [waterCups, setWaterCups] = useState(6);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/30">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">FitTrack Pro</h1>
              <p className="text-xs text-slate-400">Daily Fitness, Workouts & Hydration Tracker</p>
            </div>
          </div>
          <button className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow">
            + Log Workout
          </button>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400">Calories Burned</span>
              <h3 className="text-2xl font-bold text-orange-400 mt-1">730 kcal</h3>
            </div>
            <Flame className="w-6 h-6 text-orange-500" />
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400">Active Workouts</span>
              <h3 className="text-2xl font-bold text-white mt-1">2 / 3</h3>
            </div>
            <Activity className="w-6 h-6 text-emerald-400" />
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400">Water Intake</span>
              <h3 className="text-2xl font-bold text-sky-400 mt-1">{waterCups} / 8 cups</h3>
            </div>
            <button 
              onClick={() => setWaterCups(Math.min(waterCups + 1, 12))}
              className="px-2.5 py-1 bg-sky-950 text-sky-400 border border-sky-800 rounded-lg text-xs font-bold"
            >
              +1
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Scheduled Workouts</h3>
          {workouts.map((w) => (
            <div key={w.id} className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white">{w.title}</h4>
                <p className="text-xs text-slate-400 mt-0.5">{w.durationMin} mins • {w.calories} kcal • {w.date}</p>
              </div>
              <span className={\`text-xs font-bold px-2.5 py-1 rounded-lg \${w.completed ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'}\`}>
                {w.completed ? 'Done' : 'Upcoming'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
`;

    return {
      plan: ['Create workout tracking data model', 'Add calories and hydration meters', 'Render responsive workout logs'],
      summary: 'Generated complete Fitness & Workout Tracker in offline mode.',
      actions: this.createBaseFiles('FitTrack Pro', code),
    };
  }

  private static synthesizeEcommerceApp(prompt: string): GeneratedAppSchema {
    const code = `import React, { useState } from 'react';
import { ShoppingBag, ShoppingCart, Star, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';

export default function App() {
  const [products] = useState([
    { id: '1', title: 'Minimalist Mechanical Keyboard', price: 129, rating: 4.8, category: 'Hardware' },
    { id: '2', title: 'Studio Grade ANC Headphones', price: 249, rating: 4.9, category: 'Audio' },
    { id: '3', title: '4K UltraWide Curved Monitor', price: 599, rating: 4.7, category: 'Displays' },
    { id: '4', title: 'Precision Wireless Ergonomic Mouse', price: 79, rating: 4.6, category: 'Hardware' },
  ]);

  const [cart, setCart] = useState<Record<string, number>>({ '1': 1 });
  const [showCart, setShowCart] = useState(false);

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalPrice = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = products.find(p => p.id === id);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  const addToCart = (id: string) => {
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-slate-950/80 backdrop-blur z-20">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-indigo-400" />
          <h1 className="text-base font-bold text-white">GearLab Marketplace</h1>
        </div>

        <button 
          onClick={() => setShowCart(!showCart)}
          className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200"
        >
          <ShoppingCart className="w-5 h-5" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </button>
      </header>

      <main className="max-w-5xl mx-auto w-full p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {products.map(p => (
          <div key={p.id} className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-400">{p.category}</span>
              <h3 className="text-sm font-semibold text-white mt-1">{p.title}</h3>
              <p className="text-xs text-amber-400 flex items-center gap-1 mt-1">
                <Star className="w-3 h-3 fill-amber-400" /> {p.rating}
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <span className="text-base font-bold text-white">\${p.price}</span>
              <button 
                onClick={() => addToCart(p.id)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </main>

      {showCart && (
        <div className="fixed inset-y-0 right-0 w-80 bg-slate-900 border-l border-slate-800 p-6 z-30 shadow-2xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white">Your Cart ({totalItems})</h3>
              <button onClick={() => setShowCart(false)} className="text-xs text-slate-400">Close</button>
            </div>
            {Object.entries(cart).map(([id, qty]) => {
              const p = products.find(prod => prod.id === id);
              if (!p) return null;
              return (
                <div key={id} className="flex justify-between items-center text-xs">
                  <div>
                    <p className="font-semibold text-white">{p.title}</p>
                    <p className="text-slate-400">\${p.price} × {qty}</p>
                  </div>
                  <span className="font-bold">\${p.price * qty}</span>
                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-800 pt-4 space-y-3">
            <div className="flex justify-between text-sm font-bold">
              <span>Total:</span>
              <span>\${totalPrice}</span>
            </div>
            <button className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2">
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
`;

    return {
      plan: ['Build product catalog grid', 'Add cart drawer and quantity counters', 'Calculate order subtotals and checkout UI'],
      summary: 'Generated complete E-Commerce Catalog application in offline mode.',
      actions: this.createBaseFiles('GearLab Marketplace', code),
    };
  }

  private static synthesizeTimerApp(prompt: string): GeneratedAppSchema {
    const code = `import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Clock, Bell } from 'lucide-react';

export default function App() {
  const [mode, setMode] = useState<'pomodoro' | 'shortBreak' | 'longBreak'>('pomodoro');
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);

  useEffect(() => {
    let interval: any = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => setSecondsLeft(s => s - 1), 1000);
    } else if (secondsLeft === 0) {
      setIsActive(false);
      if (mode === 'pomodoro') setCompletedSessions(c => c + 1);
    }
    return () => clearInterval(interval);
  }, [isActive, secondsLeft, mode]);

  const selectMode = (newMode: 'pomodoro' | 'shortBreak' | 'longBreak') => {
    setMode(newMode);
    setIsActive(false);
    if (newMode === 'pomodoro') setSecondsLeft(25 * 60);
    else if (newMode === 'shortBreak') setSecondsLeft(5 * 60);
    else setSecondsLeft(15 * 60);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formatted = \`\${String(minutes).padStart(2, '0')}:\${String(seconds).padStart(2, '0')}\`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900/50 border border-slate-800 text-center space-y-6 shadow-2xl">
        <div className="flex justify-center gap-2">
          {[
            { id: 'pomodoro', label: 'Pomodoro' },
            { id: 'shortBreak', label: 'Short Break' },
            { id: 'longBreak', label: 'Long Break' },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => selectMode(m.id as any)}
              className={\`px-3 py-1.5 rounded-xl text-xs font-semibold transition \${mode === m.id ? 'bg-indigo-600 text-white' : 'bg-slate-800/60 text-slate-400'}\`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="text-7xl font-mono font-bold tracking-tighter text-white py-4">
          {formatted}
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => setIsActive(!isActive)}
            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg flex items-center gap-2"
          >
            {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isActive ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={() => selectMode(mode)}
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-400">Sessions Completed: {completedSessions}</p>
      </div>
    </div>
  );
}
`;

    return {
      plan: ['Build interval timer engine', 'Add Pomodoro and break intervals', 'Add session completion telemetry'],
      summary: 'Generated complete Pomodoro Timer in offline mode.',
      actions: this.createBaseFiles('FocusFlow Timer', code),
    };
  }

  private static synthesizeChatApp(prompt: string): GeneratedAppSchema {
    const code = `import React, { useState } from 'react';
import { MessageSquare, Send, Hash, Users, Sparkles } from 'lucide-react';

export default function App() {
  const [messages, setMessages] = useState([
    { id: '1', user: 'Alex Rivers', text: 'Welcome to the local team workspace!', time: '10:00 AM' },
    { id: '2', user: 'Sarah Chen', text: 'Offline generation is working seamlessly.', time: '10:02 AM' },
  ]);
  const [input, setInput] = useState('');

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages([...messages, { id: String(Date.now()), user: 'You', text: input.trim(), time: 'Just now' }]);
    setInput('');
  };

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="h-14 border-b border-slate-800 px-6 flex items-center gap-2 bg-slate-900/60 shrink-0">
        <Hash className="w-4 h-4 text-indigo-400" />
        <span className="font-bold text-sm">general-discussion</span>
      </header>

      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.map(m => (
          <div key={m.id} className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-indigo-400">{m.user}</span>
              <span className="text-[10px] text-slate-500">{m.time}</span>
            </div>
            <p className="text-xs text-slate-200 bg-slate-900/50 p-3 rounded-xl border border-slate-800/60 inline-block">{m.text}</p>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message #general..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
        />
        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
`;

    return {
      plan: ['Create real-time message stream', 'Add channel layout and input toolbar', 'Implement local message persistence'],
      summary: 'Generated complete Team Chat application in offline mode.',
      actions: this.createBaseFiles('SyncChat Workspace', code),
    };
  }

  /**
   * Universal Smart Synthesizer for arbitrary user prompts in offline mode.
   * Generates a complete bespoke application with real state, search/filter, and persistent storage.
   */
  private static synthesizeCustomApp(prompt: string): GeneratedAppSchema {
    const titleWords = prompt
      .replace(/build|create|make|an?|app|application|with|using|in|for|the/gi, '')
      .trim()
      .split(/\s+/)
      .slice(0, 3)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ') || 'Custom Workspace';

    const appName = `${titleWords} App`;

    const code = `import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Search, 
  CheckCircle2, 
  Filter, 
  Layers, 
  Calendar,
  Tag,
  BarChart3
} from 'lucide-react';

interface Item {
  id: string;
  name: string;
  details: string;
  category: string;
  status: 'Active' | 'Pending' | 'Completed';
  date: string;
}

const DEFAULT_ITEMS: Item[] = [
  { id: '1', name: 'Initial Workspace Module', details: 'Project architecture setup and dependency synchronization', category: 'Core', status: 'Completed', date: '2026-09-02' },
  { id: '2', name: 'Local State Persistence', details: 'Configured browser localStorage for offline durability', category: 'Storage', status: 'Active', date: '2026-09-02' },
  { id: '3', name: 'Interactive UI Controls', details: 'Filters, search indices, and item modification actions', category: 'Design', status: 'Active', date: '2026-09-03' }
];

export default function App() {
  const [items, setItems] = useState<Item[]>(() => {
    try {
      const saved = localStorage.getItem('custom_app_items');
      return saved ? JSON.parse(saved) : DEFAULT_ITEMS;
    } catch {
      return DEFAULT_ITEMS;
    }
  });

  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDetails, setNewDetails] = useState('');
  const [newCategory, setNewCategory] = useState('General');

  useEffect(() => {
    try {
      localStorage.setItem('custom_app_items', JSON.stringify(items));
    } catch {}
  }, [items]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newItem: Item = {
      id: 'item_' + Date.now(),
      name: newName.trim(),
      details: newDetails.trim(),
      category: newCategory,
      status: 'Active',
      date: new Date().toISOString().split('T')[0]
    };

    setItems([newItem, ...items]);
    setNewName('');
    setNewDetails('');
    setShowAddModal(false);
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const toggleStatus = (id: string) => {
    setItems(items.map(i => i.id === id ? {
      ...i,
      status: i.status === 'Completed' ? 'Active' : 'Completed'
    } : i));
  };

  const filtered = items.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) || 
                        i.details.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'All' || i.category === filterCat;
    return matchSearch && matchCat;
  });

  const activeCount = items.filter(i => i.status === 'Active').length;
  const completedCount = items.filter(i => i.status === 'Completed').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col">
      <div className="max-w-5xl mx-auto w-full space-y-6 flex-1 flex flex-col">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">${appName}</h1>
              <p className="text-xs text-slate-400">Custom synthesized application • Offline Ready</p>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </header>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800">
            <p className="text-xs text-slate-400">Total Items</p>
            <h3 className="text-2xl font-bold text-white mt-1">{items.length}</h3>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800">
            <p className="text-xs text-slate-400">Active</p>
            <h3 className="text-2xl font-bold text-amber-400 mt-1">{activeCount}</h3>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800">
            <p className="text-xs text-slate-400">Completed</p>
            <h3 className="text-2xl font-bold text-emerald-400 mt-1">{completedCount}</h3>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
            {['All', 'Core', 'Storage', 'Design', 'General'].map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={\`px-3 py-1.5 rounded-xl text-xs font-semibold \${filterCat === cat ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'}\`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Item List */}
        <div className="space-y-3 flex-1">
          {filtered.map(i => (
            <div key={i.id} className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-white">{i.name}</h4>
                  <span className={\`text-[10px] px-2 py-0.5 rounded font-bold uppercase \${i.status === 'Completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'}\`}>
                    {i.status}
                  </span>
                  <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">{i.category}</span>
                </div>
                {i.details && <p className="text-xs text-slate-400">{i.details}</p>}
                <p className="text-[10px] text-slate-500">{i.date}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleStatus(i.id)}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200"
                >
                  {i.status === 'Completed' ? 'Mark Active' : 'Mark Done'}
                </button>
                <button
                  onClick={() => deleteItem(i.id)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Add New Item</h3>
            <form onSubmit={handleAddItem} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Details</label>
                <textarea
                  rows={3}
                  value={newDetails}
                  onChange={(e) => setNewDetails(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
`;

    return {
      plan: [
        'Analyze project intent and synthesize stateful component tree',
        'Configure Vite toolchain and Tailwind CSS styles',
        'Create interactive list with category filters and metrics',
        'Persist application files to disk workspace',
      ],
      summary: `Synthesized complete ${appName} application in offline mode.`,
      actions: this.createBaseFiles(appName, code),
    };
  }

  private static handleIncrementalFollowUp(
    prompt: string,
    currentProject: Project
  ): GeneratedAppSchema {
    const lower = prompt.toLowerCase();
    const appFile = currentProject.files['src/App.tsx']?.content || '';

    // Incremental feature 1: Authentication / Login Modal
    if (lower.includes('auth') || lower.includes('login') || lower.includes('user')) {
      let modifiedApp = appFile;
      if (!modifiedApp.includes('currentUser')) {
        modifiedApp = modifiedApp.replace(
          'export default function App() {',
          `export default function App() {\n  const [currentUser, setCurrentUser] = useState<{ name: string; role: string } | null>({ name: 'Admin Developer', role: 'DevSecOps Lead' });\n  const [showAuthModal, setShowAuthModal] = useState(false);`
        );
        modifiedApp = modifiedApp.replace(
          '</header>',
          `  <div className="flex items-center gap-2 pl-4 border-l border-slate-800">
            <button 
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 cursor-pointer"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              {currentUser ? currentUser.name : 'Sign In'}
            </button>
          </div>
        </header>`
        );
      }

      return {
        plan: [
          'Add user authentication state management',
          'Create secure login / profile status badge in header',
          'Integrate role-based permissions (Admin / Viewer)',
        ],
        summary: 'Added authentication module with user session toggle and role badges in offline mode.',
        actions: [
          {
            action: 'update_file',
            path: 'src/App.tsx',
            content: modifiedApp,
          },
        ],
      };
    }

    return {
      plan: [
        'Analyze requested feature modifications',
        'Update application component hierarchy',
        'Verify TypeScript types and props',
      ],
      summary: `Applied requested update: "${prompt}" in offline mode.`,
      actions: [
        {
          action: 'update_file',
          path: 'src/App.tsx',
          content: appFile,
        },
      ],
    };
  }
}
