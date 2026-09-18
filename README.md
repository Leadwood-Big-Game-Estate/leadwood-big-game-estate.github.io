# Leadwood Tracker

Application web (PWA) de signalement d'animaux en temps réel sur la carte PDF de la réserve.
Fonctionne hors réseau, s'installe sur l'écran d'accueil, et partage facultativement les
signalements entre les véhicules de l'équipe.

---

## Mise en ligne sur GitHub Pages

### Le point qui bloquait

Le fichier principal doit s'appeler **`index.html`**. Un fichier nommé `index`, sans extension,
n'est pas reconnu par GitHub Pages : le site retombe alors sur le README rendu par Jekyll, et
l'application ne s'affiche jamais.

### Fichiers à avoir dans le dépôt

```
index.html                  l'application (HTML + CSS + JS)
manifest.json               métadonnées PWA
sw.js                       service worker (cache hors ligne)
supabase.sql                script de création de la table partagée
supabase-comptes.sql        script d'activation des comptes individuels
icon-192.png                icônes d'application
icon-512.png
icon-maskable-512.png       version « maskable » pour Android
favicon.ico
pdf.min.js                  pdf.js 3.11.174 embarqué
pdf.worker.min.js
carte.pdf                   (facultatif) carte de la réserve livrée avec l'app
```

L'ancien fichier `index` (sans extension) doit être **supprimé**, sinon il reste dans le dépôt
sans être utilisé.

### Marche à suivre

**En ligne de commande :**

```bash
git rm index                      # supprime l'ancien fichier sans extension
# copier ici les fichiers du paquet
git add .
git commit -m "Application complète : signalements, calage GPS, hors ligne"
git push
```

**Depuis l'interface GitHub :** *Add file → Upload files*, déposer les onze fichiers — tous à la
racine, il n'y a aucun sous-dossier — puis supprimer l'ancien fichier `index` s'il subsiste.

Vérifier ensuite dans *Settings → Pages* que la source est bien `Deploy from a branch → main → / (root)`.
Le site répond sur `https://<compte>.github.io/leadwood-tracker/` après une minute environ.

### Pourquoi les chemins sont relatifs

Sur une page de projet, le site est servi depuis `/leadwood-tracker/` et non depuis la racine du
domaine. Un chemin absolu comme `"/index.html"` dans `sw.js` pointe vers `github.io/index.html`,
qui n'existe pas ; `cache.addAll()` échoue alors sur cette seule URL et **annule l'installation
complète du service worker**. Tous les chemins du projet commencent donc par `./`.

---

## Utilisation

### La carte de la réserve

Deux façons de la fournir.

**Recommandé — livrer la carte avec l'application.** Déposer le PDF dans le dépôt sous le nom
exact **`carte.pdf`**, à la racine. L'application la charge alors toute seule : plus aucun écran
d'import, plus rien à expliquer aux guides. Ils ouvrent le lien et la carte est là. Le service
worker la met en cache, donc elle reste disponible hors réseau.

Après avoir publié une **nouvelle version de la carte**, incrémenter `VERSION` dans `sw.js` :
sans ça, les appareils déjà installés continueront d'afficher l'ancienne depuis leur cache.

**Sinon — import manuel.** Sans `carte.pdf` dans le dépôt, chaque appareil importe le PDF une
fois ; il est conservé dans IndexedDB et ne sera plus redemandé. Un appareil qui a importé sa
propre carte garde la priorité sur celle du dépôt ; *Réglages → Revenir à la carte du dépôt*
annule cette préférence.

Dans les deux cas, vérifier les quatre coins GPS au premier lancement. Un contrôle automatique
compare les proportions de la page PDF à celles de la zone décrite et prévient en cas d'écart
supérieur à 8 %.

### Sur le terrain

| Geste | Effet |
|---|---|
| Choisir un animal puis le bouton vert | Signalement à la position GPS actuelle |
| Appui long sur la carte (animal sélectionné) | Signalement à l'endroit désigné, sans GPS |
| Appui sur un repère | Détail : ancienneté, distance et direction depuis votre position, partage, suppression |
| Pincer / double-tap / molette | Zoom |
| Bouton cible | Suivi de la position ; le suivi se coupe dès qu'on déplace la carte à la main |

Un signalement **disparaît de la carte après 5 heures** par défaut (réglable : 2 h, 5 h, 12 h, sans
expiration). Les repères pâlissent à mesure qu'ils vieillissent. L'historique, lui, conserve tout.

### Installation sur téléphone

