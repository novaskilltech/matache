# Interface MaTache

La refonte conserve le vert de MaTache et utilise un fond ivoire, des surfaces blanches et des accents par catégorie. Les compteurs, priorités et statuts viennent des données existantes ; aucun indicateur commercial n’est simulé.

- Navigation latérale sur ordinateur, barre inférieure sur téléphone ; la section reste sélectionnée dans les pages de détail.
- Tableau de bord : six compteurs cliquables et actions prioritaires, avec distinction des retards, catégories et échéances.
- Clients : initiales, téléphone et nombre d’actions ouvertes.
- Recherche et filtres regroupés ; écrans d’import et de connexion cohérents avec le reste de l’application.
- Focus clavier visible, lien d’évitement, icônes décoratives masquées aux lecteurs d’écran et respect du mouvement réduit.

## Aperçus

Ces captures utilisent uniquement les dossiers fictifs du mode aperçu.

![Tableau de bord sur ordinateur](ui/matache-desktop.png)

![Tableau de bord sur téléphone](ui/matache-mobile.png)

## Validation

TypeScript et build de production réussis. Les 44 tests unitaires/SQL et les 10 tests navigateur passent. Les parcours vérifient également l’absence de débordement sur le tableau de bord et la sélection de la navigation dans les dossiers clients.

Contrôle complémentaire des sept écrans principaux à 320, 768 et 1440 pixels : aucun débordement horizontal ni erreur JavaScript dans le navigateur. Rendu des écrans d’import et clients également inspecté sur téléphone.

Ces aperçus ne prouvent pas la configuration des services en production. Les étapes restantes figurent dans `DEPLOYMENT.md`.
