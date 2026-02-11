import { store } from '@/lib/store';
import { Package, Cpu, AlertTriangle, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const threads = store.getThreads();
  const machines = store.getMachines();
  const designs = store.getDesigns();
  const lowStock = store.getLowStockThreads();
  const onMachine = store.getThreadsOnMachines();

  const totalSpools = threads.reduce((sum, t) => sum + t.qtyOnHand, 0);
  const filledSlots = machines.reduce((sum, m) => sum + m.slots.filter(s => s.threadId).length, 0);
  const totalSlots = machines.reduce((sum, m) => sum + m.maxSlots, 0);

  const stats = [
    { label: 'Thread SKUs', value: threads.length, sub: `${totalSpools} total units`, icon: Package, color: 'bg-primary' },
    { label: 'Machines', value: machines.length, sub: `${filledSlots}/${totalSlots} slots filled`, icon: Cpu, color: 'bg-info' },
    { label: 'Low Stock', value: lowStock.length, sub: 'Need reorder', icon: AlertTriangle, color: lowStock.length > 0 ? 'bg-warning' : 'bg-success' },
    { label: 'Designs', value: designs.length, sub: 'Thread palettes', icon: FileText, color: 'bg-secondary' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Your studio at a glance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(stat => (
          <div key={stat.label} className="stat-card flex items-start gap-4">
            <div className={`${stat.color} rounded-lg p-2.5 text-primary-foreground`}>
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold font-display">{stat.value}</p>
              <p className="text-sm font-medium">{stat.label}</p>
              <p className="text-xs text-muted-foreground">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Low stock alerts */}
      {lowStock.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display font-semibold text-lg mb-3 flex items-center gap-2">
            <AlertTriangle size={18} className="text-warning" /> Low Stock Alerts
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStock.map(t => (
              <div key={t.id} className="stat-card flex items-center gap-3">
                <div className="thread-chip shrink-0" style={{ backgroundColor: t.hex }} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{t.colorName}</p>
                  <p className="text-xs text-muted-foreground">{t.sku} · {t.manufacturer}</p>
                </div>
                <span className="text-sm font-bold text-warning shrink-0">{t.qtyOnHand} left</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/inventory" className="stat-card group hover:border-primary/30 transition-colors">
          <h3 className="font-display font-semibold mb-1">Thread Inventory</h3>
          <p className="text-sm text-muted-foreground">Browse and manage {threads.length} thread SKUs</p>
        </Link>
        <Link to="/machines" className="stat-card group hover:border-primary/30 transition-colors">
          <h3 className="font-display font-semibold mb-1">Machines</h3>
          <p className="text-sm text-muted-foreground">View {machines.length} machines and their thread slots</p>
        </Link>
        <Link to="/designs" className="stat-card group hover:border-primary/30 transition-colors">
          <h3 className="font-display font-semibold mb-1">Designs</h3>
          <p className="text-sm text-muted-foreground">Manage {designs.length} design thread palettes</p>
        </Link>
      </div>
    </div>
  );
}
