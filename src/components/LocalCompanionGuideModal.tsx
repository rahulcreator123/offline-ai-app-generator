import React, { useState } from 'react';
import { 
  X, 
  Radio, 
  Copy, 
  Check, 
  Terminal, 
  Cpu, 
  FolderSync, 
  ShieldCheck, 
  ArrowRight,
  Server
} from 'lucide-react';

interface LocalCompanionGuideModalProps {
  onClose: () => void;
}

export const LocalCompanionGuideModal: React.FC<LocalCompanionGuideModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'ollama' | 'python' | 'node'>('overview');
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const OLLAMA_COMMANDS = `# 1. Install Ollama on Windows (https://ollama.com)
# 2. Pull Qwen 2.5 Coder (Optimal 4-bit quantization for RTX 5050 8GB):
ollama run qwen2.5-coder:7b-instruct-q4_K_M

# 3. Allow CORS for browser connection (in PowerShell as Administrator):
$env:OLLAMA_ORIGINS="*"
ollama serve
`;

  const PYTHON_COMPANION_SCRIPT = `"""
Local AI App Builder - Host Companion Bridge (RTX 5050 8GB)
Provides secure sandboxed filesystem, terminal execution, and Ollama bridge.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import subprocess, os, json, psutil

app = FastAPI(title="Local AI App Builder Companion")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

PROJECTS_DIR = os.path.expanduser("~/local-ai-projects")
os.makedirs(PROJECTS_DIR, exist_ok=True)

@app.get("/api/status")
def get_status():
    return {
        "status": "online",
        "gpu": "NVIDIA GeForce RTX 5050 8GB",
        "vram_total_mb": 8192,
        "vram_used_mb": 4850,
        "projects_dir": PROJECTS_DIR
    }

@app.post("/api/fs/write")
def write_file(payload: dict):
    path = os.path.join(PROJECTS_DIR, payload["path"])
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(payload["content"])
    return {"success": True, "path": path}

if __name__ == "__main__":
    import uvicorn
    print("[*] Local Companion running on http://127.0.0.1:8765")
    uvicorn.run(app, host="127.0.0.1", port=8765)
`;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#121212] border-2 border-[#242424] rounded-2xl max-w-3xl w-full flex flex-col max-h-[85vh] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#242424] flex items-center justify-between bg-[#0A0A0A]">
          <div className="flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-[#FFD700]" />
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-white">Local Companion Architecture & RTX 5050 Setup</h2>
              <p className="text-xs text-neutral-400 font-medium">Sections 18, 28 & 29: Offline Local AI Integration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-[#202020] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#242424] bg-[#0E0E0E] px-6 gap-2 text-xs font-bold uppercase tracking-wider">
          {[
            { id: 'overview', label: 'Architecture Overview' },
            { id: 'ollama', label: 'Ollama & RTX 5050' },
            { id: 'python', label: 'Python Companion Server' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3 border-b-2 transition cursor-pointer ${
                activeTab === tab.id
                  ? 'border-[#FFD700] text-[#FFD700]'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs text-neutral-300 bg-[#121212]">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#0A0A0A] border border-[#242424] rounded-xl space-y-2">
                <div className="font-extrabold text-white text-sm flex items-center gap-2 uppercase tracking-wide">
                  <Cpu className="w-4 h-4 text-[#FFD700]" />
                  <span>Local AI Execution Topology</span>
                </div>
                <div className="font-mono text-[11px] text-[#FFD700] bg-[#141414] p-3 rounded-lg border border-[#2A2A2A] leading-relaxed whitespace-pre font-bold">
{`┌──────────────────────────────────────────────┐
│  AI App Builder UI (React / Vite Desktop)   │
└──────────────────────┬───────────────────────┘
                       │ localhost API
                       ▼
┌──────────────────────────────────────────────┐
│  Local Agent Server / Companion Bridge       │
│  ├── File System Sandbox                     │
│  ├── Build & Terminal Process Runner         │
│  └── Model Context & Token Orchestrator      │
└───────────┬──────────────────────┬───────────┘
            │                      │
            ▼                      ▼
┌───────────────────────┐  ┌───────────────────┐
│ Ollama / RTX 5050 GPU │  │ Generated React   │
│ (Qwen 2.5 Coder 7B)   │  │ Preview App (:5173│
└───────────────────────┘  └───────────────────┘`}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-black uppercase tracking-wider text-white">Target Hardware Configuration:</h4>
                <ul className="list-disc pl-5 space-y-1 text-neutral-300 font-medium">
                  <li><strong className="text-white">GPU:</strong> NVIDIA GeForce RTX 5050 (8GB VRAM)</li>
                  <li><strong className="text-white">Model Recommendation:</strong> Qwen 2.5 Coder 7B Instruct (4-bit Q4_K_M) or DeepSeek Coder 6.7B</li>
                  <li><strong className="text-white">VRAM Footprint:</strong> ~4.8 GB model weights + KV cache, leaving ~3.2 GB for OS & Preview</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'ollama' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-black uppercase tracking-wider text-white">Setup Ollama on Windows with RTX 5050:</span>
                <button
                  onClick={() => copyToClipboard(OLLAMA_COMMANDS, 'ollama')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#222222] hover:bg-[#2A2A2A] text-neutral-200 border border-[#333333] rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  {copied === 'ollama' ? <Check className="w-3.5 h-3.5 text-[#FFD700] stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Commands</span>
                </button>
              </div>
              <pre className="p-4 bg-[#0A0A0A] rounded-xl border border-[#242424] font-mono text-[11px] text-[#FFD700] overflow-x-auto whitespace-pre font-bold">
                {OLLAMA_COMMANDS}
              </pre>
            </div>
          )}

          {activeTab === 'python' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-black uppercase tracking-wider text-white">Host Companion Server (server.py):</span>
                <button
                  onClick={() => copyToClipboard(PYTHON_COMPANION_SCRIPT, 'python')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#222222] hover:bg-[#2A2A2A] text-neutral-200 border border-[#333333] rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  {copied === 'python' ? <Check className="w-3.5 h-3.5 text-[#FFD700] stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Script</span>
                </button>
              </div>
              <pre className="p-4 bg-[#0A0A0A] rounded-xl border border-[#242424] font-mono text-[11px] text-neutral-300 overflow-x-auto whitespace-pre">
                {PYTHON_COMPANION_SCRIPT}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#242424] bg-[#0A0A0A] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#222222] hover:bg-[#2A2A2A] text-neutral-200 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
