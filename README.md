# MaTache

MVP mobile de suivi client : **capture → analyse IA → vérification → action → rappel → terminé**.

Implémentation de [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md), exclusivement sur `feat/matache-mvp`.

## Démarrage

Node.js 22+ et npm. Les versions des dépendances sont figées dans `package-lock.json`.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Sans configuration Supabase, l’interface présente uniquement trois dossiers fictifs, sans authentification ni sauvegarde. Les opérations privées nécessitent une configuration réelle. Aucun accès public aux données d’un utilisateur n’est fourni par ce mode aperçu.

## Supabase

1. Créer ou sélectionner un projet PostgreSQL Supabase.
2. Renseigner `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Appliquer les six migrations de `supabase/migrations/` dans l’ordre. Avec la CLI : `npx supabase link --project-ref <ref>` puis `npx supabase db push`. Vérifier les commandes avec `--help` selon la version installée.
4. Dans Auth, activer email/mot de passe, confirmation email et une politique de mot de passe d’au moins 12 caractères. Configurer Site URL et les Redirect URLs pour `https://votre-domaine/auth/callback` et le développement local.
5. Créer un compte dans `/login`, confirmer son email et se connecter. Le premier accès crée un espace et son propriétaire de façon atomique et idempotente.
6. Contrôler les advisors Supabase après application sur le projet cible. Ils ne peuvent pas être lancés sur un projet distant non connecté.

Les migrations créent les onze tables prévues, le bucket **privé** `matache-private`, les politiques RLS et les transactions métier. Toutes les relations métier utilisent des clés étrangères composées `(workspace_id, id)` pour empêcher les liens entre espaces. Les membres ne peuvent pas modifier leurs appartenances via le Data API. Aucun droit ne dépend de `user_metadata`.

Pour une pile Supabase locale complète : Docker requis, puis `npx supabase start` et `npx supabase db reset`. Les tests du dépôt utilisent aussi un vrai moteur PostgreSQL embarqué (PGlite), avec schémas Auth/Storage simulés ; ils ne remplacent pas une vérification du service Auth et du stockage cloud.

## IA multimodale

```dotenv
AI_PROVIDER=openai
AI_API_KEY=...
AI_MODEL=gpt-4.1-mini
DEFAULT_PHONE_COUNTRY=FR
```

L’adaptateur envoie les images privées sous forme de données image directement à l’API Chat Completions, demande une réponse JSON Schema, puis applique la validation Zod. Aucun fournisseur de secours heuristique ne se fait passer pour une IA. L’interface propose les six catégories manuelles en cas d’erreur et conserve les images.

- Plusieurs captures sont analysées ensemble : chronologie, contradictions et identité doivent être vérifiées.
- Les instructions visibles dans les captures sont traitées comme des données non fiables.
- Aucun numéro de passeport ni identifiant de document sensible n’est demandé dans l’extraction.
- Un champ absent reste `null`. Une date dont l’année n’est pas observable reste indéterminée : sa formulation peut figurer dans le résumé.
- `phone_normalized` est recalculé par libphonenumber côté serveur, jamais accepté de l’IA.
- Les faits conservent leurs sources précises lorsqu’elles sont attribuables ; sinon, les captures du dossier restent disponibles.
- Le résultat original de l’IA est conservé dans `analyses.source_result` après une correction à la validation.
- Les données sont transmises au fournisseur IA configuré. Vérifier ses conditions contractuelles, sa localisation et sa rétention avant d’importer de vrais documents clients. `store:false` désactive le stockage applicatif des réponses, sans constituer une garantie de rétention nulle chez le fournisseur.

Les tests contractuels du fournisseur utilisent des réponses simulées. Pour tester la qualité d’extraction réelle sur cinq conversations fictives illustrées :

```bash
# Variables AI_API_KEY et AI_MODEL exportées dans le shell
npm run test:ai:live
```

Cette évaluation appelle réellement le fournisseur et peut entraîner des frais. Elle n’a pas été exécutée lors de la construction sans clé IA. Elle vérifie notamment le cas « facture déjà envoyée, demande ultérieure d’appel ».

## Fonctionnement

- Accueil : actions du jour, retards, factures, rappels, demandes Omra, récapitulatifs et imports non validés.
- Actions : filtres, recherche, détail, correction, statut et reports.
- Clients : identité, voyage, documents, finances, actions ouvertes, historique et sources.
- Import : appareil photo ou galerie, jusqu’à 8 images ; 10 Mo par image et 20 Mo par dossier.
- Validation : contrôle rapide, corrections optionnelles, validation atomique, rapprochement par téléphone.
- Aucun rapprochement automatique sur le seul nom. Un nom similaire offre une confirmation explicite.
- Terminé retire l’action de la liste active, sans supprimer l’historique.
- Relancer crée une action à faire ; « Documents reçus » remet le dossier en vérification sans inventer la présence de chaque document.
- Recherche textuelle : noms, téléphones, villes, dates ISO et texte des actions.

## PWA / Android

Manifest, icônes, favicon, service worker et cible de partage POST multipart sont fournis. Installer la PWA depuis Chrome Android, puis partager une capture vers MaTache. L’API de cible de partage dépend du navigateur et de l’installation ; la galerie reste disponible.

