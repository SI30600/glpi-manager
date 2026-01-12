import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { 
  Monitor, 
  Search, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  Eye
} from "lucide-react";
import { toast } from "sonner";

export default function Computers() {
  const navigate = useNavigate();
  const [computers, setComputers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchComputers = async () => {
    try {
      setLoading(true);
      const data = await glpiApi.getComputers(offset, limit);
      setComputers(data.data || []);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error("Erreur lors du chargement des ordinateurs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComputers();
  }, [offset]);

  const filteredComputers = computers.filter(comp =>
    comp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comp.serial?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6" data-testid="computers-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 font-mono">Ordinateurs</h2>
          <p className="text-zinc-500 text-sm">Inventaire des postes de travail</p>
        </div>
        <Button 
          onClick={fetchComputers}
          disabled={loading}
          className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
          data-testid="refresh-computers-btn"
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
              placeholder="Rechercher par nom ou numéro de série..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-zinc-950 border-zinc-800 focus:border-amber-500 text-zinc-100"
              data-testid="search-input"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 font-mono text-lg flex items-center gap-2">
            <Monitor className="h-5 w-5 text-amber-500" />
            Liste des ordinateurs ({total})
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
                <Table className="data-table" data-testid="computers-table">
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-transparent">
                      <TableHead className="text-zinc-400">Nom</TableHead>
                      <TableHead className="text-zinc-400">N° Série</TableHead>
                      <TableHead className="text-zinc-400">Modèle</TableHead>
                      <TableHead className="text-zinc-400">Fabricant</TableHead>
                      <TableHead className="text-zinc-400">Dernière MàJ</TableHead>
                      <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredComputers.length > 0 ? (
                      filteredComputers.map((computer) => (
                        <TableRow 
                          key={computer.id} 
                          className="border-zinc-800 hover:bg-amber-500/5 cursor-pointer"
                          onClick={() => navigate(`/computers/${computer.id}`)}
                          data-testid={`computer-row-${computer.id}`}
                        >
                          <TableCell className="text-zinc-100 font-medium">
                            <div className="flex items-center gap-2">
                              <Monitor className="h-4 w-4 text-amber-500" />
                              {computer.name || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell className="text-zinc-400 font-mono text-sm">
                            {computer.serial || 'N/A'}
                          </TableCell>
                          <TableCell className="text-zinc-400">
                            {computer.computermodels_id || 'N/A'}
                          </TableCell>
                          <TableCell className="text-zinc-400">
                            {computer.manufacturers_id || 'N/A'}
                          </TableCell>
                          <TableCell className="text-zinc-500 font-mono text-xs">
                            {computer.date_mod || 'N/A'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="hover:bg-amber-500/10 hover:text-amber-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/computers/${computer.id}`);
                              }}
                              data-testid={`view-computer-${computer.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-zinc-500 py-8">
                          Aucun ordinateur trouvé
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
                    data-testid="prev-page"
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
                    data-testid="next-page"
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
