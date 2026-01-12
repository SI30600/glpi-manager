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
import { Network as NetworkIcon, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function Network() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const data = await glpiApi.getNetworkEquipment();
      setDevices(data.data || []);
    } catch (err) {
      toast.error("Erreur lors du chargement des équipements réseau");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  return (
    <div className="space-y-6" data-testid="network-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 font-mono">Équipements Réseau</h2>
          <p className="text-zinc-500 text-sm">Switches, routeurs, points d'accès</p>
        </div>
        <Button 
          onClick={fetchDevices}
          disabled={loading}
          className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
          data-testid="refresh-network-btn"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Table */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 font-mono text-lg flex items-center gap-2">
            <NetworkIcon className="h-5 w-5 text-purple-500" />
            Liste des équipements ({devices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : devices.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="data-table" data-testid="network-table">
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400">Nom</TableHead>
                    <TableHead className="text-zinc-400">N° Série</TableHead>
                    <TableHead className="text-zinc-400">Type</TableHead>
                    <TableHead className="text-zinc-400">Emplacement</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devices.map((device) => (
                    <TableRow 
                      key={device.id} 
                      className="border-zinc-800 hover:bg-amber-500/5"
                      data-testid={`network-row-${device.id}`}
                    >
                      <TableCell className="text-zinc-100 font-medium">
                        <div className="flex items-center gap-2">
                          <NetworkIcon className="h-4 w-4 text-purple-500" />
                          {device.name || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-400 font-mono text-sm">
                        {device.serial || 'N/A'}
                      </TableCell>
                      <TableCell className="text-zinc-400">
                        {device.networkequipmenttypes_id || 'N/A'}
                      </TableCell>
                      <TableCell className="text-zinc-400">
                        {device.locations_id || 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <NetworkIcon className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-500">Aucun équipement réseau dans l'inventaire</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
