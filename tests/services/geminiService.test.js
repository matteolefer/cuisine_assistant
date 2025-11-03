import test from 'node:test';
import assert from 'node:assert/strict';
import geminiService from '../../src/services/geminiService.js';

const originalFetch = globalThis.fetch;

function resetGlobals() {
  if (originalFetch) {
    globalThis.fetch = originalFetch;
  } else {
    delete globalThis.fetch;
  }
  if (globalThis.window) {
    delete globalThis.window.__gemini_api_key;
    if (Object.keys(globalThis.window).length === 0) {
      delete globalThis.window;
    }
  }
}

test('generateRecipe parses Gemini response successfully', async (t) => {
  t.after(resetGlobals);
  globalThis.window = { ...(globalThis.window ?? {}), __gemini_api_key: 'test-key' };

  let requestedUrl;
  globalThis.fetch = async (url) => {
    requestedUrl = url;
    return {
      ok: true,
      async json() {
        return {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      titre: 'Soupe Tomate',
                      description: 'Une soupe maison onctueuse',
                      difficulte: 'Facile',
                      temps_preparation_minutes: 20,
                      portions: 2,
                      ingredients_utilises: ['Tomates', 'Basilic'],
                      instructions: ['Mixer les ingrédients', 'Servir chaud'],
                    }),
                  },
                ],
              },
            },
          ],
        };
      },
    };
  };

  const recipe = await geminiService.generateRecipe({
    ingredients: ['Tomates'],
    language: 'fr',
  });

  assert.ok(requestedUrl.includes('key=test-key'), 'API key should be forwarded');
  assert.equal(recipe.titre, 'Soupe Tomate');
  assert.equal(recipe.instructions.length, 2);
  assert.equal(recipe.error, undefined);
});

test('generateRecipe returns fallback data when Gemini fails', async (t) => {
  t.after(resetGlobals);
  globalThis.window = { ...(globalThis.window ?? {}), __gemini_api_key: 'fallback-key' };

  globalThis.fetch = async () => ({
    ok: false,
    status: 500,
    async text() {
      return JSON.stringify({ error: { message: 'Internal error' } });
    },
  });

  const recipe = await geminiService.generateRecipe({
    ingredients: [],
    language: 'en',
  });

  assert.equal(recipe.error, true);
  assert.match(recipe.description, /IA failed/);
});
