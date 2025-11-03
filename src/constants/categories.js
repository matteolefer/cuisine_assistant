export const CATEGORY_KEYS = [
  'fruits',
  'vegetables',
  'meats',
  'fish',
  'dairy',
  'bakery',
  'grocery',
  'beverages',
  'frozen',
  'other',
];

export const CATEGORY_EMOJIS = {
  fruits: '🍎',
  vegetables: '🥦',
  meats: '🍖',
  fish: '🐟',
  dairy: '🥛',
  bakery: '🥖',
  grocery: '🛒',
  beverages: '🥤',
  frozen: '🧊',
  other: '📦',
};

export const CATEGORY_LABELS = {
  fr: {
    fruits: 'Fruits',
    vegetables: 'Légumes',
    meats: 'Viandes',
    fish: 'Poissons',
    dairy: 'Produits laitiers',
    bakery: 'Boulangerie',
    grocery: 'Épicerie',
    beverages: 'Boissons',
    frozen: 'Surgelés',
    other: 'Autre',
  },
  en: {
    fruits: 'Fruits',
    vegetables: 'Vegetables',
    meats: 'Meats',
    fish: 'Fish',
    dairy: 'Dairy',
    bakery: 'Bakery',
    grocery: 'Pantry',
    beverages: 'Beverages',
    frozen: 'Frozen',
    other: 'Other',
  },
  es: {
    fruits: 'Frutas',
    vegetables: 'Verduras',
    meats: 'Carnes',
    fish: 'Pescados',
    dairy: 'Lácteos',
    bakery: 'Panadería',
    grocery: 'Despensa',
    beverages: 'Bebidas',
    frozen: 'Congelados',
    other: 'Otro',
  },
};

export const DEFAULT_CATEGORY_KEY = 'other';

const LEGACY_CATEGORY_MAP = {
  fruits: 'fruits',
  fruit: 'fruits',
  frutas: 'fruits',
  légumes: 'vegetables',
  legumes: 'vegetables',
  vegetables: 'vegetables',
  verduras: 'vegetables',
  vegetales: 'vegetables',
  viandes: 'meats',
  viande: 'meats',
  meats: 'meats',
  carnes: 'meats',
  poisson: 'fish',
  poissons: 'fish',
  fish: 'fish',
  pescados: 'fish',
  pescado: 'fish',
  'produits laitiers': 'dairy',
  laitier: 'dairy',
  dairy: 'dairy',
  lacteos: 'dairy',
  lácteos: 'dairy',
  boulangerie: 'bakery',
  bakery: 'bakery',
  panaderia: 'bakery',
  panadería: 'bakery',
  epicerie: 'grocery',
  épicerie: 'grocery',
  pantry: 'grocery',
  grocery: 'grocery',
  despensa: 'grocery',
  boissons: 'beverages',
  boisson: 'beverages',
  beverages: 'beverages',
  beverage: 'beverages',
  drinks: 'beverages',
  drink: 'beverages',
  bebidas: 'beverages',
  surgelés: 'frozen',
  surgeles: 'frozen',
  frozen: 'frozen',
  freezer: 'frozen',
  congelados: 'frozen',
  congelado: 'frozen',
  autre: 'other',
  otros: 'other',
  otro: 'other',
  other: 'other',
};

const normalize = (value) =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const LEGACY_LOOKUP = Object.entries(LEGACY_CATEGORY_MAP).reduce((acc, [key, canonical]) => {
  acc[normalize(key)] = canonical;
  return acc;
}, {});

export const canonicalizeCategory = (rawValue) => {
  if (!rawValue) return DEFAULT_CATEGORY_KEY;
  const trimmed = rawValue.toString().trim();
  if (CATEGORY_KEYS.includes(trimmed)) return trimmed;

  const normalized = normalize(trimmed);
  if (CATEGORY_KEYS.includes(normalized)) return normalized;
  if (LEGACY_LOOKUP[normalized]) return LEGACY_LOOKUP[normalized];

  return DEFAULT_CATEGORY_KEY;
};

export const getCategoryLabel = (key, language = 'fr') => {
  const safeKey = CATEGORY_KEYS.includes(key) ? key : DEFAULT_CATEGORY_KEY;
  const labels = CATEGORY_LABELS[language] || CATEGORY_LABELS.fr;
  return labels[safeKey] || CATEGORY_LABELS.fr[DEFAULT_CATEGORY_KEY];
};
