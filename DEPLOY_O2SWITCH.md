# Guide de déploiement GLPI Manager sur O2Switch

## Prérequis
- Accès cPanel O2Switch
- Accès FTP ou File Manager
- Compte GitHub (pour récupérer le code)

---

## ÉTAPE 1 : Créer une base MongoDB gratuite

1. Allez sur **https://www.mongodb.com/atlas**
2. Créez un compte gratuit
3. Créez un cluster **FREE** (M0 Sandbox)
4. Dans **Database Access** : créez un utilisateur avec mot de passe
5. Dans **Network Access** : ajoutez `0.0.0.0/0` (autoriser toutes les IPs)
6. Cliquez sur **Connect** → **Connect your application**
7. Copiez l'URL de connexion :
   ```
   mongodb+srv://UTILISATEUR:MOT_DE_PASSE@cluster0.xxxxx.mongodb.net/glpi_manager
   ```

---

## ÉTAPE 2 : Récupérer le code

### Option A : Via GitHub (Recommandé)
1. Dans Emergent, cliquez sur **"Save to GitHub"**
2. Créez un nouveau repository
3. Sur votre PC : `git clone https://github.com/VOTRE_REPO/glpi-manager.git`

### Option B : Téléchargement manuel
1. Dans Emergent, cliquez sur l'icône **VS Code**
2. Téléchargez les dossiers `backend/` et `frontend/`

---

## ÉTAPE 3 : Préparer le frontend (sur votre PC)

```bash
cd frontend

# Modifier l'URL backend dans .env
# Créez/modifiez le fichier .env :
echo "REACT_APP_BACKEND_URL=https://glpi.solutioninformatique.fr" > .env

# Installer les dépendances
npm install
# ou
yarn install

# Construire pour la production
npm run build
# ou
yarn build
```

Cela crée un dossier `build/` avec les fichiers statiques.

---

## ÉTAPE 4 : Configurer O2Switch

### 4.1 Créer le sous-domaine

1. Connectez-vous au **cPanel O2Switch**
2. Allez dans **"Sous-domaines"**
3. Créez : `glpi.solutioninformatique.fr`
4. Racine du document : `/home/VOTRE_USER/glpi.solutioninformatique.fr`

### 4.2 Configurer Python

1. Dans cPanel, allez dans **"Setup Python App"**
2. Cliquez sur **"Create Application"**
3. Configurez :
   - **Python version** : 3.9 ou 3.10
   - **Application root** : `glpi.solutioninformatique.fr/backend`
   - **Application URL** : `glpi.solutioninformatique.fr`
   - **Application startup file** : `passenger_wsgi.py`
   - **Application Entry point** : `application`
4. Cliquez sur **"Create"**
5. Notez la commande pour activer l'environnement virtuel

---

## ÉTAPE 5 : Uploader les fichiers

### Via File Manager ou FTP

Structure à créer :
```
/home/VOTRE_USER/glpi.solutioninformatique.fr/
├── backend/
│   ├── server.py
│   ├── requirements.txt
│   ├── passenger_wsgi.py  (à créer)
│   └── .env
├── public_html/           (ou directement à la racine)
│   ├── index.html         (depuis frontend/build/)
│   ├── static/
│   └── ...
└── .htaccess
```

### 5.1 Uploader le backend
- Uploadez tout le contenu du dossier `backend/`

### 5.2 Uploader le frontend
- Uploadez le contenu de `frontend/build/` dans `public_html/` ou à la racine

---

## ÉTAPE 6 : Fichiers de configuration à créer

### 6.1 Créer `backend/passenger_wsgi.py`

