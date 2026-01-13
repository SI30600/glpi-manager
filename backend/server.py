from fastapi import FastAPI, APIRouter, HTTPException, Query
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import httpx
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# GLPI Configuration
GLPI_URL = os.environ.get('GLPI_URL', '')
GLPI_USERNAME = os.environ.get('GLPI_USERNAME', '')
GLPI_PASSWORD = os.environ.get('GLPI_PASSWORD', '')
GLPI_USER_TOKEN = os.environ.get('GLPI_USER_TOKEN', '')
GLPI_APP_TOKEN = os.environ.get('GLPI_APP_TOKEN', '')

# Create the main app
app = FastAPI(title="GLPI Manager - Solution Informatique")

# Create routers
api_router = APIRouter(prefix="/api")
glpi_router = APIRouter(prefix="/glpi", tags=["GLPI"])

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============ MODELS ============

class GLPISession(BaseModel):
    session_token: Optional[str] = None
    expires_at: Optional[datetime] = None

class Computer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: int
    name: str
    serial: Optional[str] = None
    otherserial: Optional[str] = None
    contact: Optional[str] = None
    contact_num: Optional[str] = None
    users_id_tech: Optional[Any] = None
    groups_id_tech: Optional[Any] = None
    comment: Optional[str] = None
    date_mod: Optional[str] = None
    autoupdatesystems_id: Optional[Any] = None
    locations_id: Optional[Any] = None
    networks_id: Optional[Any] = None
    computermodels_id: Optional[Any] = None
    computertypes_id: Optional[Any] = None
    is_template: Optional[int] = 0
    template_name: Optional[str] = None
    manufacturers_id: Optional[Any] = None
    is_deleted: Optional[int] = 0
    is_dynamic: Optional[int] = 0
    users_id: Optional[Any] = None
    groups_id: Optional[Any] = None
    states_id: Optional[Any] = None
    ticket_tco: Optional[float] = None
    uuid: Optional[str] = None
    date_creation: Optional[str] = None
    is_recursive: Optional[int] = 0
    last_inventory_update: Optional[str] = None

