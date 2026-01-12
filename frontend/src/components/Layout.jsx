import { Outlet, NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Monitor, 
  Package, 
  Tv, 
  Printer, 
  Network, 
  Settings,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const LOGO_URL = "https://solutioninformatique.fr/sitepad-data/uploads/2024/03/logo-solution-informatique-plein-ecran.png";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/computers", label: "Ordinateurs", icon: Monitor },
  { path: "/software", label: "Logiciels", icon: Package },
  { path: "/monitors", label: "Écrans", icon: Tv },
  { path: "/printers", label: "Imprimantes", icon: Printer },
  { path: "/network", label: "Réseau", icon: Network },
  { path: "/agent", label: "Agent GLPI", icon: Settings },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-[#09090B]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-gradient-to-b from-zinc-900 to-[#09090B]
          border-r border-zinc-800 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <img 
              src={LOGO_URL} 
              alt="Solution Informatique" 
              className="h-12 w-auto logo-pulse"
              data-testid="logo"
            />
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-zinc-400 hover:text-amber-500"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-xs text-zinc-500 mt-2 font-mono">GLPI Manager</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1" data-testid="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path !== "/" && location.pathname.startsWith(item.path));
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.path.replace("/", "") || "dashboard"}`}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${isActive 
                    ? 'bg-amber-500/15 text-amber-500 border-l-3 border-amber-500' 
                    : 'text-zinc-400 hover:bg-amber-500/10 hover:text-amber-500'
                  }
                `}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800">
          <div className="text-xs text-zinc-600 font-mono">
            <p>GLPI Cloud</p>
            <p className="text-amber-500/70 truncate">solutioninformatique.with32.glpi-network.cloud</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 glass border-b border-zinc-800">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-zinc-400 hover:text-amber-500"
                onClick={() => setSidebarOpen(true)}
                data-testid="mobile-menu-btn"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold text-zinc-100 font-mono">
                {navItems.find(item => 
                  item.path === location.pathname || 
                  (item.path !== "/" && location.pathname.startsWith(item.path))
                )?.label || "Dashboard"}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-2 text-xs text-emerald-500 font-mono">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Connecté
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-6 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
