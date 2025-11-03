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

// === 🔑 Gestion des clés ===
const getApiKey = () => {
  if (typeof window !== 'undefined' && window.__gemini_api_key) {
    return window.__gemini_api_key;
  }

  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) {
    return import.meta.env.VITE_GEMINI_API_KEY;
  }

  const globalScope = typeof globalThis !== 'undefined' ? globalThis : undefined;
  const nodeProcess = globalScope?.process;
  if (nodeProcess?.env?.REACT_APP_GEMINI_API_KEY) {
    return nodeProcess.env.REACT_APP_GEMINI_API_KEY;
  }

  const legacyApiKey = globalScope?.API_KEY;
  if (typeof legacyApiKey === 'string') {
    return legacyApiKey;
  }

  return '';
};

const CONTROL_CHARS_REGEX = new RegExp(
  `[${String.fromCharCode(0)}-${String.fromCharCode(31)}]+`,
  'g',
);

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
      .replace(CONTROL_CHARS_REGEX, '')
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
  },
};

// === 🍴 Formatage d’ingrédients ===
const formatIngredientList = (items, strings) => {
  if (!Array.isArray(items) || items.length === 0) return strings.none;
  return items
    .map((item) => {
      if (typeof item === 'string') return `- ${item}`;
      const { name, quantity, unit, category } = item;
      const qty = quantity ? `${quantity} ${unit || ''}`.trim() : '';
      const cat = category ? ` | ${strings.categoryLabel}: ${category}` : '';
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
    `${strings.availableIngredients}\n${formatIngredientList(ingredients, strings)}`,
    `${strings.availableEquipments}\n${formatIngredientList(equipments, strings)}`,
    strings.jsonReminder,
    strings.schemaReminder,
  ].join('\n\n');
};

// === 💡 Service Gemini complet ===
export const geminiService = {
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

  async generateRecipe(promptData) {
    try {
      // Récupération de la langue depuis promptData
      const { language = 'fr' } = promptData;
      const prompt = buildRecipePrompt({ ...promptData, language });
      const strings = PROMPT_TEXTS[language] || PROMPT_TEXTS.fr;

      const result = await callGemini({
        prompt,
        systemInstruction: [
          getLanguageInstruction(language),
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
};

export default geminiService;
