// Lecture des intégrations externes (src/data/integrations.yaml), au build uniquement.
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import type { Locale } from '~/i18n/routes';

export type FormKind = 'demo' | 'projet' | 'newsletter';

interface Integrations {
  ga4: string;
  brevo: Record<FormKind, Record<Locale, string>>;
}

const raw = parse(readFileSync('src/data/integrations.yaml', 'utf8')) as Partial<Integrations>;

/** Identifiant GA4 valide, ou null (analytics et bandeau de consentement désactivés). */
export const GA4_ID: string | null = /^G-[A-Z0-9]{4,}$/.test(raw.ga4 ?? '') ? raw.ga4! : null;

/** URL d'envoi d'un formulaire Brevo, ou null s'il n'est pas encore configuré. */
export function brevoAction(kind: FormKind, lang: Locale): string | null {
  const url = raw.brevo?.[kind]?.[lang] ?? '';
  return /^https:\/\/[a-z0-9-]+\.sibforms\.com\//.test(url) ? url : null;
}
