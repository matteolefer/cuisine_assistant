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

// === 🍴 Formatage d’ingrédients ===
const formatIngredientList = (items) => {
  if (!Array.isArray(items) || items.length === 0) return 'Aucun élément.';
  return items
    .map((item) => {
      if (typeof item === 'string') return `- ${item}`;
      const { name, quantity, unit, category } = item;
      const qty = quantity ? `${quantity} ${unit || ''}`.trim() : '';
      const cat = category ? ` | Catégorie: ${category}` : '';
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
  const baseBrief = `Tu es un chef gastronomique virtuel. ${getLanguageInstruction(language)} 
Propose une recette originale, précise et immédiatement exploitable.`;

  const ingredientInstruction = {
    use_all: `
Tu dois utiliser **tous les ingrédients listés ci-dessous**.
Tu peux aussi utiliser les ingrédients de base (sel, poivre, huile, beurre, sucre, farine, eau, lait, œufs, levure, herbes, épices).
    `,
    use_selected: `
Utilise **principalement les ingrédients listés ci-dessous**, mais tu peux ajouter d'autres ingrédients complémentaires si nécessaire.
Les ingrédients de base sont toujours disponibles (sel, poivre, huile, beurre, sucre, farine, eau, lait, œufs, levure, herbes, épices).
    `,
    ignore: `
Ignore les ingrédients du stock et crée librement une recette cohérente, en supposant que les ingrédients de base sont disponibles.
    `,
  }[ingredientMode || 'use_all'];

  const constraints = [
    diet && `Régime: ${diet}`,
    servings && `Portions: ${servings}`,
    time && `Temps max: ${time} minutes`,
    difficulty && `Difficulté: ${difficulty}`,
    customQuery && `Demande spécifique: ${customQuery}`,
  ]
    .filter(Boolean)
    .join('\n');

  return [
    baseBrief,
    'Contraintes culinaires:',
    constraints || 'Aucune contrainte.',
    ingredientInstruction,
    `Ingrédients disponibles:\n${formatIngredientList(ingredients)}`,
    `Équipements de cuisine disponibles:\n${formatIngredientList(equipments)}`,
    'Réponds uniquement au format JSON strict, sans texte avant ni après.',
    'Utilise des guillemets doubles et respecte ce schéma (snake_case).',
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

      const result = await callGemini({
        prompt,
        systemInstruction: `${getLanguageInstruction(language)} 
Réponds uniquement en JSON valide, conforme à ce schéma : ${JSON.stringify(this.RECIPE_SCHEMA)}`,
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