- **Android / Chrome** : menu ⋮ → *Installer l'application*.
- **iPhone / Safari** : Partager → *Sur l'écran d'accueil*. iOS n'installe une PWA que depuis
  Safari, jamais depuis Chrome.

Une fois installée, l'app démarre sans réseau : la carte PDF est stockée localement et pdf.js est
déposé dans le dépôt. Si `pdf.min.js` manque, l'app le récupère sur un CDN au premier lancement
puis le met en cache — seul ce premier démarrage demande alors une connexion.

---

## Où sont les données

Dans le navigateur de l'appareil, et nulle part ailleurs :

- les **signalements** dans `localStorage` ;
- la **carte PDF** dans IndexedDB (trop volumineuse pour `localStorage`).

Sans partage activé, rien ne quitte l'appareil : deux véhicules ne voient pas les signalements
l'un de l'autre, et le bouton *Partager* d'un repère sert à envoyer ses coordonnées par WhatsApp,
SMS ou radio. Avec le partage activé (voir plus bas), les signalements sont en plus copiés dans
une base Supabase — la carte PDF, elle, ne quitte jamais l'appareil.

Vider les données du site efface le contenu local ; l'export JSON de l'écran Réglages sert de
sauvegarde.

---

## Personnalisation

### Liste des animaux

Dans `index.html`, tableau `ANIMALS` :

```js
const ANIMALS = [
  { id:"lion", nom:"Lion", e:"🦁", c:"#C8842B" },
  ...
];
```

`id` sert de clé de stockage : ne pas le modifier après coup, sous peine de perdre le lien avec
les signalements existants. `e` est l'emoji du repère, `c` sa couleur.

### Coins GPS par défaut

```js
const DEFAULT_BOUNDS = { maxLat:-24.371180, minLng:30.900230, minLat:-24.470152, maxLng:30.995868 };
```

Ils restent modifiables à tout moment depuis *Réglages → Modifier les coins GPS*, sans réimporter
la carte : les signalements gardent leurs coordonnées GPS, seule leur position sur l'image change.

### Durée de validité

`EXPIRY_CHOICES` définit les options proposées ; la valeur active est dans les réglages.

### Après chaque modification

Incrémenter `VERSION` dans `sw.js` (`"v3"` → `"v4"`), sinon les appareils qui ont déjà installé
l'application continueront de servir l'ancienne version depuis leur cache.

---

## Partage entre véhicules

Par défaut l'application est locale. Une fois le partage activé, les signalements circulent entre
tous les véhicules équipés : chacun voit les repères des autres, avec le nom de celui qui a vu
l'animal, et les suppressions se propagent.

### Mettre en place la base (une seule fois, 5 minutes)

