import { useEffect, useState } from "react";
import { glpiApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Download, 
  Copy, 
  Check, 
  ExternalLink,
  Monitor,
  Server,
  FileText
} from "lucide-react";
import { toast } from "sonner";

export default function AgentConfig() {
  const [downloadLinks, setDownloadLinks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [configGenerated, setConfigGenerated] = useState(null);
  
  const [config, setConfig] = useState({
    server_url: "https://solutioninformatique.with32.glpi-network.cloud",
    tag: "",
    no_ssl_check: false,
    debug: false,
    force: false
  });

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const data = await glpiApi.getAgentDownloadLinks();
        setDownloadLinks(data);
      } catch (err) {
        toast.error("Erreur lors du chargement des liens");
      } finally {
        setLoading(false);
      }
    };
    fetchLinks();
  }, []);

  const handleGenerateConfig = async () => {
    try {
      const data = await glpiApi.generateAgentConfig(config);
      setConfigGenerated(data);
      toast.success("Configuration générée");
    } catch (err) {
      toast.error("Erreur lors de la génération");
    }
  };

  const handleCopyConfig = async () => {
    if (configGenerated?.config) {
      try {
        await navigator.clipboard.writeText(configGenerated.config);
        setCopied(true);
        toast.success("Configuration copiée");
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        // Fallback for clipboard permission issues
        const textArea = document.createElement('textarea');
        textArea.value = configGenerated.config;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        toast.success("Configuration copiée");
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handleDownloadConfig = () => {
    if (configGenerated?.config) {
      const blob = new Blob([configGenerated.config], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = configGenerated.filename || 'glpi-agent.cfg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Fichier téléchargé");
    }
  };

  return (
    <div className="space-y-6" data-testid="agent-config-page">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-zinc-100 font-mono">Agent GLPI</h2>
        <p className="text-zinc-500 text-sm">Téléchargement et configuration de l'agent d'inventaire</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Download Section */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 font-mono text-lg flex items-center gap-2">
              <Download className="h-5 w-5 text-amber-500" />
              Télécharger l'Agent GLPI 1.15
            </CardTitle>
            <CardDescription className="text-zinc-500">
              Téléchargez l'agent pour Windows 11
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (
              <>
                {/* 64-bit Download */}
                <a
                  href={downloadLinks?.windows_64bit}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                  data-testid="download-64bit"
                >
                  <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50 border border-zinc-700 hover:border-amber-500/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Monitor className="h-8 w-8 text-amber-500" />
                      <div>
                        <p className="text-zinc-100 font-medium">Windows 64-bit</p>
                        <p className="text-xs text-zinc-500">Recommandé pour Windows 11</p>
                      </div>
                    </div>
                    <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                      MSI
                    </Badge>
                  </div>
                </a>

                {/* 32-bit Download */}
                <a
                  href={downloadLinks?.windows_32bit}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                  data-testid="download-32bit"
                >
                  <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50 border border-zinc-700 hover:border-zinc-600 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Monitor className="h-8 w-8 text-zinc-500" />
                      <div>
                        <p className="text-zinc-100 font-medium">Windows 32-bit</p>
                        <p className="text-xs text-zinc-500">Pour les anciens systèmes</p>
                      </div>
                    </div>
                    <Badge className="bg-zinc-700 text-zinc-400 border-zinc-600">
                      MSI
                    </Badge>
                  </div>
                </a>

                {/* Instructions */}
                <div className="mt-6 p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                  <h4 className="text-sm font-bold text-amber-500 mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Instructions d'installation
                  </h4>
                  <ol className="space-y-2 text-sm text-zinc-400">
                    {downloadLinks?.instructions?.map((instruction, index) => (
                      <li key={index} className="flex gap-2">
                        <span className="text-amber-500 font-mono">{index + 1}.</span>
                        {instruction}
                      </li>
                    ))}
                  </ol>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Configuration Section */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 font-mono text-lg flex items-center gap-2">
              <Settings className="h-5 w-5 text-amber-500" />
              Générateur de Configuration
            </CardTitle>
            <CardDescription className="text-zinc-500">
              Créez un fichier de configuration personnalisé
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Server URL */}
            <div className="space-y-2">
              <Label className="text-zinc-400">URL du serveur GLPI</Label>
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-zinc-500" />
                <Input
                  value={config.server_url}
                  onChange={(e) => setConfig({ ...config, server_url: e.target.value })}
                  className="bg-zinc-950 border-zinc-800 focus:border-amber-500 text-zinc-100 font-mono text-sm"
                  data-testid="config-server-url"
                />
              </div>
            </div>

            {/* Tag */}
            <div className="space-y-2">
              <Label className="text-zinc-400">Tag (optionnel)</Label>
              <Input
                value={config.tag}
                onChange={(e) => setConfig({ ...config, tag: e.target.value })}
                placeholder="ex: bureau-paris"
                className="bg-zinc-950 border-zinc-800 focus:border-amber-500 text-zinc-100"
                data-testid="config-tag"
              />
            </div>

            {/* Options */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-zinc-400">Ignorer les erreurs SSL</Label>
                <Switch
                  checked={config.no_ssl_check}
                  onCheckedChange={(checked) => setConfig({ ...config, no_ssl_check: checked })}
                  data-testid="config-ssl"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-zinc-400">Mode debug</Label>
                <Switch
                  checked={config.debug}
                  onCheckedChange={(checked) => setConfig({ ...config, debug: checked })}
                  data-testid="config-debug"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-zinc-400">Forcer l'inventaire</Label>
                <Switch
                  checked={config.force}
                  onCheckedChange={(checked) => setConfig({ ...config, force: checked })}
                  data-testid="config-force"
                />
              </div>
            </div>

            {/* Generate Button */}
            <Button 
              onClick={handleGenerateConfig}
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold mt-4"
              data-testid="generate-config-btn"
            >
              <Settings className="h-4 w-4 mr-2" />
              Générer la configuration
            </Button>

            {/* Generated Config */}
            {configGenerated && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-zinc-400">Configuration générée</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyConfig}
                      className="text-zinc-400 hover:text-amber-500"
                      data-testid="copy-config-btn"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDownloadConfig}
                      className="text-zinc-400 hover:text-amber-500"
                      data-testid="download-config-btn"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <pre className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 font-mono overflow-x-auto">
                  {configGenerated.config}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* GLPI Cloud Link */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="p-4">
          <a
            href="https://solutioninformatique.with32.glpi-network.cloud"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between hover:bg-amber-500/5 rounded-lg p-2 -m-2 transition-colors"
            data-testid="glpi-cloud-link"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Server className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-zinc-100 font-medium">Accéder à GLPI Cloud</p>
                <p className="text-xs text-zinc-500 font-mono">solutioninformatique.with32.glpi-network.cloud</p>
              </div>
            </div>
            <ExternalLink className="h-5 w-5 text-zinc-500" />
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
