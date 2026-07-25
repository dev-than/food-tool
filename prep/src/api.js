import { API, SECRET } from './config.js';

async function post(payload) {
  // text/plain keeps this a "simple" CORS request — Apps Script can't answer
  // the preflight that application/json would trigger.
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ secret: SECRET, ...payload }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Request failed');
  return data.recipes;
}

export async function loadRecipes() {
  const res = await fetch(API);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Could not load');
  return data.recipes;
}

export const createRecipe = (recipe) => post({ action: 'create', recipe });
export const updateRecipe = (recipe) => post({ action: 'update', recipe });
export const deleteRecipe = (id) => post({ action: 'delete', id });
