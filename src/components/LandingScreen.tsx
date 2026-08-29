import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  FolderOpen, 
  Upload, 
  Layers, 
  Clock, 
  Cpu, 
  ShieldCheck, 
  Zap, 
  Terminal,
  ChevronRight,
  Trash2
} from 'lucide-react';
import { Project, AppSettings } from '../types/builder';

interface LandingScreenProps {
  settings: AppSettings;
  recentProjects: Project[];
  isGenerating: boolean;
  onGenerate: (prompt: string) => void;
  onOpenProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
  onImportProject: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({
  settings,
  recentProjects,
  isGenerating,
  onGenerate,
  onOpenProject,
  onDeleteProject,
  onImportProject,
}) => {
  const [prompt, setPrompt] = useState('');

  const EXAMPLE_PROMPTS = [
    'Build an inventory management system with login, products, stock tracking, dashboard charts, search, and SQLite database.',
    'Build a personal finance tracker with income/expenses, category breakdown, monthly statistics, and local database.',
    'Build a CRM with lead pipeline, deal stage tracking, customer contact list, revenue forecasts, and local database.',
    'Build a task management application with Kanban boards, sprint velocity, priority tags, and dark mode.',
    'Build a restaurant ordering application with menu catalog, cart drawer, live order tracking, and table booking.',
    'Build a student management system with GPA gradebook, course enrollments, attendance logger, and performance stats.',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;
    onGenerate(prompt.trim());
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0F0F0F] text-[#EDEDED] flex flex-col items-center justify-start p-6 md:p-12 relative">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-[#FFD700]/5 blur-[140px] pointer-events-none rounded-full" />

      <div className="w-full max-w-3xl z-10 space-y-8 my-auto">
        {/* Header Hero Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A1A1A] border border-[#333333] text-[#FFD700] text-xs font-mono font-bold tracking-wider uppercase mb-2">
            <Cpu className="w-3.5 h-3.5 text-[#FFD700]" />
            <span>NVIDIA RTX 5050 8GB GPU • LOCAL & CLOUD AI</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white uppercase">
            BUILD ANYTHING WITH AI
          </h1>
          <p className="text-base sm:text-lg text-neutral-400 max-w-xl mx-auto font-medium">
            Describe your application and let the AI agent construct the architecture, code, and live preview.
          </p>
        </div>

        {/* Large Prompt Input Form */}
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative bg-[#161616] border-2 border-[#2A2A2A] focus-within:border-[#FFD700] rounded-2xl p-3 shadow-2xl transition-all">
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the application you want to build (e.g., Inventory CRM with SQLite and stock analytics)..."
              disabled={isGenerating}
              className="w-full bg-transparent border-0 resize-none px-4 py-3 text-white placeholder-neutral-500 focus:outline-none text-base sm:text-lg font-medium leading-relaxed"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleSubmit(e);
                }
              }}
            />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 px-3 border-t border-[#262626]">
              <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
                <span className="bg-[#242424] text-[#FFD700] font-bold px-2 py-0.5 rounded border border-[#333333]">Ctrl + Enter</span>
                <span className="uppercase tracking-wider text-[11px]">to generate</span>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#222222] hover:bg-[#2A2A2A] text-neutral-200 text-xs font-bold uppercase tracking-wider border border-[#333333] transition cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-neutral-300" />
                  <span>Import Project</span>
                  <input type="file" accept=".zip,.json" onChange={onImportProject} className="hidden" />
                </label>

                <button
                  type="submit"
                  disabled={!prompt.trim() || isGenerating}
                  className="flex items-center gap-2 bg-[#FFD700] hover:bg-[#FFE033] disabled:opacity-40 disabled:hover:bg-[#FFD700] text-black text-sm font-extrabold uppercase tracking-wider px-6 py-2.5 rounded-xl shadow-lg shadow-[#FFD700]/10 transition cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      <span>Generating Project...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-black stroke-[2.5]" />
                      <span>Create App</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Example Prompt Chips */}
        <div className="space-y-2.5">
          <div className="text-xs font-extrabold text-neutral-400 uppercase tracking-widest px-1">
            Example Prompts:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {EXAMPLE_PROMPTS.map((ex, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPrompt(ex)}
                className="text-left p-3.5 rounded-xl bg-[#161616] hover:bg-[#1E1E1E] border border-[#2A2A2A] hover:border-[#FFD700]/50 text-xs text-neutral-300 transition group cursor-pointer flex items-start gap-2.5"
              >
                <ChevronRight className="w-4 h-4 text-[#FFD700] mt-0.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                <span className="line-clamp-2 font-medium">{ex}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Projects Section */}
        {recentProjects.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-[#222222]">
            <div className="flex items-center justify-between px-1">
              <div className="text-xs font-extrabold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#FFD700]" />
                <span>Recent Local Projects</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {recentProjects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onOpenProject(p)}
                  className="p-4 rounded-xl bg-[#161616] border border-[#2A2A2A] hover:border-[#FFD700] hover:bg-[#1C1C1C] transition cursor-pointer group space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-extrabold text-sm text-white group-hover:text-[#FFD700] transition truncate uppercase tracking-wide">
                      {p.name}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        aria-label={`Delete ${p.name}`}
                        title="Delete project"
                        onClick={(e) => { e.stopPropagation(); onDeleteProject(p); }}
                        className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-400/10 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ArrowRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-[#FFD700] group-hover:translate-x-0.5 transition" />
                    </div>
                  </div>
                  <p className="text-xs text-neutral-400 line-clamp-1">{p.description || 'Full-stack application'}</p>
                  <div className="text-[10px] text-neutral-500 font-mono pt-1 font-semibold">
                    {Object.keys(p.files).length} files • {p.messages.length} revisions
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
