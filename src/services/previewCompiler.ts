import { ProjectFile } from '../types/builder';

export class PreviewCompiler {
  /**
   * Scans all project files for external npm package imports and returns a list of required packages.
   */
  static extractImportedPackages(files: Record<string, ProjectFile>): string[] {
    const packages = new Set<string>();
    const importRegex = /(?:import\s+(?:[\w*\s{},]*\s+from\s+)?['"]([^'".\/][^'"]*)['"]|require\(['"]([^'".\/][^'"]*)['"]\))/g;

    for (const file of Object.values(files)) {
      if (!file.content) continue;
      let match;
      while ((match = importRegex.exec(file.content)) !== null) {
        const rawPkg = match[1] || match[2];
        if (!rawPkg) continue;
        // Extract package name (e.g. '@types/react' or 'date-fns/locale' -> 'date-fns')
        let pkgName = rawPkg;
        if (pkgName.startsWith('@')) {
          const parts = pkgName.split('/');
          pkgName = parts.slice(0, 2).join('/');
        } else {
          pkgName = pkgName.split('/')[0];
        }

        // Ignore internal virtual paths or react/react-dom
        if (pkgName && pkgName !== 'react' && pkgName !== 'react-dom') {
          packages.add(pkgName);
        }
      }
    }

    return Array.from(packages);
  }

  /**
   * Automatically updates package.json dependencies with any discovered imported packages.
   */
  static syncProjectDependencies(files: Record<string, ProjectFile>): { updatedFiles: Record<string, ProjectFile>; addedPackages: string[] } {
    const importedPackages = this.extractImportedPackages(files);
    const updatedFiles = { ...files };
    const addedPackages: string[] = [];

    const packageJsonFile = files['package.json'];
    let packageJsonData: any = {
      name: 'generated-local-app',
      version: '0.1.0',
      private: true,
      dependencies: {
        react: '^18.3.1',
        'react-dom': '^18.3.1',
        'lucide-react': '^0.468.0',
      },
    };

    if (packageJsonFile && packageJsonFile.content) {
      try {
        packageJsonData = JSON.parse(packageJsonFile.content);
        if (!packageJsonData.dependencies) {
          packageJsonData.dependencies = {};
        }
      } catch {
        // Fallback default
      }
    }

    // Standard version defaults for popular packages
    const packageVersionMap: Record<string, string> = {
      'lucide-react': '^0.468.0',
      'canvas-confetti': '^1.9.3',
      'date-fns': '^3.6.0',
      lodash: '^4.17.21',
      clsx: '^2.1.1',
      'tailwind-merge': '^2.5.4',
      recharts: '^2.13.3',
      'framer-motion': '^11.13.1',
      motion: '^11.13.1',
      nanoid: '^5.0.8',
      axios: '^1.7.9',
    };

    for (const pkg of importedPackages) {
      if (!packageJsonData.dependencies[pkg]) {
        const version = packageVersionMap[pkg];
        if (!version) {
          // Do not invent versions for unknown packages. The model must declare real
          // dependencies in package.json; guessing ^1.0.0 often creates npm failures.
          continue;
        }
        packageJsonData.dependencies[pkg] = version;
        addedPackages.push(pkg);
      }
    }

    if (addedPackages.length > 0 || !packageJsonFile) {
      updatedFiles['package.json'] = {
        path: 'package.json',
        content: JSON.stringify(packageJsonData, null, 2),
        language: 'json',
        isDirty: true,
      };
    }

    return { updatedFiles, addedPackages };
  }

  /** Keep generated projects on a known-compatible Vite/React toolchain. */
  static normalizeBuildToolchain(files: Record<string, ProjectFile>): Record<string, ProjectFile> {
    const updated = { ...files };
    let pkg: any = {};
    try { pkg = JSON.parse(updated['package.json']?.content || '{}'); } catch { pkg = {}; }
    pkg.name = pkg.name || 'generated-local-app';
    pkg.version = pkg.version || '0.1.0';
    pkg.private = true;
    pkg.scripts = { ...(pkg.scripts || {}), dev: 'vite', build: 'vite build' };
    pkg.dependencies = { ...(pkg.dependencies || {}), react: '^18.3.1', 'react-dom': '^18.3.1' };
    pkg.devDependencies = {
      ...(pkg.devDependencies || {}),
      '@types/react': '^18.3.18',
      '@types/react-dom': '^18.3.5',
      '@types/node': '^22.14.0',
      '@vitejs/plugin-react': '4.3.4',
      '@tailwindcss/vite': '^4.1.14',
      tailwindcss: '^4.1.14',
      typescript: '^5.7.3',
      vite: '6.4.3',
    };
    updated['package.json'] = { path: 'package.json', content: JSON.stringify(pkg, null, 2), language: 'json', isDirty: true };
    if (!updated['vite.config.ts'] && !updated['vite.config.js']) {
      updated['vite.config.ts'] = {
        path: 'vite.config.ts',
        content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
`,
        language: 'typescript',
        isDirty: true,
      };
    }
    return updated;
  }

  /**
   * Compiles the project files into a sandboxed HTML bundle with React, Tailwind, Lucide, and loaded libraries.
   */
  static compileToHtml(files: Record<string, ProjectFile>): string {
    const appFile = files['src/App.tsx'] || files['src/App.jsx'] || files['App.tsx'] || files['App.jsx'];
    const sqliteFile = files['src/database/sqlite.ts'] || files['src/database/sqlite.js'];

    // Concatenate any auxiliary helper components
    let auxiliaryComponents = '';
    for (const [path, file] of Object.entries(files)) {
      if (
        (path.startsWith('src/components/') || path.startsWith('components/')) &&
        (path.endsWith('.tsx') || path.endsWith('.jsx') || path.endsWith('.ts') || path.endsWith('.js'))
      ) {
        auxiliaryComponents += `\n// Component: ${path}\n` + this.stripTypeScript(file.content) + '\n';
      }
    }

    // Clean TS syntax for browser evaluation
    let appCode = appFile ? appFile.content : `
      export default function App() {
        return (
          <div className="p-8 text-center text-slate-400">
            <h2 className="text-xl font-bold text-white mb-2">Workspace Ready</h2>
            <p>Describe your app prompt in the AI chat to generate files.</p>
          </div>
        );
      }
    `;

    // Process TypeScript types away
    appCode = this.stripTypeScript(appCode);
    let sqliteCode = sqliteFile ? this.stripTypeScript(sqliteFile.content) : '';

    return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview Sandbox</title>
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: {
              50: '#f0fdf4',
              500: '#22c55e',
              600: '#16a34a',
              700: '#15803d',
            }
          }
        }
      }
    }
  </script>
  <!-- React 18, ReactDOM, Babel, Lucide icons, Canvas-confetti, Date-fns, Lodash, Clsx -->
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/date-fns@3.6.0/cdn.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/clsx@2.1.1/dist/clsx.min.js"></script>
  <style>
    body {
      background-color: #030712;
      color: #f3f4f6;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      margin: 0;
      padding: 0;
    }
    /* Custom scrollbars */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: #0f172a;
    }
    ::-webkit-scrollbar-thumb {
      background: #334155;
      border-radius: 3px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #475569;
    }
  </style>
