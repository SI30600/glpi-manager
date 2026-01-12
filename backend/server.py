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

class GLPIService:
    def __init__(self):
        self.base_url = f"{GLPI_URL}/apirest.php"
        self.session_token: Optional[str] = None
        self.timeout = 60
        
    async def authenticate(self) -> str:
        """Authenticate with GLPI API using user_token"""
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"user_token {GLPI_APP_TOKEN}",
        }
            
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
        await self._ensure_authenticated()
        
        async with httpx.AsyncClient(timeout=self.timeout, verify=False) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/Computer",
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
                    return await self.get_computers(range_start, range_end)
                else:
                    logger.warning(f"Get computers failed: {response.status_code}")
                    return []
                    
            except Exception as e:
                logger.error(f"Error getting computers: {str(e)}")
                return []
    
    async def get_computer_details(self, computer_id: int) -> Optional[Dict[str, Any]]:
        """Get detailed info for a specific computer"""
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
        if not self.session_token:
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