Le service worker reçoit les fichiers partagés dans un espace IndexedDB temporaire. Le partage expire au bout de 10 minutes ; les enregistrements expirés sont nettoyés au prochain accès/chargement et les fichiers sont supprimés après import. Le navigateur fermé ne permet pas de garantir une suppression physique à la seconde exacte d’expiration. Le service worker ne met en cache **aucune page, réponse API ou image client**, seulement les icônes et la page hors connexion.

La réception du partage POST est testée en Chromium ; le menu système d’un véritable appareil Android reste à vérifier avant lancement. Sans service worker actif, la route de secours renvoie vers la galerie.

## Web Push / rappels

```bash
npm run vapid:generate
```

Reporter la clé publique dans `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, la privée dans `VAPID_PRIVATE_KEY`, puis configurer `VAPID_SUBJECT`, `SUPABASE_SERVICE_ROLE_KEY` et un `CRON_SECRET` aléatoire d’au moins 32 caractères. Ne jamais rendre publiques la clé privée VAPID ou la clé service role.

Activer les notifications dans `/settings`. Le bouton demande explicitement l’autorisation du navigateur. L’envoi affiche uniquement « Une action attend votre attention », et ouvre `/actions` après authentification. Les abonnements ne peuvent cibler que les services push FCM, Mozilla ou Apple autorisés ; cela bloque les endpoints arbitraires et les requêtes SSRF.

`GET /api/cron/reminders` exige `Authorization: Bearer <CRON_SECRET>`. Les rappels sont réclamés atomiquement avec `SKIP LOCKED`, regroupés par espace, réessayés jusqu’à 5 fois, et les abonnements expirés sont supprimés. Les actions terminées ne sont plus envoyées. Un espace sans abonnement garde ses rappels en attente et visibles dans le tableau de bord. Une livraison réussie à au moins un abonnement termine le lot de l’espace ; la livraison exacte à chaque appareil n’est pas garantie. En cas d’erreur après envoi et avant marquage, une notification générique peut être répétée.

`vercel.json` programme un passage toutes les 5 minutes : **cette fréquence nécessite un plan Vercel compatible (Pro ou supérieur)**. Pour Hobby, supprimer ce bloc cron et appeler la route depuis un ordonnanceur externe. Les notifications Web Push ne garantissent pas une livraison à l’heure exacte : réseau, navigateur et permission restent nécessaires. Les rappels restent visibles dans l’application.

La déconnexion supprime les abonnements de l’utilisateur pour éviter des notifications sur un appareil partagé. Désactiver les notifications nettoie aussi la file locale de partage.

## Vérifications

```bash
npm run typecheck
npm run build
npm test
npx playwright install chromium
npm run test:e2e
npm audit --omit=dev
```

`bash scripts/phase-check.sh <phase>` refuse une branche autre que `feat/matache-mvp` et ajoute le résultat au [journal des phases](docs/BUILD_LOG.md) seulement après réussite du typecheck, du build et des tests. Le navigateur est vérifié sur le build de production, sur ordinateur et avec le viewport Pixel 7.

Le détail des tests, de la portée et des limites est dans [docs/VALIDATION.md](docs/VALIDATION.md). Les clés cloud, l’authentification email réelle, les uploads réels, l’évaluation IA réelle et la livraison push réelle restent à vérifier sur l’environnement cible.

## Données fictives

L’aperçu ne comporte que Mme Benali, M. Amrani et Famille Haddad. Pour créer ces dossiers dans un **espace de développement uniquement**, exporter les variables Supabase, `DEVELOPMENT_SEED_ALLOWED=true`, `DEVELOPMENT_SEED_EMAIL` et `DEVELOPMENT_SEED_PASSWORD`, puis lancer `npm run seed`. Un nouvel appel ajoute trois dossiers : ce script n’est pas idempotent et ne doit pas être exécuté en production.

## Sécurité et exploitation

- Sessions vérifiées côté serveur ; refresh via `proxy.ts`, caches privés désactivés.
- Bucket privé, chemins UUID sans nom de document, liens signés de 60 secondes.
- Validation du type, du poids et des signatures binaires des images.
- Limites par espace : 120 imports et 60 analyses IA par heure ; protection persistante en base.
- Erreurs HTTP génériques, aucune journalisation du contenu des captures, aucune analytique.
- Clés uniquement dans les variables d’environnement, dépendances figées, TypeScript strict.
- RLS et transactions vérifiées en PostgreSQL avec deux utilisateurs indépendants.
- Ne pas exposer `private` dans les schémas du Data API.
- Mettre en place sauvegardes et politique de conservation/suppression des données sur le projet réel. Les imports ignorés et fichiers abandonnés sont conservés ; leur purge n’est pas automatisée pour éviter une suppression silencieuse de pièces.
- Examiner périodiquement les rappels ayant `attempts >= 5 AND sent_at IS NULL`. Après correction, remettre `attempts=0, claimed_at=NULL` avec un accès administrateur autorisé.

## Déploiement

Importer cette branche dans Vercel, définir les variables, appliquer les migrations Supabase, régler les redirections Auth, puis tester les flux avec des dossiers fictifs. Utiliser une URL HTTPS stable pour l’installation PWA et les clés VAPID. Aucune clé ni infrastructure payante n’est provisionnée par le dépôt.

La branche `main` ne doit être modifiée qu’après revue et validation explicite.