</head>
<body>
  <div id="root"></div>

  <script>
    // Error forwarder
    window.onerror = function(message, source, lineno, colno, error) {
      window.parent.postMessage({
        type: 'PREVIEW_ERROR',
        error: {
          message: String(message),
          line: lineno,
          column: colno,
          stack: error ? error.stack : ''
        }
      }, '*');
      return false;
    };

    window.addEventListener('unhandledrejection', function(event) {
      window.parent.postMessage({
        type: 'PREVIEW_ERROR',
        error: {
          message: event.reason ? (event.reason.message || String(event.reason)) : 'Unhandled Promise Rejection',
          stack: event.reason ? event.reason.stack : ''
        }
      }, '*');
    });

    // Console logs forwarder
    const originalLog = console.log;
    console.log = function(...args) {
      originalLog.apply(console, args);
      try {
        window.parent.postMessage({
          type: 'PREVIEW_LOG',
          log: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
        }, '*');
      } catch(e){}
    };
  </script>

  <script type="text/babel" data-presets="react,typescript">
    const { useState, useEffect, useMemo, useRef, useCallback, Fragment } = React;

    // Convert PascalCase or camelCase to kebab-case (e.g. CheckCircle2 -> check-circle-2)
    function toKebabCase(str) {
      if (!str) return 'circle';
      return str
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
        .toLowerCase();
    }

    // Dynamic Universal Lucide Icon Resolver
    const IconHelper = (name, fallbackSvg) => {
      return (props) => {
        const kebab = toKebabCase(name);
        const lower = name.toLowerCase();
        const lucideObj = window.lucide || {};
        const iconFn = lucideObj[name] || lucideObj[kebab] || lucideObj[lower] || lucideObj['circle'];
        
        return (
          <span 
            className={"inline-flex items-center justify-center " + (props.className || '')} 
            style={{ width: props.size || 18, height: props.size || 18, display: 'inline-flex' }}
            dangerouslySetInnerHTML={{
              __html: iconFn 
                ? iconFn.toSvg({ class: props.className || 'w-4 h-4', width: props.size || 16, height: props.size || 16 })
                : (fallbackSvg || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>')
            }}
          />
        );
      };
    };

    // Universal Lucide Proxy so ANY icon name works out-of-the-box
    const LucideProxy = new Proxy({}, {
      get: (target, prop) => {
        if (typeof prop === 'string') {
          return IconHelper(prop);
        }
        return IconHelper('circle');
      }
    });

    // Pre-declare standard icon aliases for direct named access
    const Package = IconHelper('package');
    const AlertTriangle = IconHelper('alert-triangle');
    const TrendingUp = IconHelper('trending-up');
    const TrendingDown = IconHelper('trending-down');
    const DollarSign = IconHelper('dollar-sign');
    const Plus = IconHelper('plus');
    const Search = IconHelper('search');
    const Filter = IconHelper('filter');
    const ArrowUpDown = IconHelper('arrow-up-down');
    const Edit3 = IconHelper('edit-3');
    const Trash2 = IconHelper('trash-2');
    const Layers = IconHelper('layers');
    const Database = IconHelper('database');
    const CheckCircle2 = IconHelper('check-circle-2');
    const CheckCircle = IconHelper('check-circle');
    const CheckSquare = IconHelper('check-square');
    const Square = IconHelper('square');
    const RefreshCw = IconHelper('refresh-cw');
    const Download = IconHelper('download');
    const CreditCard = IconHelper('credit-card');
    const PieChart = IconHelper('pie-chart');
    const BarChart = IconHelper('bar-chart-2');
    const Wallet = IconHelper('wallet');
    const ArrowUpRight = IconHelper('arrow-up-right');
    const ArrowDownRight = IconHelper('arrow-down-right');
    const Calendar = IconHelper('calendar');
    const Tag = IconHelper('tag');
    const Users = IconHelper('users');
    const User = IconHelper('user');
    const Clock = IconHelper('clock');
    const Building2 = IconHelper('building-2');
    const Mail = IconHelper('mail');
    const Phone = IconHelper('phone');
    const ArrowRight = IconHelper('arrow-right');
    const MoreVertical = IconHelper('more-vertical');
    const Settings = IconHelper('settings');
    const Shield = IconHelper('shield');
    const Cpu = IconHelper('cpu');
    const Play = IconHelper('play');
    const Sparkles = IconHelper('sparkles');
    const Sun = IconHelper('sun');
    const Moon = IconHelper('moon');
    const Flame = IconHelper('flame');
    const Zap = IconHelper('zap');
    const Heart = IconHelper('heart');
    const Star = IconHelper('star');
    const X = IconHelper('x');
    const Check = IconHelper('check');
    const AlertCircle = IconHelper('alert-circle');
    const Info = IconHelper('info');
    const FileText = IconHelper('file-text');
    const Activity = IconHelper('activity');
    const Lock = IconHelper('lock');
    const Unlock = IconHelper('unlock');

    // Popular UI package wrappers
    const confetti = window.confetti || function() {};
    const dateFns = window.dateFns || { format: (d) => String(d) };
    const _ = window._ || {};
    const clsx = window.clsx || function(...args) { return args.filter(Boolean).join(' '); };

    // Motion mock proxy for framer-motion / motion components
    const motion = new Proxy({}, {
      get: (target, prop) => {
        return (props) => {
          const { children, initial, animate, exit, transition, whileHover, whileTap, ...rest } = props;
          const TagName = typeof prop === 'string' ? prop : 'div';
          return <TagName {...rest}>{children}</TagName>;
        };
      }
    });

    const AnimatePresence = ({ children }) => <Fragment>{children}</Fragment>;

    ${sqliteCode}

    ${auxiliaryComponents}

    // App Component execution
    try {
      ${appCode}

      // Mount into root
      const container = document.getElementById('root');
      const root = ReactDOM.createRoot(container);
      root.render(<App />);

      window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');
    } catch (err) {
      console.error('Runtime Preview Error:', err);
      window.parent.postMessage({
        type: 'PREVIEW_ERROR',
        error: {
          message: err.message,
          stack: err.stack
        }
      }, '*');
    }
  </script>
</body>
</html>`;
  }

  private static stripTypeScript(code: string): string {
    // Remove import statements (handled dynamically by sandboxed preview environment)
    let processed = code.replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '');
    // Remove export default from main App
    processed = processed.replace(/export\s+default\s+function\s+App/, 'function App');
    processed = processed.replace(/export\s+class\s+SQLiteDatabase/, 'class SQLiteDatabase');
    // Remove generic exports like export function X / export const X
    processed = processed.replace(/export\s+(function|const|let|var|class|interface|type)\s+/g, '$1 ');
    return processed;
  }
}
