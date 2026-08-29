import React, { useState, useRef, useEffect } from 'react';
import { 
  Terminal as TerminalIcon, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Info,
  Play,
  Sparkles
} from 'lucide-react';
import { BuildLog } from '../types/builder';

interface TerminalPanelProps {
  logs: BuildLog[];
  onClearLogs: () => void;
  onRunCommand: (command: string) => void;
  onInspectError?: () => void;
}

export const TerminalPanel: React.FC<TerminalPanelProps> = ({
  logs,
  onClearLogs,
  onRunCommand,
  onInspectError,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'build' | 'errors'>('all');
  const [commandInput, setCommandInput] = useState('');
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    onRunCommand(commandInput.trim());
    setCommandInput('');
  };

  const filteredLogs = logs.filter((l) => {
    if (activeTab === 'errors') return l.type === 'error' || l.type === 'warn';
    if (activeTab === 'build') return l.type === 'command' || l.text.includes('build') || l.text.includes('install');
    return true;
  });

  const errorCount = logs.filter((l) => l.type === 'error').length;

  return (
    <div className="h-44 bg-[#0A0A0A] border-t border-[#242424] flex flex-col shrink-0 font-mono select-none">
      {/* Terminal Titlebar */}
      <div className="h-8 bg-[#141414] px-4 flex items-center justify-between border-b border-[#242424] text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-white font-extrabold uppercase tracking-wider text-[11px]">
            <TerminalIcon className="w-3.5 h-3.5 text-[#FFD700]" />
            <span>Terminal / Build Diagnostics</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${activeTab === 'all' ? 'bg-[#222222] text-[#FFD700] border border-[#333333]' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              All ({logs.length})
            </button>
            <button
              onClick={() => setActiveTab('build')}
              className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${activeTab === 'build' ? 'bg-[#222222] text-[#FFD700] border border-[#333333]' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              Build Logs
            </button>
            <button
              onClick={() => setActiveTab('errors')}
              className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${activeTab === 'errors' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              Issues {errorCount > 0 && `(${errorCount})`}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {errorCount > 0 && onInspectError && (
            <button
              onClick={onInspectError}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-extrabold uppercase tracking-wider transition cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-white" />
              <span>Inspect Error with AI</span>
            </button>
          )}

          <button
            onClick={onClearLogs}
            className="p-1 text-neutral-500 hover:text-[#FFD700] transition cursor-pointer"
            title="Clear Terminal Output"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Output Log Area */}
      <div className="flex-1 overflow-y-auto p-3 text-[12px] leading-relaxed space-y-1 bg-[#0A0A0A]">
        {filteredLogs.map((log) => {
          let textClass = 'text-neutral-300';
          let prefix = '•';

          if (log.type === 'error') {
            textClass = 'text-rose-400 font-bold bg-rose-950/40 p-1.5 rounded border border-rose-900/60';
            prefix = '✖';
          } else if (log.type === 'warn') {
            textClass = 'text-amber-400 font-medium';
            prefix = '▲';
          } else if (log.type === 'success') {
            textClass = 'text-[#FFD700] font-bold';
            prefix = '✓';
          } else if (log.type === 'command') {
            textClass = 'text-[#FFD700] font-black';
            prefix = '$';
          }

          return (
            <div key={log.id} className={`flex items-start gap-2 ${textClass}`}>
              <span className="text-neutral-600 text-[10px] select-none font-semibold">{log.timestamp}</span>
              <span className="select-none font-black shrink-0">{prefix}</span>
              <span className="whitespace-pre-wrap break-all flex-1">{log.text}</span>
            </div>
          );
        })}
        <div ref={logsEndRef} />
      </div>

      {/* Shell prompt input */}
      <form onSubmit={handleCommandSubmit} className="h-8 bg-[#141414] border-t border-[#242424] px-3 flex items-center gap-2 shrink-0">
        <span className="text-[#FFD700] text-xs font-black">$</span>
        <input
          type="text"
          placeholder="Type command (e.g. 'npm run build', 'npm install lucide-react', 'npm test')..."
          value={commandInput}
          onChange={(e) => setCommandInput(e.target.value)}
          className="flex-1 bg-transparent text-xs text-white placeholder-neutral-600 focus:outline-none font-mono"
        />
        <button
          type="submit"
          className="text-neutral-500 hover:text-[#FFD700] text-xs uppercase font-bold transition cursor-pointer"
        >
          ↵ Enter
        </button>
      </form>
    </div>
  );
};
