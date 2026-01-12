# GLPI Manager - Solution Informatique

## Problem Statement
Application web de gestion GLPI permettant de visualiser l'inventaire du parc informatique et de configurer/télécharger l'agent GLPI 1.15 pour Windows 11. Interface avec le thème et logo de solutioninformatique.fr.

## Architecture
- **Backend**: FastAPI (Python) avec intégration API GLPI REST
- **Frontend**: React avec Tailwind CSS et Shadcn/UI
- **Database**: MongoDB (pour cache futur)
- **Design**: Thème "Obsidian & Amber" - fond sombre avec accents orange/ambre

## User Personas
1. **Technicien IT** - Consulte l'inventaire, déploie l'agent GLPI
2. **Administrateur système** - Gère le parc, génère des rapports

## Core Requirements
- Dashboard avec KPIs du parc informatique
- Liste des ordinateurs/logiciels/écrans/imprimantes/réseau
- Détails par équipement
- Téléchargement agent GLPI 1.15 (64-bit et 32-bit)
- Générateur de configuration agent

## What's Been Implemented (Jan 2025)
- ✅ Dashboard complet avec graphiques (bar chart, pie chart)
- ✅ Page Ordinateurs avec recherche et détails
- ✅ Page Logiciels
- ✅ Page Écrans
- ✅ Page Imprimantes
- ✅ Page Équipements Réseau
- ✅ Page Agent GLPI (téléchargement + config)
- ✅ Navigation responsive avec sidebar
- ✅ Design Solution Informatique (logo + couleurs)
- ✅ Mode démonstration avec données simulées

## Current Status
- **Mode**: Démonstration (API GLPI non connectée)
- **Tests**: 100% backend, 98% frontend

## Prioritized Backlog
### P0 (Bloquant)
- Aucun

### P1 (Important)  
- Connexion API GLPI réelle (nécessite App Token valide)

### P2 (Nice to have)
- Export PDF/Excel des rapports
- Historique des inventaires
- Notifications de maintenance

## Next Tasks
1. Obtenir les tokens API GLPI corrects (User Token + App Token)
2. Activer le mode production (désactiver demo_mode)
3. Ajouter authentification utilisateur
