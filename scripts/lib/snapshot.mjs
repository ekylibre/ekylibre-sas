// Outils communs aux scripts fetch-* : écriture validée d'un instantané, repli en cas d'échec.
import { writeFile, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

export const inCI = Boolean(process.env.GITHUB_ACTIONS);

export function warn(message) {
  // Annotation visible dans le résumé GitHub Actions, simple avertissement en local.
  console.warn(inCI ? `::warning::${message}` : `⚠ ${message}`);
}

/**
 * Exécute `produce()`, valide le résultat avec `schema` (Zod) puis l'écrit dans `file`.
 * En cas d'échec, l'instantané commité est conservé et le build continue (code de sortie 0).
 */
export async function refreshSnapshot(file, schema, produce) {
  try {
    const data = schema.parse(await produce());
    await writeFile(file, `${JSON.stringify(data, null, 2)}\n`);
    return data;
  } catch (error) {
    let kept = false;
    try {
      schema.parse(JSON.parse(await readFile(file, 'utf8')));
      kept = true;
    } catch {
      /* pas d'instantané valide */
    }
    const reason = error instanceof Error ? error.message.split('\n')[0] : String(error);
    if (!kept) {
      console.error(`✗ ${file} : échec de la récupération et aucun instantané valide (${reason})`);
      process.exit(1);
    }
    warn(`${file} non mis à jour, instantané conservé (${reason})`);
    return null;
  }
}

/** Jeton GitHub : variable d'environnement en CI, sinon `gh auth token` en local. */
export function githubToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN;
  try {
    return execFileSync('gh', ['auth', 'token'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return undefined;
  }
}

export async function fetchWithTimeout(url, init = {}, ms = 20_000) {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(ms) });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} — ${url}`);
  return response;
}
