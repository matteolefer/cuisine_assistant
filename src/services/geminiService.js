const API_URL_BASE =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent';

const getApiKey = () => {
  if (typeof window !== 'undefined' && window.__gemini_api_key) {
    return window.__gemini_api_key;
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) {
    return import.meta.env.VITE_GEMINI_API_KEY;
  }
  if (typeof process !== 'undefined' && process.env?.VITE_GEMINI_API_KEY) {
    return process.env.VITE_GEMINI_API_KEY;
  }
  return '';
};

const callGemini = async ({ prompt, responseSchema, generationConfig = {} }) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Clé API Gemini manquante.');
  }

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      ...generationConfig,
    },
  };

  if (responseSchema) {
    body.responseMimeType = 'application/json';
    body.responseSchema = responseSchema;
  }

  const response = await fetch(`${API_URL_BASE}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Erreur Gemini ${response.status}: ${errorBody}`);
  }

  return response.json();
};

const parseStructuredCandidate = (result) => {
  const candidate = result?.candidates?.[0];
  if (!candidate) return null;
  const part = candidate.content?.parts?.[0];
  if (!part) return null;
  if (part.text) {
    try {
      return JSON.parse(part.text);
    } catch (error) {
      console.warn('Réponse Gemini non JSON:', part.text);
      return null;
    }
  }
  if (part.functionCall?.args) {
    return part.functionCall.args;
  }
  return null;
};

const formatIngredientList = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return 'Aucun élément.';
  }
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

