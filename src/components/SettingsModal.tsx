import React, { useState } from 'react';
import { 
  X, 
  Cpu, 
  Sparkles, 
  Shield, 
  Terminal, 
  Sliders, 
  Palette, 
  Check, 
  Database,
  Radio,
  Server
} from 'lucide-react';
import { AppSettings, AIProvider } from '../types/builder';

interface SettingsModalProps {
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSave,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'rtx5050' | 'security' | 'appearance' | 'runtime'>('ai');
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#121212] border-2 border-[#242424] rounded-2xl max-w-2xl w-full flex flex-col max-h-[85vh] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#242424] flex items-center justify-between bg-[#0A0A0A]">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-[#FFD700]" />
            <h2 className="text-base font-black uppercase tracking-wider text-white">Application & Hardware Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-[#202020] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-[#242424] bg-[#0E0E0E] px-6 gap-2 text-xs font-bold uppercase tracking-wider overflow-x-auto">
          <button
            onClick={() => setActiveTab('ai')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'ai'
                ? 'border-[#FFD700] text-[#FFD700]'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Provider</span>
          </button>

          <button
            onClick={() => setActiveTab('rtx5050')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'rtx5050'
                ? 'border-[#FFD700] text-[#FFD700]'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>RTX 5050 GPU</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'security'
                ? 'border-[#FFD700] text-[#FFD700]'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Security Sandbox</span>
          </button>

          <button
            onClick={() => setActiveTab('appearance')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'appearance'
                ? 'border-[#FFD700] text-[#FFD700]'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Appearance</span>
          </button>

          <button
            onClick={() => setActiveTab('runtime')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'runtime'
                ? 'border-[#FFD700] text-[#FFD700]'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Runtime</span>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-neutral-200 bg-[#121212]">
          {/* Tab 1: AI Provider */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-neutral-400 uppercase tracking-widest mb-2">
                  AI Provider Selection
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'gemini' as AIProvider, label: 'Gemini Provider', desc: 'Google Gemini 3.7 Flash Cloud Engine' },
                    { id: 'ollama' as AIProvider, label: 'Ollama Provider', desc: 'Local endpoint (localhost:11434)' },
                    { id: 'demo' as AIProvider, label: 'Demo Engine', desc: 'Fast local template generator' },
                  ].map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setFormData({ ...formData, ai: { ...formData.ai, provider: p.id } })}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                        formData.ai.provider === p.id
                          ? 'bg-[#FFD700]/10 border-[#FFD700] text-white shadow'
                          : 'bg-[#0A0A0A] border-[#2A2A2A] text-neutral-400 hover:border-neutral-600'
                      }`}
                    >
                      <div className="font-extrabold text-sm text-white mb-1 uppercase tracking-wide">{p.label}</div>
                      <div className="text-[11px] text-neutral-400 font-medium">{p.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {formData.ai.provider === 'ollama' && (
                <div className="p-4 bg-[#0A0A0A] rounded-xl border border-[#2A2A2A] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#FFD700] uppercase tracking-wider">
                      <Radio className="w-4 h-4" />
                      <span>Ollama Connection Parameters</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase">
                      Local Ollama
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1 uppercase font-bold tracking-wide">Local Ollama Endpoint</label>
                    <input
                      type="text"
                      value={formData.ai.localEndpoint}
                      onChange={(e) =>
                        setFormData({ ...formData, ai: { ...formData.ai, localEndpoint: e.target.value } })
                      }
                      className="w-full bg-[#181818] border border-[#333333] rounded-lg px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1 uppercase font-bold tracking-wide">Local Coding Model Mode</label>
                    <select
                      value={formData.ai.ollamaMode || 'auto'}
                      onChange={(e) => {
                        const mode = e.target.value as 'qwen' | 'rahul' | 'auto';
                        setFormData({
                          ...formData,
                          ai: {
                            ...formData.ai,
                            ollamaMode: mode,
                            ollamaModel: mode === 'rahul' ? 'rahul-ai:latest' : 'qwen2.5-coder:7b',
                          },
                        });
                      }}
                      className="w-full bg-[#181818] border border-[#333333] rounded-lg px-3 py-2 text-xs text-white font-bold"
                    >
                      <option value="auto">AUTO — Qwen 2.5 Coder 7B → Rahul AI</option>
                      <option value="qwen">Qwen 2.5 Coder 7B — Primary Coding</option>
                      <option value="rahul">Rahul AI — Custom Local Model</option>
                    </select>
                    <p className="mt-2 text-[10px] text-neutral-500">Auto tries Qwen first for code generation and automatically retries with Rahul AI if generation fails.</p>
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1 uppercase font-bold tracking-wide">Active Ollama Model</label>
                    <div className="w-full bg-[#0A0A0A] border border-[#333333] rounded-lg px-3 py-2 text-xs text-[#FFD700] font-mono">
                      {formData.ai.ollamaMode === 'rahul' ? 'rahul-ai:latest' : 'qwen2.5-coder:7b'}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1 uppercase font-bold tracking-wide">Generation Temperature ({formData.ai.temperature})</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={formData.ai.temperature}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ai: { ...formData.ai, temperature: parseFloat(e.target.value) },
                      })
                    }
                    className="w-full accent-[#FFD700]"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-500 font-mono font-bold">
                    <span>0.0 (DETERMINISTIC)</span>
                    <span>1.0 (CREATIVE)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 mb-1 uppercase font-bold tracking-wide">Context Window Size</label>
                  <select
                    value={formData.ai.contextSize}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ai: { ...formData.ai, contextSize: parseInt(e.target.value) },
                      })
                    }
                    className="w-full bg-[#0A0A0A] border border-[#333333] rounded-lg px-3 py-2 text-xs text-white font-bold"
                  >
                    <option value="4096">4,096 tokens (Fast)</option>
                    <option value="8192">8,192 tokens (Optimal for RTX 5050)</option>
                    <option value="16384">16,384 tokens (Full Project Memory)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: RTX 5050 GPU */}
          {activeTab === 'rtx5050' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-[#FFD700]" />
                    <div>
                      <div className="font-extrabold text-sm text-white uppercase tracking-wider">{formData.rtx5050.gpuName}</div>
                      <div className="text-xs text-neutral-400 font-mono">Total VRAM: {formData.rtx5050.vramTotalMB} MB (8.0 GB GDDR6)</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-[#FFD700]/10 text-[#FFD700] text-xs font-mono font-bold border border-[#FFD700]/30 uppercase">
                    Active Target
                  </span>
                </div>

                {/* VRAM meter */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs text-neutral-300 font-bold uppercase tracking-wide">
                    <span>Target VRAM Allocation:</span>
                    <span className="font-mono text-[#FFD700]">4,850 MB / 8,192 MB (59%)</span>
                  </div>
                  <div className="w-full h-3 bg-[#202020] rounded-full overflow-hidden flex border border-[#333333]">
                    <div className="h-full bg-[#FFD700] w-[59%]" title="Model Weights + KV Cache" />
                    <div className="h-full bg-[#333333] w-[41%]" title="Free VRAM Buffer" />
                  </div>
                  <div className="text-[11px] text-neutral-400 font-medium">
                    4-bit quantized 7B model leaves ~3.3GB free VRAM for host OS and browser preview execution.
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1 uppercase font-bold tracking-wide">Recommended Quantization</label>
                  <select
                    value={formData.rtx5050.quantization}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rtx5050: { ...formData.rtx5050, quantization: e.target.value as any },
                      })
                    }
                    className="w-full bg-[#0A0A0A] border border-[#333333] rounded-lg px-3 py-2 text-xs text-white font-bold"
                  >
                    <option value="4-bit (Q4_K_M)">4-bit (Q4_K_M) - Optimal balance</option>
                    <option value="8-bit (Q8_0)">8-bit (Q8_0) - Higher precision</option>
                    <option value="16-bit (FP16)">16-bit (FP16) - Requires over 14GB VRAM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 mb-1 uppercase font-bold tracking-wide">GPU Offload Layers (33 layers)</label>
                  <input
                    type="number"
                    min="10"
                    max="35"
                    value={formData.rtx5050.gpuOffloadLayers}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rtx5050: { ...formData.rtx5050, gpuOffloadLayers: parseInt(e.target.value) },
                      })
                    }
                    className="w-full bg-[#0A0A0A] border border-[#333333] rounded-lg px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Security & Sandboxing */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="text-xs text-neutral-400 font-medium">
                Configure safety boundaries and command execution gates as mandated by Section 19.
              </div>

              <div className="space-y-3">
                <label className="flex items-start gap-3 p-4 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl cursor-pointer hover:border-[#444444]">
                  <input
                    type="checkbox"
                    checked={formData.security.commandApproval}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        security: { ...formData.security, commandApproval: e.target.checked },
                      })
                    }
                    className="mt-1 accent-[#FFD700]"
                  />
                  <div>
                    <div className="font-extrabold text-white text-xs uppercase tracking-wide">Command Approval Gate</div>
                    <div className="text-[11px] text-neutral-400 font-medium">
                      Require explicit [Allow] / [Deny] confirmation for shell scripts or destructive actions (e.g. rm -rf, npm install).
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl cursor-pointer hover:border-[#444444]">
                  <input
                    type="checkbox"
                    checked={formData.security.sandbox}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        security: { ...formData.security, sandbox: e.target.checked },
                      })
                    }
                    className="mt-1 accent-[#FFD700]"
                  />
                  <div>
                    <div className="font-extrabold text-white text-xs uppercase tracking-wide">Strict Workspace Sandbox</div>
                    <div className="text-[11px] text-neutral-400 font-medium">
                      Restrict generated code and AI agent tools from accessing files outside the project directory.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl cursor-pointer hover:border-[#444444]">
                  <input
                    type="checkbox"
                    checked={formData.security.networkPermissions}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        security: { ...formData.security, networkPermissions: e.target.checked },
                      })
                    }
                    className="mt-1 accent-[#FFD700]"
                  />
                  <div>
                    <div className="font-extrabold text-white text-xs uppercase tracking-wide">Restrict Host Network Access</div>
                    <div className="text-[11px] text-neutral-400 font-medium">
                      Limit outbound networking to authorized development package registries.
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Tab 4: Appearance */}
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1 uppercase font-bold tracking-wide">Theme</label>
                  <select
                    value={formData.appearance.theme}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        appearance: { ...formData.appearance, theme: e.target.value as 'dark' | 'light' },
                      })
                    }
                    className="w-full bg-[#0A0A0A] border border-[#333333] rounded-lg px-3 py-2 text-xs text-white font-bold"
                  >
                    <option value="dark">Dark Developer Theme</option>
                    <option value="light">Light Theme</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 mb-1 uppercase font-bold tracking-wide">Font Size</label>
                  <select
                    value={formData.appearance.fontSize}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        appearance: { ...formData.appearance, fontSize: parseInt(e.target.value) },
                      })
                    }
                    className="w-full bg-[#0A0A0A] border border-[#333333] rounded-lg px-3 py-2 text-xs text-white font-bold"
                  >
                    <option value="12">12px (Dense)</option>
                    <option value="14">14px (Standard)</option>
                    <option value="16">16px (Comfortable)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1 uppercase font-bold tracking-wide">Editor Font Family</label>
                <input
                  type="text"
                  value={formData.appearance.editorFont}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      appearance: { ...formData.appearance, editorFont: e.target.value },
                    })
                  }
                  className="w-full bg-[#0A0A0A] border border-[#333333] rounded-lg px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>
          )}

          {/* Tab 5: Runtime & Paths */}
          {activeTab === 'runtime' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1 uppercase font-bold tracking-wide">Node.js Binary Path</label>
                <input
                  type="text"
                  value={formData.runtime.nodePath}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      runtime: { ...formData.runtime, nodePath: e.target.value },
                    })
                  }
                  className="w-full bg-[#0A0A0A] border border-[#333333] rounded-lg px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1 uppercase font-bold tracking-wide">Python Runtime Path</label>
                <input
                  type="text"
                  value={formData.runtime.pythonPath}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      runtime: { ...formData.runtime, pythonPath: e.target.value },
                    })
                  }
                  className="w-full bg-[#0A0A0A] border border-[#333333] rounded-lg px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1 uppercase font-bold tracking-wide">Default Local Dev Port</label>
                  <input
                    type="number"
                    value={formData.runtime.defaultPort}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        runtime: { ...formData.runtime, defaultPort: parseInt(e.target.value) },
                      })
                    }
                    className="w-full bg-[#0A0A0A] border border-[#333333] rounded-lg px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 mb-1 uppercase font-bold tracking-wide">Max Auto-Repair Attempts</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.runtime.maxRepairAttempts}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        runtime: { ...formData.runtime, maxRepairAttempts: parseInt(e.target.value) },
                      })
                    }
                    className="w-full bg-[#0A0A0A] border border-[#333333] rounded-lg px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-3 p-3.5 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl cursor-pointer hover:border-[#444444]">
                  <input
                    type="checkbox"
                    checked={formData.runtime.autoFixErrors ?? true}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        runtime: { ...formData.runtime, autoFixErrors: e.target.checked },
                      })
                    }
                    className="mt-1 accent-[#FFD700]"
                  />
                  <div>
                    <div className="font-extrabold text-white text-xs uppercase tracking-wide">Automatic Error Auto-Repair</div>
                    <div className="text-[11px] text-neutral-400 font-medium">
                      Automatically detect syntax/runtime exceptions in preview and trigger AI self-healing loops without manual prompt input.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl cursor-pointer hover:border-[#444444]">
                  <input
                    type="checkbox"
                    checked={formData.runtime.autoInstallPackages ?? true}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        runtime: { ...formData.runtime, autoInstallPackages: e.target.checked },
                      })
                    }
                    className="mt-1 accent-[#FFD700]"
                  />
                  <div>
                    <div className="font-extrabold text-white text-xs uppercase tracking-wide">Automatic Package Resolver & Downloader</div>
                    <div className="text-[11px] text-neutral-400 font-medium">
                      Inspect imported packages (e.g. lucide-react, date-fns, canvas-confetti, recharts) and automatically sync them into package.json and the preview bundler.
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-[#242424] flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#222222] hover:bg-[#2A2A2A] text-neutral-300 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-6 py-2 rounded-xl bg-[#FFD700] hover:bg-[#FFE033] text-black text-xs font-extrabold uppercase tracking-wider shadow-lg transition cursor-pointer"
            >
              {savedSuccess ? <Check className="w-4 h-4 stroke-[3]" /> : null}
              <span>Save Configurations</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
