import React, { useState, useEffect, useRef } from 'react';
import { 
  RefreshCw, 
  ExternalLink, 
  Monitor, 
  Tablet, 
  Smartphone, 
  Globe, 
  AlertCircle, 
  Sparkles,
  Terminal,
  Maximize2,
  CheckCircle2,
  Cpu,
  Package,
  Wrench,
  ToggleLeft,
  ToggleRight,
  Loader2
} from 'lucide-react';
import { Project, ProjectFile } from '../types/builder';
import { PreviewCompiler } from '../services/previewCompiler';

interface LivePreviewProps {
  project: Project;
  onAutoFixError?: () => void;
  onViewLogs?: () => void;
  autoFixEnabled?: boolean;
  onToggleAutoFix?: () => void;
}

export const LivePreview: React.FC<LivePreviewProps> = ({
  project,
  onAutoFixError,
  onViewLogs,
  autoFixEnabled = true,
  onToggleAutoFix,
}) => {
  const [previewMode, setPreviewMode] = useState<'sandbox' | 'devserver'>('sandbox');
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [compiledHtml, setCompiledHtml] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [devServerFailed, setDevServerFailed] = useState(false);
  const [runtimeError, setRuntimeError] = useState<{ message: string; stack?: string } | null>(null);
  const [isAutoFixing, setIsAutoFixing] = useState(false);
  const [repairAttempts, setRepairAttempts] = useState(0);
  const autoFixTimerRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Recompile when files change
  useEffect(() => {
    setIsLoading(true);
    setRuntimeError(null);

    try {
      const html = PreviewCompiler.compileToHtml(project.files);
      setCompiledHtml(html);
    } catch (err) {
      setRuntimeError({
        message: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsLoading(false);
    }
  }, [project.files, refreshKey]);

  // Handle runtime messages and trigger automatic auto-repair if enabled
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'PREVIEW_ERROR') {
        const errorMsg = e.data.error?.message || 'Unknown runtime evaluation exception';
        setRuntimeError({
          message: errorMsg,
          stack: e.data.error?.stack,
        });

        // Trigger automatic error recovery loop (Max 5 attempts)
        if (autoFixEnabled && onAutoFixError && repairAttempts < 5 && !isAutoFixing) {
          if (autoFixTimerRef.current) clearTimeout(autoFixTimerRef.current);
          
          setIsAutoFixing(true);
          setRepairAttempts((prev) => prev + 1);

          autoFixTimerRef.current = setTimeout(() => {
            onAutoFixError();
            setIsAutoFixing(false);
          }, 900);
        }
      } else if (e.data?.type === 'PREVIEW_READY') {
        // Reset error state on clean mount
        setRuntimeError(null);
        setIsAutoFixing(false);
        setRepairAttempts(0);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      if (autoFixTimerRef.current) clearTimeout(autoFixTimerRef.current);
    };
  }, [autoFixEnabled, onAutoFixError, repairAttempts, isAutoFixing]);

  const handleRefresh = () => {
    setRuntimeError(null);
    setDevServerFailed(false);
    setRepairAttempts(0);
    setRefreshKey((k) => k + 1);
  };

  const handleOpenInNewTab = () => {
    const blob = new Blob([compiledHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const getViewportWidth = () => {
    if (viewport === 'mobile') return 'max-w-[375px]';
    if (viewport === 'tablet') return 'max-w-[768px]';
    return 'w-full';
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0F0F0F] min-w-0">
      {/* Top Controls Bar */}
      <div className="h-10 bg-[#141414] border-b border-[#242424] px-4 flex items-center justify-between select-none shrink-0">
        {/* Left: Dev URL indicator & Auto-resolver Badges */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-2.5 py-1 text-xs font-mono">
            <Globe className="w-3.5 h-3.5 text-[#FFD700] shrink-0" />
            <span className="truncate max-w-[140px] text-[#FFD700] font-bold">{project.devUrl || 'http://127.0.0.1:5173'}</span>
          </div>

          {/* Auto-Package Resolver status */}
          <div className="hidden md:flex items-center gap-1 bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 rounded-lg px-2 py-0.5 text-[11px] font-medium" title="Automatically downloads and syncs missing npm dependencies">
            <Package className="w-3 h-3 text-emerald-400" />
            <span>Auto-Packages</span>
          </div>

          {/* Auto-Fix toggle */}
          <button
            onClick={onToggleAutoFix}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-medium transition cursor-pointer ${
              autoFixEnabled
                ? 'bg-amber-950/60 border-amber-700/60 text-amber-300'
                : 'bg-[#181818] border-[#333] text-neutral-400'
            }`}
            title="Automatically auto-repair code on runtime error"
          >
            <Wrench className="w-3 h-3" />
            <span>Auto-Fix: {autoFixEnabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Viewport & Mode Switcher */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher: Sandbox vs Real Vite Dev Server */}
          <div className="hidden sm:flex items-center gap-1 bg-[#0A0A0A] p-0.5 rounded-lg border border-[#2A2A2A]">
            <button
              onClick={() => setPreviewMode('sandbox')}
              className={`px-2 py-1 rounded text-[10px] font-extrabold uppercase tracking-wider transition cursor-pointer ${
                previewMode === 'sandbox'
                  ? 'bg-[#FFD700] text-black shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Sandbox
            </button>
            <button
              onClick={() => setPreviewMode('devserver')}
              className={`px-2 py-1 rounded text-[10px] font-extrabold uppercase tracking-wider transition cursor-pointer ${
                previewMode === 'devserver'
                  ? 'bg-[#FFD700] text-black shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Vite Server (Local)
            </button>
          </div>

          <div className="flex items-center gap-1 bg-[#0A0A0A] p-1 rounded-lg border border-[#2A2A2A]">
            <button
              onClick={() => setViewport('desktop')}
              className={`p-1 rounded transition cursor-pointer ${viewport === 'desktop' ? 'bg-[#222222] text-[#FFD700]' : 'text-neutral-500 hover:text-neutral-300'}`}
              title="Desktop View (100%)"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewport('tablet')}
              className={`p-1 rounded transition cursor-pointer ${viewport === 'tablet' ? 'bg-[#222222] text-[#FFD700]' : 'text-neutral-500 hover:text-neutral-300'}`}
              title="Tablet View (768px)"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewport('mobile')}
              className={`p-1 rounded transition cursor-pointer ${viewport === 'mobile' ? 'bg-[#222222] text-[#FFD700]' : 'text-neutral-500 hover:text-neutral-300'}`}
              title="Mobile View (375px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-lg bg-[#222222] hover:bg-[#2A2A2A] text-neutral-300 hover:text-[#FFD700] transition cursor-pointer"
            title="Refresh Preview"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#FFD700]' : ''}`} />
          </button>
          <button
            onClick={handleOpenInNewTab}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#222222] hover:bg-[#2A2A2A] text-neutral-200 text-xs font-bold uppercase tracking-wider border border-[#333333] transition cursor-pointer"
            title="Open in Independent Browser Window"
          >
            <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden sm:inline">Open in Browser</span>
          </button>
        </div>
      </div>

      {/* Preview Stage */}
      <div className="flex-1 bg-[#0F0F0F] p-3 overflow-hidden flex flex-col items-center justify-center relative">
        <div className={`h-full ${getViewportWidth()} w-full bg-[#121212] border-2 border-[#242424] rounded-xl overflow-hidden shadow-2xl transition-all relative flex flex-col`}>
          {/* Active Error Overlay with Auto-Fix Loop indicator */}
          {runtimeError && (
            <div className="absolute inset-x-0 top-0 z-20 bg-rose-950/95 border-b border-rose-500/50 p-4 backdrop-blur text-rose-200 text-xs shadow-lg space-y-2 animate-in fade-in">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 font-black uppercase tracking-wider text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Runtime Preview Diagnostic Error</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {isAutoFixing ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-600 text-white font-extrabold uppercase tracking-wider rounded-lg shadow animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Auto-Repairing (Attempt {repairAttempts}/5)...</span>
                    </div>
                  ) : (
                    onAutoFixError && (
                      <button
                        onClick={onAutoFixError}
                        className="flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-extrabold uppercase tracking-wider rounded-lg shadow cursor-pointer transition"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Auto-Repair Error</span>
                      </button>
                    )
                  )}
                </div>
              </div>
              <div className="font-mono bg-[#0A0A0A] p-2.5 rounded border border-rose-900/60 overflow-x-auto text-[11px] text-rose-300">
                {runtimeError.message}
              </div>
            </div>
          )}

          {/* Preview iframe: Sandbox Mode or Real Local Vite Dev Server */}
          {previewMode === 'devserver' ? (
            <div className="w-full h-full flex flex-col bg-[#0F0F0F] relative">
              <div className="p-2 bg-[#181818] border-b border-[#2A2A2A] text-xs flex items-center justify-between text-neutral-300 font-mono">
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Connected to Local Vite Process ({project.devUrl || 'http://127.0.0.1:5173'})
                </span>
                <button
                  onClick={() => window.open(project.devUrl || 'http://127.0.0.1:5173', '_blank')}
                  className="px-2 py-0.5 rounded bg-[#2A2A2A] hover:bg-[#333] text-white text-[11px] font-bold"
                >
                  Open Preview ↗
                </button>
              </div>
              {!devServerFailed ? (
                <iframe
                  ref={iframeRef}
                  src={project.devUrl || 'http://127.0.0.1:5173'}
                  sandbox="allow-scripts allow-modals allow-same-origin allow-forms"
                  title="Live Local Dev Server"
                  onError={() => {
                    setDevServerFailed(true);
                    setRuntimeError({ message: 'Local Vite preview could not be loaded. Switched to the built-in offline preview.' });
                  }}
                  className="w-full h-full border-0 bg-[#0F0F0F]"
                />
              ) : (
                <iframe
                  ref={iframeRef}
                  srcDoc={compiledHtml}
                  sandbox="allow-scripts allow-modals allow-same-origin"
                  title="Offline Fallback Preview"
                  className="w-full h-full border-0 bg-white"
                />
              )}
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              srcDoc={compiledHtml}
              sandbox="allow-scripts allow-modals allow-same-origin"
              title="Interactive App Preview"
              className="w-full h-full border-0 bg-[#0F0F0F]"
            />
          )}
        </div>
      </div>
    </div>
  );
};
