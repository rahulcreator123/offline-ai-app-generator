import React, { useState } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileCode, 
  FileText, 
  FileJson, 
  FileSpreadsheet, 
  Plus, 
  Trash2, 
  Search, 
  ChevronRight, 
  ChevronDown,
  Database,
  Layers,
  FilePlus,
  FolderPlus
} from 'lucide-react';
import { Project, ProjectFile } from '../types/builder';

interface SidebarFileExplorerProps {
  project: Project;
  activeFilePath: string;
  onSelectFile: (path: string) => void;
  onCreateFile: (path: string) => void;
  onDeleteFile: (path: string) => void;
}

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: Record<string, TreeNode>;
}

export const SidebarFileExplorer: React.FC<SidebarFileExplorerProps> = ({
  project,
  activeFilePath,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [isAddingFile, setIsAddingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  // Build tree from flat file list
  const buildTree = (): TreeNode => {
    const root: TreeNode = { name: project.name, path: '', type: 'folder', children: {} };

    Object.keys(project.files).forEach((filePath) => {
      if (filterQuery && !filePath.toLowerCase().includes(filterQuery.toLowerCase())) {
        return;
      }
      const parts = filePath.split('/');
      let current = root;

      parts.forEach((part, index) => {
        const isFile = index === parts.length - 1;
        const currentPath = parts.slice(0, index + 1).join('/');

        if (!current.children) current.children = {};

        if (isFile) {
          current.children[part] = { name: part, path: currentPath, type: 'file' };
        } else {
          if (!current.children[part]) {
            current.children[part] = { name: part, path: currentPath, type: 'folder', children: {} };
          }
          current = current.children[part];
        }
      });
    });

    return root;
  };

  const toggleFolder = (folderPath: string) => {
    setCollapsedFolders((prev) => ({ ...prev, [folderPath]: !prev[folderPath] }));
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.tsx') || fileName.endsWith('.jsx')) return <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />;
    if (fileName.endsWith('.ts') || fileName.endsWith('.js')) return <FileCode className="w-4 h-4 text-blue-400 shrink-0" />;
    if (fileName.endsWith('.json')) return <FileJson className="w-4 h-4 text-amber-400 shrink-0" />;
    if (fileName.endsWith('.sql')) return <Database className="w-4 h-4 text-purple-400 shrink-0" />;
    if (fileName.endsWith('.md')) return <FileText className="w-4 h-4 text-slate-400 shrink-0" />;
    return <FileText className="w-4 h-4 text-slate-400 shrink-0" />;
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    onCreateFile(newFileName.trim());
    setNewFileName('');
    setIsAddingFile(false);
  };

  const renderTree = (node: TreeNode, depth = 0) => {
    if (!node.children) return null;

    return Object.values(node.children).map((child) => {
      const isFolder = child.type === 'folder';
      const isCollapsed = collapsedFolders[child.path];
      const isSelected = child.path === activeFilePath;

      if (isFolder) {
        return (
          <div key={child.path} className="select-none">
            <div
              onClick={() => toggleFolder(child.path)}
              style={{ paddingLeft: `${depth * 12 + 10}px` }}
              className="flex items-center gap-1.5 py-1 px-2 hover:bg-slate-800/60 rounded text-xs text-slate-300 font-medium cursor-pointer transition"
            >
              {isCollapsed ? (
                <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
              ) : (
                <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" />
              )}
              {isCollapsed ? (
                <Folder className="w-4 h-4 text-amber-400/80 shrink-0" />
              ) : (
                <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span className="truncate">{child.name}</span>
            </div>
            {!isCollapsed && renderTree(child, depth + 1)}
          </div>
        );
      }

      return (
        <div
          key={child.path}
          onClick={() => onSelectFile(child.path)}
          style={{ paddingLeft: `${depth * 12 + 20}px` }}
          className={`flex items-center justify-between group py-1.5 px-2 rounded-md text-xs cursor-pointer transition select-none ${
            isSelected
              ? 'bg-[#FFD700]/15 text-[#FFD700] font-bold border-l-2 border-[#FFD700]'
              : 'text-neutral-400 hover:text-white hover:bg-[#1E1E1E]'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {getFileIcon(child.name)}
            <span className="truncate font-mono text-[11.5px]">{child.name}</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteFile(child.path);
            }}
            className="opacity-0 group-hover:opacity-100 p-0.5 text-neutral-500 hover:text-rose-400 transition"
            title="Delete file"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      );
    });
  };

  const tree = buildTree();

  return (
    <div className="w-60 bg-[#121212] border-r border-[#242424] flex flex-col h-full shrink-0 select-none">
      {/* Explorer Header */}
      <div className="p-3 border-b border-[#242424] flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-extrabold text-white uppercase tracking-widest">
          <Layers className="w-3.5 h-3.5 text-[#FFD700]" />
          <span>Explorer</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsAddingFile(!isAddingFile)}
            className="p-1 text-neutral-400 hover:text-[#FFD700] hover:bg-[#1E1E1E] rounded transition"
            title="New File"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="px-3 pt-2.5 pb-1">
        <div className="relative">
          <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="FILTER FILES..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded px-2 pl-7 py-1 text-[10px] text-white placeholder-neutral-600 focus:outline-none focus:border-[#FFD700] font-mono uppercase tracking-wider"
          />
        </div>
      </div>

      {/* New file input form */}
      {isAddingFile && (
        <form onSubmit={handleCreateSubmit} className="p-2 border-b border-[#242424] bg-[#0A0A0A]">
          <input
            type="text"
            placeholder="src/components/MyCard.tsx"
            value={newFileName}
            autoFocus
            onChange={(e) => setNewFileName(e.target.value)}
            className="w-full bg-[#161616] border border-[#FFD700] rounded px-2 py-1 text-xs text-white placeholder-neutral-600 focus:outline-none font-mono"
          />
          <div className="flex justify-end gap-1.5 mt-2 text-[10px]">
            <button
              type="button"
              onClick={() => setIsAddingFile(false)}
              className="px-2 py-1 rounded bg-[#222222] text-neutral-400 hover:text-white uppercase font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-2.5 py-1 rounded bg-[#FFD700] text-black font-extrabold uppercase hover:bg-[#FFE033]"
            >
              Create
            </button>
          </div>
        </form>
      )}

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-bold text-neutral-200 font-mono">
          <FolderOpen className="w-3.5 h-3.5 text-[#FFD700]" />
          <span className="truncate uppercase tracking-wide">{project.name}</span>
        </div>
        {renderTree(tree, 0)}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 border-t border-[#242424] text-[10px] text-neutral-400 font-mono font-bold flex justify-between items-center bg-[#0A0A0A] uppercase tracking-wider">
        <span className="text-[#FFD700]">{Object.keys(project.files).length} FILES</span>
        <span>SQLITE + TSX</span>
      </div>
    </div>
  );
};
