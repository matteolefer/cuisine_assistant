# Composants UI partagés

Ce dossier regroupe les briques d'interface réutilisables de l'application Culina. Les composants sont conçus pour garantir une expérience homogène, accessible et facilement personnalisable.

## Button
- Variantes disponibles : `primary`, `secondary`, `danger`, `ghost`, `ghost-danger`, `plain`.
- Le bouton applique par défaut une largeur pleine (`w-full`). Ajoutez une classe de largeur (`w-auto`, `w-fit`, etc.) via `className` pour les usages plus compacts.
- Les styles de focus (`focus-visible:ring`) sont intégrés pour assurer la navigation clavier.
- Exemple :

```jsx
<Button
  variant="ghost-danger"
  type="button"
  className="w-auto p-2 rounded-full"
  aria-label="Supprimer l'élément"
>
  <icons.Trash />
</Button>
```

## Input
- Champ de formulaire standard avec styles cohérents et focus visible.
- Accepte toutes les props natives (`type`, `aria-*`, etc.).
- Peut être combiné avec `className` pour ajuster les espacements.

```jsx
<Input
  type="text"
  value={name}
  onChange={(event) => setName(event.target.value)}
  aria-label="Nom de l'ingrédient"
/>
```

## Select
- Wrapper de `<select>` avec styles alignés sur les inputs.
- Combinez avec des `<option>` natifs.

```jsx
<Select value={unit} onChange={(event) => setUnit(event.target.value)}>
  <option value="g">Gramme</option>
</Select>
```

## EmptyState
- Permet d'afficher une illustration, un titre et un message lorsque les listes sont vides.
- Exemple :

```jsx
<EmptyState
  icon={icons.Stock}
  title="Pas d'ingrédients"
  message="Ajoutez vos produits pour commencer."
/>
```

## Bonnes pratiques d'accessibilité
- Fournir systématiquement des `aria-label` ou des `aria-describedby` explicites pour les actions iconiques.
- Préserver l'ordre du focus et éviter de masquer les anneaux de focus (`outline`).
- Utiliser les attributs d'état (`aria-pressed`, `aria-expanded`, etc.) lorsque cela est pertinent.
