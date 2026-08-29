import React from 'react';
import { 
  Terminal, 
  Cpu, 
  Settings, 
  Download, 
  History, 
  Play, 
  Square, 
  Sparkles, 
  Layers, 
  Radio,
  FolderOpen,
  HelpCircle
} from 'lucide-react';
import { Project, AppSettings } from '../types/builder';

interface HeaderProps {
  project: Project | null;
  settings: AppSettings;
  activeMode: 'builder' | 'studio';
  onSelectMode: (mode: 'builder' | 'studio') => void;
  onOpenSettings: () => void;
  onOpenSnapshots: () => void;
  onOpenCompanionGuide: () => void;
  onExportZip: () => void;
  onNewProject: () => void;
  onToggleDevServer: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  settings,
  activeMode,
  onSelectMode,
  onOpenSettings,
  onOpenSnapshots,
  onOpenCompanionGuide,
  onExportZip,
  onNewProject,
  onToggleDevServer,
}) => {
  return (
    <header className="h-14 bg-[#121212] border-b border-[#242424] px-4 flex items-center justify-between select-none shrink-0 z-30">
      {/* Left: Branding & Mode Switcher */}
      <div className="flex items-center gap-3">
        <div 
          onClick={onNewProject}
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-95 transition group"
        >
          <div className="w-8 h-8 rounded-lg bg-[#FFD700] flex items-center justify-center text-black font-black shadow-md shadow-[#FFD700]/10">
            <Cpu className="w-4 h-4 text-black" />
          </div>
          <div>
            <div className="text-sm font-extrabold text-white tracking-wider uppercase flex items-center gap-2">
              Local AI Studio
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#1C1C1C] text-[#FFD700] border border-[#333333] font-bold">
                Offline
              </span>
            </div>
          </div>
        </div>

        {/* Workspace Mode Switcher */}
        <div className="flex items-center gap-1 bg-[#0A0A0A] p-1 rounded-xl border border-[#262626] ml-2">
          <button
            onClick={() => onSelectMode('builder')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wider transition cursor-pointer ${
              activeMode === 'builder'
                ? 'bg-[#FFD700] text-black shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>App Builder</span>
          </button>
          <button
            onClick={() => onSelectMode('studio')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wider transition cursor-pointer ${
              activeMode === 'studio'
                ? 'bg-[#FFD700] text-black shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Studio Lab</span>
          </button>
        </div>

        {project && activeMode === 'builder' && (
          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-[#242424] ml-1">
            <span className="text-xs text-neutral-400 font-semibold tracking-wider uppercase text-[11px]">Project:</span>
            <div className="px-2.5 py-1 bg-[#0A0A0A] border border-[#2A2A2A] rounded-md text-xs font-mono font-bold text-[#FFD700] flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-[#FFD700]" />
              {project.name}
            </div>
          </div>
        )}
      </div>

      {/* Middle: Hardware & Provider Chip */}
      <div className="hidden lg:flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1 bg-[#181818] border border-[#2A2A2A] rounded-lg text-xs">
          <div className="flex items-center gap-1.5 text-neutral-200">
            <Cpu className="w-3.5 h-3.5 text-[#FFD700]" />
            <span className="font-bold text-neutral-100 uppercase tracking-wide text-[11px]">{settings.rtx5050.gpuName}</span>
            <span className="text-[10px] text-neutral-400 font-mono">({settings.rtx5050.vramTotalMB / 1024}GB VRAM)</span>
          </div>
          <span className="text-neutral-600">|</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FFD700] animate-pulse"></span>
            <span className="uppercase font-mono text-[#FFD700] text-[11px] font-bold tracking-wider">
              {settings.ai.provider === 'ollama' ? `Ollama (${settings.ai.ollamaModel})` : settings.ai.provider === 'gemini' ? 'Gemini 3.7 Flash' : 'Demo Engine'}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {project && (
          <>
            {/* Dev Server Indicator */}
            <button
              onClick={onToggleDevServer}
              title={project.devServerStatus === 'running' ? 'Stop Local Dev Server' : 'Start Local Dev Server'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition cursor-pointer ${
                project.devServerStatus === 'running'
                  ? 'bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/40 hover:bg-[#FFD700]/20'
                  : 'bg-[#1C1C1C] text-neutral-300 border-[#2E2E2E] hover:bg-[#282828]'
              }`}
            >
              {project.devServerStatus === 'running' ? (
                <>
                  <Square className="w-3 h-3 text-[#FFD700] fill-[#FFD700]" />
                  <span>Local Preview</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 text-neutral-400 fill-neutral-400" />
                  <span>Dev Server</span>
                </>
              )}
            </button>

            {/* Snapshots Button */}
            <button
              onClick={onOpenSnapshots}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1C1C1C] hover:bg-[#282828] text-neutral-200 text-xs font-bold uppercase tracking-wider border border-[#2E2E2E] transition cursor-pointer"
              title="Project Version Snapshots"
            >
              <History className="w-3.5 h-3.5 text-neutral-400" />
              <span className="hidden md:inline">Snapshots</span>
              <span className="px-1.5 py-0.2 bg-[#0F0F0F] text-[10px] rounded text-[#FFD700] font-mono font-bold">
                {project.snapshots.length}
              </span>
            </button>

            {/* Export ZIP */}
            <button
              onClick={onExportZip}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#FFD700] hover:bg-[#FFE033] text-black text-xs font-extrabold uppercase tracking-wider shadow-sm transition cursor-pointer"
              title="Download Standalone ZIP Archive"
            >
              <Download className="w-3.5 h-3.5 text-black stroke-[2.5]" />
              <span className="hidden sm:inline">Export ZIP</span>
            </button>
          </>
        )}

        {/* Companion Setup Guide */}
        <button
          onClick={onOpenCompanionGuide}
          className="p-2 rounded-lg bg-[#1C1C1C] hover:bg-[#282828] text-neutral-200 border border-[#2E2E2E] transition cursor-pointer"
          title="Local Companion & RTX 5050 Setup Guide"
        >
          <Radio className="w-4 h-4 text-[#FFD700]" />
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg bg-[#1C1C1C] hover:bg-[#282828] text-neutral-200 border border-[#2E2E2E] transition cursor-pointer"
          title="AI & Hardware Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
