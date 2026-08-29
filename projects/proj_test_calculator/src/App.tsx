import React, { useState, useEffect, useCallback } from 'react';
import { 
  Delete, 
  RotateCcw, 
  Copy, 
  Check, 
  History, 
  Calculator as CalcIcon,
  Percent,
  Plus,
  Minus,
  X as MultiplyIcon,
  Divide,
  Equal
} from 'lucide-react';

interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: string;
}

export default function App() {
  const [display, setDisplay] = useState<string>('0');
  const [equation, setEquation] = useState<string>('');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForNewOperand, setWaitingForNewOperand] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '×':
      case '*': return a * b;
      case '÷':
      case '/': return b === 0 ? 0 : a / b;
      default: return b;
    }
  };

  const handleDigit = (digit: string) => {
    if (waitingForNewOperand) {
      setDisplay(digit);
      setWaitingForNewOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const handleDecimal = () => {
    if (waitingForNewOperand) {
      setDisplay('0.');
      setWaitingForNewOperand(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
    setPrevValue(null);
    setOperation(null);
    setWaitingForNewOperand(false);
  };

  const handleBackspace = () => {
    if (waitingForNewOperand) return;
    if (display.length === 1 || (display.length === 2 && display.startsWith('-'))) {
      setDisplay('0');
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  const handleToggleSign = () => {
    const current = parseFloat(display);
    if (current === 0) return;
    setDisplay(String(-current));
  };

  const handlePercent = () => {
    const current = parseFloat(display);
    const result = current / 100;
    setDisplay(String(result));
  };

  const handleOperator = (nextOp: string) => {
    const inputValue = parseFloat(display);

    if (prevValue === null) {
      setPrevValue(inputValue);
      setEquation(`${inputValue} ${nextOp}`);
    } else if (operation) {
      if (waitingForNewOperand) {
        setOperation(nextOp);
        setEquation(`${prevValue} ${nextOp}`);
        return;
      }
      const result = calculate(prevValue, inputValue, operation);
      const rounded = Math.round(result * 100000000) / 100000000;
      setPrevValue(rounded);
      setDisplay(String(rounded));
      setEquation(`${rounded} ${nextOp}`);
    }

    setWaitingForNewOperand(true);
    setOperation(nextOp);
  };

  const handleEquals = () => {
    const inputValue = parseFloat(display);

    if (prevValue !== null && operation) {
      const result = calculate(prevValue, inputValue, operation);
      const rounded = Math.round(result * 100000000) / 100000000;
      const formattedResult = String(rounded);
      const fullExpression = `${prevValue} ${operation} ${inputValue}`;

      setHistory(prev => [
        {
          id: String(Date.now()),
          expression: fullExpression,
          result: formattedResult,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        },
        ...prev.slice(0, 19),
      ]);

      setDisplay(formattedResult);
      setEquation(`${fullExpression} =`);
      setPrevValue(null);
      setOperation(null);
      setWaitingForNewOperand(true);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard?.writeText(display);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key >= '0' && e.key <= '9') handleDigit(e.key);
    else if (e.key === '.') handleDecimal();
    else if (e.key === '+') handleOperator('+');
    else if (e.key === '-') handleOperator('-');
    else if (e.key === '*' || e.key === 'x') handleOperator('×');
    else if (e.key === '/') { e.preventDefault(); handleOperator('÷'); }
    else if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); handleEquals(); }
    else if (e.key === 'Backspace') handleBackspace();
    else if (e.key === 'Escape') handleClear();
    else if (e.key === '%') handlePercent();
  }, [display, prevValue, operation, waitingForNewOperand]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-center p-4 sm:p-6 select-none font-sans">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <CalcIcon className="w-4 h-4" />
            </div>
            <span className="font-semibold text-slate-200 text-sm tracking-tight">Precision Calculator</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button
              onClick={copyToClipboard}
              title="Copy current value"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              title="Toggle Calculation History"
              className={`p-2 rounded-lg transition-colors ${showHistory ? 'text-indigo-400 bg-indigo-950/50 border border-indigo-800/50' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'}`}
            >
              <History className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Display Screen */}
        <div className="px-6 py-5 bg-slate-950/70 border-b border-slate-800/50 flex flex-col justify-end min-h-[120px] text-right relative">
          <div className="text-xs font-mono text-indigo-400/80 tracking-wide h-5 overflow-hidden text-ellipsis whitespace-nowrap">
            {equation || ' '}
          </div>
          <div className="text-4xl sm:text-5xl font-bold font-mono tracking-tight text-white mt-1 break-all overflow-x-auto">
            {display}
          </div>
        </div>

        {/* History Drawer / Keypad Section */}
        {showHistory ? (
          <div className="p-4 flex-1 min-h-[360px] max-h-[380px] overflow-y-auto flex flex-col gap-2">
            <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-800 text-xs text-slate-400 font-medium">
              <span>Calculation History</span>
              {history.length > 0 && (
                <button
                  onClick={() => setHistory([])}
                  className="text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-12 gap-2 text-xs">
                <History className="w-8 h-8 opacity-40" />
                <span>No calculations recorded yet</span>
              </div>
            ) : (
              history.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setDisplay(item.result);
                    setEquation(item.expression + ' =');
                    setShowHistory(false);
                  }}
                  className="w-full text-right p-3 rounded-xl bg-slate-950/40 hover:bg-slate-800/60 border border-slate-800/50 transition-colors flex flex-col items-end group"
                >
                  <span className="text-xs text-slate-400 font-mono group-hover:text-indigo-300">{item.expression} =</span>
                  <span className="text-lg font-bold font-mono text-slate-100">{item.result}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">{item.timestamp}</span>
                </button>
              ))
            )}
          </div>
        ) : (
          /* Calculator Keypad Grid */
          <div className="p-4 sm:p-5 grid grid-cols-4 gap-2.5 sm:gap-3 bg-slate-900/40">
            {/* Row 1 */}
            <button
              onClick={handleClear}
              className="h-14 sm:h-16 rounded-2xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/40 font-bold text-lg transition-all active:scale-95 flex items-center justify-center shadow-sm"
            >
              AC
            </button>
            <button
              onClick={handleBackspace}
              className="h-14 sm:h-16 rounded-2xl bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 border border-slate-700/40 font-medium text-lg transition-all active:scale-95 flex items-center justify-center shadow-sm"
            >
              <Delete className="w-5 h-5" />
            </button>
            <button
              onClick={handlePercent}
              className="h-14 sm:h-16 rounded-2xl bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 border border-slate-700/40 font-medium text-lg transition-all active:scale-95 flex items-center justify-center shadow-sm"
            >
              <Percent className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleOperator('÷')}
              className={`h-14 sm:h-16 rounded-2xl border font-bold text-xl transition-all active:scale-95 flex items-center justify-center shadow-sm ${operation === '÷' && waitingForNewOperand ? 'bg-indigo-600 text-white border-indigo-400 ring-2 ring-indigo-500/50' : 'bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border-indigo-500/30'}`}
            >
              <Divide className="w-5 h-5" />
            </button>

            {/* Row 2 */}
            <button
              onClick={() => handleDigit('7')}
              className="h-14 sm:h-16 rounded-2xl bg-slate-800/40 hover:bg-slate-700/50 text-slate-100 border border-slate-700/30 font-semibold text-xl transition-all active:scale-95 flex items-center justify-center shadow-sm"
            >
              7
            </button>
            <button
              onClick={() => handleDigit('8')}
              className="h-14 sm:h-16 rounded-2xl bg-slate-800/40 hover:bg-slate-700/50 text-slate-100 border border-slate-700/30 font-semibold text-xl transition-all active:scale-95 flex items-center justify-center shadow-sm"
            >
              8
            </button>
            <button
              onClick={() => handleDigit('9')}
              className="h-14 sm:h-16 rounded-2xl bg-slate-800/40 hover:bg-slate-700/50 text-slate-100 border border-slate-700/30 font-semibold text-xl transition-all active:scale-95 flex items-center justify-center shadow-sm"
            >
              9
            </button>
            <button
              onClick={() => handleOperator('×')}
              className={`h-14 sm:h-16 rounded-2xl border font-bold text-xl transition-all active:scale-95 flex items-center justify-center shadow-sm ${operation === '×' && waitingForNewOperand ? 'bg-indigo-600 text-white border-indigo-400 ring-2 ring-indigo-500/50' : 'bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border-indigo-500/30'}`}
            >
              <MultiplyIcon className="w-5 h-5" />
            </button>

            {/* Row 3 */}
            <button
              onClick={() => handleDigit('4')}
              className="h-14 sm:h-16 rounded-2xl bg-slate-800/40 hover:bg-slate-700/50 text-slate-100 border border-slate-700/30 font-semibold text-xl transition-all active:scale-95 flex items-center justify-center shadow-sm"
            >
              4
            </button>
            <button
              onClick={() => handleDigit('5')}
              className="h-14 sm:h-16 rounded-2xl bg-slate-800/40 hover:bg-slate-700/50 text-slate-100 border border-slate-700/30 font-semibold text-xl transition-all active:scale-95 flex items-center justify-center shadow-sm"
            >
              5
            </button>
            <button
              onClick={() => handleDigit('6')}
              className="h-14 sm:h-16 rounded-2xl bg-slate-800/40 hover:bg-slate-700/50 text-slate-100 border border-slate-700/30 font-semibold text-xl transition-all active:scale-95 flex items-center justify-center shadow-sm"
            >
              6
            </button>
            <button
              onClick={() => handleOperator('-')}
              className={`h-14 sm:h-16 rounded-2xl border font-bold text-xl transition-all active:scale-95 flex items-center justify-center shadow-sm ${operation === '-' && waitingForNewOperand ? 'bg-indigo-600 text-white border-indigo-400 ring-2 ring-indigo-500/50' : 'bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border-indigo-500/30'}`}
            >
              <Minus className="w-5 h-5" />
            </button>

            {/* Row 4 */}
            <button
              onClick={() => handleDigit('1')}
              className="h-14 sm:h-16 rounded-2xl bg-slate-800/40 hover:bg-slate-700/50 text-slate-100 border border-slate-700/30 font-semibold text-xl transition-all active:scale-95 flex items-center justify-center shadow-sm"
            >
              1
            </button>
            <button
              onClick={() => handleDigit('2')}
              className="h-14 sm:h-16 rounded-2xl bg-slate-800/40 hover:bg-slate-700/50 text-slate-100 border border-slate-700/30 font-semibold text-xl transition-all active:scale-95 flex items-center justify-center shadow-sm"
            >
              2
            </button>
            <button
              onClick={() => handleDigit('3')}
              className="h-14 sm:h-16 rounded-2xl bg-slate-800/40 hover:bg-slate-700/50 text-slate-100 border border-slate-700/30 font-semibold text-xl transition-all active:scale-95 flex items-center justify-center shadow-sm"
            >
              3
            </button>
            <button
              onClick={() => handleOperator('+')}
              className={`h-14 sm:h-16 rounded-2xl border font-bold text-xl transition-all active:scale-95 flex items-center justify-center shadow-sm ${operation === '+' && waitingForNewOperand ? 'bg-indigo-600 text-white border-indigo-400 ring-2 ring-indigo-500/50' : 'bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border-indigo-500/30'}`}
            >
              <Plus className="w-5 h-5" />
            </button>

            {/* Row 5 */}
            <button
              onClick={handleToggleSign}
              className="h-14 sm:h-16 rounded-2xl bg-slate-800/40 hover:bg-slate-700/50 text-slate-300 border border-slate-700/30 font-medium text-lg transition-all active:scale-95 flex items-center justify-center shadow-sm"
            >
              ±
            </button>
            <button
              onClick={() => handleDigit('0')}
              className="h-14 sm:h-16 rounded-2xl bg-slate-800/40 hover:bg-slate-700/50 text-slate-100 border border-slate-700/30 font-semibold text-xl transition-all active:scale-95 flex items-center justify-center shadow-sm"
            >
              0
            </button>
            <button
              onClick={handleDecimal}
              className="h-14 sm:h-16 rounded-2xl bg-slate-800/40 hover:bg-slate-700/50 text-slate-100 border border-slate-700/30 font-bold text-xl transition-all active:scale-95 flex items-center justify-center shadow-sm"
            >
              .
            </button>
            <button
              onClick={handleEquals}
              className="h-14 sm:h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-2xl transition-all active:scale-95 flex items-center justify-center shadow-lg shadow-indigo-600/30"
            >
              <Equal className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* Footer info */}
        <div className="px-6 py-2.5 bg-slate-950/80 border-t border-slate-800/50 flex items-center justify-between text-[11px] text-slate-500">
          <span>Keyboard enabled (0-9, +, -, *, /, Enter, Esc)</span>
          <span className="font-mono text-indigo-400">v1.0.0</span>
        </div>
      </div>
    </div>
  );
}
