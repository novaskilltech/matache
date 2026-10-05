# Vérification du MVP

## Résultats locaux

- TypeScript strict et build de production réussis à chaque phase.
- 42 tests unitaires/d’intégration réussis ; 10 scénarios navigateur réussis (ordinateur et mobile).
- Audit npm des dépendances de production : 0 vulnérabilité signalée.
- Revue visuelle sur mobile et réception réelle d’un POST multipart par le service worker réussies.
- Le téléchargement Playwright standard a échoué dans cet environnement ; les tests ont utilisé Chromium 153 installé via le paquet officiel `@sparticuz/chromium`, avec `BROWSER_EXECUTABLE_PATH=/tmp/chromium`.

## Portée

Le cahier des charges est implémenté par phases. Les résultats locaux sont consignés dans `BUILD_LOG.md`.

| Exigence                   | Implémentation                                                   | Vérification                                                                 |
| -------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Auth + session             | Auth Supabase, confirmation email, proxy et vérification serveur | Build, rejet des API privées ; service Auth réel à vérifier                  |
| Tables + RLS               | Six migrations, clés étrangères composées, bootstrap privé       | Tests PostgreSQL avec deux utilisateurs et rôle anonyme                      |
| Clients/actions/historique | Repositories, transactions, écrans dédiés                        | PostgreSQL + navigation navigateur                                           |
| Upload privé               | Upload signé direct, contrôle binaire, URL signée 60 s           | Schémas, signatures et RLS Storage ; service Storage réel à vérifier         |
| IA multimodale             | Adaptateur OpenAI, JSON Schema, Zod, gestion d’erreur            | Contrat simulé, multi-image et refus ; script d’évaluation réelle fourni     |
| Doublons                   | libphonenumber E.164, index unique, confirmation du nom          | Unitaires + enregistrement SQL idempotent                                    |
| Validation/correction      | Résumé, avertissements, édition, sauvegarde atomique             | Unitaires + navigateur + rollback PostgreSQL                                 |
| Dashboard/recherche        | Priorités, retard, attente, catégories, imports à finir          | Unitaires + navigateur ordinateur/mobile                                     |
| Rappels/report             | Échéances, reports, heure locale Paris, relances                 | Unitaires DST + transitions et rappels SQL                                   |
| PWA/partage Android        | Manifest, service worker, queue de partage, galerie              | Service worker et POST multipart en Chromium ; menu Android natif à vérifier |
| Web Push                   | Abonnement, restriction endpoint, claim, worker, cron            | Anti-SSRF, autorisation SQL, claim exclusif ; livraison réelle à vérifier    |
| Secrets/protection         | Env, stockage privé, contenu push neutre, absence de cache privé | Revue + tests HTTP + audit dépendances                                       |

## Nature des tests

Les tests unitaires couvrent les téléphones, le calcul des retards, les priorités, la validation IA, les corrections, les fichiers et les reports dans le fuseau Europe/Paris. Les tests d’intégration exécutent les migrations réelles dans PostgreSQL embarqué PGlite ; `auth.uid()` et les tables Storage reproduisent le contrat SQL nécessaire, sans constituer un service Supabase complet.

Les scénarios de réception IA utilisent une réponse connue pour vérifier le transport, la validation et le mapping. Ils ne prouvent pas que le modèle commercial comprend une capture inconnue. `scripts/evaluate-ai.ts` et les cinq images fictives permettent cette vérification avec une clé réelle.

Les tests navigateur utilisent le mode aperçu fictif sans Supabase. Ils couvrent les parcours, la recherche, les corrections, l’absence d’erreur JavaScript, le cache public de la PWA et les protections HTTP. Ils ne prétendent pas couvrir une session connectée ou une livraison push sur un vrai appareil.

## Activation à valider sur l’environnement cible

1. Appliquer les migrations ; exécuter les advisors Supabase et corriger toute alerte pertinente.
2. Inscrire deux utilisateurs et vérifier l’accès séparé à leurs clients et captures.
3. Importer deux captures fictives d’un même client ; analyser, corriger et valider.
4. Refaire un import avec le même téléphone local/international et vérifier l’absence de nouveau client.
5. Désactiver l’IA, importer une capture et créer manuellement l’action avec sa source.
6. Passer TODO → WAITING → DONE ; vérifier tableau de bord, historique et rappels.
7. Installer sur Android/Chrome et partager depuis la galerie/WhatsApp.
8. Activer le push, programmer un rappel et tester l’ordonnanceur authentifié.
9. Tester refus de permission, perte de réseau, abonnement expiré et déconnexion.

Aucun déploiement, clé IA, envoi Web Push réel ou modification d’un projet Supabase distant n’a été effectué sans configuration fournie.