1. Créer un compte sur [supabase.com](https://supabase.com) — l'offre gratuite suffit largement.
2. *New project* : nom au choix, mot de passe de base de données au choix (il ne servira pas ici),
   région **eu-central** ou **af-south** selon la localisation.
   Dans la section *Security* : laisser **Enable Data API** coché (l'application passe par cette
   API — décoché, rien ne fonctionne). Les deux autres cases sont indifférentes : le script
   accorde les privilèges explicitement et active RLS lui-même.
3. Une fois le projet prêt : menu **SQL Editor** → *New query* → coller le contenu de
   `supabase.sql` → **Run**.
4. Menu **Settings → API** : relever **Project URL** (`https://xxxx.supabase.co`) et la clé
   **anon public** (une longue chaîne commençant par `eyJ`). Ne pas prendre la clé *service_role*.

### Équiper les téléphones

Sur le premier appareil : *Réglages → Configurer le partage*, saisir le nom du véhicule, l'URL du
projet et la clé, puis *Activer le partage*. L'application vérifie la connexion et signale
précisément ce qui cloche (clé refusée, table absente, serveur injoignable).

Pour les autres : *Copier le lien de configuration*, envoyer ce lien au guide. Il l'ouvre, tout est
réglé — il ne lui reste qu'à indiquer le nom de son véhicule.

### Comment ça se comporte sur le terrain

- **Hors ligne d'abord.** Un signalement est d'abord enregistré sur l'appareil, puis envoyé. Sans
  réseau, il attend dans la file — le badge indique « 3 en attente » — et part dès le retour du
  signal.
- **Relève toutes les 12 secondes** quand l'application est à l'écran, plus une relève immédiate au
  retour du réseau ou quand on rouvre l'app. Un sondage court résiste mieux qu'une connexion
  permanente à un réseau cellulaire intermittent : une liaison WebSocket passe son temps à tomber
  et à se reconnecter là où un appel HTTP de 2 ko réussit ou échoue proprement.
- **Le badge de la barre du haut** donne l'état : *Local* (partage inactif), *Partagé*,
  *n en attente*, *Partage en erreur*. Il est cliquable et mène droit aux réglages du partage.
- **Suppression logique.** Supprimer un repère le marque comme supprimé au lieu de l'effacer :
  sans cela il réapparaîtrait à la relève suivante sur tous les appareils. Ces marques sont
  nettoyées au bout de 7 jours.

### Ce que ça implique pour la sécurité

La clé *anon* n'est pas dans le dépôt GitHub : elle ne vit que sur les appareils configurés et
dans le lien de configuration. Toute personne qui obtient ce lien peut lire et écrire des
signalements. En cas de fuite, régénérer la clé dans Supabase (*Settings → API → Reset*) et
reconfigurer les téléphones — les anciens liens cessent aussitôt de fonctionner.

Ne jamais publier ce lien ni committer la clé dans le dépôt.

## Sécurité

L'application traite des **positions d'animaux en temps réel, horodatées, avec la carte des
pistes** — rhinocéros compris. C'est le jeu de données que recherchent les braconniers. Les
protections ci-dessous ne sont pas décoratives.

### Mot de passe d'ouverture — mesure d'appoint

`GATE_HASH`, en tête du script d'`index.html`, protège l'ouverture de l'app par un mot de passe.
**Ce contrôle s'exécute dans le navigateur** : la page est téléchargée par quiconque connaît
l'URL, et la condition peut être contournée en lisant la source. Il écarte le passant, pas
quelqu'un de motivé. Il ne remplace pas les comptes.

Changer le mot de passe — dans la console du navigateur :

```js
crypto.subtle.digest('SHA-256', new TextEncoder().encode('leadwood:' + 'NOUVEAU'))
  .then(b => console.log([...new Uint8Array(b)].map(x => x.toString(16).padStart(2,'0')).join('')))
```

Reporter la valeur affichée dans `GATE_HASH`. Mettre `GATE_HASH = ""` désactive cet écran.

### Comptes individuels — la vraie protection

Exécuter `supabase-comptes.sql` dans SQL Editor. Après ce script :

- la clé « anon » seule ne donne plus **aucun** accès : il faut un compte ;
- chaque guide a son identifiant, révocable individuellement sans toucher aux autres ;
- l'auteur d'un signalement est **vérifié par le serveur** (`author_id = auth.uid()`) et ne peut
  plus être usurpé ;
- on ne modifie et ne supprime que ses propres signalements ;
- la carte vit dans Supabase Storage, bucket privé `cartes`, accessible aux seuls comptes
  connectés — elle ne traîne plus dans un dépôt GitHub public.

L'application détecte seule le passage en mode authentifié : le serveur répond 401 à la clé
anonyme, et l'écran de connexion apparaît.

**Créer un guide :** *Authentication → Users → Add user*, e-mail et mot de passe, en cochant
*Auto Confirm User*. Pour que son véhicule s'affiche sur ses signalements, renseigner les
métadonnées du compte : `{ "vehicule": "Land Cruiser 2 — Sipho" }`. À défaut, l'adresse e-mail
est utilisée.

**Retirer un guide :** supprimer son compte dans la même page. Ses signalements passés restent
en base, ses identifiants cessent de fonctionner immédiatement, et aucun autre appareil n'est à
reconfigurer.

**Téléverser la carte :** *Storage → bucket `cartes` → Upload file*, sous le nom exact
`carte.pdf`. Le bucket doit rester privé.

### Ce qui reste ouvert

- Tous les comptes voient tous les signalements. Si les positions de rhinocéros ne doivent être
  visibles que de certains, il faut une colonne de sensibilité et une politique RLS par rôle.
- Un compte compromis donne accès à tout jusqu'à sa suppression. Des mots de passe distincts et
  solides par guide sont le minimum.
- Rien n'est chiffré de bout en bout : l'administrateur du projet Supabase voit tout.
- Les signalements restent en base indéfiniment. Une purge régulière (`delete from sightings
  where ts < now() - interval '30 days'`) limite ce qui serait exposé en cas de fuite.

---

## Dépendances

- [pdf.js](https://mozilla.github.io/pdf.js/) 3.11.174, Mozilla — licence Apache 2.0, déposé à la racine du dépôt.
- Polices *Zilla Slab* et *Public Sans* via Google Fonts (SIL Open Font License), avec repli
  système si le réseau est absent.

Aucun autre appel réseau : pas de fond de carte en ligne, pas de traceur, pas de compte.
