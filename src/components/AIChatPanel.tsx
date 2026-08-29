import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  CheckCircle2, 
  Circle, 
  Loader2, 
  Terminal, 
  FileCode, 
  Wrench, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Cpu, 
  RefreshCw,
  Zap,
  ArrowRight
} from 'lucide-react';
import { Message, PlanStep, ToolActionPayload } from '../types/builder';

interface AIChatPanelProps {
  messages: Message[];
  currentPlan: PlanStep[];
  isGenerating: boolean;
  onSendMessage: (prompt: string) => void;
  onAutoFixError?: () => void;
  hasActiveError?: boolean;
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({
  messages,
  currentPlan,
  isGenerating,
  onSendMessage,
  onAutoFixError,
  hasActiveError,
}) => {
  const [input, setInput] = useState('');
  const [planExpanded, setPlanExpanded] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const QUICK_SUGGESTIONS = [
    'Add authentication and user profile',
    'Add product search and multi-tag filtering',
    'Make the design more modern with dark theme',
    'Fix the error in the dashboard',
    'Add SQLite stock adjustment audit logs',
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentPlan, isGenerating]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;
    onSendMessage(input.trim());
    setInput('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#121212] border-r border-[#242424] min-w-0">
      {/* Header */}
      <div className="h-10 bg-[#141414] border-b border-[#242424] px-4 flex items-center justify-between select-none shrink-0">
        <div className="flex items-center gap-2 text-xs font-extrabold text-white uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-[#FFD700]" />
          <span>AI Agent Workspace</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-[#FFD700] font-mono font-bold uppercase tracking-wider">
          <Cpu className="w-3.5 h-3.5 text-[#FFD700]" />
          <span>Agent Active</span>
        </div>
      </div>

      {/* Active Execution Plan Accordion */}
      {currentPlan.length > 0 && (
        <div className="bg-[#0A0A0A] border-b border-[#242424] p-3 select-none shrink-0 transition-all">
          <div 
            onClick={() => setPlanExpanded(!planExpanded)}
            className="flex items-center justify-between cursor-pointer text-xs font-extrabold text-neutral-200 hover:text-white uppercase tracking-wide"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-[#FFD700]" />
              <span>Application Execution Plan</span>
              <span className="text-[10px] text-[#FFD700] font-mono font-bold">
                ({currentPlan.filter(s => s.status === 'completed').length}/{currentPlan.length})
              </span>
            </div>
            {planExpanded ? <ChevronUp className="w-3.5 h-3.5 text-neutral-400" /> : <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />}
          </div>

          {planExpanded && (
            <div className="mt-2.5 space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {currentPlan.map((step) => (
                <div key={step.id} className="flex items-center gap-2 text-xs">
                  {step.status === 'completed' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#FFD700] shrink-0" />
                  ) : step.status === 'in-progress' ? (
                    <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                  )}
                  <span
                    className={`truncate ${
                      step.status === 'completed'
                        ? 'text-neutral-300'
                        : step.status === 'in-progress'
                        ? 'text-[#FFD700] font-bold'
                        : 'text-neutral-500'
                    }`}
                  >
                    {step.text}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chat Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-500">
            <Sparkles className="w-8 h-8 text-[#FFD700]/40 mb-3" />
            <div className="font-extrabold text-white text-sm uppercase tracking-wider">Start an AI Software Session</div>
            <p className="text-xs text-neutral-400 mt-1 max-w-xs font-medium">
              Describe features to create or modify the application incrementally.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col space-y-1.5 ${
              msg.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div className="flex items-center gap-2 text-[10px] text-neutral-400 px-1 font-mono uppercase font-bold tracking-wider">
              <span>{msg.role === 'user' ? 'You' : 'AI Coding Agent'}</span>
              <span>•</span>
              <span>{msg.timestamp}</span>
            </div>

            <div
              className={`p-4 rounded-xl text-xs sm:text-sm leading-relaxed max-w-[90%] shadow-md font-medium ${
                msg.role === 'user'
                  ? 'bg-[#FFD700] text-black font-semibold rounded-br-none'
                  : 'bg-[#181818] border border-[#2E2E2E] text-neutral-100 rounded-bl-none'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>

              {/* Tool actions executed */}
              {msg.actions && msg.actions.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-[#333333] space-y-1.5">
                  <div className="text-[11px] font-mono font-bold text-[#FFD700] flex items-center gap-1.5 uppercase tracking-wider">
                    <Wrench className="w-3 h-3 text-[#FFD700]" />
                    <span>Applied Workspace Changes:</span>
                  </div>
                  <div className="space-y-1">
                    {msg.actions.map((act, i) => (
                      <div
                        key={i}
                        className="bg-[#0A0A0A] px-2.5 py-1 rounded text-[11px] font-mono text-neutral-200 flex items-center justify-between border border-[#2E2E2E]"
                      >
                        <span className="text-[#FFD700] font-extrabold uppercase">{act.action}</span>
                        <span className="text-neutral-400 truncate max-w-[180px] font-mono">{act.path || act.command || act.package}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isGenerating && (
          <div className="flex items-start gap-2.5 text-xs text-neutral-200 p-3.5 bg-[#181818] border border-[#FFD700]/40 rounded-xl w-fit">
            <Loader2 className="w-4 h-4 text-[#FFD700] animate-spin" />
            <span className="font-medium">AI Agent is synthesizing changes & compiling code...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Active error quick-repair trigger (Section 13) */}
      {hasActiveError && onAutoFixError && (
        <div className="bg-rose-950/60 border-t border-rose-500/50 p-2.5 px-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-rose-200 font-bold uppercase tracking-wide">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Build Error Detected in Project</span>
          </div>
          <button
            onClick={onAutoFixError}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-extrabold uppercase tracking-wider shadow transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Auto-Repair Error</span>
          </button>
        </div>
      )}

      {/* Quick Suggestion Pills */}
      <div className="px-3 pt-2 pb-1 bg-[#121212] border-t border-[#242424] overflow-x-auto flex gap-1.5 shrink-0 select-none">
        {QUICK_SUGGESTIONS.map((sug, i) => (
          <button
            key={i}
            onClick={() => onSendMessage(sug)}
            disabled={isGenerating}
            className="px-3 py-1 rounded-full bg-[#1C1C1C] hover:bg-[#282828] text-neutral-300 hover:text-[#FFD700] border border-[#333333] text-[11px] font-semibold transition whitespace-nowrap cursor-pointer disabled:opacity-50"
          >
            + {sug}
          </button>
        ))}
      </div>

      {/* Chat Input Bar */}
      <form onSubmit={handleSubmit} className="p-3 bg-[#121212] border-t border-[#242424] shrink-0">
        <div className="relative flex items-center bg-[#0A0A0A] border-2 border-[#2A2A2A] focus-within:border-[#FFD700] rounded-xl shadow-inner">
          <input
            type="text"
            placeholder="Ask AI to modify app... (e.g. 'Add authentication', 'Add search')"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isGenerating}
            className="w-full bg-transparent px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none font-medium"
          />
          <button
            type="submit"
            disabled={!input.trim() || isGenerating}
            className="m-1.5 p-2 rounded-lg bg-[#FFD700] hover:bg-[#FFE033] disabled:opacity-30 disabled:hover:bg-[#FFD700] text-black transition cursor-pointer shadow font-bold"
          >
            <Send className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      </form>
    </div>
  );
};
