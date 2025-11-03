import {
  CATEGORY_KEYS,
  DEFAULT_CATEGORY_KEY,
  canonicalizeCategory,
  getCategoryLabel,
} from '../constants/categories';

/**
 * Service Gemini (v2.7 - Multilingue + JSON robuste)
 *
 * Ajouts :
 * ✅ Gestion de la langue (fr, en, es) dans tous les prompts.
 * ✅ Instructions automatiques selon la langue choisie.
 * ✅ Intégration transparente avec i18n.language.
 * ✅ safeJsonParse pour éviter les erreurs de format.
 */

const API_URL_BASE =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent';

const INGREDIENT_CATEGORIES = [
  'Fruits',
  'Légumes',
  'Viandes',
  'Poissons',
  'Produits Laitiers',
  'Boulangerie',
  'Épicerie',
  'Boissons',
  'Surgelés',
  'Autre',
];

const MEAL_TYPES = ['petit-dejeuner', 'dejeuner', 'diner'];

const WEEKLY_PLAN_DAY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const CATEGORY_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    category: { type: 'STRING' },
  },
  required: ['category'],
};

const MEAL_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    id: { type: 'STRING' },
    titre: { type: 'STRING' },
  },
  required: ['id', 'titre'],
};

const WEEKLY_PLAN_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  additionalProperties: {
    type: 'OBJECT',
    properties: MEAL_TYPES.reduce((acc, meal) => {
      acc[meal] = MEAL_RESPONSE_SCHEMA;
      return acc;
    }, {}),
  },
};

// === 🔑 Gestion des clés ===
const getApiKey = () => {
  if (typeof window !== 'undefined' && window.__gemini_api_key) return window.__gemini_api_key;
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY)
    return import.meta.env.VITE_GEMINI_API_KEY;
  if (typeof process !== 'undefined' && process.env?.REACT_APP_GEMINI_API_KEY)
    return process.env.REACT_APP_GEMINI_API_KEY;
  if (typeof API_KEY !== 'undefined') return API_KEY;
  return '';
};

// === 🧩 Fonction de parsing tolérante ===
function safeJsonParse(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    try {
      const fixed = text
        .replace(/'/g, '"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']');
      return JSON.parse(fixed);
    } catch (err) {
      console.warn('❌ JSON extrait illisible:', err.message);
      return null;
    }
  }
}

// === ⚙️ Fonction d’appel API ===
const callGemini = async ({ prompt, generationConfig = {}, systemInstruction }) => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('Clé API Gemini manquante.');

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      ...generationConfig,
    },
    ...(systemInstruction && { systemInstruction: { parts: [{ text: systemInstruction }] } }),
  };

  const response = await fetch(`${API_URL_BASE}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Erreur brute de l’API Gemini:', errorBody);
    try {
      const errJson = JSON.parse(errorBody);
      if (errJson.error?.message) {
        throw new Error(`Erreur Gemini ${response.status}: ${errJson.error.message}`);
      }
    } catch {
      throw new Error(`Erreur Gemini ${response.status}: ${errorBody}`);
    }
  }

  return response.json();
};

// === 🧠 Parsing des candidats Gemini ===
const parseStructuredCandidate = (result) => {
  const candidate = result?.candidates?.[0];
  const part = candidate?.content?.parts?.[0];
  if (!part) return null;

  if (part.text) {
    let text = part.text
      .replace(/^```json\s*/i, '')
      .replace(/```$/i, '')
      .replace(/[\u0000-\u001F]+/g, '')
      .trim();

    const lastBrace = text.lastIndexOf('}');
    if (lastBrace !== -1) text = text.substring(0, lastBrace + 1);

    let parsed = safeJsonParse(text);
    if (parsed) return parsed;

    const match = text.match(/\{[\s\S]*?\}/);
    if (match) parsed = safeJsonParse(match[0]);
    if (parsed) return parsed;

    console.warn('❌ Réponse Gemini incomplète. Retour brut tronqué :', text.slice(0, 400));
    return null;
  }

  if (part.functionCall?.args) return part.functionCall.args;
  return null;
};

// === 🌍 Définition des instructions linguistiques ===
const getLanguageInstruction = (language = 'fr') => {
  switch (language) {
    case 'en':
      return `Respond in English. Use metric units. Keep tone natural and appetizing.`;
    case 'es':
      return `Responde en español. Usa unidades métricas. Mantén un tono natural y apetitoso.`;
    default:
      return `Réponds en français avec des unités métriques et un ton chaleureux et appétissant.`;
  }
};

const SUPPORTED_LANGUAGES = ['fr', 'en', 'es'];

const resolveLanguage = (language = 'fr') =>
  SUPPORTED_LANGUAGES.includes(language) ? language : 'fr';

const CATEGORY_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    category: { type: 'STRING' },
  },
  required: ['category'],
};

const buildCategoryList = (language) =>
  CATEGORY_KEYS.map((key) => `${key} → ${getCategoryLabel(key, language)}`).join('\n');

const CATEGORY_PROMPTS = {
  fr: (ingredient, language) =>
    [
      `Classifie l'ingrédient « ${ingredient} » dans une catégorie canonique.`,
      'Choisis uniquement parmi les clés listées ci-dessous.',
      'Clés disponibles (clé → libellé) :',
      buildCategoryList(language),
      'Réponds en JSON strict : {"category":"<clé>"}.',
    ].join('\n\n'),
  en: (ingredient, language) =>
    [
      `Classify the ingredient "${ingredient}" into one canonical category.`,
      'Pick only from the keys listed below.',
      'Available keys (key → label):',
      buildCategoryList(language),
      'Answer strictly in JSON: {"category":"<key>"}.',
    ].join('\n\n'),
  es: (ingredient, language) =>
    [
      `Clasifica el ingrediente "${ingredient}" en una categoría canónica.`,
      'Elige solo entre las claves indicadas abajo.',
      'Claves disponibles (clave → etiqueta):',
      buildCategoryList(language),
      'Responde estrictamente en JSON: {"category":"<clave>"}.',
    ].join('\n\n'),
};

