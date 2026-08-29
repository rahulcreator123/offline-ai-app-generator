import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Save, 
  Search, 
  FileCode, 
  Code, 
  Eye, 
  Sparkles,
  ArrowRight,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { ProjectFile } from '../types/builder';

interface CodeEditorProps {
  files: Record<string, ProjectFile>;
  activeFilePath: string;
  openTabs: string[];
  onSelectTab: (path: string) => void;
  onCloseTab: (path: string) => void;
  onUpdateFileContent: (path: string, content: string) => void;
  onSaveFile: (path: string) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  files,
  activeFilePath,
  openTabs,
  onSelectTab,
  onCloseTab,
  onUpdateFileContent,
  onSaveFile,
}) => {
  const [copied, setCopied] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');

  const activeFile = files[activeFilePath];

  const handleCopy = () => {
    if (!activeFile) return;
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReplace = () => {
    if (!activeFile || !searchQuery) return;
    const newContent = activeFile.content.replaceAll(searchQuery, replaceQuery);
    onUpdateFileContent(activeFilePath, newContent);
  };

  const lines = (activeFile?.content || '').split('\n');

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0A0A0A] border-r border-[#242424] min-w-0">
      {/* File Tabs Bar */}
      <div className="h-10 bg-[#121212] border-b border-[#242424] flex items-center px-2 gap-1 overflow-x-auto select-none shrink-0">
        {openTabs.map((tabPath) => {
          const file = files[tabPath];
          const fileName = tabPath.split('/').pop() || tabPath;
          const isActive = tabPath === activeFilePath;

          return (
            <div
              key={tabPath}
              onClick={() => onSelectTab(tabPath)}
              className={`group flex items-center gap-2 px-3.5 py-1.5 rounded-t-lg text-xs font-mono transition cursor-pointer border-t-2 border-r border-l border-[#242424] ${
                isActive
                  ? 'bg-[#0A0A0A] text-[#FFD700] border-t-[#FFD700] font-bold shadow-inner'
                  : 'bg-[#181818] text-neutral-400 border-t-transparent hover:text-white hover:bg-[#202020]'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-[#FFD700] shrink-0" />
              <span className="truncate max-w-[140px] font-bold">{fileName}</span>
              {file?.isDirty && (
                <span className="w-2 h-2 rounded-full bg-[#FFD700] shrink-0" title="Unsaved changes" />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tabPath);
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[#2A2A2A] text-neutral-400 hover:text-white transition"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {openTabs.length === 0 && (
          <div className="text-xs text-neutral-500 italic px-2 uppercase tracking-wider font-mono">No files open. Select a file from the explorer.</div>
        )}
      </div>

      {/* Editor Toolbar */}
      {activeFile && (
        <div className="h-8 bg-[#141414] border-b border-[#242424] px-4 flex items-center justify-between text-xs text-neutral-400 select-none shrink-0 font-mono">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-neutral-400 font-bold">{activeFilePath}</span>
            {activeFile.isDirty && (
              <span className="text-[#FFD700] font-black uppercase tracking-wider text-[10px]">• MODIFIED</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`p-1 rounded hover:bg-[#2A2A2A] transition ${showSearch ? 'text-[#FFD700] bg-[#2A2A2A]' : 'text-neutral-400'}`}
              title="Find & Replace (Ctrl+F)"
            >
              <Search className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-[#2A2A2A] text-neutral-400 hover:text-[#FFD700] transition"
              title="Copy File Contents"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#FFD700]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {activeFile.isDirty && (
              <button
                onClick={() => onSaveFile(activeFilePath)}
                className="flex items-center gap-1 px-2.5 py-0.5 bg-[#FFD700] hover:bg-[#FFE033] text-black rounded text-[10px] font-extrabold uppercase tracking-wider transition"
                title="Save Changes"
              >
                <Save className="w-3 h-3 text-black stroke-[2.5]" />
                <span>Save</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Find & Replace Bar */}
      {showSearch && (
        <div className="bg-[#141414] border-b border-[#242424] p-2 flex flex-wrap items-center gap-2 text-xs">
          <input
            type="text"
            placeholder="Find in file..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#0A0A0A] border border-[#2E2E2E] rounded px-2 py-1 text-white text-xs w-44 font-mono focus:outline-none focus:border-[#FFD700]"
          />
          <input
            type="text"
            placeholder="Replace with..."
            value={replaceQuery}
            onChange={(e) => setReplaceQuery(e.target.value)}
            className="bg-[#0A0A0A] border border-[#2E2E2E] rounded px-2 py-1 text-white text-xs w-44 font-mono focus:outline-none focus:border-[#FFD700]"
          />
          <button
            onClick={handleReplace}
            className="px-2.5 py-1 bg-[#222222] hover:bg-[#2A2A2A] text-neutral-200 uppercase font-bold text-[10px] tracking-wider rounded transition"
          >
            Replace All
          </button>
          <button
            onClick={() => setShowSearch(false)}
            className="p-1 text-neutral-500 hover:text-white ml-auto"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Editor Body */}
      {activeFile ? (
        <div className="flex-1 flex overflow-hidden font-mono text-[13px] relative bg-[#0A0A0A]">
          {/* Line Numbers Gutter */}
          <div className="w-12 bg-[#0E0E0E] text-neutral-600 select-none py-4 text-right pr-3 shrink-0 border-r border-[#1F1F1F] overflow-hidden font-semibold">
            {lines.map((_, i) => (
              <div key={i} className="leading-6 text-[12px]">
                {i + 1}
              </div>
            ))}
          </div>

          {/* Text Area Code Editor */}
          <div className="flex-1 relative overflow-auto">
            <textarea
              value={activeFile.content}
              onChange={(e) => onUpdateFileContent(activeFilePath, e.target.value)}
              spellCheck={false}
              className="w-full h-full bg-transparent text-neutral-100 p-4 font-mono text-[13px] leading-6 resize-none focus:outline-none whitespace-pre tab-4 select-text"
              style={{ tabSize: 2 }}
              onKeyDown={(e) => {
                if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  onSaveFile(activeFilePath);
                }
              }}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-neutral-600 text-sm select-none uppercase font-bold tracking-wider">
          Select a file from the explorer to view and edit code.
        </div>
      )}
    </div>
  );
};
