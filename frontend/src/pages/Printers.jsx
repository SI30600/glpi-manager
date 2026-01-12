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
import { Printer, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function Printers() {
  const [printers, setPrinters] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPrinters = async () => {
    try {
      setLoading(true);
      const data = await glpiApi.getPrinters();
      setPrinters(data.data || []);
    } catch (err) {
      toast.error("Erreur lors du chargement des imprimantes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrinters();
  }, []);

  return (
    <div className="space-y-6" data-testid="printers-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 font-mono">Imprimantes</h2>
          <p className="text-zinc-500 text-sm">Inventaire des imprimantes</p>
        </div>
        <Button 
          onClick={fetchPrinters}
          disabled={loading}
          className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
          data-testid="refresh-printers-btn"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Table */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 font-mono text-lg flex items-center gap-2">
            <Printer className="h-5 w-5 text-blue-500" />
            Liste des imprimantes ({printers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : printers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="data-table" data-testid="printers-table">
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400">Nom</TableHead>
                    <TableHead className="text-zinc-400">N° Série</TableHead>
                    <TableHead className="text-zinc-400">Modèle</TableHead>
                    <TableHead className="text-zinc-400">Emplacement</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {printers.map((printer) => (
                    <TableRow 
                      key={printer.id} 
                      className="border-zinc-800 hover:bg-amber-500/5"
                      data-testid={`printer-row-${printer.id}`}
                    >
                      <TableCell className="text-zinc-100 font-medium">
                        <div className="flex items-center gap-2">
                          <Printer className="h-4 w-4 text-blue-500" />
                          {printer.name || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-400 font-mono text-sm">
                        {printer.serial || 'N/A'}
                      </TableCell>
                      <TableCell className="text-zinc-400">
                        {printer.printermodels_id || 'N/A'}
                      </TableCell>
                      <TableCell className="text-zinc-400">
                        {printer.locations_id || 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Printer className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-500">Aucune imprimante dans l'inventaire</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
