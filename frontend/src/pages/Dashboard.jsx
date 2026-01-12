import { useEffect, useState } from "react";
import { glpiApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Monitor, 
  Package, 
  Tv, 
  Printer, 
  Network, 
  Phone,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

const COLORS = ['#F59E0B', '#EA580C', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await glpiApi.getStats();
      setStats(data);
      toast.success("Données synchronisées avec GLPI");
    } catch (err) {
      setError("Impossible de récupérer les statistiques");
      toast.error("Erreur de connexion GLPI");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const kpiCards = [
    { label: "Ordinateurs", value: stats?.total_computers || 0, icon: Monitor, color: "text-amber-500" },
    { label: "Logiciels", value: stats?.total_software || 0, icon: Package, color: "text-orange-500" },
    { label: "Écrans", value: stats?.total_monitors || 0, icon: Tv, color: "text-emerald-500" },
    { label: "Imprimantes", value: stats?.total_printers || 0, icon: Printer, color: "text-blue-500" },
    { label: "Équip. Réseau", value: stats?.total_network_devices || 0, icon: Network, color: "text-purple-500" },
    { label: "Téléphones", value: stats?.total_phones || 0, icon: Phone, color: "text-pink-500" },
  ];

  const statusData = stats?.computers_by_status 
    ? Object.entries(stats.computers_by_status).map(([name, value]) => ({
        name: name || 'Non défini',
        value
      }))
    : [];

  const chartData = kpiCards.map(kpi => ({
    name: kpi.label,
    value: kpi.value
  }));

  if (error && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center" data-testid="dashboard-error">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-zinc-100 mb-2">Erreur de connexion</h2>
        <p className="text-zinc-400 mb-4">{error}</p>
        <Button onClick={fetchStats} className="bg-amber-500 hover:bg-amber-600 text-black">
          <RefreshCw className="h-4 w-4 mr-2" />
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 font-mono">Vue d'ensemble</h2>
          <p className="text-zinc-500 text-sm">Statistiques du parc informatique</p>
        </div>
        <Button 
          onClick={fetchStats} 
          disabled={loading}
          className="bg-amber-500 hover:bg-amber-600 text-black font-bold glow-amber-sm"
          data-testid="refresh-btn"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4" data-testid="kpi-grid">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card 
              key={kpi.label} 
              className="kpi-card bg-zinc-900/50 border-zinc-800"
              data-testid={`kpi-${kpi.label.toLowerCase().replace(/\s/g, '-')}`}
            >
              <CardContent className="p-4">
                {loading ? (
                  <>
                    <Skeleton className="h-8 w-8 rounded mb-2" />
                    <Skeleton className="h-8 w-16 mb-1" />
                    <Skeleton className="h-4 w-20" />
                  </>
                ) : (
                  <>
                    <Icon className={`h-8 w-8 ${kpi.color} mb-2`} />
                    <p className="text-3xl font-bold text-zinc-100 font-mono">{kpi.value}</p>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">{kpi.label}</p>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <Card className="bg-zinc-900/50 border-zinc-800" data-testid="inventory-chart">
          <CardHeader>
            <CardTitle className="text-zinc-100 font-mono text-lg">Inventaire par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#A1A1AA', fontSize: 10 }}
                    axisLine={{ stroke: '#27272A' }}
                  />
                  <YAxis 
                    tick={{ fill: '#A1A1AA', fontSize: 12 }}
                    axisLine={{ stroke: '#27272A' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#18181B', 
                      border: '1px solid #27272A',
                      borderRadius: '8px',
                      color: '#FAFAFA'
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#F59E0B" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart - Status */}
        <Card className="bg-zinc-900/50 border-zinc-800" data-testid="status-chart">
          <CardHeader>
            <CardTitle className="text-zinc-100 font-mono text-lg">Ordinateurs par statut</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#F59E0B"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={{ stroke: '#A1A1AA' }}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#18181B', 
                      border: '1px solid #27272A',
                      borderRadius: '8px',
                      color: '#FAFAFA'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-zinc-500">
                Aucune donnée de statut disponible
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Updates */}
      <Card className="bg-zinc-900/50 border-zinc-800" data-testid="recent-updates">
        <CardHeader>
          <CardTitle className="text-zinc-100 font-mono text-lg">Mises à jour récentes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : stats?.recent_updates?.length > 0 ? (
            <div className="space-y-2">
              {stats.recent_updates.map((item, index) => (
                <div 
                  key={item.id || index}
                  className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50 hover:border-amber-500/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Monitor className="h-5 w-5 text-amber-500" />
                    <span className="text-zinc-100 font-medium">{item.name}</span>
                  </div>
                  <span className="text-xs text-zinc-500 font-mono">{item.date}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-500 text-center py-8">Aucune mise à jour récente</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