```python
import sys
import os

# Ajouter le chemin de l'application
sys.path.insert(0, os.path.dirname(__file__))

# Charger les variables d'environnement
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

# Importer l'application FastAPI
from server import app

# Passenger attend une variable 'application'
# FastAPI est ASGI, on utilise un adaptateur
from asgiref.wsgi import WsgiToAsgi

# Pour Passenger (WSGI), on doit wrapper l'app ASGI
# Alternative : utiliser a]sync-to-sync
import asyncio
from fastapi import FastAPI

def application(environ, start_response):
    """
    Wrapper WSGI pour FastAPI
    Note: Pour de meilleures performances, utilisez un serveur ASGI
    """
    from werkzeug.serving import run_wsgi_app
    # Rediriger vers l'API
    path = environ.get('PATH_INFO', '/')
    if path.startswith('/api'):
        # Ici on devrait utiliser uvicorn en subprocess
        # Mais pour O2Switch, on utilise une approche simplifiée
        pass
    
    # Pour O2Switch, il est recommandé d'utiliser un VPS ou
    # de contacter leur support pour la configuration ASGI
    start_response('200 OK', [('Content-Type', 'text/html')])
    return [b'API Backend']
```

### 6.2 Alternative recommandée : Utiliser un fichier CGI

Créez `backend/api.cgi` :

```python
#!/usr/bin/env python3
import sys
import os

# Activer l'environnement virtuel
venv_path = '/home/VOTRE_USER/virtualenv/glpi.solutioninformatique.fr/backend/3.9/bin/activate_this.py'
exec(open(venv_path).read(), {'__file__': venv_path})

sys.path.insert(0, os.path.dirname(__file__))
os.chdir(os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

from server import app
import uvicorn

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### 6.3 Créer `backend/.env`

```env
MONGO_URL="mongodb+srv://UTILISATEUR:MOT_DE_PASSE@cluster0.xxxxx.mongodb.net/glpi_manager"
DB_NAME="glpi_manager"
CORS_ORIGINS="https://glpi.solutioninformatique.fr"
GLPI_URL="https://solutioninformatique.with32.glpi-network.cloud"
GLPI_USERNAME="admindev"
GLPI_PASSWORD="15tzDnWD%M*gWH^fUWUj"
GLPI_USER_TOKEN="OSrZB0k6eIWSs6i14B2GzAl5vvyKjJLZ3VyrIKBk"
GLPI_APP_TOKEN="wZ0Zd9oxTyBnhx8mDdAHQnMdd0HoJGt7K3x8cSGx"
```

### 6.4 Créer `.htaccess` à la racine

```apache
RewriteEngine On

# Rediriger les requêtes API vers le backend Python
RewriteCond %{REQUEST_URI} ^/api
RewriteRule ^api/(.*)$ /backend/api.cgi/$1 [L,QSA]

# Pour React Router - rediriger vers index.html
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [L]
```

---

## ÉTAPE 7 : Installer les dépendances Python

1. Dans cPanel → **Setup Python App**
2. Cliquez sur votre application
3. Cliquez sur **"Run pip install"** ou utilisez le terminal :

```bash
source /home/VOTRE_USER/virtualenv/glpi.solutioninformatique.fr/backend/3.9/bin/activate
cd /home/VOTRE_USER/glpi.solutioninformatique.fr/backend
pip install -r requirements.txt
```

---

## ÉTAPE 8 : Redémarrer l'application

1. Dans cPanel → **Setup Python App**
2. Cliquez sur **"Restart"** à côté de votre application

---

## SOLUTION ALTERNATIVE SIMPLIFIÉE

O2Switch n'est pas optimisé pour FastAPI/ASGI. **Solutions recommandées** :

### Option A : Backend sur Railway.app (GRATUIT)
1. Déployez uniquement le backend sur **railway.app** (gratuit)
2. Hébergez le frontend sur O2Switch (fichiers statiques)
3. Modifiez `REACT_APP_BACKEND_URL` pour pointer vers Railway

### Option B : Backend sur Render.com (GRATUIT)
1. Créez un compte sur **render.com**
2. Connectez votre GitHub
3. Déployez le backend (gratuit avec limitations)
4. Frontend sur O2Switch

### Option C : Tout sur Railway/Render (GRATUIT)
- Déployez frontend + backend sur Railway ou Render
- Pointez votre sous-domaine via CNAME

---

## Besoin d'aide ?

Le support O2Switch peut vous aider à configurer Python/Passenger.
Contact : support@o2switch.fr

