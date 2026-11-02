import test from 'ava';
import { createRequire } from 'node:module';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const coverageRequire = createRequire(require.resolve('c8'));
const avaRequire = createRequire(require.resolve('ava'));
const TestExclude = coverageRequire('test-exclude');
const { nodeFileTrace } = avaRequire('@vercel/nft');

const fixture = async (t, files) => {
  const cwd = await mkdtemp(path.join(tmpdir(), 'async-traverse-tooling-'));
  t.teardown(() => rm(cwd, { recursive: true, force: true }));
  for (const [file, content] of Object.entries(files)) {
    const target = path.join(cwd, file);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content);
  }
  return cwd;
};

test('coverage discovery preserves include and exclude patterns', async (t) => {
  const cwd = await fixture(t, {
    'src/index.js': 'export const value = 1;',
    'src/.hidden.js': 'export const hidden = 1;',
    'src/ignored.js': '',
    'src/index.test.js': '',
    'docs/example.js': '',
    'node_modules/example/index.js': '',
  });
  const exclude = new TestExclude({
    cwd,
    include: ['src/**/*.js'],
    exclude: ['src/ignored.js', '**/*.test.js'],
  });
  const expected = ['src/.hidden.js', 'src/index.js'];

  t.deepEqual(exclude.globSync().sort(), expected);
  t.deepEqual((await exclude.glob()).sort(), expected);
  t.false(exclude.shouldInstrument(path.resolve(cwd, '..', 'outside.js')));
});

test('file tracing discovers dynamically selected assets', async (t) => {
  const cwd = await fixture(t, {
    'entry.cjs': `
      const fs = require('node:fs');
      const path = require('node:path');
      const name = process.env.ASSET_NAME || 'a';
      fs.readFileSync(path.join(__dirname, 'assets', name + '.json'));
    `,
    'assets/a.json': '{}',
    'assets/b.json': '{}',
  });

  const { fileList } = await nodeFileTrace([path.join(cwd, 'entry.cjs')], { base: cwd, processCwd: cwd });
  const files = [...fileList].map(file => file.split(path.sep).join('/'));

  t.true(files.includes('entry.cjs'));
  t.true(files.includes('assets/a.json'));
  t.true(files.includes('assets/b.json'));
});