class Software(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: int
    name: str
    comment: Optional[str] = None
    locations_id: Optional[Any] = None
    users_id_tech: Optional[Any] = None
    groups_id_tech: Optional[Any] = None
    is_update: Optional[int] = 0
    softwares_id: Optional[Any] = None
    manufacturers_id: Optional[Any] = None
    is_deleted: Optional[int] = 0
    is_template: Optional[int] = 0
    template_name: Optional[str] = None
    date_mod: Optional[str] = None
    users_id: Optional[Any] = None
    groups_id: Optional[Any] = None
    is_recursive: Optional[int] = 0
    softwarecategories_id: Optional[Any] = None
    is_valid: Optional[int] = 1
    date_creation: Optional[str] = None

class DashboardStats(BaseModel):
    total_computers: int = 0
    total_software: int = 0
    total_monitors: int = 0
    total_printers: int = 0
    total_network_devices: int = 0
    total_phones: int = 0
    computers_by_status: Dict[str, int] = {}
    recent_updates: List[Dict[str, Any]] = []

class AgentConfig(BaseModel):
    server_url: str = "https://solutioninformatique.with32.glpi-network.cloud"
    tag: Optional[str] = None
    no_ssl_check: bool = False
    debug: bool = False
    force: bool = False
    
# ============ GLPI SERVICE ============

# Demo data when GLPI is not connected
DEMO_COMPUTERS = [
    {"id": 1, "name": "PC-BUREAU-001", "serial": "SN-2024-001", "computermodels_id": "Dell OptiPlex 7090", "manufacturers_id": "Dell", "states_id": "En service", "date_mod": "2024-12-15", "locations_id": "Bureau Paris", "users_id": "Jean Dupont"},
    {"id": 2, "name": "PC-BUREAU-002", "serial": "SN-2024-002", "computermodels_id": "HP ProDesk 400", "manufacturers_id": "HP", "states_id": "En service", "date_mod": "2024-12-14", "locations_id": "Bureau Lyon", "users_id": "Marie Martin"},
    {"id": 3, "name": "LAPTOP-TECH-001", "serial": "SN-2024-003", "computermodels_id": "Lenovo ThinkPad T14", "manufacturers_id": "Lenovo", "states_id": "En service", "date_mod": "2024-12-13", "locations_id": "Mobile", "users_id": "Pierre Bernard"},
    {"id": 4, "name": "PC-COMPTA-001", "serial": "SN-2024-004", "computermodels_id": "Dell Latitude 5520", "manufacturers_id": "Dell", "states_id": "En maintenance", "date_mod": "2024-12-12", "locations_id": "Comptabilité", "users_id": "Sophie Leroy"},
    {"id": 5, "name": "SERVER-MAIN", "serial": "SN-2024-005", "computermodels_id": "Dell PowerEdge R740", "manufacturers_id": "Dell", "states_id": "En service", "date_mod": "2024-12-11", "locations_id": "Salle serveur", "users_id": "Admin"},
    {"id": 6, "name": "PC-ACCUEIL-001", "serial": "SN-2024-006", "computermodels_id": "HP EliteDesk 800", "manufacturers_id": "HP", "states_id": "En service", "date_mod": "2024-12-10", "locations_id": "Accueil", "users_id": "Claire Dubois"},
    {"id": 7, "name": "LAPTOP-DIR-001", "serial": "SN-2024-007", "computermodels_id": "Apple MacBook Pro 14", "manufacturers_id": "Apple", "states_id": "En service", "date_mod": "2024-12-09", "locations_id": "Direction", "users_id": "Marc Directeur"},
    {"id": 8, "name": "PC-STOCK-001", "serial": "SN-2024-008", "computermodels_id": "Lenovo ThinkCentre M720", "manufacturers_id": "Lenovo", "states_id": "Stock", "date_mod": "2024-12-08", "locations_id": "Stock", "users_id": None},
]

DEMO_SOFTWARE = [
    {"id": 1, "name": "Microsoft Office 365", "softwarecategories_id": "Bureautique", "manufacturers_id": "Microsoft", "date_mod": "2024-12-15"},
    {"id": 2, "name": "Adobe Acrobat Pro", "softwarecategories_id": "PDF", "manufacturers_id": "Adobe", "date_mod": "2024-12-14"},
    {"id": 3, "name": "Google Chrome", "softwarecategories_id": "Navigateur", "manufacturers_id": "Google", "date_mod": "2024-12-13"},
    {"id": 4, "name": "Mozilla Firefox", "softwarecategories_id": "Navigateur", "manufacturers_id": "Mozilla", "date_mod": "2024-12-12"},
    {"id": 5, "name": "7-Zip", "softwarecategories_id": "Utilitaire", "manufacturers_id": "Igor Pavlov", "date_mod": "2024-12-11"},
    {"id": 6, "name": "VLC Media Player", "softwarecategories_id": "Multimédia", "manufacturers_id": "VideoLAN", "date_mod": "2024-12-10"},
    {"id": 7, "name": "Sage Compta", "softwarecategories_id": "Comptabilité", "manufacturers_id": "Sage", "date_mod": "2024-12-09"},
    {"id": 8, "name": "TeamViewer", "softwarecategories_id": "Support", "manufacturers_id": "TeamViewer", "date_mod": "2024-12-08"},
    {"id": 9, "name": "Kaspersky Endpoint Security", "softwarecategories_id": "Sécurité", "manufacturers_id": "Kaspersky", "date_mod": "2024-12-07"},
    {"id": 10, "name": "GLPI Agent", "softwarecategories_id": "Inventaire", "manufacturers_id": "GLPI Project", "date_mod": "2024-12-06"},
]

DEMO_MONITORS = [
    {"id": 1, "name": "Dell U2722D", "serial": "MON-001", "monitormodels_id": "U2722D 27\"", "manufacturers_id": "Dell"},
    {"id": 2, "name": "HP E24 G4", "serial": "MON-002", "monitormodels_id": "E24 G4 24\"", "manufacturers_id": "HP"},
    {"id": 3, "name": "LG 27UK850", "serial": "MON-003", "monitormodels_id": "27UK850 4K", "manufacturers_id": "LG"},
    {"id": 4, "name": "Samsung S24R650", "serial": "MON-004", "monitormodels_id": "S24R650 24\"", "manufacturers_id": "Samsung"},
]

DEMO_PRINTERS = [
    {"id": 1, "name": "HP LaserJet Pro M404", "serial": "PRT-001", "printermodels_id": "LaserJet Pro M404dn", "locations_id": "Bureau Paris"},
    {"id": 2, "name": "Brother MFC-L8900CDW", "serial": "PRT-002", "printermodels_id": "MFC-L8900CDW", "locations_id": "Bureau Lyon"},
    {"id": 3, "name": "Canon PIXMA G6050", "serial": "PRT-003", "printermodels_id": "PIXMA G6050", "locations_id": "Accueil"},
]

DEMO_NETWORK = [
    {"id": 1, "name": "Switch-Principal", "serial": "NET-001", "networkequipmenttypes_id": "Switch 48 ports", "locations_id": "Salle serveur"},
    {"id": 2, "name": "Routeur-Fibre", "serial": "NET-002", "networkequipmenttypes_id": "Routeur", "locations_id": "Salle serveur"},
    {"id": 3, "name": "AP-Wifi-Bureau", "serial": "NET-003", "networkequipmenttypes_id": "Point d'accès Wifi", "locations_id": "Bureau Paris"},
]

class GLPIService:
    def __init__(self):
        self.base_url = f"{GLPI_URL}/apirest.php"
        self.session_token: Optional[str] = None
        self.timeout = 60
        self.demo_mode = False  # Mode production - connexion GLPI réelle
        
    async def authenticate(self) -> str:
        """Authenticate with GLPI API using user_token"""
        if self.demo_mode:
            logger.info("Mode démonstration activé - pas de connexion GLPI")
            return "demo_token"
            
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"user_token {GLPI_USER_TOKEN}",
        }
        if GLPI_APP_TOKEN:
            headers["App-Token"] = GLPI_APP_TOKEN
            
        async with httpx.AsyncClient(timeout=self.timeout, verify=False) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/initSession",
                    headers=headers
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if "session_token" in data:
                        self.session_token = data["session_token"]
                        logger.info("Successfully authenticated with GLPI API")
                        return self.session_token
                
                logger.error(f"GLPI auth failed: {response.status_code} - {response.text}")
                raise Exception(f"Authentication failed: {response.text}")
                    
            except httpx.HTTPError as e:
                logger.error(f"HTTP error during GLPI authentication: {str(e)}")
                raise Exception(f"Failed to authenticate with GLPI: {str(e)}")
    
    async def _ensure_authenticated(self) -> str:
        if self.demo_mode:
            return "demo_token"
        if not self.session_token:
            await self.authenticate()
        return self.session_token
    
    def _get_headers(self) -> Dict[str, str]:
        headers = {
            "Content-Type": "application/json",
            "Session-Token": self.session_token or "",
        }
        return headers
    
 async def get_computers(self, range_start: int = 0, range_end: int = 50) -> List[Dict[str, Any]]:
    """Get computer inventory"""
    if self.demo_mode:
        return DEMO_COMPUTERS[range_start:range_end]
        
    await self._ensure_authenticated()
    
    async with httpx.AsyncClient(timeout=self.timeout, verify=False) as client:
        try:
            response = await client.get(
                f"{self.base_url}/Computer",
                headers={
                    "Content-Type": "application/json",
                    "Session-Token": self.session_token,
                    "App-Token": GLPI_APP_TOKEN
                }
            )
                
                if response.status_code == 200:
                    data = response.json()
                    return data if isinstance(data, list) else []
                elif response.status_code == 401:
                    self.session_token = None
                    await self._ensure_authenticated()
                    return await self.get_computers(range_start, range_end)
                else:
                    logger.warning(f"Get computers failed: {response.status_code}")
                    return []
                    
            except Exception as e:
                logger.error(f"Error getting computers: {str(e)}")
                return []
    
    async def get_computer_details(self, computer_id: int) -> Optional[Dict[str, Any]]:
        """Get detailed info for a specific computer"""
        if self.demo_mode:
            for comp in DEMO_COMPUTERS:
                if comp["id"] == computer_id:
                    return {**comp, "comment": "Poste de travail standard", "uuid": f"uuid-{computer_id}", "date_creation": "2024-01-15", "contact": "support@solutioninformatique.fr"}
            return None
            
        await self._ensure_authenticated()
        
        async with httpx.AsyncClient(timeout=self.timeout, verify=False) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/Computer/{computer_id}",
                    headers=self._get_headers(),
                    params={"expand_dropdowns": 1}
                )
                
                if response.status_code == 200:
                    return response.json()
                return None
                    
            except Exception as e:
                logger.error(f"Error getting computer {computer_id}: {str(e)}")
                return None
    
    async def get_software(self, range_start: int = 0, range_end: int = 50) -> List[Dict[str, Any]]:
        """Get software inventory"""
        if self.demo_mode:
            return DEMO_SOFTWARE[range_start:range_end]
            
        await self._ensure_authenticated()
        
        async with httpx.AsyncClient(timeout=self.timeout, verify=False) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/Software",
                    headers=self._get_headers(),
                    params={
                        "expand_dropdowns": 1,
                        "range": f"{range_start}-{range_end}"
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data if isinstance(data, list) else []
                elif response.status_code == 401:
                    self.session_token = None
                    await self._ensure_authenticated()
                    return await self.get_software(range_start, range_end)
                else:
                    return []
                    
            except Exception as e:
                logger.error(f"Error getting software: {str(e)}")
                return []
    
    async def get_monitors(self) -> List[Dict[str, Any]]:
        """Get monitors inventory"""
        if self.demo_mode:
            return DEMO_MONITORS
            
        await self._ensure_authenticated()
        
        async with httpx.AsyncClient(timeout=self.timeout, verify=False) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/Monitor",
                    headers=self._get_headers(),
                    params={"range": "0-50"}
                )
                return response.json() if response.status_code == 200 else []
            except:
                return []
    
    async def get_printers(self) -> List[Dict[str, Any]]:
        """Get printers inventory"""
        if self.demo_mode:
            return DEMO_PRINTERS
            
        await self._ensure_authenticated()
        
        async with httpx.AsyncClient(timeout=self.timeout, verify=False) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/Printer",
                    headers=self._get_headers(),
                    params={"range": "0-50"}
                )
                return response.json() if response.status_code == 200 else []
            except:
                return []
    
    async def get_network_equipments(self) -> List[Dict[str, Any]]:
        """Get network equipment inventory"""
        if self.demo_mode:
            return DEMO_NETWORK
            
        await self._ensure_authenticated()
        
        async with httpx.AsyncClient(timeout=self.timeout, verify=False) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/NetworkEquipment",
                    headers=self._get_headers(),
                    params={"range": "0-50"}
                )
                return response.json() if response.status_code == 200 else []
            except:
                return []
    
    async def get_phones(self) -> List[Dict[str, Any]]:
        """Get phones inventory"""
        if self.demo_mode:
            return []
            
        await self._ensure_authenticated()
        
        async with httpx.AsyncClient(timeout=self.timeout, verify=False) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/Phone",
                    headers=self._get_headers(),
                    params={"range": "0-50"}
                )
                return response.json() if response.status_code == 200 else []
            except:
                return []
    
    async def get_dashboard_stats(self) -> DashboardStats:
        """Get dashboard statistics"""
        computers = await self.get_computers(0, 1000)
        software = await self.get_software(0, 1000)
        monitors = await self.get_monitors()
        printers = await self.get_printers()
        network_devices = await self.get_network_equipments()
        phones = await self.get_phones()
        
        # Count computers by status
        status_count = {}
        for comp in computers:
            status = comp.get('states_id', 'Non défini')
            if isinstance(status, str):
                status_name = status
            else:
                status_name = str(status) if status else 'Non défini'
            status_count[status_name] = status_count.get(status_name, 0) + 1
        
        # Get recent updates
        recent = sorted(
            [c for c in computers if c.get('date_mod')],
            key=lambda x: x.get('date_mod', ''),
            reverse=True
        )[:5]
        
        return DashboardStats(
            total_computers=len(computers),
            total_software=len(software),
            total_monitors=len(monitors) if isinstance(monitors, list) else 0,
            total_printers=len(printers) if isinstance(printers, list) else 0,
            total_network_devices=len(network_devices) if isinstance(network_devices, list) else 0,
            total_phones=len(phones) if isinstance(phones, list) else 0,
            computers_by_status=status_count,
            recent_updates=[{"id": c.get("id"), "name": c.get("name"), "date": c.get("date_mod")} for c in recent]
        )
    
    async def close_session(self):
        """Close GLPI session"""
        if self.demo_mode or not self.session_token:
            return
            
        async with httpx.AsyncClient(timeout=self.timeout, verify=False) as client:
            try:
                await client.get(
                    f"{self.base_url}/killSession",
                    headers=self._get_headers()
                )
                self.session_token = None
            except:
                pass

