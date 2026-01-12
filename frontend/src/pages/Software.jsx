import { useEffect, useState } from "react";
import { glpiApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package, Search, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export default function Software() {
  const [software, setSoftware] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchSoftware = async () => {
    try {
      setLoading(true);
      const data = await glpiApi.getSoftware(offset, limit);
      setSoftware(data.data || []);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error("Erreur lors du chargement des logiciels");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSoftware();
  }, [offset]);

  const filteredSoftware = software.filter(sw =>
    sw.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6" data-testid="software-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 font-mono">Logiciels</h2>
          <p className="text-zinc-500 text-sm">Inventaire des logiciels installés</p>
        </div>
        <Button 
          onClick={fetchSoftware}
          disabled={loading}
          className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
          data-testid="refresh-software-btn"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Search */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Rechercher un logiciel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-zinc-950 border-zinc-800 focus:border-amber-500 text-zinc-100"
              data-testid="search-software-input"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 font-mono text-lg flex items-center gap-2">
            <Package className="h-5 w-5 text-amber-500" />
            Liste des logiciels ({total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table className="data-table" data-testid="software-table">
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-transparent">
                      <TableHead className="text-zinc-400">Nom</TableHead>
                      <TableHead className="text-zinc-400">Catégorie</TableHead>
                      <TableHead className="text-zinc-400">Éditeur</TableHead>
                      <TableHead className="text-zinc-400">Dernière MàJ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSoftware.length > 0 ? (
                      filteredSoftware.map((sw) => (
                        <TableRow 
                          key={sw.id} 
                          className="border-zinc-800 hover:bg-amber-500/5"
                          data-testid={`software-row-${sw.id}`}
                        >
                          <TableCell className="text-zinc-100 font-medium">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-orange-500" />
                              {sw.name || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell className="text-zinc-400">
                            {sw.softwarecategories_id || 'Non catégorisé'}
                          </TableCell>
                          <TableCell className="text-zinc-400">
                            {sw.manufacturers_id || 'N/A'}
                          </TableCell>
                          <TableCell className="text-zinc-500 font-mono text-xs">
                            {sw.date_mod || 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-zinc-500 py-8">
                          Aucun logiciel trouvé
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800">
                <p className="text-sm text-zinc-500">
                  Affichage {offset + 1} - {Math.min(offset + limit, total)} sur {total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOffset(Math.max(0, offset - limit))}
                    disabled={offset === 0}
                    className="border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOffset(offset + limit)}
                    disabled={offset + limit >= total}
                    className="border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