const buildCategorizePrompt = (ingredient, language) => {
  const resolvedLanguage = resolveLanguage(language);
  const template = CATEGORY_PROMPTS[resolvedLanguage] || CATEGORY_PROMPTS.fr;
  return template(ingredient, resolvedLanguage);
};

const PROMPT_TEXTS = {
  fr: {
    intro: 'Tu es un chef gastronomique virtuel.',
    goal: 'Propose une recette originale, précise et immédiatement exploitable.',
    ingredientInstructions: {
      use_all:
        "Tu dois utiliser **tous les ingrédients listés ci-dessous**.\nTu peux aussi utiliser les ingrédients de base (sel, poivre, huile, beurre, sucre, farine, eau, lait, œufs, levure, herbes, épices).",
      use_selected:
        "Utilise **principalement les ingrédients listés ci-dessous**, mais tu peux ajouter d'autres ingrédients complémentaires si nécessaire.\nLes ingrédients de base sont toujours disponibles (sel, poivre, huile, beurre, sucre, farine, eau, lait, œufs, levure, herbes, épices).",
      ignore:
        "Ignore les ingrédients du stock et crée librement une recette cohérente, en supposant que les ingrédients de base sont disponibles.",
    },
    constraintsHeading: 'Contraintes culinaires :',
    noConstraints: 'Aucune contrainte.',
    constraintLabels: {
      diet: 'Régime',
      servings: 'Portions',
      time: 'Temps max',
      difficulty: 'Difficulté',
      customQuery: 'Demande spécifique',
    },
    timeUnit: 'minutes',
    availableIngredients: 'Ingrédients disponibles :',
    availableEquipments: 'Équipements de cuisine disponibles :',
    none: 'Aucun élément.',
    categoryLabel: 'Catégorie',
    jsonReminder: 'Réponds uniquement au format JSON strict, sans texte avant ni après.',
    schemaReminder: 'Utilise des guillemets doubles et respecte ce schéma (snake_case).',
    schemaLabel: 'Schéma JSON :',
    helpers: {
      categorize: {
        intro:
          "Classifie l'ingrédient fourni dans l'une des catégories prédéfinies de l'application.",
        categoriesLabel: `Catégories autorisées : ${INGREDIENT_CATEGORIES.join(', ')}`,
        schemaDoc: `Structure JSON attendue :\n{\n  "category": "NomDeCategorie"\n}`,
        fallbackDoc: 'Si aucune catégorie ne convient, réponds "Autre".',
      },
      importRecipe: {
        intro:
          "Transforme le texte brut suivant en recette structurée exploitable par l'application.",
        structureDoc: `Structure JSON attendue (snake_case) :\n{\n  "titre": "...",\n  "description": "...",\n  "type_plat": "...",\n  "difficulte": "...",\n  "temps_preparation_minutes": 0,\n  "portions": 0,\n  "ingredients_utilises": ["..."],\n  "ingredients_manquants": ["..."],\n  "instructions": ["..."],\n  "valeurs_nutritionnelles": {\n    "calories": "...",\n    "proteines": "...",\n    "glucides": "...",\n    "lipides": "..."\n  }\n}`,
        rules:
          'Corrige les unités et quantités si besoin, invente des valeurs plausibles quand elles manquent et maintiens un ton appétissant.',
      },
      weeklyPlan: {
        intro:
          'Planifie un menu de sept jours en ne sélectionnant que des recettes de la liste fournie.',
        recipeListLabel: 'Référentiel de recettes disponibles :',
        structureDoc: `Structure JSON attendue :\n{\n  "YYYY-MM-DD": {\n    "petit-dejeuner": {"id": "...", "titre": "..."},\n    "dejeuner": {"id": "...", "titre": "..."},\n    "diner": {"id": "...", "titre": "..."}\n  }\n}`,
        rules: [
          'Les dates doivent être au format ISO (YYYY-MM-DD).',
          'Utilise exclusivement les identifiants exacts fournis.',
          'Si aucun plat pertinent, omets le repas concerné.',
        ].join('\n'),
      },
    },
  },
  en: {
    intro: 'You are a virtual gastronomic chef.',
    goal: 'Suggest an original, precise recipe that can be cooked immediately.',
    ingredientInstructions: {
      use_all:
        'Use **every ingredient listed below**.\nYou may also rely on pantry staples (salt, pepper, oil, butter, sugar, flour, water, milk, eggs, yeast, herbs, spices).',
      use_selected:
        'Use **mainly the ingredients listed below**, but you may complement them with other items if needed.\nPantry staples are always available (salt, pepper, oil, butter, sugar, flour, water, milk, eggs, yeast, herbs, spices).',
      ignore:
        'Ignore the pantry stock and create a coherent recipe freely, assuming pantry staples are available.',
    },
    constraintsHeading: 'Culinary constraints:',
    noConstraints: 'No particular constraint.',
    constraintLabels: {
      diet: 'Diet',
      servings: 'Servings',
      time: 'Max time',
      difficulty: 'Difficulty',
      customQuery: 'Special request',
    },
    timeUnit: 'minutes',
    availableIngredients: 'Available ingredients:',
    availableEquipments: 'Available kitchen equipment:',
    none: 'No items.',
    categoryLabel: 'Category',
    jsonReminder: 'Answer strictly in valid JSON with no text before or after.',
    schemaReminder: 'Use double quotes and respect this schema (snake_case).',
    schemaLabel: 'JSON schema:',
    helpers: {
      categorize: {
        intro: 'Classify the provided ingredient into one of the predefined application categories.',
        categoriesLabel: `Allowed categories: ${INGREDIENT_CATEGORIES.join(', ')}`,
        schemaDoc: `Expected JSON structure:\n{\n  "category": "CategoryName"\n}`,
        fallbackDoc: 'If nothing matches, answer with "Autre" (Other).',
      },
      importRecipe: {
        intro: 'Transform the raw text below into a structured recipe that the app can store.',
        structureDoc: `Expected JSON structure (snake_case):\n{\n  "titre": "...",\n  "description": "...",\n  "type_plat": "...",\n  "difficulte": "...",\n  "temps_preparation_minutes": 0,\n  "portions": 0,\n  "ingredients_utilises": ["..."],\n  "ingredients_manquants": ["..."],\n  "instructions": ["..."],\n  "valeurs_nutritionnelles": {\n    "calories": "...",\n    "proteines": "...",\n    "glucides": "...",\n    "lipides": "..."\n  }\n}`,
        rules:
          'Normalize measurements, keep key information, and invent reasonable values when the source text is incomplete.',
      },
      weeklyPlan: {
        intro: 'Build a seven-day meal plan using only the recipes provided in the list.',
        recipeListLabel: 'Available recipe catalog:',
        structureDoc: `Expected JSON structure:\n{\n  "YYYY-MM-DD": {\n    "petit-dejeuner": {"id": "...", "titre": "..."},\n    "dejeuner": {"id": "...", "titre": "..."},\n    "diner": {"id": "...", "titre": "..."}\n  }\n}`,
        rules: [
          'Dates must use the ISO format (YYYY-MM-DD).',
          'Use only the exact identifiers from the catalog.',
          'Skip a meal if no suitable recipe exists.',
        ].join('\n'),
      },
    },
  },
  es: {
    intro: 'Eres un chef gastronómico virtual.',
    goal: 'Propón una receta original, precisa y lista para cocinar de inmediato.',
    ingredientInstructions: {
      use_all:
        'Debes usar **todos los ingredientes indicados a continuación**.\nTambién puedes apoyarte en los básicos de despensa (sal, pimienta, aceite, mantequilla, azúcar, harina, agua, leche, huevos, levadura, hierbas, especias).',
      use_selected:
        'Utiliza **principalmente los ingredientes indicados abajo**, pero puedes añadir otros complementarios si es necesario.\nLos básicos de despensa están siempre disponibles (sal, pimienta, aceite, mantequilla, azúcar, harina, agua, leche, huevos, levadura, hierbas, especias).',
      ignore:
        'Ignora el stock de la despensa y crea libremente una receta coherente, suponiendo que los básicos de despensa están disponibles.',
    },
    constraintsHeading: 'Restricciones culinarias:',
    noConstraints: 'Sin restricciones.',
    constraintLabels: {
      diet: 'Dieta',
      servings: 'Porciones',
      time: 'Tiempo máx',
      difficulty: 'Dificultad',
      customQuery: 'Petición especial',
    },
    timeUnit: 'minutos',
    availableIngredients: 'Ingredientes disponibles:',
    availableEquipments: 'Equipamiento de cocina disponible:',
    none: 'Ningún elemento.',
    categoryLabel: 'Categoría',
    jsonReminder: 'Responde únicamente en JSON válido, sin texto antes ni después.',
    schemaReminder: 'Usa comillas dobles y respeta este esquema (snake_case).',
    schemaLabel: 'Esquema JSON:',
    helpers: {
      categorize: {
        intro:
          'Clasifica el ingrediente proporcionado en una de las categorías predefinidas de la aplicación.',
        categoriesLabel: `Categorías permitidas: ${INGREDIENT_CATEGORIES.join(', ')}`,
        schemaDoc: `Estructura JSON esperada:\n{\n  "category": "NombreDeCategoria"\n}`,
        fallbackDoc: 'Si ninguna coincide, responde con "Autre" (Otro).',
      },
      importRecipe: {
        intro:
          'Convierte el texto sin formato en una receta estructurada que la aplicación pueda guardar.',
        structureDoc: `Estructura JSON esperada (snake_case):\n{\n  "titre": "...",\n  "description": "...",\n  "type_plat": "...",\n  "difficulte": "...",\n  "temps_preparation_minutes": 0,\n  "portions": 0,\n  "ingredients_utilises": ["..."],\n  "ingredients_manquants": ["..."],\n  "instructions": ["..."],\n  "valeurs_nutritionnelles": {\n    "calories": "...",\n    "proteines": "...",\n    "glucides": "...",\n    "lipides": "..."\n  }\n}`,
        rules:
          'Normaliza cantidades, conserva la información clave e inventa valores plausibles cuando falten datos.',
      },
      weeklyPlan: {
        intro: 'Planifica un menú de siete días usando solo las recetas disponibles en la lista.',
        recipeListLabel: 'Catálogo de recetas disponibles:',
        structureDoc: `Estructura JSON esperada:\n{\n  "YYYY-MM-DD": {\n    "petit-dejeuner": {"id": "...", "titre": "..."},\n    "dejeuner": {"id": "...", "titre": "..."},\n    "diner": {"id": "...", "titre": "..."}\n  }\n}`,
        rules: [
          'Las fechas deben estar en formato ISO (YYYY-MM-DD).',
          'Utiliza únicamente los identificadores exactos del catálogo.',
          'Omite una comida si no hay receta adecuada.',
        ].join('\n'),
      },
    },
  },
};

