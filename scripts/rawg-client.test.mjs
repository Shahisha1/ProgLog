import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../assets/js/rawg-client.js', import.meta.url), 'utf8');
const context = {
  window: { rawgConfig: { apiKey: 'test', baseUrl: 'https://api.rawg.io/api', proxyUrl: '', cacheExpiry: 1000 } },
  localStorage: { getItem(){ return null; }, setItem(){}, removeItem(){} },
  fetch: async (url) => {
    if (String(url).includes('/achievements')) return { ok: true, json: async () => ({ results: [{ id: 1, name: 'Finish the game', description: 'Complete it', image: '', percent: 12.5 }] }) };
    if (String(url).includes('/screenshots')) return { ok: true, json: async () => ({ results: [{ id: 2, image: 'https://example.com/shot.jpg' }] }) };
    if (String(url).includes('/youtube')) return { ok: true, json: async () => ({ results: [{ id: 3, name: 'Full Walkthrough Guide', channel_title: 'Guide Channel', external_id: 'abc123' }] }) };
    if (String(url).includes('/games/1')) return { ok: true, json: async () => ({ id: 1, name: 'The Witcher 3', slug: 'the-witcher-3', platforms: [], background_image: '' }) };
    return { ok: true, json: async () => ({ results: [{ id: 1, name: 'The Witcher 3', background_image: '', platforms: [] }] }) };
  }
};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(source, context);
if (!context.window.rawgClient || typeof context.window.rawgClient.resolveGame !== 'function') throw new Error('RAWG client did not initialize');
console.log('RAWG client smoke test passed.');
