import React from 'react';
import { ShieldAlert, AlertTriangle, Check, X, Terminal } from 'lucide-react';
import { SecurityApprovalRequest } from '../types/builder';

interface SecurityApprovalModalProps {
  request: SecurityApprovalRequest;
}

export const SecurityApprovalModal: React.FC<SecurityApprovalModalProps> = ({ request }) => {
  const isDestructive = request.type === 'destructive' || request.command.includes('rm -rf');

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#121212] border-2 border-[#242424] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isDestructive ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30'
          }`}>
            {isDestructive ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-base font-black uppercase tracking-wider text-white">
              {isDestructive ? 'Destructive Command Approval Required' : 'Shell Execution Approval'}
            </h3>
            <p className="text-xs text-neutral-400 font-medium">Security Sandbox Permission Prompt (Section 19)</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs text-neutral-300 font-medium">
            {isDestructive
              ? 'The AI agent wants to execute a potentially destructive command that may delete workspace files:'
              : 'The AI agent wants to execute a package installation / system shell command:'}
          </div>

          <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-3.5 font-mono text-xs text-[#FFD700] font-bold overflow-x-auto flex items-center gap-2">
            <span className="text-neutral-500">$</span>
            <span>{request.command}</span>
          </div>

          {isDestructive && (
            <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/40 text-[11px] text-rose-300 flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>Warning: This command may delete or overwrite files in the project workspace.</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#242424]">
          <button
            onClick={request.onDeny}
            className="px-4 py-2 rounded-xl bg-[#222222] hover:bg-[#2A2A2A] text-neutral-300 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
          >
            {isDestructive ? 'Cancel' : 'Deny'}
          </button>
          <button
            onClick={request.onApprove}
            className={`flex items-center gap-1.5 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-lg ${
              isDestructive ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20' : 'bg-[#FFD700] hover:bg-[#FFE033] text-black shadow-[#FFD700]/20'
            }`}
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Allow Execution</span>
          </button>
        </div>
      </div>
    </div>
  );
};
