import { useEffect, useState } from "react";
import { glpiApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tv, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function Monitors() {
  const [monitors, setMonitors] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMonitors = async () => {
    try {
      setLoading(true);
      const data = await glpiApi.getMonitors();
      setMonitors(data.data || []);
    } catch (err) {
      toast.error("Erreur lors du chargement des écrans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitors();
  }, []);

  return (
    <div className="space-y-6" data-testid="monitors-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 font-mono">Écrans</h2>
          <p className="text-zinc-500 text-sm">Inventaire des moniteurs</p>
        </div>
        <Button 
          onClick={fetchMonitors}
          disabled={loading}
          className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
          data-testid="refresh-monitors-btn"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Table */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 font-mono text-lg flex items-center gap-2">
            <Tv className="h-5 w-5 text-emerald-500" />
            Liste des écrans ({monitors.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : monitors.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="data-table" data-testid="monitors-table">
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400">Nom</TableHead>
                    <TableHead className="text-zinc-400">N° Série</TableHead>
                    <TableHead className="text-zinc-400">Modèle</TableHead>
                    <TableHead className="text-zinc-400">Fabricant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monitors.map((monitor) => (
                    <TableRow 
                      key={monitor.id} 
                      className="border-zinc-800 hover:bg-amber-500/5"
                      data-testid={`monitor-row-${monitor.id}`}
                    >
                      <TableCell className="text-zinc-100 font-medium">
                        <div className="flex items-center gap-2">
                          <Tv className="h-4 w-4 text-emerald-500" />
                          {monitor.name || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-400 font-mono text-sm">
                        {monitor.serial || 'N/A'}
                      </TableCell>
                      <TableCell className="text-zinc-400">
                        {monitor.monitormodels_id || 'N/A'}
                      </TableCell>
                      <TableCell className="text-zinc-400">
                        {monitor.manufacturers_id || 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Tv className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-500">Aucun écran dans l'inventaire</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
