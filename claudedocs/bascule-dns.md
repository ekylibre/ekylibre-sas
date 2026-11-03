# Bascule DNS — ekylibre.com vers GitHub Pages (F5, lundi 2026-11-09 au soir)

Prérequis (go / no-go 18 h, CK-5) :
- [ ] `LAUNCH=1 node scripts/check-content.mjs` passe (mentions légales, CGU, Brevo, GA4 renseignés).
- [ ] Tests (`npm test`) et Lighthouse verts sur la recette `https://ekylibre.org/ekylibre-sas/`.
- [ ] TTL des enregistrements `ekylibre.com` et `www.ekylibre.com` abaissé à 300 s depuis au moins 24 h.
- [ ] Domaine `ekylibre.com` **vérifié** dans l'organisation GitHub : *Organization settings → Pages → Add a domain* (enregistrement TXT `_github-pages-challenge-ekylibre.ekylibre.com`). Protège contre le détournement de domaine.

## 1. DNS (chez le registrar / hébergeur DNS)

Remplacer les enregistrements actuels de l'apex et de `www` :

| Nom | Type | Valeur |
|---|---|---|
| `ekylibre.com.` | A | `185.199.108.153` |
| `ekylibre.com.` | A | `185.199.109.153` |
| `ekylibre.com.` | A | `185.199.110.153` |
| `ekylibre.com.` | A | `185.199.111.153` |
| `ekylibre.com.` | AAAA | `2606:50c0:8000::153` |
| `ekylibre.com.` | AAAA | `2606:50c0:8001::153` |
| `ekylibre.com.` | AAAA | `2606:50c0:8002::153` |
| `ekylibre.com.` | AAAA | `2606:50c0:8003::153` |
| `www.ekylibre.com.` | CNAME | `ekylibre.github.io.` |

Supprimer tout autre A/AAAA/ALIAS de l'apex. Ne pas toucher aux enregistrements MX, SPF, DKIM (messagerie, Brevo) ni aux autres sous-domaines (`demo`, etc.).

Contrôle : `dig +short ekylibre.com A`, `dig +short ekylibre.com AAAA`, `dig +short www.ekylibre.com CNAME`.

## 2. Domaine personnalisé du dépôt

Une fois le DNS propagé :

```bash
gh api -X PUT repos/ekylibre/ekylibre-sas/pages -f cname=ekylibre.com
gh workflow run deploy.yml --repo ekylibre/ekylibre-sas   # rebuild : SITE_URL=https://ekylibre.com, base « / »
```

`actions/configure-pages` fournit alors automatiquement l'origine `https://ekylibre.com` et la base `/` :
les liens, les URL canoniques et le sitemap basculent, et la balise `noindex` disparaît (le site n'est
indexable que sur `ekylibre.com`). Le site de l'organisation (`ekylibre.org`) n'est pas affecté.

## 3. HTTPS

Attendre l'émission du certificat (de quelques minutes à 1 h), puis :

```bash
gh api -X PUT repos/ekylibre/ekylibre-sas/pages -F https_enforced=true
```

## 4. Vérification (F6)

```bash
node scripts/verify-production.mjs https://ekylibre.com
```

Contrôle : HTTPS, redirection `www` → apex, pages FR/EN, absence de `noindex`, `robots.txt`,
sitemap, 129 anciennes URL, image de partage, CSP.

## 5. Après la mise en ligne (F7, F8)

- Google Search Console : propriété de domaine `ekylibre.com`, envoi de `https://ekylibre.com/sitemap-index.xml`.
- Surveiller pendant 7 jours : erreurs 404 (Search Console), réception des formulaires Brevo, GA4 temps réel.

## Retour arrière

L'ancien site n'existe plus : pas de retour arrière possible vers WordPress. En cas de problème grave,
retirer le domaine personnalisé (`gh api -X PUT repos/ekylibre/ekylibre-sas/pages -F cname=`) :
le site reste servi en recette sous `ekylibre.org/ekylibre-sas/`.
