// Assemble the final Vercel output directory: static root site + built Career app at /career.
// Runs after `npm --prefix career run build` has produced career/dist.
import { cp, mkdir, rm, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const out = join(root, 'dist');
const careerDist = join(root, 'career', 'dist');

// Static root files that make up the marketing hub. Keep this list explicit so we
// never accidentally publish random junk that lands in the repo root.
const rootStatic = ['index.html', 'styles.css', 'app.js'];

async function main() {
  if (existsSync(out)) await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });

  for (const name of rootStatic) {
    const src = join(root, name);
    if (!existsSync(src)) {
      throw new Error(`Missing expected static asset: ${name}`);
    }
    await cp(src, join(out, name));
  }

  // Optional: copy any static asset directories at the root (e.g. /public, /assets, /images).
  for (const dir of ['public', 'assets', 'images', 'static']) {
    const src = join(root, dir);
    if (existsSync(src)) {
      await cp(src, join(out, dir), { recursive: true });
    }
  }

  if (!existsSync(careerDist)) {
    throw new Error(`Career build output not found at ${careerDist}. Did the Vite build succeed?`);
  }
  await cp(careerDist, join(out, 'career'), { recursive: true });

  console.log('Assembled dist/ with:');
  for (const entry of await readdir(out)) {
    const s = await stat(join(out, entry));
    console.log(`  ${s.isDirectory() ? 'd' : 'f'} ${entry}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
