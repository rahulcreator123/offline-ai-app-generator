import { ProjectFile } from '../types/builder';

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
  defaultPlan: string[];
  files: Record<string, ProjectFile>;
}

export const TEMPLATES: Record<string, ProjectTemplate> = {
  inventory: {
    id: 'inventory',
    name: 'my-inventory-app',
    description: 'Modern inventory management with login, products, stock tracking, dashboard charts, search, and SQLite database.',
    prompt: 'Build a modern inventory management application with login, products, stock tracking, dashboard charts, search, and SQLite database.',
    defaultPlan: [
      'Create React frontend with Tailwind CSS',
      'Create application layout and sidebar navigation',
      'Create reusable inventory cards and data tables',
      'Create products and stock tracking views',
      'Create SQLite database persistence layer (localStorage mock)',
      'Add stock level analytics and category charts',
      'Add validation for product SKU and pricing',
      'Add responsive styling and low-stock alerts',
      'Run build and verify syntax',
      'Inspect build diagnostics',
      'Start preview dev server',
    ],
    files: {
      'package.json': {
        path: 'package.json',
        language: 'json',
        content: JSON.stringify(
          {
            name: 'my-inventory-app',
            private: true,
            version: '1.0.0',
            type: 'module',
            scripts: {
              dev: 'vite',
              build: 'tsc && vite build',
              preview: 'vite preview',
            },
            dependencies: {
              react: '^18.3.1',
              'react-dom': '^18.3.1',
              'lucide-react': '^0.468.0',
              'sql.js': '^1.12.0',
            },
            devDependencies: {
              '@types/react': '^18.3.18',
              '@types/react-dom': '^18.3.5',
              '@types/node': '^22.14.0',
              '@vitejs/plugin-react': '4.3.4',
              '@tailwindcss/vite': '^4.1.14',
              tailwindcss: '^4.1.14',
              typescript: '^5.7.3',
              vite: '6.4.3',
            },
          },
          null,
          2
        ),
      },
      'vite.config.ts': {
        path: 'vite.config.ts',
        language: 'typescript',
        content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
`,
      },
      'README.md': {
        path: 'README.md',
        language: 'markdown',
        content: `# Modern Inventory Management System

A developer-grade inventory tracking application built locally using Local AI App Builder.

## Features
- **Stock Tracking & Real-time Metrics**: Monitor total items, low stock alerts, stock valuation, and active categories.
- **SQLite Database Architecture**: Local relational data persistence for products, categories, suppliers, and stock logs.
- **Search & Filter**: Instant filtering by SKU, product name, category, and stock status.
- **Stock Adjustment Modal**: Quick increment/decrement adjustments with audit trail notes.
- **Export & Diagnostics**: Export stock reports to CSV/JSON.

## Getting Started
\`\`\`bash
npm install
npm run dev
\`\`\`
`,
      },
      'src/types.ts': {
        path: 'src/types.ts',
        language: 'typescript',
        content: `export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  minThreshold: number;
  unitPrice: number;
  supplier: string;
  updatedAt: string;
}

export interface StockLog {
  id: string;
  productId: string;
  productName: string;
  change: number;
  reason: string;
  timestamp: string;
}

export interface CategoryStat {
  name: string;
  count: number;
  value: number;
}
`,
      },
      'src/database/sqlite.ts': {
        path: 'src/database/sqlite.ts',
        language: 'typescript',
        content: `import { Product, StockLog } from '../types';

const STORAGE_KEY_PRODUCTS = 'inventory_sqlite_products_v1';
const STORAGE_KEY_LOGS = 'inventory_sqlite_logs_v1';

const INITIAL_PRODUCTS: Product[] = [
  { id: '1', sku: 'GPU-5050-8G', name: 'NVIDIA GeForce RTX 5050 8GB', category: 'Hardware', quantity: 14, minThreshold: 5, unitPrice: 399.99, supplier: 'MicroCenter Tech', updatedAt: '2026-08-27' },
  { id: '2', sku: 'MEM-DDR5-32', name: 'Corsair Vengeance 32GB DDR5 6000MHz', category: 'Memory', quantity: 28, minThreshold: 10, unitPrice: 119.50, supplier: 'Global Silicon Dist.', updatedAt: '2026-08-26' },
  { id: '3', sku: 'SSD-NVME-2T', name: 'Samsung 990 Pro 2TB PCIe Gen4', category: 'Storage', quantity: 3, minThreshold: 8, unitPrice: 169.99, supplier: 'Samsung Direct', updatedAt: '2026-08-27' },
  { id: '4', sku: 'CPU-AMD-98X', name: 'AMD Ryzen 7 9800X3D 8-Core', category: 'Hardware', quantity: 8, minThreshold: 4, unitPrice: 479.00, supplier: 'AMD Partner Hub', updatedAt: '2026-08-25' },
  { id: '5', sku: 'PSU-COR-850', name: 'Corsair RM850x 80+ Gold Modular', category: 'Power', quantity: 19, minThreshold: 6, unitPrice: 139.95, supplier: 'Global Silicon Dist.', updatedAt: '2026-08-24' },
  { id: '6', sku: 'MBD-ASU-B65', name: 'ASUS ROG Strix B650E-F Gaming', category: 'Hardware', quantity: 6, minThreshold: 5, unitPrice: 259.00, supplier: 'MicroCenter Tech', updatedAt: '2026-08-26' },
];

export class SQLiteDatabase {
  static getProducts(): Product[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PRODUCTS);
      return data ? JSON.parse(data) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  }

  static saveProducts(products: Product[]): void {
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
  }

  static getLogs(): StockLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_LOGS);
      return data ? JSON.parse(data) : [
        { id: 'l1', productId: '1', productName: 'NVIDIA GeForce RTX 5050 8GB', change: +5, reason: 'Restock Batch A', timestamp: '2026-08-27 10:15' },
        { id: 'l2', productId: '3', productName: 'Samsung 990 Pro 2TB PCIe Gen4', change: -4, reason: 'Customer order #9421', timestamp: '2026-08-27 14:20' },
      ];
    } catch {
      return [];
    }
  }

  static addLog(log: Omit<StockLog, 'id' | 'timestamp'>): void {
    const logs = this.getLogs();
    const newLog: StockLog = {
      ...log,
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    logs.unshift(newLog);
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs.slice(0, 50)));
  }
}
`,
      },
      'src/App.tsx': {
        path: 'src/App.tsx',
        language: 'tsx',
        content: `import React, { useState, useMemo } from 'react';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Edit3, 
  Trash2, 
  Layers, 
  Database,
  CheckCircle2,
  RefreshCw,
  Download
} from 'lucide-react';
import { Product } from './types';
import { SQLiteDatabase } from './database/sqlite';

export default function App() {
  const [products, setProducts] = useState<Product[]>(() => SQLiteDatabase.getProducts());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustAmount, setAdjustAmount] = useState(1);
  const [adjustReason, setAdjustReason] = useState('Routine Stock Inbound');

  // New product form
  const [newSku, setNewSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Hardware');
  const [newQty, setNewQty] = useState(10);
  const [newThreshold, setNewThreshold] = useState(5);
  const [newPrice, setNewPrice] = useState(99.99);
  const [newSupplier, setNewSupplier] = useState('Acme Supply');

  const categories = useMemo(() => {
    const set = new Set(products.map(p => p.category));
    return ['All', ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.supplier.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, searchQuery, selectedCategory]);

  const metrics = useMemo(() => {
    const totalItems = products.reduce((sum, p) => sum + p.quantity, 0);
    const totalValuation = products.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);
    const lowStockCount = products.filter(p => p.quantity <= p.minThreshold).length;
    return { totalItems, totalValuation, lowStockCount, count: products.length };
  }, [products]);

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSku || !newName) return;
    const newProd: Product = {
      id: 'prod_' + Date.now(),
      sku: newSku.toUpperCase(),
      name: newName,
      category: newCategory,
      quantity: Number(newQty),
      minThreshold: Number(newThreshold),
      unitPrice: Number(newPrice),
      supplier: newSupplier,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    const updated = [newProd, ...products];
    setProducts(updated);
    SQLiteDatabase.saveProducts(updated);
    SQLiteDatabase.addLog({
      productId: newProd.id,
      productName: newProd.name,
      change: newProd.quantity,
      reason: 'Initial Product Registration',
    });
    setShowAddModal(false);
    setNewSku('');
    setNewName('');
  };

  const handleStockAdjust = (delta: number) => {
    if (!adjustingProduct) return;
    const qtyChange = delta * adjustAmount;
    const newQty = Math.max(0, adjustingProduct.quantity + qtyChange);
    
    const updated = products.map(p => {
      if (p.id === adjustingProduct.id) {
        return { ...p, quantity: newQty, updatedAt: new Date().toISOString().split('T')[0] };
      }
      return p;
    });

    setProducts(updated);
    SQLiteDatabase.saveProducts(updated);
    SQLiteDatabase.addLog({
      productId: adjustingProduct.id,
      productName: adjustingProduct.name,
      change: qtyChange,
      reason: adjustReason || (delta > 0 ? 'Restock' : 'Dispatch / Sale'),
    });
    setAdjustingProduct(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this item from SQLite database?')) {
      const updated = products.filter(p => p.id !== id);
      setProducts(updated);
      SQLiteDatabase.saveProducts(updated);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Nexus Inventory OS
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                SQLite Active
              </span>
            </h1>
            <p className="text-xs text-slate-400">Real-time Stock, Valuation & Low-Stock Alerts</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </header>

      {/* Metrics Banner */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>TOTAL ITEMS IN STOCK</span>
              <Package className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">{metrics.totalItems.toLocaleString()}</div>
            <div className="text-xs text-slate-400 mt-1">Across {metrics.count} unique SKUs</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>STOCK VALUATION</span>
              <DollarSign className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              \${metrics.totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Relational DB valuation
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>LOW STOCK ALERTS</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400">{metrics.lowStockCount}</div>
            <div className="text-xs text-slate-400 mt-1">Items at or below safety limit</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>CATEGORIES</span>
              <Layers className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white">{categories.length - 1}</div>
            <div className="text-xs text-slate-400 mt-1">Active inventory taxonomy</div>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by SKU, Product Name, or Supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <Filter className="w-4 h-4 text-slate-400 mr-1" />
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={\`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap \${
                  selectedCategory === cat 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                }\`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">SKU & Product Name</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Stock Level</th>
                  <th className="px-6 py-3.5">Unit Price</th>
                  <th className="px-6 py-3.5">Total Value</th>
                  <th className="px-6 py-3.5">Supplier</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      No products match your search query.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(p => {
                    const isLow = p.quantity <= p.minThreshold;
                    return (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-white">{p.name}</div>
                          <div className="text-xs text-emerald-400 font-mono mt-0.5">{p.sku}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 text-xs rounded-md bg-slate-800 border border-slate-700 text-slate-300">
                            {p.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={\`font-mono font-bold \${isLow ? 'text-amber-400' : 'text-slate-100'}\`}>
                              {p.quantity}
                            </span>
                            {isLow && (
                              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                                LOW
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">Min: {p.minThreshold}</div>
                        </td>
                        <td className="px-6 py-4 font-mono">
                          \${p.unitPrice.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 font-mono font-semibold text-slate-200">
                          \${(p.quantity * p.unitPrice).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400">
                          {p.supplier}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setAdjustingProduct(p);
                              setAdjustAmount(1);
                            }}
                            className="px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded transition cursor-pointer"
                          >
                            Adjust
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1 text-slate-400 hover:text-red-400 transition cursor-pointer"
                            title="Delete item"
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              Register New Inventory Item
            </h2>
            <form onSubmit={handleAddProduct} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">SKU Code</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. GPU-5050-8G"
                  value={newSku} 
                  onChange={e => setNewSku(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 uppercase font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Product Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. NVIDIA RTX 5050 OC Edition"
                  value={newName} 
                  onChange={e => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
                  <input 
                    type="text"
                    value={newCategory} 
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Supplier</label>
                  <input 
                    type="text" 
                    value={newSupplier} 
                    onChange={e => setNewSupplier(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Quantity</label>
                  <input 
                    type="number" 
                    min="0"
                    value={newQty} 
                    onChange={e => setNewQty(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Min Threshold</label>
                  <input 
                    type="number" 
                    min="1"
                    value={newThreshold} 
                    onChange={e => setNewThreshold(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Unit Price (\$) </label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={newPrice} 
                    onChange={e => setNewPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition shadow cursor-pointer"
                >
                  Commit to SQLite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-base font-bold text-white mb-2">Adjust Stock Level</h2>
            <p className="text-xs text-slate-400 mb-4">{adjustingProduct.name} ({adjustingProduct.sku})</p>
            
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-4 flex justify-between items-center">
              <div>
                <span className="text-xs text-slate-400">Current Stock</span>
                <div className="text-xl font-bold text-white font-mono">{adjustingProduct.quantity} units</div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Unit Price</span>
                <div className="text-xl font-bold text-emerald-400 font-mono">\${adjustingProduct.unitPrice.toFixed(2)}</div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Adjustment Quantity</label>
                <input 
                  type="number" 
                  min="1" 
                  value={adjustAmount} 
                  onChange={e => setAdjustAmount(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Audit Trail Reason</label>
                <input 
                  type="text" 
                  value={adjustReason} 
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <button
                onClick={() => handleStockAdjust(-1)}
                className="flex-1 py-2.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 font-medium transition cursor-pointer"
              >
                - Deduct ({adjustAmount})
              </button>
              <button
                onClick={() => handleStockAdjust(1)}
                className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition shadow cursor-pointer"
              >
                + Restock ({adjustAmount})
              </button>
            </div>
            <button
              onClick={() => setAdjustingProduct(null)}
              className="w-full mt-2 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
`,
      },
    },
  },

  expense: {
    id: 'expense',
    name: 'modern-expense-tracker',
    description: 'Modern expense tracker with dashboard, expense logs, category breakdown, monthly statistics, search, dark mode, and local database.',
    prompt: 'Build a modern expense tracker with dashboard, add expense, categories, monthly statistics, search, dark mode, and local database.',
    defaultPlan: [
      'Create React frontend and dashboard shell',
      'Create expense registration form with category tags',
      'Implement monthly budgeting and category breakdown logic',
      'Add search and date filtering',
      'Add responsive analytics bars and charts',
      'Create SQLite/local storage persistence engine',
      'Add dark/light theme switching',
      'Run build and verify syntax',
      'Start live preview',
    ],
    files: {
      'package.json': {
        path: 'package.json',
        language: 'json',
        content: JSON.stringify(
          {
            name: 'modern-expense-tracker',
            private: true,
            version: '1.0.0',
            type: 'module',
            scripts: {
              dev: 'vite',
              build: 'vite build',
              preview: 'vite preview',
            },
            dependencies: {
              react: '^18.3.1',
              'react-dom': '^18.3.1',
              'lucide-react': '^0.468.0',
            },
            devDependencies: {
              '@types/react': '^18.3.18',
              '@types/react-dom': '^18.3.5',
              '@types/node': '^22.14.0',
              '@vitejs/plugin-react': '4.3.4',
              '@tailwindcss/vite': '^4.1.14',
              tailwindcss: '^4.1.14',
              typescript: '^5.7.3',
              vite: '6.4.3',
            },
          },
          null,
          2
        ),
      },
      'vite.config.ts': {
        path: 'vite.config.ts',
        language: 'typescript',
        content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
`,
      },
      'src/App.tsx': {
        path: 'src/App.tsx',
        language: 'tsx',
        content: `import React, { useState, useMemo } from 'react';
import { 
  CreditCard, 
  TrendingDown, 
  TrendingUp, 
  Plus, 
  Search, 
  Calendar, 
  Tag, 
  Trash2, 
  PieChart, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign
} from 'lucide-react';

interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'expense' | 'income';
  category: string;
  date: string;
  note?: string;
}

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: '1', title: 'AWS Cloud Hosting', amount: 84.50, type: 'expense', category: 'Infrastructure', date: '2026-08-25', note: 'Monthly cloud run compute' },
  { id: '2', title: 'Client Consulting Retainer', amount: 3500.00, type: 'income', category: 'Freelance', date: '2026-08-24', note: 'Sprint 3 delivery' },
  { id: '3', title: 'Figma Team Subscription', amount: 45.00, type: 'expense', category: 'Software', date: '2026-08-22', note: 'Design seats' },
  { id: '4', title: 'Hardware Lab RTX 5050 Unit', amount: 399.99, type: 'expense', category: 'Hardware', date: '2026-08-20', note: 'Local AI GPU Testbed' },
  { id: '5', title: 'Stripe SaaS Payout', amount: 1850.25, type: 'income', category: 'Products', date: '2026-08-18', note: 'Monthly app subscriptions' },
  { id: '6', title: 'Office Fiber Internet', amount: 79.99, type: 'expense', category: 'Utilities', date: '2026-08-15', note: 'Gigabit line' },
];

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('expense_tracker_db_v1');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [category, setCategory] = useState('General');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const saveToLocal = (newTx: Transaction[]) => {
    setTransactions(newTx);
    localStorage.setItem('expense_tracker_db_v1', JSON.stringify(newTx));
  };

  const totals = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const net = income - expense;
    return { income, expense, net };
  }, [transactions]);

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            t.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || t.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [transactions, searchQuery, filterType]);

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [transactions]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;
    const item: Transaction = {
      id: 'tx_' + Date.now(),
      title,
      amount: parseFloat(amount),
      type,
      category,
      date,
    };
    saveToLocal([item, ...transactions]);
    setShowAddModal(false);
    setTitle('');
    setAmount('');
  };

  const handleDelete = (id: string) => {
    saveToLocal(transactions.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      <header className="border-b border-neutral-800 bg-neutral-900/90 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Vault Expense & Finance Tracker</h1>
            <p className="text-xs text-neutral-400">Offline SQLite & Local Storage Engine</p>
          </div>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition shadow cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Entry
        </button>
      </header>

      <main className="flex-1 p-6 max-w-6xl w-full mx-auto space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
              <span>NET BALANCE</span>
              <DollarSign className="w-4 h-4 text-neutral-400" />
            </div>
            <div className={\`text-2xl font-bold font-mono \${totals.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}\`}>
              \${totals.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-neutral-500 mt-1">Real-time ledger net balance</div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
              <span>TOTAL INFLOW</span>
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              +\${totals.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-neutral-500 mt-1">Total credited revenue</div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
              <span>TOTAL OUTFLOW</span>
              <ArrowDownRight className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-rose-400">
              -\${totals.expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-neutral-500 mt-1">Total debited expenses</div>
          </div>
        </div>

        {/* Breakdown & Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Table */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input 
                  type="text" 
                  placeholder="Search ledger..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg pl-9 pr-3 py-1.5 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
                {(['all', 'expense', 'income'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={\`px-3 py-1 text-xs font-medium rounded transition capitalize cursor-pointer \${
                      filterType === t ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-neutral-200'
                    }\`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-neutral-800 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Transaction History
              </div>
              <div className="divide-y divide-neutral-800">
                {filtered.map(t => (
                  <div key={t.id} className="p-4 flex items-center justify-between hover:bg-neutral-800/40 transition">
                    <div className="flex items-center gap-3">
                      <div className={\`w-9 h-9 rounded-lg flex items-center justify-center \${
                        t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }\`}>
                        {t.type === 'income' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-medium text-white text-sm">{t.title}</div>
                        <div className="text-xs text-neutral-400 flex items-center gap-2 mt-0.5">
                          <span className="bg-neutral-800 px-2 py-0.5 rounded text-[11px]">{t.category}</span>
                          <span>{t.date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={\`font-mono font-bold text-sm \${
                        t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                      }\`}>
                        {t.type === 'income' ? '+' : '-'}\${t.amount.toFixed(2)}
                      </div>
                      <button 
                        onClick={() => handleDelete(t.id)}
                        className="text-neutral-500 hover:text-rose-400 p-1 transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Category Statistics */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-indigo-400" />
              Expense Distribution
            </h3>
            <div className="space-y-3">
              {categoryBreakdown.map(([cat, val]) => {
                const pct = totals.expense > 0 ? (val / totals.expense) * 100 : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs text-neutral-300 font-medium">
                      <span>{cat}</span>
                      <span className="font-mono">\${val.toFixed(2)} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: \`\${pct}%\` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6">
            <h2 className="text-base font-bold text-white mb-4">Add Transaction</h2>
            <form onSubmit={handleAdd} className="space-y-4 text-sm">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={\`flex-1 py-2 rounded-lg font-medium text-xs transition cursor-pointer \${
                    type === 'expense' ? 'bg-rose-600 text-white' : 'bg-neutral-800 text-neutral-400'
                  }\`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={\`flex-1 py-2 rounded-lg font-medium text-xs transition cursor-pointer \${
                    type === 'income' ? 'bg-emerald-600 text-white' : 'bg-neutral-800 text-neutral-400'
                  }\`}
                >
                  Income
                </button>
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Server hosting"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Amount (\$) </label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Category</label>
                  <select 
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Software">Software</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Products">Products</option>
                    <option value="Utilities">Utilities</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Date</label>
                <input 
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-neutral-800 text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
`,
      },
    },
  },

  crm: {
    id: 'crm',
    name: 'pipeline-crm-pro',
    description: 'Developer CRM with sales pipeline Kanban, contact management, deal metrics, and SQLite customer database.',
    prompt: 'Build a CRM with lead pipeline, deal stage tracking, customer contact list, revenue forecasts, and local database.',
    defaultPlan: [
      'Create React frontend and CRM workspace layout',
      'Create Kanban deal pipeline (Lead, Contacted, Proposal, Won, Lost)',
      'Add customer contact directory with quick search',
      'Create revenue forecasting and conversion metrics',
      'Implement SQLite/local storage persistence',
      'Add responsive styling and deal stage drag/move actions',
      'Run build and verify syntax',
      'Start live preview',
    ],
    files: {
      'package.json': {
        path: 'package.json',
        language: 'json',
        content: JSON.stringify(
          {
            name: 'pipeline-crm-pro',
            private: true,
            version: '1.0.0',
            type: 'module',
            scripts: {
              dev: 'vite',
              build: 'vite build',
              preview: 'vite preview',
            },
            dependencies: {
              react: '^18.3.1',
              'react-dom': '^18.3.1',
              'lucide-react': '^0.468.0',
            },
            devDependencies: {
              '@types/react': '^18.3.18',
              '@types/react-dom': '^18.3.5',
              '@types/node': '^22.14.0',
              '@vitejs/plugin-react': '4.3.4',
              '@tailwindcss/vite': '^4.1.14',
              tailwindcss: '^4.1.14',
              typescript: '^5.7.3',
              vite: '6.4.3',
            },
          },
          null,
          2
        ),
      },
      'vite.config.ts': {
        path: 'vite.config.ts',
        language: 'typescript',
        content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
`,
      },
      'src/App.tsx': {
        path: 'src/App.tsx',
        language: 'tsx',
        content: `import React, { useState, useMemo } from 'react';
import { 
  Users, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  Plus, 
  Search, 
  Building2, 
  Mail, 
  Phone, 
  ArrowRight,
  TrendingUp,
  MoreVertical
} from 'lucide-react';

interface Deal {
  id: string;
  clientName: string;
  company: string;
  value: number;
  stage: 'lead' | 'contacted' | 'proposal' | 'won' | 'lost';
  email: string;
  phone: string;
  notes: string;
}

const INITIAL_DEALS: Deal[] = [
  { id: '1', clientName: 'Sarah Jenkins', company: 'Apex Robotics AI', value: 24500, stage: 'proposal', email: 'sarah@apexrobotics.io', phone: '+1 (415) 890-1200', notes: 'Deploying edge vision models' },
  { id: '2', clientName: 'Marcus Vance', company: 'Vance Cloudworks', value: 12000, stage: 'won', email: 'm.vance@vancecloud.com', phone: '+1 (206) 441-9988', notes: 'Annual enterprise license' },
  { id: '3', clientName: 'Elena Rostova', company: 'HyperScale Labs', value: 48000, stage: 'contacted', email: 'elena@hyperscale.dev', phone: '+1 (650) 332-1109', notes: 'Evaluating local RTX 5050 GPU nodes' },
  { id: '4', clientName: 'David Chen', company: 'Quantum Retail', value: 8500, stage: 'lead', email: 'dchen@quantumretail.com', phone: '+1 (512) 778-3012', notes: 'Inbound demo request' },
  { id: '5', clientName: 'Rachel Adams', company: 'Nordic Health Systems', value: 36000, stage: 'proposal', email: 'radams@nordichealth.org', phone: '+44 20 7946 0991', notes: 'HIPAA compliant local AI pipeline' },
];

export default function App() {
  const [deals, setDeals] = useState<Deal[]>(() => {
    const saved = localStorage.getItem('crm_deals_db_v1');
    return saved ? JSON.parse(saved) : INITIAL_DEALS;
  });
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Deal state
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [val, setVal] = useState('15000');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const save = (newDeals: Deal[]) => {
    setDeals(newDeals);
    localStorage.setItem('crm_deals_db_v1', JSON.stringify(newDeals));
  };

  const moveStage = (id: string, nextStage: Deal['stage']) => {
    save(deals.map(d => d.id === id ? { ...d, stage: nextStage } : d));
  };

  const pipelineStages: { id: Deal['stage']; title: string; color: string }[] = [
    { id: 'lead', title: 'New Leads', color: 'border-blue-500/50' },
    { id: 'contacted', title: 'In Contact', color: 'border-amber-500/50' },
    { id: 'proposal', title: 'Proposal Sent', color: 'border-purple-500/50' },
    { id: 'won', title: 'Closed Won', color: 'border-emerald-500/50' },
  ];

  const metrics = useMemo(() => {
    const totalPipeline = deals.filter(d => d.stage !== 'lost').reduce((s, d) => s + d.value, 0);
    const wonRevenue = deals.filter(d => d.stage === 'won').reduce((s, d) => s + d.value, 0);
    const winRate = deals.length > 0 ? (deals.filter(d => d.stage === 'won').length / deals.length) * 100 : 0;
    return { totalPipeline, wonRevenue, winRate };
  }, [deals]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !company) return;
    const newDeal: Deal = {
      id: 'deal_' + Date.now(),
      clientName: name,
      company,
      value: parseFloat(val) || 0,
      stage: 'lead',
      email,
      phone,
      notes: 'Direct client lead registration',
    };
    save([newDeal, ...deals]);
    setShowAddModal(false);
    setName('');
    setCompany('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-900/90 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">HyperCRM Sales Engine</h1>
            <p className="text-xs text-slate-400">Deal Pipeline & Client Intelligence</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition shadow cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Opportunity
        </button>
      </header>

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-xs text-slate-400 font-medium">TOTAL ACTIVE PIPELINE</div>
            <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
              \${metrics.totalPipeline.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1">Weighted opportunities</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-xs text-slate-400 font-medium">CLOSED WON REVENUE</div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
              \${metrics.wonRevenue.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1">Realized contracts</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-xs text-slate-400 font-medium">CONVERSION WIN RATE</div>
            <div className="text-2xl font-bold font-mono text-purple-400 mt-1">
              {metrics.winRate.toFixed(0)}%
            </div>
            <div className="text-xs text-slate-500 mt-1">Across all pipeline stages</div>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text"
            placeholder="Search deals, contacts, or companies..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {pipelineStages.map(stage => {
            const stageDeals = deals.filter(d => d.stage === stage.id && (
              d.clientName.toLowerCase().includes(search.toLowerCase()) ||
              d.company.toLowerCase().includes(search.toLowerCase())
            ));
            const stageTotal = stageDeals.reduce((s, d) => s + d.value, 0);

            return (
              <div key={stage.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col min-h-[420px]">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">{stage.title}</h3>
                    <span className="text-xs text-slate-400 font-mono">\${stageTotal.toLocaleString()}</span>
                  </div>
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-xs font-mono flex items-center justify-center text-slate-300">
                    {stageDeals.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {stageDeals.map(deal => (
                    <div key={deal.id} className="bg-slate-900 border border-slate-800 rounded-lg p-3 hover:border-slate-700 transition space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-white">{deal.company}</span>
                        <span className="font-mono text-xs font-semibold text-cyan-400">\${deal.value.toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-slate-300 font-medium">{deal.clientName}</div>
                      <div className="text-[11px] text-slate-500 truncate">{deal.email}</div>
                      
                      <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center text-[11px]">
                        <span className="text-slate-500 truncate max-w-[120px]">{deal.notes}</span>
                        <div className="flex gap-1">
                          {stage.id !== 'won' && (
                            <button
                              onClick={() => {
                                const nextMap: Record<Deal['stage'], Deal['stage']> = {
                                  lead: 'contacted',
                                  contacted: 'proposal',
                                  proposal: 'won',
                                  won: 'won',
                                  lost: 'lead',
                                };
                                moveStage(deal.id, nextMap[stage.id]);
                              }}
                              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 transition cursor-pointer"
                            >
                              Advance →
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Add Deal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6">
            <h2 className="text-base font-bold text-white mb-4">Register New Deal</h2>
            <form onSubmit={handleAdd} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Company / Organization</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Acme AI Systems"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Primary Contact</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Jane Doe"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Deal Value (\$) </label>
                  <input 
                    type="number" 
                    required
                    value={val}
                    onChange={e => setVal(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Email</label>
                  <input 
                    type="email" 
                    placeholder="contact@co.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow"
                >
                  Create Opportunity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
`,
      },
    },
  },
  calculator: {
    id: 'calculator',
    name: 'modern-responsive-calculator',
    description: 'Precision calculator with addition, subtraction, multiplication, division, clear, decimal support, history tape, keyboard shortcuts, and responsive UI.',
    prompt: 'Create a calculator with addition, subtraction, multiplication, division, clear, decimal support, and responsive UI.',
    defaultPlan: [
      'Create React calculator frontend with responsive UI',
      'Implement calculation engine with addition, subtraction, multiplication, division, and decimals',
      'Add clear, all-clear, sign inversion, percentage, and backspace operations',
      'Implement calculation history tape and clipboard copying',
      'Add keyboard navigation and responsive mobile/desktop layout',
      'Verify build toolchain and start live preview',
    ],
    files: {
      'package.json': {
        path: 'package.json',
        language: 'json',
        content: JSON.stringify(
          {
            name: 'modern-responsive-calculator',
            private: true,
            version: '1.0.0',
            type: 'module',
            scripts: {
              dev: 'vite',
              build: 'vite build',
              preview: 'vite preview',
            },
            dependencies: {
              react: '^18.3.1',
              'react-dom': '^18.3.1',
              'lucide-react': '^0.468.0',
            },
            devDependencies: {
              '@types/react': '^18.3.18',
              '@types/react-dom': '^18.3.5',
              '@types/node': '^22.14.0',
              '@vitejs/plugin-react': '4.3.4',
              '@tailwindcss/vite': '^4.1.14',
              tailwindcss: '^4.1.14',
              typescript: '^5.7.3',
              vite: '6.4.3',
            },
          },
          null,
          2
        ),
      },
      'vite.config.ts': {
        path: 'vite.config.ts',
        language: 'typescript',
        content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
`,
      },
      'index.html': {
        path: 'index.html',
        language: 'html',
        content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Responsive Precision Calculator</title>
  </head>
  <body class="bg-slate-950 text-slate-100">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
      },
      'src/main.tsx': {
        path: 'src/main.tsx',
        language: 'typescript',
        content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
      },
      'src/index.css': {
        path: 'src/index.css',
        language: 'css',
        content: `@import "tailwindcss";

:root {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  color-scheme: dark;
}

body {
  margin: 0;
  min-height: 100vh;
  background-color: #090d16;
}
`,
      },
      'src/App.tsx': {
        path: 'src/App.tsx',
        language: 'tsx',
        content: `import React, { useState, useEffect, useCallback } from 'react';
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
      setEquation(\`\${inputValue} \${nextOp}\`);
    } else if (operation) {
      if (waitingForNewOperand) {
        setOperation(nextOp);
        setEquation(\`\${prevValue} \${nextOp}\`);
        return;
      }
      const result = calculate(prevValue, inputValue, operation);
      const rounded = Math.round(result * 100000000) / 100000000;
      setPrevValue(rounded);
      setDisplay(String(rounded));
      setEquation(\`\${rounded} \${nextOp}\`);
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
      const fullExpression = \`\${prevValue} \${operation} \${inputValue}\`;

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
      setEquation(\`\${fullExpression} =\`);
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
              className={\`p-2 rounded-lg transition-colors \${showHistory ? 'text-indigo-400 bg-indigo-950/50 border border-indigo-800/50' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'}\`}
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
              className={\`h-14 sm:h-16 rounded-2xl border font-bold text-xl transition-all active:scale-95 flex items-center justify-center shadow-sm \${operation === '÷' && waitingForNewOperand ? 'bg-indigo-600 text-white border-indigo-400 ring-2 ring-indigo-500/50' : 'bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border-indigo-500/30'}\`}
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
              className={\`h-14 sm:h-16 rounded-2xl border font-bold text-xl transition-all active:scale-95 flex items-center justify-center shadow-sm \${operation === '×' && waitingForNewOperand ? 'bg-indigo-600 text-white border-indigo-400 ring-2 ring-indigo-500/50' : 'bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border-indigo-500/30'}\`}
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
              className={\`h-14 sm:h-16 rounded-2xl border font-bold text-xl transition-all active:scale-95 flex items-center justify-center shadow-sm \${operation === '-' && waitingForNewOperand ? 'bg-indigo-600 text-white border-indigo-400 ring-2 ring-indigo-500/50' : 'bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border-indigo-500/30'}\`}
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
              className={\`h-14 sm:h-16 rounded-2xl border font-bold text-xl transition-all active:scale-95 flex items-center justify-center shadow-sm \${operation === '+' && waitingForNewOperand ? 'bg-indigo-600 text-white border-indigo-400 ring-2 ring-indigo-500/50' : 'bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border-indigo-500/30'}\`}
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
`,
      },
    },
  },
};
