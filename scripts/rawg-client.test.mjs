import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const sourcePath = path.join(process.cwd(), 'assets', 'js', 'rawg-client.js');
const source = fs.readFileSync(sourcePath, 'utf8');

function loadClient() {
    const calls = [];
    const store = new Map();
    const context = {
        console,
        localStorage: {
            getItem(key) { return store.has(key) ? store.get(key) : null; },
            setItem(key, value) { store.set(key, String(value)); },
            removeItem(key) { store.delete(key); }
        },
        window: {
            rawgConfig: {
                apiKey: 'dac06dc3b1fee487fbb1c4fab6c1c71e4',
                baseUrl: 'https://api.rawg.io/api',
                cacheExpiry: 86400000
            }
        },
        fetch(url) {
            calls.push(String(url));
            return Promise.resolve({
                ok: true,
                json: async () => ({
                    results: [
                        { id: 42, name: 'The Witcher 3: Wild Hunt', background_image: 'https://example.com/witcher.jpg' }
                    ]
                })
            });
        }
    };

    vm.runInNewContext(source, context, { filename: sourcePath });
    return { context, calls };
}

test('RAWG search requests use the documented exact-match query parameters', async () => {
    const { context, calls } = loadClient();
    await new Promise((resolve, reject) => {
        context.window.rawgClient.searchGames('The Witcher 3: Wild Hunt', (results, error) => {
            if (error) reject(error);
            else {
                assert.ok(results && results.length > 0, 'search returned results');
                resolve();
            }
        });
    });

    assert.ok(calls[0].includes('search='), 'search endpoint includes the query');
    assert.ok(calls[0].includes('search_exact=true'), 'search exact flag should be enabled for matching');
    assert.ok(calls[0].includes('search_precise=true'), 'search precise flag should be enabled for matching');
});
