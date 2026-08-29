import React, { useState } from 'react';
import { 
  X, 
  History, 
  RotateCcw, 
  Plus, 
  Eye, 
  Clock, 
  Layers, 
  FileCode, 
  Check, 
  ArrowRight,
  GitCommit
} from 'lucide-react';
import { Snapshot, Project } from '../types/builder';

interface SnapshotsModalProps {
  project: Project;
  onRestoreSnapshot: (snapshot: Snapshot) => void;
  onCreateSnapshot: (label: string) => void;
  onClose: () => void;
}

export const SnapshotsModal: React.FC<SnapshotsModalProps> = ({
  project,
  onRestoreSnapshot,
  onCreateSnapshot,
  onClose,
}) => {
  const [newLabel, setNewLabel] = useState('');
  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(
    project.snapshots[project.snapshots.length - 1] || null
  );
  const [diffFile, setDiffFile] = useState<string>('src/App.tsx');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    onCreateSnapshot(newLabel.trim());
    setNewLabel('');
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#121212] border-2 border-[#242424] rounded-2xl max-w-4xl w-full flex flex-col max-h-[85vh] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#242424] flex items-center justify-between bg-[#0A0A0A]">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-[#FFD700]" />
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-white">Project Version Snapshots</h2>
              <p className="text-xs text-neutral-400 font-medium">Restore point and file diff timeline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-[#202020] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Layout: Left snapshot list, Right diff viewer */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Snapshot List */}
          <div className="w-80 border-r border-[#242424] bg-[#0E0E0E] flex flex-col h-full">
            {/* Create new snapshot bar */}
            <form onSubmit={handleCreate} className="p-3 border-b border-[#242424] bg-[#0A0A0A]">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Snapshot label (e.g. Added auth)..."
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="flex-1 bg-[#181818] border border-[#333333] rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#FFD700]"
                />
                <button
                  type="submit"
                  disabled={!newLabel.trim()}
                  className="px-3.5 py-1.5 bg-[#FFD700] hover:bg-[#FFE033] disabled:opacity-40 text-black rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Save</span>
                </button>
              </div>
            </form>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {project.snapshots.length === 0 ? (
                <div className="p-6 text-center text-xs text-neutral-500 font-medium">
                  No snapshots recorded yet. Click Save to capture the current state.
                </div>
              ) : (
                project.snapshots.map((snap) => {
                  const isSelected = selectedSnapshot?.id === snap.id;
                  return (
                    <div
                      key={snap.id}
                      onClick={() => setSelectedSnapshot(snap)}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition space-y-1.5 ${
                        isSelected
                          ? 'bg-[#FFD700]/10 border-[#FFD700] text-white shadow'
                          : 'bg-[#141414] border-[#242424] text-neutral-400 hover:border-neutral-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-white flex items-center gap-1.5 uppercase tracking-wide">
                          <GitCommit className="w-3.5 h-3.5 text-[#FFD700]" />
                          Version {snap.versionNumber}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-mono">{snap.timestamp}</span>
                      </div>
                      <div className="text-xs text-neutral-200 font-bold line-clamp-1">{snap.label}</div>
                      <div className="text-[10px] text-neutral-500 font-mono flex items-center justify-between pt-1 border-t border-[#242424]">
                        <span>{snap.files.length} tracked files</span>
                        {isSelected && <span className="text-[#FFD700] font-black uppercase">Selected</span>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Details & Diff Viewer */}
          <div className="flex-1 flex flex-col h-full bg-[#0A0A0A] overflow-hidden">
            {selectedSnapshot ? (
              <>
                <div className="p-4 border-b border-[#242424] bg-[#141414] flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                      <span>Version {selectedSnapshot.versionNumber}:</span>
                      <span className="text-[#FFD700]">{selectedSnapshot.label}</span>
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5 font-medium">{selectedSnapshot.summary}</p>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm(`Restore project to Version ${selectedSnapshot.versionNumber}?`)) {
                        onRestoreSnapshot(selectedSnapshot);
                        onClose();
                      }
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FFD700] hover:bg-[#FFE033] text-black rounded-lg text-xs font-black uppercase tracking-wider shadow transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Restore This Version</span>
                  </button>
                </div>

                {/* File picker for snapshot contents */}
                <div className="h-8 bg-[#101010] border-b border-[#242424] px-4 flex items-center gap-2 overflow-x-auto text-xs text-neutral-400">
                  <span className="text-neutral-500 text-[11px] font-bold uppercase tracking-wider">Compare File:</span>
                  {selectedSnapshot.files.map((f) => (
                    <button
                      key={f.path}
                      onClick={() => setDiffFile(f.path)}
                      className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold transition cursor-pointer ${
                        diffFile === f.path ? 'bg-[#222222] text-[#FFD700] border border-[#333333]' : 'hover:text-white'
                      }`}
                    >
                      {f.path.split('/').pop()}
                    </button>
                  ))}
                </div>

                {/* File content viewer */}
                <div className="flex-1 overflow-auto p-4 font-mono text-[12px] text-neutral-300 leading-relaxed bg-[#0A0A0A]">
                  <pre className="whitespace-pre">
                    {selectedSnapshot.files.find((f) => f.path === diffFile)?.content || 'File content not found'}
                  </pre>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-neutral-500 font-medium">
                Select a snapshot version on the left to inspect files and restore.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
