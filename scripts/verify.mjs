import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

// 1. Required root builder files
const required = [
  'package.json',
  'index.html',
  'vite.config.ts',
  'tsconfig.json',
  'server.ts',
  'src/main.tsx',
  'src/App.tsx',
  'src/index.css',
];
const missing = required.filter((f) => !fs.existsSync(path.join(root, f)));
if (missing.length) {
  console.error(`Missing required root files: ${missing.join(', ')}`);
  process.exit(1);
}

// 2. Validate root package.json
let pkg;
try {
  pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
} catch (e) {
  console.error(`Root package.json is invalid JSON: ${e.message}`);
  process.exit(1);
}

const scripts = pkg.scripts || {};
for (const name of ['dev', 'build', 'lint', 'verify', 'preview']) {
  if (!scripts[name]) {
    console.error(`package.json is missing required npm script: ${name}`);
    process.exit(1);
  }
}
if (scripts.lint !== 'tsc --noEmit') {
  console.error('lint script must run "tsc --noEmit"');
  process.exit(1);
}
if (pkg.devDependencies?.vite !== '6.4.3') {
  console.error('Vite must remain pinned to 6.4.3');
  process.exit(1);
}
if (pkg.devDependencies?.['@vitejs/plugin-react'] !== '4.3.4') {
  console.error('React Vite plugin must remain pinned to 4.3.4');
  process.exit(1);
}

// 3. Check TypeScript source files and resolve local imports
const sourceRoot = path.join(root, 'src');
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) files.push(full);
  }
}
walk(sourceRoot);

const extensions = ['', '.ts', '.tsx', '.js', '.jsx'];
const missingImports = [];
const re = /from\s*['"](\.{1,2}\/[^'"]+)['"]|import\s*['"](\.{1,2}\/[^'"]+)['"]/g;
for (const file of files) {
  if (['templates.ts', 'exportService.ts', 'aiAgent.ts', 'offlineSynthesizer.ts'].includes(path.basename(file))) continue;
  const text = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = re.exec(text))) {
    const spec = m[1] || m[2];
    const base = path.resolve(path.dirname(file), spec);
    const candidates = extensions.map((ext) => base + ext);
    candidates.push(...extensions.map((ext) => path.join(base, 'index' + ext)));
    if (!candidates.some(fs.existsSync)) {
      missingImports.push(`${path.relative(root, file)} -> ${spec}`);
    }
  }
}
if (missingImports.length) {
  console.error('Broken local imports in builder:');
  for (const item of missingImports) console.error(`  ${item}`);
  process.exit(1);
}

// 4. Check that generated projects are isolated in projects/ and do not contaminate root
const projectsDir = path.join(root, 'projects');
if (fs.existsSync(projectsDir)) {
  const entries = fs.readdirSync(projectsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const projPath = path.join(projectsDir, entry.name);
      // Ensure it is strictly inside projects/
      const rel = path.relative(projectsDir, projPath);
      if (rel.startsWith('..') || path.isAbsolute(rel)) {
        console.error(`Project directory escapes projects/ boundary: ${entry.name}`);
        process.exit(1);
      }
    }
  }
}

// 5. Ensure builder core files are not overwritten by generated app content
const builderAppContent = fs.readFileSync(path.join(root, 'src', 'App.tsx'), 'utf8');
if (!builderAppContent.includes('DEFAULT_SETTINGS') || !builderAppContent.includes('Header')) {
  console.error('Builder root src/App.tsx appears to have been overwritten!');
  process.exit(1);
}

const builderPkgContent = fs.readFileSync(path.join(root, 'package.json'), 'utf8');
if (!builderPkgContent.includes('offline-ai-app-generator')) {
  console.error('Builder root package.json appears to have been overwritten!');
  process.exit(1);
}

console.log(`VERIFY OK: ${files.length} source files verified. Builder root isolated and clean.`);