const buildRecipePrompt = ({
  ingredients = [],
  equipments = [],
  servings,
  diet,
  time,
  difficulty,
  customQuery,
}) => {
  const baseBrief = `Tu es un chef gastronomique. Propose une recette originale, précise et immédiatement exploitable.`;
  const constraints = [
    diet ? `Régime ou préférences: ${diet}.` : null,
    servings ? `Portions souhaitées: ${servings}.` : null,
    time ? `Temps maximum de préparation: ${time} minutes.` : null,
    difficulty ? `Niveau de difficulté attendu: ${difficulty}.` : null,
    customQuery ? `Demande spécifique de l'utilisateur: ${customQuery}.` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const ingredientSection = `Ingrédients disponibles:\n${formatIngredientList(ingredients)}`;
  const equipmentSection = `Équipements de cuisine disponibles:\n${formatIngredientList(equipments)}`;

  return [
    baseBrief,
    'Contraintes culinaires:',
    constraints || 'Aucune contrainte supplémentaire.',
    ingredientSection,
    equipmentSection,
    'Retourne UNIQUEMENT du JSON valide correspondant exactement au schéma fourni (noms de propriétés en snake_case).',
    'Ajoute une description courte, des étapes détaillées, la liste des ingrédients utilisés et manquants et des estimations nutritionnelles crédibles.',
  ].join('\n\n');
};

export const geminiService = {
  RECIPE_SCHEMA: {
    type: 'OBJECT',
    properties: {
      titre: { type: 'STRING' },
      description: { type: 'STRING', description: 'Description courte et appétissante.' },
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

  CATEGORIZE_SCHEMA: {
    type: 'OBJECT',
    properties: {
      category: {
        type: 'STRING',
        description: "La catégorie de l'ingrédient.",
        enum: [
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
        ],
      },
    },
    required: ['category'],
  },

<<<<<<< HEAD
=======
  getDemoRecipe: (promptData) => {
    const { diet, servings, time, difficulty } = promptData;
    return {
      titre: `[DÉMO] Tarte Végétarienne (${servings} pers.)`,
      description: "Une délicieuse tarte de démonstration, parfaite pour tester l'application.",
      type_plat: 'Plat principal',
      difficulte: difficulty || 'Facile',
      temps_preparation_minutes: parseInt(time, 10) || 25,
      portions: servings || 2,
      ingredients_manquants: ['1 Pâte feuilletée', '150g de Lardons Végétaux'],
      ingredients_utilises: ['250g de Champignons', '3 Œufs', '200ml de Crème'],
      instructions: [
        'Préchauffer le four à 180°C.',
        'Faire revenir les champignons et les lardons.',
        'Mélanger œufs et crème.',
        'Garnir la pâte et enfourner 30 min.',
      ],
      valeurs_nutritionnelles: {
        calories: '450kcal',
        proteines: '15g',
        glucides: '25g',
        lipides: '30g',
      },
      error: true,
    };
  },

>>>>>>> main
  async generateRecipe(promptData) {
    try {
      const prompt = buildRecipePrompt(promptData);
      const result = await callGemini({
        prompt,
        responseSchema: this.RECIPE_SCHEMA,
        generationConfig: {
          temperature: 0.65,
          topP: 0.9,
        },
      });

      const parsed = parseStructuredCandidate(result);
<<<<<<< HEAD
      if (!parsed) {
        throw new Error('Réponse IA vide ou non conforme.');
      }

      return parsed;
    } catch (error) {
      console.error('Erreur generateRecipe:', error);
      throw error;
=======
      if (parsed) {
        return parsed;
      }
      throw new Error('Réponse IA vide ou non conforme.');
    } catch (error) {
      console.error('Erreur generateRecipe:', error);
      return this.getDemoRecipe(promptData);
>>>>>>> main
    }
  },

  async categorizeIngredient(ingredientName) {
    try {
      const prompt = `Classe l'ingrédient suivant dans une seule catégorie parmis la liste fournie. Ingrédient: "${ingredientName}". ` +
        'Retourne uniquement la clé JSON {"category": "..."} avec une valeur de la liste.';
      const result = await callGemini({
        prompt,
        responseSchema: this.CATEGORIZE_SCHEMA,
        generationConfig: {
          temperature: 0.2,
        },
      });
      const parsed = parseStructuredCandidate(result);
      return parsed?.category || 'Autre';
    } catch (error) {
      console.warn('Catégorisation IA indisponible, fallback:', error);
      const categories = ['Fruits', 'Légumes', 'Épicerie', 'Produits Laitiers', 'Viandes', 'Poissons', 'Autre'];
      return categories[Math.floor(Math.random() * categories.length)];
    }
  },

  async formatImportedRecipe(recipeText) {
    try {
      const prompt =
        'Transforme la recette brute suivante en JSON structuré correspondant au schéma fourni.' +
        '\nRecette:\n' +
        recipeText;
      const result = await callGemini({
        prompt,
        responseSchema: this.RECIPE_SCHEMA,
        generationConfig: {
          temperature: 0.5,
        },
      });
      const parsed = parseStructuredCandidate(result);
      if (parsed) {
        return parsed;
      }
      throw new Error('Formatage IA vide.');
    } catch (error) {
      console.warn('Formatage IA indisponible, fallback:', error);
      return {
        titre: `[IMPORT] ${recipeText.substring(0, 30)}...`,
        description: "Recette importée et formatée par l'IA (Simulation).",
        instructions: recipeText.split('\n'),
      };
    }
  },

  async generateWeeklyPlan(savedRecipes, constraints = {}) {
    try {
      const serializedRecipes = JSON.stringify(
        savedRecipes.map(({ id, titre, difficulte }) => ({ id, titre, difficulte })),
      );
      const prompt =
        'Tu es un planificateur culinaire. Crée un planning équilibré pour 7 jours (déjeuner et dîner).' +
        '\nUtilise uniquement les identifiants fournis.' +
        `\nRecettes disponibles: ${serializedRecipes}.` +
        `\nContraintes utilisateur: ${JSON.stringify(constraints)}.` +
        '\nRetourne un JSON de la forme {"YYYY-MM-DD": {"dejeuner": {"id": "...", "titre": "..."}, "diner": {...}}}.';
      const result = await callGemini({
        prompt,
        generationConfig: {
          temperature: 0.6,
        },
      });
      const candidate = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (candidate) {
        return JSON.parse(candidate);
      }
      throw new Error('Plan IA vide.');
    } catch (error) {
      console.warn('Planification IA indisponible, fallback:', error);
      const weekDays = [];
      const today = new Date();
      for (let i = 0; i < 7; i += 1) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        weekDays.push(date.toISOString().split('T')[0]);
      }
      const fallbackPlan = {};
      weekDays.forEach((dateString) => {
        const lunchRecipe = savedRecipes[Math.floor(Math.random() * savedRecipes.length)] || {};
        const dinnerRecipe = savedRecipes[Math.floor(Math.random() * savedRecipes.length)] || {};
        fallbackPlan[dateString] = {
          dejeuner: lunchRecipe.id
            ? { id: lunchRecipe.id, titre: lunchRecipe.titre }
<<<<<<< HEAD
            : { id: 'ia-lunch', titre: '[IA] Salade' },
          diner: dinnerRecipe.id
            ? { id: dinnerRecipe.id, titre: dinnerRecipe.titre }
            : { id: 'ia-dinner', titre: '[IA] Pâtes Pesto' },
=======
            : { id: 'demo-lunch', titre: '[IA] Salade' },
          diner: dinnerRecipe.id
            ? { id: dinnerRecipe.id, titre: dinnerRecipe.titre }
            : { id: 'demo-dinner', titre: '[IA] Pâtes Pesto' },
>>>>>>> main
        };
      });
      return fallbackPlan;
    }
  },
};

export default geminiService;