# Global GLPI service instance
glpi_service = GLPIService()

# ============ ROUTES ============

@api_router.get("/")
async def root():
    return {"message": "GLPI Manager API - Solution Informatique"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "GLPI Manager"}

# GLPI Routes
@glpi_router.get("/test-connection")
async def test_glpi_connection():
    """Test GLPI API connection"""
    if glpi_service.demo_mode:
        return {"status": "demo", "message": "Mode démonstration actif - données simulées"}
    try:
        token = await glpi_service.authenticate()
        return {"status": "success", "message": "Connexion GLPI réussie", "has_token": bool(token)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Échec connexion GLPI: {str(e)}")

@glpi_router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    """Get dashboard statistics from GLPI"""
    try:
        stats = await glpi_service.get_dashboard_stats()
        return stats
    except Exception as e:
        logger.error(f"Error getting stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@glpi_router.get("/computers")
async def get_computers(
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500)
):
    """Get computer inventory"""
    try:
        computers = await glpi_service.get_computers(offset, offset + limit)
        return {"data": computers, "total": len(computers)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@glpi_router.get("/computers/{computer_id}")
async def get_computer_details(computer_id: int):
    """Get computer details"""
    try:
        computer = await glpi_service.get_computer_details(computer_id)
        if not computer:
            raise HTTPException(status_code=404, detail="Ordinateur non trouvé")
        return computer
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@glpi_router.get("/software")
async def get_software(
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500)
):
    """Get software inventory"""
    try:
        software = await glpi_service.get_software(offset, offset + limit)
        return {"data": software, "total": len(software)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@glpi_router.get("/monitors")
async def get_monitors():
    """Get monitors inventory"""
    try:
        monitors = await glpi_service.get_monitors()
        return {"data": monitors, "total": len(monitors) if isinstance(monitors, list) else 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@glpi_router.get("/printers")
async def get_printers():
    """Get printers inventory"""
    try:
        printers = await glpi_service.get_printers()
        return {"data": printers, "total": len(printers) if isinstance(printers, list) else 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@glpi_router.get("/network")
async def get_network_equipment():
    """Get network equipment inventory"""
    try:
        devices = await glpi_service.get_network_equipments()
        return {"data": devices, "total": len(devices) if isinstance(devices, list) else 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@glpi_router.get("/phones")
async def get_phones():
    """Get phones inventory"""
    try:
        phones = await glpi_service.get_phones()
        return {"data": phones, "total": len(phones) if isinstance(phones, list) else 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@glpi_router.post("/agent-config")
async def generate_agent_config(config: AgentConfig):
    """Generate agent configuration"""
    config_content = f"""[server]
url = {config.server_url}

[tag]
tag = {config.tag or 'default'}

[http]
no-ssl-check = {'yes' if config.no_ssl_check else 'no'}

[debug]
debug = {'yes' if config.debug else 'no'}

[force]
force = {'yes' if config.force else 'no'}
"""
    return {
        "config": config_content,
        "filename": "glpi-agent.cfg"
    }

@glpi_router.get("/agent-download")
@glpi_router.get("/agent-install-script")
async def get_agent_install_script():
    """Generate Windows batch installer script"""
    script_content = '''@echo off
echo ============================================
echo   Installation Agent GLPI - Solution Informatique
echo ============================================
echo.

REM Verification des droits administrateur
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERREUR: Veuillez executer en tant qu'administrateur
    pause
    exit /b 1
)

echo Telechargement de l'Agent GLPI 1.15...
curl -L -o "%TEMP%\\GLPI-Agent-1.15-x64.msi" "https://github.com/glpi-project/glpi-agent/releases/download/1.15/GLPI-Agent-1.15-x64.msi"

if not exist "%TEMP%\\GLPI-Agent-1.15-x64.msi" (
    echo ERREUR: Echec du telechargement
    pause
    exit /b 1
)

echo.
echo Installation en cours...
msiexec /i "%TEMP%\\GLPI-Agent-1.15-x64.msi" /quiet /norestart SERVER="https://solutioninformatique.with32.glpi-network.cloud" TAG="solution-informatique" RUNNOW=1

echo.
echo ============================================
echo   Installation terminee avec succes !
echo   L'inventaire a ete envoye a GLPI Cloud.
echo ============================================
pause
'''
    return {
        "script": script_content,
        "filename": "install-glpi-agent.bat"
    }
async def get_agent_download_link():
    """Get GLPI Agent download link"""
    return {
        "windows_64bit": "https://github.com/glpi-project/glpi-agent/releases/download/1.15/GLPI-Agent-1.15-x64.msi",
        "windows_32bit": "https://github.com/glpi-project/glpi-agent/releases/download/1.15/GLPI-Agent-1.15-x86.msi",
        "instructions": [
            "1. Téléchargez l'agent GLPI 1.15 64-bit",
            "2. Exécutez l'installateur en tant qu'administrateur",
            "3. Configurez l'URL du serveur: https://solutioninformatique.with32.glpi-network.cloud",
            "4. L'agent effectuera un inventaire automatique"
        ]
    }

# Include routers
api_router.include_router(glpi_router)
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    await glpi_service.close_session()
    client.close()