// === 🍴 Formatage d’ingrédients ===
const formatIngredientList = (items, strings, language) => {
  if (!Array.isArray(items) || items.length === 0) return strings.none;
  return items
    .map((item) => {
      if (typeof item === 'string') return `- ${item}`;
      const { name, quantity, unit, category } = item;
      const qty = quantity ? `${quantity} ${unit || ''}`.trim() : '';
      const cat = category
        ? ` | ${strings.categoryLabel}: ${getCategoryLabel(
            canonicalizeCategory(category),
            resolveLanguage(language),
          )}`
        : '';
      return `- ${name}${qty ? ` (${qty})` : ''}${cat}`;
    })
    .join('\n');
};

// === 🧾 Construction du prompt recette ===
const buildRecipePrompt = ({
  ingredients = [],
  equipments = [],
  servings,
  diet,
  time,
  difficulty,
  customQuery,
  ingredientMode,
  language = 'fr',
}) => {
  const strings = PROMPT_TEXTS[language] || PROMPT_TEXTS.fr;
  const baseBrief = `${strings.intro} ${getLanguageInstruction(language)} ${strings.goal}`;

  const ingredientInstruction = strings.ingredientInstructions[ingredientMode || 'use_all'];

  const constraints = [
    diet && `${strings.constraintLabels.diet}: ${diet}`,
    servings && `${strings.constraintLabels.servings}: ${servings}`,
    time && `${strings.constraintLabels.time}: ${time} ${strings.timeUnit}`,
    difficulty && `${strings.constraintLabels.difficulty}: ${difficulty}`,
    customQuery && `${strings.constraintLabels.customQuery}: ${customQuery}`,
  ]
    .filter(Boolean)
    .join('\n');

  return [
    baseBrief,
    strings.constraintsHeading,
    constraints || strings.noConstraints,
    ingredientInstruction,
    `${strings.availableIngredients}\n${formatIngredientList(ingredients, strings, language)}`,
    `${strings.availableEquipments}\n${formatIngredientList(equipments, strings, language)}`,
    strings.jsonReminder,
    strings.schemaReminder,
  ].join('\n\n');
};

