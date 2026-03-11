# 🛡️ SafeNotice ERP

Générateur de notices de sécurité pour Établissements Recevant du Public (ERP), propulsé par l'IA Claude d'Anthropic.

---

## ✨ Fonctionnalités

- **Génération automatique** de notices sécurité complètes (10 sections réglementaires)
- **4 types d'ERP** : Restauration, Commerce, Scolaire, Hôtellerie
- **Plan d'évacuation** interactif (éditeur en grille)
- **Checklist annuelle** de vérifications périodiques
- **Export PDF** professionnel avec page de couverture
- **Sauvegarde locale** des notices (localStorage)

---

## 🚀 Déploiement en 5 minutes

### Prérequis

- Node.js 18+ installé
- Un compte [Vercel](https://vercel.com) **ou** [Netlify](https://netlify.com) (gratuit)
- Une clé API Anthropic → [console.anthropic.com](https://console.anthropic.com)

---

### Option A — Vercel (recommandé)

1. **Poussez le projet sur GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/VOTRE_NOM/safenotice-erp.git
   git push -u origin main
   ```

2. **Connectez à Vercel**
   - Allez sur [vercel.com/new](https://vercel.com/new)
   - Importez votre dépôt GitHub
   - Vercel détecte automatiquement Create React App ✅

3. **Configurez la variable d'environnement**
   - Dans Vercel : **Settings → Environment Variables**
   - Ajoutez :
     ```
     REACT_APP_ANTHROPIC_API_KEY = sk-ant-VOTRE_CLE_ICI
     ```
   - Sélectionnez les environnements : Production, Preview, Development

4. **Déployez**
   - Cliquez **Deploy** → votre app est live en ~2 minutes 🎉

---

### Option B — Netlify

1. **Poussez sur GitHub** (même étapes qu'au-dessus)

2. **Connectez à Netlify**
   - Allez sur [app.netlify.com/start](https://app.netlify.com/start)
   - Choisissez **Import from Git** → sélectionnez votre repo

3. **Paramètres de build** (auto-détectés grâce à `netlify.toml`)
   ```
   Build command : npm run build
   Publish dir   : build
   ```

4. **Configurez la variable d'environnement**
   - **Site settings → Environment variables → Add a variable**
     ```
     REACT_APP_ANTHROPIC_API_KEY = sk-ant-VOTRE_CLE_ICI
     ```

5. **Déployez** → Site live en ~2 minutes 🎉

---

### Option C — Test local

```bash
# 1. Installez les dépendances
npm install

# 2. Créez votre fichier d'environnement
cp .env.example .env.local
# Éditez .env.local et remplacez sk-ant-VOTRE_CLE_ICI par votre vraie clé

# 3. Lancez le serveur de développement
npm start
# → http://localhost:3000
```

---

## ⚙️ Structure du projet

```
safenotice-erp/
├── public/
│   └── index.html          # Page HTML de base
├── src/
│   ├── index.js            # Point d'entrée React
│   └── App.jsx             # Application complète
├── .env.example            # Template variables d'environnement
├── .gitignore
├── netlify.toml            # Config Netlify
├── package.json
└── vercel.json             # Config Vercel
```

---

## 🔒 Sécurité

> ⚠️ **Important** : La clé API Anthropic est utilisée côté client (navigateur).
> Pour une application en production avec plusieurs utilisateurs, il est recommandé de
> créer une **API route** côté serveur (via Vercel Functions ou Netlify Functions)
> qui proxy les appels à l'API Anthropic, afin de ne pas exposer la clé dans le bundle JS.

---

## 📄 Licence

MIT — Libre d'utilisation et de modification.
