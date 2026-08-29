import JSZip from 'jszip';
import { Project } from '../types/builder';

export class ExportService {
  /**
   * Generates and downloads a complete runnable ZIP project
   */
  static async exportProjectZip(project: Project): Promise<void> {
    const zip = new JSZip();

    // Add all project files
    Object.values(project.files).forEach(file => {
      zip.file(file.path, file.content);
    });

    // Ensure essential root files exist if not present
    if (!project.files['index.html']) {
      zip.file(
        'index.html',
        `<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${project.name}</title>
  </head>
  <body class="bg-slate-950 text-slate-100">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
      );
    }

    if (!project.files['src/main.tsx']) {
      zip.file(
        'src/main.tsx',
        `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`
      );
    }

    if (!project.files['src/index.css']) {
      zip.file(
        'src/index.css',
        `@import "tailwindcss";
html, body, #root {
  margin: 0;
  min-height: 100%;
}
`
      );
    }

    if (!project.files['vite.config.ts'] && !project.files['vite.config.js']) {
      zip.file(
        'vite.config.ts',
        `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true
  }
});`
      );
    }

    // Windows local runner batch script (Section 16 & 20)
    zip.file(
      'start-local-dev.bat',
      `@echo off
echo ========================================================
echo Launching ${project.name} on Local Machine (RTX 5050 GPU)
echo ========================================================
echo Installing dependencies...
call npm install
echo Starting Vite local server...
call npm run dev
pause
`
    );

    // Generate blob and download
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}-project.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
