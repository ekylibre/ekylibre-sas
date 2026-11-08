// svgo pour le kit isométrique (scripts/kit/extract.py) : précision réduite, viewBox conservé,
// aucun attribut style (CSP) — les styles deviennent des attributs de présentation.
export default {
  multipass: true,
  floatPrecision: 1,
  plugins: [
    {
      name: 'preset-default',
      params: { overrides: { inlineStyles: { onlyMatchedOnce: false } } },
    },
    'convertStyleToAttrs',
    'removeDimensions',
  ],
};
