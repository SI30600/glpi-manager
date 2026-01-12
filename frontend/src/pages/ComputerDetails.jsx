import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { glpiApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Monitor, 
  Cpu, 
  HardDrive, 
  Network, 
  User,
  Calendar,
  Hash,
  Building,
  MapPin
} from "lucide-react";
import { toast } from "sonner";

export default function ComputerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [computer, setComputer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const data = await glpiApi.getComputerDetails(id);
        setComputer(data);
      } catch (err) {
        toast.error("Erreur lors du chargement des détails");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDetails();
    }
  }, [id]);

  const InfoRow = ({ icon: Icon, label, value, mono = false }) => (
    <div className="flex items-start gap-3 py-3 border-b border-zinc-800/50 last:border-0">
      <Icon className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">{label}</p>
        <p className={`text-zinc-100 ${mono ? 'font-mono text-sm' : ''} break-all`}>
          {value || 'Non renseigné'}
        </p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!computer) {
    return (
      <div className="text-center py-16">
        <Monitor className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-zinc-100 mb-2">Ordinateur non trouvé</h2>
        <Button 
          onClick={() => navigate('/computers')}
          className="bg-amber-500 hover:bg-amber-600 text-black"
        >
          Retour à la liste
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="computer-details">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => navigate('/computers')}
        className="text-zinc-400 hover:text-amber-500"
        data-testid="back-btn"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour aux ordinateurs
      </Button>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Monitor className="h-8 w-8 text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 font-mono">{computer.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
              ID: {computer.id}
            </Badge>
            {computer.is_deleted === 1 && (
              <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                Supprimé
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Info */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 font-mono text-lg flex items-center gap-2">
              <Monitor className="h-5 w-5 text-amber-500" />
              Informations générales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow icon={Hash} label="Numéro de série" value={computer.serial} mono />
            <InfoRow icon={Hash} label="Autre N° série" value={computer.otherserial} mono />
            <InfoRow icon={Building} label="Fabricant" value={computer.manufacturers_id} />
            <InfoRow icon={Cpu} label="Modèle" value={computer.computermodels_id} />
            <InfoRow icon={Hash} label="Type" value={computer.computertypes_id} />
            <InfoRow icon={Hash} label="UUID" value={computer.uuid} mono />
          </CardContent>
        </Card>

        {/* Location & User */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 font-mono text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-amber-500" />
              Utilisateur & Emplacement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow icon={User} label="Utilisateur" value={computer.users_id} />
            <InfoRow icon={User} label="Contact" value={computer.contact} />
            <InfoRow icon={Hash} label="N° Contact" value={computer.contact_num} mono />
            <InfoRow icon={MapPin} label="Emplacement" value={computer.locations_id} />
            <InfoRow icon={Building} label="Groupe" value={computer.groups_id} />
            <InfoRow icon={Hash} label="État" value={computer.states_id} />
          </CardContent>
        </Card>

        {/* Network */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 font-mono text-lg flex items-center gap-2">
              <Network className="h-5 w-5 text-amber-500" />
              Réseau
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow icon={Network} label="Réseau" value={computer.networks_id} />
          </CardContent>
        </Card>

        {/* Dates */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 font-mono text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-amber-500" />
              Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow icon={Calendar} label="Date de création" value={computer.date_creation} mono />
            <InfoRow icon={Calendar} label="Dernière modification" value={computer.date_mod} mono />
            <InfoRow icon={Calendar} label="Dernier inventaire" value={computer.last_inventory_update} mono />
          </CardContent>
        </Card>
      </div>

      {/* Comment */}
      {computer.comment && (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 font-mono text-lg">Commentaire</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-400 whitespace-pre-wrap">{computer.comment}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
