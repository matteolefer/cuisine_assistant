# Cuisine Assistant

Application React alimentée par Vite pour gérer les stocks, les recettes et la planification des repas autour de Firebase.

## Prise en main

1. Installez les dépendances :
   ```bash
   npm install
   ```
2. Démarrez le serveur de développement :
   ```bash
   npm run dev
   ```

## Vérifications locales

| Commande | Description |
| --- | --- |
| `npm run lint` | Vérifie la qualité du code avec ESLint. |
| `npm test` | Lance les tests unitaires (service Gemini et hooks) avec le runner natif `node --test`. |

Ces deux commandes sont exécutées dans l’intégration continue et doivent être vertes avant toute ouverture de pull request.

## Contribution

1. Créez une branche à partir de `main` décrivant votre changement.
2. Implémentez la fonctionnalité ou la correction en respectant le style existant.
3. Exécutez `npm run lint` et `npm test` et corrigez toute erreur détectée.
4. Documentez toute modification notable dans ce fichier si nécessaire.
5. Ouvrez une pull request en décrivant clairement le contexte et les impacts.

## Intégration continue

Un workflow GitHub Actions (`.github/workflows/ci.yml`) exécute automatiquement l’analyse lint et les tests unitaires à chaque commit poussé sur la branche distante ou sur les pull requests.