const sanitizeWeeklyPlan = (rawPlan, recipes = []) => {
  const warnings = [];

  if (!rawPlan || typeof rawPlan !== 'object' || Array.isArray(rawPlan)) {
    return { plan: null, warnings: warnings.concat('invalid_structure') };
  }

  const recipesById = new Map();
  const recipesByTitle = new Map();

  recipes.forEach((recipe) => {
    if (!recipe || !recipe.id) return;
    const id = String(recipe.id);
    recipesById.set(id, recipe);
    if (recipe.titre) {
      recipesByTitle.set(recipe.titre.trim().toLowerCase(), recipe);
    }
  });

  const sanitizedPlan = {};

  Object.entries(rawPlan).forEach(([date, meals]) => {
    if (!WEEKLY_PLAN_DAY_REGEX.test(date)) {
      warnings.push(`invalid_date:${date}`);
      return;
    }

    if (!meals || typeof meals !== 'object' || Array.isArray(meals)) {
      warnings.push(`invalid_meals:${date}`);
      return;
    }

    const sanitizedMeals = {};

    MEAL_TYPES.forEach((mealKey) => {
      const slot = meals[mealKey];
      if (!slot || typeof slot !== 'object') return;

      const candidateId = slot.id ? String(slot.id) : null;

      if (candidateId && recipesById.has(candidateId)) {
        const reference = recipesById.get(candidateId);
        sanitizedMeals[mealKey] = {
          id: reference.id,
          titre: reference.titre || slot.titre || '',
        };
        return;
      }

      if (slot.titre && typeof slot.titre === 'string') {
        const normalizedTitle = slot.titre.trim().toLowerCase();
        const matched = recipesByTitle.get(normalizedTitle);
        if (matched) {
          sanitizedMeals[mealKey] = { id: matched.id, titre: matched.titre };
          warnings.push(`matched_by_title:${slot.titre.trim()}`);
        } else {
          warnings.push(`missing_recipe:${slot.titre.trim()}`);
        }
        return;
      }

      if (candidateId) {
        warnings.push(`unknown_recipe_id:${candidateId}`);
      } else {
        warnings.push(`invalid_slot:${mealKey}@${date}`);
      }
    });

    if (Object.keys(sanitizedMeals).length > 0) {
      sanitizedPlan[date] = sanitizedMeals;
    }
  });

  return { plan: Object.keys(sanitizedPlan).length > 0 ? sanitizedPlan : null, warnings };
};

