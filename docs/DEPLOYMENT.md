# État de configuration — 5 octobre 2026

## Base distante

Projet Supabase existant **raconte moi** (`qvmuuvjufsnubsimuqub`, région Europe du Nord), utilisé avec l’accord de l’utilisateur pour une isolation par schéma.

- Sept migrations métier appliquées : onze tables dans `matache`, fonctions internes et budgets dans `matache_private`.
- Bucket privé `matache-private`, images JPEG/PNG/WebP, 10 Mio maximum par fichier.
- L’API expose `public`, `graphql_public` et `matache`. `matache_private` reste interne.
- Les clients Supabase de MaTache sélectionnent explicitement `matache` et un nom de cookie propre à l’application.
- Les fonctions RPC et les droits restent limités aux membres des espaces. Le traitement des rappels exige le rôle serveur.

Les comptes Auth, les clés d’administration, les réglages Auth, le serveur et ses quotas restent **partagés** avec l’application existante. Le déclencheur Auth existant crée aussi un profil dans `public.profiles` lors d’une inscription ; il n’a pas été modifié. Il s’agit d’une séparation des données métier et de leurs accès, et non de deux bases Supabase indépendantes.

Sur ce projet partagé, appliquer seulement les migrations MaTache, avec un nom préfixé `matache_` dans l’historique distant. Ne pas lancer un reset distant ni un `db push` global avec l’historique d’un seul dépôt : le projet contient les migrations de plusieurs applications. L’opération d’exposition API est conservée dans `supabase/operations/expose-matache.sql` ; préserver tous les schémas déjà exposés sur un autre projet.

## Vérifications effectuées

- Build et TypeScript réussis ; 44 tests unitaires/SQL et 10 tests navigateur réussis.
- `supabase/operations/verify-isolation.sql` exécuté sur la base distante : deux utilisateurs fictifs, espaces séparés, validation idempotente, refus de lecture/écriture croisée, accès Storage séparé, rappels arrêtés à DONE et refus anonyme.
- Le scénario distant utilise une transaction annulée : aucun compte de test, profil, client, espace ou fichier de test ne reste en base.
- Empreinte des tables, fonctions, règles d’accès de l’autre application et déclencheurs Auth identique avant/après : `addb70aaab1d43816ff29053684ffb72`.
- Advisors : aucune alerte ERROR/WARN propre aux objets MaTache. L’information [RLS sans politique](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) sur les budgets privés est volontaire : les clients n’y ont aucun droit ; seule la fonction interne contrôlée les utilise. Les informations sur les index inutilisés sont normales avant utilisation.

Ces contrôles SQL ne prouvent pas encore la connexion Auth HTTP, l’upload via le service Storage ni la livraison push réelle.

## Déploiement restant

Le connecteur Vercel a refusé la création du projet avec `403 Forbidden`. Aucun projet ni déploiement MaTache n’a été créé. Un accès permettant la création est nécessaire pour poursuivre.

À configurer dès cet accès disponible :

1. Projet Vercel Next.js, région `cdg1`, source `novaskilltech/matache`, branche `feat/matache-mvp` ; `main` inchangée.
2. Variables Supabase publiques et clé serveur privée, fournisseur IA, clés VAPID et secret cron aléatoire.
3. Ajouter l’URL exacte `/auth/callback` aux redirections Auth autorisées sans remplacer les URLs et réglages de l’application existante.
4. Programmer les rappels avec `supabase/operations/schedule-reminders.sql` après stockage de l’URL et du secret dans Vault. Cette opération n’est pas encore exécutée.
5. Vérifier connexion, imports, analyse IA réelle, correction, enregistrement, RLS HTTP, rappels et PWA sur l’URL déployée.

Vercel Hobby n’accepte pas un cron toutes les cinq minutes. `vercel.json` ne définit donc pas de cron Vercel ; le passage toutes les cinq minutes sera assuré par Supabase Cron + pg_net. Le déploiement doit utiliser uniquement la branche MVP et ses secrets, sans fusionner la PR vers `main`.