// === 💡 Service Gemini complet ===
export const geminiService = {
  CATEGORY_SCHEMA: CATEGORY_RESPONSE_SCHEMA,
  RECIPE_SCHEMA: {
    type: 'OBJECT',
    properties: {
      titre: { type: 'STRING' },
      description: { type: 'STRING' },
      type_plat: { type: 'STRING' },
      difficulte: { type: 'STRING' },
      temps_preparation_minutes: { type: 'INTEGER' },
      portions: { type: 'INTEGER' },
      ingredients_manquants: { type: 'ARRAY', items: { type: 'STRING' } },
      ingredients_utilises: { type: 'ARRAY', items: { type: 'STRING' } },
      instructions: { type: 'ARRAY', items: { type: 'STRING' } },
      valeurs_nutritionnelles: {
        type: 'OBJECT',
        properties: {
          calories: { type: 'STRING' },
          proteines: { type: 'STRING' },
          glucides: { type: 'STRING' },
          lipides: { type: 'STRING' },
        },
      },
    },
    required: [
      'titre',
      'description',
      'difficulte',
      'temps_preparation_minutes',
      'portions',
      'ingredients_utilises',
      'instructions',
    ],
  },

  async categorizeIngredient(ingredientName, { language = 'fr' } = {}) {
    if (!ingredientName) return null;

    const strings = PROMPT_TEXTS[language] || PROMPT_TEXTS.fr;
    const helperTexts = strings.helpers?.categorize;

    try {
      const prompt = [
        helperTexts?.intro,
        helperTexts?.categoriesLabel,
        helperTexts?.schemaDoc,
        helperTexts?.fallbackDoc,
        `Ingrédient : ${ingredientName}`,
      ]
        .filter(Boolean)
        .join('\n\n');

      const result = await callGemini({
        prompt,
        systemInstruction: [
          getLanguageInstruction(language),
          strings.jsonReminder,
          helperTexts?.schemaDoc,
          helperTexts?.fallbackDoc,
        ]
          .filter(Boolean)
          .join('\n'),
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: CATEGORY_RESPONSE_SCHEMA,
          temperature: 0.1,
        },
      });

      const parsed = parseStructuredCandidate(result);
      const category = typeof parsed?.category === 'string' ? parsed.category.trim() : null;

      if (!category) return null;
      if (INGREDIENT_CATEGORIES.includes(category)) return category;

      if (category.toLowerCase() === 'autre' || category.toLowerCase() === 'autres') {
        return 'Autre';
      }

      const normalized = INGREDIENT_CATEGORIES.find(
        (item) => item.toLowerCase() === category.toLowerCase(),
      );
      return normalized || null;
    } catch (error) {
      console.error('Erreur categorizeIngredient:', error);
      return null;
    }
  },

  async formatImportedRecipe(rawText, { language = 'fr' } = {}) {
    if (!rawText) return null;

    const strings = PROMPT_TEXTS[language] || PROMPT_TEXTS.fr;
    const helperTexts = strings.helpers?.importRecipe;

    try {
      const prompt = [
        helperTexts?.intro,
        helperTexts?.structureDoc,
        helperTexts?.rules,
        strings.schemaReminder,
        `${strings.schemaLabel} ${JSON.stringify(this.RECIPE_SCHEMA)}`,
        'Texte source :',
        rawText,
      ]
        .filter(Boolean)
        .join('\n\n');

      const result = await callGemini({
        prompt,
        systemInstruction: [
          getLanguageInstruction(language),
          strings.jsonReminder,
          strings.schemaReminder,
        ].join('\n'),
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: this.RECIPE_SCHEMA,
          temperature: 0.4,
        },
      });

      const parsed = parseStructuredCandidate(result);
      if (!parsed || typeof parsed !== 'object') return null;

      return {
        ...parsed,
        ingredients_utilises: Array.isArray(parsed.ingredients_utilises)
          ? parsed.ingredients_utilises
          : [],
        ingredients_manquants: Array.isArray(parsed.ingredients_manquants)
          ? parsed.ingredients_manquants
          : [],
        instructions: Array.isArray(parsed.instructions) ? parsed.instructions : [],
        valeurs_nutritionnelles: {
          calories: parsed?.valeurs_nutritionnelles?.calories || '',
          proteines: parsed?.valeurs_nutritionnelles?.proteines || '',
          glucides: parsed?.valeurs_nutritionnelles?.glucides || '',
          lipides: parsed?.valeurs_nutritionnelles?.lipides || '',
        },
      };
    } catch (error) {
      console.error('Erreur formatImportedRecipe:', error);
      return null;
    }
  },

  async generateWeeklyPlan(recipes = [], { language = 'fr', notes } = {}) {
    if (!Array.isArray(recipes) || recipes.length === 0) {
      return { plan: null, warnings: ['no_recipes'] };
    }

    const strings = PROMPT_TEXTS[language] || PROMPT_TEXTS.fr;
    const helperTexts = strings.helpers?.weeklyPlan;

    try {
      const catalog = recipes
        .map((recipe, index) => {
          const label = recipe?.titre || `Recette ${index + 1}`;
          const id = recipe?.id ? String(recipe.id) : `fallback-${index + 1}`;
          const difficulty = recipe?.difficulte || 'N/A';
          return `- [${id}] ${label} (${difficulty})`;
        })
        .join('\n');

      const promptParts = [
        helperTexts?.intro,
        helperTexts?.recipeListLabel && `${helperTexts.recipeListLabel}\n${catalog}`,
        helperTexts?.structureDoc,
        helperTexts?.rules,
        notes,
      ]
        .filter(Boolean)
        .join('\n\n');

      const result = await callGemini({
        prompt: promptParts,
        systemInstruction: [
          getLanguageInstruction(language),
          strings.jsonReminder,
          helperTexts?.structureDoc,
          helperTexts?.rules,
        ]
          .filter(Boolean)
          .join('\n'),
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: WEEKLY_PLAN_RESPONSE_SCHEMA,
          temperature: 0.35,
        },
      });

      const parsed = parseStructuredCandidate(result);
      const { plan, warnings } = sanitizeWeeklyPlan(parsed, recipes);
      return { plan, warnings };
    } catch (error) {
      console.error('Erreur generateWeeklyPlan:', error);
      return { plan: null, warnings: ['error'] };
    }
  },

  async generateRecipe(promptData) {
    try {
      // Récupération de la langue depuis promptData
      const { language = 'fr' } = promptData;
      const resolvedLanguage = resolveLanguage(language);
      const prompt = buildRecipePrompt({ ...promptData, language: resolvedLanguage });
      const strings = PROMPT_TEXTS[resolvedLanguage] || PROMPT_TEXTS.fr;

      const result = await callGemini({
        prompt,
        systemInstruction: [
          getLanguageInstruction(resolvedLanguage),
          strings.jsonReminder,
          strings.schemaReminder,
          `${strings.schemaLabel} ${JSON.stringify(this.RECIPE_SCHEMA)}`,
        ].join('\n'),
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: this.RECIPE_SCHEMA,
          temperature: 0.65,
          topP: 0.9,
        },
      });

      const parsed = parseStructuredCandidate(result);
      if (!parsed) throw new Error('Réponse IA vide ou non conforme.');
      return parsed;
    } catch (error) {
      console.error('Erreur generateRecipe:', error);
      return {
        titre: '[ERREUR IA] Recipe Demo',
        description: `IA failed (${error.message}). Demo fallback.`,
        type_plat: 'Main dish',
        difficulte: 'Easy',
        temps_preparation_minutes: 20,
        portions: 2,
        ingredients_utilises: ['3 Eggs', '200 ml Cream'],
        instructions: ['Preheat oven to 180°C.', 'Mix eggs and cream.', 'Bake 20 min.'],
        valeurs_nutritionnelles: { calories: '400 kcal' },
        error: true,
      };
    }
  },

  async categorizeIngredient(ingredientName, language = 'fr') {
    const trimmedName = ingredientName?.trim();
    if (!trimmedName) return DEFAULT_CATEGORY_KEY;

    const resolvedLanguage = resolveLanguage(language);
    const prompt = buildCategorizePrompt(trimmedName, resolvedLanguage);

    try {
      const result = await callGemini({
        prompt,
        systemInstruction: [
          getLanguageInstruction(resolvedLanguage),
          'You must always output valid JSON following the provided schema.',
          `Return one of these canonical keys: ${CATEGORY_KEYS.join(', ')}.`,
          `Schema: ${JSON.stringify(CATEGORY_RESPONSE_SCHEMA)}`,
        ].join('\n'),
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: CATEGORY_RESPONSE_SCHEMA,
          temperature: 0.2,
          topP: 0.8,
        },
      });

      const parsed = parseStructuredCandidate(result);
      const category = canonicalizeCategory(parsed?.category);
      return category;
    } catch (error) {
      console.error('Erreur categorizeIngredient:', error);
      return DEFAULT_CATEGORY_KEY;
    }
  },
};

export default geminiService;
